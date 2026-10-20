import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import {
  JanDastavejError,
  OtpRequestSchema,
  OtpVerifySchema,
} from '@jandastavej/shared';
import { CitizenUserModel } from '../../models/CitizenUser.js';
import {
  requireCitizenAuth,
  optionalCitizenAuth,
  AuthenticatedCitizenRequest,
} from './citizenAuth.middleware.js';
import { AuditEventModel } from '../../models/AuditEvent.js';

export const citizenAuthRouter = Router();

// Rate limiter for OTP requests: max 15 requests per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many OTP requests. Please try again after 15 minutes.',
    },
  },
});

// POST /api/v1/auth/otp/request
citizenAuthRouter.post('/otp/request', otpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = OtpRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Please enter a valid email or 10-digit mobile number.', 400);
    }

    const { identifier } = parseResult.data;
    const cleanId = identifier.toLowerCase().trim();
    const isEmail = cleanId.includes('@');
    const identifierType = isEmail ? 'email' : 'phone';

    // Demo OTP is always '123456' for predictable demo & test workflows
    const demoOtp = '123456';
    const otpHash = crypto.createHash('sha256').update(demoOtp).digest('hex');
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user = await CitizenUserModel.findOne({ identifier: cleanId });
    if (!user) {
      user = await CitizenUserModel.create({
        identifier: cleanId,
        identifierType,
        otpHash,
        otpExpiresAt,
      });
    } else {
      user.otpHash = otpHash;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
    }

    res.json({
      data: {
        message: 'OTP sent successfully. For prototype demo, use OTP: 123456',
        identifier: cleanId,
        demoOtp: '123456',
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/otp/verify
citizenAuthRouter.post('/otp/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = OtpVerifySchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Please enter a valid 6-digit OTP.', 400);
    }

    const { identifier, otp } = parseResult.data;
    const cleanId = identifier.toLowerCase().trim();

    const user = await CitizenUserModel.findOne({ identifier: cleanId });
    if (!user) {
      throw new JanDastavejError('UNAUTHORIZED', 'Account not found. Please request an OTP first.', 401);
    }

    // Verify OTP
    const inputHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const isMasterDemoOtp = otp.trim() === '123456';

    if (inputHash !== user.otpHash && !isMasterDemoOtp) {
      throw new JanDastavejError('UNAUTHORIZED', 'Invalid OTP. Please check and try again.', 401);
    }

    if (user.otpExpiresAt && user.otpExpiresAt.getTime() < Date.now()) {
      throw new JanDastavejError('UNAUTHORIZED', 'OTP has expired. Please request a new one.', 401);
    }

    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Create session cookie token
    const sessionPayload = JSON.stringify({ userId: String(user._id), identifier: user.identifier, time: Date.now() });
    const sessionToken = Buffer.from(sessionPayload).toString('base64');

    res.cookie('jd_citizen_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    await AuditEventModel.create({
      actorUserId: user._id,
      actorEmail: user.identifier,
      action: 'ADMIN_LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: String(user._id),
      timestamp: new Date(),
    });

    res.json({
      data: {
        user: {
          id: user._id,
          identifier: user.identifier,
          identifierType: user.identifierType,
          name: user.name || user.identifier.split('@')[0],
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
citizenAuthRouter.get('/me', optionalCitizenAuth, async (req: AuthenticatedCitizenRequest, res: Response) => {
  if (!req.citizen) {
    res.json({ data: { user: null } });
    return;
  }

  res.json({
    data: {
      user: {
        id: req.citizen._id,
        identifier: req.citizen.identifier,
        identifierType: req.citizen.identifierType,
        name: req.citizen.name || req.citizen.identifier.split('@')[0],
      },
    },
  });
});

// POST /api/v1/auth/logout
citizenAuthRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('jd_citizen_session', { path: '/' });
    res.json({ status: 'ok', message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});
