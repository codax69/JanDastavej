import { Router, Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { JanDastavejError } from '@jandastavej/shared';
import { TemplateModel, ITemplate } from '../../models/Template.js';
import { TemplateVersionModel } from '../../models/TemplateVersion.js';

export const templatesRouter = Router();

// GET /api/v1/templates - Public list of published templates
templatesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, language } = req.query;

    const filter: Record<string, any> = {
      status: 'active',
      currentPublishedVersionId: { $exists: true, $ne: null },
    };

    if (category && typeof category === 'string' && category !== 'all') {
      filter.category = category;
    }

    if (language && (language === 'gu' || language === 'en')) {
      filter.supportedLanguages = language;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { titleGu: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { descriptionGu: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
      ];
    }

    const templates = await TemplateModel.find(filter)
      .select('-__v')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      data: templates,
      total: templates.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/templates/:slug - Public template detail with published version
templatesRouter.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const requestedLang = (req.query.language as string) || 'gu';
    const lang = requestedLang === 'en' ? 'en' : 'gu';

    const template = (await TemplateModel.findOne({ slug, status: 'active' })
      .select('-__v')
      .lean()) as (ITemplate & { _id: Types.ObjectId }) | null;

    if (!template) {
      throw new JanDastavejError('NOT_FOUND', `Template '${slug}' not found or inactive`, 404);
    }

    // Must fetch published version for requested language
    let version = await TemplateVersionModel.findOne({
      templateId: template._id,
      language: lang,
      status: 'published',
    })
      .sort({ version: -1 })
      .select('-__v')
      .lean();

    // Fallback to alternate language if requested language version not found but is published
    if (!version) {
      version = await TemplateVersionModel.findOne({
        templateId: template._id,
        status: 'published',
      })
        .sort({ version: -1 })
        .select('-__v')
        .lean();
    }

    if (!version) {
      throw new JanDastavejError(
        'NOT_FOUND',
        `No published version found for template '${slug}'`,
        404
      );
    }

    res.json({
      data: {
        template,
        version,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/templates/:id/versions/:version - Public endpoint for published version only
templatesRouter.get('/:id/versions/:version', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, version } = req.params;
    const requestedLang = (req.query.language as string) || 'gu';
    const lang = requestedLang === 'en' ? 'en' : 'gu';
    const versionNum = parseInt(version, 10);

    if (!Types.ObjectId.isValid(id) || isNaN(versionNum)) {
      throw new JanDastavejError('VALIDATION_ERROR', 'Invalid template ID or version number', 400);
    }

    // Public endpoint: MUST filter status = 'published'
    const versionDoc = await TemplateVersionModel.findOne({
      templateId: id,
      version: versionNum,
      language: lang,
      status: 'published',
    })
      .select('-__v')
      .lean();

    if (!versionDoc) {
      throw new JanDastavejError(
        'NOT_FOUND',
        `Published template version ${version} in language '${lang}' not found`,
        404
      );
    }

    res.json({
      data: versionDoc,
    });
  } catch (err) {
    next(err);
  }
});
