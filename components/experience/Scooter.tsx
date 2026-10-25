"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { LAUNCH_X } from "@/lib/layout";
import { M, additive, radialTex, useGate } from "./helpers";

/**
 * Futuristic mini scooter built from separate meshes. Faces +Z in local space.
 * The seat height / grip position match the robot's seated pose (lib/robotPose.ts).
 */
export function Scooter() {
  const gate = useGate(10, LAUNCH_X + 6, 50);
  const root = useRef<THREE.Group>(null);
  const fork = useRef<THREE.Group>(null);
  const wheelF = useRef<THREE.Group>(null);
  const wheelR = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const lastYaw = useRef(frame.syaw);
  const steer = useRef(0);

  const mats = useMemo(
    () => ({
      glow: additive("#4da3ff", 0.55),
      beam: additive("#bfe0ff", 0.07),
      shadow: new THREE.MeshBasicMaterial({ map: radialTex(), color: "#000000", transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
      tire: new THREE.MeshStandardMaterial({ color: "#0a0e18", roughness: 0.8 }),
    }),
    [],
  );

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = root.current;
    if (!g) return;
    g.position.set(frame.sx, 0, frame.sz);
    g.rotation.y = frame.syaw;
    const dy = frame.syaw - lastYaw.current;
    lastYaw.current = frame.syaw;
    const want = THREE.MathUtils.clamp((dy / Math.max(dt, 0.001)) * 0.35, -0.35, 0.35);
    steer.current = THREE.MathUtils.damp(steer.current, want, 8, dt);
    if (fork.current) fork.current.rotation.y = steer.current;
    if (wheelF.current) wheelF.current.rotation.x = frame.swheel;
    if (wheelR.current) wheelR.current.rotation.x = frame.swheel;
    if (shadow.current) {
      shadow.current.position.set(frame.sx, 0.014, frame.sz);
      shadow.current.rotation.set(-Math.PI / 2, 0, frame.syaw);
    }
  });

  const wheel = (ref: RefObject<THREE.Group | null>, z: number) => (
    <group position={[0, 0.15, z]}>
      <group ref={ref}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={mats.tire}>
          <cylinderGeometry args={[0.15, 0.15, 0.09, 32]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.blue}>
          <cylinderGeometry args={[0.095, 0.095, 0.094, 24]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={M.white}>
          <cylinderGeometry args={[0.05, 0.05, 0.098, 16]} />
        </mesh>
        {/* spokes so the spin is visible */}
        <mesh position={[0.048, 0, 0]} material={M.glowPale}>
          <boxGeometry args={[0.004, 0.17, 0.016]} />
        </mesh>
      </group>
    </group>
  );

  return (
    <group ref={gate}>
      <group ref={root}>
        {/* deck */}
        <RoundedBox args={[0.36, 0.07, 0.78]} radius={0.03} smoothness={3} position={[0, 0.17, 0]} material={M.white} />
        <mesh position={[0, 0.208, 0]} material={M.blue}>
          <boxGeometry args={[0.2, 0.006, 0.62]} />
        </mesh>
        {/* under-glow */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.glow}>
          <planeGeometry args={[0.46, 0.9]} />
        </mesh>
        {/* seat on a post */}
        <mesh position={[0, 0.27, -0.12]} material={M.metal}>
          <cylinderGeometry args={[0.028, 0.034, 0.16, 12]} />
        </mesh>
        <RoundedBox args={[0.3, 0.07, 0.34]} radius={0.03} smoothness={3} position={[0, 0.365, -0.12]} material={M.dark} />
        <mesh position={[0, 0.403, -0.12]} material={M.blue}>
          <boxGeometry args={[0.26, 0.004, 0.02]} />
        </mesh>
        {/* rear fender + tail light */}
        <RoundedBox args={[0.14, 0.03, 0.3]} radius={0.012} smoothness={2} position={[0, 0.33, -0.4]} material={M.white} />
        <mesh position={[0, 0.2, -0.42]} material={M.glowBlue}>
          <boxGeometry args={[0.16, 0.025, 0.012]} />
        </mesh>
        {wheel(wheelR, -0.4)}

        {/* steering assembly pivots at the front axle */}
        <group ref={fork} position={[0, 0, 0.4]}>
          {wheel(wheelF, 0)}
          <RoundedBox args={[0.13, 0.03, 0.26]} radius={0.012} smoothness={2} position={[0, 0.33, 0.02]} material={M.white} />
          {/* column from front axle up and slightly back to the handlebar */}
          <mesh position={[0, 0.475, -0.075]} rotation={[-0.227, 0, 0]} material={M.metal}>
            <cylinderGeometry args={[0.02, 0.024, 0.667, 12]} />
          </mesh>
          {/* handlebar and grips at the robot's reach (x = ±0.27) */}
          <mesh position={[0, 0.8, -0.15]} rotation={[0, 0, Math.PI / 2]} material={M.metal}>
            <cylinderGeometry args={[0.016, 0.016, 0.62, 12]} />
          </mesh>
          {([1, -1] as const).map((s) => (
            <mesh key={s} position={[s * 0.27, 0.8, -0.15]} rotation={[0, 0, Math.PI / 2]} material={M.dark}>
              <cylinderGeometry args={[0.026, 0.026, 0.1, 14]} />
            </mesh>
          ))}
          {/* head light */}
          <mesh position={[0, 0.66, -0.02]} material={M.glowPale}>
            <sphereGeometry args={[0.04, 16, 12]} />
          </mesh>
          <mesh position={[0, 0.66, 1.1]} rotation={[-Math.PI / 2, 0, 0]} material={mats.beam}>
            <coneGeometry args={[0.55, 2.2, 24, 1, true]} />
          </mesh>
        </group>
      </group>
      <mesh ref={shadow} material={mats.shadow}>
        <planeGeometry args={[1.0, 1.7]} />
      </mesh>
    </group>
  );
}
