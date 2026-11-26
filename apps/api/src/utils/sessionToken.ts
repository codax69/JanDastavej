import crypto from 'node:crypto';
import type { Request } from 'express';

const DEFAULT_DEV_SECRET = 'dev-session-secret-change-in-production-min-32-chars';

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.COOKIE_SECRET || DEFAULT_DEV_SECRET;
}

export interface SessionPayload {
  userId: string;
  exp: number;
  [key: string]: unknown;
}

/**
 * Signs a session payload using HMAC-SHA256 and embeds an expiration timestamp.
 */
export function signSessionToken(payload: Record<string, unknown>, ttlMs: number): string {
  const fullPayload: SessionPayload = {
    ...payload,
    userId: String(payload.userId),
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token and rejects expired or tampered tokens.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;

  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed?.userId || typeof parsed.exp !== 'number' || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Determines whether cookies should set the Secure attribute (HTTPS behind proxy or direct TLS).
 */
export function isSecureRequest(req: Request): boolean {
  return process.env.NODE_ENV === 'production' && req.secure;
}
