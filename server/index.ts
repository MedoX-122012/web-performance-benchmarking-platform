import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { benchmarkRouter } from './routes/benchmarkRoutes';
import { historyRouter } from './routes/historyRoutes';
import { benchmarkWorker } from './workers/benchmarkWorker';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/benchmarks', benchmarkRouter);
app.use('/api/history', historyRouter);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  benchmarkWorker.start();
});

const shutdown = () => {
  console.log('Shutting down...');
  benchmarkWorker.stop();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
