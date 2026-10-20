import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { connectDB, disconnectDB } from '../../config/db.js';
import { TemplateModel } from '../../models/Template.js';
import { TemplateVersionModel } from '../../models/TemplateVersion.js';
import { AuditEventModel } from '../../models/AuditEvent.js';

let adminCookie: string;
let approverCookie: string;

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

  // Login as approver
  const approverRes = await request(app)
    .post('/api/v1/admin/auth/login')
    .send({
      email: 'approver@jandastavej.local',
      password: 'DemoApproverPass123!',
    });
  expect(approverRes.status).toBe(200);
  const approverCookies = approverRes.headers['set-cookie'];
  approverCookie = Array.isArray(approverCookies) ? approverCookies[0] : approverCookies;
});

afterAll(async () => {
  await disconnectDB();
});

describe('Stage 7: Admin Lifecycle & Auth', () => {
  it('rejects unauthenticated requests to /api/v1/admin/*', async () => {
    const res = await request(app).get('/api/v1/admin/templates');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'admin@jandastavej.local',
        password: 'WrongPassword123!',
      });
    expect(res.status).toBe(401);
  });

  it('allows authenticated admin to view templates and me endpoint', async () => {
    const meRes = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', adminCookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('admin@jandastavej.local');
    expect(meRes.body.data.user.role).toBe('admin');

    const templatesRes = await request(app)
      .get('/api/v1/admin/templates')
      .set('Cookie', adminCookie);
    expect(templatesRes.status).toBe(200);
    expect(templatesRes.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('executes full template lifecycle: Draft -> In Review -> Approved -> Published', async () => {
    // 1. Create new draft template
    const createRes = await request(app)
      .post('/api/v1/admin/templates')
      .set('Cookie', adminCookie)
      .send({
        slug: `test-lifecycle-${Date.now()}`,
        title: 'Test Lifecycle Template',
        titleGu: 'ટેસ્ટ લાઈફસાયકલ ટેમ્પ્લેટ',
        category: 'declaration',
      });

    expect(createRes.status).toBe(201);
    const versionId = createRes.body.data.version._id;
    const templateId = createRes.body.data.template._id;

    // 2. Edit draft
    const editRes = await request(app)
      .patch(`/api/v1/admin/template-versions/${versionId}`)
      .set('Cookie', adminCookie)
      .send({
        sourceReference: 'Updated Draft Source Ref',
      });
    expect(editRes.status).toBe(200);
    expect(editRes.body.data.sourceReference).toBe('Updated Draft Source Ref');

    // 3. Submit for review
    const submitRes = await request(app)
      .post(`/api/v1/admin/template-versions/${versionId}/submit-review`)
      .set('Cookie', adminCookie);
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status).toBe('in_review');

    // 4. Approve (approver role)
    const approveRes = await request(app)
      .post(`/api/v1/admin/template-versions/${versionId}/approve`)
      .set('Cookie', approverCookie);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('approved');

    // 5. Publish
    const publishRes = await request(app)
      .post(`/api/v1/admin/template-versions/${versionId}/publish`)
      .set('Cookie', adminCookie);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('published');

    // 6. Immutability check: cannot edit published version
    const mutatePublishedRes = await request(app)
      .patch(`/api/v1/admin/template-versions/${versionId}`)
      .set('Cookie', adminCookie)
      .send({ sourceReference: 'Hacked Source' });
    expect(mutatePublishedRes.status).toBe(403);
    expect(mutatePublishedRes.body.error.code).toBe('FORBIDDEN');

    // Clean up
    await TemplateVersionModel.findByIdAndDelete(versionId);
    await TemplateModel.findByIdAndDelete(templateId);
  });

  it('guarantees audit events contain no document content or answers', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-events')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);

    for (const event of res.body.data) {
      expect(event.action).toBeDefined();
      expect(event.timestamp).toBeDefined();
      // Strict rule: metadata must NEVER store citizen answers or raw document content
      if (event.metadata) {
        expect(event.metadata.answers).toBeUndefined();
        expect(event.metadata.previewHtml).toBeUndefined();
      }
    }
  });
});
