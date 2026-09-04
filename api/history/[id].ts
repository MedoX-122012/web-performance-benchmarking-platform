import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid entry ID' });
  }

  if (req.method === 'GET') {
    console.warn(
      `[Vercel] History GET /${id}: No persistent storage available. Returning 404. ` +
      'Use a database for persistent history.'
    );
    return res.status(404).json({ error: 'History entry not found' });
  }

  if (req.method === 'DELETE') {
    console.warn(
      `[Vercel] History DELETE /${id}: No persistent storage available. Nothing to delete. ` +
      'Use a database for persistent history.'
    );
    return res.status(404).json({ error: 'History entry not found' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
