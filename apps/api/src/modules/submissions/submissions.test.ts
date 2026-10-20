import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, disconnectDB } from '../../config/db.js';
import { DocumentSubmissionModel } from '../../models/DocumentSubmission.js';
import { TemplateModel } from '../../models/Template.js';
import { TemplateVersionModel } from '../../models/TemplateVersion.js';

let adminCookie: string;

beforeAll(async () => {
  await connectDB();

  // Login as admin
  const adminRes = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({
      email: 'admin@jandastavej.local',
      password: 'DemoAdminPass123!',
    });
  expect(adminRes.status).toBe(200);
  const adminCookies = adminRes.headers['set-cookie'];
  adminCookie = Array.isArray(adminCookies) ? adminCookies[0] : adminCookies;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Document Submission, AI Scanning & Admin Approval Pipeline', () => {
  let createdSubmissionId: string;
  let publishedSlug: string;

  it('allows citizen to submit a document format and triggers AI scan', async () => {
    const sampleText = `સોગંદનામું (રેશન કાર્ડમાં સભ્યનું નામ ઉમેરવા બાબત)
હું નીચે સહી કરનાર શ્રી રમણલાલ ચતુરભાઈ શાહ
ઉંમર વર્ષ: ૪૨, ધંધો: વેપાર
રહેવાસી: પ્લોટ ૧૨, સેક્ટર ૨૧, ગાંધીનગર
રેશન કાર્ડ નંબર: 072501234567

આથી સોગંદપૂર્વક એકરાર કરું છું કે મારા રેશન કાર્ડમાં સભ્યનું નામ ઉમેરવાનું બાકી છે.
તારીખ: ૨૦૨૬-૧૦-૨૦
સ્થળ: ગાંધીનગર`;

    const res = await request(app)
      .post('/api/v1/submissions')
      .send({
        documentTitle: 'રેશન કાર્ડ સભ્ય ઉમેરણ સોગંદનામું',
        documentText: sampleText,
        category: 'affidavit',
        submitterName: 'Ramanlal Shah',
        submitterEmail: 'ramanlal@example.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.submissionId).toBeDefined();
    expect(res.body.data.status).toBe('scanned');

    const scan = res.body.data.aiScanResult;
    expect(scan).toBeDefined();
    expect(scan.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(scan.detectedCategory).toBe('affidavit');
    expect(scan.extractedFields.length).toBeGreaterThanOrEqual(4);

    // Verify key fields extracted
    const fieldKeys = scan.extractedFields.map((f: any) => f.key);
    expect(fieldKeys).toContain('deponentName');
    expect(fieldKeys).toContain('declarationDate');
    expect(fieldKeys).toContain('place');

    createdSubmissionId = res.body.data.submissionId;
  });

  it('allows admin to view submitted document and AI scan results', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/submissions/${createdSubmissionId}`)
      .set('Cookie', [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(createdSubmissionId);
    expect(res.body.data.documentTitle).toBe('રેશન કાર્ડ સભ્ય ઉમેરણ સોગંદનામું');
    expect(res.body.data.aiScanResult).toBeDefined();
  });

  it('allows admin to approve submission and publish it live on the site', async () => {
    publishedSlug = `ration-card-test-${Date.now()}`;

    const res = await request(app)
      .post(`/api/v1/admin/submissions/${createdSubmissionId}/approve`)
      .set('Cookie', [adminCookie])
      .send({
        slug: publishedSlug,
        title: 'Ration Card Member Addition Affidavit',
        titleGu: 'રેશન કાર્ડમાં સભ્યનું નામ ઉમેરવા અંગેનું સોગંદનામું',
        category: 'affidavit',
        description: 'Standard format for adding a member to an existing ration card',
        descriptionGu: 'હયાત રેશન કાર્ડમાં નવા સભ્યનું નામ ઉમેરવા માટેનું સોગંદનામું',
        purpose: 'Official verification before Food & Civil Supplies Department',
        purposeGu: 'અન્ન અને નાગરિક પુરવઠા વિભાગ સમક્ષ રજૂ કરવા સારું',
        layoutKey: 'sample_affidavit',
        fields: [
          { key: 'deponentName', label: 'Deponent Name', labelGu: 'સોગંદ લેનારનું નામ', type: 'text', required: true },
          { key: 'parentSpouseName', label: 'Father/Husband Name', labelGu: 'પિતા/પતિનું નામ', type: 'text', required: true },
          { key: 'rationCardNumber', label: 'Ration Card Number', labelGu: 'રેશન કાર્ડ નંબર', type: 'text', required: true },
          { key: 'declarationDate', label: 'Date', labelGu: 'તારીખ', type: 'date', required: true },
          { key: 'place', label: 'Place', labelGu: 'સ્થળ', type: 'text', required: true },
        ],
        requiredDocuments: ['Aadhaar Card', 'Old Ration Card Copy'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.template).toBeDefined();
    expect(res.body.data.template.slug).toBe(publishedSlug);
    expect(res.body.data.version.status).toBe('published');
    expect(res.body.data.submission.status).toBe('approved');

    // Clean up created test template in DB
    const templateId = res.body.data.template._id;
    await TemplateVersionModel.deleteMany({ templateId });
    await TemplateModel.findByIdAndDelete(templateId);
    await DocumentSubmissionModel.findByIdAndDelete(createdSubmissionId);
  });
});
