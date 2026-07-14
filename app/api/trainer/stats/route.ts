import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTrainerStats } from "@/lib/services/trainer.service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getTrainerStats(session.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Trainer stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
