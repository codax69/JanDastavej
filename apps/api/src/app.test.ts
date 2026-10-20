import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('API health check', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('JanDastavej API');
  });
});
