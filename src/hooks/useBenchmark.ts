import { useCallback, useState } from 'react';
import { runBenchmark } from '@/services/api';
import type { BenchmarkResult, DeviceType, ConnectionProfile } from '@types/index';

export type JobPhase = 'idle' | 'submitting' | 'running' | 'completed' | 'failed' | 'cancelled';

interface BenchmarkState {
  phase: JobPhase;
  progress: number;
  stage: string;
  result: BenchmarkResult | null;
  error: string | null;
}

const initialState: BenchmarkState = {
  phase: 'idle',
  progress: 0,
  stage: '',
  result: null,
  error: null,
};

export function useStartBenchmark() {
  const [state, setState] = useState<BenchmarkState>(initialState);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const reset = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setState(initialState);
  }, [abortController]);

  const cancel = useCallback(() => {
    abortController?.abort();
    setAbortController(null);
    setState((prev) => ({
      ...prev,
      phase: 'cancelled',
      error: 'Cancelled by user',
    }));
  }, [abortController]);

  const startBenchmark = useCallback(
    (url: string, device: DeviceType, connection: ConnectionProfile) => {
      abortController?.abort();
      const controller = new AbortController();
      setAbortController(controller);

      setState({ ...initialState, phase: 'submitting', progress: 5, stage: 'Connecting to PageSpeed Insights...' });

      const stages = [
        { progress: 10, stage: 'Sending URL to Google Lighthouse...' },
        { progress: 20, stage: 'Loading page in headless browser...' },
        { progress: 35, stage: 'Collecting performance metrics...' },
        { progress: 50, stage: 'Running accessibility audits...' },
        { progress: 65, stage: 'Analyzing SEO & best practices...' },
        { progress: 80, stage: 'Processing network data...' },
        { progress: 90, stage: 'Generating report...' },
      ];

      let stageIdx = 0;
      const interval = setInterval(() => {
        if (controller.signal.aborted) { clearInterval(interval); return; }
        if (stageIdx < stages.length) {
          setState((prev) => ({ ...prev, ...stages[stageIdx] }));
          stageIdx++;
        }
      }, 5000);

      runBenchmark(url, device, connection)
        .then((result) => {
          clearInterval(interval);
          if (!controller.signal.aborted) {
            setState({ phase: 'completed', progress: 100, stage: 'Complete', result, error: null });
          }
        })
        .catch((err) => {
          clearInterval(interval);
          if (!controller.signal.aborted) {
            setState({ phase: 'failed', progress: 0, stage: '', result: null, error: err.message || 'Benchmark failed' });
          }
        });
    },
    [abortController],
  );

  return { ...state, startBenchmark, reset, cancel };
}
