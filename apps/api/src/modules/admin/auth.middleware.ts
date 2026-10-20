import { Request, Response, NextFunction } from 'express';
import { JanDastavejError } from '@jandastavej/shared';
import { UserModel, IUser } from '../../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionCookie = req.cookies?.jd_admin_session;
    if (!sessionCookie) {
      throw new JanDastavejError('UNAUTHORIZED', 'Authentication required to access admin resources.', 401);
    }

    // In this reference implementation, sessionCookie is signed or contains the user ID
    let userId: string;
    try {
      const decoded = Buffer.from(sessionCookie, 'base64').toString('utf8');
      const data = JSON.parse(decoded);
      userId = data.userId;
    } catch {
      throw new JanDastavejError('UNAUTHORIZED', 'Invalid session credentials. Please sign in again.', 401);
    }

    const user = await UserModel.findById(userId);
    if (!user || user.status !== 'active') {
      throw new JanDastavejError('UNAUTHORIZED', 'Account is invalid or deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(allowedRoles: Array<'admin' | 'template_admin' | 'approver' | 'staff'>) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new JanDastavejError('UNAUTHORIZED', 'Authentication required.', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new JanDastavejError(
          'FORBIDDEN',
          `Access denied. Role '${req.user.role}' lacks permission for this action.`,
          403
        )
      );
      return;
    }

    next();
  };
}
