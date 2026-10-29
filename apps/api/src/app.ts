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

// Disable ETag generation to prevent 304 Not Modified on API routes
app.set('etag', false);

app.use(requestIdMiddleware);

// Force fresh responses on all API endpoints
app.use('/api/', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => {
        const path = (req as any).originalUrl || req.url;
        return path === '/api/v1/health' || path.startsWith('/api/v1/health');
      },
    },
    customProps: (req) => ({
      requestId: (req as any).requestId,
    }),
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${(req as any).originalUrl || req.url} -> ${res.statusCode} (${Math.round(responseTime)}ms)`,
    customErrorMessage: (req, res, err) =>
      `${req.method} ${(req as any).originalUrl || req.url} -> ${res.statusCode} (${err.message})`,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: (req as any).originalUrl || req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

app.use(helmet());
const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    ...configuredOrigins,
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
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
