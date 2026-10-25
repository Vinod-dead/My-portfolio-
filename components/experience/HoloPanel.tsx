"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { story } from "@/lib/store";
import { activePanel } from "@/lib/overlayPlan";
import { M, additive, labelTex } from "./helpers";

interface Props {
  id: string;
  position: [number, number, number];
  rotationY?: number;
  size?: [number, number];
  kicker: string;
  label: string;
  color?: string;
}

/**
 * A physical holographic panel in the world: projector, light beam, glass
 * face with a heading, and a frame that brightens while its text is on screen.
 * The readable copy itself lives in the DOM overlay (selectable, accessible).
 */
export function HoloPanel({ id, position, rotationY = 0, size = [2.6, 1.6], kicker, label, color = "#4da3ff" }: Props) {
  const group = useRef<THREE.Group>(null);
  const a = useRef(0);
  const [w, h] = size;
  const tex = useMemo(() => labelTex(kicker, label, color), [kicker, label, color]);
  const face = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.4, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }),
    [tex],
  );
  const beam = useMemo(() => additive(color, 0.05), [color]);
  const frameMat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, toneMapped: false }), [color]);
  const phase = useMemo(() => position[0] * 0.7, [position]);

  useFrame((state, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const on = activePanel(story.p) === id ? 1 : 0;
    a.current = THREE.MathUtils.damp(a.current, on, 5, dt);
    const t = state.clock.elapsedTime;
    const s = 0.94 + 0.08 * a.current;
    g.scale.setScalar(s);
    g.position.y = story.reduced ? 0 : Math.sin(t * 0.9 + phase) * 0.05;
    face.opacity = 0.38 + 0.6 * a.current;
    frameMat.opacity = 0.35 + 0.65 * a.current;
    beam.opacity = 0.04 + 0.1 * a.current;
  });

  const bar = 0.03;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* projector base + beam, fixed to the ground */}
      <mesh position={[0, -position[1] + 0.03, 0]} material={M.dark}>
        <cylinderGeometry args={[0.28, 0.34, 0.06, 20]} />
      </mesh>
      <mesh position={[0, -position[1] + 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.glowBlue}>
        <ringGeometry args={[0.16, 0.2, 24]} />
      </mesh>
      <mesh position={[0, -position[1] / 2 + 0.05, 0]} material={beam}>
        <cylinderGeometry args={[w * 0.42, 0.14, position[1] - 0.1 - h / 2, 24, 1, true]} />
      </mesh>
      <group ref={group}>
        <mesh material={face}>
          <planeGeometry args={[w, h]} />
        </mesh>
        {/* frame */}
        <mesh position={[0, h / 2, 0.005]} material={frameMat}>
          <boxGeometry args={[w + bar, bar, 0.02]} />
        </mesh>
        <mesh position={[0, -h / 2, 0.005]} material={frameMat}>
          <boxGeometry args={[w + bar, bar, 0.02]} />
        </mesh>
        <mesh position={[-w / 2, 0, 0.005]} material={frameMat}>
          <boxGeometry args={[bar, h, 0.02]} />
        </mesh>
        <mesh position={[w / 2, 0, 0.005]} material={frameMat}>
          <boxGeometry args={[bar, h, 0.02]} />
        </mesh>
      </group>
    </group>
  );
}
