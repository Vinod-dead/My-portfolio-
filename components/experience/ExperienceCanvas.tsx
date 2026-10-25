"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { StoryDriver } from "./StoryDriver";
import { CameraRig } from "./CameraRig";
import { Atmosphere } from "./Atmosphere";
import { RobotCharacter } from "./RobotCharacter";
import { BlobShadow } from "./BlobShadow";
import { Scooter } from "./Scooter";
import { IntroScene } from "@/components/scenes/IntroScene";
import { AboutScene } from "@/components/scenes/AboutScene";
import { ScooterScene } from "@/components/scenes/ScooterScene";
import { FlightScene } from "@/components/scenes/FlightScene";
import { ProjectsScene } from "@/components/scenes/ProjectsScene";
import { LabScene } from "@/components/scenes/LabScene";
import { ContactScene } from "@/components/scenes/ContactScene";
import { FinaleScene } from "@/components/scenes/FinaleScene";

/**
 * The single fixed WebGL canvas behind the page. Rendering pauses while the tab
 * is hidden, and pixel ratio is capped (lower on low-powered devices).
 */
export default function ExperienceCanvas({ lite, onReady }: { lite: boolean; onReady: () => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const on = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  return (
    <Canvas
      className="stage-canvas"
      frameloop={visible ? "always" : "never"}
      dpr={lite ? [1, 1] : [1, 1.75]}
      camera={{ fov: 42, near: 0.1, far: 520, position: [0, 2.4, 10.5] }}
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <StoryDriver onReady={onReady} />
      <CameraRig />
      <Atmosphere lite={lite} />
      <RobotCharacter />
      <BlobShadow />
      <Scooter />
      <IntroScene />
      <AboutScene />
      <ScooterScene />
      <FlightScene />
      <ProjectsScene />
      <LabScene />
      <ContactScene />
      <FinaleScene />
    </Canvas>
  );
}
