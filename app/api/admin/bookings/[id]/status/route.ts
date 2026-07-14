import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { BookingStatusSchema } from "@/lib/validations";

export const PATCH = withAuth(
  "ADMIN",
  async ({ request, params }) => {
    const { id } = params as { id: string };

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = BookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { status, employerHrdfSubmitted, trainerHrdfSubmitted, trainerDocumentsUrl } = parsed.data;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data: Record<string, unknown> = { status };
    if (status === "CONFIRMED" && booking.depositStatus === "UNPAID") {
      data.depositStatus = "PAID";
    }
    if (employerHrdfSubmitted !== undefined) {
      data.employerHrdfSubmitted = employerHrdfSubmitted;
      if (employerHrdfSubmitted) data.employerHrdfSubmittedAt = new Date();
    }
    if (trainerHrdfSubmitted !== undefined) {
      data.trainerHrdfSubmitted = trainerHrdfSubmitted;
      if (trainerHrdfSubmitted) data.trainerHrdfSubmittedAt = new Date();
    }
    if (trainerDocumentsUrl !== undefined) data.trainerDocumentsUrl = trainerDocumentsUrl;

    const updated = await prisma.booking.update({ where: { id }, data });

    return NextResponse.json(updated);
  }
);
