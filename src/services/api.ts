import type {
  BenchmarkResult,
  BenchmarkJob,
  DeviceType,
  ConnectionProfile,
  HistoryEntry,
} from '@types/index';

function getBaseUrl(): string {
  if (typeof window === 'undefined') return '';
  if (window.location.port === '5173') return 'http://localhost:3001';
  return '';
}

const BASE = getBaseUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${body || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function fetchBenchmark(
  url: string,
  device: DeviceType,
  connection: ConnectionProfile,
  demoMode: boolean,
): Promise<{ jobId: string }> {
  return request('/api/benchmarks', {
    method: 'POST',
    body: JSON.stringify({ url, device, connection, demoMode }),
  });
}

export function getJobStatus(id: string): Promise<BenchmarkJob> {
  return request(`/api/benchmarks/${id}`);
}

export function cancelJob(id: string): Promise<{ success: boolean }> {
  return request(`/api/benchmarks/${id}/cancel`, { method: 'POST' });
}

export function subscribeToProgress(
  id: string,
  callback: (event: MessageEvent) => void,
): EventSource {
  const es = new EventSource(`${BASE}/api/benchmarks/${id}/stream`);
  es.onmessage = callback;
  es.onerror = () => {};
  return es;
}

export function getHistory(): Promise<HistoryEntry[]> {
  return request('/api/history');
}

export function getHistoryById(id: string): Promise<BenchmarkResult> {
  return request(`/api/history/${id}`);
}

export function deleteHistory(id: string): Promise<{ success: boolean }> {
  return request(`/api/history/${id}`, { method: 'DELETE' });
}

export function clearHistory(): Promise<{ success: boolean }> {
  return request('/api/history', { method: 'DELETE' });
}

export function getHistoryByUrl(url: string): Promise<HistoryEntry[]> {
  return request(`/api/history/url/${encodeURIComponent(url)}`);
}
