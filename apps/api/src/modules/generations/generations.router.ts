import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  JanDastavejError,
  validateAndSanitizeAnswers,
  renderDocumentHtml,
  ValidateAnswersRequestSchema,
  CreatePreviewRequestSchema,
  CreatePdfRequestSchema,
} from '@jandastavej/shared';
import { TemplateModel, ITemplate } from '../../models/Template.js';
import { TemplateVersionModel, ITemplateVersion } from '../../models/TemplateVersion.js';
import { GenerationSessionModel, IGenerationSession } from '../../models/GenerationSession.js';
import { UsageMetricModel } from '../../models/UsageMetric.js';
import { generateDocumentPdf } from '../pdf/pdf.service.js';

export const generationsRouter = Router();

// POST /api/v1/generations/validate - Server-side validation against published schema
generationsRouter.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = ValidateAnswersRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError(
        'VALIDATION_ERROR',
        'Invalid request payload.',
        400,
        { root: parseResult.error.issues[0]?.message || 'Invalid format' }
      );
    }

    const { templateVersionId, answers, language } = parseResult.data;

    const version = (await TemplateVersionModel.findOne({
      _id: templateVersionId,
      status: 'published',
    }).lean()) as (ITemplateVersion & { _id: Types.ObjectId }) | null;

    if (!version) {
      throw new JanDastavejError('NOT_FOUND', 'Published template version not found', 404);
    }

    const result = validateAndSanitizeAnswers(version.fields, answers, language);

    res.json({
      isValid: result.isValid,
      errors: result.errors,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/generations/preview - Validate and create short-lived preview session
generationsRouter.post('/preview', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  try {
    const parseResult = CreatePreviewRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError(
        'VALIDATION_ERROR',
        'Invalid preview request payload.',
        400,
        { root: parseResult.error.issues[0]?.message || 'Invalid format' }
      );
    }

    const { templateVersionId, answers, language } = parseResult.data;

    let version: (ITemplateVersion & { _id: Types.ObjectId }) | null = null;

    if (Types.ObjectId.isValid(templateVersionId)) {
      version = (await TemplateVersionModel.findOne({
        _id: templateVersionId,
        status: 'published',
      }).lean()) as (ITemplateVersion & { _id: Types.ObjectId }) | null;
    }

    if (!version) {
      const template = (await TemplateModel.findOne({
        slug: templateVersionId,
        status: 'active',
      }).lean()) as (ITemplate & { _id: Types.ObjectId }) | null;

      if (template) {
        version = (await TemplateVersionModel.findOne({
          templateId: template._id,
          language,
          status: 'published',
        }).lean()) as (ITemplateVersion & { _id: Types.ObjectId }) | null;
      }
    }

    if (!version) {
      throw new JanDastavejError('NOT_FOUND', 'Published template version not found', 404);
    }

    const template = (await TemplateModel.findById(version.templateId).lean()) as (ITemplate & { _id: Types.ObjectId }) | null;
    const templateTitle = template
      ? language === 'gu' ? template.titleGu : template.title
      : 'Document Preview';

    // Server-side validation
    const validation = validateAndSanitizeAnswers(version.fields, answers, language);
    if (!validation.isValid) {
      throw new JanDastavejError(
        'VALIDATION_ERROR',
        language === 'gu'
          ? 'કૃપા કરીને લાલ રંગથી દર્શાવેલી જરૂરી વિગતો યોગ્ય રીતે ભરો.'
          : 'Please correct the highlighted fields.',
        400,
        validation.errors
      );
    }

    // Render HTML using single shared render path
    const previewHtml = renderDocumentHtml({
      layoutKey: version.layoutKey,
      language,
      answers: validation.sanitizedAnswers,
      isDemoOnly: true,
    });

    // Session TTL: 30 minutes from creation
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const session = await GenerationSessionModel.create({
      templateVersionId: version._id,
      templateSlug: template?.slug || 'unknown',
      answers: validation.sanitizedAnswers,
      language,
      previewHtml,
      expiresAt,
      status: 'active',
    });

    // Record low-PII usage metric
    await UsageMetricModel.create({
      eventType: 'PREVIEW_GENERATED',
      templateId: version.templateId,
      language,
      durationMs: Date.now() - startTime,
      success: true,
    });

    res.json({
      data: {
        sessionId: String(session._id),
        templateTitle,
        language,
        previewHtml,
        expiresAt: expiresAt.toISOString(),
        isDemoOnly: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/generations/sessions/:id - Get session details
generationsRouter.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Invalid session ID', 400);
    }

    const session = (await GenerationSessionModel.findById(id).lean()) as (IGenerationSession & { _id: Types.ObjectId }) | null;
    if (!session) {
      throw new JanDastavejError(
        'SESSION_EXPIRED',
        'Your preview session has expired or does not exist. Please start again.',
        404
      );
    }

    if (new Date() > new Date(session.expiresAt)) {
      throw new JanDastavejError(
        'SESSION_EXPIRED',
        'Your preview session has expired for privacy. Please generate a new preview.',
        410
      );
    }

    const template = (await TemplateModel.findOne({ slug: session.templateSlug }).lean()) as (ITemplate & { _id: Types.ObjectId }) | null;

    res.json({
      data: {
        sessionId: String(session._id),
        templateSlug: session.templateSlug,
        templateTitle: template
          ? session.language === 'gu' ? template.titleGu : template.title
          : 'Document',
        language: session.language,
        answers: session.answers,
        previewHtml: session.previewHtml,
        expiresAt: session.expiresAt,
        status: session.status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/generations/pdf - Generate PDF via isolated worker
generationsRouter.post('/pdf', async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  try {
    const parseResult = CreatePdfRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError(
        'VALIDATION_ERROR',
        parseResult.error.issues[0]?.message || 'Legal disclaimer acceptance is required.',
        400
      );
    }

    const { sessionId } = parseResult.data;
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Invalid session ID', 400);
    }

    const session = (await GenerationSessionModel.findById(sessionId).lean()) as (IGenerationSession & { _id: Types.ObjectId }) | null;
    if (!session || new Date() > new Date(session.expiresAt)) {
      throw new JanDastavejError(
        'SESSION_EXPIRED',
        'Your session has expired. Please create a new preview before downloading.',
        410
      );
    }

    // Call sandboxed Playwright worker with the same HTML
    const pdfBuffer = await generateDocumentPdf(
      session.previewHtml,
      `JanDastavej - ${session.templateSlug}`
    );

    await UsageMetricModel.create({
      eventType: 'PDF_DOWNLOADED',
      language: session.language,
      durationMs: Date.now() - startTime,
      success: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="JanDastavej-${session.templateSlug}-${session.language}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err: any) {
    if (err.message?.includes('limit reached')) {
      next(new JanDastavejError('PDF_UNAVAILABLE', err.message, 503));
      return;
    }
    next(err);
  }
});
