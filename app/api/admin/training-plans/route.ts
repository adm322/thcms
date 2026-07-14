import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminTrainingPlans } from "@/lib/services/admin.service";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : new Date().getFullYear();
    const companyId = searchParams.get("companyId") || undefined;
    const result = await getAdminTrainingPlans(year, companyId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AdminTrainingPlans] Failed:", error);
    return NextResponse.json({ error: "Failed to load training plans" }, { status: 500 });
  }
}
