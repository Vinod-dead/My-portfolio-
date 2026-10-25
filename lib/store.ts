"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store that bridges the 3D render loop and the DOM overlays.
 * The render loop writes smoothed progress; React components subscribe only to
 * the derived primitive values they need (a panel id, a chapter index…), so
 * the DOM re-renders when something visible changes, not every frame.
 */

export const story = {
  /** raw scroll progress (set from the scroll position) */
  target: 0,
  /** smoothed progress used by the 3D scene and the overlays */
  p: 0,
  reduced: false,
  lite: false,
};

let published = 0;
const listeners = new Set<() => void>();
const rawListeners = new Set<(p: number) => void>();

export function publishProgress(p: number) {
  if (p === published) return;
  published = p;
  rawListeners.forEach((l) => l(p));
  // DOM-facing listeners are fired on a coarse grid; selectors decide what changes.
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Subscribe to a derived primitive of the smoothed progress. */
export function useStory<T extends string | number | boolean>(selector: (p: number) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(published),
    () => selector(0),
  );
}

/** Per-frame, non-React subscription (for progress bars, etc.). */
export function onProgress(cb: (p: number) => void) {
  rawListeners.add(cb);
  cb(published);
  return () => {
    rawListeners.delete(cb);
  };
}

export const currentProgress = () => published;

/** Scroll the page so the journey sits at progress p. */
export function scrollToProgress(p: number, instant = false) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, p * max), behavior: instant || story.reduced ? "auto" : "smooth" });
}

export function readScrollProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
}
