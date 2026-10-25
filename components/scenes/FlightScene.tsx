"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAB_X, LAUNCH_X, N_PROJECTS, islandAt } from "@/lib/layout";
import { story } from "@/lib/store";
import { M, additive, gridTex, ringsTex, seeded, useGate } from "@/components/experience/helpers";

const TILES = 120;

/** Scene 4 world: the launch pad, then the floating digital world between the islands. */
export function FlightScene() {
  const gate = useGate(LAUNCH_X - 6, LAB_X - 6, 50);
  const tiles = useRef<THREE.InstancedMesh>(null);
  const sweep = useRef<THREE.Mesh>(null);
  const beacons = useRef<THREE.Group>(null);
  const floaters = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);

  const mats = useMemo(
    () => ({
      beam: additive("#8cc4ff", 0.08),
      sweep: additive("#4da3ff", 0.25),
      tile: new THREE.MeshBasicMaterial({ color: "#4da3ff", transparent: true, opacity: 0.7, toneMapped: false }),
      wire: new THREE.MeshBasicMaterial({ color: "#5aa8ff", wireframe: true, transparent: true, opacity: 0.5 }),
      grid: new THREE.MeshBasicMaterial({ map: gridTex("#4da3ff", 8, [84, 16]), transparent: true, opacity: 0.22, depthWrite: false }),
      accent: new THREE.MeshBasicMaterial({ color: "#b7a4ff", toneMapped: false }),
    }),
    [],
  );

  // glowing trail that follows the route the robot flies
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [new THREE.Vector3(LAUNCH_X + 3, 0.3, 0.2), new THREE.Vector3(LAUNCH_X + 10, 5.8, 0)];
    for (let i = 0; i < N_PROJECTS; i++) {
      const isl = islandAt(i);
      pts.push(new THREE.Vector3(isl.x - 4, isl.top + 2.2, isl.z + 1.8), new THREE.Vector3(isl.x - 0.8, isl.top, isl.z + 1.4));
    }
    pts.push(new THREE.Vector3(LAB_X - 9.5, 2.2, 0.5));
    return new THREE.CatmullRomCurve3(pts, false, "centripetal");
  }, []);
  const trail = useMemo(() => curve.getSpacedPoints(TILES - 1), [curve]);

  useEffect(() => {
    const m = tiles.current;
    if (!m) return;
    const d = new THREE.Object3D();
    trail.forEach((p, i) => {
      d.position.set(p.x, p.y - 0.9, p.z);
      d.rotation.set(-Math.PI / 2, 0, 0);
      d.scale.setScalar(1);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [trail]);

  const gates = useMemo(() => {
    const g: [number, number, number][] = [[LAUNCH_X + 7, 5.2, 0.3]];
    for (let i = 0; i < N_PROJECTS; i++) {
      const isl = islandAt(i);
      g.push([isl.x - 8.5, isl.top + 3.2, isl.z + 1.4]);
    }
    return g;
  }, []);

  const floating = useMemo(() => {
    const rnd = seeded(31);
    return Array.from({ length: story.lite ? 14 : 26 }, () => ({
      x: LAUNCH_X + 6 + rnd() * (LAB_X - LAUNCH_X - 22),
      y: -3 + rnd() * 18,
      z: (rnd() > 0.5 ? 1 : -1) * (8 + rnd() * 14),
      s: 0.35 + rnd() * 0.9,
      kind: Math.floor(rnd() * 4),
      v: 0.1 + rnd() * 0.35,
    }));
  }, []);

  const tileDummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const calm = story.reduced ? 0 : 1;
    const m = tiles.current;
    if (m && !story.reduced) {
      for (let i = 0; i < TILES; i++) {
        const p = trail[i];
        const s = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 2.4 - i * 0.32));
        tileDummy.position.set(p.x, p.y - 0.9, p.z);
        tileDummy.rotation.set(-Math.PI / 2, 0, 0);
        tileDummy.scale.setScalar(s);
        tileDummy.updateMatrix();
        m.setMatrixAt(i, tileDummy.matrix);
      }
      m.instanceMatrix.needsUpdate = true;
    }
    if (sweep.current) sweep.current.rotation.z += dt * 0.9 * calm;
    if (beacons.current) beacons.current.children.forEach((c, i) => c.scale.set(1, 0.8 + 0.2 * Math.sin(t * 2 + i), 1));
    if (floaters.current)
      floaters.current.children.forEach((c, i) => {
        const f = floating[i];
        c.rotation.x += dt * f.v * calm;
        c.rotation.y += dt * f.v * 1.3 * calm;
        c.position.y = f.y + Math.sin(t * 0.4 + i) * 0.35 * calm;
      });
    if (rings.current) rings.current.children.forEach((c, i) => (c.rotation.z += dt * (0.4 + i * 0.1) * calm));
  });

  const edge = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#7fb8ff", transparent: true, opacity: 0.55 }), []);

  return (
    <group ref={gate}>
      {/* launch pad */}
      <group position={[LAUNCH_X, 0, 0.3]}>
        <mesh position={[0, -0.15, 0]} material={M.floor}>
          <cylinderGeometry args={[4.6, 4.8, 0.3, 64]} />
        </mesh>
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[4.5, 64]} />
          <meshStandardMaterial map={ringsTex()} roughness={0.45} metalness={0.4} emissive="#1a3d80" emissiveMap={ringsTex()} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.glowBlue}>
          <ringGeometry args={[4.55, 4.72, 80]} />
        </mesh>
        {/* H marking */}
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.016, 0]} material={M.glowPale}>
            <boxGeometry args={[0.2, 0.01, 1.8]} />
          </mesh>
        ))}
        <mesh position={[0, 0.016, 0]} material={M.glowPale}>
          <boxGeometry args={[1.1, 0.01, 0.2]} />
        </mesh>
        <mesh ref={sweep} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.sweep}>
          <ringGeometry args={[1.4, 4.3, 48, 1, 0, 1.1]} />
        </mesh>
        <group ref={beacons}>
          {[
            [-3.5, -3.5],
            [3.5, -3.5],
            [-3.5, 3.5],
            [3.5, 3.5],
          ].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <mesh position={[0, 0.7, 0]} material={M.metal}>
                <cylinderGeometry args={[0.04, 0.06, 1.4, 10]} />
              </mesh>
              <mesh position={[0, 1.45, 0]} material={M.glowPale}>
                <sphereGeometry args={[0.1, 14, 12]} />
              </mesh>
              <mesh position={[0, 4.5, 0]} material={mats.beam}>
                <cylinderGeometry args={[0.05, 0.22, 6.2, 16, 1, true]} />
              </mesh>
            </group>
          ))}
        </group>
        <mesh position={[0, 5, 0]} material={mats.beam}>
          <cylinderGeometry args={[0.3, 2.4, 10, 36, 1, true]} />
        </mesh>
      </group>

      {/* glowing trail */}
      <instancedMesh ref={tiles} args={[undefined, undefined, TILES]} frustumCulled={false} material={mats.tile}>
        <planeGeometry args={[0.42, 0.42]} />
      </instancedMesh>

      {/* gates the robot flies through */}
      <group ref={rings}>
        {gates.map((g, i) => (
          <group key={i} position={g} rotation={[0, Math.PI / 2, 0]}>
            <mesh material={M.glowBlue}>
              <torusGeometry args={[2.1, 0.035, 10, 72]} />
            </mesh>
            <mesh>
              <torusGeometry args={[1.7, 0.02, 8, 64, Math.PI * 1.4]} />
              <meshBasicMaterial color="#cfe8ff" toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* abstract structures drifting in the void */}
      <group ref={floaters}>
        {floating.map((f, i) => (
          <group key={i} position={[f.x, f.y, f.z]} scale={f.s * 1.4}>
            {f.kind === 0 && (
              <mesh material={mats.wire}>
                <octahedronGeometry args={[1, 0]} />
              </mesh>
            )}
            {f.kind === 1 && (
              <mesh material={mats.wire}>
                <torusGeometry args={[0.9, 0.22, 8, 20]} />
              </mesh>
            )}
            {f.kind === 2 && <lineSegments geometry={edge} material={edgeMat} scale={1.5} />}
            {f.kind === 3 && (
              <mesh material={M.glowPale} scale={0.35}>
                <icosahedronGeometry args={[1, 0]} />
              </mesh>
            )}
          </group>
        ))}
      </group>

      {/* faint floor of the void for depth */}
      <mesh position={[(LAUNCH_X + LAB_X) / 2, -16, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.grid}>
        <planeGeometry args={[LAB_X - LAUNCH_X + 80, 80]} />
      </mesh>
    </group>
  );
}
