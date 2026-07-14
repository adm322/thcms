import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTrainerActions } from "@/lib/services/trainer.service";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "TRAINER" || !session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getTrainerActions(session.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Trainer actions error:", error);
    return NextResponse.json({ error: "Failed to load actions" }, { status: 500 });
  }
}
