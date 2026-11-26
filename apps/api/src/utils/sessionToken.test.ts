import { describe, it, expect, vi, afterEach } from 'vitest';
import { signSessionToken, verifySessionToken } from './sessionToken.js';

describe('sessionToken', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('signs and verifies a valid token', () => {
    const token = signSessionToken({ userId: 'user123', role: 'admin' }, 60_000);
    const payload = verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe('user123');
    expect(payload?.role).toBe('admin');
  });

  it('rejects tampered tokens', () => {
    const token = signSessionToken({ userId: 'user123', role: 'staff' }, 60_000);
    const [, sig] = token.split('.');
    const forgedPayload = Buffer.from(
      JSON.stringify({ userId: 'admin999', role: 'admin', exp: Date.now() + 60_000 })
    ).toString('base64url');
    expect(verifySessionToken(`${forgedPayload}.${sig}`)).toBeNull();
  });

  it('rejects unsigned legacy base64 tokens', () => {
    const legacy = Buffer.from(JSON.stringify({ userId: 'user123' })).toString('base64');
    expect(verifySessionToken(legacy)).toBeNull();
  });

  it('rejects expired tokens', () => {
    const token = signSessionToken({ userId: 'user123' }, -1000);
    expect(verifySessionToken(token)).toBeNull();
  });
});
