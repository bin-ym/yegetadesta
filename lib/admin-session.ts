import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const ADMIN_SESSION_COOKIE = "admin_session";
export type AdminSessionRole = "ADMIN" | "SUPER_ADMIN";

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

function getSessionKey() {
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.CRON_SECRET ||
    (process.env.NODE_ENV === "development"
      ? "local-development-admin-session-secret"
      : "");

  return secret ? createHash("sha256").update(secret).digest() : null;
}

export function hashAdminPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [algorithm, saltValue, hashValue] = storedHash.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expectedHash = Buffer.from(hashValue, "base64url");
    const actualHash = scryptSync(password, salt, expectedHash.length);
    return (
      expectedHash.length > 0 &&
      actualHash.length === expectedHash.length &&
      timingSafeEqual(actualHash, expectedHash)
    );
  } catch {
    return false;
  }
}

export async function createAdminSession(role: AdminSessionRole) {
  const key = getSessionKey();
  if (!key) throw new Error("Admin session secret is not configured");

  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(key);
}

export async function verifyAdminSession(token?: string | null) {
  const key = getSessionKey();
  if (!key || !token) return null;

  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload.role === "ADMIN" || payload.role === "SUPER_ADMIN"
      ? payload.role
      : null;
  } catch {
    return null;
  }
}