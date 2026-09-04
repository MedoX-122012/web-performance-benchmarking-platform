import { Request, Response } from 'express';
import { validateUrl } from '../security/urlValidator';
import { jobStore } from '../utils/jobStore';
import { benchmarkWorker } from '../workers/benchmarkWorker';

export async function startBenchmark(req: Request, res: Response) {
  const { url, device = 'desktop', connection = 'wifi' } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  const validation = await validateUrl(url);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const job = jobStore.create(url);
  jobStore.update(job.id, { device, connection });

  res.status(201).json({ jobId: job.id, status: job.status });
}

export function getJobStatus(req: Request, res: Response) {
  const job = jobStore.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  res.json(job);
}

export function cancelJob(req: Request, res: Response) {
  const job = jobStore.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  if (job.status !== 'pending' && job.status !== 'running') {
    res.status(400).json({ error: 'Job cannot be cancelled' });
    return;
  }
  jobStore.update(job.id, { status: 'cancelled', stage: 'cancelled' });
  res.json({ success: true });
}

export function streamJobProgress(req: Request, res: Response) {
  const job = jobStore.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ stage: job.stage, progress: job.progress, status: job.status })}\n\n`);

  if (job.status === 'completed' || job.status === 'failed') {
    res.end();
    return;
  }

  const listener = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.status === 'completed' || data.status === 'failed') {
      res.end();
    }
  };

  benchmarkWorker.addProgressListener(req.params.id, listener);

  req.on('close', () => {
    benchmarkWorker.removeProgressListener(req.params.id, listener);
  });
}
