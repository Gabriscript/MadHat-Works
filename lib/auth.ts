// Edge-compatible session auth.
// Single shared password (ADMIN_PASSWORD), HMAC-SHA256 signed session token.
// Works in both the Node.js runtime (Server Actions / Server Components) and the
// Edge runtime (Middleware) because it only uses Web Crypto + atob/btoa.

const COOKIE_NAME = 'madhat_admin';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ----- env helpers ---------------------------------------------------------
function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('ADMIN_SESSION_SECRET env var must be set (>= 16 chars).');
  }
  return s;
}
function getAdminPassword(): string {
  const p = process.env.ADMIN_PASSWORD;
  if (!p) throw new Error('ADMIN_PASSWORD env var is required');
  return p;
}

// ----- base64url (Edge-safe) ----------------------------------------------
function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(s: string): Uint8Array {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 === 0 ? '' : '='.repeat(4 - (norm.length % 4));
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ----- crypto --------------------------------------------------------------
async function getKey(): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(getSecret());
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export type SessionPayload = { exp: number };

export async function signSession(): Promise<{ token: string; maxAgeSec: number }> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload: SessionPayload = { exp };
  const data = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getKey();
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
  return { token: `${data}.${b64urlEncode(sig)}`, maxAgeSec: SESSION_TTL_SECONDS };
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  try {
    const key = await getKey();
    const ok = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(data)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(data))) as SessionPayload;
    if (typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function checkPassword(input: string): boolean {
  if (typeof input !== 'string') return false;
  const expected = getAdminPassword();
  if (input.length !== expected.length) return false;
  // constant-time compare
  let acc = 0;
  for (let i = 0; i < input.length; i++) acc |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  return acc === 0;
}

export const ADMIN_COOKIE = COOKIE_NAME;
