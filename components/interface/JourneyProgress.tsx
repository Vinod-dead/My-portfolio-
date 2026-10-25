"use client";

import { useEffect, useRef } from "react";
import { chapterIndexSelector } from "@/lib/overlayPlan";
import { chapters } from "@/data/story";
import { onProgress, scrollToProgress, useStory } from "@/lib/store";
import { audio } from "@/lib/audio";

/** Scroll progress bar (updated without React renders) and a chapter rail. */
export function JourneyProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const current = useStory(chapterIndexSelector);

  useEffect(
    () =>
      onProgress((p) => {
        if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
      }),
    [],
  );

  return (
    <>
      <div className="progress" role="progressbar" aria-label="Journey progress" aria-valuemin={0} aria-valuemax={100}>
        <div ref={bar} className="progress-bar" />
      </div>
      <nav className="rail" aria-label="Story chapters">
        <ol>
          {chapters.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                aria-label={`Go to ${c.label}`}
                aria-current={i === current ? "step" : undefined}
                data-active={i === current}
                onClick={() => {
                  audio.tick();
                  scrollToProgress(c.anchor);
                }}
              >
                <span className="rail-label">{c.label}</span>
                <i />
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
