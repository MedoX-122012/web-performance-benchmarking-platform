import { Router } from 'express';
import { rateLimiter } from '../security/rateLimiter';
import {
  startBenchmark,
  getJobStatus,
  cancelJob,
  streamJobProgress,
} from '../controllers/benchmarkController';

const router = Router();

router.use(rateLimiter);

router.post('/', startBenchmark);
router.get('/:id', getJobStatus);
router.post('/:id/cancel', cancelJob);
router.get('/:id/stream', streamJobProgress);

export { router as benchmarkRouter };
