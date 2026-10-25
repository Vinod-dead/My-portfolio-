import { D } from "@/lib/robotDims";
import type { Mode } from "@/lib/timeline";

/**
 * Robot poses. Angles are radians about each joint's local X axis unless noted.
 * Negative X rotation swings a limb FORWARD (the robot faces +Z).
 * Shoulder Z rotation swings an arm sideways (outward is + for the +X "left" arm).
 *
 * Arm solutions for the scooter grips and the Namaskar hands were solved
 * numerically (forward kinematics, see README "How the poses were solved").
 */

export const KEYS = [
  "rootY",
  "pitch",
  "roll",
  "headYaw",
  "headPitch",
  "headRoll",
  "aLx",
  "aLz",
  "aRx",
  "aRz",
  "eL",
  "eR",
  "hL",
  "hR",
  "kL",
  "kR",
] as const;

export type PoseKey = (typeof KEYS)[number];
export type Pose = Record<PoseKey, number>;

export const NEUTRAL: Pose = {
  rootY: 0,
  pitch: 0,
  roll: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  aLx: 0,
  aLz: 0.12,
  aRx: 0,
  aRz: -0.12,
  eL: -0.12,
  eR: -0.12,
  hL: 0,
  hR: 0,
  kL: 0,
  kR: 0,
};

const P = (o: Partial<Pose>): Pose => ({ ...NEUTRAL, ...o });

export type Eyes = "normal" | "happy" | "curious";

export interface ModeConfig {
  pose: Pose;
  lambda: number;
  /** Keep the planted foot on the ground by solving rootY from the leg angles. */
  ground: boolean;
  eyes: Eyes;
}

export const MODES: Record<Mode, ModeConfig> = {
  startup: { pose: P({}), lambda: 8, ground: true, eyes: "curious" },
  walk: { pose: P({}), lambda: 10, ground: true, eyes: "normal" },
  notice: {
    pose: P({ pitch: -0.12, headPitch: -0.1, aLx: -0.5, aRx: -0.5, aLz: 0.4, aRz: -0.4 }),
    lambda: 9,
    ground: true,
    eyes: "curious",
  },
  excited: {
    pose: P({ aLx: -2.9, aRx: -2.9, aLz: 0.3, aRz: -0.3, eL: -0.1, eR: -0.1, headPitch: -0.15 }),
    lambda: 9,
    ground: true,
    eyes: "happy",
  },
  mount: {
    pose: P({ hL: -0.9, hR: -0.7, kL: 0.6, kR: 0.9, aLx: -1.2, aRx: -1.2, aLz: 0.05, aRz: -0.05, eL: -0.4, eR: -0.4, pitch: 0.1 }),
    lambda: 7,
    ground: false,
    eyes: "happy",
  },
  ride: {
    pose: P({ hL: -1.45, hR: -1.45, kL: 1.45, kR: 1.45, aLx: -1.36, aRx: -1.36, aLz: 0, aRz: 0, eL: -0.6, eR: -0.6, pitch: 0.04 }),
    lambda: 8,
    ground: false,
    eyes: "happy",
  },
  dismount: {
    pose: P({ hL: -0.5, hR: -0.35, kL: 0.4, kR: 0.5, aLz: 0.5, aRz: -0.5, aLx: -0.3, aRx: -0.3 }),
    lambda: 6,
    ground: false,
    eyes: "normal",
  },
  lookup: { pose: P({ headPitch: -0.7, pitch: -0.05 }), lambda: 6, ground: true, eyes: "curious" },
  spinup: { pose: P({ headPitch: -0.35, aLz: 0.5, aRz: -0.5 }), lambda: 6, ground: true, eyes: "curious" },
  crouch: {
    pose: P({ hL: -0.9, hR: -0.9, kL: 1.4, kR: 1.4, aLx: 0.5, aRx: 0.5, aLz: 0.35, aRz: -0.35, pitch: 0.25, headPitch: -0.1 }),
    lambda: 8,
    ground: true,
    eyes: "normal",
  },
  liftoff: {
    pose: P({ hL: 0.05, hR: -0.05, kL: 0.2, kR: 0.2, aLz: 0.9, aRz: -0.9, aLx: -0.3, aRx: -0.3, pitch: 0.1 }),
    lambda: 7,
    ground: false,
    eyes: "happy",
  },
  fly: {
    pose: P({ hL: 0.2, hR: 0.05, kL: 0.45, kR: 0.3, aLz: 0.8, aRz: -0.8, aLx: -0.35, aRx: -0.35, pitch: 0.12 }),
    lambda: 5,
    ground: false,
    eyes: "normal",
  },
  land: {
    pose: P({ hL: 0.1, hR: 0, kL: 0.1, kR: 0.1, aLz: 0.6, aRz: -0.6, aLx: -0.2, aRx: -0.2 }),
    lambda: 6,
    ground: false,
    eyes: "normal",
  },
  present: { pose: P({}), lambda: 6, ground: true, eyes: "normal" },
  examine: {
    pose: P({ pitch: 0.18, headPitch: 0.35, aLx: -1.1, aLz: 0.35, eL: -0.5 }),
    lambda: 6,
    ground: true,
    eyes: "curious",
  },
  activate: {
    pose: P({ pitch: 0.12, headPitch: 0.2, aRx: -1.5, aRz: -0.15, eR: -0.3, aLx: -0.2 }),
    lambda: 7,
    ground: true,
    eyes: "happy",
  },
  turn: { pose: P({}), lambda: 6, ground: true, eyes: "normal" },
  nod: { pose: P({}), lambda: 6, ground: true, eyes: "normal" },
  namaskar: {
    pose: P({ aLx: -1.38, aRx: -1.38, aLz: -0.72, aRz: 0.72, eL: -0.54, eR: -0.54, headPitch: 0.18, pitch: 0.04 }),
    lambda: 4.5,
    ground: true,
    eyes: "happy",
  },
};

/** rootY that keeps the lower foot exactly on the ground for the given leg angles. */
export const groundRootY = (hL: number, kL: number, hR: number, kR: number) => {
  const drop = (h: number, k: number) => D.thigh * Math.cos(h) + D.shin * Math.cos(h + k);
  return D.footH + Math.max(drop(hL, kL), drop(hR, kR)) - D.hipY;
};
