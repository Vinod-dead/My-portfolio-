"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { frame } from "@/lib/timeline";
import { story } from "@/lib/store";
import { smoothstep } from "@/lib/layout";

const { damp } = THREE.MathUtils;

/**
 * Follow camera. The timeline supplies a shot (offsets relative to the robot);
 * the rig damps toward it for fluid motion, adapts distance to portrait
 * screens, and uses an off-axis view offset so the robot sits beside the text
 * panels instead of behind them.
 */
export function CameraRig() {
  const look = useRef(new THREE.Vector3(0, 1, 0));
  const ready = useRef(false);
  const shift = useRef({ x: 0, y: 0 });

  useFrame((state, dtRaw) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const dt = Math.min(dtRaw, 0.05);
    const { width: w, height: h } = state.size;
    const aspect = w / h;
    const portrait = aspect < 0.95;
    const k = portrait ? 1 + Math.min(0.6, 0.95 - aspect) * 1.1 : 1;

    const tx = frame.x + frame.cx * k;
    const ty = frame.y + frame.cy * (1 + (k - 1) * 0.4);
    const tz = frame.z + frame.cz * k;
    const lx = frame.x + frame.lx;
    const ly = frame.y + frame.ly;
    const lz = frame.z + frame.lz;

    if (!ready.current) {
      cam.position.set(tx, ty, tz);
      look.current.set(lx, ly, lz);
      ready.current = true;
    } else {
      const lam = story.reduced ? 60 : 3.4;
      cam.position.x = damp(cam.position.x, tx, lam, dt);
      cam.position.y = damp(cam.position.y, ty, lam, dt);
      cam.position.z = damp(cam.position.z, tz, lam, dt);
      const ll = story.reduced ? 60 : 5;
      look.current.x = damp(look.current.x, lx, ll, dt);
      look.current.y = damp(look.current.y, ly, ll, dt);
      look.current.z = damp(look.current.z, lz, ll, dt);
    }
    cam.lookAt(look.current);

    // framing: hero centred-right, middle chapters left of the text panel, finale centred
    const p = story.p;
    const hero = 1 - smoothstep(0.04, 0.11, p);
    const fin = smoothstep(0.955, 0.98, p);
    const mid = (1 - hero) * (1 - fin);
    let sx = 0;
    let sy = 0;
    if (portrait) {
      sy = -0.1 * hero + 0.2 * mid + 0.1 * fin;
    } else {
      sx = 0.15 * hero - 0.13 * mid;
      sy = 0.03 * fin;
    }
    shift.current.x = damp(shift.current.x, sx, 4, dt);
    shift.current.y = damp(shift.current.y, sy, 4, dt);

    cam.fov = damp(cam.fov, frame.fov * (portrait ? 1.12 : 1), 3, dt);
    cam.setViewOffset(w, h, -shift.current.x * w, shift.current.y * h, w, h);
  });

  return null;
}
