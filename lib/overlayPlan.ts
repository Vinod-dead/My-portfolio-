import { N_PROJECTS, SPAN, projStart } from "@/lib/layout";
import { chapterIndexAt, chapters } from "@/data/story";
import { projects } from "@/data/projects";

/**
 * Which DOM panel is on screen at progress p, and what the robot says.
 * Pure functions returning primitives, so they can be used as store selectors.
 */

export const PANEL_WINDOWS: { id: string; a: number; b: number }[] = [
  { id: "about-0", a: 0.115, b: 0.15 },
  { id: "about-1", a: 0.15, b: 0.185 },
  { id: "about-2", a: 0.185, b: 0.215 },
  { id: "about-3", a: 0.215, b: 0.245 },
  { id: "edu", a: 0.305, b: 0.328 },
  { id: "skills-prog", a: 0.328, b: 0.348 },
  { id: "skills-ai", a: 0.348, b: 0.364 },
  { id: "skills-tools", a: 0.364, b: 0.382 },
  { id: "exploring", a: 0.382, b: 0.405 },
  { id: "projects-intro", a: 0.462, b: 0.5 },
  ...Array.from({ length: N_PROJECTS }, (_, i) => ({
    id: `project-${i}`,
    a: projStart(i) + 0.4 * SPAN,
    b: projStart(i) + 0.92 * SPAN,
  })),
  { id: "lab", a: 0.8, b: 0.845 },
  { id: "contact", a: 0.9, b: 0.945 },
  { id: "finale", a: 0.985, b: 1.01 },
];

export function activePanel(p: number): string {
  if (p < 0.085) return "hero";
  for (const w of PANEL_WINDOWS) if (p >= w.a && p < w.b) return w.id;
  return "";
}

export function dialogueAt(p: number): string {
  if (p < 0.035) return "";
  const ci = chapterIndexAt(p);
  const c = chapters[ci];
  if (c.id === "projects") {
    const i = Math.min(N_PROJECTS - 1, Math.floor((p - projStart(0)) / SPAN));
    const t = (p - projStart(i)) / SPAN;
    return t > 0.3 ? (projects[i]?.dialogue ?? "") : "";
  }
  if (c.id === "scooter" && p < 0.27) return "";
  return c.dialogue;
}

export const chapterIndexSelector = (p: number) => chapterIndexAt(p);
