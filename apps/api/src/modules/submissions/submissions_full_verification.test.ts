import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, disconnectDB } from '../../config/db.js';
import { DocumentSubmissionModel } from '../../models/DocumentSubmission.js';
import { TemplateModel } from '../../models/Template.js';
import { TemplateVersionModel } from '../../models/TemplateVersion.js';
import { IssueReportModel } from '../../models/IssueReport.js';
import { CitizenUserModel } from '../../models/CitizenUser.js';

let adminCookie: string;
let citizen1Cookie: string;
let citizen2Cookie: string;
let citizen1Id: string;
let citizen2Id: string;

beforeAll(async () => {
  await connectDB();

  // 1. Admin login
  const adminRes = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({
      email: 'admin@jandastavej.local',
      password: 'DemoAdminPass123!',
    });
  expect(adminRes.status).toBe(200);
  const adminCookies = adminRes.headers['set-cookie'];
  adminCookie = Array.isArray(adminCookies) ? adminCookies[0] : adminCookies;

  // 2. Citizen 1 creation / session (email: citizen1@example.com)
  const c1 = await CitizenUserModel.findOneAndUpdate(
    { identifier: 'citizen1@example.com' },
    { identifier: 'citizen1@example.com', identifierType: 'email', name: 'Citizen One' },
    { upsert: true, new: true }
  );
  citizen1Id = String(c1._id);
  const payload1 = Buffer.from(JSON.stringify({ userId: citizen1Id })).toString('base64');
  citizen1Cookie = `jd_citizen_session=${payload1}; Path=/; HttpOnly`;

  // 3. Citizen 2 creation / session (email: citizen2@example.com)
  const c2 = await CitizenUserModel.findOneAndUpdate(
    { identifier: 'citizen2@example.com' },
    { identifier: 'citizen2@example.com', identifierType: 'email', name: 'Citizen Two' },
    { upsert: true, new: true }
  );
  citizen2Id = String(c2._id);
  const payload2 = Buffer.from(JSON.stringify({ userId: citizen2Id })).toString('base64');
  citizen2Cookie = `jd_citizen_session=${payload2}; Path=/; HttpOnly`;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Section 15: 20 Acceptance Criteria End-to-End Test Suite', () => {
  let candidateSubmissionId: string;
  let publishedSlug: string;
  let testTemplateId: string;

  // Test 1: A citizen uploads a supported candidate template
  it('1. Citizen uploads candidate template format with metadata', async () => {
    const legalText = `સોગંદનામું (રેશન કાર્ડમાં સભ્ય ઉમેરવા બાબત)
હું નીચે સહી કરનાર શ્રી રમેશભાઈ પટેલ
પિતાનું નામ: કાંતિભાઈ પટેલ
ઉંમર વર્ષ: ૪૨, વ્યવસાય: વેપાર
રહેવાસી: સેક્ટર ૨૧, ગાંધીનગર
આધાર નંબર: 1234 5678 9012
આથી સોગંદપૂર્વક એકરાર કરું છું કે રેશન કાર્ડમાં નામ ઉમેરવાનું બાકી છે.
તારીખ: ૨૦૨૬-૧૦-૨૧
સ્થળ: ગાંધીનગર
સહી: ___________________`;

    const res = await request(app)
      .post('/api/v1/submissions')
      .set('Cookie', [citizen1Cookie])
      .send({
        documentTitle: 'રેશન કાર્ડ સભ્ય ઉમેરણ ઉમેદવારી ફોર્મેટ',
        documentText: legalText,
        category: 'affidavit',
        sourceUrl: 'https://gandhinagar.gujarat.gov.in/ration-service',
        sourceDescription: 'Collector Office Gandhinagar Citizen Portal SOP',
        jurisdiction: 'Gujarat (District: Gandhinagar)',
        language: 'gu',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.submissionId).toBeDefined();
    expect(res.body.data.status).toBe('ai_review_ready');
    expect(res.body.data.aiScanResult).toBeDefined();
    candidateSubmissionId = res.body.data.submissionId;
  });

  // Test 2: The submission remains private and unpublished
  it('2. Uploaded candidate submission remains private and unpublished', async () => {
    const publicListRes = await request(app).get('/api/v1/templates');
    expect(publicListRes.status).toBe(200);

    const publicTitles = publicListRes.body.data.map((t: any) => t.title);
    expect(publicTitles).not.toContain('રેશન કાર્ડ સભ્ય ઉમેરણ ઉમેદવારી ફોર્મેટ');
  });

  // Test 3: The verification pipeline extracts content or reports extraction failure
  it('3. Verification pipeline extracts content or reports extraction failure', async () => {
    // Test extraction failure on empty or corrupted text
    const failedRes = await request(app)
      .post('/api/v1/submissions')
      .send({
        documentTitle: 'Short Failed Doc',
        documentText: 'Too short',
        category: 'declaration',
      });

    expect(failedRes.status).toBe(201);
    expect(failedRes.body.data.status).toBe('extraction_failed');
    expect(failedRes.body.data.aiScanResult.verificationStatus).toBe('EXTRACTION_FAILED');
  });

  // Test 4: The AI report contains findings and source-verification status
  it('4. AI report contains structural findings, PII masking, and source-verification status', async () => {
    const sub = await DocumentSubmissionModel.findById(candidateSubmissionId).lean();
    expect(sub).toBeDefined();

    const scan = (sub as any).aiScanResult;
    expect(scan).toBeDefined();
    expect(scan.sourceFindings).toBeDefined();
    expect(scan.structuralFindings).toBeDefined();
    expect(scan.piiFindings.length).toBeGreaterThanOrEqual(1); // Aadhaar was masked
    expect(scan.pipelineVersion).toBe('2.1.0-audit-verified');
  });

  // Test 5: A reviewer can inspect the original file and report
  it('5. Reviewer inspects original document content and AI verification report', async () => {
    const res = await request(app)
      .get(`/api/v1/admin/submissions/${candidateSubmissionId}`)
      .set('Cookie', [adminCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(candidateSubmissionId);
    expect(res.body.data.documentText).toContain('સોગંદનામું');
    expect(res.body.data.aiScanResult).toBeDefined();
  });

  // Test 6: A reviewer requests corrections and the submitter can respond
  it('6. Reviewer requests corrections and submitter responds with resubmission', async () => {
    // Step A: Reviewer requests correction
    const reqCorrRes = await request(app)
      .post(`/api/v1/admin/submissions/${candidateSubmissionId}/request-correction`)
      .set('Cookie', [adminCookie])
      .send({ notes: 'Please add explicit penalty declaration clause under IPC section.' });

    expect(reqCorrRes.status).toBe(200);
    expect(reqCorrRes.body.data.status).toBe('needs_correction');

    // Step B: Citizen resubmits with correction
    const updatedText = `સોગંદનામું (રેશન કાર્ડમાં સભ્ય ઉમેરવા બાબત)
હું નીચે સહી કરનાર શ્રી રમેશભાઈ પટેલ
પિતાનું નામ: કાંતિભાઈ પટેલ
ઉંમર વર્ષ: ૪૨, વ્યવસાય: વેપાર
રહેવાસી: સેક્ટર ૨૧, ગાંધીનગર
આધાર નંબર: 1234 5678 9012
ખોટી વિગત રજૂ કરવા બદલ હું કાયદેસરની ફોજદારી કાર્યવાહીને પાત્ર રહીશ.
તારીખ: ૨૦૨૬-૧૦-૨૧
સ્થળ: ગાંધીનગર
સહી: ___________________`;

    const resubmitRes = await request(app)
      .patch(`/api/v1/submissions/${candidateSubmissionId}`)
      .set('Cookie', [citizen1Cookie])
      .send({
        documentText: updatedText,
        additionalNotes: 'Added penalty clause as requested by reviewer.',
      });

    expect(resubmitRes.status).toBe(200);
    expect(resubmitRes.body.data.status).toBe('ai_review_ready');
    expect(resubmitRes.body.data.resubmissionCount).toBe(1);
  });

  // Test 7: An authorized reviewer approves a suitable template
  it('7. Authorized reviewer approves template format', async () => {
    publishedSlug = `ration-card-approved-${Date.now()}`;

    const res = await request(app)
      .post(`/api/v1/admin/submissions/${candidateSubmissionId}/approve`)
      .set('Cookie', [adminCookie])
      .send({
        slug: publishedSlug,
        title: 'Ration Card Addition Verified Format',
        titleGu: 'રેશન કાર્ડ સભ્ય ઉમેરણ સત્તાવાર સોગંદનામું',
        category: 'affidavit',
        description: 'Verified affidavit for adding member to ration card in Gandhinagar',
        descriptionGu: 'ગાંધીનગર જિલ્લામાં રેશન કાર્ડમાં નામ ઉમેરવા માટેનું માન્ય સોગંદનામું',
        layoutKey: 'sample_affidavit',
        fields: [
          { key: 'deponentName', label: 'Deponent Name', labelGu: 'સોગંદ લેનારનું નામ', type: 'text', required: true },
          { key: 'parentSpouseName', label: 'Father Name', labelGu: 'પિતાનું નામ', type: 'text', required: true },
          { key: 'age', label: 'Age', labelGu: 'ઉંમર', type: 'number', required: true },
          { key: 'deponentAddress', label: 'Address', labelGu: 'સરનામું', type: 'textarea', required: true },
          { key: 'purpose', label: 'Purpose', labelGu: 'હેતુ', type: 'text', required: true },
          { key: 'declarationDate', label: 'Date', labelGu: 'તારીખ', type: 'date', required: true },
          { key: 'place', label: 'Place', labelGu: 'સ્થળ', type: 'text', required: true },
        ],
        requiredDocuments: ['Aadhaar Card', 'Ration Card'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.template.slug).toBe(publishedSlug);
    expect(res.body.data.version.status).toBe('published');
    expect(res.body.data.submission.status).toBe('approved');
    testTemplateId = res.body.data.template._id;
  });

  // Test 8: An unauthorized user cannot approve or publish it
  it('8. Unauthorized user cannot approve or publish templates', async () => {
    const unauthRes = await request(app)
      .post(`/api/v1/admin/submissions/${candidateSubmissionId}/approve`)
      .send({
        title: 'Hacked Template',
        titleGu: 'હેક કરેલ',
        category: 'affidavit',
        fields: [{ key: 'hacked', label: 'Hacked', type: 'text' }],
      });

    expect([401, 403]).toContain(unauthRes.status);
  });

  // Test 9: The approved template is published and appears in public search
  it('9. Approved template appears in public search catalog', async () => {
    const res = await request(app).get(`/api/v1/templates?search=${publishedSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].slug).toBe(publishedSlug);
  });

  // Test 10: A rejected or unpublished template does not appear in public discovery
  it('10. Rejected or unpublished template does not appear in public discovery', async () => {
    // Create rejected submission
    const rejSub = await DocumentSubmissionModel.create({
      documentTitle: 'Rejected Secret Draft',
      documentText: 'Some unapproved draft text for testing privacy.',
      status: 'rejected',
      rejectionReason: 'Not statutory format.',
    });

    const publicList = await request(app).get('/api/v1/templates?search=Rejected');
    expect(publicList.status).toBe(200);
    const found = publicList.body.data.find((t: any) => t.title.includes('Rejected Secret Draft'));
    expect(found).toBeUndefined();

    await DocumentSubmissionModel.findByIdAndDelete(rejSub._id);
  });

  // Test 11: A citizen selects a published template and fills a basic form
  it('11. Citizen selects published template and creates generation session', async () => {
    const version = (await TemplateVersionModel.findOne({ templateId: testTemplateId, status: 'published' }).lean()) as any;
    expect(version).toBeDefined();

    const res = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: String(version!._id),
        answers: {
          deponentName: 'પ્રિતેશકુમાર પટેલ',
          parentSpouseName: 'કાંતિલાલ પટેલ',
          age: 38,
          deponentAddress: 'પ્લોટ નં. ૨૩, સેક્ટર ૨૧, ગાંધીનગર',
          purpose: 'રેશન કાર્ડ નામ સુધારણા',
          declarationDate: '2026-10-21',
          place: 'ગાંધીનગર',
        },
        language: 'gu',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.sessionId).toBeDefined();
    expect(res.body.data.previewHtml).toContain('પ્રિતેશકુમાર પટેલ');
  });

  // Test 12: The same personal information can populate multiple related documents
  it('12. Reusable citizen details populate multiple documents simultaneously in bundle', async () => {
    const bundleRes = await request(app)
      .post('/api/v1/generations/service-bundle')
      .send({
        serviceSlug: 'income-certificate-service',
        language: 'gu',
        selectedTemplateSlugs: ['sample-declaration', 'income-declaration'],
        answers: {
          applicantName: 'હરેશભાઈ મગનભાઈ પરમાર',
          deponentName: 'હરેશભાઈ મગનભાઈ પરમાર',
          parentSpouseName: 'મગનભાઈ પરમાર',
          age: 45,
          currentAddress: 'સેક્ટર ૭, ગાંધીનગર',
          deponentAddress: 'સેક્ટર ૭, ગાંધીનગર',
          annualIncome: 95000,
          purpose: 'સરકારી સહાય',
          place: 'ગાંધીનગર',
          declarationDate: '2026-10-21',
        },
      });

    expect(bundleRes.status).toBe(200);
    expect(bundleRes.body.data.sessions.length).toBeGreaterThanOrEqual(2);
    expect(bundleRes.body.data.sessions[0].answers.deponentName).toBe('હરેશભાઈ મગનભાઈ પરમાર');
    expect(bundleRes.body.data.sessions[1].answers.deponentName).toBe('હરેશભાઈ મગનભાઈ પરમાર');
  });

  // Test 13: The user previews, downloads and prints a valid document
  it('13. User generates and downloads valid PDF document', async () => {
    const version = (await TemplateVersionModel.findOne({ templateId: testTemplateId, status: 'published' }).lean()) as any;

    const sessionRes = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: String(version!._id),
        answers: {
          deponentName: 'અજયકુમાર જોષી',
          parentSpouseName: 'વિષ્ણુભાઈ જોષી',
          age: 32,
          deponentAddress: 'ગાંધીનગર',
          purpose: 'પ્રમાણપત્ર અરજી',
          declarationDate: '2026-10-21',
          place: 'ગાંધીનગર',
        },
        language: 'gu',
      });

    const sessionId = sessionRes.body.data.sessionId;

    const pdfRes = await request(app)
      .post('/api/v1/generations/pdf')
      .send({ sessionId, disclaimerAccepted: true });

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.body.slice(0, 4).toString()).toBe('%PDF');
  });

  // Test 14: Generated output contains no unresolved placeholders
  it('14. Generated output contains no unresolved placeholders', async () => {
    const version = (await TemplateVersionModel.findOne({ templateId: testTemplateId, status: 'published' }).lean()) as any;

    const sessionRes = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: String(version!._id),
        answers: {
          deponentName: 'વિપુલ શાહ',
          parentSpouseName: 'નવીન શાહ',
          age: 40,
          deponentAddress: 'સેક્ટર ૨૨, ગાંધીનગર',
          purpose: 'વેરિફિકેશન',
          declarationDate: '2026-10-21',
          place: 'ગાંધીનગર',
        },
        language: 'gu',
      });

    const html = sessionRes.body.data.previewHtml;
    expect(html).not.toMatch(/_{4,}/); // No unresolved blanks
    expect(html).not.toContain('{{'); // No unresolved template curly brackets
  });

  // Test 15: Gujarati text renders correctly where supported
  it('15. Gujarati Unicode text renders correctly in document output', async () => {
    const version = (await TemplateVersionModel.findOne({ templateId: testTemplateId, status: 'published' }).lean()) as any;

    const gujText = 'જયેશભાઈ કાંતિભાઈ સોલંકી';
    const sessionRes = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: String(version!._id),
        answers: {
          deponentName: gujText,
          parentSpouseName: 'કાંતિભાઈ સોલંકી',
          age: 50,
          deponentAddress: 'ગાંધીનગર',
          purpose: 'સરકારી કામકાજ',
          declarationDate: '2026-10-21',
          place: 'ગાંધીનગર',
        },
        language: 'gu',
      });

    expect(sessionRes.body.data.previewHtml).toContain(gujText);
  });

  // Test 16: Private submissions and reviewer notes remain inaccessible to other users
  it('16. Private submissions remain inaccessible to other citizens (403 Forbidden)', async () => {
    // Citizen 2 attempts to access Citizen 1's candidate submission
    const res = await request(app)
      .get(`/api/v1/submissions/${candidateSubmissionId}`)
      .set('Cookie', [citizen2Cookie]);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // Test 17: Template revisions preserve their history
  it('17. Template revisions preserve chronological version records', async () => {
    // Add version 2 to test template
    const v2 = await TemplateVersionModel.create({
      templateId: testTemplateId,
      version: 2,
      language: 'gu',
      fields: [{ key: 'applicantName', label: 'Name', type: 'text', minLength: 0, maxLength: 500 }],
      layoutKey: 'sample_declaration',
      sourceReference: 'Updated District Gazetted SOP 2026',
      status: 'published',
    });

    const versions = await TemplateVersionModel.find({ templateId: testTemplateId }).sort({ version: 1 }).lean();
    expect(versions.length).toBeGreaterThanOrEqual(2);
    expect(versions[0].version).toBe(1);
    expect(versions[1].version).toBe(2);

    await TemplateVersionModel.findByIdAndDelete(v2._id);
  });

  // Test 18: Outdated templates can be flagged, superseded or withdrawn
  it('18. Outdated templates can be reported, archived, or superseded', async () => {
    // Step A: Public citizen reports issue on template
    const reportRes = await request(app)
      .post(`/api/v1/templates/${publishedSlug}/report`)
      .send({
        issueType: 'outdated_format',
        description: 'New government resolution changed the affidavit clause.',
        reporterName: 'Advocate V. Patel',
        reporterEmail: 'vpatel@example.com',
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.data.status).toBe('open');

    // Step B: Admin archives template
    const archiveRes = await request(app)
      .post(`/api/v1/admin/templates/${testTemplateId}/archive`)
      .set('Cookie', [adminCookie]);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.status).toBe('archived');

    // Step C: Verify archived template no longer appears in public catalog
    const publicList = await request(app).get(`/api/v1/templates?search=${publishedSlug}`);
    expect(publicList.status).toBe(200);
    expect(publicList.body.data.find((t: any) => t.slug === publishedSlug)).toBeUndefined();
  });

  // Test 19: Upload limits, invalid files and malformed inputs are handled safely
  it('19. Upload limits, invalid files and malformed inputs are rejected safely', async () => {
    const invalidRes = await request(app)
      .post('/api/v1/submissions')
      .send({
        documentTitle: 'AB', // too short (< 3)
        documentText: 'Too short',
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  // Test 20: AI provider failures do not bypass human approval or expose private files
  it('20. AI failures do not bypass human approval or publish documents automatically', async () => {
    // Submit text that triggers manual review requirement
    const subRes = await request(app)
      .post('/api/v1/submissions')
      .send({
        documentTitle: 'Complex Unverified Submission',
        documentText: 'આ એક સામાન્ય નોટિસ છે જેમાં કોઈ કાનૂની પરિચ્છેદ નથી.',
        category: 'general',
      });

    expect(subRes.status).toBe(201);
    expect(subRes.body.data.status).toBe('ai_review_ready');

    // Document is NOT published without explicit human approval
    const templateCheck = await TemplateModel.findOne({ title: 'Complex Unverified Submission' });
    expect(templateCheck).toBeNull();

    await DocumentSubmissionModel.findByIdAndDelete(subRes.body.data.submissionId);
  });
});
