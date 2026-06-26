import { prisma } from './lib/prisma';

async function main() {
  // Create a trainer
  const trainer = await prisma.user.create({
    data: {
      email: `trainer_bench_${Date.now()}@example.com`,
      passwordHash: 'dummy',
      name: 'Test Trainer',
      role: 'TRAINER',
    }
  });

  // Create a program with 100 modules
  const program = await prisma.program.create({
    data: {
      title: 'Benchmark Program',
      trainerId: trainer.id,
      description: 'Test Description',
      category: 'Test',
      status: 'DRAFT',
      modules: {
        create: Array.from({ length: 100 }).map((_, i) => ({
          title: `Module ${i}`,
          description: 'Module desc',
          durationMins: 60,
          orderIndex: i,
        }))
      }
    },
    include: { modules: true }
  });

  console.log(`Created program with ${program.modules.length} modules.`);

  // Benchmark loop creation
  const startLoop = performance.now();
  const clone1 = await prisma.program.create({
    data: {
      trainerId: trainer.id,
      title: 'Clone 1',
      description: 'Test Description',
      status: 'DRAFT',
      category: 'Test'
    }
  });

  for (const mod of program.modules) {
    await prisma.module.create({
      data: {
        programId: clone1.id,
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
        durationMins: mod.durationMins,
      },
    });
  }
  const endLoop = performance.now();
  console.log(`Loop creation took ${endLoop - startLoop} ms`);

  // Benchmark createMany
  const startCreateMany = performance.now();
  const clone2 = await prisma.program.create({
    data: {
      trainerId: trainer.id,
      title: 'Clone 2',
      description: 'Test Description',
      status: 'DRAFT',
      category: 'Test'
    }
  });

  await prisma.module.createMany({
    data: program.modules.map(mod => ({
      programId: clone2.id,
      title: mod.title,
      description: mod.description,
      orderIndex: mod.orderIndex,
      durationMins: mod.durationMins,
    })),
  });
  const endCreateMany = performance.now();
  console.log(`createMany creation took ${endCreateMany - startCreateMany} ms`);

  // Cleanup
  await prisma.module.deleteMany({
    where: { programId: { in: [program.id, clone1.id, clone2.id] } }
  });
  await prisma.program.deleteMany({
    where: { id: { in: [program.id, clone1.id, clone2.id] } }
  });
  await prisma.user.delete({
    where: { id: trainer.id }
  });
}

main().catch(console.error);
