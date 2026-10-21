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
import { servicesRouter } from './modules/services/services.router.js';
import { generationsRouter } from './modules/generations/generations.router.js';
import { adminRouter } from './modules/admin/admin.router.js';
import { submissionsRouter } from './modules/submissions/submissions.router.js';
import { citizenAuthRouter } from './modules/auth/citizenAuth.router.js';
import { meRouter } from './modules/me/me.router.js';

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
app.use(express.json({ limit: '15mb' }));

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

// Redirect browser accesses to /admin to the web frontend SPA
app.get(['/admin', '/admin/*'], (_req: Request, res: Response) => {
  res.redirect('http://localhost:5173/admin/login');
});

// Public routers
app.use('/api/v1/templates', templatesRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/generations', generationsRouter);
app.use('/api/v1/submissions', submissionsRouter);
app.use('/api/v1/auth', citizenAuthRouter);
app.use('/api/v1/me', meRouter);

// Admin router (role checked server-side)
app.use('/api/v1/admin', adminRouter);

// Standard error handler
app.use(errorHandler);

export default app;
