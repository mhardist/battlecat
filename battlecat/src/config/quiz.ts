/**
 * "Find Your Level" quiz configuration.
 * Each answer maps to a maturity level (0-4).
 * The user's level is determined by weighted scoring across all answers.
 */

export interface QuizAnswer {
  text: string;
  level: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "usage",
    question: "When you use AI tools, you typically...",
    answers: [
      { text: "Ask a question and move on", level: 0 },
      { text: "Give it detailed context about yourself and your goals", level: 1 },
      { text: "Describe what you want built and iterate on the result", level: 2 },
      { text: "Define the outcome and let it figure out how to get there", level: 3 },
      { text: "Design a system of multiple AI agents working together", level: 4 },
    ],
  },
  {
    id: "tools",
    question: "Which of these tools have you used most?",
    answers: [
      { text: "ChatGPT or Gemini for Q&A", level: 0 },
      { text: "Custom GPTs, Claude Projects, or saved instructions", level: 1 },
      { text: "Lovable, v0, Bolt, or Replit for building apps", level: 2 },
      { text: "Claude Code, Cursor, or Copilot for agentic coding", level: 3 },
      { text: "Multi-agent workflows or orchestration frameworks", level: 4 },
    ],
  },
  {
    id: "frustration",
    question: "Your biggest AI frustration is...",
    answers: [
      { text: "It doesn't understand what I want", level: 0 },
      { text: "I have to repeat context every conversation", level: 1 },
      { text: "The things it builds don't quite work in production", level: 2 },
      { text: "It needs too much hand-holding on complex tasks", level: 3 },
      { text: "Coordinating multiple AI tasks is chaotic", level: 4 },
    ],
  },
  {
    id: "trust",
    question: "How much do you trust AI with your work?",
    answers: [
      { text: "I double-check everything it gives me", level: 0 },
      { text: "I trust it for familiar topics after teaching it my preferences", level: 1 },
      { text: "I trust it to build prototypes but review before shipping", level: 2 },
      { text: "I let it make decisions and ship code autonomously", level: 3 },
      { text: "I trust entire systems of AI agents to operate independently", level: 4 },
    ],
  },
  {
    id: "output",
    question: "What does your typical AI output look like?",
    answers: [
      { text: "Text answers, summaries, or brainstorms", level: 0 },
      { text: "Personalized advice, plans, or tailored content", level: 1 },
      { text: "Working apps, landing pages, or functional prototypes", level: 2 },
      { text: "Production-ready code, deployed features, or full projects", level: 3 },
      { text: "Orchestrated workflows with multiple agents handling different tasks", level: 4 },
    ],
  },
  {
    id: "learning",
    question: "When learning a new AI tool, you...",
    answers: [
      { text: "Try the basics and see what happens", level: 0 },
      { text: "Set up custom instructions and teach it about your work", level: 1 },
      { text: "Immediately try to build something real with it", level: 2 },
      { text: "Evaluate if it can handle autonomous, complex workflows", level: 3 },
      { text: "Think about how it fits into a larger system of tools", level: 4 },
    ],
  },
];

/** Calculate the user's level from their answers */
export function calculateLevel(answers: Record<string, number>): number {
  const values = Object.values(answers);
  if (values.length === 0) return 0;

  // Weighted average, rounded to nearest level
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.round(avg);
}

/** Level result descriptions */
export const LEVEL_RESULTS: Record<number, { headline: string; description: string }> = {
  0: {
    headline: "You're at Level 0: Asker",
    description:
      "You're using AI for quick Q&A — asking questions and getting answers. That's a great start. The next step is teaching AI who you are so it can give you personalized, contextual responses.",
  },
  1: {
    headline: "You're at Level 1: Instructor",
    description:
      "You've invested in teaching AI your context — preferences, constraints, goals. You're getting personalized results. The next frontier: using AI to actually build things, not just advise.",
  },
  2: {
    headline: "You're at Level 2: Designer",
    description:
      "You're describing what you want and AI builds it — apps, prototypes, landing pages. You're a vibe coder. Next step: letting AI work more autonomously with less hand-holding.",
  },
  3: {
    headline: "You're at Level 3: Supervisor",
    description:
      "You define outcomes and let AI agents figure out the how. You supervise results, not keystrokes. The final frontier: orchestrating multiple agents as a coordinated system.",
  },
  4: {
    headline: "You're at Level 4: Architect",
    description:
      "You design systems of AI agents that work together as an organization. You're at the cutting edge — focus on deepening your orchestration skills and building more robust multi-agent workflows.",
  },
};
