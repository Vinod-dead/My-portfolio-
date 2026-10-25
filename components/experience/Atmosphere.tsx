"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { story } from "@/lib/store";
import { seeded, additive, radialTex } from "./helpers";

/** [p, background colour] — lerped smoothly through the story. */
const PALETTE: [number, string][] = [
  [0, "#060a15"],
  [0.1, "#08101f"],
  [0.24, "#0a1024"],
  [0.3, "#0c1028"],
  [0.4, "#0d1a36"],
  [0.5, "#0e2142"],
  [0.72, "#0c1a35"],
  [0.745, "#070b14"],
  [0.84, "#0a1226"],
  [0.87, "#16264a"],
  [0.94, "#1b2a52"],
  [1, "#2a2446"],
];
const PAL = PALETTE.map(([p, c]) => [p, new THREE.Color(c)] as const);

function paletteInto(p: number, out: THREE.Color) {
  let i = 0;
  while (i < PAL.length - 2 && p >= PAL[i + 1][0]) i++;
  const [pa, ca] = PAL[i];
  const [pb, cb] = PAL[i + 1];
  const t = THREE.MathUtils.clamp((p - pa) / (pb - pa || 1), 0, 1);
  out.copy(ca).lerp(cb, t * t * (3 - 2 * t));
}

const POINTS_COUNT = 2600;

export function Atmosphere({ lite }: { lite: boolean }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const warm = useRef<THREE.PointLight>(null);
  const fog = useRef<THREE.Fog>(null);
  const particles = useRef<THREE.Points>(null);
  const planet = useRef<THREE.Group>(null);
  const bg = useMemo(() => new THREE.Color(), []);

  const positions = useMemo(() => {
    const n = lite ? Math.floor(POINTS_COUNT / 2.5) : POINTS_COUNT;
    const rnd = seeded(42);
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = -18 + rnd() * 270;
      a[i * 3 + 1] = -2 + rnd() * 20;
      a[i * 3 + 2] = -16 + rnd() * 28;
    }
    return a;
  }, [lite]);

  const dust = useMemo(() => new THREE.PointsMaterial({ size: 0.055, color: "#a9d0ff", transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true, map: radialTex(), alphaTest: 0.01 }), []);
  const halo = useMemo(() => additive("#5aa8ff", 0.18), []);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const p = story.p;

    paletteInto(p, bg);
    (state.scene.background as THREE.Color).copy(bg);
    if (fog.current) {
      fog.current.color.copy(bg);
      // tighter fog in the interior lab, wider outdoors for depth
      const inside = p > 0.745 && p < 0.86;
      fog.current.near = THREE.MathUtils.damp(fog.current.near, inside ? 22 : 18, 2, dt);
      fog.current.far = THREE.MathUtils.damp(fog.current.far, inside ? 60 : 85, 2, dt);
    }

    if (key.current) {
      key.current.position.set(frame.x + 4, 8, frame.z + 5);
      key.current.target.position.set(frame.x, 0.8, frame.z);
      key.current.target.updateMatrixWorld();
    }
    if (rim.current) rim.current.position.set(frame.x - 1.6, frame.y + 1.8, frame.z - 1.8);
    if (warm.current) {
      warm.current.position.set(frame.x + 1.2, frame.y + 2.6, frame.z + 2.2);
      warm.current.intensity = frame.warmth * 26;
    }

    if (particles.current && !story.reduced) {
      particles.current.position.y = Math.sin(t * 0.12) * 0.35;
      particles.current.rotation.y = Math.sin(t * 0.03) * 0.01;
    }
    // far planet moves slower than the camera for parallax
    if (planet.current) planet.current.position.set(state.camera.position.x * 0.82 + 38, 24, -95);
  });

  return (
    <>
      <color attach="background" args={["#060a15"]} />
      <fog ref={fog} attach="fog" args={["#060a15", 18, 85]} />

      <ambientLight intensity={0.28} />
      <hemisphereLight args={["#bcd6ff", "#0a1226", 0.6]} />
      <directionalLight ref={key} intensity={1.9} color="#ffffff" />
      <pointLight ref={rim} intensity={9} distance={9} color="#4da3ff" decay={2} />
      <pointLight ref={warm} intensity={0} distance={14} color="#ffb36b" decay={2} />

      {/* reflections for the glossy shell, built locally (no network assets) */}
      <Environment resolution={lite ? 128 : 256} frames={1} environmentIntensity={0.9}>
        <Lightformer form="rect" intensity={2.4} position={[0, 7, 2]} rotation-x={Math.PI / 2} scale={[14, 10, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-6, 2, 4]} rotation-y={Math.PI / 2} scale={[8, 5, 1]} color="#6fb4ff" />
        <Lightformer form="rect" intensity={1.2} position={[6, 3, -5]} rotation-y={-Math.PI / 2} scale={[8, 5, 1]} color="#9fc8ff" />
        <Lightformer form="ring" intensity={1.4} position={[0, 2, -8]} scale={4} color="#cfe8ff" />
      </Environment>

      <points ref={particles} frustumCulled={false} material={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
      </points>

      {/* distant planet + ring for depth */}
      <group ref={planet}>
        <mesh>
          <sphereGeometry args={[11, 48, 32]} />
          <meshStandardMaterial color="#10224a" roughness={0.9} emissive="#0a1c44" emissiveIntensity={0.6} fog={false} />
        </mesh>
        <mesh scale={1.5} material={halo}>
          <sphereGeometry args={[11, 32, 24]} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0, 0.3]}>
          <torusGeometry args={[17, 0.18, 8, 120]} />
          <meshBasicMaterial color="#6fa8ff" transparent opacity={0.35} fog={false} />
        </mesh>
      </group>
    </>
  );
}
