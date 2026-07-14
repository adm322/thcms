import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { getSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth-guards";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const InviteSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  expertise: z.string().max(500).optional(),
  hourlyRate: z.union([z.number(), z.string()]).optional(),
  bio: z.string().max(2000).optional(),
});

/**
 * Generate a cryptographically random temporary password.
 * Format: `Th_` + 12 chars from base36 of 9 random bytes (72 bits entropy).
 */
function generateTempPassword(): string {
  return "Th_" + crypto.randomBytes(9).toString("base64url");
}

export const POST = withAuth(
  "ADMIN",
  async ({ session, request }) => {
    if (!rateLimit(`trainer:invite:${session.id}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = InviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const name = parsed.data.name.trim();
    const email = parsed.data.email.trim().toLowerCase();
    const expertise = parsed.data.expertise ?? "";
    const hourlyRateRaw = parsed.data.hourlyRate;
    const hourlyRate =
      typeof hourlyRateRaw === "number"
        ? hourlyRateRaw
        : typeof hourlyRateRaw === "string" && hourlyRateRaw.trim() !== ""
          ? Number(hourlyRateRaw)
          : 0;
    const bio = parsed.data.bio?.trim() ?? "";

    // Reject duplicates
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const trainer = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        passwordAlgo: "bcrypt-10",
        mustChangePassword: true,
        role: "TRAINER",
        trainerProfile: {
          create: {
            expertise: JSON.stringify(
              expertise ? expertise.split(",").map((s) => s.trim()).filter(Boolean) : []
            ),
            hourlyRate: Number.isFinite(hourlyRate) ? Math.max(0, hourlyRate) : 0,
            bio: bio || null,
            accreditations: "[]",
          },
        },
      },
      include: { trainerProfile: true },
    });

    return NextResponse.json(
      {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        tempPassword, // surface once — admin relays to trainer out-of-band
      },
      { status: 201 }
    );
  }
);
