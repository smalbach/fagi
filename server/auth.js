// Passwords and login sessions. Passwords with scrypt (native to Node,
// random salt per user); sessions with a random token that travels in an
// httpOnly cookie and of which the database only stores the SHA-256.

import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const COOKIE = 'fagi_sid';
export const SESSION_DAYS = 30;
export const MIN_PASSWORD = 8;

// N=2^15 needs ~32 MB; maxmem above that so Node does not reject it.
const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEYLEN, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, 'base64');
  const key = await scryptAsync(password, Buffer.from(saltB64, 'base64'), expected.length,
    { N: Number(N), r: Number(r), p: Number(p), maxmem: PARAMS.maxmem });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

// So an email that does not exist takes as long as a wrong password: without
// this, the response time would reveal which emails are registered.
let fakeHash = null;
export async function dummyVerify(password) {
  fakeHash ??= await hashPassword('password-that-belongs-to-nobody');
  await verifyPassword(password, fakeHash);
  return false;
}

export function newToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function validEmail(email) {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, status: u.status, role: u.role };
}
