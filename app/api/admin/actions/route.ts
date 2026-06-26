import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { getAdminActions } from "@/lib/services/admin.service";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  const result = await getAdminActions();

  return NextResponse.json(result);
}
