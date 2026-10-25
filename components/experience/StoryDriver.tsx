"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { evaluate, frame } from "@/lib/timeline";
import { publishProgress, story } from "@/lib/store";
import { audio } from "@/lib/audio";

/**
 * Runs first every frame (negative priority): smooths scroll progress,
 * evaluates the master timeline into the shared `frame`, measures the robot's
 * real speed, and feeds the DOM store and audio loops.
 */
export function StoryDriver({ onReady }: { onReady: () => void }) {
  const prev = useRef({ x: 0, y: 0, z: 0, init: false });
  const ready = useRef(false);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1);

    if (story.reduced) {
      story.p = story.target;
    } else {
      const diff = Math.abs(story.target - story.p);
      // catch up faster across big jumps (chapter navigation, replay)
      const lam = 5 + Math.min(14, diff * 45);
      story.p = THREE.MathUtils.damp(story.p, story.target, lam, dt);
      if (Math.abs(story.target - story.p) < 0.00003) story.p = story.target;
    }

    evaluate(story.p, frame);

    const pv = prev.current;
    if (pv.init) {
      const raw = Math.hypot(frame.x - pv.x, frame.y - pv.y, frame.z - pv.z) / Math.max(dt, 0.001);
      frame.speed = THREE.MathUtils.damp(frame.speed, Math.min(raw, 14), 8, dt);
    }
    pv.x = frame.x;
    pv.y = frame.y;
    pv.z = frame.z;
    pv.init = true;

    publishProgress(Math.round(story.p * 2000) / 2000);
    audio.setLoops(frame.rotor, frame.riding ? Math.min(1, frame.speed / 3) : 0);

    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  }, -10);

  return null;
}
