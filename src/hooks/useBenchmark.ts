import { useCallback, useRef, useState } from 'react';
import { fetchBenchmark, getJobStatus, subscribeToProgress } from '@/services/api';
import type {
  BenchmarkResult,
  DeviceType,
  ConnectionProfile,
} from '@types/index';

export type JobPhase = 'idle' | 'submitting' | 'running' | 'completed' | 'failed' | 'cancelled';

interface BenchmarkState {
  phase: JobPhase;
  jobId: string | null;
  progress: number;
  stage: string;
  result: BenchmarkResult | null;
  error: string | null;
}

const initialState: BenchmarkState = {
  phase: 'idle',
  jobId: null,
  progress: 0,
  stage: '',
  result: null,
  error: null,
};

export function useStartBenchmark() {
  const [state, setState] = useState<BenchmarkState>(initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setState(initialState);
  }, [cleanup]);

  const cancel = useCallback(() => {
    cleanup();
    setState((prev) => ({
      ...prev,
      phase: 'cancelled',
      error: 'Cancelled by user',
    }));
  }, [cleanup]);

  const startBenchmark = useCallback(
    (
      url: string,
      device: DeviceType,
      connection: ConnectionProfile,
    ) => {
      cleanup();
      setState({ ...initialState, phase: 'submitting' });

      fetchBenchmark(url, device, connection)
        .then(({ jobId }) => {
          setState((prev) => ({
            ...prev,
            phase: 'running',
            jobId,
            progress: 10,
            stage: 'Benchmark started',
          }));

          // Subscribe to progress events
          const es = subscribeToProgress(jobId, (event) => {
            try {
              const data = JSON.parse(event.data);
              setState((prev) => ({
                ...prev,
                progress: data.progress || prev.progress,
                stage: data.stage || prev.stage,
              }));

              if (data.progress >= 100) {
                es.close();
                eventSourceRef.current = null;
              }
            } catch {
              // Ignore parse errors
            }
          });
          eventSourceRef.current = es;

          // Poll for job status
          intervalRef.current = setInterval(async () => {
            try {
              const job = await getJobStatus(jobId);

              if (job.status === 'completed' && job.result) {
                cleanup();
                setState({
                  phase: 'completed',
                  jobId,
                  progress: 100,
                  stage: 'Complete',
                  result: job.result,
                  error: null,
                });
              } else if (job.status === 'failed') {
                cleanup();
                setState({
                  phase: 'failed',
                  jobId,
                  progress: 0,
                  stage: '',
                  result: null,
                  error: job.error || 'Benchmark failed',
                });
              } else {
                // Update progress from polling
                setState((prev) => ({
                  ...prev,
                  progress: job.progress || prev.progress,
                  stage: job.stage || prev.stage,
                }));
              }
            } catch (err) {
              // Don't fail immediately on poll errors, keep trying
            }
          }, 2000);
        })
        .catch((err) => {
          cleanup();
          setState({
            phase: 'failed',
            jobId: null,
            progress: 0,
            stage: '',
            result: null,
            error: err.message || 'Failed to start benchmark',
          });
        });
    },
    [cleanup],
  );

  return {
    ...state,
    startBenchmark,
    reset,
    cancel,
  };
}