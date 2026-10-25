"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { DOOR_X, LAB_X } from "@/lib/layout";
import { frame } from "@/lib/timeline";
import { story } from "@/lib/store";
import { M, additive, codeTex, gridTex, holoScreenTex, seeded, useGate } from "@/components/experience/helpers";

function Gear({ r = 0.6, teeth = 10, speed = 0.4, position, rotation = [0, 0, 0] as [number, number, number] }: { r?: number; teeth?: number; speed?: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current && !story.reduced) g.current.rotation.z += Math.min(dt, 0.05) * speed;
  });
  return (
    <group position={position} rotation={rotation}>
      <group ref={g}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.metal}>
          <cylinderGeometry args={[r, r, 0.14, 24]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.blue}>
          <cylinderGeometry args={[r * 0.35, r * 0.35, 0.18, 16]} />
        </mesh>
        {Array.from({ length: teeth }, (_, i) => {
          const a = (i / teeth) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * (r + 0.07), Math.sin(a) * (r + 0.07), 0]} rotation={[0, 0, a]} material={M.metal}>
              <boxGeometry args={[0.16, 0.13, 0.14]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Scene 6 world: the invention lab (local origin = LAB_X). Open toward the camera like a cutaway set. */
export function LabScene() {
  const gate = useGate(LAB_X - 12, DOOR_X + 6, 40);
  const doorL = useRef<THREE.Mesh>(null);
  const doorR = useRef<THREE.Mesh>(null);
  const screen = useRef<THREE.Group>(null);
  const holo = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const arm = useRef<THREE.Group>(null);
  const floatObjs = useRef<THREE.Group>(null);
  const spill = useRef<THREE.Mesh>(null);
  const bench = useRef<THREE.PointLight>(null);

  const mats = useMemo(
    () => ({
      screen: new THREE.MeshBasicMaterial({ map: holoScreenTex(), transparent: true, opacity: 0.1, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }),
      frame: new THREE.MeshBasicMaterial({ color: "#4da3ff", transparent: true, opacity: 0.3, toneMapped: false }),
      beam: additive("#8cc4ff", 0.08),
      spill: additive("#cfe8ff", 0),
      wire: new THREE.MeshBasicMaterial({ color: "#6fb4ff", wireframe: true, transparent: true, opacity: 0.55 }),
      hologram: new THREE.MeshBasicMaterial({ color: "#8cc4ff", transparent: true, opacity: 0.5, toneMapped: false }),
      node: new THREE.MeshBasicMaterial({ color: "#e8f4ff", toneMapped: false }),
      lineMat: new THREE.LineBasicMaterial({ color: "#6fb4ff", transparent: true, opacity: 0.55 }),
      floor: new THREE.MeshStandardMaterial({ map: gridTex("#4da3ff", 8, [9, 7]), color: "#9fb4d8", roughness: 0.45, metalness: 0.6, emissive: "#102a5a", emissiveMap: gridTex("#4da3ff", 8, [9, 7]), emissiveIntensity: 0.5 }),
    }),
    [],
  );

  // abstract AI-network hologram (decorative)
  const net = useMemo(() => {
    const rnd = seeded(17);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 30; i++) {
      const v = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(0.3 + rnd() * 0.5);
      pts.push(v);
    }
    const seg: number[] = [];
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        if (pts[i].distanceTo(pts[j]) < 0.55) seg.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
    return { pts, seg: new Float32Array(seg) };
  }, []);

  const code = useMemo(
    () => [
      codeTex(["def plan(task):", "  steps = split(task)", "  return run(steps)"]),
      codeTex(["agents.connect()", "graph.add_node(x)", "flow.run()"]),
      codeTex(["while learning:", "  build(idea)", "  ship(it)"]),
      codeTex(["model.fit(data)", "score = eval(model)", "iterate()"]),
    ],
    [],
  );

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const calm = story.reduced ? 0 : 1;
    const a = frame.labActive;
    const open = frame.doorOpen;
    if (doorL.current) doorL.current.position.z = 1.05 + open * 1.95;
    if (doorR.current) doorR.current.position.z = -1.05 - open * 1.95;
    mats.spill.opacity = open * 0.4;
    if (spill.current) spill.current.visible = open > 0.01;

    mats.screen.opacity = 0.08 + 0.92 * a;
    mats.frame.opacity = 0.25 + 0.75 * a;
    if (screen.current) {
      const s = 0.9 + 0.1 * a;
      screen.current.scale.set(s, s, 1);
      screen.current.position.y = 3.15 + Math.sin(t * 0.8) * 0.05 * calm;
    }
    if (holo.current) {
      holo.current.rotation.y += dt * (0.25 + a * 0.6) * calm;
      holo.current.scale.setScalar(0.85 + 0.35 * a);
    }
    mats.hologram.opacity = 0.25 + 0.4 * a;
    mats.lineMat.opacity = 0.35 + 0.5 * a;
    if (core.current) {
      core.current.rotation.x += dt * 0.8 * calm;
      core.current.rotation.y += dt * 1.1 * calm;
      core.current.position.y = 1.5 + Math.sin(t * 1.6) * 0.04 * calm;
    }
    if (bench.current) bench.current.intensity = 4 + a * 16;
    if (arm.current) arm.current.rotation.y = Math.sin(t * 0.5) * 0.5 * calm;
    floatObjs.current?.children.forEach((c, i) => {
      c.rotation.y += dt * 0.3 * calm * (i % 2 ? 1 : -1);
      c.position.y += Math.sin(t * 0.7 + i * 1.7) * 0.0025 * calm;
    });
  });

  const edge = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);

  return (
    <group ref={gate} position={[LAB_X, 0, 0]}>
      {/* floor */}
      <mesh position={[-0.5, -0.15, 0]} material={M.floor}>
        <boxGeometry args={[19.5, 0.3, 14.5]} />
      </mesh>
      <mesh position={[-0.5, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.floor}>
        <planeGeometry args={[19, 14]} />
      </mesh>
      <mesh position={[0.3, 0.012, -0.6]} rotation={[-Math.PI / 2, 0, 0]} material={M.glowBlue}>
        <ringGeometry args={[2.3, 2.38, 64]} />
      </mesh>

      {/* back wall with decorative holo displays */}
      <mesh position={[-0.5, 3.5, -7.1]} material={M.building}>
        <boxGeometry args={[19.5, 7, 0.3]} />
      </mesh>
      {[1.2, 5.9].map((y) => (
        <mesh key={y} position={[-0.5, y, -6.93]} material={M.glowBlue}>
          <boxGeometry args={[19, 0.04, 0.03]} />
        </mesh>
      ))}
      {[-6.2, 0, 6.2].map((x, i) => (
        <mesh key={x} position={[x - 0.5, 3.4, -6.9]}>
          <planeGeometry args={[2.8, 1.4]} />
          <meshBasicMaterial map={code[i]} transparent opacity={0.9} toneMapped={false} />
        </mesh>
      ))}

      {/* entrance lintel and piers (open in the middle for the flight in) */}
      <mesh position={[-10.2, 6.2, 0]} material={M.building}>
        <boxGeometry args={[0.4, 1.6, 14.5]} />
      </mesh>
      {[-5.2, 5.2].map((z) => (
        <mesh key={z} position={[-10.2, 3.5, z]} material={M.building}>
          <boxGeometry args={[0.4, 7, 4.1]} />
        </mesh>
      ))}
      <mesh position={[-10.0, 5.35, 0]} material={M.glowBlue}>
        <boxGeometry args={[0.04, 0.05, 10.2]} />
      </mesh>

      {/* ceiling trusses */}
      {[-8, -4, 0, 4].map((x) => (
        <group key={x}>
          <mesh position={[x, 6.85, 0]} material={M.dark}>
            <boxGeometry args={[0.3, 0.3, 14.5]} />
          </mesh>
          <mesh position={[x, 6.68, 0]} material={M.glowPale}>
            <boxGeometry args={[0.06, 0.03, 12]} />
          </mesh>
        </group>
      ))}

      {/* exit doors toward the landscape */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[8.55, 3.5, s * 4.55]} material={M.building}>
          <boxGeometry args={[0.4, 7, 4.9]} />
        </mesh>
      ))}
      <mesh position={[8.55, 5.4, 0]} material={M.building}>
        <boxGeometry args={[0.4, 3.2, 4.2]} />
      </mesh>
      <mesh ref={doorL} position={[8.35, 1.9, 1.05]} material={M.white}>
        <boxGeometry args={[0.2, 3.8, 2.1]} />
      </mesh>
      <mesh ref={doorR} position={[8.35, 1.9, -1.05]} material={M.white}>
        <boxGeometry args={[0.2, 3.8, 2.1]} />
      </mesh>
      {[-2.15, 2.15].map((z) => (
        <mesh key={z} position={[8.3, 1.9, z]} material={M.glowBlue}>
          <boxGeometry args={[0.06, 3.8, 0.05]} />
        </mesh>
      ))}
      <mesh ref={spill} position={[8.9, 1.9, 0]} rotation={[0, Math.PI / 2, 0]} material={mats.spill}>
        <planeGeometry args={[4.2, 3.8]} />
      </mesh>

      {/* central workbench */}
      <group position={[0.3, 0, -0.6]}>
        <RoundedBox args={[1.5, 0.12, 3.0]} radius={0.04} smoothness={3} position={[0, 1.0, 0]} material={M.white} />
        <mesh position={[0, 1.065, 0]} material={M.glowBlue}>
          <boxGeometry args={[1.4, 0.012, 2.9]} />
        </mesh>
        {[
          [-0.6, -1.3],
          [0.6, -1.3],
          [-0.6, 1.3],
          [0.6, 1.3],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.5, z]} material={M.metal}>
            <boxGeometry args={[0.1, 1, 0.1]} />
          </mesh>
        ))}
        <mesh position={[0, 0.5, 0]} material={M.dark}>
          <boxGeometry args={[1.1, 0.7, 2.4]} />
        </mesh>
        {/* hologram projector + AI network */}
        <mesh position={[0, 1.09, -0.5]} material={M.metal}>
          <cylinderGeometry args={[0.32, 0.4, 0.06, 28]} />
        </mesh>
        <mesh position={[0, 1.7, -0.5]} material={mats.beam}>
          <cylinderGeometry args={[0.8, 0.28, 1.2, 28, 1, true]} />
        </mesh>
        <group ref={holo} position={[0, 2.35, -0.5]}>
          {net.pts.map((p, i) => (
            <mesh key={i} position={p} material={mats.node}>
              <sphereGeometry args={[0.028, 8, 8]} />
            </mesh>
          ))}
          <lineSegments material={mats.lineMat}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[net.seg, 3]} />
            </bufferGeometry>
          </lineSegments>
          <mesh material={mats.wire}>
            <icosahedronGeometry args={[0.92, 1]} />
          </mesh>
        </group>
        {/* the object to examine */}
        <mesh ref={core} position={[0, 1.5, 0.95]} material={mats.hologram}>
          <octahedronGeometry args={[0.2, 0]} />
        </mesh>
        <mesh position={[0, 1.13, 0.95]} material={M.metal}>
          <cylinderGeometry args={[0.16, 0.2, 0.08, 20]} />
        </mesh>
        <pointLight ref={bench} position={[0, 2, 0.4]} intensity={4} distance={7} color="#7fb8ff" decay={2} />
      </group>

      {/* main skills display, powered up by the robot */}
      <group ref={screen} position={[0.3, 3.15, -3.4]}>
        <mesh material={mats.screen}>
          <planeGeometry args={[4.4, 2.75]} />
        </mesh>
        {[
          [0, 1.375, 4.4, 0.04],
          [0, -1.375, 4.4, 0.04],
          [-2.2, 0, 0.04, 2.75],
          [2.2, 0, 0.04, 2.75],
        ].map(([x, y, w, h], i) => (
          <mesh key={i} position={[x, y, 0.005]} material={mats.frame}>
            <boxGeometry args={[w, h, 0.02]} />
          </mesh>
        ))}
      </group>

      {/* floating objects, mechanical parts, code fragments */}
      <group ref={floatObjs}>
        <group position={[-5.5, 3.6, -4.6]}>
          <Gear r={0.7} position={[0, 0, 0]} speed={0.4} />
          <Gear r={0.4} teeth={7} position={[1.05, 0.5, 0]} speed={-0.7} />
        </group>
        <Gear r={0.55} position={[5.4, 4.3, -4.4]} speed={-0.35} rotation={[0.3, 0.2, 0]} />
        <mesh position={[3.9, 3.0, -5.3]} material={M.blue}>
          <torusKnotGeometry args={[0.38, 0.1, 96, 12]} />
        </mesh>
        <mesh position={[-7, 2.4, -2]} material={mats.wire}>
          <icosahedronGeometry args={[0.6, 1]} />
        </mesh>
        <lineSegments position={[-3.2, 5.0, -5.6]} geometry={edge} scale={0.9}>
          <lineBasicMaterial color="#8cc4ff" />
        </lineSegments>
        <mesh position={[6.8, 2.2, -1.6]} material={M.metal}>
          <cylinderGeometry args={[0.28, 0.28, 0.22, 6]} />
        </mesh>
      </group>
      {(
        [
          [-7.2, 2.6, -1.4, 0.6, 0],
          [6.9, 3.5, -2.4, -0.6, 1],
          [-3.5, 4.5, -6.2, 0.1, 2],
          [3.0, 5.0, -6.2, -0.1, 3],
        ] as const
      ).map(([x, y, z, ry, i]) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, ry, 0]}>
          <planeGeometry args={[1.8, 0.9]} />
          <meshBasicMaterial map={code[i]} transparent opacity={0.85} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* robotic arm rig, back-left */}
      <group position={[-7.6, 0, -5.4]}>
        <mesh position={[0, 0.25, 0]} material={M.dark}>
          <cylinderGeometry args={[0.6, 0.7, 0.5, 24]} />
        </mesh>
        <group ref={arm} position={[0, 0.5, 0]}>
          <mesh position={[0, 0.8, 0]} material={M.white}>
            <boxGeometry args={[0.22, 1.6, 0.22]} />
          </mesh>
          <mesh position={[0.5, 1.65, 0]} rotation={[0, 0, -1.1]} material={M.white}>
            <boxGeometry args={[0.2, 1.2, 0.2]} />
          </mesh>
          <mesh position={[0.95, 1.4, 0]} material={M.blue}>
            <sphereGeometry args={[0.14, 14, 12]} />
          </mesh>
        </group>
      </group>

      {/* interior light */}
      <pointLight position={[-1, 5.8, 0]} intensity={26} distance={16} color="#9ec9ff" decay={2} />
      <pointLight position={[-6, 3.5, 4]} intensity={9} distance={12} color="#5aa8ff" decay={2} />
    </group>
  );
}
