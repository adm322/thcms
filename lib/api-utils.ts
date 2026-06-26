import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./auth";

// ponytail: three helpers that replace ~170 repeated auth/body/pagination blocks across API routes

/** Auth guard — returns SessionUser or a 401 Response. HR role also requires companyId. */
export async function requireRole(role: "HR"): Promise<(SessionUser & { companyId: string }) | NextResponse>;
export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser | NextResponse>;
export async function requireRole(...roles: SessionUser["role"][]): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session || (roles.length > 0 && !roles.includes(session.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (roles.includes("HR") && !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

/** Safe JSON parse — returns parsed body or a 400 Response. */
export async function parseBody<T = Record<string, unknown>>(
  request: Request,
): Promise<T | NextResponse> {
  try {
    return await request.json() as T;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}

/** Extract page/limit/skip from search params. */
export function parsePagination(
  params: URLSearchParams,
  maxLimit = 100,
) {
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(params.get("limit") || "50")));
  return { page, limit, skip: (page - 1) * limit };
}

/** Build the standard pagination envelope. */
export function paginate(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}
