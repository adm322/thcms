import { prisma } from '../lib/prisma';
import * as crypto from 'crypto';

async function main() {
  const hash = crypto.createHash("sha256").update("password123").digest("hex");

  // Create the demo participant user
  const user = await prisma.user.upsert({
    where: { email: 'participant@demo.com' },
    update: { passwordHash: hash, role: 'PARTICIPANT' },
    create: {
      email: 'participant@demo.com',
      passwordHash: hash,
      name: 'Demo Participant',
      role: 'PARTICIPANT',
    },
  });

  console.log('Upserted User:', user.email);

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
