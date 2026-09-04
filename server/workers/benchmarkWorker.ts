import { jobStore, BenchmarkJob } from '../utils/jobStore';
import { historyStore } from '../utils/historyStore';
import { runBenchmark } from '../benchmark/engine';

const MAX_CONCURRENT = 2;
let running = 0;
let processing = false;
let interval: NodeJS.Timeout | null = null;
const progressListeners = new Map<string, Set<(data: any) => void>>();

function notifyListeners(jobId: string, data: any) {
  const listeners = progressListeners.get(jobId);
  if (listeners) {
    listeners.forEach((fn) => fn(data));
  }
}

async function processJob(job: BenchmarkJob) {
  running++;
  jobStore.update(job.id, { status: 'running', stage: 'starting', progress: 0 });

  try {
    const result = await runBenchmark(
      { url: job.url, device: (job.device || 'desktop') as any, connection: job.connection || '4g' },
      (stage, progress) => {
        jobStore.update(job.id, { stage, progress });
        notifyListeners(job.id, { stage, progress, jobId: job.id });
      }
    );

    const updated = jobStore.update(job.id, {
      status: 'completed',
      progress: 100,
      stage: 'complete',
      result,
    });

    if (updated) {
      historyStore.save({
        url: job.url,
        device: job.device || 'desktop',
        connection: job.connection || '4g',
        result,
      });
    }

    notifyListeners(job.id, { status: 'completed', progress: 100, stage: 'complete', jobId: job.id });
  } catch (error: any) {
    jobStore.update(job.id, {
      status: 'failed',
      error: error.message || 'Unknown error',
      stage: 'failed',
    });
    notifyListeners(job.id, { status: 'failed', error: error.message, jobId: job.id });
  } finally {
    running--;
  }
}

async function processQueue() {
  if (processing || running >= MAX_CONCURRENT) return;
  processing = true;

  const pending = jobStore.getByStatus('pending');
  if (pending.length === 0) {
    processing = false;
    return;
  }

  const job = pending[0];
  processing = false;
  await processJob(job);
  processQueue();
}

function start() {
  if (interval) return;
  interval = setInterval(processQueue, 1000);
  processQueue();
}

function stop() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}

function addProgressListener(jobId: string, fn: (data: any) => void) {
  if (!progressListeners.has(jobId)) {
    progressListeners.set(jobId, new Set());
  }
  progressListeners.get(jobId)!.add(fn);
}

function removeProgressListener(jobId: string, fn: (data: any) => void) {
  const listeners = progressListeners.get(jobId);
  if (listeners) {
    listeners.delete(fn);
    if (listeners.size === 0) {
      progressListeners.delete(jobId);
    }
  }
}

export const benchmarkWorker = { start, stop, addProgressListener, removeProgressListener };
