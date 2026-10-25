/**
 * Story chapters: ids, labels, dialogue and scroll ranges.
 * `start`/`end` are fractions of total scroll progress (0..1).
 * `anchor` is where chapter navigation lands (a well-composed moment).
 */

export type ChapterId =
  | "arrival"
  | "introduction"
  | "scooter"
  | "flight"
  | "projects"
  | "lab"
  | "contact"
  | "finale";

export interface Chapter {
  id: ChapterId;
  label: string;
  start: number;
  end: number;
  anchor: number;
  dialogue: string;
}

export const chapters: Chapter[] = [
  {
    id: "arrival",
    label: "Arrival",
    start: 0,
    end: 0.1,
    anchor: 0.045,
    dialogue:
      "Hello there! Welcome to Vinod's digital world. I'm your little robotic guide. Come along — I'll show you what Vinod builds, what he loves, and where his ideas are heading!",
  },
  {
    id: "introduction",
    label: "Introduction",
    start: 0.1,
    end: 0.24,
    anchor: 0.125,
    dialogue:
      "First, let me introduce you to Vinod. He's exploring the world of artificial intelligence, building projects, experimenting with agents, and turning ideas into working software.",
  },
  {
    id: "scooter",
    label: "Scooter journey",
    start: 0.24,
    end: 0.4,
    anchor: 0.312,
    dialogue:
      "Ready for the next stop? Let's explore the tools and technologies Vinod uses to turn ideas into real projects!",
  },
  {
    id: "flight",
    label: "Drone flight",
    start: 0.4,
    end: 0.5,
    anchor: 0.468,
    dialogue:
      "Now for my favorite part — let's take these ideas to the sky! Each destination represents something Vinod has been building.",
  },
  {
    id: "projects",
    label: "Projects",
    start: 0.5,
    end: 0.72,
    anchor: 0.545,
    dialogue: "",
  },
  {
    id: "lab",
    label: "Invention lab",
    start: 0.72,
    end: 0.84,
    anchor: 0.805,
    dialogue:
      "There's always something new to discover! Vinod enjoys experimenting, learning new tools, and finding creative ways to solve problems.",
  },
  {
    id: "contact",
    label: "Contact",
    start: 0.84,
    end: 0.94,
    anchor: 0.915,
    dialogue:
      "That brings us to the end of our adventure! If you'd like to explore Vinod's work, discuss an idea, or build something interesting together, let's connect.",
  },
  {
    id: "finale",
    label: "Namaskar finale",
    start: 0.94,
    end: 1.001,
    anchor: 0.999,
    dialogue: "Thank you for joining me on this little adventure through Vinod's world!",
  },
];

export const chapterIndexAt = (p: number): number => {
  for (let i = chapters.length - 1; i >= 0; i--) if (p >= chapters[i].start) return i;
  return 0;
};
