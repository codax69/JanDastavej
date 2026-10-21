import { Router, Request, Response, NextFunction } from 'express';
import { JanDastavejError } from '@jandastavej/shared';
import { ServiceModel, IService } from '../../models/Service.js';
import { TemplateModel } from '../../models/Template.js';

export const servicesRouter = Router();

// GET /api/v1/services - Searchable & filterable directory of citizen services
servicesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, department, search, language = 'gu' } = req.query;

    const query: Record<string, any> = { status: 'active' };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { titleGu: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { descriptionGu: { $regex: q, $options: 'i' } },
        { department: { $regex: q, $options: 'i' } },
        { departmentGu: { $regex: q, $options: 'i' } },
      ];
    }

    const services = await ServiceModel.find(query).sort({ title: 1 }).lean();

    const formatted = services.map((s) => ({
      _id: String(s._id),
      slug: s.slug,
      title: s.title,
      titleGu: s.titleGu,
      department: s.department,
      departmentGu: s.departmentGu,
      category: s.category,
      jurisdiction: s.jurisdiction,
      effectiveDate: s.effectiveDate,
      verificationStatus: s.verificationStatus,
      sourceReference: s.sourceReference,
      description: s.description,
      descriptionGu: s.descriptionGu,
      purpose: s.purpose,
      purposeGu: s.purposeGu,
      requiredDocumentCount: s.requiredTemplates?.length || 0,
      status: s.status,
      isDemoOnly: s.isDemoOnly,
      updatedAt: s.updatedAt,
    }));

    res.json({
      data: formatted,
      meta: {
        total: formatted.length,
        language,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/services/:slug - Individual service detail page with document checklist
servicesRouter.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { language = 'gu' } = req.query;

    const service = await ServiceModel.findOne({ slug, status: 'active' }).lean();

    if (!service) {
      throw new JanDastavejError('NOT_FOUND', `Service '${slug}' was not found.`, 404);
    }

    // Resolve template details for the required templates
    const templateSlugs = service.requiredTemplates.map((t) => t.templateSlug);
    const templates = await TemplateModel.find({
      slug: { $in: templateSlugs },
      status: 'active',
    }).lean();

    const templateMap = new Map(templates.map((t) => [t.slug, t]));

    const enrichedTemplates = service.requiredTemplates.map((reqItem) => {
      const tpl = templateMap.get(reqItem.templateSlug);
      return {
        ...reqItem,
        templateId: tpl ? String(tpl._id) : undefined,
        category: tpl?.category || reqItem.category,
        description: tpl ? (language === 'gu' ? tpl.descriptionGu : tpl.description) : '',
        purpose: tpl ? (language === 'gu' ? tpl.purposeGu : tpl.purpose) : '',
        supportedLanguages: tpl?.supportedLanguages || ['gu', 'en'],
      };
    });

    res.json({
      data: {
        _id: String(service._id),
        slug: service.slug,
        title: service.title,
        titleGu: service.titleGu,
        department: service.department,
        departmentGu: service.departmentGu,
        category: service.category,
        jurisdiction: service.jurisdiction,
        effectiveDate: service.effectiveDate,
        verificationStatus: service.verificationStatus,
        sourceReference: service.sourceReference,
        description: service.description,
        descriptionGu: service.descriptionGu,
        purpose: service.purpose,
        purposeGu: service.purposeGu,
        steps: service.steps,
        stepsGu: service.stepsGu,
        requiredTemplates: enrichedTemplates,
        supportingDocuments: service.supportingDocuments,
        status: service.status,
        isDemoOnly: service.isDemoOnly,
        updatedAt: service.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});
