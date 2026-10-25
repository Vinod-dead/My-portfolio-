"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { portfolio } from "@/data/portfolio";
import { projects } from "@/data/projects";
import { N_PROJECTS, SPAN, projStart } from "@/lib/layout";
import { activePanel } from "@/lib/overlayPlan";
import { scrollToProgress, story, useStory } from "@/lib/store";
import { audio } from "@/lib/audio";
import { About, Approach, Education, Exploring, Groups, Interests, Learning, ProjectBlock, SKILLS } from "./Content";
import { ContactBlock, FinaleLinks } from "./Sections";

interface PanelDef {
  kicker: string;
  title: string;
  body: ReactNode;
  wide?: boolean;
}

function panelFor(id: string): PanelDef | null {
  switch (id) {
    case "about-0":
      return { kicker: "01 / About", title: "About Vinod", body: <About /> };
    case "about-1":
      return { kicker: "02 / Interests", title: "What he loves", body: <Interests /> };
    case "about-2":
      return { kicker: "03 / Approach", title: "Problem solving", body: <Approach /> };
    case "about-3":
      return { kicker: "04 / Learning", title: "Learning journey", body: <Learning /> };
    case "edu":
      return { kicker: "01 / Education", title: "Education", body: <Education /> };
    case "skills-prog":
      return { kicker: "02 / Programming", title: "Languages", body: <Groups groups={SKILLS.programming} /> };
    case "skills-ai":
      return { kicker: "03 / AI & ML", title: "AI / ML skills", body: <Groups groups={SKILLS.ai} /> };
    case "skills-tools":
      return { kicker: "04 / Build", title: "Frameworks & tools", body: <Groups groups={SKILLS.tools} compact /> };
    case "exploring":
      return { kicker: "05 / Exploring", title: "Exploring now", body: <Exploring /> };
    case "projects-intro":
      return {
        kicker: "Projects",
        title: "Three destinations",
        body: (
          <div className="stack">
            <p className="lead">Each floating world is one thing Vinod has been building or imagining.</p>
            <ol className="jump">
              {projects.map((p, i) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      audio.tick();
                      scrollToProgress(projStart(i) + 0.7 * SPAN);
                    }}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span> {p.name}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ),
      };
    case "lab":
      return { kicker: "Invention lab", title: "Skills & technologies", body: <Groups groups={SKILLS.all} compact />, wide: true };
    case "contact":
      return { kicker: "Contact", title: "Let's connect", body: <ContactBlock />, wide: true };
    default: {
      const m = /^project-(\d+)$/.exec(id);
      if (m) {
        const i = Number(m[1]);
        const p = projects[i];
        if (p && i < N_PROJECTS) return { kicker: `Project ${String(i + 1).padStart(2, "0")}`, title: p.name, body: <ProjectBlock project={p} />, wide: true };
      }
      return null;
    }
  }
}

function Hero({ onBegin }: { onBegin: () => void }) {
  return (
    <motion.div
      key="hero"
      className="hero"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.9, delay: 0.4 } }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.3 } }}
    >
      <p className="eyebrow">Interactive portfolio</p>
      <h1 className="display hero-title">
        {portfolio.name.split(" ").map((w) => (
          <span key={w}>{w.toUpperCase()}</span>
        ))}
      </h1>
      <p className="hero-role">{portfolio.tagline.toUpperCase()}</p>
      <p className="hero-support">&ldquo;{portfolio.heroSupport}&rdquo;</p>
      <button type="button" className="begin" onClick={onBegin}>
        <span>Begin the journey</span>
        <i aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export function SectionOverlay({ onBegin, onReplay }: { onBegin: () => void; onReplay: () => void }) {
  const id = useStory(activePanel);
  const def = id && id !== "hero" && id !== "finale" ? panelFor(id) : null;
  const reduced = story.reduced;

  return (
    <div className="stage-ui panels" aria-live="off">
      <AnimatePresence mode="wait">
        {id === "hero" && <Hero key="hero" onBegin={onBegin} />}
        {def && (
          <motion.section
            key={id}
            className={`panel-slot holo ${def.wide ? "holo-wide" : ""}`}
            aria-labelledby="panel-title"
            initial={reduced ? false : { opacity: 0, x: 40, rotateY: -10, filter: "blur(6px)" }}
            animate={{ opacity: 1, x: 0, rotateY: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] } }}
            exit={{ opacity: 0, x: 24, filter: "blur(4px)", transition: { duration: 0.22 } }}
          >
            <p className="kicker">{def.kicker}</p>
            <h2 id="panel-title" className="display panel-title">
              {def.title}
            </h2>
            {def.body}
          </motion.section>
        )}
        {id === "finale" && (
          <motion.section
            key="finale"
            className="finale"
            aria-labelledby="finale-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 1.1 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
          >
            <p className="eyebrow">Thank you for visiting</p>
            <h2 id="finale-title" className="display finale-name">
              {portfolio.name.toUpperCase()}
            </h2>
            <p className="finale-quote">&ldquo;{portfolio.finalQuote}&rdquo;</p>
            <FinaleLinks onReplay={onReplay} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
