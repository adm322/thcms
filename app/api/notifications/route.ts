import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await requireRole();
  if (session instanceof NextResponse) return session;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
        skip: 0
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.id, read: false },
    });

    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await requireRole();
  if (session instanceof NextResponse) return session;

  let body: { action?: string; id?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const { action, id } = body;

  try {
    if (action === "markAllRead") {
      await prisma.notification.updateMany({
        where: { userId: session.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "markRead" && id) {
      await prisma.notification.updateMany({
        where: { id, userId: session.id },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Failed to update notifications:", err);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
