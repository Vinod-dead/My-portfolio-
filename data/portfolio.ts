/**
 * EDIT THIS FILE to update your personal content.
 * Anything wrapped like "[PLACEHOLDER: ...]" is unknown information that you
 * should replace. Links set to `null` are hidden in the UI until you add them.
 */

export const PLACEHOLDER_PREFIX = "[PLACEHOLDER";

export const isPlaceholder = (value: string | null | undefined) =>
  !!value && value.startsWith(PLACEHOLDER_PREFIX);

export const portfolio = {
  name: "Vinod Reddy",
  tagline: "AI/ML Engineer in the Making",
  heroSupport: "Building intelligent systems. Exploring ambitious ideas. Creating what's next.",
  finalQuote: "Building ideas into reality, one project at a time.",

  about: {
    summary:
      "Aspiring AI/ML engineer and creative developer exploring artificial intelligence, building projects, experimenting with agents, and turning ideas into working software.",
    interests: [
      "Artificial Intelligence and Machine Learning",
      "LLM applications and AI agents",
      "Multi-agent systems",
      "Full-stack development",
      "Creative coding and interactive 3D experiences",
      "Experimentation with new AI tools and agentic workflows"
    ],
    approach:
      "He leverages AI chatbots to decompose complex problems into manageable steps, diagnose errors, and explore effective solutions. Through iterative testing, debugging, and continuous learning, I refine my approach and turn challenges into opportunities for improvement.",
    currentlyLearning: [
      "As an AI/ML student, He currently strengthening his foundations in machine learning, deep learning, and Python while exploring LLMs, agentic AI, and multi-agent systems. He is also learning modern AI frameworks, prompt engineering, and model integration to develop practical problem-solving skills and stay up to date with advancements in AI.",
    ],
  },

  education: [
    {
      institution: "Dayananda Sagar University",
      program: "I’m pursuing a B.Tech in Artificial Intelligence and Machine Learning (AI/ML).",
      period: "[2024-2028]",
      notes: null as string | null,
    },
  ],

  links: {
    email: null as string | null, // e.g. "you@example.com"
    github: null as string | null, // e.g. "https://github.com/your-handle"
    linkedin: null as string | null, // e.g. "https://www.linkedin.com/in/your-handle"
    resume: null as string | null, // e.g. "/resume.pdf" (put the file in /public)
  },

  /**
   * The contact form posts to /api/contact, which forwards to the URL in the
   * CONTACT_FORWARD_URL environment variable (e.g. a Formspree endpoint).
   * If that variable is not set, the form says so plainly and offers a mailto
   * link instead. It never shows a success message for an unsent message.
   */
};

export type Portfolio = typeof portfolio;
