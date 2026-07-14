import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getHRStats } from "@/lib/services/hr.service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = session.companyId;
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  try {
    const stats = await getHRStats(companyId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("HR stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
