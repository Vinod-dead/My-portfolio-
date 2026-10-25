import { projects } from "@/data/projects";
import {
  DOOR_X,
  FINALE_X,
  LAB_X,
  LAUNCH_X,
  N_PROJECTS,
  SPAN,
  T,
  TERMINAL_X,
  clamp01,
  islandAt,
  lerp,
  projStart,
  smoothstep,
} from "@/lib/layout";

/**
 * The master timeline. One pure function, `evaluate(p, frame)`, turns scroll
 * progress (0..1) into the robot's position / pose mode, the scooter state and
 * the camera shot. The result is written into a shared mutable `frame` so the
 * render loop allocates nothing.
 */

export type Mode =
  | "startup"
  | "walk"
  | "notice"
  | "excited"
  | "mount"
  | "ride"
  | "dismount"
  | "lookup"
  | "spinup"
  | "crouch"
  | "liftoff"
  | "fly"
  | "land"
  | "present"
  | "examine"
  | "activate"
  | "turn"
  | "nod"
  | "namaskar";

export interface Frame {
  x: number;
  y: number;
  z: number;
  yaw: number;
  mode: Mode;
  modeT: number;
  rotor: number;
  ground: number;
  gesture: number;
  // scooter
  sx: number;
  sz: number;
  syaw: number;
  swheel: number;
  riding: number;
  // scene drivers
  labActive: number;
  doorOpen: number;
  warmth: number;
  // camera shot (offsets are relative to the robot)
  cx: number;
  cy: number;
  cz: number;
  lx: number;
  ly: number;
  lz: number;
  fov: number;
  // measured motion (filled by the render loop)
  speed: number;
}

export const frame: Frame = {
  x: 0,
  y: 0,
  z: -4,
  yaw: 0,
  mode: "startup",
  modeT: 0,
  rotor: 0,
  ground: 0,
  gesture: 0,
  sx: 19.2,
  sz: -1.5,
  syaw: Math.PI / 2,
  swheel: 0,
  riding: 0,
  labActive: 0,
  doorOpen: 0,
  warmth: 0,
  cx: 0,
  cy: 2.4,
  cz: 10.5,
  lx: 0,
  ly: 0.9,
  lz: 0,
  fov: 42,
  speed: 0,
};

/* ---------------------------------------------------------------- scooter */

const RIDE0 = T.rideStart;
const RIDE1 = T.rideEnd;
const S_X0 = 19.2;
const S_Z0 = -1.5;
const S_X1 = LAUNCH_X - 2.8;
const S_Z1 = -0.3;
const SEAT_Z = -0.12;
const SEAT_Y = 0.05;

function rideU(p: number) {
  const t = clamp01((p - RIDE0) / (RIDE1 - RIDE0));
  return { t, u: t * t * t * (t * (6 * t - 15) + 10) };
}

interface ScooterOut {
  sx: number;
  sz: number;
  syaw: number;
  swheel: number;
}

function scooterInto(p: number, o: ScooterOut) {
  const { u } = rideU(p);
  const dx = S_X1 - S_X0;
  o.sx = S_X0 + dx * u;
  const wob = 0.75 * Math.sin(2 * Math.PI * u) * Math.sin(Math.PI * u);
  o.sz = S_Z0 + (S_Z1 - S_Z0) * u + wob;
  const dwob =
    0.75 * (2 * Math.PI * Math.cos(2 * Math.PI * u) * Math.sin(Math.PI * u) + Math.PI * Math.sin(2 * Math.PI * u) * Math.cos(Math.PI * u));
  // yaw is taken from the path tangent (u-derivative), independent of speed
  o.syaw = Math.atan2(dx, S_Z1 - S_Z0 + dwob);
  o.swheel = (o.sx - S_X0) / 0.15;
}

const tmpS: ScooterOut = { sx: 0, sz: 0, syaw: 0, swheel: 0 };
const seatWorld = (s: ScooterOut): [number, number, number] => [
  s.sx + SEAT_Z * Math.sin(s.syaw),
  SEAT_Y,
  s.sz + SEAT_Z * Math.cos(s.syaw),
];

scooterInto(0, tmpS);
const SEAT_START = seatWorld(tmpS);
const YAW_START = tmpS.syaw;
scooterInto(1, tmpS);
const SEAT_END = seatWorld(tmpS);
const YAW_END = tmpS.syaw;

/* ------------------------------------------------------------------ beats */

type Ease = "linear" | "smooth" | "in" | "out";
type V3 = [number, number, number];

interface Beat {
  p0: number;
  p1: number;
  mode: Mode;
  from: V3;
  to: V3;
  yaw0: number;
  yaw1: number;
  ease: Ease;
  arc: number;
  r0: number;
  r1: number;
  g0: number;
  g1: number;
  follow: boolean;
}

interface BeatOpts {
  to?: V3;
  yaw?: number;
  ease?: Ease;
  arc?: number;
  rotor?: number;
  ground?: number;
  follow?: boolean;
}

class Builder {
  beats: Beat[] = [];
  p = 0;
  pos: V3;
  yaw: number;
  rotor = 0;
  ground = 0;
  constructor(pos: V3, yaw: number) {
    this.pos = pos;
    this.yaw = yaw;
  }
  add(p1: number, mode: Mode, o: BeatOpts = {}) {
    const to = o.to ?? this.pos;
    const yaw = o.yaw ?? this.yaw;
    const rotor = o.rotor ?? this.rotor;
    const ground = o.ground ?? this.ground;
    this.beats.push({
      p0: this.p,
      p1,
      mode,
      from: this.pos,
      to,
      yaw0: this.yaw,
      yaw1: yaw,
      ease: o.ease ?? "smooth",
      arc: o.arc ?? 0,
      r0: this.rotor,
      r1: rotor,
      g0: this.ground,
      g1: ground,
      follow: o.follow ?? false,
    });
    this.p = p1;
    this.pos = to;
    this.yaw = yaw;
    this.rotor = rotor;
    this.ground = ground;
    return this;
  }
}

function buildBeats(): Beat[] {
  const b = new Builder([0, 0, -4], 0);
  const PI = Math.PI;

  // 1. Arrival
  b.add(0.03, "startup");
  b.add(0.095, "walk", { to: [0, 0, 0.6] });

  // 2. Introduction: turn and walk the pathway
  b.add(0.115, "walk", { to: [1.5, 0, 0.3], yaw: PI / 2 });
  b.add(0.24, "walk", { to: [15.5, 0, 0], ease: "linear" });

  // 3. Scooter: notice, react, approach, climb on
  const toScooter = Math.atan2(S_X0 - 15.5, S_Z0 - 0);
  b.add(0.25, "notice", { yaw: toScooter });
  b.add(0.265, "excited");
  const approach: V3 = [S_X0 - 0.2, 0, S_Z0 + 0.9];
  const faceScooter = Math.atan2(SEAT_START[0] - approach[0], SEAT_START[2] - approach[2]);
  b.add(0.278, "walk", { to: approach, yaw: faceScooter });
  b.add(RIDE0, "mount", { to: SEAT_START, yaw: YAW_START, arc: 0.55 });
  b.add(0.4, "ride", { to: SEAT_END, yaw: YAW_END, follow: true, ease: "linear" });

  // 4. Drone flight: dismount, look up, spin up, crouch, lift off
  const pad: V3 = [LAUNCH_X - 1.4, 0, 0.9];
  b.add(0.415, "dismount", { to: pad, yaw: 0.35, arc: 0.45 });
  b.add(0.43, "lookup");
  b.add(0.445, "spinup", { rotor: 1 });
  b.add(0.455, "crouch");
  const lift: V3 = [pad[0] + 0.2, 4.6, pad[2] - 0.4];
  b.add(0.478, "liftoff", { to: lift, yaw: PI / 2 });
  const out: V3 = [LAUNCH_X + 10, 6.8, 0];
  b.add(0.5, "fly", { to: out, ease: "linear" });

  // 5. Project worlds
  for (let i = 0; i < N_PROJECTS; i++) {
    const s = projStart(i);
    const isl = islandAt(i);
    const hover: V3 = [isl.x - 1.2, isl.top + 3.0, isl.z + 2.0];
    const land: V3 = [isl.x - 0.8, isl.top, isl.z + 1.4];
    const takeoff: V3 = [land[0] + 0.6, land[1] + 2.6, land[2] - 0.2];
    b.add(s + 0.3 * SPAN, "fly", { to: hover, yaw: PI / 2, rotor: 1, ground: isl.top });
    b.add(s + 0.46 * SPAN, "land", { to: land, yaw: -0.5, rotor: 0 });
    b.add(s + 0.88 * SPAN, "present");
    b.add(s + SPAN, "liftoff", { to: takeoff, yaw: PI / 2, rotor: 1 });
  }

  // 6. Invention lab: fly in through the entrance, land, examine, activate
  const entrance: V3 = [LAB_X - 9.5, 3.2, 0.5];
  const inside: V3 = [LAB_X - 2.6, 2.4, 0.6];
  const spot: V3 = [LAB_X - 2.2, 0, 0.5];
  b.add(0.745, "fly", { to: entrance, yaw: PI / 2, rotor: 1, ground: 0 });
  b.add(0.765, "fly", { to: inside, yaw: 1.3, ease: "smooth" });
  b.add(0.776, "land", { to: spot, yaw: 1.9, rotor: 0 });
  b.add(0.795, "examine", { yaw: Math.atan2(2.5, -1.1) });
  b.add(0.812, "activate");
  b.add(0.84, "present");

  // 7. Contact: out through the doors to the terminal
  const door: V3 = [DOOR_X + 0.6, 0, 0.4];
  b.add(0.862, "walk", { to: door, yaw: PI / 2 });
  const termStand: V3 = [TERMINAL_X - 2.2, 0, 0.4];
  b.add(0.905, "walk", { to: termStand, ease: "linear" });
  b.add(0.94, "present", { yaw: 0.35 });

  // 8. Namaskar finale
  const centre: V3 = [FINALE_X, 0, 0];
  b.add(0.962, "walk", { to: centre, yaw: PI / 2 });
  b.add(0.97, "turn", { yaw: 0 });
  b.add(0.98, "nod");
  b.add(1.001, "namaskar");

  return b.beats;
}

const beats = buildBeats();

const ease = (e: Ease, t: number) =>
  e === "linear" ? t : e === "smooth" ? t * t * (3 - 2 * t) : e === "in" ? t * t : 1 - (1 - t) * (1 - t);

const bump = (p: number, a: number, b: number) => {
  if (p <= a || p >= b) return 0;
  return Math.sin(Math.PI * ((p - a) / (b - a)));
};

/* ----------------------------------------------------------------- camera */

// [p, camera offset xyz, look offset xyz, fov] — all relative to the robot.
type Key = [number, number, number, number, number, number, number, number];

function buildKeys(): Key[] {
  const k: Key[] = [
    [0, 0, 2.4, 10.5, 0, 0.9, 0, 42],
    [0.03, 0, 2.2, 9.5, 0, 0.9, 0, 42],
    [0.1, 0.6, 1.5, 3.4, 0, 0.95, 0, 40],
    [0.115, -2.8, 1.6, 4.6, 1.8, 1.0, 0, 42],
    [0.24, -2.8, 1.6, 4.6, 1.8, 1.0, 0, 42],
    [0.255, 1.8, 1.4, 4.2, 2.0, 0.8, -1.2, 42],
    [0.285, -1.0, 1.4, 4.2, 1.4, 0.7, -1.2, 42],
    [0.3, -3.2, 1.5, 3.4, 1.5, 0.8, 0, 44],
    [0.32, -4.2, 1.7, 2.4, 2.0, 0.9, 0, 46],
    [0.345, 0.5, 1.3, 5.0, 2.5, 0.9, 0, 44],
    [0.365, 5.5, 1.2, 3.0, -1.0, 0.9, 0, 46],
    [0.385, 4.0, 1.6, 4.2, 0, 0.9, 0, 44],
    [0.4, 1.5, 1.6, 5.0, 0, 0.9, 0, 42],
    [0.44, 1.0, 1.4, 3.6, 0, 1.2, 0, 42],
    [0.46, -0.5, 0.8, 4.8, 0, 2.0, 0, 46],
    [0.478, -4.0, 2.0, 5.5, 2.0, 0.9, 0, 50],
    [0.5, -3.5, 2.2, 6.5, 3.0, 0.8, 0, 52],
  ];
  for (let i = 0; i < N_PROJECTS; i++) {
    const s = projStart(i);
    k.push([s + 0.3 * SPAN, -2.5, 1.8, 6.5, 1.5, 0.0, 0, 50]);
    k.push([s + 0.5 * SPAN, -3.2, 1.5, 5.4, 1.8, 1.0, -0.4, 44]);
    k.push([s + 0.88 * SPAN, -3.2, 1.5, 5.4, 1.8, 1.0, -0.4, 44]);
    k.push([s + SPAN, -4.0, 2.0, 6.5, 3.0, 0.5, 0, 50]);
  }
  k.push(
    [0.74, -3.5, 2.4, 7.5, 3.0, 1.2, 0, 52],
    [0.765, -2.0, 2.0, 7.5, 2.0, 1.3, 0, 50],
    [0.78, 3.0, 1.6, 3.6, 2.2, 1.2, -0.8, 42],
    [0.84, 3.0, 1.6, 3.6, 2.2, 1.2, -0.8, 42],
    [0.862, -3.5, 1.6, 5.0, 2.5, 1.0, 0, 44],
    [0.905, -2.5, 1.5, 4.6, 2.2, 1.0, -0.3, 42],
    [0.94, -2.5, 1.5, 4.6, 2.2, 1.0, -0.3, 42],
    [0.962, 0.0, 1.5, 5.2, 0, 1.0, 0, 40],
    [0.98, 0.0, 1.35, 4.0, 0, 1.05, 0, 38],
    [1.0, 0.0, 1.25, 2.9, 0, 1.05, 0, 36],
  );
  return k.sort((a, b) => a[0] - b[0]);
}
const keys = buildKeys();

function cameraInto(p: number, f: Frame) {
  let i = 0;
  while (i < keys.length - 2 && p >= keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const t = clamp01((p - a[0]) / (b[0] - a[0] || 1));
  const e = t * t * (3 - 2 * t);
  f.cx = lerp(a[1], b[1], e);
  f.cy = lerp(a[2], b[2], e);
  f.cz = lerp(a[3], b[3], e);
  f.lx = lerp(a[4], b[4], e);
  f.ly = lerp(a[5], b[5], e);
  f.lz = lerp(a[6], b[6], e);
  f.fov = lerp(a[7], b[7], e);
}

/* --------------------------------------------------------------- evaluate */

const scratch: ScooterOut = { sx: 0, sz: 0, syaw: 0, swheel: 0 };

export function evaluate(pIn: number, f: Frame) {
  const p = clamp01(pIn);

  let bi = 0;
  while (bi < beats.length - 1 && p >= beats[bi].p1) bi++;
  const b = beats[bi];
  const span = b.p1 - b.p0;
  const t = span > 0 ? clamp01((p - b.p0) / span) : 0;
  const e = ease(b.ease, t);

  scooterInto(p, scratch);
  f.sx = scratch.sx;
  f.sz = scratch.sz;
  f.syaw = scratch.syaw;
  f.swheel = scratch.swheel;
  f.riding = b.follow ? 1 : 0;

  if (b.follow) {
    f.x = scratch.sx + SEAT_Z * Math.sin(scratch.syaw);
    f.y = SEAT_Y;
    f.z = scratch.sz + SEAT_Z * Math.cos(scratch.syaw);
    f.yaw = scratch.syaw;
  } else {
    f.x = lerp(b.from[0], b.to[0], e);
    f.y = lerp(b.from[1], b.to[1], e) + b.arc * Math.sin(Math.PI * t);
    f.z = lerp(b.from[2], b.to[2], e);
    f.yaw = lerp(b.yaw0, b.yaw1, e);
  }

  f.mode = b.mode;
  f.modeT = t;
  f.ground = lerp(b.g0, b.g1, e);

  // rotor level
  if (b.mode === "startup") {
    f.rotor = 0.85 * Math.sin(Math.PI * Math.min(1, t * 1.6));
  } else if (b.r1 > b.r0) {
    f.rotor = lerp(b.r0, b.r1, clamp01(t * 2.5));
  } else if (b.r1 < b.r0) {
    f.rotor = lerp(b.r0, b.r1, smoothstep(0.55, 1, t));
  } else {
    f.rotor = b.r1;
  }

  // gesturing toward the floating panels while walking the introduction
  f.gesture = Math.max(bump(p, 0.125, 0.147), bump(p, 0.165, 0.187), bump(p, 0.205, 0.227), bump(p, 0.915, 0.935));

  f.labActive = smoothstep(T.labOn, T.labOn + 0.015, p) * (1 - smoothstep(T.labOff, T.labOff + 0.012, p));
  f.doorOpen = smoothstep(T.doorOpen0, T.doorOpen1, p);
  f.warmth = smoothstep(0.972, 1, p);

  cameraInto(p, f);
}

/* ---------------------------------------------------------- shared helpers */

const scratch2: ScooterOut = { sx: 0, sz: 0, syaw: 0, swheel: 0 };
/** X position of the scooter at progress p (used to place roadside panels). */
export function rideXAt(p: number) {
  scooterInto(p, scratch2);
  return scratch2.sx;
}

/** 0..1 "reveal" of project i's world contents once the robot has landed. */
export const projectReveal = (i: number, p: number) => smoothstep(projStart(i) + 0.2 * SPAN, projStart(i) + 0.55 * SPAN, p);

/** Which project (if any) the story is currently at, with active flag. */
export function activeProject(p: number): number {
  if (p < projStart(0) || p >= projStart(N_PROJECTS)) return -1;
  return Math.min(N_PROJECTS - 1, Math.floor((p - projStart(0)) / SPAN));
}

export const projectCount = projects.length;
