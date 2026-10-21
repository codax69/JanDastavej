import { Router, Request, Response, NextFunction } from 'express';
import argon2 from 'argon2';
import rateLimit from 'express-rate-limit';
import { Types } from 'mongoose';
import {
  JanDastavejError,
  LoginRequestSchema,
  TemplateVersionSchema,
  ApproveSubmissionRequestSchema,
  RequestCorrectionRequestSchema,
} from '@jandastavej/shared';
import { UserModel } from '../../models/User.js';
import { TemplateModel, ITemplate } from '../../models/Template.js';
import { TemplateVersionModel, ITemplateVersion } from '../../models/TemplateVersion.js';
import { AuditEventModel } from '../../models/AuditEvent.js';
import { DocumentSubmissionModel } from '../../models/DocumentSubmission.js';
import { IssueReportModel } from '../../models/IssueReport.js';
import { ServiceModel } from '../../models/Service.js';
import { aiScannerService } from '../../services/aiScanner.js';
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

// PATCH /api/v1/admin/templates/:id - Update template metadata
adminRouter.patch(
  '/templates/:id',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);
      if (!template) {
        throw new JanDastavejError('NOT_FOUND', 'Template not found', 404);
      }

      const {
        title,
        titleGu,
        description,
        descriptionGu,
        category,
        purpose,
        purposeGu,
        requiredDocuments,
        requiredDocumentsGu,
        nextSteps,
        nextStepsGu,
        status,
      } = req.body;

      if (title) template.title = title;
      if (titleGu) template.titleGu = titleGu;
      if (description) template.description = description;
      if (descriptionGu) template.descriptionGu = descriptionGu;
      if (category) template.category = category;
      if (purpose !== undefined) template.purpose = purpose;
      if (purposeGu !== undefined) template.purposeGu = purposeGu;
      if (requiredDocuments) template.requiredDocuments = requiredDocuments;
      if (requiredDocumentsGu) template.requiredDocumentsGu = requiredDocumentsGu;
      if (nextSteps !== undefined) template.nextSteps = nextSteps;
      if (nextStepsGu !== undefined) template.nextStepsGu = nextStepsGu;
      if (status && (status === 'active' || status === 'retired')) template.status = status;

      await template.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_UPDATED',
        entityType: 'template',
        entityId: String(template._id),
        timestamp: new Date(),
        metadata: { slug: template.slug },
      });

      res.json({ data: template });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/admin/templates/:id - Delete template and associated versions
adminRouter.delete(
  '/templates/:id',
  requireAuth,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);
      if (!template) {
        throw new JanDastavejError('NOT_FOUND', 'Template not found', 404);
      }

      const slug = template.slug;
      await TemplateVersionModel.deleteMany({ templateId: template._id });
      await TemplateModel.findByIdAndDelete(id);

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_DELETED',
        entityType: 'template',
        entityId: id,
        timestamp: new Date(),
        reason: req.body?.reason || 'Template deleted by admin',
        metadata: { slug },
      });

      res.json({ status: 'ok', message: `Template '${slug}' and all versions deleted.` });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/templates/:id/versions - Create new draft version (v2, v3, etc.)
adminRouter.post(
  '/templates/:id/versions',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);
      if (!template) {
        throw new JanDastavejError('NOT_FOUND', 'Template not found', 404);
      }

      // Find highest existing version
      const highestVersion = (await TemplateVersionModel.findOne({ templateId: template._id })
        .sort({ version: -1 })
        .lean()) as (ITemplateVersion & { _id: Types.ObjectId }) | null;

      const nextVersionNum = highestVersion ? highestVersion.version + 1 : 1;
      const { fields, layoutKey, language = 'gu', sourceReference } = req.body;

      const newFields = Array.isArray(fields) && fields.length > 0
        ? fields
        : highestVersion
        ? highestVersion.fields
        : [{ key: 'fullName', label: 'Full Name', labelGu: 'પૂર્ણ નામ', type: 'text', required: true }];

      const newVersion = await TemplateVersionModel.create({
        templateId: template._id,
        version: nextVersionNum,
        language,
        fields: newFields,
        layoutKey: layoutKey || (highestVersion ? highestVersion.layoutKey : 'sample_declaration'),
        sourceReference: sourceReference || 'Collector Office, Gandhinagar - Standard Format',
        status: 'draft',
        createdBy: req.user!._id,
      });

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_CREATED',
        entityType: 'template_version',
        entityId: String(newVersion._id),
        version: nextVersionNum,
        timestamp: new Date(),
        metadata: { slug: template.slug, version: nextVersionNum },
      });

      res.status(201).json({ data: newVersion });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/admin/template-versions/:id - Delete draft or rejected version
adminRouter.delete(
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

      if (version.status === 'published') {
        throw new JanDastavejError('FORBIDDEN', 'Cannot delete published versions. Published versions are immutable audit records.', 403);
      }

      await TemplateVersionModel.findByIdAndDelete(id);

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'VERSION_REJECTED',
        entityType: 'template_version',
        entityId: id,
        version: version.version,
        timestamp: new Date(),
        reason: 'Draft version deleted by admin',
      });

      res.json({ status: 'ok', message: `Version ${version.version} deleted.` });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/submissions - List citizen document submissions & AI scans
adminRouter.get(
  '/submissions',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const filter: Record<string, any> = {};
      if (status && typeof status === 'string' && status !== 'all') {
        filter.status = status;
      }

      const submissions = await DocumentSubmissionModel.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      res.json({ data: submissions, total: submissions.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/submissions/:id - Get detail of submission with AI scan
adminRouter.get(
  '/submissions/:id',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const submission = await DocumentSubmissionModel.findById(id).lean();
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }
      res.json({ data: submission });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/submissions/:id/rescan - Re-trigger AI scan on submitted document
adminRouter.post(
  '/submissions/:id/rescan',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const submission = await DocumentSubmissionModel.findById(id);
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }

      const aiScanResult = await aiScannerService.scanDocument({
        titleHint: req.body?.titleHint || submission.documentTitle,
        text: submission.documentText,
        categoryHint: req.body?.categoryHint || submission.category,
      });

      submission.aiScanResult = aiScanResult;
      submission.status = 'scanned';
      await submission.save();

      res.json({ data: submission });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/submissions/:id/approve - Approve AI-scanned submission & publish live template
adminRouter.post(
  '/submissions/:id/approve',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const submission = await DocumentSubmissionModel.findById(id);
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }

      const parseResult = ApproveSubmissionRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new JanDastavejError(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || 'Invalid template approval parameters.',
          400
        );
      }

      const {
        title,
        titleGu,
        category,
        description,
        descriptionGu,
        purpose,
        purposeGu,
        fields,
        layoutKey,
        requiredDocuments,
        nextSteps,
        nextStepsGu,
      } = parseResult.data;

      // Generate unique slug
      let baseSlug = (parseResult.data.slug || title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (baseSlug.length < 3) baseSlug = `template-${Date.now().toString(36)}`;

      let candidateSlug = baseSlug;
      let counter = 1;
      while (await TemplateModel.findOne({ slug: candidateSlug })) {
        counter++;
        candidateSlug = `${baseSlug}-${counter}`;
      }

      // 1. Create Template Record
      const template = await TemplateModel.create({
        slug: candidateSlug,
        title,
        titleGu,
        category,
        description: description || title,
        descriptionGu: descriptionGu || titleGu,
        purpose,
        purposeGu,
        requiredDocuments: requiredDocuments || [],
        nextSteps,
        nextStepsGu,
        supportedLanguages: ['gu', 'en'],
        status: 'active',
        isDemoOnly: true,
        createdBy: req.user!._id,
      });

      // 2. Create Published Version 1
      const version = await TemplateVersionModel.create({
        templateId: template._id,
        version: 1,
        language: 'gu',
        fields,
        layoutKey: layoutKey || 'sample_declaration',
        sourceReference: 'Gandhinagar Collector Office - Citizen Submitted & AI Verified Format',
        status: 'published',
        publishedAt: new Date(),
        reviewedBy: req.user!._id,
        createdBy: req.user!._id,
      });

      // 3. Link Version to Template
      template.currentPublishedVersionId = version._id as any;
      template.currentVersionNumber = 1;
      await template.save();

      // 4. Update Submission status
      submission.status = 'approved';
      submission.createdTemplateId = template._id as any;
      submission.reviewedBy = req.user!._id as any;
      submission.reviewedAt = new Date();
      await submission.save();

      // 5. Audit Log
      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_CREATED',
        entityType: 'submission',
        entityId: String(submission._id),
        version: 1,
        timestamp: new Date(),
        metadata: {
          submissionId: String(submission._id),
          templateId: String(template._id),
          slug: template.slug,
        },
      });

      res.status(201).json({
        data: {
          template,
          version,
          submission,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/submissions/:id/reject - Reject submission with reason
adminRouter.post(
  '/submissions/:id/reject',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
        throw new JanDastavejError('VALIDATION_ERROR', 'A rejection reason is required.', 400);
      }

      const submission = await DocumentSubmissionModel.findById(id);
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }

      submission.status = 'rejected';
      submission.rejectionReason = reason.trim();
      submission.reviewedBy = req.user!._id as any;
      submission.reviewedAt = new Date();
      await submission.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'VERSION_REJECTED',
        entityType: 'submission',
        entityId: String(submission._id),
        reason: reason.trim(),
        timestamp: new Date(),
      });

      res.json({ data: submission });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/submissions/:id/request-correction - Reviewer requests changes from citizen
adminRouter.post(
  '/submissions/:id/request-correction',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const parseResult = RequestCorrectionRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        throw new JanDastavejError(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || 'Please provide clear correction instructions.',
          400
        );
      }

      const submission = await DocumentSubmissionModel.findById(id);
      if (!submission) {
        throw new JanDastavejError('NOT_FOUND', 'Submission not found.', 404);
      }

      const { notes } = parseResult.data;
      submission.status = 'needs_correction';
      submission.correctionNotes = notes.trim();
      submission.reviewedBy = req.user!._id as any;
      submission.reviewedAt = new Date();
      submission.statusHistory.push({
        status: 'needs_correction',
        timestamp: new Date(),
        changedBy: req.user!._id as any,
        note: `Correction requested: ${notes.trim()}`,
      });

      await submission.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'SUBMISSION_CORRECTION_REQUESTED',
        entityType: 'submission',
        entityId: String(submission._id),
        reason: notes.trim(),
        timestamp: new Date(),
      });

      res.json({
        data: submission,
        message: 'Correction request recorded and dispatched to submitter.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/templates/:id/archive - Archive template (remove from public discovery)
adminRouter.post(
  '/templates/:id/archive',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const template = await TemplateModel.findById(id);
      if (!template) {
        throw new JanDastavejError('NOT_FOUND', 'Template not found.', 404);
      }

      template.status = 'archived';
      await template.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_ARCHIVED',
        entityType: 'template',
        entityId: String(template._id),
        timestamp: new Date(),
        metadata: { slug: template.slug },
      });

      res.json({ data: template, message: 'Template archived successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/templates/:id/supersede - Mark template superseded by newer version
adminRouter.post(
  '/templates/:id/supersede',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { supersededBySlug, reason } = req.body;

      if (!supersededBySlug || typeof supersededBySlug !== 'string') {
        throw new JanDastavejError('VALIDATION_ERROR', 'supersededBySlug is required.', 400);
      }

      const template = await TemplateModel.findById(id);
      if (!template) {
        throw new JanDastavejError('NOT_FOUND', 'Template not found.', 404);
      }

      template.status = 'superseded';
      template.supersededBySlug = supersededBySlug.trim();
      await template.save();

      await AuditEventModel.create({
        actorUserId: req.user!._id,
        actorEmail: req.user!.email,
        action: 'TEMPLATE_SUPERSEDED',
        entityType: 'template',
        entityId: String(template._id),
        reason: reason || `Superseded by ${supersededBySlug}`,
        timestamp: new Date(),
        metadata: { slug: template.slug, supersededBySlug },
      });

      res.json({ data: template, message: `Template marked as superseded by ${supersededBySlug}.` });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/reports - View public issue reports on templates
adminRouter.get(
  '/reports',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver', 'staff']),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const reports = await IssueReportModel.find().sort({ createdAt: -1 }).lean();
      res.json({ data: reports, total: reports.length });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/admin/reports/:id - Resolve or update issue report status
adminRouter.patch(
  '/reports/:id',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, adminNotes, markDisputed } = req.body;

      const report = await IssueReportModel.findById(id);
      if (!report) {
        throw new JanDastavejError('NOT_FOUND', 'Issue report not found.', 404);
      }

      if (status) report.status = status;
      if (adminNotes) report.adminNotes = adminNotes;
      if (status === 'resolved' || status === 'dismissed') {
        report.resolvedBy = req.user!._id as any;
        report.resolvedAt = new Date();
      }
      await report.save();

      if (markDisputed !== undefined) {
        await TemplateModel.updateOne({ slug: report.templateSlug }, { isDisputed: !!markDisputed });
      }

      res.json({ data: report });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/services - List all services for admin management
adminRouter.get(
  '/services',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver', 'staff']),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const services = await ServiceModel.find().sort({ updatedAt: -1 }).lean();
      res.json({ data: services, total: services.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/admin/services/:id - Get single service
adminRouter.get(
  '/services/:id',
  requireAuth,
  requireRole(['admin', 'template_admin', 'approver', 'staff']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const service = await ServiceModel.findById(req.params.id).lean();
      if (!service) {
        throw new JanDastavejError('NOT_FOUND', 'Service not found.', 404);
      }
      res.json({ data: service });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/admin/services - Create new service
adminRouter.post(
  '/services',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {
        title,
        titleGu,
        slug,
        department,
        departmentGu,
        category = 'revenue',
        jurisdiction = 'Gujarat',
        effectiveDate = '2026-01-01',
        sourceReference = 'Official Department Circular',
        description,
        descriptionGu,
        purpose,
        purposeGu,
        requiredTemplates = [],
        steps = [],
        stepsGu = [],
        status = 'active',
      } = req.body;

      if (!title || !titleGu) {
        throw new JanDastavejError('VALIDATION_ERROR', 'Service title (English & Gujarati) is required.', 400);
      }

      const generatedSlug = (slug || title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existing = await ServiceModel.findOne({ slug: generatedSlug });
      if (existing) {
        throw new JanDastavejError('VALIDATION_ERROR', `Service with slug '${generatedSlug}' already exists.`, 409);
      }

      const newService = await ServiceModel.create({
        title,
        titleGu,
        slug: generatedSlug,
        department: department || 'General Administration',
        departmentGu: departmentGu || 'સામાન્ય વહીવટ વિભાગ',
        category,
        jurisdiction,
        effectiveDate,
        verificationStatus: 'verified_sample',
        sourceReference,
        description: description || title,
        descriptionGu: descriptionGu || titleGu,
        purpose,
        purposeGu,
        requiredTemplates,
        steps: steps.length > 0 ? steps : ['Complete citizen details', 'Review generated bundle', 'Submit to Jan Seva Kendra'],
        stepsGu: stepsGu.length > 0 ? stepsGu : ['નાગરિક વિગતો ભરો', 'દસ્તાવેજ પ્રીવ્યૂ ચકાસો', 'જન સેવા કેન્દ્રમાં જમા કરાવો'],
        status,
        isDemoOnly: true,
        createdBy: req.user!._id as any,
      });

      res.status(201).json({ data: newService });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/admin/services/:id - Update existing service
adminRouter.put(
  '/services/:id',
  requireAuth,
  requireRole(['admin', 'template_admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const service = await ServiceModel.findById(id);
      if (!service) {
        throw new JanDastavejError('NOT_FOUND', 'Service not found.', 404);
      }

      const {
        title,
        titleGu,
        department,
        departmentGu,
        category,
        jurisdiction,
        effectiveDate,
        sourceReference,
        description,
        descriptionGu,
        purpose,
        purposeGu,
        requiredTemplates,
        steps,
        stepsGu,
        status,
      } = req.body;

      if (title !== undefined) service.title = title;
      if (titleGu !== undefined) service.titleGu = titleGu;
      if (department !== undefined) service.department = department;
      if (departmentGu !== undefined) service.departmentGu = departmentGu;
      if (category !== undefined) service.category = category;
      if (jurisdiction !== undefined) service.jurisdiction = jurisdiction;
      if (effectiveDate !== undefined) service.effectiveDate = effectiveDate;
      if (sourceReference !== undefined) service.sourceReference = sourceReference;
      if (description !== undefined) service.description = description;
      if (descriptionGu !== undefined) service.descriptionGu = descriptionGu;
      if (purpose !== undefined) service.purpose = purpose;
      if (purposeGu !== undefined) service.purposeGu = purposeGu;
      if (requiredTemplates !== undefined) service.requiredTemplates = requiredTemplates;
      if (steps !== undefined) service.steps = steps;
      if (stepsGu !== undefined) service.stepsGu = stepsGu;
      if (status !== undefined) service.status = status;

      await service.save();

      res.json({ data: service });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/admin/services/:id - Soft-retire service
adminRouter.delete(
  '/services/:id',
  requireAuth,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const service = await ServiceModel.findById(id);
      if (!service) {
        throw new JanDastavejError('NOT_FOUND', 'Service not found.', 404);
      }

      service.status = 'retired';
      await service.save();

      res.json({ message: 'Service successfully retired.' });
    } catch (err) {
      next(err);
    }
  }
);

