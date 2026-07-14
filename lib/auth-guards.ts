import { NextRequest, NextResponse } from "next/server";
import { getSession, type SessionUser } from "./auth";

export type Role = "ADMIN" | "HR" | "TRAINER" | "PARTICIPANT";

export interface AuthContext {
  session: SessionUser;
  request: NextRequest;
}

export interface AuthOptions {
  /** Single role or list of roles allowed. Omit for "any authenticated user". */
  role?: Role | Role[];
  /** Require session.companyId to be set (use for HR-scoped writes). */
  companyId?: boolean;
}

type RouteContext<P> = { params: Promise<P> };

type Handler<P> = (ctx: AuthContext & { params: P }) => Promise<Response> | Response;

/**
 * Wraps a Next.js route handler with auth + role + companyId checks.
 * Returns a handler that:
 *   - 401s when no session
 *   - 403s when role mismatches `opts.role`
 *   - 403s when `opts.companyId` is true and `session.companyId` is missing
 *   - otherwise invokes the inner handler with a guaranteed `session`
 *
 * Usage:
 *   // any logged-in user
 *   export const GET = withAuth(async ({ session, request }) => { ... });
 *
 *   // single role
 *   export const GET = withAuth("ADMIN", async ({ session, request, params }) => { ... });
 *
 *   // role + companyId required
 *   export const PATCH = withAuth({ role: "HR", companyId: true }, async (ctx) => { ... });
 */
export function withAuth<P = unknown>(handler: Handler<P>): (request: NextRequest, routeCtx: RouteContext<P>) => Promise<Response>;
export function withAuth<P = unknown>(opts: AuthOptions | Role | Role[], handler: Handler<P>): (request: NextRequest, routeCtx: RouteContext<P>) => Promise<Response>;
export function withAuth<P = unknown>(
  optsOrHandler: AuthOptions | Role | Role[] | Handler<P>,
  maybeHandler?: Handler<P>
) {
  const opts: AuthOptions =
    typeof optsOrHandler === "function"
      ? {}
      : Array.isArray(optsOrHandler) || typeof optsOrHandler === "string"
        ? { role: optsOrHandler as Role | Role[] }
        : optsOrHandler;

  const handler = (typeof optsOrHandler === "function" ? optsOrHandler : maybeHandler) as Handler<P>;
  if (!handler) {
    throw new Error("withAuth: handler is required");
  }

  return async (request: NextRequest, routeCtx: RouteContext<P>) => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (opts.role) {
      const allowed = Array.isArray(opts.role) ? opts.role : [opts.role];
      if (!allowed.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (opts.companyId && !session.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await routeCtx.params;
    return handler({ session, request, params });
  };
}
