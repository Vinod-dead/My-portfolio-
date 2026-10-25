"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { audio } from "@/lib/audio";

const snapshot = () => JSON.stringify(audio.prefs);
export function useAudioPrefs() {
  const raw = useSyncExternalStore(
    (l) => audio.subscribe(l),
    snapshot,
    () => "{}",
  );
  return JSON.parse(raw) as { enabled?: boolean; music?: number; sfx?: boolean; voice?: boolean };
}

const Icon = ({ on }: { on: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    {on ? (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ) : (
      <>
        <path d="m16 9 5 6" />
        <path d="m21 9-5 6" />
      </>
    )}
  </svg>
);

/** Sound toggle (muted by default), music volume, and separate effect / voice switches. */
export function AudioControls() {
  const prefs = useAudioPrefs();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const on = !!prefs.enabled;

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="audio" ref={box}>
      <button
        type="button"
        className="icon-btn"
        aria-pressed={on}
        aria-label={on ? "Turn sound off" : "Turn sound on"}
        title={on ? "Sound on" : "Sound off — click for ambient music"}
        onClick={() => {
          audio.setEnabled(!on);
          if (!on) setOpen(true);
        }}
      >
        <Icon on={on} />
      </button>
      <button type="button" className="icon-btn icon-btn-sm" aria-label="Sound settings" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="audio-pop" role="group" aria-label="Sound settings">
          <label className="row">
            <span>Music volume</span>
            <input type="range" min={0} max={1} step={0.05} value={prefs.music ?? 0.5} onChange={(e) => audio.setMusicVolume(Number(e.target.value))} aria-label="Music volume" />
          </label>
          <label className="row">
            <input type="checkbox" checked={prefs.sfx ?? true} onChange={(e) => audio.setSfx(e.target.checked)} />
            <span>Sound effects</span>
          </label>
          <label className="row">
            <input type="checkbox" checked={!!prefs.voice} onChange={(e) => audio.setVoice(e.target.checked)} />
            <span>Read robot dialogue aloud</span>
          </label>
          <p className="muted small">{on ? "Music is generated live in your browser." : "Sound is off. Turn it on for ambient music."}</p>
        </div>
      )}
    </div>
  );
}
