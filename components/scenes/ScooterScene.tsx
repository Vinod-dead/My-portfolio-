"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HoloPanel } from "@/components/experience/HoloPanel";
import { M, seeded, useGate } from "@/components/experience/helpers";
import { LAUNCH_X } from "@/lib/layout";
import { rideXAt } from "@/lib/timeline";
import { PANEL_WINDOWS } from "@/lib/overlayPlan";
import { story } from "@/lib/store";

interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  side: 1 | -1;
}

function makeCity(lite: boolean) {
  const rnd = seeded(5);
  const b: Building[] = [];
  for (const side of [1, -1] as const) {
    let x = 14;
    while (x < LAUNCH_X + 2) {
      const w = 1.6 + rnd() * 2.4;
      const d = 3 + rnd() * 3;
      const h = 3 + rnd() * 11;
      const base = side === 1 ? 11.5 : 9.5;
      b.push({ x: x + w / 2, z: side * (base + rnd() * 5), w, d, h, side });
      x += w + 0.4 + rnd() * (lite ? 2.4 : 1.2);
    }
  }
  return b;
}

const WIN_MAX = 2600;

/** Scene 3 world: stylized digital city corridor, gantries and the education/skills panels. */
export function ScooterScene() {
  const gate = useGate(12, LAUNCH_X + 4, 60);
  const lite = story.lite;
  const city = useMemo(() => makeCity(lite), [lite]);

  const bGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const wGeo = useMemo(() => new THREE.PlaneGeometry(0.3, 0.4), []);
  const wMatCool = useMemo(() => new THREE.MeshBasicMaterial({ color: "#8fc4ff", toneMapped: false, side: THREE.DoubleSide }), []);
  const bMesh = useRef<THREE.InstancedMesh>(null);
  const wMesh = useRef<THREE.InstancedMesh>(null);
  const wMesh2 = useRef<THREE.InstancedMesh>(null);
  const wMatWarm = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false, side: THREE.DoubleSide }), []);

  useEffect(() => {
    const bm = bMesh.current;
    const wm = wMesh.current;
    const wm2 = wMesh2.current;
    if (!bm || !wm || !wm2) return;
    const d = new THREE.Object3D();
    city.forEach((b, i) => {
      d.position.set(b.x, b.h / 2 - 0.15, b.z);
      d.rotation.set(0, 0, 0);
      d.scale.set(b.w, b.h, b.d);
      d.updateMatrix();
      bm.setMatrixAt(i, d.matrix);
    });
    bm.instanceMatrix.needsUpdate = true;

    const rnd = seeded(9);
    let n1 = 0;
    let n2 = 0;
    for (const b of city) {
      const faceZ = b.z - b.side * (b.d / 2 + 0.02);
      const cols = Math.max(1, Math.floor((b.w - 0.5) / 0.75));
      const rows = Math.max(1, Math.floor((b.h - 0.8) / 0.9));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (rnd() > 0.5) continue;
          const warm = rnd() < 0.12;
          if ((warm ? n2 : n1) >= WIN_MAX / 2) continue;
          d.position.set(b.x - b.w / 2 + 0.45 + c * 0.75, 0.9 + r * 0.9, faceZ);
          d.rotation.set(0, b.side === 1 ? Math.PI : 0, 0);
          d.scale.set(1, 1, 1);
          d.updateMatrix();
          if (warm) wm2.setMatrixAt(n2++, d.matrix);
          else wm.setMatrixAt(n1++, d.matrix);
        }
      }
    }
    wm.count = n1;
    wm2.count = n2;
    wm.instanceMatrix.needsUpdate = true;
    wm2.instanceMatrix.needsUpdate = true;
  }, [city]);

  const towers = useMemo(() => {
    const rnd = seeded(77);
    return Array.from({ length: 16 }, (_, i) => ({
      x: 8 + i * 4.4 + rnd() * 2,
      z: (rnd() > 0.5 ? 1 : -1) * (30 + rnd() * 14),
      h: 14 + rnd() * 20,
      w: 2 + rnd() * 3,
    }));
  }, []);

  const arches = [26, 33, 40, 47];

  // education / skills panels sit just ahead of the scooter when their text appears
  const ids = ["edu", "skills-prog", "skills-ai", "skills-tools", "exploring"];
  const meta: Record<string, [string, string]> = {
    edu: ["01 / EDUCATION", "Education"],
    "skills-prog": ["02 / PROGRAMMING", "Languages"],
    "skills-ai": ["03 / AI & ML", "AI / ML skills"],
    "skills-tools": ["04 / BUILD", "Frameworks & tools"],
    exploring: ["05 / EXPLORING", "Exploring now"],
  };
  const panels = useMemo(
    () =>
      ids.map((id, i) => {
        const w = PANEL_WINDOWS.find((p) => p.id === id)!;
        return { id, x: rideXAt(w.a + 0.004) + 5.2 + (i % 2) * 0.6, win: w };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <group ref={gate}>
      <instancedMesh ref={bMesh} args={[bGeo, M.building, city.length]} frustumCulled={false} />
      <instancedMesh ref={wMesh} args={[wGeo, wMatCool, WIN_MAX / 2]} frustumCulled={false} />
      <instancedMesh ref={wMesh2} args={[wGeo, wMatWarm, WIN_MAX / 2]} frustumCulled={false} />

      {towers.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.h / 2 - 0.2, 0]} material={M.building}>
            <boxGeometry args={[t.w, t.h, t.w]} />
          </mesh>
          <mesh position={[0, t.h - 0.1, 0]} material={M.glowBlue}>
            <boxGeometry args={[t.w + 0.05, 0.12, t.w + 0.05]} />
          </mesh>
        </group>
      ))}

      {arches.map((x) => (
        <group key={x} position={[x, 0, -0.4]}>
          {[-3.7, 3.7].map((z) => (
            <mesh key={z} position={[0, 1.7, z]} material={M.metal}>
              <boxGeometry args={[0.22, 3.4, 0.22]} />
            </mesh>
          ))}
          <mesh position={[0, 3.45, 0]} material={M.dark}>
            <boxGeometry args={[0.3, 0.2, 7.6]} />
          </mesh>
          <mesh position={[0, 3.33, 0]} material={M.glowBlue}>
            <boxGeometry args={[0.07, 0.04, 7.0]} />
          </mesh>
        </group>
      ))}

      {panels.map((p) => (
        <HoloPanel
          key={p.id}
          id={p.id}
          position={[p.x, 2.35, -5.6]}
          rotationY={0.3}
          size={[2.8, 1.75]}
          kicker={meta[p.id][0]}
          label={meta[p.id][1]}
        />
      ))}
    </group>
  );
}
