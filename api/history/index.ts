import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    console.warn(
      '[Vercel] History GET: No persistent storage available. Returning empty array. ' +
      'Use a database (e.g. Vercel KV, Postgres, or Turso) for persistent history.'
    );
    return res.status(200).json([]);
  }

  if (req.method === 'DELETE') {
    console.warn(
      '[Vercel] History DELETE: No persistent storage available. Nothing to clear. ' +
      'Use a database for persistent history.'
    );
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
