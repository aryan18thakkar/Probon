import express from 'express';
import cors from 'cors';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizeInput } from './middleware/sanitize.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use(sanitizeInput);
app.use(apiRateLimiter);

// Main API routes
app.use('/api', apiRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Central Error Handler
app.use(errorHandler);
