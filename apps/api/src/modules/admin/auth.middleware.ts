import { Request, Response, NextFunction } from 'express';
import { JanDastavejError } from '@jandastavej/shared';
import { UserModel, IUser } from '../../models/User.js';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function verifyAdminSession(req: Request): Promise<IUser | null> {
  const sessionCookie = req.cookies?.jd_admin_session;
  if (!sessionCookie) return null;

  try {
    const decoded = Buffer.from(sessionCookie, 'base64').toString('utf8');
    const data = JSON.parse(decoded);
    if (!data?.userId) return null;
    const user = await UserModel.findById(data.userId);
    if (!user || user.status !== 'active') return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await verifyAdminSession(req);
    if (!user) {
      throw new JanDastavejError('UNAUTHORIZED', 'Authentication required to access admin resources.', 401);
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
