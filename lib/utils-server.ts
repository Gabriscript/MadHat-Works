import { randomBytes, createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Generate a cryptographically non-guessable proposal token
 * Format: 32 url-safe characters (base64url, ~192 bits of entropy)
 */
export function generateProposalToken(): string {
  return randomBytes(24).toString('base64url');
}

export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/* Simple in-memory rate limiter for the acceptance endpoint.
 * Resets per process and is intentionally lightweight (no external dep). */
const rlBuckets: Map<string, { count: number; resetAt: number }> = new Map();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number } = { limit: 8, windowMs: 60_000 }
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = rlBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rlBuckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1 };
  }
  if (bucket.count >= opts.limit) {
    return { ok: false, remaining: 0 };
  }
  bucket.count += 1;
  return { ok: true, remaining: opts.limit - bucket.count };
}

export function ensurePdfDir(): string {
  const dir = path.join(process.cwd(), 'public', 'pdfs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function parseJsonArr(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
