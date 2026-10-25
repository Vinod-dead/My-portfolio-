"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAUNCH_X } from "@/lib/layout";
import { M, gridTex, ringsTex, useGate } from "@/components/experience/helpers";

const PATH_Z = -0.4;
const PATH_W = 6.2;

/** Scene 1 + 2 world: circular landing platform and the futuristic pathway. */
export function IntroScene() {
  const gate = useGate(-10, LAUNCH_X, 60);
  const chev = useRef<THREE.InstancedMesh>(null);
  const chevMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#4da3ff", transparent: true, opacity: 0.5, toneMapped: false, side: THREE.DoubleSide }), []);

  const chevGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.25, -0.3);
    s.lineTo(0, -0.3);
    s.lineTo(0.25, 0);
    s.lineTo(0, 0.3);
    s.lineTo(-0.25, 0.3);
    s.lineTo(0, 0);
    s.closePath();
    return new THREE.ShapeGeometry(s);
  }, []);

  const COUNT = 14;
  useEffect(() => {
    const m = chev.current;
    if (!m) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < COUNT; i++) {
      d.position.set(5 + i * 3.6, 0.014, PATH_Z);
      d.rotation.set(-Math.PI / 2, 0, 0);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state) => {
    chevMat.opacity = 0.3 + 0.25 * (0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.2));
  });

  const pathTex = useMemo(() => gridTex("#4da3ff", 8, [27, 3]), []);
  const pathLen = LAUNCH_X - 2;

  const posts = useMemo(() => {
    const out: [number, number][] = [];
    for (let x = 8; x < LAUNCH_X - 4; x += 8) {
      out.push([x, PATH_Z + PATH_W / 2 + 0.3]);
      out.push([x + 4, PATH_Z - PATH_W / 2 - 0.3]);
    }
    return out;
  }, []);

  return (
    <group ref={gate}>
      {/* landing platform */}
      <mesh position={[0, -0.15, -0.5]} material={M.floor}>
        <cylinderGeometry args={[5.2, 5.4, 0.3, 64]} />
      </mesh>
      <mesh position={[0, 0.004, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.0, 64]} />
        <meshStandardMaterial map={ringsTex()} roughness={0.45} metalness={0.4} emissive="#1a3d80" emissiveMap={ringsTex()} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.012, -0.5]} rotation={[-Math.PI / 2, 0, 0]} material={M.glowBlue}>
        <ringGeometry args={[5.05, 5.22, 80]} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 4.7, 0.05, -0.5 + Math.sin(a) * 4.7]} material={M.glowPale}>
            <sphereGeometry args={[0.07, 12, 10]} />
          </mesh>
        );
      })}

      {/* pathway */}
      <mesh position={[2 + pathLen / 2, -0.15, PATH_Z]} material={M.floor}>
        <boxGeometry args={[pathLen, 0.3, PATH_W]} />
      </mesh>
      <mesh position={[2 + pathLen / 2, 0.003, PATH_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[pathLen, PATH_W]} />
        <meshStandardMaterial map={pathTex} roughness={0.5} metalness={0.4} emissive="#173a78" emissiveMap={pathTex} emissiveIntensity={0.55} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[2 + pathLen / 2, 0.02, PATH_Z + s * (PATH_W / 2 - 0.06)]} material={M.glowBlue}>
          <boxGeometry args={[pathLen, 0.03, 0.07]} />
        </mesh>
      ))}
      <instancedMesh ref={chev} args={[chevGeo, chevMat, COUNT]} frustumCulled={false} />

      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]} material={M.metal}>
            <cylinderGeometry args={[0.035, 0.05, 1.4, 10]} />
          </mesh>
          <mesh position={[0, 1.45, 0]} material={M.glowPale}>
            <sphereGeometry args={[0.1, 14, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
