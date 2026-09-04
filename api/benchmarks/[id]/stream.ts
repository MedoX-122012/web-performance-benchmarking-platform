import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    return res.status(501).json({
      error: 'Job progress streaming is not available on Vercel.',
      message: 'SSE streaming and in-memory job storage are not supported in serverless environments. Run locally with "npm run dev:full".',
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
