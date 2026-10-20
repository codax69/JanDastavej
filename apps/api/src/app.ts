import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { templatesRouter } from './modules/templates/templates.router.js';

export const app = express();

app.use(requestIdMiddleware);

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url === '/api/v1/health',
    },
    customProps: (req) => ({
      requestId: (req as any).requestId,
    }),
  })
);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  },
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'JanDastavej API',
    timestamp: new Date().toISOString(),
  });
});

// Template routes
app.use('/api/v1/templates', templatesRouter);

// Standard error handler
app.use(errorHandler);

export default app;
