import { Request, Response, NextFunction } from 'express';
import { JanDastavejError } from '@jandastavej/shared';
import { CitizenUserModel, ICitizenUser } from '../../models/CitizenUser.js';
import { verifySessionToken } from '../../utils/sessionToken.js';

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

    const payload = verifySessionToken(sessionToken);
    if (!payload?.userId) {
      throw new JanDastavejError('UNAUTHORIZED', 'Invalid or expired citizen session token.', 401);
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
      const payload = verifySessionToken(sessionToken);
      if (payload?.userId) {
        const citizen = await CitizenUserModel.findById(payload.userId);
        if (citizen) {
          req.citizen = citizen;
        }
      }
    }
    next();
  } catch {
    next();
  }
}
