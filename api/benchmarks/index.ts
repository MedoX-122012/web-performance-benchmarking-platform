import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    if (!['http:', 'https:'].includes(new URL(url).protocol)) {
      return res.status(400).json({ error: 'Only HTTP and HTTPS protocols are allowed' });
    }

    return res.status(501).json({
      error: 'Real benchmarking requires a Playwright-capable server.',
      message: 'Vercel serverless functions cannot run Playwright. To run real benchmarks, use a self-hosted backend with "npm run dev:full" locally.',
      hint: 'For Vercel deployments, the frontend falls back to localStorage-based history.',
    });
  }

  if (req.method === 'GET') {
    return res.status(501).json({
      error: 'Job listing is not available on Vercel.',
      message: 'In-memory job storage is not supported in serverless environments. Run locally with "npm run dev:full".',
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
