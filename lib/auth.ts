import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

/**
 * Resolves the JWT secret. In production, JWT_SECRET is REQUIRED and a missing
 * value throws — never fall back to a random or hardcoded value, because:
 *   - random per-restart values silently invalidate every active session
 *   - hardcoded values are an unauthenticated backdoor
 *
 * In development, a stable dev fallback is used (and warned) so that `lib/auth.ts`
 * and `proxy.ts` agree on the secret. Both files MUST stay in sync.
 */
function resolveJwtSecret(): Uint8Array {
  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.JWT_SECRET;

  if (secret && secret.length > 0) {
    return new TextEncoder().encode(secret);
  }

  if (isProd) {
    throw new Error(
      "JWT_SECRET is required in production. Refusing to start with a fallback secret."
    );
  }

  // Dev-only stable fallback. Same value as proxy.ts so cookies verify across both.
  console.warn(
    "[auth] JWT_SECRET is not set; using a development-only fallback. " +
      "Set JWT_SECRET in your .env file for stable sessions."
  );
  return new TextEncoder().encode("trainhub-dev-jwt-fallback-not-for-production");
}

const JWT_SECRET = resolveJwtSecret();

const COOKIE_NAME = "trainhub_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TRAINER" | "HR" | "PARTICIPANT";
  companyId?: string | null;
  /** True when the user must change their password (e.g. legacy SHA-256 hash
   *  upgraded to bcrypt on first login, or trainer invited with temp password). */
  mustChangePassword?: boolean;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  if (process.env.NODE_ENV === "test" && process.env.TEST_SESSION) {
    return JSON.parse(process.env.TEST_SESSION);
  }
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/** Validate login credentials against the database.
 *
 * Hashes are stored in `passwordHash` with a `passwordAlgo` marker. The
 * supported formats are:
 *   - `bcrypt-10`     — bcrypt with cost 10 (current standard)
 *   - `sha256-legacy` — unsalted SHA-256 (DEPRECATED; auto-upgrades on first
 *                       successful login). Users with this format are flagged
 *                       with `mustChangePassword = true` so the UI forces a
 *                       reset on the next visit.
 *
 * New users created by the seed/admin invite flow MUST go through
 * `hashPassword()` below to ensure bcrypt is used from the start.
 */
const BCRYPT_COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
  algo: string | null
): Promise<boolean> {
  if (algo === "bcrypt-10") {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(plain, hash);
  }
  if (algo === "sha256-legacy" || algo === null || algo === undefined) {
    // Legacy path: compare against unsalted SHA-256. This is intentionally
    // weak; the comparison itself is not the issue — the stored hash can be
    // brute-forced offline. The fix is to re-hash to bcrypt on success and
    // force a password change.
    const crypto = await import("crypto");
    const sha = crypto.createHash("sha256").update(plain).digest("hex");
    return sha === hash;
  }
  return false;
}

/** Validate login credentials against the database. Auto-upgrades legacy
 *  SHA-256 hashes to bcrypt on a successful login. */
export async function validateCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });

  if (!user) return null;

  // Detect actual hash format from the stored hash itself (defense in depth —
  // if passwordAlgo drifts from reality, the truth is in the hash). bcrypt
  // hashes start with $2a$, $2b$, or $2y$. Anything else (64 hex chars) is
  // a legacy SHA-256 hash.
  const isBcrypt = /^\$2[aby]\$/.test(user.passwordHash);
  const effectiveAlgo: string | null = isBcrypt
    ? "bcrypt-10"
    : user.passwordAlgo;

  const ok = await verifyPassword(password, user.passwordHash, effectiveAlgo);
  if (!ok) return null;

  // If the algo field is out of sync with the actual hash, fix the DB. Also
  // auto-upgrade legacy SHA-256 hashes on first successful login.
  if (user.passwordAlgo !== "bcrypt-10" || !isBcrypt && user.passwordAlgo === "bcrypt-10") {
    void (async () => {
      try {
        // Only re-hash if the current hash is NOT already bcrypt (don't
        // burn CPU re-hashing a fresh bcrypt hash)
        if (!isBcrypt) {
          const newHash = await hashPassword(password);
          await prisma.user.update({
            where: { id: user.id },
            data: {
              passwordHash: newHash,
              passwordAlgo: "bcrypt-10",
              mustChangePassword: true,
            },
          });
        } else if (user.passwordAlgo !== "bcrypt-10") {
          // bcrypt hash but wrong algo label — just fix the label
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordAlgo: "bcrypt-10" },
          });
        }
      } catch (err) {
        console.error("[auth] failed to upgrade password hash", err);
      }
    })();
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser["role"],
    companyId: user.companyId,
    mustChangePassword: user.mustChangePassword || !isBcrypt,
  };
}
