import { prisma } from '../lib/prisma';
import { randomUUID } from 'crypto';

async function main() {
  console.log("Seeding materials for demo participant's program...");

  // Find the demo participant's booking
  const participant = await prisma.participant.findFirst({
    where: { email: 'participant@demo.com' },
    include: {
      booking: {
        include: { program: true }
      }
    }
  });

  if (!participant) {
    console.log("Demo participant not found. Please run seed-participant.ts first.");
    return;
  }

  const programId = participant.booking.programId;
  const program = participant.booking.program;

  console.log(`Found program: ${program.title}`);

  // Create Module 1: Introduction
  let module1 = await prisma.module.findFirst({
    where: { programId, title: "Module 1: Introduction and Welcome" }
  });

  if (!module1) {
    module1 = await prisma.module.create({
      data: {
        programId,
        title: "Module 1: Introduction and Welcome",
        description: "Welcome to the training. We will cover the basics here.",
        orderIndex: 1
      }
    });
    console.log("Created Module 1");
  }

  // Create Module 2: Advanced Topics
  let module2 = await prisma.module.findFirst({
    where: { programId, title: "Module 2: Advanced Strategies" }
  });

  if (!module2) {
    module2 = await prisma.module.create({
      data: {
        programId,
        title: "Module 2: Advanced Strategies",
        description: "Deep dive into advanced topics and real-world applications.",
        orderIndex: 2
      }
    });
    console.log("Created Module 2");
  }

  // Add PDF Material to Module 1
  const material1 = await prisma.material.findFirst({
    where: { moduleId: module1.id, title: "Course Introduction Slides" }
  });

  if (!material1) {
    await prisma.material.create({
      data: {
        moduleId: module1.id,
        title: "Course Introduction Slides",
        fileType: "PDF",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
      }
    });
    console.log("Added PDF Material to Module 1");
  }

  // Add Quiz to Module 2
  // We delete the old quiz first to ensure it updates with the fresh set of 5 realistic questions
  await prisma.quiz.deleteMany({
    where: { moduleId: module2.id, title: "Advanced Strategies Checkpoint" }
  });

  const quiz = await prisma.quiz.create({
    data: {
      moduleId: module2.id,
      title: "Advanced Strategies Checkpoint",
      passingScore: 80,
      shareToken: "fa6a6746-30e7-4140-a420-e2b50d7dcfbb", // Keep consistent token for testing
    }
  });
  console.log("Created Quiz in Module 2. Token:", quiz.shareToken);

  // Add 5 realistic questions
  await prisma.question.createMany({
    data: [
      {
        quizId: quiz.id,
        text: "Which leadership style focuses on encouraging employees to participate in decision-making processes?",
        type: "MCQ",
        options: JSON.stringify(["A) Autocratic Leadership", "B) Laissez-Faire Leadership", "C) Democratic Leadership", "D) Transactional Leadership"]),
        correctAnswer: "C) Democratic Leadership",
        orderIndex: 1
      },
      {
        quizId: quiz.id,
        text: "When resolving a high-stakes conflict between team leaders, which approach is most sustainable?",
        type: "MCQ",
        options: JSON.stringify(["A) Compromising to reach a quick middle ground", "B) Collaborative problem-solving to address core interests", "C) Forcing a top-down executive decision", "D) Avoiding the issue until it settles"]),
        correctAnswer: "B) Collaborative problem-solving to address core interests",
        orderIndex: 2
      },
      {
        quizId: quiz.id,
        text: "What does the 'A' in the SMART goal-setting framework stand for?",
        type: "MCQ",
        options: JSON.stringify(["A) Action-oriented", "B) Achievable", "C) Accountable", "D) Adjustable"]),
        correctAnswer: "B) Achievable",
        orderIndex: 3
      },
      {
        quizId: quiz.id,
        text: "In change management, what is the primary purpose of the 'Unfreeze' stage in Lewin's model?",
        type: "MCQ",
        options: JSON.stringify(["A) Implementing new systems and policies", "B) Preparing the organization to accept that change is necessary", "C) Reinforcing and stabilizing the new state", "D) Celebrating transition milestones"]),
        correctAnswer: "B) Preparing the organization to accept that change is necessary",
        orderIndex: 4
      },
      {
        quizId: quiz.id,
        text: "Which key performance indicator (KPI) best measures the efficiency of a recruitment funnel?",
        type: "MCQ",
        options: JSON.stringify(["A) Time to Hire", "B) Total Headcount", "C) Training Hours per Employee", "D) Employee Turnaround Rate"]),
        correctAnswer: "A) Time to Hire",
        orderIndex: 5
      }
    ]
  });
  console.log("Added 5 realistic questions to the Quiz");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
