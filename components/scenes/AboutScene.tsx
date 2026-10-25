"use client";

import { HoloPanel } from "@/components/experience/HoloPanel";

/** Scene 2: floating information panels placed along the walking route. */
export function AboutScene() {
  const items = [
    { id: "about-0", x: 4.8, kicker: "01 / ABOUT", label: "About Vinod" },
    { id: "about-1", x: 8.8, kicker: "02 / INTERESTS", label: "What he loves" },
    { id: "about-2", x: 12.4, kicker: "03 / APPROACH", label: "Problem solving" },
    { id: "about-3", x: 15.8, kicker: "04 / LEARNING", label: "Learning journey" },
  ];
  return (
    <group>
      {items.map((it, i) => (
        <HoloPanel
          key={it.id}
          id={it.id}
          position={[it.x, 2.1 + (i % 2) * 0.25, -3.3]}
          rotationY={0.32}
          kicker={it.kicker}
          label={it.label}
        />
      ))}
    </group>
  );
}
