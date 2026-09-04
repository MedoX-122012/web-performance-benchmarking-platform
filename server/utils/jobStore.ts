import { v4 as uuidv4 } from 'uuid';

export interface BenchmarkJob {
  id: string;
  url: string;
  device?: string;
  connection?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  stage: string;
  createdAt: string;
  updatedAt: string;
  result?: any;
  error?: string;
}

const jobs = new Map<string, BenchmarkJob>();

function cleanupOldJobs() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (new Date(job.createdAt).getTime() < oneHourAgo && job.status !== 'running') {
      jobs.delete(id);
    }
  }
}

setInterval(cleanupOldJobs, 5 * 60 * 1000);

function create(url: string): BenchmarkJob {
  const id = uuidv4();
  const now = new Date().toISOString();
  const job: BenchmarkJob = {
    id,
    url,
    status: 'pending',
    progress: 0,
    stage: 'queued',
    createdAt: now,
    updatedAt: now,
  };
  jobs.set(id, job);
  return job;
}

function get(id: string): BenchmarkJob | undefined {
  return jobs.get(id);
}

function update(id: string, updates: Partial<BenchmarkJob>): BenchmarkJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  const updated = { ...job, ...updates, updatedAt: new Date().toISOString() };
  jobs.set(id, updated);
  return updated;
}

function getByStatus(status: BenchmarkJob['status']): BenchmarkJob[] {
  return Array.from(jobs.values()).filter((j) => j.status === status);
}

function remove(id: string): boolean {
  return jobs.delete(id);
}

export const jobStore = { create, get, update, getByStatus, remove };
