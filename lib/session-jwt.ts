import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-in-production';

export interface SessionPayload {
  branchId: string;
  tableNumber: string;
  sessionId: string;
  iat?: number;
}

function b64url(input: string): string {
  return Buffer.from(input).toString('base64url');
}

function b64urlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

const HEADER = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

export function signSession(payload: Omit<SessionPayload, 'iat'>): string {
  const body = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  const sig = crypto.createHmac('sha256', SECRET).update(`${HEADER}.${body}`).digest('base64url');
  return `${HEADER}.${body}.${sig}`;
}

export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    return JSON.parse(b64urlDecode(body)) as SessionPayload;
  } catch {
    return null;
  }
}
