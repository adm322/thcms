import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : crypto.getRandomValues(new Uint8Array(32));

const COOKIE_NAME = "trainhub_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "TRAINER" | "HR" | "PARTICIPANT";
  companyId?: string | null;
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

/** Hash a password with scrypt + random salt. Format: `scrypt:<salt>:<hash>` */
export async function hashPassword(password: string): Promise<string> {
  const crypto = await import("crypto");
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

async function verifyScrypt(password: string, stored: string): Promise<boolean> {
  const crypto = await import("crypto");
  const [, salt, hash] = stored.split(":");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

/** Validate login credentials against the database */
export async function validateCredentials(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const crypto = await import("crypto");

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true },
  });
  if (!user) return null;

  const isScrypt = user.passwordHash.startsWith("scrypt:");
  let valid = false;

  if (isScrypt) {
    valid = await verifyScrypt(password, user.passwordHash);
  } else {
    // ponytail: legacy SHA-256 check — auto-upgrades to scrypt on success
    const sha = crypto.createHash("sha256").update(password).digest("hex");
    valid = user.passwordHash === sha;
  }

  if (!valid) return null;

  // Auto-upgrade legacy hashes to scrypt
  if (!isScrypt) {
    const upgraded = await hashPassword(password);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: upgraded } });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as SessionUser["role"],
    companyId: user.companyId,
  };
}
