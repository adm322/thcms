import { prisma } from '../lib/prisma';
import * as crypto from 'crypto';

async function main() {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = `scrypt:${salt}:${crypto.scryptSync("password123", salt, 64).toString("hex")}`;

  // Find Petronas company to link the participant to
  const petronas = await prisma.company.findFirst({
    where: { name: { contains: 'Petronas' } },
  });

  // Create the demo participant user
  const user = await prisma.user.upsert({
    where: { email: 'participant@demo.com' },
    update: { passwordHash: hash, role: 'PARTICIPANT', companyId: petronas?.id },
    create: {
      email: 'participant@demo.com',
      passwordHash: hash,
      name: 'Demo Participant',
      role: 'PARTICIPANT',
      companyId: petronas?.id,
    },
  });

  console.log('Upserted User:', user.email, 'Company:', petronas?.name);

  // Pre-seed some votes for the demo participant to simulate employee interest
  const publishedPrograms = await prisma.program.findMany({
    where: { status: 'PUBLISHED' },
    take: 2,
  });

  for (const prog of publishedPrograms) {
    await prisma.programVote.upsert({
      where: { hrId_programId: { hrId: user.id, programId: prog.id } },
      update: {},
      create: {
        hrId: user.id,
        programId: prog.id,
      },
    });
    console.log(`Pre-seeded vote for program: ${prog.title}`);
  }

  // Find all confirmed bookings to enroll them in
  const confirmedBookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED' },
    include: { program: true }
  });

  if (confirmedBookings.length > 0) {
    for (const booking of confirmedBookings) {
      const existingParticipation = await prisma.participant.findFirst({
        where: { bookingId: booking.id, email: user.email }
      });

      if (!existingParticipation) {
        await prisma.participant.create({
          data: {
            bookingId: booking.id,
            userId: user.id,
            name: user.name,
            email: user.email,
            attendanceStatus: 'PENDING',
          }
        });
        console.log(`Enrolled in ${booking.program.title} (CONFIRMED)`);
      } else {
        console.log(`Already enrolled in ${booking.program.title} (CONFIRMED)`);
      }
    }
  } else {
    console.log("No confirmed bookings found. Please ensure seed data has confirmed bookings.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
