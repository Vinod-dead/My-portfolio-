"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { projects, type Project } from "@/data/projects";
import { LAB_X, LAUNCH_X, SPAN, islandAt, projStart } from "@/lib/layout";
import { projectReveal } from "@/lib/timeline";
import { story } from "@/lib/store";
import { HoloPanel } from "@/components/experience/HoloPanel";
import { M, additive, badgeTex, mapTex, ringsTex, seeded, symbolTex, useGate } from "@/components/experience/helpers";

const R = 5.4;

/* ------------------------------------------------------------ island base */

function IslandBase({ accent }: { accent: string }) {
  const rocks = useRef<THREE.Group>(null);
  const data = useMemo(() => {
    const rnd = seeded(Math.round(accent.charCodeAt(2) * 31));
    return Array.from({ length: 7 }, () => ({
      x: (rnd() - 0.5) * R * 1.5,
      y: -2.2 - rnd() * 3.6,
      z: (rnd() - 0.5) * R * 1.5,
      s: 0.22 + rnd() * 0.5,
      ph: rnd() * 6,
    }));
  }, [accent]);
  const glow = useMemo(() => additive(accent, 0.35), [accent]);

  useFrame((state) => {
    if (!rocks.current || story.reduced) return;
    const t = state.clock.elapsedTime;
    rocks.current.children.forEach((c, i) => {
      c.position.y = data[i].y + Math.sin(t * 0.6 + data[i].ph) * 0.18;
      c.rotation.y += 0.004;
    });
  });

  return (
    <>
      <mesh position={[0, -0.25, 0]} material={M.floor}>
        <cylinderGeometry args={[R, R * 1.03, 0.5, 56]} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R - 0.12, 56]} />
        <meshStandardMaterial map={ringsTex(accent)} roughness={0.5} metalness={0.4} emissive={accent} emissiveMap={ringsTex(accent)} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R - 0.08, R + 0.02, 80]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.5 - R * 0.62, 0]} rotation={[Math.PI, 0, 0]} material={M.rock}>
        <coneGeometry args={[R * 0.99, R * 1.25, 9, 1]} />
      </mesh>
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={glow}>
        <circleGeometry args={[R * 0.9, 40]} />
      </mesh>
      <group ref={rocks}>
        {data.map((r, i) => (
          <mesh key={i} position={[r.x, r.y, r.z]} scale={r.s} material={M.rock}>
            <dodecahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </group>
    </>
  );
}

/* --------------------------------------------------------------- QuizForge */

function QuizWorld({ accent }: { accent: string }) {
  const cards = useRef<THREE.Group>(null);
  const book = useRef<THREE.Group>(null);
  const bulb = useRef<THREE.Group>(null);
  const anvilGlow = useRef<THREE.MeshStandardMaterial>(null);
  const chars = ["?", "A", "B", "✓", "Σ", "{ }", "!", "?"];
  const spec = useMemo(
    () =>
      chars.map((c, i) => ({
        c,
        x: -2.4 + i * 1.08,
        y: 1.7 + 0.8 * Math.sin(i * 1.3 + 1),
        z: -2.7 - 0.45 * Math.sin(i * 1.9),
        ry: 0.12 * Math.sin(i),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const beam = useMemo(() => additive(accent, 0.09), [accent]);
  const page = useMemo(() => new THREE.MeshStandardMaterial({ color: "#eaf3ff", emissive: accent, emissiveIntensity: 0.55, side: THREE.DoubleSide, roughness: 0.6 }), [accent]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const calm = story.reduced ? 0 : 1;
    cards.current?.children.forEach((c, i) => {
      c.position.y = spec[i].y + Math.sin(t * 0.8 + i * 0.9) * 0.14 * calm;
      c.rotation.y = spec[i].ry + Math.sin(t * 0.5 + i) * 0.08 * calm;
    });
    if (book.current) {
      book.current.rotation.y = t * 0.5 * calm;
      book.current.position.y = 1.7 + Math.sin(t * 1.1) * 0.1 * calm;
    }
    if (bulb.current) {
      bulb.current.rotation.y = t * 0.6 * calm;
      bulb.current.rotation.x = t * 0.3 * calm;
    }
    if (anvilGlow.current) anvilGlow.current.emissiveIntensity = 0.7 + 0.35 * Math.sin(t * 2.4);
  });

  return (
    <>
      <group ref={cards}>
        {spec.map((s, i) => (
          <mesh key={i} position={[s.x, s.y, s.z]}>
            <planeGeometry args={[0.66, 0.88]} />
            <meshBasicMaterial map={symbolTex(s.c, accent)} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* anvil: the "forge" */}
      <group position={[2.5, 0, -0.9]}>
        <mesh position={[0, 0.14, 0]} material={M.dark}>
          <boxGeometry args={[0.95, 0.28, 0.55]} />
        </mesh>
        <mesh position={[0, 0.44, 0]} material={M.dark}>
          <boxGeometry args={[0.5, 0.34, 0.36]} />
        </mesh>
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry args={[1.25, 0.24, 0.52]} />
          <meshStandardMaterial ref={anvilGlow} color="#10192e" roughness={0.3} metalness={0.8} emissive={accent} emissiveIntensity={0.7} />
        </mesh>
        <mesh position={[0.82, 0.72, 0]} rotation={[0, 0, -Math.PI / 2]} material={M.dark}>
          <coneGeometry args={[0.22, 0.55, 4]} />
        </mesh>
        <Sparkles count={story.lite ? 14 : 32} scale={[1.8, 2.2, 1.8]} position={[0, 1.6, 0]} size={3.5} speed={0.7} color={accent} />
      </group>

      {/* stack of books and a floating open one */}
      <group position={[3.7, 0, 1.4]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0.04 * Math.sin(i * 2), 0.09 + i * 0.17, 0]} rotation={[0, 0.35 * i - 0.2, 0]}>
            <RoundedBox args={[0.9, 0.15, 0.62]} radius={0.03} smoothness={2} material={i === 1 ? M.blue : M.dark} />
            <mesh position={[0.02, 0, 0.0]} material={M.glowPale}>
              <boxGeometry args={[0.86, 0.1, 0.64]} />
            </mesh>
          </group>
        ))}
        <group ref={book} position={[0, 1.7, 0]}>
          <mesh position={[-0.28, 0, 0]} rotation={[0, 0, 0.35]} material={page}>
            <planeGeometry args={[0.55, 0.75]} />
          </mesh>
          <mesh position={[0.28, 0, 0]} rotation={[0, 0, -0.35]} material={page}>
            <planeGeometry args={[0.55, 0.75]} />
          </mesh>
          <mesh position={[0, -0.78, 0]} material={beam}>
            <cylinderGeometry args={[0.9, 0.1, 1.5, 24, 1, true]} />
          </mesh>
        </group>
      </group>

      {/* knowledge symbol */}
      <group ref={bulb} position={[-3.1, 2.7, -1.7]}>
        <mesh>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshBasicMaterial color={accent} wireframe toneMapped={false} />
        </mesh>
        <mesh material={M.glowPale}>
          <sphereGeometry args={[0.18, 16, 12]} />
        </mesh>
      </group>
    </>
  );
}

/* -------------------------------------------------------- Travel Planner */

const NODE_COLORS = ["#4fe3c1", "#ffffff", "#5aa8ff", "#ffc58a", "#b7a4ff"];

function TravelWorld({ accent }: { accent: string }) {
  const nodes = useRef<THREE.Group>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const pulses = useRef<THREE.Group>(null);
  const plane = useRef<THREE.Group>(null);
  const lineRef = useRef<{ material: { dashOffset: number } } | null>(null);
  const minis = useRef<THREE.Group>(null);

  const TABLE = useMemo(() => new THREE.Vector3(1.9, 0.72, -1.3), []);
  const spots = useMemo(
    () =>
      [
        [-1.6, -0.7],
        [-0.45, 0.85],
        [0.75, -0.6],
        [1.6, 0.75],
        [1.75, -0.95],
      ].map(([x, z]) => new THREE.Vector3(TABLE.x + x, TABLE.y, TABLE.z + z)),
    [TABLE],
  );
  const route = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    spots.forEach((s, i) => {
      if (i > 0) {
        const a = spots[i - 1];
        pts.push(new THREE.Vector3((a.x + s.x) / 2, TABLE.y + 1.1, (a.z + s.z) / 2));
      }
      pts.push(new THREE.Vector3(s.x, TABLE.y + 0.55, s.z));
    });
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4);
  }, [spots, TABLE]);
  const routePts = useMemo(() => route.getPoints(90), [route]);

  const hub = useMemo(() => new THREE.Vector3(TABLE.x, 3.1, TABLE.z), [TABLE]);
  const edgePairs: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], // hub to agents
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 1], // ring between agents
  ];
  const edgeArr = useMemo(() => new Float32Array(edgePairs.length * 6), [edgePairs.length]);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), q: new THREE.Vector3() }), []);
  const pos = useMemo(() => Array.from({ length: 6 }, () => new THREE.Vector3()), []);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const calm = story.reduced ? 0 : 1;
    pos[0].copy(hub);
    for (let i = 1; i <= 5; i++) {
      const a = t * 0.45 * calm + (i / 5) * Math.PI * 2;
      pos[i].set(hub.x + Math.cos(a) * 1.55, hub.y + Math.sin(t * 0.9 + i) * 0.22 * calm, hub.z + Math.sin(a) * 1.15);
    }
    nodes.current?.children.forEach((c, i) => c.position.copy(pos[i]));
    edgePairs.forEach(([a, b], k) => {
      edgeArr.set([pos[a].x, pos[a].y, pos[a].z, pos[b].x, pos[b].y, pos[b].z], k * 6);
    });
    if (lines.current) lines.current.geometry.attributes.position.needsUpdate = true;
    pulses.current?.children.forEach((c, i) => {
      const [a, b] = edgePairs[(i * 3) % edgePairs.length];
      const u = (t * 0.5 + i * 0.27) % 1;
      tmp.q.lerpVectors(pos[a], pos[b], u);
      c.position.copy(tmp.q);
    });
    if (plane.current) {
      const u = (t * 0.05 * calm) % 1;
      route.getPoint(u, tmp.a);
      route.getPoint(Math.min(1, u + 0.01), tmp.b);
      plane.current.position.copy(tmp.a);
      plane.current.lookAt(tmp.b);
    }
    if (lineRef.current) lineRef.current.material.dashOffset -= dt * 0.35 * calm;
    minis.current?.children.forEach((c, i) => (c.position.y = TABLE.y + Math.sin(t * 2 + i) * 0.02 * calm));
  });

  const mini = (i: number) => {
    const s = spots[i];
    const tint = M.white;
    switch (i) {
      case 0: // tower
        return (
          <group position={[s.x, TABLE.y, s.z]}>
            {[0.34, 0.26, 0.18].map((r, k) => (
              <mesh key={k} position={[0, 0.2 + k * 0.4, 0]} material={tint}>
                <cylinderGeometry args={[r * 0.6, r, 0.4, 4]} />
              </mesh>
            ))}
            <mesh position={[0, 1.45, 0]} material={M.glowBlue}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
          </group>
        );
      case 1: // pyramid
        return (
          <mesh position={[s.x, TABLE.y + 0.3, s.z]} rotation={[0, Math.PI / 4, 0]} material={M.metal}>
            <coneGeometry args={[0.45, 0.6, 4]} />
          </mesh>
        );
      case 2: // dome
        return (
          <group position={[s.x, TABLE.y, s.z]}>
            <mesh position={[0, 0.15, 0]} material={tint}>
              <cylinderGeometry args={[0.32, 0.36, 0.3, 20]} />
            </mesh>
            <mesh position={[0, 0.3, 0]} material={M.blue}>
              <sphereGeometry args={[0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
        );
      case 3: // skyline
        return (
          <group position={[s.x, TABLE.y, s.z]}>
            {[
              [-0.2, 0.55, 0.16],
              [0.05, 0.85, 0.18],
              [0.28, 0.4, 0.15],
            ].map(([x, h, w], k) => (
              <mesh key={k} position={[x, h / 2, 0]} material={k === 1 ? M.white : M.building}>
                <boxGeometry args={[w, h, w]} />
              </mesh>
            ))}
          </group>
        );
      default: // lighthouse
        return (
          <group position={[s.x, TABLE.y, s.z]}>
            <mesh position={[0, 0.3, 0]} material={tint}>
              <cylinderGeometry args={[0.1, 0.17, 0.6, 14]} />
            </mesh>
            <mesh position={[0, 0.66, 0]} material={M.glowWarm}>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
          </group>
        );
    }
  };

  return (
    <>
      <mesh position={[TABLE.x, 0.35, TABLE.z]} material={M.dark}>
        <boxGeometry args={[4.9, 0.7, 3.5]} />
      </mesh>
      <mesh position={[TABLE.x, TABLE.y + 0.005, TABLE.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.7, 3.3]} />
        <meshBasicMaterial map={mapTex()} toneMapped={false} />
      </mesh>
      <group ref={minis}>{spots.map((_, i) => <group key={i}>{mini(i)}</group>)}</group>
      <Line ref={lineRef as never} points={routePts} color={accent} lineWidth={2.2} dashed dashSize={0.18} gapSize={0.12} />
      <group ref={plane}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={M.white}>
          <coneGeometry args={[0.06, 0.28, 8]} />
        </mesh>
        <mesh material={M.white} scale={[1, 0.15, 0.5]}>
          <boxGeometry args={[0.4, 0.1, 0.12]} />
        </mesh>
      </group>

      {/* agent nodes */}
      <group ref={nodes}>
        {pos.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[i === 0 ? 0.24 : 0.15, 24, 18]} />
            <meshStandardMaterial color={i === 0 ? "#ffffff" : NODE_COLORS[i - 1]} emissive={i === 0 ? "#9fd8ff" : NODE_COLORS[i - 1]} emissiveIntensity={0.9} roughness={0.25} />
          </mesh>
        ))}
      </group>
      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgeArr, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={accent} transparent opacity={0.7} />
      </lineSegments>
      <group ref={pulses}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} material={M.glowPale}>
            <sphereGeometry args={[0.05, 8, 8]} />
          </mesh>
        ))}
      </group>
    </>
  );
}

/* --------------------------------------------------------------- AgentFlow */

function FlowWorld({ i: idx, accent, status }: { i: number; accent: string; status: Project["status"] }) {
  const nodes = useRef<THREE.Group>(null);
  const lines = useRef<THREE.LineSegments>(null);
  const cubes = useRef<THREE.Group>(null);
  const targets = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(new THREE.Vector3(0.7 + c * 1.75, 1.15 + r * 1.0, -2.3));
    return out;
  }, []);
  const scatter = useMemo(() => {
    const rnd = seeded(99);
    return targets.map(() => new THREE.Vector3((rnd() - 0.5) * 8, (rnd() - 0.2) * 5, (rnd() - 0.5) * 5));
  }, [targets]);
  const links: [number, number][] = [[0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [7, 8], [1, 4], [4, 7]];
  const arr = useMemo(() => new Float32Array(links.length * 6), [links.length]);
  const cur = useMemo(() => targets.map((t) => t.clone()), [targets]);
  const badge = useMemo(() => badgeTex(status === "concept" ? "Concept" : status === "in-progress" ? "In progress" : "Project", accent), [status, accent]);
  const beam = useMemo(() => additive(accent, 0.12), [accent]);
  const asmRef = useRef(0);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const calm = story.reduced ? 0 : 1;
    // nodes snap into the workflow as the robot arrives
    const want = THREE.MathUtils.smoothstep(story.p, projStart(idx) + 0.1 * SPAN, projStart(idx) + 0.5 * SPAN);
    asmRef.current = THREE.MathUtils.damp(asmRef.current, want, 2.5, dt);
    const a = story.reduced ? want : asmRef.current;
    nodes.current?.children.forEach((c, i) => {
      cur[i].lerpVectors(scatter[i].clone().add(targets[i]), targets[i], a);
      c.position.set(cur[i].x, cur[i].y + Math.sin(t * 0.9 + i) * 0.05 * calm * a, cur[i].z);
    });
    links.forEach(([p, q], k) => {
      arr.set([cur[p].x + 0.6, cur[p].y, cur[p].z, cur[q].x - 0.6 + (q - p === 3 ? 0.6 : 0), cur[q].y, cur[q].z], k * 6);
    });
    if (lines.current) {
      lines.current.geometry.attributes.position.needsUpdate = true;
      (lines.current.material as THREE.LineBasicMaterial).opacity = 0.15 + 0.7 * a;
    }
    cubes.current?.children.forEach((c, i) => {
      c.position.x = 0.7 + ((t * 0.55 * calm + i * 1.1) % 3.6);
    });
  });

  return (
    <>
      {/* gantry */}
      {[-0.5, 4.8].map((x) => (
        <mesh key={x} position={[x, 2.2, -3.1]} material={M.dark}>
          <boxGeometry args={[0.22, 4.4, 0.22]} />
        </mesh>
      ))}
      <mesh position={[2.15, 4.45, -3.1]} material={M.dark}>
        <boxGeometry args={[5.5, 0.22, 0.22]} />
      </mesh>
      <mesh position={[2.15, 4.33, -3.1]}>
        <boxGeometry args={[5.2, 0.04, 0.04]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <mesh position={[2.15, 4.95, -3.0]}>
        <planeGeometry args={[2.0, 0.5]} />
        <meshBasicMaterial map={badge} transparent toneMapped={false} />
      </mesh>
      <mesh position={[2.15, 2.2, -3.0]} material={beam}>
        <boxGeometry args={[5.0, 4.2, 0.02]} />
      </mesh>

      <group ref={nodes}>
        {targets.map((_, i) => (
          <group key={i}>
            <RoundedBox args={[1.2, 0.62, 0.1]} radius={0.06} smoothness={3} material={M.dark} />
            <mesh position={[0, 0, 0.056]}>
              <planeGeometry args={[1.12, 0.54]} />
              <meshBasicMaterial color={accent} transparent opacity={0.16} toneMapped={false} />
            </mesh>
            <mesh position={[-0.6, 0, 0.05]} material={M.glowPale}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
            <mesh position={[0.6, 0, 0.05]} material={M.glowPale}>
              <sphereGeometry args={[0.05, 10, 8]} />
            </mesh>
            <mesh position={[-0.1, 0.1, 0.06]}>
              <boxGeometry args={[0.7, 0.04, 0.01]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
            <mesh position={[-0.25, -0.05, 0.06]}>
              <boxGeometry args={[0.4, 0.04, 0.01]} />
              <meshBasicMaterial color="#cfe8ff" toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
      <lineSegments ref={lines} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[arr, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={accent} transparent opacity={0.3} />
      </lineSegments>

      {/* conveyor with workflow items */}
      <mesh position={[2.5, 0.07, 0.5]} material={M.dark}>
        <boxGeometry args={[4.2, 0.14, 0.7]} />
      </mesh>
      <mesh position={[2.5, 0.15, 0.5]}>
        <boxGeometry args={[4.2, 0.015, 0.06]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      <group ref={cubes} position={[0, 0.38, 0.5]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="#e8f0ff" emissive={accent} emissiveIntensity={0.45} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </>
  );
}

function GenericWorld({ accent }: { accent: string }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-1.5 + i * 1.5, 1.2 + (i % 2) * 0.7, -2.4]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color={accent} wireframe toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/* ------------------------------------------------------------- the island */

function ProjectIsland({ i, project }: { i: number; project: Project }) {
  const isl = islandAt(i);
  const content = useRef<THREE.Group>(null);
  useFrame(() => {
    const c = content.current;
    if (!c) return;
    const s = story.reduced ? 1 : 0.001 + 0.999 * projectReveal(i, story.p);
    c.scale.setScalar(s);
    c.visible = s > 0.01;
  });
  return (
    <group position={[isl.x, isl.top, isl.z]}>
      <IslandBase accent={project.accent} />
      <group ref={content}>
        {project.world === "quiz" && <QuizWorld accent={project.accent} />}
        {project.world === "travel" && <TravelWorld accent={project.accent} />}
        {project.world === "flow" && <FlowWorld i={i} accent={project.accent} status={project.status} />}
        {project.world === "generic" && <GenericWorld accent={project.accent} />}
      </group>
      <HoloPanel
        id={`project-${i}`}
        position={[-3.8, 2.7, -3.2]}
        rotationY={0.5}
        size={[2.9, 1.7]}
        kicker={`PROJECT ${String(i + 1).padStart(2, "0")}`}
        label={project.name}
        color={project.accent}
      />
    </group>
  );
}

/** Scene 5 world: one floating island per project, each with its own identity. */
export function ProjectsScene() {
  const gate = useGate(LAUNCH_X, LAB_X, 60);
  return (
    <group ref={gate}>
      {projects.map((p, i) => (
        <ProjectIsland key={p.id} i={i} project={p} />
      ))}
    </group>
  );
}
