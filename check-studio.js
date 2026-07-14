import { prisma } from './lib/prisma.js';
async function check() {
  const studio = await prisma.learningStudio.findUnique({ where: { programId: 'cmquv5yqe0040v4qutxlhjjl9' } });
  console.log('Studio:', JSON.stringify(studio, null, 2));
  await prisma.$disconnect();
}
check().catch(console.error);
