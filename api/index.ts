import express from 'express';
import { apiRouter } from '../server/routes';
import { initializeDatabase } from '../server/db';

const app = express();

// Initialize Database on cold start
initializeDatabase();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;