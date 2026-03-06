import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes/index';
import { logger } from './utils/logger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
  });
  next();
});

// API routes
app.use('/api', apiRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
