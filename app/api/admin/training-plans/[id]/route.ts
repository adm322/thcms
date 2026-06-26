import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { action?: string; adminNotes?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { action, adminNotes } = body;

  const existing = await prisma.trainingPlanItem.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Guard: can't reject completed, scheduled, or cancelled items
  const terminalStatuses = ["COMPLETED", "CANCELLED", "SCHEDULED"];
  if (action === "REJECT" && terminalStatuses.includes(existing.status)) {
    return NextResponse.json(
      { error: `Cannot reject a ${existing.status.toLowerCase()} item. HR must move it back to DRAFT first.` },
      { status: 400 }
    );
  }

  const data: any = {};
  const timestamp = new Date().toLocaleDateString("en-MY");

  if (action === "APPROVE") {
    const approvalNote = `✅ [Admin Approved ${timestamp}]`;
    data.notes = existing.notes
      ? `${existing.notes}\n${approvalNote}`
      : approvalNote;
  } else if (action === "REJECT") {
    data.status = "DRAFT";
    const adminMsg = adminNotes || "Needs revision — see admin feedback";
    const rejectNote = `❌ [Admin Rejected ${timestamp}]: ${adminMsg}`;
    data.notes = existing.notes
      ? `${existing.notes}\n${rejectNote}`
      : rejectNote;
  } else if (action === "NOTE") {
    if (!adminNotes || !adminNotes.trim()) {
      return NextResponse.json({ error: "adminNotes required for NOTE action" }, { status: 400 });
    }
    const note = `💬 [Admin ${timestamp}]: ${adminNotes}`;
    data.notes = existing.notes
      ? `${existing.notes}\n${note}`
      : note;
  } else {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  try {
    const updated = await prisma.trainingPlanItem.update({
      where: { id },
      data,
    });

    // Notify HR for approve/reject actions
    if (action === "APPROVE") {
      await prisma.notification.create({
        data: {
          userId: existing.hrId,
          type: "PLAN_APPROVED",
          title: `Plan approved: "${existing.title}"`,
          body: `Admin approved your training plan for ${existing.targetCount} pax. Proceed to book.`,
          link: "/hr/training-planner",
        },
      });
    } else if (action === "REJECT") {
      await prisma.notification.create({
        data: {
          userId: existing.hrId,
          type: "PLAN_REJECTED",
          title: `Plan returned: "${existing.title}"`,
          body: (adminNotes || "Needs revision — see admin feedback") || "Admin requested changes to your plan. Review and update.",
          link: "/hr/training-planner",
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Failed to update training plan:", err);
    return NextResponse.json({ error: "Failed to update training plan" }, { status: 500 });
  }
}
