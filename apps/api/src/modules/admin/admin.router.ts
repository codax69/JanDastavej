import { Router, Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import { Types } from 'mongoose';
import {
  JanDastavejError,
  LoginRequestSchema,
  TemplateVersionSchema,
} from '@jandastavej/shared';
import { UserModel } from '../../models/User.js';
import { TemplateModel, ITemplate } from '../../models/Template.js';
import { TemplateVersionModel, ITemplateVersion } from '../../models/TemplateVersion.js';
import { AuditEventModel } from '../../models/AuditEvent.js';
import { requireAuth, requireRole, AuthenticatedRequest } from './auth.middleware.js';

export const adminRouter = Router();

// Rate limiter for admin login: max 10 attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again after 15 minutes.',
    },
  },
});

// POST /api/v1/admin/auth/login
adminRouter.post('/auth/login', loginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = LoginRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Please enter valid email and password.', 400);
    }

    const { email, password } = parseResult.data;
    const user = await UserModel.findOne({ email: email.toLowerCase(), status: 'active' });

    if (!user) {
      throw new JanDastavejError('UNAUTHORIZED', 'Invalid email or password.', 401);
    }

    const passwordMatch = await argon2.verify(user.passwordHash, password);
    if (!passwordMatch) {
      await AuditEventModel.create({
        actorEmail: email,
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'auth',
        entityId: String(user._id),
        reason: 'Incorrect password',
        timestamp: new Date(),
      });
      throw new JanDastavejError('UNAUTHORIZED', 'Invalid email or password.', 401);
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Create session cookie token (encoded JSON, HttpOnly, SameSite strict)
    const sessionPayload = JSON.stringify({ userId: String(user._id), role: user.role, time: Date.now() });
    const sessionToken = Buffer.from(sessionPayload).toString('base64');

    res.cookie('jd_admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
      path: '/',
    });

    await AuditEventModel.create({
      actorUserId: user._id,
      actorEmail: user.email,
      action: 'ADMIN_LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: String(user._id),
      timestamp: new Date(),
    });

    res.json({
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/auth/logout
adminRouter.post('/auth/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('jd_admin_session', { path: '/' });
    res.json({ status: 'ok', message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/admin/auth/me
adminRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    data: {
      user: {
        id: req.user!._id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
      },
    },
  });
});

// GET /api/v1/admin/templates - List all templates (including drafts and retired)
adminRouter.get('/templates', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const templates = await TemplateModel.find()
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch latest versions for each template
    const templateIds = templates.map((t) => t._id);
    const versions = await TemplateVersionModel.find({ templateId: { $in: templateIds } })
      .sort({ version: -1 })
      .lean();

    const data = templates.map((t) => {
      const tVersions = versions.filter((v) => String(v.templateId) === String(t._id));
      const latestVersion = tVersions[0] || null;
      return {
        ...t,
        versionsCount: tVersions.length,
        latestVersionStatus: latestVersion ? latestVersion.status : 'draft',
      };
    });

    res.json({ data, total: data.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/templates - Create draft template and version
adminRouter.post(
  '/templates',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { slug, title, titleGu, description, descriptionGu, category, fields, layoutKey } = req.body;

      if (!slug || !title || !titleGu || !category) {
        throw new JanDastavejError('VALIDATION_ERROR', 'Missing required template metadata fields.', 400);
      }

      const existing = await TemplateModel.findOne({ slug });
      if (existing) {
        throw new JanDastavejError('VALIDATION_ERROR', `Template with slug '${slug}' already exists.`, 400);
      }

      const template = await TemplateModel.create({
        slug,
        title,
        titleGu,
        description: description || title,
        descriptionGu: descriptionGu || titleGu,
        category,
        supportedLanguages: ['gu', 'en'],
        status: 'active',
        isDemoOnly: true,
        createdBy: req.user!._id,
      });

      const initialFields = Array.isArray(fields) && fields.length > 0 ? fields : [
        { key: 'fullName', label: 'Full Name', labelGu: 'પૂર્ણ નામ', type: 'text', required: true },
      ];

      const draftVersion = await TemplateVersionModel.create({
        templateId: template._id,
        version: 1,
        language: 'gu',
        fields: initialFields,
        layoutKey: layoutKey || 'sample_declaration',
        sourceReference: 'Collector Office, Gandhinagar - Draft Format',
        status: 'draft',
        createdBy: req.user!._id,
      });

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_CREATED',
        entityType: 'template',
        entityId: String(template._id),
        version: 1,
        timestamp: new Date(),
        metadata: { slug, version: 1 },
      });

      res.status(201).json({
        data: {
          template,
          version: draftVersion,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/templates/:id - Detail with all versions
adminRouter.get('/templates/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const template = (await TemplateModel.findById(id).lean()) as (ITemplate & { _id: Types.ObjectId }) | null;
    if (!template) {
      throw new JanDastavejError('NOT_FOUND', 'Template not found', 404);
    }

    const versions = await TemplateVersionModel.find({ templateId: template._id })
      .sort({ version: -1 })
      .lean();

    res.json({
      data: {
        template,
        versions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/template-versions/:id - Edit DRAFT only
adminRouter.patch(
  '/template-versions/:id',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const version = await TemplateVersionModel.findById(id);

      if (!version) {
        throw new JanDastavejError('NOT_FOUND', 'Template version not found', 404);
      }

      // STRICT RULE: Published versions are immutable! Changes to published content require a new version.
      if (version.status === 'published') {
        throw new JanDastavejError(
          'FORBIDDEN',
          'Published versions are immutable. You must create a new draft version to make changes.',
          403
        );
      }

      if (version.status !== 'draft' && version.status !== 'rejected') {
        throw new JanDastavejError(
          'FORBIDDEN',
          `Cannot edit version in '${version.status}' state. Only draft or rejected versions can be edited.`,
          403
        );
      }

      const { fields, layoutKey, sourceReference } = req.body;
      if (fields) version.fields = fields;
      if (layoutKey) version.layoutKey = layoutKey;
      if (sourceReference) version.sourceReference = sourceReference;

      await version.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_UPDATED',
        entityType: 'template_version',
        entityId: String(version._id),
        version: version.version,
        timestamp: new Date(),
      });

      res.json({ data: version });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/template-versions/:id/submit-review - Transition draft -> in_review
adminRouter.post(
  '/template-versions/:id/submit-review',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const version = await TemplateVersionModel.findById(id);
      if (!version) {
        throw new JanDastavejError('NOT_FOUND', 'Template version not found', 404);
      }

      if (version.status !== 'draft' && version.status !== 'rejected') {
        throw new JanDastavejError('VALIDATION_ERROR', `Only draft or rejected versions can be submitted for review. Current: ${version.status}`, 400);
      }

      version.status = 'in_review';
      version.rejectionReason = undefined;
      await version.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'VERSION_SUBMITTED_FOR_REVIEW',
        entityType: 'template_version',
        entityId: String(version._id),
        version: version.version,
        timestamp: new Date(),
      });

      res.json({ data: version });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/template-versions/:id/approve - Approver role required
adminRouter.post(
  '/template-versions/:id/approve',
  requireAuth,
  requireRole(['admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const version = await TemplateVersionModel.findById(id);
      if (!version) {
        throw new JanDastavejError('NOT_FOUND', 'Template version not found', 404);
      }

      if (version.status !== 'in_review') {
        throw new JanDastavejError('VALIDATION_ERROR', `Only versions in 'in_review' can be approved. Current: ${version.status}`, 400);
      }

      version.status = 'approved';
      version.reviewedBy = req.user!._id;
      version.approvedAt = new Date();
      await version.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'VERSION_APPROVED',
        entityType: 'template_version',
        entityId: String(version._id),
        version: version.version,
        timestamp: new Date(),
      });

      res.json({ data: version });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/template-versions/:id/reject - Rejection requires a reason
adminRouter.post(
  '/template-versions/:id/reject',
  requireAuth,
  requireRole(['admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        throw new JanDastavejError('VALIDATION_ERROR', 'A rejection reason is strictly required.', 400);
      }

      const version = await TemplateVersionModel.findById(id);
      if (!version) {
        throw new JanDastavejError('NOT_FOUND', 'Template version not found', 404);
      }

      version.status = 'rejected';
      version.rejectionReason = reason.trim();
      version.reviewedBy = req.user!._id;
      await version.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'VERSION_REJECTED',
        entityType: 'template_version',
        entityId: String(version._id),
        version: version.version,
        reason: reason.trim(),
        timestamp: new Date(),
      });

      res.json({ data: version });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/template-versions/:id/publish - Publish approved version
adminRouter.post(
  '/template-versions/:id/publish',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const version = await TemplateVersionModel.findById(id);
      if (!version) {
        throw new JanDastavejError('NOT_FOUND', 'Template version not found', 404);
      }

      if (version.status !== 'approved') {
        throw new JanDastavejError(
          'VALIDATION_ERROR',
          `Only 'approved' versions can be published. Current: ${version.status}`,
          400
        );
      }

      version.status = 'published';
      version.publishedAt = new Date();
      await version.save();

      // Update parent template
      await TemplateModel.findByIdAndUpdate(version.templateId, {
        currentPublishedVersionId: version._id,
        currentVersionNumber: version.version,
        status: 'active',
      });

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'VERSION_PUBLISHED',
        entityType: 'template_version',
        entityId: String(version._id),
        version: version.version,
        timestamp: new Date(),
      });

      res.json({ data: version });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/templates/:id/retire - Retire obsolete template
adminRouter.post(
  '/templates/:id/retire',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);
      if (!template) {
        throw new JanDastavejError('NOT_FOUND', 'Template not found', 404);
      }

      template.status = 'retired';
      await template.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'VERSION_RETIRED',
        entityType: 'template',
        entityId: String(template._id),
        timestamp: new Date(),
        reason: req.body?.reason || 'Template retired by admin',
      });

      res.json({ data: template });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/audit-events - Filterable and paginated audit history (strictly NO document content)
adminRouter.get(
  '/audit-events',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { action, entityType, limit = '50', page = '1' } = req.query;

      const filter: Record<string, any> = {};
      if (action && typeof action === 'string' && action !== 'all') {
        filter.action = action;
      }
      if (entityType && typeof entityType === 'string' && entityType !== 'all') {
        filter.entityType = entityType;
      }

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const events = await AuditEventModel.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();

      const total = await AuditEventModel.countDocuments(filter);

      res.json({
        data: events,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);
