"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { FINALE_X } from "@/lib/layout";
import { frame } from "@/lib/timeline";
import { story } from "@/lib/store";
import { M, additive, canvasTexture, useGate } from "@/components/experience/helpers";

const rangoli = () =>
  canvasTexture("rangoli", 1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#0d1428";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    const ring = (n: number, r: number, len: number, color: string, wd: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = wd;
      for (let i = 0; i < n; i++) {
        ctx.save();
        ctx.rotate((i / n) * Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.quadraticCurveTo(r + len / 2, len * 0.28, r + len, 0);
        ctx.quadraticCurveTo(r + len / 2, -len * 0.28, r, 0);
        ctx.stroke();
        ctx.restore();
      }
    };
    ctx.globalAlpha = 0.9;
    ring(16, 60, 130, "#ffc58a", 4);
    ring(16, 60, 90, "#4da3ff", 3);
    ring(24, 210, 120, "#ffd9a8", 3);
    ring(32, 330, 90, "#4da3ff", 3);
    ctx.strokeStyle = "#ffc58a";
    for (const r of [60, 200, 330, 470]) {
      ctx.lineWidth = r === 470 ? 6 : 3;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffe3b8";
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();
  });

/** Scene 8 world: the calm circular platform with warm light and small diyas. */
export function FinaleScene() {
  const gate = useGate(FINALE_X - 6, FINALE_X + 6, 60);
  const flames = useRef<THREE.Group>(null);
  const warmBeam = useRef<THREE.Mesh>(null);
  const beamMat = useMemo(() => additive("#ffc58a", 0), []);
  const halo = useMemo(() => additive("#ffb36b", 0), []);
  const diyas = useMemo(() => Array.from({ length: 9 }, (_, i) => (i / 9) * Math.PI * 2 + 0.3), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const w = frame.warmth;
    beamMat.opacity = w * 0.12;
    halo.opacity = w * 0.35;
    if (warmBeam.current) warmBeam.current.visible = w > 0.01;
    flames.current?.children.forEach((c, i) => {
      const f = 0.85 + 0.15 * Math.sin(t * 7 + i * 2.1) * (story.reduced ? 0 : 1);
      c.scale.set(1, 1.4 * f, 1);
    });
  });

  return (
    <group ref={gate} position={[FINALE_X, 0, 0]}>
      <mesh position={[0, -0.18, 0]} material={M.floor}>
        <cylinderGeometry args={[4.4, 4.6, 0.36, 72]} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.25, 72]} />
        <meshStandardMaterial map={rangoli()} roughness={0.5} metalness={0.3} emissive="#ffb36b" emissiveMap={rangoli()} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.glowWarm}>
        <ringGeometry args={[4.28, 4.42, 96]} />
      </mesh>

      <group ref={flames}>
        {diyas.map((a, i) => (
          <group key={i} position={[Math.cos(a) * 3.55, 0, Math.sin(a) * 3.55]}>
            <mesh position={[0, 0.05, 0]} material={M.metal}>
              <sphereGeometry args={[0.15, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0.17, 0]} material={M.glowWarm}>
              <sphereGeometry args={[0.065, 12, 10]} />
            </mesh>
          </group>
        ))}
      </group>

      <mesh ref={warmBeam} position={[0, 5.5, 0]} material={beamMat}>
        <cylinderGeometry args={[0.6, 3.6, 11, 40, 1, true]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={halo}>
        <circleGeometry args={[3.4, 48]} />
      </mesh>

      <group>
        <Sparkles count={story.lite ? 40 : 100} scale={[9, 5, 9]} position={[0, 2.4, 0]} size={3} speed={0.25} color="#ffd9a0" opacity={0.85} />
      </group>
    </group>
  );
}
