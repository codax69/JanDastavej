import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  JanDastavejError,
  validateAndSanitizeAnswers,
  renderDocumentHtml,
  normalizeAnswersForTemplate,
  ValidateAnswersRequestSchema,
  CreatePreviewRequestSchema,
  CreatePdfRequestSchema,
  CreateServiceBundleRequestSchema,
} from '@jandastavej/shared';
import { TemplateModel, ITemplate } from '../../models/Template.js';
import { TemplateVersionModel, ITemplateVersion } from '../../models/TemplateVersion.js';
import { GenerationSessionModel, IGenerationSession } from '../../models/GenerationSession.js';
import { ServiceModel } from '../../models/Service.js';
import { UsageMetricModel } from '../../models/UsageMetric.js';
import { generateDocumentPdf } from '../pdf/pdf.service.js';
import { generateDocumentDocx } from './docx.service.js';

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
      layoutKey: version.layoutKey,
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

// POST /api/v1/generations/:sessionId/apply-extraction - Apply user-confirmed extracted values
generationsRouter.post('/:sessionId/apply-extraction', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { confirmedFields } = req.body;

    if (!confirmedFields || typeof confirmedFields !== 'object') {
      throw new JanDastavejError('VALIDATION_ERROR', 'confirmedFields object is required.', 400);
    }

    const session = await GenerationSessionModel.findById(sessionId);
    if (!session || new Date() > new Date(session.expiresAt)) {
      throw new JanDastavejError('SESSION_EXPIRED', 'Generation session expired.', 410);
    }

    // Merge only confirmed fields
    session.answers = {
      ...session.answers,
      ...confirmedFields,
    };

    // Re-render preview HTML
    session.previewHtml = renderDocumentHtml({
      layoutKey: session.layoutKey,
      language: session.language,
      answers: session.answers,
      isDemoOnly: true,
    });

    await session.save();

    res.json({
      data: {
        sessionId: session._id,
        answers: session.answers,
        previewHtml: session.previewHtml,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/generations/:sessionId/bundle - Build PDF bundled with annexures
generationsRouter.post('/:sessionId/bundle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { annexureDocIds } = req.body;

    if (!Array.isArray(annexureDocIds) || annexureDocIds.length === 0) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Please select at least one annexure document.', 400);
    }

    const session = (await GenerationSessionModel.findById(sessionId).lean()) as any;
    if (!session || new Date() > new Date(session.expiresAt)) {
      throw new JanDastavejError('SESSION_EXPIRED', 'Session expired.', 410);
    }

    // Dynamic import to avoid circular dependency
    const { UserDocumentModel } = await import('../../models/UserDocument.js');
    const { storageService } = await import('../../services/storageService.js');

    // Fetch user documents
    const docs = (await UserDocumentModel.find({
      _id: { $in: annexureDocIds },
      status: { $ne: 'deleted' },
    }).lean()) as any[];

    if (docs.length === 0) {
      throw new JanDastavejError('NOT_FOUND', 'Selected annexure documents not found.', 404);
    }

    // Generate Annexure Bundle HTML
    let bundleHtml = session.previewHtml;

    // Cover Page for Annexures
    bundleHtml += `
      <div style="page-break-before: always; padding: 40px; font-family: 'Noto Sans Gujarati', sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 16px; margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #1a365d; margin: 0;">સહાયક પુરાવા / પરિશિષ્ટ (ANNEXURES LIST)</h2>
          <p style="font-size: 12px; color: #4a5568; margin-top: 6px;">The following supporting documents are attached as uncertified annexures to the main affidavit.</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #edf2f7; text-align: left;">
              <th style="padding: 10px; border: 1px solid #cbd5e0;">#</th>
              <th style="padding: 10px; border: 1px solid #cbd5e0;">Annexure Label</th>
              <th style="padding: 10px; border: 1px solid #cbd5e0;">Document Type</th>
              <th style="padding: 10px; border: 1px solid #cbd5e0;">File Name</th>
            </tr>
          </thead>
          <tbody>
    `;

    const labels = ['Annexure A', 'Annexure B', 'Annexure C', 'Annexure D', 'Annexure E', 'Annexure F'];
    const docPages: string[] = [];

    for (let i = 0; i < docs.length; i++) {
      const d = docs[i];
      const label = labels[i] || `Annexure ${i + 1}`;
      bundleHtml += `
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e0;">${i + 1}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e0; font-weight: bold; color: #1a365d;">${label}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e0; text-transform: capitalize;">${d.docType.replace('_', ' ')}</td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e0;">${d.originalName}</td>
        </tr>
      `;

      try {
        const fileBuffer = await storageService.getFile(String(d.userId), d.storageKey);
        const base64Data = fileBuffer.toString('base64');

        if (d.mimeType.startsWith('image/')) {
          docPages.push(`
            <div style="page-break-before: always; padding: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;">
                <span style="font-weight: bold; font-size: 16px; color: #1a365d;">${label} (${d.docType.replace('_', ' ').toUpperCase()})</span>
                <span style="font-size: 11px; color: #718096;">JanDastavej Document Annexure</span>
              </div>
              <div style="text-align: center;">
                <img src="data:${d.mimeType};base64,${base64Data}" style="max-width: 100%; max-height: 220mm; object-fit: contain; border: 1px solid #cbd5e0; border-radius: 4px;" alt="${label}" />
              </div>
            </div>
          `);
        } else {
          docPages.push(`
            <div style="page-break-before: always; padding: 40px; font-family: sans-serif;">
              <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 24px;">
                <span style="font-weight: bold; font-size: 16px; color: #1a365d;">${label} (${d.originalName})</span>
              </div>
              <div style="padding: 24px; background: #f7fafc; border: 1px dashed #cbd5e0; border-radius: 8px; text-align: center; color: #4a5568;">
                <p style="font-size: 14px; font-weight: bold;">[Attached Document: ${d.originalName}]</p>
                <p style="font-size: 12px; margin-top: 8px;">Document size: ${(d.sizeBytes / 1024).toFixed(1)} KB · Annexure Bundle</p>
              </div>
            </div>
          `);
        }
      } catch {
        // file reading error handling
      }
    }

    bundleHtml += `
          </tbody>
        </table>
      </div>
    `;

    bundleHtml += docPages.join('');

    const pdfBuffer = await generateDocumentPdf(
      bundleHtml,
      `JanDastavej - ${session.templateSlug} with Annexures`
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="JanDastavej-${session.templateSlug}-Bundle.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/generations/:sessionId/docx - Download DOCX Word document
generationsRouter.get('/:sessionId/docx', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Invalid session ID', 400);
    }

    const session = (await GenerationSessionModel.findById(sessionId).lean()) as (IGenerationSession & { _id: Types.ObjectId }) | null;
    if (!session || new Date() > new Date(session.expiresAt)) {
      throw new JanDastavejError(
        'SESSION_EXPIRED',
        'Your generation session has expired. Please create a new preview.',
        410
      );
    }

    let layoutKey: string = session.layoutKey || 'sample_declaration';
    if (!session.layoutKey) {
      const version = (await TemplateVersionModel.findById(session.templateVersionId).lean()) as (ITemplateVersion & { _id: Types.ObjectId }) | null;
      if (version?.layoutKey) layoutKey = version.layoutKey;
    }

    const docxBuffer = await generateDocumentDocx({
      layoutKey,
      language: session.language,
      answers: session.answers,
      isDemoOnly: true,
      title: `JanDastavej - ${session.templateSlug}`,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="JanDastavej-${session.templateSlug}-${session.language}.docx"`
    );
    res.send(docxBuffer);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/generations/service-bundle - Generate multiple documents for a service with shared answers
generationsRouter.post('/service-bundle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = CreateServiceBundleRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new JanDastavejError(
        'VALIDATION_ERROR',
        parseResult.error.issues[0]?.message || 'Invalid service bundle payload.',
        400
      );
    }

    const { serviceSlug, language, answers, selectedTemplateSlugs } = parseResult.data;

    const service = await ServiceModel.findOne({ slug: serviceSlug, status: 'active' }).lean();
    if (!service) {
      throw new JanDastavejError('NOT_FOUND', `Service '${serviceSlug}' not found.`, 404);
    }

    const allowedSlugs = new Set((service.requiredTemplates || []).map((r: any) => (typeof r === 'string' ? r : r.templateSlug)));
    const invalidSlug = selectedTemplateSlugs.find((slug) => !allowedSlugs.has(slug));
    if (invalidSlug) {
      throw new JanDastavejError(
        'VALIDATION_ERROR',
        `Template '${invalidSlug}' is not part of service '${serviceSlug}'.`,
        400
      );
    }

    // Find templates and their published versions
    const templates = await TemplateModel.find({
      slug: { $in: selectedTemplateSlugs },
      status: 'active',
    }).lean();

    if (templates.length === 0) {
      throw new JanDastavejError('NOT_FOUND', 'No active templates found for selected slugs.', 404);
    }

    const templateIds = templates.map((t) => t._id);
    const versions = await TemplateVersionModel.find({
      templateId: { $in: templateIds },
      language,
      status: 'published',
    }).lean();

    const versionMap = new Map(versions.map((v) => [String(v.templateId), v]));
    const templateBySlug = new Map(templates.map((t) => [t.slug, t]));

    // Preserve selectedTemplateSlugs order and validate all normalized answers first
    const preparedDocs: {
      tpl: (typeof templates)[0];
      version: (typeof versions)[0];
      normalizedAnswers: Record<string, any>;
    }[] = [];

    for (const slug of selectedTemplateSlugs) {
      const tpl = templateBySlug.get(slug);
      if (!tpl) continue;

      const version = versionMap.get(String(tpl._id));
      if (!version) {
        throw new JanDastavejError('NOT_FOUND', `Published template version not found for '${tpl.slug}'.`, 404);
      }

      const fieldKeys = (version.fields as any[]).map((f: any) => f.key);
      const normalizedAnswers = normalizeAnswersForTemplate(answers, fieldKeys);

      const validation = validateAndSanitizeAnswers(version.fields, normalizedAnswers, language);
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

      preparedDocs.push({ tpl, version, normalizedAnswers });
    }

    const sessions = [];
    const htmlSections: string[] = [];
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins TTL

    for (const { tpl, version, normalizedAnswers } of preparedDocs) {
      const previewHtml = renderDocumentHtml({
        layoutKey: version.layoutKey,
        language,
        answers: normalizedAnswers,
        isDemoOnly: true,
      });

      const sessionDoc = await GenerationSessionModel.create({
        templateId: tpl._id,
        templateSlug: tpl.slug,
        templateVersionId: version._id,
        layoutKey: version.layoutKey,
        language,
        answers: normalizedAnswers,
        previewHtml,
        expiresAt,
      });

      sessions.push({
        templateSlug: tpl.slug,
        templateTitle: language === 'gu' ? tpl.titleGu : tpl.title,
        templateCategory: tpl.category,
        sessionId: String(sessionDoc._id),
        previewHtml,
        answers: normalizedAnswers,
      });

      htmlSections.push(previewHtml);
    }

    const combinedHtml = htmlSections.join(
      '<div style="page-break-before: always; height: 1px; margin: 0; padding: 0;"></div>'
    );

    res.json({
      data: {
        serviceSlug,
        serviceTitle: language === 'gu' ? service.titleGu : service.title,
        sessions,
        combinedHtml,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/generations/service-bundle/pdf - Combined PDF download for all documents in a service bundle
generationsRouter.post('/service-bundle/pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionIds, title = 'JanDastavej-Service-Bundle', disclaimerAccepted } = req.body;
    if (disclaimerAccepted !== true) {
      throw new JanDastavejError('VALIDATION_ERROR', 'You must accept the legal disclaimer before downloading.', 400);
    }

    if (!Array.isArray(sessionIds) || sessionIds.length === 0 || sessionIds.length > 10) {
      throw new JanDastavejError('VALIDATION_ERROR', 'sessionIds must be an array of 1 to 10 session IDs.', 400);
    }

    const validIds = sessionIds.filter((id) => typeof id === 'string' && Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new JanDastavejError('VALIDATION_ERROR', 'No valid session IDs provided.', 400);
    }

    const fetchedSessions = (await GenerationSessionModel.find({
      _id: { $in: validIds },
      expiresAt: { $gt: new Date() },
    }).lean()) as unknown as (IGenerationSession & { _id: Types.ObjectId })[];

    const sessionMap = new Map(fetchedSessions.map((s) => [String(s._id), s]));
    const orderedSessions = validIds
      .map((id) => sessionMap.get(id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));

    if (orderedSessions.length === 0) {
      throw new JanDastavejError('NOT_FOUND', 'No valid generation sessions found.', 404);
    }

    const safeTitle =
      (typeof title === 'string'
        ? title.replace(/[^a-zA-Z0-9_\-\u0A80-\u0AFF\s]/g, '').trim().slice(0, 80)
        : '') || 'JanDastavej-Service-Bundle';

    const combinedHtml = orderedSessions
      .map((s) => s.previewHtml)
      .join('<div style="page-break-before: always; height: 1px; margin: 0; padding: 0;"></div>');

    const pdfBuffer = await generateDocumentPdf(combinedHtml, safeTitle);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(safeTitle)}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});


