import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, disconnectDB } from '../../config/db.js';
import { TemplateModel } from '../../models/Template.js';
import { TemplateVersionModel } from '../../models/TemplateVersion.js';
import { closePdfWorker } from '../pdf/pdf.service.js';

let publishedVersionId: string;

beforeAll(async () => {
  await connectDB();
  const template = await TemplateModel.findOne({ slug: 'sample-declaration' }).lean();
  const version = await TemplateVersionModel.findOne({
    templateId: template!._id,
    language: 'gu',
    status: 'published',
  }).lean();
  publishedVersionId = String(version!._id);
});

afterAll(async () => {
  await closePdfWorker();
  await disconnectDB();
});

describe('Generations API', () => {
  it('validates answers against published template schema', async () => {
    const invalidRes = await request(app)
      .post('/api/v1/generations/validate')
      .send({
        templateVersionId: publishedVersionId,
        answers: {},
        language: 'gu',
      });

    expect(invalidRes.status).toBe(200);
    expect(invalidRes.body.isValid).toBe(false);
    expect(invalidRes.body.errors.fullName).toBeDefined();

    const validRes = await request(app)
      .post('/api/v1/generations/validate')
      .send({
        templateVersionId: publishedVersionId,
        answers: {
          fullName: 'પ્રિતેશ પટેલ',
          parentSpouseName: 'કાંતિભાઈ પટેલ',
          age: 32,
          occupation: 'ખેતી',
          address: 'ગાંધીનગર',
          declarationPurpose: 'સરકારી યોજના માટે',
          declarationDate: '2026-10-20',
          place: 'ગાંધીનગર',
        },
        language: 'gu',
      });

    expect(validRes.status).toBe(200);
    expect(validRes.body.isValid).toBe(true);
    expect(Object.keys(validRes.body.errors).length).toBe(0);
  });

  it('creates short-lived preview session and escapes dangerous HTML', async () => {
    const res = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: publishedVersionId,
        answers: {
          fullName: 'પ્રિતેશ <script>alert("hack")</script>',
          parentSpouseName: 'કાંતિભાઈ',
          age: 30,
          occupation: 'વેપાર',
          address: 'સેક્ટર ૨૧, ગાંધીનગર',
          declarationPurpose: 'આવકનો દાખલો મેળવવા અર્થે',
          declarationDate: '2026-10-20',
          place: 'ગાંધીનગર',
        },
        language: 'gu',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.previewHtml).toBeDefined();
    expect(res.body.data.isDemoOnly).toBe(true);

    // Verify XSS prevention: <script> MUST be escaped!
    expect(res.body.data.previewHtml).not.toContain('<script>');
    expect(res.body.data.previewHtml).toContain('&lt;script&gt;');
  });

  it('rejects PDF generation without explicit legal disclaimer acceptance', async () => {
    // 1. Create session
    const previewRes = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: publishedVersionId,
        answers: {
          fullName: 'હરેશભાઈ પટેલ',
          parentSpouseName: 'વિઠ્ઠલભાઈ',
          age: 45,
          occupation: 'નોકરી',
          address: 'ગાંધીનગર',
          declarationPurpose: 'સામાન્ય વહીવટી ઉપયોગ',
          declarationDate: '2026-10-20',
          place: 'ગાંધીનગર',
        },
        language: 'gu',
      });

    const sessionId = previewRes.body.data.sessionId;

    // 2. Attempt PDF without disclaimer acceptance
    const rejectRes = await request(app)
      .post('/api/v1/generations/pdf')
      .send({
        sessionId,
        disclaimerAccepted: false,
      });

    expect(rejectRes.status).toBe(400);
    expect(rejectRes.body.error.code).toBe('VALIDATION_ERROR');

    // 3. Attempt PDF with valid disclaimer acceptance
    const acceptRes = await request(app)
      .post('/api/v1/generations/pdf')
      .send({
        sessionId,
        disclaimerAccepted: true,
      });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.headers['content-type']).toBe('application/pdf');
    expect(acceptRes.body).toBeInstanceOf(Buffer);
    expect(acceptRes.body.length).toBeGreaterThan(1000);
  });
});

describe('Stage 6: Gujarati Font & Regression Strings (TRD §10)', () => {
  it('correctly renders complex Gujarati conjuncts and long multi-line text in PDF', async () => {
    const gujaratiTestStrings = {
      fullName: 'શ્રીમતી ક્ષત્રિય જ્ઞાનદાબેન દસ્તાવેજવાળા',
      parentSpouseName: 'સ્વ. પ્રહલાદભાઈ ક્ષત્રિય',
      age: 48,
      occupation: 'સરકારી સેવા અને સામાજિક કાર્યકર',
      address: 'બ્લોક નં. ૪૫/બી, ઘ-૫ સર્કલ પાસે, શ્રીનાથજી સોસાયટી, સેક્ટર ૨૮, ગાંધીનગર, ગુજરાત - ૩૮૨૦૨૮\n(કાયમી રહેઠાણ પુરાવા સાથે)',
      declarationPurpose: 'પ્રતિજ્ઞાપત્ર અને ઘોષણાપત્ર ચકાસણી હેતુ: આથી હું જાહેર કરું છું કે મારૂં પૂર્ણ નામ, સરનામું અને તારીખ સાચાં છે.',
      declarationDate: '2026-10-20',
      place: 'ગાંધીનગર',
    };

    const previewRes = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: publishedVersionId,
        answers: gujaratiTestStrings,
        language: 'gu',
      });

    expect(previewRes.status).toBe(200);
    const html = previewRes.body.data.previewHtml;

    // Check all TRD §10 test strings are present in rendered output
    expect(html).toContain('શ્રીમતી');
    expect(html).toContain('ક્ષત્રિય');
    expect(html).toContain('જ્ઞાનદાબેન');
    expect(html).toContain('દસ્તાવેજ');
    expect(html).toContain('પ્રતિજ્ઞાપત્ર');
    expect(html).toContain('ઘોષણાપત્ર');
    expect(html).toContain('પૂર્ણ નામ');
    expect(html).toContain('સરનામું');
    expect(html).toContain('તારીખ');

    // Generate PDF with these strings
    const pdfRes = await request(app)
      .post('/api/v1/generations/pdf')
      .send({
        sessionId: previewRes.body.data.sessionId,
        disclaimerAccepted: true,
      });

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.body.length).toBeGreaterThan(15000);
  });
});
