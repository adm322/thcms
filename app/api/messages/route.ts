import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const bookingId = searchParams.get("bookingId");

  // Conversation list mode — return all bookings with messages for this user
  if (searchParams.get("list") === "true") {
    // Find all bookings where this user is involved (as HR or trainer)
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { hrId: session.id },
          { program: { trainerId: session.id } },
        ],
        messages: { some: {} },
      },
      include: {
        program: { select: { title: true, trainerId: true } },
        company: { select: { name: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { name: true } } },
        },
        _count: {
          select: {
            messages: {
              where: { receiverId: session.id, read: false },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      bookings.map((b) => ({
        bookingId: b.id,
        programTitle: b.program.title,
        companyName: b.company.name,
        status: b.status,
        trainerId: b.program.trainerId,
        unreadCount: b._count.messages,
        latestMessage: b.messages[0]
          ? { content: b.messages[0].content.slice(0, 80), senderName: b.messages[0].sender.name, createdAt: b.messages[0].createdAt.toISOString() }
          : null,
      }))
    );
  }

  // Single conversation mode
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  const messages = await prisma.message.findMany({
    where: { bookingId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Mark as read
  await prisma.message.updateMany({
    where: { bookingId, receiverId: session.id, read: false },
    data: { read: true },
  });

  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { bookingId, content, receiverId } = body;
  if (!bookingId || !content || !receiverId) {
    return NextResponse.json({ error: "bookingId, content, receiverId required" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { senderId: session.id, receiverId, bookingId, content },
    include: { sender: { select: { name: true, role: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
