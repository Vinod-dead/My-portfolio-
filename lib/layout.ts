import { projects } from "@/data/projects";

/** World layout shared by the timeline and the 3D scenes. */

export const N_PROJECTS = Math.max(1, projects.length);
export const PROJ_START = 0.5;
export const PROJ_END = 0.72;
export const SPAN = (PROJ_END - PROJ_START) / N_PROJECTS;
export const projStart = (i: number) => PROJ_START + i * SPAN;

const TOPS = [3, 5.5, 3.5];
const ZS = [0, -6, 0];

export interface Island {
  x: number;
  top: number;
  z: number;
}
export const islandAt = (i: number): Island => ({
  x: 80 + 20 * i,
  top: TOPS[i % 3],
  z: ZS[i % 3],
});

export const LAUNCH_X = 56;
export const LAB_X = 80 + 20 * (N_PROJECTS - 1) + 32;
export const DOOR_X = LAB_X + 8;
export const TERMINAL_X = LAB_X + 30;
export const FINALE_X = LAB_X + 42;
export const WORLD_END_X = FINALE_X + 20;

/** Progress milestones for the scenes that need them. */
export const T = {
  hero: 0.085,
  rideStart: 0.3,
  rideEnd: 0.395,
  labOn: 0.795,
  labOff: 0.845,
  doorOpen0: 0.835,
  doorOpen1: 0.855,
  namaskarStart: 0.98,
};

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
