/**
 * AI Utility — pluggable: mock now, OpenAI via API key
 * Priority: OPENAI_API_KEY > mock
 */

interface AIResponse {
  text: string;
  data?: any;
}

// ─── AI Provider Helper ────────────────────────────────────────

type AIProvider = "openai" | "mock";

function getAIProvider(): AIProvider {
  if (process.env.OPENAI_API_KEY) return "openai";
  return "mock";
}

async function callAI(prompt: string, systemPrompt?: string): Promise<string | null> {
  const provider = getAIProvider();
  if (provider === "mock") return null;

  const apiKey = process.env.OPENAI_API_KEY!;

  try {
    const messages = systemPrompt
      ? [{ role: "system" as const, content: systemPrompt }, { role: "user" as const, content: prompt }]
      : [{ role: "user" as const, content: prompt }];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error(`AI API error (${provider}):`, error);
    return null;
  }
}

// ─── Quiz Generator ──────────────────────────────────────────

export async function generateQuizQuestions(
  topic: string,
  count: number = 5
): Promise<{ text: string; type: string; options: string[]; correctAnswer: string; points: number }[]> {
  // Try real AI (OpenAI) if key is set
  const content = await callAI(
    `Generate ${count} quiz questions about "${topic}" for a corporate training. Include MCQs and True/False. Return JSON array with fields: text, type (MCQ/TRUE_FALSE), options (array of 4 for MCQ, ["True","False"] for T/F), correctAnswer, points (1-3).`
  );
  if (content) {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  }

  // ─── Smart mock questions ──────────────────────────────────
  const mockQuestions: Record<string, any[]> = {
    leadership: [
      { text: "Which leadership style empowers team members to make decisions?", type: "MCQ", options: ["Autocratic", "Democratic", "Laissez-faire", "Transactional"], correctAnswer: "Democratic", points: 2 },
      { text: "Emotional intelligence is unimportant for effective leadership.", type: "TRUE_FALSE", options: ["True", "False"], correctAnswer: "False", points: 1 },
      { text: "What is the first step in Kotter's 8-step change model?", type: "MCQ", options: ["Create a vision", "Create urgency", "Empower action", "Communicate the vision"], correctAnswer: "Create urgency", points: 2 },
      { text: "A good leader should adapt their style based on the team's maturity level.", type: "TRUE_FALSE", options: ["True", "False"], correctAnswer: "True", points: 1 },
      { text: "What does the 'GROW' coaching model stand for?", type: "MCQ", options: ["Goal, Reality, Options, Will", "Grow, Reach, Overcome, Win", "Guide, Review, Observe, Work", "Goals, Results, Objectives, Wins"], correctAnswer: "Goal, Reality, Options, Will", points: 3 },
    ],
    compliance: [
      { text: "Under the Employment Act 1955, what is the minimum annual leave for an employee with 3 years of service?", type: "MCQ", options: ["8 days", "12 days", "16 days", "14 days"], correctAnswer: "12 days", points: 2 },
      { text: "A domestic inquiry must be held before any dismissal for misconduct.", type: "TRUE_FALSE", options: ["True", "False"], correctAnswer: "True", points: 1 },
      { text: "What is the current maternity leave entitlement in Malaysia?", type: "MCQ", options: ["60 days", "90 days", "98 days", "14 weeks"], correctAnswer: "98 days", points: 2 },
    ],
    technical: [
      { text: "What does API stand for?", type: "MCQ", options: ["Application Programming Interface", "Automated Program Integration", "Application Process Integration", "Advanced Programming Interface"], correctAnswer: "Application Programming Interface", points: 1 },
      { text: "Two-factor authentication adds an extra layer of security.", type: "TRUE_FALSE", options: ["True", "False"], correctAnswer: "True", points: 1 },
      { text: "Which of the following is NOT a cloud computing service model?", type: "MCQ", options: ["IaaS", "PaaS", "SaaS", "DaaS"], correctAnswer: "DaaS", points: 2 },
    ],
    team: [
      { text: "What is the optimal team size according to most research?", type: "MCQ", options: ["2-3 people", "4-9 people", "10-15 people", "15+ people"], correctAnswer: "4-9 people", points: 1 },
      { text: "Psychological safety means team members feel safe to take risks.", type: "TRUE_FALSE", options: ["True", "False"], correctAnswer: "True", points: 1 },
      { text: "Which stage of Tuckman's model involves conflict and competition?", type: "MCQ", options: ["Forming", "Storming", "Norming", "Performing"], correctAnswer: "Storming", points: 2 },
    ],
    communication: [
      { text: "Active listening involves:", type: "MCQ", options: ["Just hearing words", "Listening and providing feedback", "Waiting for your turn to speak", "Interrupting with questions"], correctAnswer: "Listening and providing feedback", points: 1 },
      { text: "Non-verbal communication accounts for approximately what percentage of communication?", type: "MCQ", options: ["10%", "30%", "55%", "90%"], correctAnswer: "55%", points: 2 },
    ],
  };

  // Pick best matching topic or combine
  const topicLower = topic.toLowerCase();
  let pool: any[] = [];
  for (const [key, qs] of Object.entries(mockQuestions)) {
    if (topicLower.includes(key)) pool = [...pool, ...qs];
  }
  if (pool.length === 0) pool = [...mockQuestions.leadership, ...mockQuestions.team];

  // Shuffle and take requested count
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ─── Evaluation Insights ─────────────────────────────────────

export async function analyzeEvaluationComments(
  comments: { participant: string; text: string }[]
): Promise<{ sentiment: "positive" | "mixed" | "negative"; themes: string[]; summary: string; strengths: string[]; improvements: string[] }> {
  const content = await callAI(
    `Analyze these training evaluation comments. Return JSON: { sentiment: "positive"|"mixed"|"negative", themes: string[], summary: string, strengths: string[], improvements: string[] }\n\nComments:\n${comments.map(c => `- ${c.text}`).join("\n")}`
  );
  if (content) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  }

  // Smart mock analysis
  const allText = comments.map(c => c.text.toLowerCase()).join(" ");
  const positiveWords = ["excellent", "great", "good", "love", "best", "amazing", "useful", "helpful", "practical", "clear", "confident", "fantastic", "engaging", "knowledgeable"];
  const negativeWords = ["poor", "bad", "boring", "confusing", "difficult", "slow", "need", "improve", "better", "lack", "waste"];
  
  const posCount = positiveWords.filter(w => allText.includes(w)).length;
  const negCount = negativeWords.filter(w => allText.includes(w)).length;
  const sentiment = posCount > negCount * 2 ? "positive" : negCount > posCount ? "negative" : "mixed";

  const strengthPhrases = [
    "Trainer's knowledge and expertise",
    "Practical real-world examples",
    "Engaging presentation style",
    "Useful templates and handouts",
  ];
  const improvementPhrases = [
    "More hands-on exercises needed",
    "Consider adding case studies",
    "Pre-reading materials would help",
    "Longer session for complex topics",
  ];

  return {
    sentiment: sentiment as any,
    themes: ["Training Delivery", "Content Relevance", "Materials Quality", "Time Management"],
    summary: sentiment === "positive"
      ? "Overall very positive feedback. Participants found the trainer knowledgeable and the content immediately applicable to their work."
      : sentiment === "negative"
      ? "Several areas need improvement. Participants felt the content could be more relevant and the delivery more engaging."
      : "Mixed feedback. While participants appreciated certain aspects, there are clear areas for improvement.",
    strengths: strengthPhrases.slice(0, 2 + Math.floor(Math.random() * 2)),
    improvements: improvementPhrases.slice(0, 2 + Math.floor(Math.random() * 2)),
  };
}

// ─── Program Description Enhancer ────────────────────────────

export async function enhanceDescription(
  title: string,
  bulletPoints: string[]
): Promise<string> {
  const content = await callAI(
    `Write a professional, compelling 3-paragraph training program description for "${title}". Based on these points: ${bulletPoints.join(", ")}. Target audience: Malaysian corporate HR and managers.`
  );
  if (content) return content;

  return `Equip your team with essential skills through our comprehensive "${title}" program. This training is designed for Malaysian professionals seeking practical, immediately applicable knowledge.\n\nParticipants will learn through a blend of expert-led instruction, hands-on exercises, and real-world case studies tailored to the Malaysian workplace context. Our trainer brings extensive industry experience to every session.\n\nBy the end of this program, your team will have the tools, frameworks, and confidence to apply what they've learned immediately. Ideal for teams of all sizes looking to build lasting capability.`;
}

// ─── Smart Recommendations ────────────────────────────────────

export async function getSmartRecommendations(
  pastCategories: string[],
  employeeCount: number,
  departmentBreakdown: { department: string; count: number }[]
): Promise<string[]> {
  const content = await callAI(
    `Based on this company's training history (categories: ${pastCategories.join(", ")}), ${employeeCount} employees, departments: ${JSON.stringify(departmentBreakdown)}, suggest 3 training categories they should consider next. Return JSON array of category names.`
  );
  if (content) {
    const match = content.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
  }

  // Smart mock: recommend categories not yet taken
  const allCategories = ["Leadership", "Technical", "Soft Skills", "Compliance", "Team Building", "HR Operations"];
  const missing = allCategories.filter(c => !pastCategories.some(pc => pc.toLowerCase().includes(c.toLowerCase())));
  const recommendations = missing.length >= 3 ? missing.slice(0, 3) : [...missing, ...allCategories.filter(c => !missing.includes(c))].slice(0, 3);
  return recommendations;
}

// ─── Training Needs Analysis ──────────────────────────────────

export async function analyzeTrainingNeeds(
  responses: { question: string; answer: string }[]
): Promise<{ recommendedCategories: string[]; explanation: string; suggestedPrograms: string[] }> {
  const content = await callAI(
    `Based on this training needs assessment, suggest categories and programs. Return JSON: { recommendedCategories: string[], explanation: string, suggestedPrograms: string[] }. Assessment: ${JSON.stringify(responses)}`
  );
  if (content) {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  }

  return {
    recommendedCategories: ["Leadership", "Soft Skills"],
    explanation: "Based on your responses, your team would benefit most from leadership development and communication skills training. These areas show the highest gap between current capability and desired outcomes.",
    suggestedPrograms: ["Transformational Leadership for Malaysian Managers", "Effective Communication & Presentation Skills"],
  };
}
