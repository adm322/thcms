import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Resolves the JWT secret used to verify cookies on every request. Must stay in
 * sync with `lib/auth.ts`. In production, JWT_SECRET is REQUIRED — falling back
 * to a hardcoded string would let anyone forge cookies.
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

  // Dev-only stable fallback. Same value as lib/auth.ts so cookies verify across both.
  console.warn(
    "[proxy] JWT_SECRET is not set; using a development-only fallback. " +
      "Set JWT_SECRET in your .env file for stable sessions."
  );
  return new TextEncoder().encode("trainhub-dev-jwt-fallback-not-for-production");
}

const JWT_SECRET = resolveJwtSecret();

const COOKIE_NAME = "trainhub_session";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/auth", "/quiz", "/class", "/api/quiz", "/api/attendance", "/m/quiz"];
// Public assets
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico", "/images", "/thumbnails", "/uploads", "/materials", "/chrome-log-interceptor.js"];

async function getSessionUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "TRAINER" | "HR" | "PARTICIPANT";
      companyId?: string | null;
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const user = await getSessionUser(request);
    // If logged in and on login page, redirect to dashboard
    if (user && pathname === "/login") {
      const dash = getDashboardPath(user.role);
      return NextResponse.redirect(new URL(dash, request.url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  const user = await getSessionUser(request);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control for dashboard routes
  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }
  if (pathname.startsWith("/trainer") && user.role !== "TRAINER") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }
  if (pathname.startsWith("/hr") && user.role !== "HR") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }
  if (pathname.startsWith("/participant") && user.role !== "PARTICIPANT") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }

  // Mobile route equivalents
  if (pathname.startsWith("/m/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }
  if (pathname.startsWith("/m/trainer") && user.role !== "TRAINER") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }
  if (pathname.startsWith("/m/hr") && user.role !== "HR") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }
  if (pathname.startsWith("/m/participant") && user.role !== "PARTICIPANT") {
    return NextResponse.redirect(new URL(getDashboardPath(user.role), request.url));
  }

  // API role enforcement
  if (pathname.startsWith("/api/admin") && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (pathname.startsWith("/api/trainer") && user.role !== "TRAINER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (pathname.startsWith("/api/hr") && user.role !== "HR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TRAINER":
      return "/trainer";
    case "HR":
      return "/hr";
    case "PARTICIPANT":
      return "/participant";
    default:
      return "/";
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
