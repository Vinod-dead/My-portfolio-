"use client";

import { gsap } from "gsap";
import { scrollToProgress, story } from "@/lib/store";

/**
 * Opening move: the robot walks in by itself for a moment, by gently driving the
 * page scroll. Any wheel / touch / key / pointer input cancels it immediately,
 * so the visitor is never held up by it.
 */
let tween: gsap.core.Tween | null = null;
let stop: (() => void) | null = null;

export function cancelIntro() {
  tween?.kill();
  tween = null;
  stop?.();
  stop = null;
}

export function startIntro(delay = 0.8) {
  cancelIntro();
  if (story.reduced) return;
  const proxy = { v: 0 };
  const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const cancel = () => cancelIntro();
  events.forEach((e) => window.addEventListener(e, cancel, { passive: true, once: true }));
  stop = () => events.forEach((e) => window.removeEventListener(e, cancel));
  tween = gsap.to(proxy, {
    v: 0.046,
    duration: 4.4,
    delay,
    ease: "power2.inOut",
    onUpdate: () => scrollToProgress(proxy.v, true),
    onComplete: () => {
      tween = null;
      stop?.();
      stop = null;
    },
  });
}

/** Jump back to the start and play the opening again. */
export function replayJourney() {
  cancelIntro();
  scrollToProgress(0, true);
  story.target = 0;
  story.p = 0;
  startIntro(0.4);
}
