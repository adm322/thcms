import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminCalendar } from "@/lib/services/admin.service";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const result = await getAdminCalendar(year ?? null, month ?? null);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[AdminCalendar] Failed:", error);
    return NextResponse.json({ error: "Failed to load calendar" }, { status: 500 });
  }
}
