import { Request, Response, NextFunction } from 'express';
import { JanDastavejError } from '@jandastavej/shared';
import { CitizenUserModel, ICitizenUser } from '../../models/CitizenUser.js';

export interface AuthenticatedCitizenRequest extends Request {
  citizen?: ICitizenUser;
}

export async function requireCitizenAuth(
  req: AuthenticatedCitizenRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = req.cookies?.jd_citizen_session;
    if (!sessionToken) {
      throw new JanDastavejError('UNAUTHORIZED', 'Please sign in to upload or access your personal documents.', 401);
    }

    let payload: any;
    try {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch {
      throw new JanDastavejError('UNAUTHORIZED', 'Invalid citizen session token.', 401);
    }

    if (!payload?.userId) {
      throw new JanDastavejError('UNAUTHORIZED', 'Invalid citizen session payload.', 401);
    }

    const citizen = await CitizenUserModel.findById(payload.userId);
    if (!citizen) {
      throw new JanDastavejError('UNAUTHORIZED', 'Citizen account not found.', 401);
    }

    req.citizen = citizen;
    next();
  } catch (err) {
    next(err);
  }
}

export async function optionalCitizenAuth(
  req: AuthenticatedCitizenRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = req.cookies?.jd_citizen_session;
    if (sessionToken) {
      try {
        const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
        const payload = JSON.parse(decoded);
        if (payload?.userId) {
          const citizen = await CitizenUserModel.findById(payload.userId);
          if (citizen) {
            req.citizen = citizen;
          }
        }
      } catch {
        // ignore invalid token in optional auth
      }
    }
    next();
  } catch {
    next();
  }
}
