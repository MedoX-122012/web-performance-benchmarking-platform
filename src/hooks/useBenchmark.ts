import { useCallback, useState } from 'react';
import { generateDemoResult } from '@utils/demoData';
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

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const startBenchmark = useCallback(
    (
      url: string,
      device: DeviceType,
      connection: ConnectionProfile,
      demoMode: boolean,
    ) => {
      setState({ ...initialState, phase: 'submitting' });

      if (demoMode) {
        const result = generateDemoResult(url, device, connection);
        const id = `demo-${Date.now()}`;
        setState({
          phase: 'completed',
          jobId: id,
          progress: 100,
          stage: 'Complete',
          result,
          error: null,
        });
        return;
      }

      setState((prev) => ({
        ...prev,
        phase: 'failed',
        error: 'Live benchmarking requires a backend server. Please enable Demo Mode or run the backend with "npm run dev:full".',
      }));
    },
    [],
  );

  const cancel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phase: 'cancelled',
      error: 'Cancelled by user',
    }));
  }, []);

  return {
    ...state,
    startBenchmark,
    reset,
    cancel,
  };
}
