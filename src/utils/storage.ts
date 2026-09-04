import type { BenchmarkResult, HistoryEntry } from '@types/index';

const STORAGE_KEY = 'wbp-history';
const MAX_ENTRIES = 100;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readAll(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: HistoryEntry[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded - trim and retry once
    const trimmed = entries.slice(0, Math.floor(MAX_ENTRIES / 2));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // give up
    }
  }
}

export function saveToHistory(result: BenchmarkResult): HistoryEntry {
  const entry: HistoryEntry = {
    id: result.id,
    url: result.url,
    hostname: result.hostname,
    timestamp: result.timestamp,
    device: result.device,
    connection: result.connection,
    performanceScore: result.scores.performance,
    lcp: result.coreWebVitals.lcp.value,
    inp: result.coreWebVitals.inp.value,
    cls: result.coreWebVitals.cls.value,
    pageSize: result.resourceBreakdown.totalTransferSize,
    requests: result.resourceBreakdown.totalRequests,
  };

  const entries = readAll();
  entries.unshift(entry);

  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  writeAll(entries);

  try {
    if (isBrowser()) {
      localStorage.setItem(`wbp-result-${result.id}`, JSON.stringify(result));
    }
  } catch {
    // ignore quota errors
  }

  return entry;
}

export function getHistory(): HistoryEntry[] {
  return readAll();
}

export function getHistoryById(id: string): HistoryEntry | null {
  return readAll().find((e) => e.id === id) ?? null;
}

export function deleteHistoryEntry(id: string): boolean {
  const entries = readAll();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  entries.splice(idx, 1);
  writeAll(entries);
  return true;
}

export function clearAllHistory(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getHistoryForUrl(url: string): HistoryEntry[] {
  return readAll().filter((e) => e.url === url);
}

export function getFullResult(id: string): BenchmarkResult | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(`wbp-result-${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as BenchmarkResult;
  } catch {
    return null;
  }
}
