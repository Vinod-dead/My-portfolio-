"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DOOR_X, FINALE_X, TERMINAL_X } from "@/lib/layout";
import { story } from "@/lib/store";
import { M, additive, seeded, terminalTex, useGate } from "@/components/experience/helpers";

const PATH_X0 = DOOR_X + 0.5;
const PATH_X1 = FINALE_X + 4;

/** Scene 7 world: a calm landscape beyond the lab doors with a glowing communication terminal. */
export function ContactScene() {
  const gate = useGate(DOOR_X, FINALE_X + 10, 70);
  const ripples = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const lanterns = useRef<THREE.Group>(null);

  const stars = useMemo(() => {
    const rnd = seeded(5);
    const n = story.lite ? 300 : 800;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(0.15 + rnd() * 0.85);
      const r = 220;
      a[i * 3] = FINALE_X - 10 + r * Math.sin(ph) * Math.cos(th);
      a[i * 3 + 1] = 12 + r * Math.cos(ph) * 0.7;
      a[i * 3 + 2] = -r * Math.abs(Math.sin(ph) * Math.sin(th)) - 20;
    }
    return a;
  }, []);

  const hills = useMemo(() => {
    const rnd = seeded(23);
    return Array.from({ length: 16 }, () => ({
      x: DOOR_X - 20 + rnd() * 110,
      z: -(24 + rnd() * 36),
      r: 6 + rnd() * 10,
      h: 0.25 + rnd() * 0.25,
    }));
  }, []);
  const peaks = useMemo(() => {
    const rnd = seeded(61);
    return Array.from({ length: 10 }, (_, i) => ({
      x: DOOR_X - 30 + i * 14 + rnd() * 6,
      z: -(85 + rnd() * 25),
      h: 26 + rnd() * 26,
      r: 12 + rnd() * 10,
    }));
  }, []);
  const lantern = useMemo(() => {
    const rnd = seeded(8);
    return Array.from({ length: 14 }, (_, i) => ({
      x: DOOR_X + 4 + i * 2.6 + rnd(),
      y: 1.6 + rnd() * 2.2,
      z: (i % 2 ? 1 : -1) * (2.6 + rnd() * 2.5),
      ph: rnd() * 6,
    }));
  }, []);
  const bollards = useMemo(() => Array.from({ length: 6 }, (_, i) => DOOR_X + 5 + i * 5.6), []);
  const water = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#07142c", roughness: 0.12, metalness: 0.9 }),
    [],
  );
  const glow = useMemo(() => additive("#4da3ff", 0.35), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const calm = story.reduced ? 0 : 1;
    ripples.current?.children.forEach((c, i) => {
      const u = (t * 0.45 * calm + i / 3) % 1;
      c.scale.setScalar(0.4 + u * 1.7);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.45;
    });
    if (screenMat.current) screenMat.current.opacity = 0.9 + 0.1 * Math.sin(t * 3);
    lanterns.current?.children.forEach((c, i) => {
      c.position.y = lantern[i].y + Math.sin(t * 0.6 + lantern[i].ph) * 0.2 * calm;
    });
  });

  const len = PATH_X1 - PATH_X0;
  return (
    <group ref={gate}>
      {/* causeway */}
      <mesh position={[PATH_X0 + len / 2, -0.15, 0]} material={M.floor}>
        <boxGeometry args={[len, 0.3, 4.4]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[PATH_X0 + len / 2, 0.02, s * 2.1]} material={M.glowBlue}>
          <boxGeometry args={[len, 0.03, 0.06]} />
        </mesh>
      ))}
      {bollards.map((x) =>
        [-1, 1].map((s) => (
          <group key={`${x}-${s}`} position={[x, 0, s * 2.45]}>
            <mesh position={[0, 0.35, 0]} material={M.metal}>
              <cylinderGeometry args={[0.04, 0.06, 0.7, 10]} />
            </mesh>
            <mesh position={[0, 0.78, 0]} material={M.glowPale}>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
          </group>
        )),
      )}

      {/* calm water reflecting the sky and the lights */}
      <mesh position={[DOOR_X + 40, -0.9, -10]} rotation={[-Math.PI / 2, 0, 0]} material={water}>
        <planeGeometry args={[220, 150]} />
      </mesh>
      {hills.map((h, i) => (
        <mesh key={i} position={[h.x, -0.9, h.z]} scale={[h.r * 1.8, h.r * h.h * 2, h.r]} material={M.rock}>
          <sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.h / 2 - 1, p.z]}>
          <coneGeometry args={[p.r, p.h, 6]} />
          <meshStandardMaterial color="#0d1b38" roughness={1} flatShading />
        </mesh>
      ))}

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#dbe9ff" size={1.3} sizeAttenuation={false} fog={false} transparent opacity={0.8} />
      </points>

      <group ref={lanterns}>
        {lantern.map((l, i) => (
          <mesh key={i} position={[l.x, l.y, l.z]} material={M.glowWarm}>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
        ))}
      </group>

      {/* communication terminal */}
      <group position={[TERMINAL_X, 0, -1.5]}>
        <mesh position={[0, 0.45, 0]} material={M.dark}>
          <cylinderGeometry args={[0.45, 0.55, 0.9, 28]} />
        </mesh>
        <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.glowBlue}>
          <ringGeometry args={[0.38, 0.45, 40]} />
        </mesh>
        <mesh position={[0, 1.15, -0.05]} material={M.metal}>
          <cylinderGeometry args={[0.05, 0.07, 0.5, 12]} />
        </mesh>
        <group position={[0, 1.95, 0]} rotation={[-0.28, 0, 0]}>
          <mesh material={M.dark}>
            <boxGeometry args={[2.0, 1.3, 0.08]} />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[1.88, 1.18]} />
            <meshBasicMaterial ref={screenMat} map={terminalTex()} transparent toneMapped={false} />
          </mesh>
        </group>
        <mesh position={[0, 1.9, 0.2]} material={glow}>
          <planeGeometry args={[3.0, 2.2]} />
        </mesh>
        <group ref={ripples} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh key={i}>
              <ringGeometry args={[0.95, 1.0, 64]} />
              <meshBasicMaterial color="#4da3ff" transparent opacity={0.4} toneMapped={false} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
