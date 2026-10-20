import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.length > 0 ? incomingId : randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
