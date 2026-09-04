import { Router } from 'express';
import { rateLimiter } from '../security/rateLimiter';
import {
  getAllHistory,
  getHistoryById,
  deleteHistoryEntry,
  clearHistory,
  getHistoryByUrl,
} from '../controllers/historyController';

const router = Router();

router.use(rateLimiter);

router.get('/', getAllHistory);
router.delete('/', clearHistory);
router.get('/url/:url', getHistoryByUrl);
router.get('/:id', getHistoryById);
router.delete('/:id', deleteHistoryEntry);

export { router as historyRouter };
