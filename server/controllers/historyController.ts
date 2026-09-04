import { Request, Response } from 'express';
import { historyStore } from '../utils/historyStore';

export function getAllHistory(_req: Request, res: Response) {
  const entries = historyStore.getAll();
  res.json(entries);
}

export function getHistoryById(req: Request, res: Response) {
  const entry = historyStore.getById(req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'History entry not found' });
    return;
  }
  res.json(entry);
}

export function deleteHistoryEntry(req: Request, res: Response) {
  const deleted = historyStore.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'History entry not found' });
    return;
  }
  res.json({ success: true });
}

export function clearHistory(_req: Request, res: Response) {
  historyStore.clear();
  res.json({ success: true });
}

export function getHistoryByUrl(req: Request, res: Response) {
  const url = decodeURIComponent(req.params.url);
  const entries = historyStore.getByUrl(url);
  res.json(entries);
}
