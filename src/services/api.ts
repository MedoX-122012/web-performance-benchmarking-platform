import type {
  BenchmarkResult,
  DeviceType,
  ConnectionProfile,
} from '@types/index';

const CACHE_PREFIX = 'wbp-cache-';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(url: string, device: DeviceType): string {
  return `${CACHE_PREFIX}${url}:${device}`;
}

function getCachedResult(url: string, device: DeviceType): BenchmarkResult | null {
  try {
    const raw = localStorage.getItem(getCacheKey(url, device));
    if (!raw) return null;
    const cached = JSON.parse(raw) as { result: BenchmarkResult; timestamp: number };
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(getCacheKey(url, device));
      return null;
    }
    return cached.result;
  } catch {
    return null;
  }
}

function setCachedResult(url: string, device: DeviceType, result: BenchmarkResult): void {
  try {
    localStorage.setItem(getCacheKey(url, device), JSON.stringify({ result, timestamp: Date.now() }));
  } catch {
    // quota exceeded - ignore
  }
}

let isRunning = false;
const cooldownUntilKey = 'wbp-cooldown-until';

export function getCooldownUntil(): number {
  try {
    const val = localStorage.getItem(cooldownUntilKey);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function setCooldownUntil(time: number): void {
  try {
    localStorage.setItem(cooldownUntilKey, String(time));
  } catch {
    // ignore
  }
}

export function getRemainingCooldown(): number {
  const until = getCooldownUntil();
  if (!until) return 0;
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export async function runBenchmark(
  url: string,
  device: DeviceType,
  _connection: ConnectionProfile,
): Promise<BenchmarkResult> {
  // Check cooldown
  const remaining = getRemainingCooldown();
  if (remaining > 0) {
    throw new Error(`Rate limited. Please wait ${remaining} seconds before trying again.`);
  }

  // Check cache
  const cached = getCachedResult(url, device);
  if (cached) {
    return cached;
  }

  // Queue: only 1 concurrent request
  if (isRunning) {
    throw new Error('A benchmark is already in progress. Please wait for it to complete.');
  }

  isRunning = true;

  try {
    const res = await fetch('/api/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, device }),
    });

    if (!res.ok) {
      let errorMsg = `Request failed (${res.status})`;
      let retryAfter = 0;

      try {
        const body = await res.json();
        errorMsg = body.message || body.error || errorMsg;

        if (res.status === 429) {
          // Rate limit: 5 minutes cooldown
          retryAfter = 300;
          setCooldownUntil(Date.now() + retryAfter * 1000);
          errorMsg = `Rate limited by Google. Waiting ${retryAfter / 60} minutes before you can try again.`;
        } else if (res.status === 500) {
          // Google internal error: 60 seconds cooldown
          retryAfter = 60;
          setCooldownUntil(Date.now() + retryAfter * 1000);
          errorMsg = `Google temporarily unavailable. Waiting ${retryAfter} seconds before you can try again.`;
        }
      } catch {
        const body = await res.text().catch(() => '');
        if (body) errorMsg = body;
      }

      throw new Error(errorMsg);
    }

    const result = await res.json() as BenchmarkResult;

    // Cache the result
    setCachedResult(url, device, result);

    return result;
  } finally {
    isRunning = false;
  }
}
