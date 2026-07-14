import { prisma } from './lib/prisma';
import { randomUUID } from 'crypto';

async function setupData(numBookings: number) {
  const company = await prisma.company.create({
    data: { name: `Company ${randomUUID()}` }
  });
  const trainer = await prisma.user.create({
    data: { email: `trainer${randomUUID()}@test.com`, name: 'Trainer', passwordHash: 'password', role: 'TRAINER' }
  });
  const hr = await prisma.user.create({
    data: { email: `hr${randomUUID()}@test.com`, name: 'HR', passwordHash: 'password', role: 'HR', companyId: company.id }
  });
  const trainerProfile = await prisma.trainerProfile.create({
    data: { userId: trainer.id, bio: 'Bio' }
  });
  const program = await prisma.program.create({
    data: {
      trainerId: trainer.id,
      title: 'Program',
      description: 'Desc',
      category: 'Cat',
      durationHours: 10,
      maxParticipants: 10,
      pricePerPax: 100,
      locationType: 'ONLINE',
      status: 'PUBLISHED'
    }
  });

  const bookings = [];
  for (let i = 0; i < numBookings; i++) {
    const booking = await prisma.booking.create({
      data: {
        programId: program.id,
        hrId: hr.id,
        companyId: company.id,
        status: 'PENDING',
        programDate: new Date(),
      }
    });
    bookings.push(booking);

    // Create related items
    await prisma.participant.create({
      data: {
        bookingId: booking.id,
        name: `Participant ${i}`,
        email: `participant${i}@test.com`,
        icNumber: `ic${i}`
      }
    });
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        hrId: hr.id,
        trainerId: trainerProfile.id,
        rating: 5
      }
    });
  }

  return program.id;
}

async function measureOriginal(programId: string) {
  const start = performance.now();

  const bookings = await prisma.booking.findMany({ where: { programId }, select: { id: true } });
  for (const b of bookings) {
    await prisma.review.deleteMany({ where: { bookingId: b.id } });
    await prisma.invoice.deleteMany({ where: { bookingId: b.id } });
    await prisma.message.deleteMany({ where: { bookingId: b.id } });
    await prisma.evaluation.deleteMany({ where: { bookingId: b.id } });
    await prisma.participant.deleteMany({ where: { bookingId: b.id } });
  }
  await prisma.booking.deleteMany({ where: { programId } });

  return performance.now() - start;
}

async function measureOptimized(programId: string) {
  const start = performance.now();

  const bookings = await prisma.booking.findMany({ where: { programId }, select: { id: true } });
  const bookingIds = bookings.map(b => b.id);

  if (bookingIds.length > 0) {
    await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.invoice.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.message.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.evaluation.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.participant.deleteMany({ where: { bookingId: { in: bookingIds } } });
  }
  await prisma.booking.deleteMany({ where: { programId } });

  return performance.now() - start;
}

async function main() {
  console.log("Setting up DB...");

  const numBookings = 200;

  // Measure original
  console.log("Setting up data for original run...");
  const programId1 = await setupData(numBookings);
  console.log("Measuring original...");
  const timeOriginal = await measureOriginal(programId1);
  console.log(`Original time: ${timeOriginal.toFixed(2)}ms`);

  // Measure optimized
  console.log("Setting up data for optimized run...");
  const programId2 = await setupData(numBookings);
  console.log("Measuring optimized...");
  const timeOptimized = await measureOptimized(programId2);
  console.log(`Optimized time: ${timeOptimized.toFixed(2)}ms`);

  console.log(`\nImprovement: ${((timeOriginal - timeOptimized) / timeOriginal * 100).toFixed(2)}% faster`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
