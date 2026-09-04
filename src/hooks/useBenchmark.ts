import { useCallback, useState, useRef, useEffect } from 'react';
import { runBenchmark, getRemainingCooldown } from '@/services/api';
import type { BenchmarkResult, DeviceType, ConnectionProfile } from '@types/index';

export type JobPhase = 'idle' | 'submitting' | 'running' | 'completed' | 'failed' | 'cancelled';

interface BenchmarkState {
  phase: JobPhase;
  progress: number;
  stage: string;
  result: BenchmarkResult | null;
  error: string | null;
  cooldown: number;
}

const initialState: BenchmarkState = {
  phase: 'idle',
  progress: 0,
  stage: '',
  result: null,
  error: null,
  cooldown: 0,
};

export function useStartBenchmark() {
  const [state, setState] = useState<BenchmarkState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    setState(initialState);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    setState((prev) => ({
      ...prev,
      phase: 'cancelled',
      error: 'Cancelled by user',
      cooldown: 0,
    }));
  }, []);

  const startBenchmark = useCallback(
    (url: string, device: DeviceType, _connection: ConnectionProfile) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const remaining = getRemainingCooldown();
      if (remaining > 0) {
        setState({
          ...initialState,
          phase: 'failed',
          error: `Rate limited. Please wait ${remaining} seconds before trying again.`,
          cooldown: remaining,
        });

        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
        cooldownIntervalRef.current = setInterval(() => {
          const newRemaining = getRemainingCooldown();
          if (newRemaining <= 0) {
            clearInterval(cooldownIntervalRef.current!);
            cooldownIntervalRef.current = null;
            setState((prev) => ({ ...prev, cooldown: 0 }));
          } else {
            setState((prev) => ({ ...prev, cooldown: newRemaining }));
          }
        }, 1000);

        return;
      }

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

      runBenchmark(url, device, _connection)
        .then((result) => {
          clearInterval(interval);
          if (!controller.signal.aborted) {
            setState({ phase: 'completed', progress: 100, stage: 'Complete', result, error: null, cooldown: 0 });
          }
        })
        .catch((err) => {
          clearInterval(interval);
          if (!controller.signal.aborted) {
            const msg = err.message || 'Benchmark failed';
            const is429 = msg.includes('Rate limited') || msg.includes('rate limit');
            const newCooldown = is429 ? getRemainingCooldown() : 0;

            setState({ phase: 'failed', progress: 0, stage: '', result: null, error: msg, cooldown: newCooldown });

            if (newCooldown > 0) {
              if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
              cooldownIntervalRef.current = setInterval(() => {
                const rem = getRemainingCooldown();
                if (rem <= 0) {
                  clearInterval(cooldownIntervalRef.current!);
                  cooldownIntervalRef.current = null;
                  setState((prev) => ({ ...prev, cooldown: 0 }));
                } else {
                  setState((prev) => ({ ...prev, cooldown: rem }));
                }
              }, 1000);
            }
          }
        });
    },
    [],
  );

  return { ...state, startBenchmark, reset, cancel };
}
