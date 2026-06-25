import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "trainhub-my-jwt-secret-key-2026-change-in-prod"
);

const COOKIE_NAME = "trainhub_session";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/auth", "/quiz", "/class", "/api/quiz", "/api/attendance"];
// Public assets
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico", "/images", "/thumbnails", "/uploads", "/materials"];

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
