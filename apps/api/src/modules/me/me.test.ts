import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, disconnectDB } from '../../config/db.js';
import { CitizenUserModel } from '../../models/CitizenUser.js';
import { UserDocumentModel } from '../../models/UserDocument.js';
import { ConsentRecordModel } from '../../models/ConsentRecord.js';
import { GenerationSessionModel } from '../../models/GenerationSession.js';
import { TemplateModel } from '../../models/Template.js';
import { TemplateVersionModel } from '../../models/TemplateVersion.js';

let citizenCookieA: string;
let citizenCookieB: string;
let citizenAId: string;
let citizenBId: string;
let publishedVersionId: string;

beforeAll(async () => {
  await connectDB();

  // Citizen A Auth
  const reqA = await request(app)
    .post('/api/v1/auth/otp/request')
    .send({ identifier: 'citizen.a@example.com' });
  expect(reqA.status).toBe(200);

  const verA = await request(app)
    .post('/api/v1/auth/otp/verify')
    .send({ identifier: 'citizen.a@example.com', otp: '123456' });
  expect(verA.status).toBe(200);
  const cookiesA = verA.headers['set-cookie'];
  citizenCookieA = Array.isArray(cookiesA) ? cookiesA[0] : cookiesA;
  citizenAId = verA.body.data.user.id;

  // Citizen B Auth (for IDOR tests)
  const reqB = await request(app)
    .post('/api/v1/auth/otp/request')
    .send({ identifier: 'citizen.b@example.com' });
  expect(reqB.status).toBe(200);

  const verB = await request(app)
    .post('/api/v1/auth/otp/verify')
    .send({ identifier: 'citizen.b@example.com', otp: '123456' });
  expect(verB.status).toBe(200);
  const cookiesB = verB.headers['set-cookie'];
  citizenCookieB = Array.isArray(cookiesB) ? cookiesB[0] : cookiesB;
  citizenBId = verB.body.data.user.id;

  const template = (await TemplateModel.findOne({ slug: 'sample-declaration' }).lean()) as any;
  const version = (await TemplateVersionModel.findOne({
    templateId: template!._id,
    language: 'gu',
    status: 'published',
  }).lean()) as any;
  publishedVersionId = String(version!._id);
});

afterAll(async () => {
  // Cleanup test users
  if (citizenAId) {
    await request(app).delete('/api/v1/me/data').set('Cookie', [citizenCookieA]);
  }
  if (citizenBId) {
    await request(app).delete('/api/v1/me/data').set('Cookie', [citizenCookieB]);
  }
  await disconnectDB();
});

describe('Feature Addendum 2 — User Document Upload & Extraction Pipeline', () => {
  let uploadedDocId: string;

  // Synthetic valid PDF buffer (PDF magic bytes + text stream)
  const syntheticValidPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj\n<< /Title (Aadhaar Card) >>\nendobj\n' +
    'BT /F1 12 Tf (Name: Ramanlal Chaturbhai Shah) Tj ET\n' +
    'BT /F1 12 Tf (Age: 42 years) Tj ET\n' +
    'BT /F1 12 Tf (Address: Plot 12, Sector 21, Gandhinagar 382021) Tj ET\n' +
    'BT /F1 12 Tf (1234 5678 9012) Tj ET\n' +
    '%%EOF'
  );

  it('UD-01: Rejects unauthenticated upload requests with 401', async () => {
    const res = await request(app)
      .post('/api/v1/me/documents')
      .send({ fileBase64: syntheticValidPdf.toString('base64'), fileName: 'aadhaar.pdf' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('UD-02: Enforces consent gate: rejects upload if process consent not granted', async () => {
    const res = await request(app)
      .post('/api/v1/me/documents')
      .set('Cookie', [citizenCookieA])
      .send({ fileBase64: syntheticValidPdf.toString('base64'), fileName: 'aadhaar.pdf' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('Grants DPDP Act granular consent scopes (process, keep)', async () => {
    const res = await request(app)
      .post('/api/v1/me/consents')
      .set('Cookie', [citizenCookieA])
      .send({
        consents: [
          { scope: 'process', granted: true },
          { scope: 'keep', granted: true },
        ],
        noticeVersion: '2026.1',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.process).toBe(true);
    expect(res.body.data.keep).toBe(true);
    expect(res.body.data.ai_assist).toBe(false);
  });

  it('UD-03: Safety scanner rejects malware (EICAR test signature)', async () => {
    const eicarMalwareBuffer = Buffer.from(
      '%PDF-1.4\nX5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*\n%%EOF'
    );

    const res = await request(app)
      .post('/api/v1/me/documents')
      .set('Cookie', [citizenCookieA])
      .send({
        fileBase64: eicarMalwareBuffer.toString('base64'),
        fileName: 'malicious.pdf',
        docType: 'id_proof',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_UNSAFE');
  });

  it('UD-03: Safety scanner rejects non-PDF/image files (MIME magic check)', async () => {
    const badExecutable = Buffer.from('MZ\x90\x00\x03\x00\x00\x00this is a fake binary exe');

    const res = await request(app)
      .post('/api/v1/me/documents')
      .set('Cookie', [citizenCookieA])
      .send({
        fileBase64: badExecutable.toString('base64'),
        fileName: 'virus.pdf',
        docType: 'id_proof',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('FILE_TYPE_NOT_ALLOWED');
  });

  it('Uploads valid document, extracts fields, and masks sensitive identifiers (UD-04, UD-11, UD-14)', async () => {
    const res = await request(app)
      .post('/api/v1/me/documents')
      .set('Cookie', [citizenCookieA])
      .send({
        fileBase64: syntheticValidPdf.toString('base64'),
        fileName: 'aadhaar_scan.pdf',
        docType: 'id_proof',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.document).toBeDefined();
    expect(res.body.data.document.kept).toBe(true); // Since 'keep' consent was granted
    expect(res.body.data.extraction).toBeDefined();

    const items = res.body.data.extraction.items;
    expect(items.length).toBeGreaterThanOrEqual(3);

    // Verify name, age, address, and masked Aadhaar
    const nameItem = items.find((i: any) => i.fieldKey === 'fullName');
    expect(nameItem?.value).toContain('Ramanlal');

    const ageItem = items.find((i: any) => i.fieldKey === 'age');
    expect(ageItem?.value).toBe('42');

    const aadhaarItem = items.find((i: any) => i.fieldKey === 'aadhaarNumber');
    expect(aadhaarItem?.value).toBe('XXXX-XXXX-9012');
    expect(aadhaarItem?.isSensitive).toBe(true);

    uploadedDocId = res.body.data.document.id;
  });

  it('UD-08: Prevents IDOR: Citizen B cannot view or download Citizen A document', async () => {
    // Attempt view
    const viewRes = await request(app)
      .get(`/api/v1/me/documents/${uploadedDocId}`)
      .set('Cookie', [citizenCookieB]);
    expect(viewRes.status).toBe(404);

    // Attempt file download
    const fileRes = await request(app)
      .get(`/api/v1/me/documents/${uploadedDocId}/file`)
      .set('Cookie', [citizenCookieB]);
    expect(fileRes.status).toBe(404);

    // Attempt deletion
    const delRes = await request(app)
      .delete(`/api/v1/me/documents/${uploadedDocId}`)
      .set('Cookie', [citizenCookieB]);
    expect(delRes.status).toBe(404);
  });

  it('UD-05: Applies user-confirmed values only to generation session', async () => {
    // Create preview session
    const previewRes = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: publishedVersionId,
        language: 'gu',
        answers: {
          fullName: 'Initial Name',
          parentSpouseName: 'Chaturbhai',
          age: 30,
          occupation: 'Service',
          address: 'Old Address',
          declarationPurpose: 'Testing',
          declarationDate: '2026-10-20',
          place: 'Gandhinagar',
        },
      });

    expect(previewRes.status).toBe(200);
    const sessionId = previewRes.body.data.sessionId;

    // Apply confirmed extraction fields
    const applyRes = await request(app)
      .post(`/api/v1/generations/${sessionId}/apply-extraction`)
      .send({
        confirmedFields: {
          fullName: 'Ramanlal Chaturbhai Shah',
          age: 42,
          address: 'Plot 12, Sector 21, Gandhinagar 382021',
        },
      });

    expect(applyRes.status).toBe(200);
    expect(applyRes.body.data.answers.fullName).toBe('Ramanlal Chaturbhai Shah');
    expect(applyRes.body.data.answers.age).toBe(42);
    expect(applyRes.body.data.answers.occupation).toBe('Service'); // Untouched field remains intact
  });

  it('UD-12: Bundles generated affidavit with selected annexures into PDF', async () => {
    const previewRes = await request(app)
      .post('/api/v1/generations/preview')
      .send({
        templateVersionId: publishedVersionId,
        language: 'gu',
        answers: {
          fullName: 'Ramanlal Chaturbhai Shah',
          parentSpouseName: 'Chaturbhai',
          age: 42,
          occupation: 'Business',
          address: 'Gandhinagar',
          declarationPurpose: 'Annexure bundle testing',
          declarationDate: '2026-10-20',
          place: 'Gandhinagar',
        },
      });
    expect(previewRes.status).toBe(200);
    const sessionId = previewRes.body.data.sessionId;

    const bundleRes = await request(app)
      .post(`/api/v1/generations/${sessionId}/bundle`)
      .set('Cookie', [citizenCookieA])
      .send({
        annexureDocIds: [uploadedDocId],
      });

    expect(bundleRes.status).toBe(200);
    expect(bundleRes.headers['content-type']).toBe('application/pdf');
    expect(bundleRes.body.length).toBeGreaterThan(1000);
  });

  it('UD-07: Permanently deletes document immediately', async () => {
    const res = await request(app)
      .delete(`/api/v1/me/documents/${uploadedDocId}`)
      .set('Cookie', [citizenCookieA]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');

    // Confirm deleted in DB
    const check = await UserDocumentModel.findById(uploadedDocId);
    expect(check).toBeNull();
  });

  it('UD-07: Right to Erasure: deletes all user data and documents', async () => {
    const res = await request(app)
      .delete('/api/v1/me/data')
      .set('Cookie', [citizenCookieA]);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
