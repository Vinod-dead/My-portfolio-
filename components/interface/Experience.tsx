"use client";

import { Component, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hasWebGL, looksLowPower, prefersReducedMotion } from "@/lib/device";
import { readScrollProgress, scrollToProgress, story } from "@/lib/store";
import { chapters } from "@/data/story";
import { portfolio } from "@/data/portfolio";
import { audio } from "@/lib/audio";
import { Navigation } from "./Navigation";
import { SectionOverlay } from "./SectionOverlay";
import { DialogueBox } from "./DialogueBox";
import { JourneyProgress } from "./JourneyProgress";
import { LoadingScreen } from "./LoadingScreen";
import { ClassicView } from "./ClassicView";
import { cancelIntro, replayJourney, startIntro } from "./intro";

const ExperienceCanvas = dynamic(() => import("@/components/experience/ExperienceCanvas"), { ssr: false });

/* ----------------------------------------------------------- environment */

interface Env {
  webgl: boolean;
  reduced: boolean;
  lite: boolean;
}
let envCache: Env | null = null;
function getEnv(): Env {
  if (!envCache) {
    envCache = { webgl: hasWebGL(), reduced: prefersReducedMotion(), lite: looksLowPower() };
    story.reduced = envCache.reduced;
    story.lite = envCache.lite;
  }
  return envCache;
}
const noopSub = () => () => {};
const useEnv = () => useSyncExternalStore(noopSub, getEnv, () => null);

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* ----------------------------------------------------------------- stage */

function Stage({ lite, onClassic, onCrash }: { lite: boolean; onClassic: () => void; onCrash: () => void }) {
  const spacer = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  // scroll position -> story progress
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = spacer.current;
    if (!el) return;
    const at = Number(new URLSearchParams(window.location.search).get("at"));
    const deepLink = Number.isFinite(at) && at > 0 && at <= 1;
    let deepTimer = 0;
    if (deepLink) {
      // apply once layout has settled (and again after scroll restoration has run)
      const apply = () => {
        scrollToProgress(at, true);
        story.target = readScrollProgress();
        story.p = story.target;
      };
      apply();
      deepTimer = window.setTimeout(apply, 350);
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        story.target = self.progress;
      },
    });
    story.target = readScrollProgress();
    // restored scroll position or deep link: start there instead of replaying from 0
    if (story.target > 0.001) story.p = story.target;
    return () => {
      window.clearTimeout(deepTimer);
      st.kill();
      cancelIntro();
    };
  }, []);

  // opening walk-in once the scene is up (only from the very top)
  useEffect(() => {
    if (ready && window.scrollY < 4 && story.target < 0.001) startIntro();
  }, [ready]);

  const begin = () => {
    audio.tick();
    scrollToProgress(chapters[1].anchor);
  };

  return (
    <>
      <div className="stage" aria-hidden={false}>
        <Boundary onError={onCrash}>
          <ExperienceCanvas lite={lite} onReady={onReady} />
        </Boundary>
      </div>
      <main id="content">
        <h1 className="sr-only">
          {portfolio.name} — {portfolio.tagline}. An interactive 3D portfolio guided by a small robot. Scroll to explore, or use the chapter menu.
        </h1>
        <div ref={spacer} className="spacer" aria-hidden="true" />
        <SectionOverlay onBegin={begin} onReplay={replayJourney} />
        <DialogueBox />
        <JourneyProgress />
      </main>
      {!ready && <LoadingScreen onClassic={onClassic} />}
    </>
  );
}

/* ------------------------------------------------------------------ root */

export function Experience() {
  const env = useEnv();
  const [choice, setChoice] = useState<"cinematic" | "classic" | null>(null);
  const [crashed, setCrashed] = useState(false);

  const mode: "checking" | "cinematic" | "classic" = !env
    ? "checking"
    : crashed
      ? "classic"
      : (choice ?? (env.webgl && !env.reduced ? "cinematic" : "classic"));

  const reason = crashed ? "error" : choice === "classic" ? "chosen" : !env?.webgl ? "webgl" : env.reduced && choice === null ? "reduced" : "chosen";

  // classic mode scrolls like a normal page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [mode]);

  const toggle = () => {
    if (mode === "cinematic") setChoice("classic");
    else if (env?.webgl) {
      setCrashed(false);
      setChoice("cinematic");
    }
  };

  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <div id="top" />
      {mode !== "checking" && <Navigation mode={mode} onToggleMode={toggle} onReplay={replayJourney} />}
      {mode === "cinematic" && env && <Stage lite={env.lite} onClassic={() => setChoice("classic")} onCrash={() => setCrashed(true)} />}
      {mode === "classic" && <ClassicView reason={reason as "webgl" | "reduced" | "error" | "chosen"} />}
      {mode === "checking" && (
        <div className="loading" role="status">
          <p className="display">Loading…</p>
        </div>
      )}
      {mode === "classic" && !env?.webgl && null}
    </>
  );
}
