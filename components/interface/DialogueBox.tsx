"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { dialogueAt } from "@/lib/overlayPlan";
import { story, useStory } from "@/lib/store";
import { audio } from "@/lib/audio";

/** Types the line out; remounted (via `key`) for every new line. */
function Typed({ text }: { text: string }) {
  const [n, setN] = useState(story.reduced ? text.length : 0);
  useEffect(() => {
    if (story.reduced) return;
    const id = window.setInterval(() => setN((v) => (v >= text.length ? v : v + 2)), 22);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <span aria-hidden="true">
      {text.slice(0, n)}
      <i className="caret" data-done={n >= text.length} />
    </span>
  );
}

/**
 * Robot dialogue. Captions are always on; the full line is also exposed in a
 * polite live region for screen readers. Spoken voice is optional (off by default).
 */
export function DialogueBox() {
  const text = useStory(dialogueAt);

  useEffect(() => {
    if (text && audio.prefs.voice) audio.speak(text);
  }, [text]);

  return (
    <div className="stage-ui dialogue-wrap">
      <div className="sr-only" role="status" aria-live="polite">
        {text && `Robot guide says: ${text}`}
      </div>
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={text}
            className="dialogue"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.18 } }}
          >
            <span className="dialogue-avatar" aria-hidden="true">
              <i />
              <i />
            </span>
            <div>
              <p className="dialogue-name">Robot guide</p>
              <p className="dialogue-text">
                <Typed text={text} />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
