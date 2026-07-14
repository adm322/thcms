import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-guards";
import { getAdminStats } from "@/lib/services/admin.service";

export const GET = withAuth("ADMIN", async () => {
  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[admin/stats] Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
});
