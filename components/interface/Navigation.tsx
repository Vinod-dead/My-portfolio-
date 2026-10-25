"use client";

import { useState } from "react";
import { chapters } from "@/data/story";
import { portfolio } from "@/data/portfolio";
import { chapterIndexSelector } from "@/lib/overlayPlan";
import { scrollToProgress, useStory } from "@/lib/store";
import { audio } from "@/lib/audio";
import { AudioControls } from "./AudioControls";

interface Props {
  mode: "cinematic" | "classic";
  onToggleMode: () => void;
  onReplay: () => void;
}

/** Header: chapter navigation, replay, classic/cinematic switch and sound controls. */
export function Navigation({ mode, onToggleMode, onReplay }: Props) {
  const [open, setOpen] = useState(false);
  const cinematic = mode === "cinematic";
  const current = useStory(chapterIndexSelector);

  const go = (anchor: number) => {
    audio.tick();
    setOpen(false);
    scrollToProgress(anchor);
  };

  return (
    <header className="topbar">
      <a className="brand" href="#top" onClick={(e) => { if (cinematic) { e.preventDefault(); go(0); } }} aria-label={`${portfolio.name} — start`}>
        <span className="brand-mark" aria-hidden="true">VR</span>
        <span className="brand-name">{portfolio.name}</span>
      </a>

      {cinematic && (
        <nav className="chapters" aria-label="Chapters">
          {chapters.map((c, i) => (
            <button key={c.id} type="button" aria-current={i === current ? "true" : undefined} onClick={() => go(c.anchor)}>
              {c.label}
            </button>
          ))}
        </nav>
      )}

      <div className="topbar-actions">
        {cinematic && (
          <button type="button" className="btn btn-ghost hide-sm" onClick={() => { audio.tick(); onReplay(); }}>
            Replay
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onToggleMode} aria-label={cinematic ? "Switch to the classic page" : "Switch to the cinematic 3D journey"}>
          {cinematic ? "Classic view" : "3D journey"}
        </button>
        <AudioControls />
        {cinematic && (
          <button type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="chapter-menu" aria-label="Chapter menu" onClick={() => setOpen((v) => !v)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        )}
      </div>

      {cinematic && open && (
        <nav id="chapter-menu" className="menu" aria-label="Chapters">
          {chapters.map((c, i) => (
            <button key={c.id} type="button" aria-current={i === current ? "true" : undefined} onClick={() => go(c.anchor)}>
              <span>{String(i + 1).padStart(2, "0")}</span> {c.label}
            </button>
          ))}
          <button type="button" onClick={() => { setOpen(false); onReplay(); }}>
            <span>↺</span> Replay from the start
          </button>
        </nav>
      )}
    </header>
  );
}
