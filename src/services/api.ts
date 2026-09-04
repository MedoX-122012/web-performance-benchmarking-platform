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
    let errorMsg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      errorMsg = body.message || body.error || errorMsg;

      if (res.status === 429) {
        errorMsg = body.message || 'Rate limited by Google. Please wait a few minutes and try again. For higher limits, add a GOOGLE_PSI_API_KEY environment variable.';
      }
    } catch {
      const body = await res.text().catch(() => '');
      if (body) errorMsg = body;
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<BenchmarkResult>;
}
