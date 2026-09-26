// Contraseñas y sesiones de login. Contraseñas con scrypt (nativo de Node,
// sal aleatoria por usuario); sesiones con un token aleatorio que viaja en una
// cookie httpOnly y del que la base de datos solo guarda el SHA-256.

import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

export const COOKIE = 'fagi_sid';
export const SESSION_DAYS = 30;
export const MIN_PASSWORD = 8;

// N=2^15 pide ~32 MB; maxmem por encima para que Node no lo rechace.
const PARAMS = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEYLEN, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const partes = String(stored).split('$');
  if (partes.length !== 6 || partes[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, keyB64] = partes;
  const esperado = Buffer.from(keyB64, 'base64');
  const key = await scryptAsync(password, Buffer.from(saltB64, 'base64'), esperado.length,
    { N: Number(N), r: Number(r), p: Number(p), maxmem: PARAMS.maxmem });
  return key.length === esperado.length && timingSafeEqual(key, esperado);
}

// Para que un email que no existe tarde lo mismo que una contraseña mala: sin
// esto, el tiempo de respuesta diría qué emails están registrados.
let hashFalso = null;
export async function dummyVerify(password) {
  hashFalso ??= await hashPassword('contraseña-que-no-es-de-nadie');
  await verifyPassword(password, hashFalso);
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
