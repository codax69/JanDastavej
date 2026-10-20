import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, disconnectDB } from '../../config/db.js';
import { TemplateModel } from '../../models/Template.js';
import { TemplateVersionModel } from '../../models/TemplateVersion.js';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Templates API', () => {
  it('GET /api/v1/templates returns list of published templates', async () => {
    const res = await request(app).get('/api/v1/templates');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    for (const tpl of res.body.data) {
      expect(tpl.status).toBe('active');
      expect(tpl.isDemoOnly).toBe(true);
      expect(tpl.currentPublishedVersionId).toBeDefined();
    }
  });

  it('filters templates by category', async () => {
    const res = await request(app).get('/api/v1/templates?category=declaration');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    for (const tpl of res.body.data) {
      expect(tpl.category).toBe('declaration');
    }
  });

  it('filters templates by search term', async () => {
    const res = await request(app).get('/api/v1/templates?search=affidavit');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    const found = res.body.data.some((t: any) => t.slug === 'sample-affidavit');
    expect(found).toBe(true);
  });

  it('GET /api/v1/templates/:slug returns template and published version', async () => {
    const res = await request(app).get('/api/v1/templates/sample-declaration?language=gu');
    expect(res.status).toBe(200);
    expect(res.body.data.template).toBeDefined();
    expect(res.body.data.template.slug).toBe('sample-declaration');
    expect(res.body.data.version).toBeDefined();
    expect(res.body.data.version.status).toBe('published');
    expect(res.body.data.version.language).toBe('gu');
    expect(res.body.data.version.fields.length).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/v1/templates/:slug with language=en returns English version', async () => {
    const res = await request(app).get('/api/v1/templates/sample-declaration?language=en');
    expect(res.status).toBe(200);
    expect(res.body.data.version.language).toBe('en');
  });

  it('returns 404 with error envelope for non-existent template', async () => {
    const res = await request(app).get('/api/v1/templates/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.requestId).toBeDefined();
  });

  it('does NOT expose draft or unpublished templates on public endpoint', async () => {
    // Create temporary draft template without published version
    const draftTpl = await TemplateModel.create({
      slug: 'test-draft-hidden',
      title: 'Draft Secret Template',
      titleGu: 'ગુપ્ત ડ્રાફ્ટ',
      description: 'Internal draft',
      descriptionGu: 'આંતરિક ડ્રાફ્ટ',
      category: 'general',
      supportedLanguages: ['gu'],
      status: 'active',
      isDemoOnly: true,
    });

    await TemplateVersionModel.create({
      templateId: draftTpl._id,
      version: 1,
      language: 'gu',
      fields: [{ key: 'name', label: 'Name', type: 'text', required: true }],
      layoutKey: 'sample_declaration',
      sourceReference: 'Draft',
      status: 'draft', // Not published!
    });

    const res = await request(app).get('/api/v1/templates');
    expect(res.status).toBe(200);
    const leaked = res.body.data.find((t: any) => t.slug === 'test-draft-hidden');
    expect(leaked).toBeUndefined();

    // Clean up
    await TemplateVersionModel.deleteMany({ templateId: draftTpl._id });
    await TemplateModel.findByIdAndDelete(draftTpl._id);
  });
});
