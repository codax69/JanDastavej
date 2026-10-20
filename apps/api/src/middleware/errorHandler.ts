import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JanDastavejError, ApiErrorResponse } from '@jandastavej/shared';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = (req as any).requestId || 'unknown';

  if (err instanceof JanDastavejError) {
    const response: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        fields: err.fields,
        requestId,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      const fieldPath = issue.path.join('.');
      fields[fieldPath || 'root'] = issue.message;
    }
    const response: ApiErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload. Please check highlighted fields.',
        fields,
        requestId,
      },
    };
    res.status(400).json(response);
    return;
  }

  // Fallback internal error - NEVER expose raw stack in error message
  logger.error({ err, requestId, path: req.path }, 'Unhandled server error');
  const response: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred. Please try again later.',
      requestId,
    },
  };
  res.status(500).json(response);
}
