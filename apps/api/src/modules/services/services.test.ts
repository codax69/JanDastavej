import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, disconnectDB } from '../../config/db.js';

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await disconnectDB();
});

describe('Services API', () => {
  it('GET /api/v1/services returns list of citizen services', async () => {
    const res = await request(app).get('/api/v1/services');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);

    const incomeService = res.body.data.find((s: any) => s.slug === 'income-certificate-service');
    expect(incomeService).toBeDefined();
    expect(incomeService.titleGu).toContain('આવક');
    expect(incomeService.department).toBe('Revenue Department');
    expect(incomeService.requiredDocumentCount).toBeGreaterThanOrEqual(2);
    expect(incomeService.verificationStatus).toBe('verified_sample');
  });

  it('GET /api/v1/services?category=revenue filters by category', async () => {
    const res = await request(app).get('/api/v1/services?category=revenue');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    for (const s of res.body.data) {
      expect(s.category).toBe('revenue');
    }
  });

  it('GET /api/v1/services?search=domicile finds domicile service', async () => {
    const res = await request(app).get('/api/v1/services?search=domicile');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].slug).toBe('domicile-certificate-service');
  });

  it('GET /api/v1/services/:slug returns service details and enriched checklist', async () => {
    const res = await request(app).get('/api/v1/services/income-certificate-service?language=gu');
    expect(res.status).toBe(200);
    const service = res.body.data;
    expect(service.slug).toBe('income-certificate-service');
    expect(service.requiredTemplates).toBeInstanceOf(Array);
    expect(service.requiredTemplates.length).toBeGreaterThanOrEqual(2);

    const mandatoryTpl = service.requiredTemplates.find((t: any) => t.isMandatory);
    expect(mandatoryTpl).toBeDefined();
    expect(mandatoryTpl.templateTitleGu).toBeDefined();

    expect(service.supportingDocuments).toBeInstanceOf(Array);
    expect(service.supportingDocuments.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 404 for nonexistent service', async () => {
    const res = await request(app).get('/api/v1/services/nonexistent-service');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/v1/generations/service-bundle creates multi-document generation sessions', async () => {
    const res = await request(app)
      .post('/api/v1/generations/service-bundle')
      .send({
        serviceSlug: 'income-certificate-service',
        language: 'gu',
        answers: {
          fullName: 'રમેશભાઈ કાંતિભાઈ પટેલ',
          parentSpouseName: 'કાંતિભાઈ પટેલ',
          age: 44,
          occupation: 'ખેતી',
          address: 'પ્લોટ ૧૨, સેક્ટર ૭, ગાંધીનગર',
          annualIncome: 150000,
          incomeSource: 'ખેતી',
          declarationPurpose: 'આવકના દાખલા મેળવવા માટે.',
          declarationDate: '2026-10-21',
          place: 'ગાંધીનગર',
        },
        selectedTemplateSlugs: ['sample-declaration', 'income-declaration'],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sessions.length).toBe(2);
    expect(res.body.data.combinedHtml).toContain('સ્વ-ઘોષણાપત્ર');
    expect(res.body.data.combinedHtml).toContain('કુટુંબની વાર્ષિક આવક');

    const firstSession = res.body.data.sessions[0];
    expect(firstSession.sessionId).toBeDefined();

    // Verify DOCX export on that session
    const docxRes = await request(app).get(`/api/v1/generations/${firstSession.sessionId}/docx`);
    expect(docxRes.status).toBe(200);
    expect(docxRes.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument');
    expect(Number(docxRes.headers['content-length'])).toBeGreaterThan(1000);
  });
});
