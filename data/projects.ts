/**
 * EDIT THIS FILE to add or change projects.
 * Only describe what is real. `status` controls the badge shown in the UI.
 * Links set to null are hidden. Add a new object to `projects` to add a project;
 * the 3D world for unknown ids falls back to a generic island theme.
 */

import { URL } from "node:url";

export type ProjectStatus = "project" | "in-progress" | "concept";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  summary: string;
  features: string[];
  stack: string[];
  repo: string | null;
  /** Accent colour for this project's world */
  accent: string;
  /** Which 3D world to show */
  world: "quiz" | "travel" | "flow" | "generic";
  dialogue: string;
}

export const projects: Project[] = [
  {
    id: "quizforge",
    name: "QuizForge",
    status: "project",
    summary:
      "An AI-powered quiz and learning platform focused on making learning and quizzes more engaging.",
   features: [
      "[PLACEHOLDER:AI-powered quiz generation, live interactive quizzes, teacher and student dashboards, student authentication, automatic scoring, and real-time WebSocket communication ]",
    ],
    stack:  ["[PLACEHOLDER:HTML5, CSS3, JavaScript, Node.js, Express.js, Nebius Token Factory API (openai/gpt-oss-120b), SQLite (better-sqlite3), WebSockets, JWT, npm, and Docker. ]"],
    repo: "https://github.com/Vinod-dead/QuizForze",
    accent: "#5ab0ff",
    world: "quiz",
    dialogue:
      "Welcome to QuizForge — a project focused on making learning and quizzes more engaging with AI-powered ideas!",
  },
  {
    id: "travel-planner",
    name: "Multi-Agent Travel Planner",
    status: "project",
    summary:
      "An intelligent travel-planning system that coordinates specialized AI agents to organize a trip around the traveler's preferences and budget.",
    features: [
      "[PLACEHOLDER: describe each agent and what it does, e.g. itinerary, budget, logistics]",
    ],
    stack: ["[PLACEHOLDER: add the real tech stack]"],
    repo: null,
    accent: "#4fe3c1",
    world: "travel",
    dialogue:
      "This is the Multi-Agent Travel Planner. The idea is to coordinate specialized AI agents to help organize a trip around the traveler's preferences and budget.",
  },
  {
    id: "Smart Dunning Agent",
    name: "Smart Dunning agent",
    status: "project",
    summary:
      "Smart Dunning Agent is an AI-powered revenue recovery system that analyzes failed recurring payments, retrieves historical recovery patterns, recommends intelligent recovery actions, generates personalized customer messages, and provides validated decisions with audit reasoning and recovery analytics.",
    features: [
      "AI-powered payment failure analysis, historical recovery-pattern retrieval, intelligent recovery recommendations, structured output validation, personalized customer messages, and AI vs. baseline recovery analytics.]",
    ],
    stack: ["[Python, FastAPI, React, Vite, JavaScript, Recharts, LLM API, JSON-based retrieval data, and synthetic transaction datasets.]"],
    repo: "https://github.com/Vinod-dead/smart-dunning--agent",
    accent: "#b7a4ff",
    world: "flow",
    dialogue:
      "Smart Dunning Agent is an AI-powered revenue recovery system that analyzes failed recurring payments, retrieves historical recovery patterns, recommends intelligent recovery actions, generates personalized customer messages, and provides validated decisions with audit reasoning and recovery analytics.",
  },
];
