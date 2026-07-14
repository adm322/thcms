import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminActions } from "@/lib/services/admin.service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getAdminActions();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AdminActions] Failed:", error);
    return NextResponse.json({ error: "Failed to load admin actions" }, { status: 500 });
  }
}
