"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { radialTex } from "./helpers";

/** Soft contact shadow under the robot; fades and grows with altitude. */
export function BlobShadow() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: radialTex(),
        color: "#000000",
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [],
  );

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const h = Math.max(0, frame.y - frame.ground);
    const fade = 1 - THREE.MathUtils.clamp(h / 7, 0, 1);
    mat.opacity = 0.55 * fade * (frame.riding ? 0 : 1);
    m.visible = mat.opacity > 0.01;
    m.position.set(frame.x, frame.ground + 0.014, frame.z);
    const s = 0.95 + h * 0.18;
    m.scale.set(s, s, 1);
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
      <planeGeometry args={[1.5, 1.5]} />
    </mesh>
  );
}
