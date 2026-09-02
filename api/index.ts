import express from 'express';
import { apiRouter } from '../server/routes';
import { initializeDatabase } from '../server/db';

const app = express();

// Prevent cold-start crashes if filesystem is read-only
try {
  initializeDatabase();
} catch (err) {
  console.error('Failed to initialize local DB on Vercel runtime:', err);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use('/api', apiRouter);

export default app;