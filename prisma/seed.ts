import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";
import * as bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helpers to generate evaluation responses
function randomRating(min = 3, max = 5): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeEvalResponses(
  participantNames: string[],
  questions: { question: string; type: string; maxRating: number }[]
) {
  return participantNames.map((name) => {
    const answers = questions.map((q, idx) => {
      if (q.type === "RATING") {
        return { questionIdx: idx, rating: randomRating(3, 5) };
      }
      return { questionIdx: idx, rating: 0, comment: getRandomComment(idx, name) };
    });
    return { participantId: name, answers };
  });
}

const comments = {
  trainer: [
    "Trainer was extremely knowledgeable and engaging!",
    "Very practical examples. Could relate to my daily work.",
    "One of the best trainers I've had. Clear and patient.",
    "Good pace, but could slow down on complex topics.",
    "Excellent facilitation skills. Kept everyone engaged.",
    "Very experienced — answered all our questions confidently.",
  ],
  content: [
    "Content was spot-on for my role. Immediately applicable.",
    "Good mix of theory and practice. Would love more case studies.",
    "The handouts and templates are incredibly useful.",
    "Material was a bit basic for experienced staff.",
    "Very relevant to Malaysian workplace context.",
    "Modules were well-structured and easy to follow.",
  ],
  improvement: [
    "More hands-on exercises please!",
    "Would benefit from real company case studies.",
    "Consider adding a follow-up session.",
    "The venue was a bit cramped. Better room next time.",
    "Pre-reading materials would help prepare better.",
    "Excellent as-is. No suggestions.",
  ],
  apply: [
    "I can immediately apply the coaching framework with my team.",
    "The DI process template will save us so much time.",
    "Better understanding of EA amendments for compliance.",
    "Digital transformation roadmap is clear now.",
    "I'll start using the feedback model tomorrow.",
    "HR operations will improve significantly with these tools.",
  ],
};

function getRandomComment(qIdx: number, _name: string): string {
  const pools: Record<number, string[]> = {
    0: comments.trainer,
    1: comments.content,
    2: comments.content,
    3: comments.apply,
    4: comments.improvement,
    5: comments.improvement,
  };
  const pool = pools[qIdx] || comments.content;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean
  await prisma.programVote.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.trainerAvailability.deleteMany();
  await prisma.material.deleteMany();
  await prisma.question.deleteMany();
  await prisma.participant.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.itineraryItem.deleteMany();
  await prisma.trainingPlanItem.deleteMany();
  await prisma.teamBuildingRequest.deleteMany();
  await prisma.module.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.program.deleteMany();
  await prisma.changelog.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.trainerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // ─── Companies ──────────────────────────────────────────
  const petronas = await prisma.company.create({
    data: { name: "Petronas ICT Sdn Bhd", address: "KLCC, Kuala Lumpur", state: "Kuala Lumpur", regNumber: "200901012345" },
  });
  const maybank = await prisma.company.create({
    data: { name: "Maybank Berhad", address: "Menara Maybank, KL", state: "Kuala Lumpur", regNumber: "196001000123" },
  });
  const topGlove = await prisma.company.create({
    data: { name: "Top Glove Corporation Bhd", address: "Shah Alam", state: "Selangor", regNumber: "199101016789" },
  });
  const airAsia = await prisma.company.create({
    data: { name: "AirAsia Group Berhad", address: "KLIA2, Sepang", state: "Selangor", regNumber: "200401019876" },
  });
  const telekom = await prisma.company.create({
    data: { name: "Telekom Malaysia Berhad", address: "Menara TM, Kuala Lumpur", state: "Kuala Lumpur", regNumber: "198701000456" },
  });
  const simeDarby = await prisma.company.create({
    data: { name: "Sime Darby Berhad", address: "Ara Damansara, Petaling Jaya", state: "Selangor", regNumber: "197301002345" },
  });

  // ─── Users ──────────────────────────────────────────────
  const password = await hashPassword("password123");

  const admin = await prisma.user.create({
    data: { email: "admin@trainhub.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Admin Platform", role: "ADMIN" },
  });

  const trainer1 = await prisma.user.create({
    data: { email: "aisha@trainhub.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Aisha Rahman", role: "TRAINER" },
  });
  const trainer2 = await prisma.user.create({
    data: { email: "jason@trainhub.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Jason Tan", role: "TRAINER" },
  });
  const trainer3 = await prisma.user.create({
    data: { email: "sarah@trainhub.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Sarah Lim", role: "TRAINER" },
  });

  const hr1 = await prisma.user.create({
    data: { email: "hr@petronas.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Farid Ismail", role: "HR", companyId: petronas.id },
  });
  const hr2 = await prisma.user.create({
    data: { email: "hr@maybank.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Linda Ooi", role: "HR", companyId: maybank.id },
  });
  const hr3 = await prisma.user.create({
    data: { email: "hr@topglove.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Rajesh Kumar", role: "HR", companyId: topGlove.id },
  });
  const hr4 = await prisma.user.create({
    data: { email: "hr@airasia.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Nadia Hassan", role: "HR", companyId: airAsia.id },
  });
  const hr5 = await prisma.user.create({
    data: { email: "hr@tm.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Rizal Mustafa", role: "HR", companyId: telekom.id },
  });
  const hr6 = await prisma.user.create({
    data: { email: "hr@sdarby.my", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Grace Tan", role: "HR", companyId: simeDarby.id },
  });

  // Demo Participant
  const participant = await prisma.user.create({
    data: { email: "participant@demo.com", passwordHash: password, passwordAlgo: "bcrypt-10", name: "Demo Participant", role: "PARTICIPANT", companyId: petronas.id },
  });

  // ─── Trainer Profiles ───────────────────────────────────
  const tp1 = await prisma.trainerProfile.create({
    data: {
      userId: trainer1.id, bio: "15+ years in leadership development. Certified HRDF trainer.",
      expertise: JSON.stringify(["Leadership", "Team Building", "Change Management"]),
      accreditations: JSON.stringify(["HRDF Accredited", "Certified Leadership Coach", "PSMB Registered"]),
      bankName: "Maybank", bankAccount: "512345678901", hourlyRate: 500, rating: 4.8, totalPrograms: 42,
    },
  });
  const tp2 = await prisma.trainerProfile.create({
    data: {
      userId: trainer2.id, bio: "Digital transformation specialist. Helping Malaysian SMEs embrace Industry 4.0.",
      expertise: JSON.stringify(["Digital Transformation", "AI & Data", "Cybersecurity"]),
      accreditations: JSON.stringify(["HRDF Accredited", "Google Cloud Certified", "CompTIA Security+"]),
      bankName: "CIMB", bankAccount: "701234567890", hourlyRate: 650, rating: 4.6, totalPrograms: 28,
    },
  });
  const tp3 = await prisma.trainerProfile.create({
    data: {
      userId: trainer3.id, bio: "HR consultant specialising in Employment Act compliance and industrial relations.",
      expertise: JSON.stringify(["Employment Law", "HR Operations", "Performance Management"]),
      accreditations: JSON.stringify(["HRDF Accredited", "MIHRM Registered", "Certified Employment Law Practitioner"]),
      bankName: "Public Bank", bankAccount: "312345678901", hourlyRate: 450, rating: 4.9, totalPrograms: 55,
    },
  });

  // ─── Employees ──────────────────────────────────────────
  const empData: Record<string, [string, string, string, string, string][]> = {
    petronas: [
      ["Amir Husni", "900101-14-5001", "amir@petronas.my", "Engineering", "Senior Engineer"],
      ["Nurul Izzah", "880505-14-5002", "nurul@petronas.my", "IT", "IT Manager"],
      ["David Chong", "850812-14-5003", "david@petronas.my", "Finance", "Finance Executive"],
      ["Siti Hajar", "920303-14-5004", "siti@petronas.my", "HR", "HR Executive"],
      ["Muthu Krishnan", "870601-14-5005", "muthu@petronas.my", "Operations", "Ops Lead"],
      ["Priya Devi", "910715-14-5006", "priya@petronas.my", "Marketing", "Brand Manager"],
      ["Ahmad Fauzi", "890920-14-5007", "ahmad@petronas.my", "IT", "Developer"],
      ["Lisa Wong", "931111-14-5008", "lisa@petronas.my", "Finance", "Accountant"],
      ["Zulkifli Omar", "860404-14-5009", "zul@petronas.my", "Engineering", "Project Manager"],
      ["Nadia Kamal", "940818-14-5010", "nadia@petronas.my", "HR", "Talent Acquisition"],
      ["Hakim Salleh", "950222-14-5011", "hakim@petronas.my", "Engineering", "Engineer"],
      ["Sharon Lim", "890707-14-5012", "sharon@petronas.my", "Finance", "Finance Manager"],
    ],
    maybank: [
      ["Tan Mei Ling", "890303-14-6001", "meiling@maybank.my", "Compliance", "Compliance Officer"],
      ["Hafizuddin Ali", "900606-14-6002", "hafiz@maybank.my", "IT", "System Analyst"],
      ["Ganesh Rao", "871212-14-6003", "ganesh@maybank.my", "Risk Management", "Risk Analyst"],
      ["Chong Wei Jian", "920101-14-6004", "weijian@maybank.my", "Finance", "Financial Analyst"],
      ["Sarah Aziz", "910808-14-6005", "sarah@maybank.my", "Marketing", "Digital Marketing"],
      ["Lim Kok Weng", "860515-14-6006", "kokweng@maybank.my", "Operations", "Branch Manager"],
      ["Nur Amirah", "930707-14-6007", "amirah@maybank.my", "Customer Service", "CS Lead"],
      ["Ramesh Subra", "900404-14-6008", "ramesh@maybank.my", "IT", "Network Engineer"],
      ["Jasmine Kaur", "880909-14-6009", "jasmine@maybank.my", "HR", "HR Business Partner"],
      ["Wong Kah Hoe", "910111-14-6010", "kahhoe@maybank.my", "Risk Management", "Senior Risk Analyst"],
    ],
    topGlove: [
      ["Kumaravel M.", "880202-14-7001", "kumar@topglove.my", "Production", "Production Manager"],
      ["Wong Siew Ling", "900505-14-7002", "siewling@topglove.my", "QA", "QA Executive"],
      ["Azman Hashim", "870808-14-7003", "azman@topglove.my", "Logistics", "Logistics Lead"],
      ["Grace Pereira", "910303-14-7004", "grace@topglove.my", "HR", "HR Manager"],
      ["Lee Jun Wei", "920606-14-7005", "junwei@topglove.my", "Engineering", "Maintenance Eng."],
      ["Farah Yasmin", "890909-14-7006", "farah@topglove.my", "Supply Chain", "Procurement"],
      ["Tan Boon Keong", "870404-14-7007", "boonkeong@topglove.my", "Production", "Shift Supervisor"],
      ["Salmah Bakar", "910707-14-7008", "salmah@topglove.my", "QA", "QA Manager"],
    ],
    airAsia: [
      ["Captain Rizal", "850101-14-8001", "rizal@airasia.my", "Flight Ops", "Chief Pilot"],
      ["Susan Goh", "880303-14-8002", "susan@airasia.my", "Cabin Crew", "Cabin Crew Manager"],
      ["Iskandar Putra", "900505-14-8003", "iskandar@airasia.my", "Engineering", "Aircraft Engineer"],
      ["Mei Xin Tan", "910707-14-8004", "meixin@airasia.my", "Marketing", "Campaign Manager"],
      ["Ravi Chandran", "870909-14-8005", "ravi@airasia.my", "IT", "DevOps Lead"],
      ["Alia Suffian", "921111-14-8006", "alia@airasia.my", "Customer Experience", "CX Manager"],
      ["Hazim Fikri", "890404-14-8007", "hazim@airasia.my", "Operations", "Ground Ops Lead"],
      ["Lily Chong", "910606-14-8008", "lily@airasia.my", "Finance", "Revenue Analyst"],
      ["Danial Razak", "880808-14-8009", "danial@airasia.my", "Safety", "Safety Officer"],
      ["Zara Zulkifli", "931010-14-8010", "zara@airasia.my", "HR", "L&D Specialist"],
      ["Aiman Syahmi", "900202-14-8011", "aiman@airasia.my", "IT", "Full Stack Developer"],
      ["Noraini Hassan", "890505-14-8012", "noraini@airasia.my", "Finance", "Financial Controller"],
    ],
    telekom: [
      ["Azlan Shah", "880101-14-9001", "azlan@tm.my", "Network", "Network Architect"],
      ["Siti Mariam", "900303-14-9002", "sitim@tm.my", "IT", "Senior Developer"],
      ["Chong Wei Ming", "870505-14-9003", "weiming@tm.my", "Product", "Product Manager"],
      ["Kavitha Devi", "910707-14-9004", "kavitha@tm.my", "Marketing", "Brand Lead"],
      ["Hafiz Rahman", "890909-14-9005", "hafiz@tm.my", "Sales", "Enterprise Sales"],
      ["Linda Yeoh", "921111-14-9006", "linda@tm.my", "Finance", "Finance Manager"],
      ["Muthusamy R.", "860404-14-9007", "muthu@tm.my", "Operations", "Ops Director"],
      ["Nur Syafiqah", "930606-14-9008", "syafiqah@tm.my", "HR", "HR Executive"],
      ["Wong Kah Wai", "880808-14-9009", "kahwai@tm.my", "Engineering", "Solutions Engineer"],
      ["Sarah Liew", "900101-14-9010", "sarahl@tm.my", "Customer Service", "CS Team Lead"],
      ["Daniel Fernandez", "910303-14-9011", "daniel@tm.my", "IT", "Cloud Architect"],
      ["Aisyah Bakar", "890505-14-9012", "aisyah@tm.my", "Legal", "Legal Counsel"],
    ],
    simeDarby: [
      ["James Pereira", "870101-14-1001", "james@sdarby.my", "Operations", "Plant Manager"],
      ["Nur Hidayah", "890303-14-1002", "hidayah@sdarby.my", "Supply Chain", "Logistics Head"],
      ["Tan Boon Hock", "900505-14-1003", "boonhock@sdarby.my", "Engineering", "Chief Engineer"],
      ["Shanti Gopal", "910707-14-1004", "shanti@sdarby.my", "HR", "HR Director"],
      ["Ahmad Ridzuan", "880909-14-1005", "ridzuan@sdarby.my", "Finance", "Senior Accountant"],
      ["Grace Ng", "921111-14-1006", "graceng@sdarby.my", "Marketing", "Communications Manager"],
      ["Lee Chong Wei", "860404-14-1007", "chongwei@sdarby.my", "Sales", "Regional Sales Director"],
      ["Farah Wahida", "930808-14-1008", "farahw@sdarby.my", "Quality", "QA Manager"],
      ["Ravi Kumar", "890101-14-1009", "ravik@sdarby.my", "IT", "ERP Specialist"],
      ["Zaiton Ismail", "900303-14-1010", "zaiton@sdarby.my", "Procurement", "Head of Procurement"],
      ["Michael Chen", "880505-14-1011", "michaelc@sdarby.my", "R&D", "R&D Lead"],
      ["Salmiah Yusof", "910707-14-1012", "salmiahy@sdarby.my", "Governance", "Compliance Officer"],
    ],
  };

  const companyMap: Record<string, string> = {
    petronas: petronas.id,
    maybank: maybank.id,
    topGlove: topGlove.id,
    airAsia: airAsia.id,
    telekom: telekom.id,
    simeDarby: simeDarby.id,
  };

  const allEmployees: Record<string, any[]> = {};

  for (const [key, emps] of Object.entries(empData)) {
    const created = [];
    for (const [name, ic, email, dept, pos] of emps) {
      const e = await prisma.employee.create({
        data: {
          companyId: companyMap[key], name, icNumber: ic, email,
          department: dept, position: pos,
          dateJoined: new Date(2019 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), 1),
          employmentType: "PERMANENT", status: "ACTIVE",
        },
      });
      created.push(e);
    }
    allEmployees[key] = created;
  }

  const now = new Date();
  const Y = now.getFullYear();
  const M = now.getMonth();

  // ─── Programs ───────────────────────────────────────────
  // 1: Leadership (Aisha)
  const prog1 = await prisma.program.create({
    data: {
      trainerId: trainer1.id, title: "Transformational Leadership for Malaysian Managers",
      description: "Equip your middle managers with modern leadership skills rooted in Malaysian workplace culture. Covers cross-cultural team management, conflict resolution, and performance coaching.",
      category: "Leadership", durationHours: 16, maxParticipants: 25, pricePerPax: 1200,
      locationType: "onsite", syllabus: JSON.stringify([
        "Understanding Malaysian Leadership Context", "Cross-Cultural Team Dynamics",
        "Coaching for Performance", "Conflict Resolution Strategies", "Leading Through Change",
      ]),
      status: "PUBLISHED",
      thumbnailUrl: "https://images.unsplash.com/photo-1542744173-8e82cd37d93b?w=600&h=400&fit=crop",
    },
  });
  const mod1a = await prisma.module.create({ data: { programId: prog1.id, title: "Leadership Foundations", orderIndex: 0, durationMins: 180 } });
  const mod1b = await prisma.module.create({ data: { programId: prog1.id, title: "Coaching & Feedback", orderIndex: 1, durationMins: 240 } });
  const mod1c = await prisma.module.create({ data: { programId: prog1.id, title: "Leading Diverse Teams", orderIndex: 2, durationMins: 210 } });

  const quiz1 = await prisma.quiz.create({ data: { moduleId: mod1a.id, title: "Leadership Pre-Assessment", passingScore: 60, timeLimitMins: 20 } });
  await prisma.question.createMany({
    data: [
      { quizId: quiz1.id, text: "Which leadership style is most effective in a Malaysian hierarchical organisation?", type: "MCQ", options: JSON.stringify(["Autocratic", "Transformational", "Laissez-faire", "Transactional"]), correctAnswer: "Transformational", points: 2, orderIndex: 0 },
      { quizId: quiz1.id, text: "True or False: Effective leaders should treat all team members exactly the same regardless of cultural background.", type: "TRUE_FALSE", options: JSON.stringify(["True", "False"]), correctAnswer: "False", points: 1, orderIndex: 1 },
      { quizId: quiz1.id, text: "What is the first step in the coaching model?", type: "MCQ", options: JSON.stringify(["Give feedback", "Set goals", "Build rapport", "Observe behaviour"]), correctAnswer: "Build rapport", points: 2, orderIndex: 2 },
      { quizId: quiz1.id, text: "Name one key challenge when managing a multi-generational workforce.", type: "SHORT_ANSWER", options: "[]", correctAnswer: "Communication differences", points: 3, orderIndex: 3 },
      { quizId: quiz1.id, text: "Conflict in teams should always be avoided.", type: "TRUE_FALSE", options: JSON.stringify(["True", "False"]), correctAnswer: "False", points: 1, orderIndex: 4 },
    ],
  });

  await prisma.material.createMany({
    data: [
      { moduleId: mod1a.id, title: "Leadership Foundations Slides", fileUrl: "/materials/leadership-foundations.pdf", fileType: "pdf", orderIndex: 0 },
      { moduleId: mod1b.id, title: "Coaching Handbook", fileUrl: "/materials/coaching-handbook.pdf", fileType: "pdf", orderIndex: 0 },
      { moduleId: mod1c.id, title: "Diversity & Inclusion Guide", fileUrl: "/materials/diversity-guide.pdf", fileType: "pdf", orderIndex: 0 },
    ],
  });

  // 2: Digital Transformation (Jason)
  const prog2 = await prisma.program.create({
    data: {
      trainerId: trainer2.id, title: "Industry 4.0 & Digital Transformation for SMEs",
      description: "Practical workshop on adopting digital tools, AI readiness, and cybersecurity posture for Malaysian SMEs and GLCs.",
      category: "Technical", durationHours: 8, maxParticipants: 30, pricePerPax: 900,
      locationType: "hybrid", syllabus: JSON.stringify(["What is Industry 4.0?", "AI & Automation Basics", "Cybersecurity for Non-IT Managers", "Building a Digital Roadmap"]),
      status: "PUBLISHED",
    },
  });
  const mod2a = await prisma.module.create({ data: { programId: prog2.id, title: "Digital Landscape Overview", orderIndex: 0, durationMins: 120 } });
  const mod2b = await prisma.module.create({ data: { programId: prog2.id, title: "Cybersecurity Essentials", orderIndex: 1, durationMins: 150 } });
  await prisma.quiz.create({ data: { moduleId: mod2b.id, title: "Cybersecurity Readiness Check", passingScore: 65, timeLimitMins: 25 } });

  // 3: Employment Law (Sarah)
  const prog3 = await prisma.program.create({
    data: {
      trainerId: trainer3.id, title: "Malaysian Employment Law & Compliance 2026",
      description: "Comprehensive workshop on Employment Act 1955 amendments, industrial relations, disciplinary procedures, and latest HR compliance requirements.",
      category: "Compliance", durationHours: 12, maxParticipants: 20, pricePerPax: 1500,
      locationType: "onsite", syllabus: JSON.stringify(["Employment Act 1955 Amendments", "Managing Probationers & Contractors", "Domestic Inquiry Process", "Termination & Retrenchment"]),
      status: "PUBLISHED",
    },
  });
  const mod3a = await prisma.module.create({ data: { programId: prog3.id, title: "Employment Act Deep Dive", orderIndex: 0, durationMins: 200 } });
  const mod3b = await prisma.module.create({ data: { programId: prog3.id, title: "Disciplinary & Domestic Inquiry", orderIndex: 1, durationMins: 180 } });
  await prisma.module.create({ data: { programId: prog3.id, title: "Termination & Retrenchment", orderIndex: 2, durationMins: 150 } });

  const quiz3 = await prisma.quiz.create({ data: { moduleId: mod3a.id, title: "Employment Law Knowledge Check", passingScore: 70, timeLimitMins: 30 } });
  await prisma.question.createMany({
    data: [
      { quizId: quiz3.id, text: "Under the EA 1955, what is the minimum annual leave for an employee with 3 years of service?", type: "MCQ", options: JSON.stringify(["8 days", "12 days", "16 days", "14 days"]), correctAnswer: "12 days", points: 2, orderIndex: 0 },
      { quizId: quiz3.id, text: "A domestic inquiry must be held before any dismissal for misconduct.", type: "TRUE_FALSE", options: JSON.stringify(["True", "False"]), correctAnswer: "True", points: 1, orderIndex: 1 },
      { quizId: quiz3.id, text: "What is the current maternity leave entitlement in Malaysia?", type: "MCQ", options: JSON.stringify(["60 days", "90 days", "98 days", "14 weeks"]), correctAnswer: "98 days", points: 2, orderIndex: 2 },
    ],
  });

  // 4: Team Building (Aisha)
  const prog4 = await prisma.program.create({
    data: {
      trainerId: trainer1.id, title: "Epic Team Building: KL Survival Challenge",
      description: "Outdoor team building adventure across Kuala Lumpur. Teams solve puzzles and build collaboration skills.",
      category: "Team Building", durationHours: 8, maxParticipants: 40, pricePerPax: 350,
      locationType: "onsite", status: "PUBLISHED",
    },
  });
  await prisma.module.create({ data: { programId: prog4.id, title: "Morning Kickoff & Ice Breakers", orderIndex: 0, durationMins: 90 } });
  await prisma.module.create({ data: { programId: prog4.id, title: "City Challenge Rounds", orderIndex: 1, durationMins: 300 } });

  // 5: Soft Skills (Jason)
  const prog5 = await prisma.program.create({
    data: {
      trainerId: trainer2.id, title: "Effective Communication & Presentation Skills",
      description: "Master business communication, presentation delivery, and cross-department collaboration for today's hybrid workplace.",
      category: "Soft Skills", durationHours: 6, maxParticipants: 20, pricePerPax: 600,
      locationType: "online", status: "PUBLISHED",
    },
  });
  await prisma.module.create({ data: { programId: prog5.id, title: "Communication Fundamentals", orderIndex: 0, durationMins: 120 } });
  await prisma.module.create({ data: { programId: prog5.id, title: "Presentation Mastery", orderIndex: 1, durationMins: 150 } });

  // 6: HR Operations (Sarah)
  const prog6 = await prisma.program.create({
    data: {
      trainerId: trainer3.id, title: "Strategic HR: From Admin to Business Partner",
      description: "Transform your HR function from administrative to strategic. Learn workforce planning, talent analytics, and HR business partnering.",
      category: "HR Operations", durationHours: 8, maxParticipants: 15, pricePerPax: 1000,
      locationType: "hybrid", status: "PUBLISHED",
    },
  });
  await prisma.module.create({ data: { programId: prog6.id, title: "HR Business Partnering Model", orderIndex: 0, durationMins: 180 } });
  await prisma.module.create({ data: { programId: prog6.id, title: "Workforce Analytics", orderIndex: 1, durationMins: 150 } });

  // 7: Advanced Leadership (Aisha)
  const prog7 = await prisma.program.create({
    data: {
      trainerId: trainer1.id, title: "Strategic Leadership & Boardroom Readiness",
      description: "Prepares senior managers for C-suite and board-level responsibilities. Covers corporate governance, strategic decision-making, and stakeholder management in Malaysian PLC environment.",
      category: "Leadership", durationHours: 24, maxParticipants: 15, pricePerPax: 2800,
      locationType: "hybrid", syllabus: JSON.stringify(["Corporate Governance in Malaysia", "Strategic Planning Frameworks", "Boardroom Dynamics", "Stakeholder Communication", "Crisis Leadership"]),
      status: "PUBLISHED",
    },
  });
  const mod7a = await prisma.module.create({ data: { programId: prog7.id, title: "Governance & Ethics", orderIndex: 0, durationMins: 240 } });
  const mod7b = await prisma.module.create({ data: { programId: prog7.id, title: "Strategic Decision Making", orderIndex: 1, durationMins: 300 } });
  const mod7c = await prisma.module.create({ data: { programId: prog7.id, title: "Board Simulation", orderIndex: 2, durationMins: 360 } });
  const quiz7 = await prisma.quiz.create({ data: { moduleId: mod7a.id, title: "Governance Readiness Quiz", passingScore: 70, timeLimitMins: 25 } });
  await prisma.question.createMany({
    data: [
      { quizId: quiz7.id, text: "What is the primary role of an independent director on a Malaysian PLC board?", type: "MCQ", options: JSON.stringify(["Represent shareholders", "Provide independent oversight", "Manage daily operations", "Set executive salaries"]), correctAnswer: "Provide independent oversight", points: 2, orderIndex: 0 },
      { quizId: quiz7.id, text: "MCCG 2021 recommends at least half the board be independent directors for large companies.", type: "TRUE_FALSE", options: JSON.stringify(["True", "False"]), correctAnswer: "True", points: 1, orderIndex: 1 },
      { quizId: quiz7.id, text: "Which framework is commonly used for strategic analysis in Malaysia?", type: "MCQ", options: JSON.stringify(["SWOT", "PESTLE", "Five Forces", "All of the above"]), correctAnswer: "All of the above", points: 2, orderIndex: 2 },
    ],
  });

  // 8: Data Analytics (Jason)
  const prog8 = await prisma.program.create({
    data: {
      trainerId: trainer2.id, title: "Data-Driven Decision Making with Power BI",
      description: "Hands-on workshop for managers to build dashboards, analyse trends, and make data-backed decisions. No coding experience needed.",
      category: "Technical", durationHours: 12, maxParticipants: 20, pricePerPax: 1100,
      locationType: "online", syllabus: JSON.stringify(["Introduction to Data Analytics", "Power BI Basics", "Building Interactive Dashboards", "Data Storytelling", "Making Data-Driven Decisions"]),
      status: "PUBLISHED",
    },
  });
  const mod8a = await prisma.module.create({ data: { programId: prog8.id, title: "Analytics Fundamentals", orderIndex: 0, durationMins: 150 } });
  const mod8b = await prisma.module.create({ data: { programId: prog8.id, title: "Power BI Hands-On Lab", orderIndex: 1, durationMins: 300 } });
  const mod8c = await prisma.module.create({ data: { programId: prog8.id, title: "Data Storytelling", orderIndex: 2, durationMins: 120 } });
  await prisma.quiz.create({ data: { moduleId: mod8a.id, title: "Data Literacy Check", passingScore: 60, timeLimitMins: 20 } });

  // 9: Advanced Compliance (Sarah)
  const prog9 = await prisma.program.create({
    data: {
      trainerId: trainer3.id, title: "Anti-Corruption & Integrity for Malaysian Corporates",
      description: "MACC Act 2009 compliance, corporate liability provision Section 17A, adequate procedures, and whistleblowing framework implementation.",
      category: "Compliance", durationHours: 8, maxParticipants: 25, pricePerPax: 950,
      locationType: "onsite", syllabus: JSON.stringify(["MACC Act 2009 Overview", "Section 17A Corporate Liability", "Adequate Procedures Framework", "Whistleblowing Best Practices", "Case Studies"]),
      status: "PUBLISHED",
    },
  });
  const mod9a = await prisma.module.create({ data: { programId: prog9.id, title: "Anti-Corruption Law Deep Dive", orderIndex: 0, durationMins: 200 } });
  const mod9b = await prisma.module.create({ data: { programId: prog9.id, title: "Implementing Integrity Frameworks", orderIndex: 1, durationMins: 180 } });
  const quiz9 = await prisma.quiz.create({ data: { moduleId: mod9a.id, title: "Integrity & Compliance Quiz", passingScore: 75, timeLimitMins: 20 } });
  await prisma.question.createMany({
    data: [
      { quizId: quiz9.id, text: "Under Section 17A MACC Act, a commercial organisation commits an offence if:", type: "MCQ", options: JSON.stringify(["An employee gives a bribe", "An associated person gives a bribe for the organisation's benefit", "A competitor engages in corruption", "The CEO personally approves a bribe"]), correctAnswer: "An associated person gives a bribe for the organisation's benefit", points: 2, orderIndex: 0 },
      { quizId: quiz9.id, text: "The defence of 'adequate procedures' requires organisations to prove they had measures in place to prevent corruption.", type: "TRUE_FALSE", options: JSON.stringify(["True", "False"]), correctAnswer: "True", points: 1, orderIndex: 1 },
    ],
  });

  // 10: New — Project Management (Jason)
  const prog10 = await prisma.program.create({
    data: {
      trainerId: trainer2.id, title: "Agile Project Management for Malaysian Enterprises",
      description: "Learn Scrum, Kanban, and hybrid project management approaches adapted for Malaysian corporate culture and government-linked projects.",
      category: "Technical", durationHours: 16, maxParticipants: 20, pricePerPax: 1300,
      locationType: "hybrid", syllabus: JSON.stringify(["Agile vs Waterfall", "Scrum Framework", "Kanban Boards", "User Stories & Backlog", "Sprint Planning & Retrospectives"]),
      status: "PUBLISHED",
    },
  });
  const mod10a = await prisma.module.create({ data: { programId: prog10.id, title: "Agile Mindset & Scrum", orderIndex: 0, durationMins: 240 } });
  const mod10b = await prisma.module.create({ data: { programId: prog10.id, title: "Kanban & Hybrid PM", orderIndex: 1, durationMins: 210 } });
  const mod10c = await prisma.module.create({ data: { programId: prog10.id, title: "Project Simulation", orderIndex: 2, durationMins: 330 } });
  await prisma.material.createMany({
    data: [
      { moduleId: mod10a.id, title: "Scrum Guide Quick Reference", fileUrl: "/materials/scrum-guide.pdf", fileType: "pdf", orderIndex: 0 },
      { moduleId: mod10b.id, title: "Kanban Board Templates", fileUrl: "/materials/kanban-templates.pptx", fileType: "ppt", orderIndex: 0 },
    ],
  });

  // 11: Emotional Intelligence (Aisha)
  const prog11 = await prisma.program.create({
    data: {
      trainerId: trainer1.id, title: "Emotional Intelligence & Resilience at Work",
      description: "Develop EQ competencies — self-awareness, empathy, relationship management. Build mental resilience for high-pressure Malaysian work environments.",
      category: "Soft Skills", durationHours: 8, maxParticipants: 25, pricePerPax: 700,
      locationType: "onsite", syllabus: JSON.stringify(["Understanding EQ", "Self-Awareness & Self-Regulation", "Empathy in the Workplace", "Building Resilience", "Action Planning"]),
      status: "PUBLISHED",
    },
  });
  const mod11a = await prisma.module.create({ data: { programId: prog11.id, title: "EQ Foundations", orderIndex: 0, durationMins: 180 } });
  const mod11b = await prisma.module.create({ data: { programId: prog11.id, title: "Resilience Building Workshop", orderIndex: 1, durationMins: 210 } });

  // 12: HR Analytics (Sarah)
  const prog12 = await prisma.program.create({
    data: {
      trainerId: trainer3.id, title: "HR Analytics & People Metrics Masterclass",
      description: "Move beyond basic reporting. Learn workforce analytics, predictive HR, turnover modelling, and how to build compelling HR dashboards.",
      category: "HR Operations", durationHours: 12, maxParticipants: 15, pricePerPax: 1600,
      locationType: "online", syllabus: JSON.stringify(["HR Metrics Framework", "Turnover & Retention Analytics", "Predictive Workforce Planning", "HR Dashboard Design", "Data-Driven Talent Decisions"]),
      status: "PUBLISHED",
    },
  });
  const mod12a = await prisma.module.create({ data: { programId: prog12.id, title: "HR Metrics & KPIs", orderIndex: 0, durationMins: 200 } });
  const mod12b = await prisma.module.create({ data: { programId: prog12.id, title: "Predictive Analytics Lab", orderIndex: 1, durationMins: 250 } });
  await prisma.material.create({ data: { moduleId: mod12a.id, title: "HR Metrics Cheat Sheet", fileUrl: "/materials/hr-metrics-cheatsheet.pdf", fileType: "pdf", orderIndex: 0 } });

  // ─── BOOKINGS (mix of COMPLETED, CONFIRMED, PENDING) ────

  // Completed Booking 1: Petronas → Leadership (3 months ago)
  const b1 = await prisma.booking.create({
    data: {
      programId: prog1.id, hrId: hr1.id, companyId: petronas.id,
      programDate: new Date(Y, M - 3, 12), totalFee: 12000, depositPaid: 3600, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.petronas.slice(0, 10)) {
    await prisma.participant.create({
      data: { bookingId: b1.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Completed Booking 2: Maybank → Digital Transformation (2 months ago)
  const b2 = await prisma.booking.create({
    data: {
      programId: prog2.id, hrId: hr2.id, companyId: maybank.id,
      programDate: new Date(Y, M - 2, 8), totalFee: 7200, depositPaid: 2160, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.maybank.slice(0, 8)) {
    await prisma.participant.create({
      data: { bookingId: b2.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Completed Booking 3: Top Glove → Employment Law (1 month ago)
  const b3 = await prisma.booking.create({
    data: {
      programId: prog3.id, hrId: hr3.id, companyId: topGlove.id,
      programDate: new Date(Y, M - 1, 15), totalFee: 12000, depositPaid: 3600, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.topGlove.slice(0, 8)) {
    await prisma.participant.create({
      data: { bookingId: b3.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Completed Booking 4: AirAsia → Soft Skills (1 month ago)
  const b4 = await prisma.booking.create({
    data: {
      programId: prog5.id, hrId: hr4.id, companyId: airAsia.id,
      programDate: new Date(Y, M - 1, 22), totalFee: 6000, depositPaid: 1800, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.airAsia.slice(0, 10)) {
    await prisma.participant.create({
      data: { bookingId: b4.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: e.name.includes("Captain") ? "ABSENT" : "PRESENT"},
    });
  }

  // Completed Booking 5: Petronas → Team Building (2 months ago)
  const b5 = await prisma.booking.create({
    data: {
      programId: prog4.id, hrId: hr1.id, companyId: petronas.id,
      programDate: new Date(Y, M - 2, 18), totalFee: 8750, depositPaid: 2600, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.petronas.slice(0, 12)) {
    await prisma.participant.create({
      data: { bookingId: b5.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT" },
    });
  }

  // Completed Booking 6: AirAsia → Leadership (3 months ago)
  const b6 = await prisma.booking.create({
    data: {
      programId: prog1.id, hrId: hr4.id, companyId: airAsia.id,
      programDate: new Date(Y, M - 3, 25), totalFee: 9600, depositPaid: 2880, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.airAsia.slice(5, 10)) {
    await prisma.participant.create({
      data: { bookingId: b6.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Confirmed Booking: Maybank → Employment Law (next month)
  const b7 = await prisma.booking.create({
    data: {
      programId: prog3.id, hrId: hr2.id, companyId: maybank.id,
      programDate: new Date(Y, M + 1, 10), totalFee: 15000, depositPaid: 4500, depositStatus: "PAID", status: "CONFIRMED",
    },
  });
  for (const e of allEmployees.maybank.slice(0, 10)) {
    await prisma.participant.create({
      data: { bookingId: b7.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PENDING" },
    });
  }

  // Confirmed Booking: Top Glove → Team Building (next month)
  const b8 = await prisma.booking.create({
    data: {
      programId: prog4.id, hrId: hr3.id, companyId: topGlove.id,
      programDate: new Date(Y, M + 1, 28), totalFee: 7000, depositPaid: 2100, depositStatus: "PAID", status: "CONFIRMED",
    },
  });

  // Pending Booking: Petronas → HR Operations
  const b9 = await prisma.booking.create({
    data: {
      programId: prog6.id, hrId: hr1.id, companyId: petronas.id,
      programDate: new Date(Y, M + 2, 5), totalFee: 5000, depositPaid: 0, depositStatus: "UNPAID", status: "PENDING",
    },
  });

  // Pending Booking: AirAsia → Digital Transformation
  const b10 = await prisma.booking.create({
    data: {
      programId: prog2.id, hrId: hr4.id, companyId: airAsia.id,
      programDate: new Date(Y, M + 2, 15), totalFee: 9000, depositPaid: 0, depositStatus: "UNPAID", status: "PENDING",
    },
  });

  // ─── MORE BOOKINGS (for new programs & companies) ─────────

  // Completed: Maybank → Team Building (4 months ago)
  const b11 = await prisma.booking.create({
    data: {
      programId: prog4.id, hrId: hr2.id, companyId: maybank.id,
      programDate: new Date(Y, M - 4, 8), totalFee: 7000, depositPaid: 2100, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.maybank.slice(0, 10)) {
    await prisma.participant.create({
      data: { bookingId: b11.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT" },
    });
  }

  // Completed: Petronas → Communication Skills (4 months ago)
  const b12 = await prisma.booking.create({
    data: {
      programId: prog5.id, hrId: hr1.id, companyId: petronas.id,
      programDate: new Date(Y, M - 4, 20), totalFee: 6000, depositPaid: 1800, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.petronas.slice(0, 10)) {
    await prisma.participant.create({
      data: { bookingId: b12.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Completed: Telekom → Digital Transformation (3 months ago)
  const b13 = await prisma.booking.create({
    data: {
      programId: prog2.id, hrId: hr5.id, companyId: telekom.id,
      programDate: new Date(Y, M - 3, 5), totalFee: 10800, depositPaid: 3240, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.telekom.slice(0, 12)) {
    await prisma.participant.create({
      data: { bookingId: b13.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Completed: Sime Darby → Employment Law (2 months ago)
  const b14 = await prisma.booking.create({
    data: {
      programId: prog3.id, hrId: hr6.id, companyId: simeDarby.id,
      programDate: new Date(Y, M - 2, 12), totalFee: 15000, depositPaid: 4500, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.simeDarby.slice(0, 10)) {
    await prisma.participant.create({
      data: { bookingId: b14.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Completed: Top Glove → Leadership (1 month ago)
  const b15 = await prisma.booking.create({
    data: {
      programId: prog1.id, hrId: hr3.id, companyId: topGlove.id,
      programDate: new Date(Y, M - 1, 5), totalFee: 9600, depositPaid: 2880, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.topGlove.slice(0, 8)) {
    await prisma.participant.create({
      data: { bookingId: b15.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Completed: AirAsia → HR Ops (2 months ago)
  const b16 = await prisma.booking.create({
    data: {
      programId: prog6.id, hrId: hr4.id, companyId: airAsia.id,
      programDate: new Date(Y, M - 2, 18), totalFee: 5000, depositPaid: 1500, depositStatus: "PAID", status: "COMPLETED",
    },
  });
  for (const e of allEmployees.airAsia.slice(0, 5)) {
    await prisma.participant.create({
      data: { bookingId: b16.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PRESENT"},
    });
  }

  // Confirmed: Petronas → Advanced Leadership (this month)
  const b17 = await prisma.booking.create({
    data: {
      programId: prog7.id, hrId: hr1.id, companyId: petronas.id,
      programDate: new Date(Y, M, 25), totalFee: 22400, depositPaid: 6720, depositStatus: "PAID", status: "CONFIRMED",
    },
  });
  for (const e of allEmployees.petronas.slice(0, 8)) {
    await prisma.participant.create({
      data: { bookingId: b17.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PENDING" },
    });
  }

  // Confirmed: Telekom → Data Analytics (next month)
  const b18 = await prisma.booking.create({
    data: {
      programId: prog8.id, hrId: hr5.id, companyId: telekom.id,
      programDate: new Date(Y, M + 1, 15), totalFee: 13200, depositPaid: 3960, depositStatus: "PAID", status: "CONFIRMED",
    },
  });
  for (const e of allEmployees.telekom.slice(0, 12)) {
    await prisma.participant.create({
      data: { bookingId: b18.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PENDING" },
    });
  }

  // Confirmed: Sime Darby → Anti-Corruption (next month)
  const b19 = await prisma.booking.create({
    data: {
      programId: prog9.id, hrId: hr6.id, companyId: simeDarby.id,
      programDate: new Date(Y, M + 1, 20), totalFee: 14250, depositPaid: 4275, depositStatus: "PAID", status: "CONFIRMED",
    },
  });
  for (const e of allEmployees.simeDarby.slice(0, 12)) {
    await prisma.participant.create({
      data: { bookingId: b19.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PENDING" },
    });
  }

  // Confirmed: Maybank → EQ (next month)
  const b20 = await prisma.booking.create({
    data: {
      programId: prog11.id, hrId: hr2.id, companyId: maybank.id,
      programDate: new Date(Y, M + 1, 8), totalFee: 10500, depositPaid: 3150, depositStatus: "PAID", status: "CONFIRMED",
    },
  });
  for (const e of allEmployees.maybank.slice(0, 10)) {
    await prisma.participant.create({
      data: { bookingId: b20.id, employeeId: e.id, name: e.name, email: e.email, icNumber: e.icNumber, department: e.department, attendanceStatus: "PENDING" },
    });
  }

  // Pending: Top Glove → Agile PM (this month)
  const b21 = await prisma.booking.create({
    data: {
      programId: prog10.id, hrId: hr3.id, companyId: topGlove.id,
      programDate: new Date(Y, M + 2, 10), totalFee: 13000, depositPaid: 0, depositStatus: "UNPAID", status: "PENDING",
    },
  });

  // Pending: AirAsia → EQ (this month)
  await prisma.booking.create({
    data: {
      programId: prog11.id, hrId: hr4.id, companyId: airAsia.id,
      programDate: new Date(Y, M + 2, 22), totalFee: 7000, depositPaid: 0, depositStatus: "UNPAID", status: "PENDING",
    },
  });

  // Pending: Telekom → HR Analytics
  await prisma.booking.create({
    data: {
      programId: prog12.id, hrId: hr5.id, companyId: telekom.id,
      programDate: new Date(Y, M + 3, 5), totalFee: 16000, depositPaid: 0, depositStatus: "UNPAID", status: "PENDING",
    },
  });

  // ─── EVALUATIONS (for all 6 completed bookings) ──────────

  const evalTemplate = [
    { question: "How would you rate the trainer's knowledge and delivery?", type: "RATING", maxRating: 5 },
    { question: "Was the content relevant to your role?", type: "RATING", maxRating: 5 },
    { question: "How useful were the materials and handouts?", type: "RATING", maxRating: 5 },
    { question: "Rate the overall training experience.", type: "RATING", maxRating: 5 },
    { question: "What will you apply immediately from this program?", type: "TEXT", maxRating: 0 },
    { question: "Any suggestions for improvement?", type: "TEXT", maxRating: 0 },
  ];

  const completedBookings = [
    { booking: b1, program: "Leadership", company: "Petronas", pax: 10, trainerId: trainer1.id, hrId: hr1.id },
    { booking: b2, program: "Digital Transformation", company: "Maybank", pax: 8, trainerId: trainer2.id, hrId: hr2.id },
    { booking: b3, program: "Employment Law", company: "Top Glove", pax: 8, trainerId: trainer3.id, hrId: hr3.id },
    { booking: b4, program: "Communication Skills", company: "AirAsia", pax: 10, trainerId: trainer2.id, hrId: hr4.id },
    { booking: b5, program: "Team Building", company: "Petronas", pax: 12, trainerId: trainer1.id, hrId: hr1.id },
    { booking: b6, program: "Leadership", company: "AirAsia", pax: 5, trainerId: trainer1.id, hrId: hr4.id },
    { booking: b11, program: "Team Building", company: "Maybank", pax: 10, trainerId: trainer1.id, hrId: hr2.id },
    { booking: b12, program: "Communication Skills", company: "Petronas", pax: 10, trainerId: trainer2.id, hrId: hr1.id },
    { booking: b13, program: "Digital Transformation", company: "Telekom", pax: 12, trainerId: trainer2.id, hrId: hr5.id },
    { booking: b14, program: "Employment Law", company: "Sime Darby", pax: 10, trainerId: trainer3.id, hrId: hr6.id },
    { booking: b15, program: "Leadership", company: "Top Glove", pax: 8, trainerId: trainer1.id, hrId: hr3.id },
    { booking: b16, program: "HR Operations", company: "AirAsia", pax: 5, trainerId: trainer3.id, hrId: hr4.id },
  ];

  for (const cb of completedBookings) {
    const participants = await prisma.participant.findMany({
      where: { bookingId: cb.booking.id },
      select: { name: true },
    });
    const paxNames = participants.map((p) => p.name);
    const responses = makeEvalResponses(paxNames, evalTemplate);
    const avgRating = responses.reduce((sum, r) => {
      const ratings = r.answers.filter((a: any) => a.rating > 0).map((a: any) => a.rating);
      return sum + (ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0);
    }, 0) / (responses.length || 1);

    await prisma.evaluation.create({
      data: {
        bookingId: cb.booking.id,
        title: `${cb.program} Program — ${cb.company} Feedback`,
        questions: JSON.stringify(evalTemplate),
        sentAt: new Date(cb.booking.programDate.getTime() + 86400000),
        responses: JSON.stringify(responses),
        summaryScore: Math.round(avgRating * 10) / 10,
        completedAt: new Date(cb.booking.programDate.getTime() + 3 * 86400000),
      },
    });
  }

  // ─── INVOICES ───────────────────────────────────────────
  await prisma.invoice.create({ data: { bookingId: b1.id, companyId: petronas.id, invoiceNumber: "INV-2026-001", amount: 12000, status: "PAID", issuedAt: new Date(Y, M - 3, 1), dueDate: new Date(Y, M - 2, 1), paidAt: new Date(Y, M - 2, 5) } });
  await prisma.invoice.create({ data: { bookingId: b2.id, companyId: maybank.id, invoiceNumber: "INV-2026-002", amount: 7200, status: "PAID", issuedAt: new Date(Y, M - 2, 1), dueDate: new Date(Y, M - 1, 1), paidAt: new Date(Y, M - 1, 3) } });
  await prisma.invoice.create({ data: { bookingId: b3.id, companyId: topGlove.id, invoiceNumber: "INV-2026-003", amount: 12000, status: "PAID", issuedAt: new Date(Y, M - 1, 1), dueDate: new Date(Y, M, 1), paidAt: new Date(Y, M, 2) } });
  await prisma.invoice.create({ data: { bookingId: b4.id, companyId: airAsia.id, invoiceNumber: "INV-2026-004", amount: 6000, status: "PAID", issuedAt: new Date(Y, M - 1, 1), dueDate: new Date(Y, M, 1), paidAt: new Date(Y, M, 5) } });
  await prisma.invoice.create({ data: { bookingId: b5.id, companyId: petronas.id, invoiceNumber: "INV-2026-005", amount: 8750, status: "PAID", issuedAt: new Date(Y, M - 2, 1), dueDate: new Date(Y, M - 1, 1), paidAt: new Date(Y, M - 1, 10) } });
  await prisma.invoice.create({ data: { bookingId: b6.id, companyId: airAsia.id, invoiceNumber: "INV-2026-006", amount: 9600, status: "PAID", issuedAt: new Date(Y, M - 3, 1), dueDate: new Date(Y, M - 2, 1), paidAt: new Date(Y, M - 2, 8) } });
  await prisma.invoice.create({ data: { bookingId: b7.id, companyId: maybank.id, invoiceNumber: "INV-2026-007", amount: 15000, status: "SENT", issuedAt: now, dueDate: new Date(Y, M + 1, 1) } });
  await prisma.invoice.create({ data: { bookingId: b8.id, companyId: topGlove.id, invoiceNumber: "INV-2026-008", amount: 7000, status: "SENT", issuedAt: now, dueDate: new Date(Y, M + 1, 1) } });
  await prisma.invoice.create({ data: { bookingId: b11.id, companyId: maybank.id, invoiceNumber: "INV-2026-009", amount: 7000, status: "PAID", issuedAt: new Date(Y, M - 4, 1), dueDate: new Date(Y, M - 3, 1), paidAt: new Date(Y, M - 3, 5) } });
  await prisma.invoice.create({ data: { bookingId: b12.id, companyId: petronas.id, invoiceNumber: "INV-2026-010", amount: 6000, status: "PAID", issuedAt: new Date(Y, M - 4, 1), dueDate: new Date(Y, M - 3, 1), paidAt: new Date(Y, M - 3, 8) } });
  await prisma.invoice.create({ data: { bookingId: b13.id, companyId: telekom.id, invoiceNumber: "INV-2026-011", amount: 10800, status: "PAID", issuedAt: new Date(Y, M - 3, 1), dueDate: new Date(Y, M - 2, 1), paidAt: new Date(Y, M - 2, 10) } });
  await prisma.invoice.create({ data: { bookingId: b14.id, companyId: simeDarby.id, invoiceNumber: "INV-2026-012", amount: 15000, status: "PAID", issuedAt: new Date(Y, M - 2, 1), dueDate: new Date(Y, M - 1, 1), paidAt: new Date(Y, M - 1, 5) } });
  await prisma.invoice.create({ data: { bookingId: b15.id, companyId: topGlove.id, invoiceNumber: "INV-2026-013", amount: 9600, status: "PAID", issuedAt: new Date(Y, M - 1, 1), dueDate: new Date(Y, M, 1), paidAt: new Date(Y, M, 3) } });
  await prisma.invoice.create({ data: { bookingId: b16.id, companyId: airAsia.id, invoiceNumber: "INV-2026-014", amount: 5000, status: "PAID", issuedAt: new Date(Y, M - 2, 1), dueDate: new Date(Y, M - 1, 1), paidAt: new Date(Y, M - 1, 15) } });
  await prisma.invoice.create({ data: { bookingId: b17.id, companyId: petronas.id, invoiceNumber: "INV-2026-015", amount: 22400, status: "SENT", issuedAt: now, dueDate: new Date(Y, M + 1, 1) } });
  await prisma.invoice.create({ data: { bookingId: b18.id, companyId: telekom.id, invoiceNumber: "INV-2026-016", amount: 13200, status: "SENT", issuedAt: now, dueDate: new Date(Y, M + 1, 1) } });
  await prisma.invoice.create({ data: { bookingId: b19.id, companyId: simeDarby.id, invoiceNumber: "INV-2026-017", amount: 14250, status: "SENT", issuedAt: now, dueDate: new Date(Y, M + 1, 1) } });
  await prisma.invoice.create({ data: { bookingId: b20.id, companyId: maybank.id, invoiceNumber: "INV-2026-018", amount: 10500, status: "SENT", issuedAt: now, dueDate: new Date(Y, M + 1, 1) } });

  // ─── REVIEWS ────────────────────────────────────────────
  const reviewTexts: Record<string, string[]> = {
    Leadership: [
      "Aisha is an incredible leadership coach. Her insights into cross-cultural management were eye-opening.",
      "The coaching framework has transformed how I manage my team. Highly recommended!",
      "Very practical and engaging. The Malaysian context examples made all the difference.",
    ],
    "Digital Transformation": [
      "Jason demystified Industry 4.0 for our team. Excellent workshop!",
      "Great balance of technical depth and business relevance. Our managers now have a clear digital roadmap.",
    ],
    "Employment Law": [
      "Sarah is THE expert on Malaysian employment law. Our HR team feels much more confident now.",
      "The domestic inquiry templates alone are worth the investment. Outstanding training.",
    ],
    "Communication Skills": [
      "Very practical presentation tips. Already seeing improvement in our team meetings.",
      "Good foundational course. Would be great to have an advanced follow-up.",
    ],
    "Team Building": [
      "Best team building we've ever done! The KL challenges were so creative and fun.",
      "Our team bonded in ways we never expected. Aisha is a fantastic facilitator.",
    ],
  };

  for (const cb of completedBookings) {
    const texts = reviewTexts[cb.program] || reviewTexts["Leadership"];
    const tp = await prisma.trainerProfile.findUnique({ where: { userId: cb.trainerId } });
    if (tp) {
      await prisma.review.create({
        data: {
          bookingId: cb.booking.id, hrId: cb.hrId, trainerId: tp.id,
          rating: 4 + Math.floor(Math.random() * 2),
          comment: texts[Math.floor(Math.random() * texts.length)],
        },
      });
    }
  }

  // ─── MESSAGES ────────────────────────────────────────────
  const messageTemplates: Record<string, string[]> = {
    hr: [
      "Hi, could you share the pre-training materials with our team?",
      "We'd like to confirm the start time for the program. Is 9am OK?",
      "Our team is really looking forward to this training!",
      "Can you accommodate 2 additional participants?",
      "Please send the invoice at your earliest convenience.",
      "The training was excellent! Thank you for the great session.",
    ],
    trainer: [
      "Absolutely! I'll send the materials by tomorrow.",
      "9am works perfectly. Please have the room set up with a projector.",
      "Happy to add 2 more. I'll update the participant list.",
      "Invoice has been sent. Please process within 30 days.",
      "Thank you for the kind words! It was a pleasure working with your team.",
      "Here are the post-training resources as promised.",
    ],
  };

  const bookingsWithMessages = [b1, b2, b3, b4, b7, b8, b17, b18, b19, b20];
  for (const bkg of bookingsWithMessages) {
    const program = await prisma.program.findUnique({ where: { id: bkg.programId }, select: { trainerId: true } });
    if (!program) continue;
    const msgCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < msgCount; i++) {
      const isHR = i % 2 === 0;
      const pool = isHR ? messageTemplates.hr : messageTemplates.trainer;
      await prisma.message.create({
        data: {
          bookingId: bkg.id,
          senderId: isHR ? bkg.hrId : program.trainerId,
          receiverId: isHR ? program.trainerId : bkg.hrId,
          content: pool[Math.floor(Math.random() * pool.length)],
        },
      });
    }
  }

  // ─── SUPPORT TICKETS ──────────────────────────────────────
  const ticketData = [
    { subject: "Invoice not showing in dashboard", description: "I can't find invoice INV-2026-007 in my list. It was marked as sent but doesn't appear.", priority: "HIGH", status: "OPEN", hrId: hr2.id, companyId: maybank.id },
    { subject: "Unable to upload employee CSV", description: "Getting a 500 error when trying to bulk upload employees. The file is under 5MB.", priority: "HIGH", status: "IN_PROGRESS", hrId: hr5.id, companyId: telekom.id },
    { subject: "Request for new training category", description: "Can we add 'Sustainability & ESG' as a training category? Several of our departments are asking for this.", priority: "MEDIUM", status: "OPEN", hrId: hr6.id, companyId: simeDarby.id },
    { subject: "Trainer payment delay", description: "My invoice for booking #INV-2026-012 has an incorrect amount. It's been 2 weeks.", priority: "MEDIUM", status: "OPEN", hrId: hr3.id, companyId: topGlove.id },
    { subject: "Duplicate program listing", description: "The 'Emotional Intelligence' program appears twice in the marketplace with different IDs.", priority: "LOW", status: "RESOLVED", hrId: hr4.id, companyId: airAsia.id },
    { subject: "Request: bulk evaluation blast", description: "Can we send evaluations to all completed bookings at once? Currently have to do one by one.", priority: "MEDIUM", status: "IN_PROGRESS", hrId: hr1.id, companyId: petronas.id },
  ];

  for (const t of ticketData) {
    await prisma.supportTicket.create({
      data: {
        subject: t.subject,
        description: t.description,
        priority: t.priority,
        status: t.status,
        hrId: t.hrId,
        companyId: t.companyId,
      },
    });
  }

  // ─── CHANGELOG ────────────────────────────────────────────
  const changelogEntries = [
    { version: "v1.2.0", type: "FEATURE", title: "AI-Powered Insights", details: "Added AI-generated evaluation analysis, quiz question generation, and smart training recommendations.", date: new Date(Y, M, 1) },
    { version: "v1.1.0", type: "FEATURE", title: "Calendar & Itinerary Views", details: "Added month/year calendar toggle across all dashboards. Program itineraries with color-coded time slots.", date: new Date(Y, M - 1, 15) },
    { version: "v1.0.2", type: "FIX", title: "Sidebar Overlap Fixed", details: "Resolved sidebar overlap on mobile devices. Improved responsive layout for tablets.", date: new Date(Y, M - 1, 10) },
    { version: "v1.0.1", type: "FIX", title: "Booking Status Sync", details: "Fixed booking status not syncing between admin actions and trainer dashboard.", date: new Date(Y, M - 2, 5) },
    { version: "v1.0.0", type: "FEATURE", title: "TrainHub MVP Launch", details: "Initial release with program marketplace, booking flow, evaluations, invoicing, and admin dashboard.", date: new Date(Y, M - 3, 1) },
    { version: "v0.9.0", type: "IMPROVEMENT", title: "Malaysian Employment Law Updates", details: "Updated compliance module for Employment Act 1955 amendments effective 2026.", date: new Date(Y, M - 3, 20) },
    { version: "v0.8.5", type: "FIX", title: "Deposit Calculation Fix", details: "Corrected 30% deposit calculation for bookings above RM 10,000 threshold.", date: new Date(Y, M - 4, 8) },
  ];

  for (const entry of changelogEntries) {
    await prisma.changelog.create({
      data: {
        version: entry.version,
        type: entry.type,
        title: entry.title,
        details: entry.details,
        createdAt: entry.date,
      },
    });
  }

  // ─── ITINERARIES ──────────────────────────────────────────
  const itineraryTemplates: Record<string, { type: string; title: string; startTime: string; endTime: string }[]> = {
    Leadership: [
      { type: "REGISTRATION", title: "Registration & Welcome Coffee", startTime: "08:30", endTime: "09:00" },
      { type: "MODULE", title: "Leadership Foundations", startTime: "09:00", endTime: "10:30" },
      { type: "BREAK", title: "Morning Tea Break", startTime: "10:30", endTime: "10:45" },
      { type: "MODULE", title: "Coaching & Feedback Workshop", startTime: "10:45", endTime: "12:30" },
      { type: "MEAL", title: "Lunch Break", startTime: "12:30", endTime: "13:30" },
      { type: "MODULE", title: "Leading Diverse Teams", startTime: "13:30", endTime: "15:00" },
      { type: "BREAK", title: "Afternoon Tea", startTime: "15:00", endTime: "15:15" },
      { type: "MODULE", title: "Action Planning & Commitment", startTime: "15:15", endTime: "16:30" },
      { type: "CLOSING", title: "Program Close & Certificates", startTime: "16:30", endTime: "17:00" },
    ],
    Technical: [
      { type: "REGISTRATION", title: "Registration & Setup", startTime: "09:00", endTime: "09:30" },
      { type: "MODULE", title: "Digital Landscape Overview", startTime: "09:30", endTime: "11:00" },
      { type: "BREAK", title: "Coffee Break", startTime: "11:00", endTime: "11:15" },
      { type: "MODULE", title: "Cybersecurity Essentials", startTime: "11:15", endTime: "13:00" },
      { type: "MEAL", title: "Lunch", startTime: "13:00", endTime: "14:00" },
      { type: "MODULE", title: "Hands-On Lab & Case Studies", startTime: "14:00", endTime: "16:00" },
      { type: "CLOSING", title: "Q&A & Wrap-Up", startTime: "16:00", endTime: "16:30" },
    ],
    Compliance: [
      { type: "REGISTRATION", title: "Registration", startTime: "08:30", endTime: "09:00" },
      { type: "MODULE", title: "Employment Act Deep Dive", startTime: "09:00", endTime: "10:30" },
      { type: "BREAK", title: "Morning Break", startTime: "10:30", endTime: "10:45" },
      { type: "MODULE", title: "Disciplinary & Domestic Inquiry", startTime: "10:45", endTime: "12:30" },
      { type: "MEAL", title: "Lunch", startTime: "12:30", endTime: "13:30" },
      { type: "MODULE", title: "Termination & Retrenchment", startTime: "13:30", endTime: "15:00" },
      { type: "BREAK", title: "Tea Break", startTime: "15:00", endTime: "15:15" },
      { type: "MODULE", title: "Case Studies & Group Discussion", startTime: "15:15", endTime: "16:30" },
      { type: "CLOSING", title: "Evaluation & Close", startTime: "16:30", endTime: "17:00" },
    ],
    "Team Building": [
      { type: "REGISTRATION", title: "Welcome & Team Assignments", startTime: "08:00", endTime: "08:30" },
      { type: "MODULE", title: "Ice Breakers & Warm-Up", startTime: "08:30", endTime: "09:30" },
      { type: "MODULE", title: "Challenge Round 1: Communication", startTime: "09:30", endTime: "11:00" },
      { type: "BREAK", title: "Refreshment Break", startTime: "11:00", endTime: "11:15" },
      { type: "MODULE", title: "Challenge Round 2: Strategy", startTime: "11:15", endTime: "12:45" },
      { type: "MEAL", title: "Lunch", startTime: "12:45", endTime: "13:45" },
      { type: "MODULE", title: "Challenge Round 3: Innovation", startTime: "13:45", endTime: "15:30" },
      { type: "CLOSING", title: "Debrief, Awards & Close", startTime: "15:30", endTime: "16:30" },
    ],
  };

  const programsWithItineraries = [prog1, prog2, prog3, prog4, prog7, prog9, prog10, prog11];
  for (const prog of programsWithItineraries) {
    const template = itineraryTemplates[prog.category] || itineraryTemplates.Leadership;
    for (let i = 0; i < template.length; i++) {
      const item = template[i];
      await prisma.itineraryItem.create({
        data: {
          programId: prog.id,
          type: item.type,
          title: item.title,
          startTime: item.startTime,
          endTime: item.endTime,
          orderIndex: i,
        },
      });
    }
  }

  // ─── ATTENDANCE & LEAVES ──────────────────────────────────
  // Generate attendance for the current month for all employees
  const allEmpIds = Object.values(allEmployees).flat().map((e: any) => e.id);
  const today = new Date();
  const daysInMonth = new Date(Y, M + 1, 0).getDate();

  for (const empId of allEmpIds.slice(0, 30)) { // First 30 employees
    for (let d = 1; d <= Math.min(today.getDate(), daysInMonth); d++) {
      if (Math.random() > 0.08) { // 92% attendance rate
        const clockIn = new Date(Y, M, d, 7 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
        const clockOut = new Date(Y, M, d, 16 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60));
        await prisma.attendance.create({
          data: {
            employeeId: empId,
            date: new Date(Y, M, d),
            clockIn,
            clockOut,
            status: clockIn.getHours() > 9 ? "LATE" : "PRESENT",
          },
        });
      }
    }
  }

  // Leaves for some employees
  const leaveTypes = ["ANNUAL", "MEDICAL", "EMERGENCY", "UNPAID"];
  for (const empId of allEmpIds.slice(0, 20)) {
    const leaveCount = Math.floor(Math.random() * 3);
    for (let l = 0; l < leaveCount; l++) {
      const startDay = 1 + Math.floor(Math.random() * 20);
      const duration = 1 + Math.floor(Math.random() * 2);
      await prisma.leave.create({
        data: {
          employeeId: empId,
          type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
          startDate: new Date(Y, M - 1, startDay),
          endDate: new Date(Y, M - 1, startDay + duration),
          days: duration,
          status: Math.random() > 0.2 ? "APPROVED" : "PENDING",
          reason: "Personal / medical reasons",
        },
      });
    }
  }

  // ─── TRAINER AVAILABILITY ────────────────────────────────
  const trainerIds = [trainer1.id, trainer2.id, trainer3.id];
  const usedDates = new Set<string>();
  for (const tId of trainerIds) {
    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      let day: number;
      let dateStr: string;
      do {
        day = 1 + Math.floor(Math.random() * 50);
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        dateStr = `${tId}_${date.toISOString().slice(0, 10)}`;
      } while (usedDates.has(dateStr));
      usedDates.add(dateStr);
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      await prisma.trainerAvailability.create({
        data: {
          trainerId: tId,
          date,
          status: "UNAVAILABLE",
          reason: ["Personal day", "Public holiday", "Other commitment", "Medical appointment"][Math.floor(Math.random() * 4)],
        },
      });
    }
  }

  // ─── PROGRAM THUMBNAILS ──────────────────────────────────
  // Professional gradient thumbnails with category-based styling
  // Each program gets a unique colour combination matching its category
  const thumbnails: Record<string, string> = {
    "Transformational Leadership for Malaysian Managers": "/thumbnails/leadership.svg",
    "Industry 4.0 & Digital Transformation for SMEs": "/thumbnails/tech.svg",
    "Malaysian Employment Law & Compliance 2026": "/thumbnails/compliance.svg",
    "Epic Team Building: KL Survival Challenge": "/thumbnails/teambuild.svg",
    "Effective Communication & Presentation Skills": "/thumbnails/comm.svg",
    "Strategic HR: From Admin to Business Partner": "/thumbnails/hr.svg",
    "Strategic Leadership & Boardroom Readiness": "/thumbnails/boardroom.svg",
    "Data-Driven Decision Making with Power BI": "/thumbnails/analytics.svg",
    "Anti-Corruption & Integrity for Malaysian Corporates": "/thumbnails/integrity.svg",
    "Agile Project Management for Malaysian Enterprises": "/thumbnails/agile.svg",
    "Emotional Intelligence & Resilience at Work": "/thumbnails/eq.svg",
    "HR Analytics & People Metrics Masterclass": "/thumbnails/metrics.svg",
  };

  for (const [title, url] of Object.entries(thumbnails)) {
    await prisma.program.updateMany({
      where: { title },
      data: { thumbnailUrl: url },
    });
  }

  // Also remove the broken thumbnailUrl from prog1 (already set above)
  // Fix prog1: remove the duplicate thumbnailUrl from create data
  // (The first program already has thumbnailUrl in create data from earlier edit)

  // ─── TRAINING PLAN ITEMS ────────────────────────────────
  // Petronas HR (hr1) — comprehensive training plan across departments
  const planItems = [
    // Q1 (Jan-Mar)
    { title: "ABAC Anti-Corruption Training", category: "Compliance", department: "All Departments", targetCount: 45, targetMonth: 0, estimatedCost: 4500, priority: "HIGH", status: "MATCHED", matchedProgramId: prog9.id, notes: "MACC Act Section 17A compliance. Mandatory for all staff." },
    { title: "Business Communication & Email Etiquette", category: "Soft Skills", department: "Sales + Admin", targetCount: 30, targetMonth: 0, estimatedCost: 3000, priority: "MEDIUM", status: "DRAFT", notes: "Improve cross-dept communication. Many complaints about unclear emails." },
    { title: "Leadership 360° for Middle Managers", category: "Leadership", department: "Engineering", targetCount: 12, targetMonth: 1, estimatedCost: 14400, priority: "HIGH", status: "SCHEDULED", bookingId: b1.id, matchedProgramId: prog1.id, notes: "Performance review flagged leadership gaps in engineering leads." },
    { title: "Digital Transformation Awareness", category: "Technical", department: "IT", targetCount: 20, targetMonth: 2, estimatedCost: 18000, priority: "HIGH", status: "MATCHED", matchedProgramId: prog2.id, notes: "Part of company-wide Industry 4.0 initiative." },
    { title: "Data Privacy & PDPA Compliance", category: "Compliance", department: "IT + Legal", targetCount: 15, targetMonth: 2, estimatedCost: 5000, priority: "MEDIUM", status: "MATCHED", matchedProgramId: prog9.id, notes: "New PDPA requirements taking effect Q2." },

    // Q2 (Apr-Jun)
    { title: "Emotional Intelligence for Team Leads", category: "Soft Skills", department: "All Departments", targetCount: 25, targetMonth: 3, estimatedCost: 17500, priority: "MEDIUM", status: "DRAFT", notes: "Follow-up to engagement survey — low morale in some teams." },
    { title: "Agile Project Management Foundation", category: "Technical", department: "IT + Engineering", targetCount: 18, targetMonth: 4, estimatedCost: 23400, priority: "HIGH", status: "MATCHED", matchedProgramId: prog10.id, notes: "Transitioning from waterfall to agile. Pilot group." },
    { title: "HR Business Partnering Skills", category: "HR Operations", department: "HR", targetCount: 8, targetMonth: 4, estimatedCost: 8000, priority: "MEDIUM", status: "DRAFT", notes: "HR team needs to shift from admin to strategic." },
    { title: "Team Building: Cross-Functional Collaboration", category: "Team Building", department: "Engineering + Marketing", targetCount: 40, targetMonth: 5, estimatedCost: 14000, priority: "LOW", status: "DRAFT", notes: "Engineering and marketing have friction on product launches." },

    // Q3 (Jul-Sep)
    { title: "Advanced Power BI & Data Storytelling", category: "Technical", department: "Finance + IT", targetCount: 12, targetMonth: 6, estimatedCost: 13200, priority: "MEDIUM", status: "DRAFT", notes: "Finance team requesting better reporting tools." },
    { title: "Employment Law Updates 2026", category: "Compliance", department: "HR + Legal", targetCount: 10, targetMonth: 7, estimatedCost: 15000, priority: "HIGH", status: "MATCHED", matchedProgramId: prog3.id, notes: "EA amendments effective. HR must update policies." },
    { title: "Strategic Workforce Planning", category: "HR Operations", department: "HR", targetCount: 6, targetMonth: 8, estimatedCost: 9600, priority: "MEDIUM", status: "DRAFT", notes: "Annual workforce planning cycle preparation." },

    // Q4 (Oct-Dec)
    { title: "Presentation Skills Masterclass", category: "Soft Skills", department: "Marketing + Sales", targetCount: 16, targetMonth: 9, estimatedCost: 9600, priority: "LOW", status: "DRAFT", notes: "Marketing team presenting at industry conferences." },
    { title: "Year-End Compliance Refresher", category: "Compliance", department: "All Departments", targetCount: 60, targetMonth: 10, estimatedCost: 8000, priority: "HIGH", status: "DRAFT", notes: "Annual mandatory compliance refresher. Must complete before year-end." },
    { title: "Change Management Workshop", category: "Leadership", department: "Engineering + IT", targetCount: 15, targetMonth: 10, estimatedCost: 12000, priority: "MEDIUM", status: "DRAFT", notes: "Preparing teams for major system migration in Q1 2027." },
    { title: "HR Analytics & People Metrics", category: "HR Operations", department: "HR", targetCount: 5, targetMonth: 11, estimatedCost: 8000, priority: "LOW", status: "DRAFT", notes: "Nice to have — depends on remaining budget." },
  ];

  for (const item of planItems) {
    await prisma.trainingPlanItem.create({
      data: {
        companyId: petronas.id,
        hrId: hr1.id,
        title: item.title,
        category: item.category,
        department: item.department,
        targetCount: item.targetCount,
        targetMonth: item.targetMonth,
        targetYear: Y,
        estimatedCost: item.estimatedCost,
        priority: item.priority,
        status: item.status,
        matchedProgramId: item.matchedProgramId || null,
        bookingId: item.bookingId || null,
        notes: item.notes,
      },
    });
  }

  // Also add a few items for Maybank (hr2) to show multi-company data
  const maybankPlanItems = [
    { title: "Cybersecurity Awareness for Banking", category: "Technical", department: "All Departments", targetCount: 50, targetMonth: 2, estimatedCost: 8000, priority: "HIGH", status: "DRAFT", notes: "BNM circular requiring annual cybersecurity training." },
    { title: "Customer Service Excellence", category: "Soft Skills", department: "Customer Service", targetCount: 25, targetMonth: 3, estimatedCost: 6000, priority: "MEDIUM", status: "DRAFT", notes: "CSAT scores dropped 5% this quarter." },
    { title: "AML/CFT Compliance Workshop", category: "Compliance", department: "Compliance + Risk", targetCount: 12, targetMonth: 5, estimatedCost: 7200, priority: "HIGH", status: "MATCHED", matchedProgramId: prog9.id, notes: "Annual AML refresher. BNM requirement." },
  ];

  for (const item of maybankPlanItems) {
    await prisma.trainingPlanItem.create({
      data: {
        companyId: maybank.id,
        hrId: hr2.id,
        title: item.title,
        category: item.category,
        department: item.department,
        targetCount: item.targetCount,
        targetMonth: item.targetMonth,
        targetYear: Y,
        estimatedCost: item.estimatedCost,
        priority: item.priority,
        status: item.status,
        matchedProgramId: item.matchedProgramId || null,
        notes: item.notes,
      },
    });
  }

  // ─── NOTIFICATIONS ────────────────────────────────────────

  // Notifications for Petronas HR (hr1)
  await prisma.notification.createMany({
    data: [
      {
        userId: hr1.id,
        type: "BOOKING_CONFIRMED",
        title: "Booking confirmed: Strategic Leadership & Boardroom Readiness",
        body: "Your booking for 8 participants on 25 Jun has been confirmed by admin.",
        link: "/hr/bookings/" + b17.id,
        read: false,
      },
      {
        userId: hr1.id,
        type: "HRDF_DEADLINE",
        title: "HRDF claim deadline: Transformational Leadership",
        body: "Completed 90 days ago. You have 90 days remaining to submit the HRDF claim. Don't lose your levy.",
        link: "/hr/bookings/" + b1.id,
        read: false,
      },
      {
        userId: hr1.id,
        type: "PLAN_APPROVED",
        title: "Plan approved: Leadership 360° for Middle Managers",
        body: "Admin has approved your plan for 12 Engineering managers. Ready to book.",
        link: "/hr/training-planner",
        read: true,
      },
      {
        userId: hr1.id,
        type: "BOOKING_CREATED",
        title: "Booking submitted: Strategic HR",
        body: "Your booking request for 5 pax has been submitted and is pending admin approval.",
        link: "/hr/bookings/" + b9.id,
        read: true,
      },
    ],
  });

  // Notifications for Maybank HR (hr2)
  await prisma.notification.createMany({
    data: [
      {
        userId: hr2.id,
        type: "BOOKING_COMPLETED",
        title: "Training completed: Digital Transformation",
        body: "Your team of 8 completed the program. Submit your HRDF claim and evaluation.",
        link: "/hr/bookings/" + b2.id,
        read: false,
      },
      {
        userId: hr2.id,
        type: "BOOKING_CONFIRMED",
        title: "Booking confirmed: Employment Law & Compliance",
        body: "Your booking for 10 participants on 10 Jul has been confirmed.",
        link: "/hr/bookings/" + b7.id,
        read: true,
      },
    ],
  });

  // Notifications for admin
  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "BOOKING_CREATED",
      title: "New booking pending: Agile PM for Top Glove",
      body: "Top Glove has submitted a booking for 10 pax. Awaiting your approval.",
      link: "/admin/bookings/" + b21.id,
      read: false,
    },
  });

  // ─── TEAM BUILDING REQUESTS ────────────────────────────────

  // Petronas submission
  await prisma.teamBuildingRequest.create({
    data: {
      hrId: hr1.id, companyId: petronas.id,
      eventName: "Petronas ICT Q2 Team Retreat",
      hqLocation: "KLCC, Kuala Lumpur",
      teamSize: 40, avgAge: 32, ageMin: 24, ageMax: 52,
      activityId: "act-001", activityName: "KL Survival Challenge",
      activityCategory: "Outdoor Adventure", venueId: "ven-001",
      venueName: "FRIM Kepong", venueAddress: "FRIM, Kepong, Selangor",
      startDate: new Date(Y, 5, 15), isConsecutive: false, batchCount: 1,
      activityCost: 14000, accommodationCost: 0, totalCost: 14000, hrdfClaimable: 14000,
      status: "SUBMITTED",
    },
  });

  // Maybank submission
  await prisma.teamBuildingRequest.create({
    data: {
      hrId: hr2.id, companyId: maybank.id,
      eventName: "Maybank Leadership Offsite",
      hqLocation: "Menara Maybank, KL",
      teamSize: 25, avgAge: 38, ageMin: 28, ageMax: 55,
      activityId: "act-003", activityName: "Strategic Escape Room Challenge",
      activityCategory: "Indoor Problem Solving", venueId: "ven-002",
      venueName: "Breakout KL", venueAddress: "Avenue K, KL",
      startDate: new Date(Y, 6, 20), isConsecutive: false, batchCount: 1,
      activityCost: 8750, accommodationCost: 0, totalCost: 8750, hrdfClaimable: 8750,
      status: "REVIEWING",
    },
  });

  // Top Glove approved
  const tb3 = await prisma.teamBuildingRequest.create({
    data: {
      hrId: hr3.id, companyId: topGlove.id,
      eventName: "Top Glove Annual Team Building",
      hqLocation: "Shah Alam, Selangor",
      teamSize: 80, avgAge: 30, ageMin: 20, ageMax: 50,
      activityId: "act-006", activityName: "Beach Olympics",
      activityCategory: "Outdoor Sports", venueId: "ven-004",
      venueName: "Port Dickson Beach Resort", venueAddress: "Port Dickson, Negeri Sembilan",
      startDate: new Date(Y, 4, 10), isConsecutive: true, batchCount: 2,
      activityCost: 28000, accommodationCost: 8000, totalCost: 36000, hrdfClaimable: 28000,
      status: "APPROVED",
      employerHrdfSubmitted: true, employerHrdfSubmittedAt: new Date(Y, 5, 1),
      adminNotes: "Approved. Please coordinate logistics with venue.",
    },
  });

  // AirAsia completed
  await prisma.teamBuildingRequest.create({
    data: {
      hrId: hr4.id, companyId: airAsia.id,
      eventName: "AirAsia Cabin Crew Team Building",
      hqLocation: "KLIA2, Sepang",
      teamSize: 30, avgAge: 28, ageMin: 22, ageMax: 40,
      activityId: "act-002", activityName: "High Ropes Challenge",
      activityCategory: "Outdoor Adventure", venueId: "ven-003",
      venueName: "Skytrex Adventure", venueAddress: "Shah Alam, Selangor",
      startDate: new Date(Y, 2, 8), isConsecutive: false, batchCount: 1,
      activityCost: 10500, accommodationCost: 0, totalCost: 10500, hrdfClaimable: 10500,
      status: "COMPLETED",
      employerHrdfSubmitted: true, employerHrdfSubmittedAt: new Date(Y, 3, 15),
      trainerHrdfSubmitted: true, trainerHrdfSubmittedAt: new Date(Y, 3, 20),
    },
  });

  // ─── PROGRAM VOTES ──────────────────────────────────────────

  const voteProgramIds = [prog1.id, prog2.id, prog3.id, prog4.id, prog5.id, prog6.id, prog7.id, prog9.id, prog11.id];
  const voteHRs = [hr1.id, hr2.id, hr3.id, hr4.id, hr5.id, hr6.id];

  for (const progId of voteProgramIds) {
    const voteCount = 1 + Math.floor(Math.random() * 5);
    const shuffledHRs = [...voteHRs].sort(() => Math.random() - 0.5).slice(0, voteCount);
    for (const hrId of shuffledHRs) {
      await prisma.programVote.create({
        data: { hrId, programId: progId },
      }).catch(() => {}); // ignore duplicate votes
    }
  }

  console.log("✅ Seed complete!\n");
  console.log(`📊 Data summary:`);
  console.log(`   6 Companies, 6 HR users, 3 Trainers, 1 Admin`);
  console.log(`   12 Programs, 23 Bookings (12 completed, 6 confirmed, 5 pending)`);
  console.log(`   19 Training Plan Items, 4 Team Building Requests`);
  console.log(`   ~30 Program Votes across 9 programs`);
  console.log(`   12 Evaluations with full response data`);
  console.log(`   18 Invoices, 12 Reviews`);
  console.log(`   72+ Employees across 6 companies`);
  console.log(`   40+ Messages, 6 Support Tickets, 7 Changelog Entries`);
  console.log(`   Attendance records, Leaves, 8 Program Itineraries`);
  console.log(`   Trainer availability data for all 3 trainers\n`);
  console.log(`🔑 All passwords: password123`);
  console.log(`   Admin:   admin@trainhub.my`);
  console.log(`   Trainer: aisha@trainhub.my | jason@trainhub.my | sarah@trainhub.my`);
  console.log(`   HR:      hr@petronas.my | hr@maybank.my | hr@topglove.my | hr@airasia.my`);
  console.log(`            hr@tm.my | hr@sdarby.my`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
