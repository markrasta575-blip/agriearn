// Pure crypto helpers (no Next.js imports) — safe to use in scripts and API routes.
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const KEYLEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(plain, salt, KEYLEN)).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export async function verifyPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = (await scrypt(plain, salt, KEYLEN)).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

const SESSION_COOKIE = "ep_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function sessionTtlMs() {
  return SESSION_TTL_MS;
}
