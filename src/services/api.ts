import type {
  BenchmarkResult,
  DeviceType,
  ConnectionProfile,
} from '@types/index';

export async function runBenchmark(
  url: string,
  device: DeviceType,
  _connection: ConnectionProfile,
): Promise<BenchmarkResult> {
  const res = await fetch('/api/benchmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, device }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Benchmark failed (${res.status}): ${body || res.statusText}`);
  }

  return res.json() as Promise<BenchmarkResult>;
}
