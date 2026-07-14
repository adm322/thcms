import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getHRActions } from "@/lib/services/hr.service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "HR" || !session.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getHRActions(session.companyId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("HR actions error:", error);
    return NextResponse.json({ error: "Failed to load actions" }, { status: 500 });
  }
}
