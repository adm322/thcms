import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { getAdminActions } from "@/lib/services/admin.service";

export async function GET() {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;

  try {
    const result = await getAdminActions();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AdminActions] Failed:", error);
    return NextResponse.json({ error: "Failed to load admin actions" }, { status: 500 });
  }
}
