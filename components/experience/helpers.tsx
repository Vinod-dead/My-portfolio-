"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { frame } from "@/lib/timeline";

/* ----------------------------------------------------------------- random */

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------- gate */

/** Hide a scene group when the robot is far away along the journey (x axis). */
export function useGate(minX: number, maxX: number, margin = 55) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const v = frame.x > minX - margin && frame.x < maxX + margin;
    if (g.visible !== v) g.visible = v;
  });
  return ref;
}

/* --------------------------------------------------------------- textures */

const cache = new Map<string, THREE.CanvasTexture>();

export function canvasTexture(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, tex);
  return tex;
}

export const radialTex = () =>
  canvasTexture("radial", 128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.5, "rgba(255,255,255,0.45)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });

export const ringsTex = (color = "#4da3ff") =>
  canvasTexture(`rings-${color}`, 1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = "#070d1c";
    ctx.fillRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = color;
    for (let i = 1; i <= 7; i++) {
      ctx.globalAlpha = i % 2 ? 0.55 : 0.25;
      ctx.lineWidth = i % 3 === 0 ? 5 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, (i / 7) * (w / 2 - 8), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const r0 = w / 2 - 40;
      const r1 = w / 2 - (i % 6 === 0 ? 14 : 28);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.stroke();
    }
  });

export const gridTex = (color = "#4da3ff", cells = 8, repeat?: [number, number]) =>
  canvasTexture(`grid-${color}-${cells}-${repeat?.join("x") ?? "1"}`, 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#0a1226";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    for (let i = 0; i <= cells; i++) {
      const p = (i / cells) * w;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, h);
      ctx.moveTo(0, p);
      ctx.lineTo(w, p);
      ctx.stroke();
    }
  }, repeat);

export const labelTex = (kicker: string, label: string, color = "#4da3ff") =>
  canvasTexture(`label-${kicker}-${label}-${color}`, 640, 400, (ctx, w, h) => {
    ctx.fillStyle = "rgba(6,12,28,0.78)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 3;
    ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.font = "600 30px system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(kicker, 44, 46);
    ctx.fillStyle = "#f3f7ff";
    ctx.font = "800 64px system-ui, sans-serif";
    const words = label.toUpperCase().split(" ");
    let y = 120;
    let line = "";
    for (const wd of words) {
      const test = line ? `${line} ${wd}` : wd;
      if (ctx.measureText(test).width > w - 90 && line) {
        ctx.fillText(line, 44, y);
        y += 74;
        line = wd;
      } else line = test;
    }
    ctx.fillText(line, 44, y);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(44, h - 70, w - 88, 3);
    ctx.fillRect(44, h - 52, (w - 88) * 0.55, 3);
    ctx.fillRect(44, h - 34, (w - 88) * 0.3, 3);
  });

export const symbolTex = (ch: string, color: string) =>
  canvasTexture(`sym-${ch}-${color}`, 256, 340, (ctx, w, h) => {
    ctx.fillStyle = "#0d1a36";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = color;
    ctx.font = "800 190px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, w / 2, h / 2 + 8);
  });

export const badgeTex = (text: string, color: string) =>
  canvasTexture(`badge-${text}-${color}`, 512, 128, (ctx, w, h) => {
    ctx.fillStyle = "rgba(6,12,28,0.85)";
    ctx.beginPath();
    ctx.roundRect(4, 4, w - 8, h - 8, 28);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "800 54px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text.toUpperCase(), w / 2, h / 2 + 3);
  });

export const mapTex = () =>
  canvasTexture("map", 1024, 740, (ctx, w, h) => {
    ctx.fillStyle = "#07211f";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#4fe3c1";
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#0e4a43";
    const rnd = seeded(7);
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      const cx = 100 + rnd() * (w - 200);
      const cy = 100 + rnd() * (h - 200);
      ctx.ellipse(cx, cy, 70 + rnd() * 110, 50 + rnd() * 70, rnd() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

export const terminalTex = () =>
  canvasTexture("terminal", 512, 340, (ctx, w, h) => {
    ctx.fillStyle = "#06101f";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#4da3ff";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = "#8fd0ff";
    ctx.font = "800 120px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("@", w / 2, h / 2 - 20);
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.fillStyle = "#f3f7ff";
    ctx.fillText("LET'S CONNECT", w / 2, h - 80);
    ctx.fillStyle = "#4da3ff";
    ctx.fillRect(w / 2 + 130, h - 94, 18, 30);
  });

export const codeTex = (lines: string[]) =>
  canvasTexture(`code-${lines.join("|")}`, 512, 256, (ctx, w, h) => {
    ctx.fillStyle = "rgba(6,14,30,0.7)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(120,180,255,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.font = "500 28px ui-monospace, Menlo, Consolas, monospace";
    ctx.textBaseline = "top";
    lines.forEach((l, i) => {
      ctx.fillStyle = i % 3 === 0 ? "#7fd1ff" : i % 3 === 1 ? "#b7a4ff" : "#9fe8c8";
      ctx.fillText(l, 22, 22 + i * 44);
    });
  });

export const holoScreenTex = () =>
  canvasTexture("holoscreen", 768, 480, (ctx, w, h) => {
    ctx.fillStyle = "rgba(6,14,32,0.82)";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#4da3ff";
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, h - 30);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 30, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#8fd0ff";
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("SKILLS & TECHNOLOGIES", 40, 38);
    // decorative node constellation (no data implied)
    const rnd = seeded(11);
    const pts: [number, number][] = [];
    for (let i = 0; i < 16; i++) pts.push([70 + rnd() * (w - 140), 130 + rnd() * (h - 190)]);
    ctx.strokeStyle = "#4da3ff";
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d < 150) {
          ctx.beginPath();
          ctx.moveTo(pts[i][0], pts[i][1]);
          ctx.lineTo(pts[j][0], pts[j][1]);
          ctx.stroke();
        }
      }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#cfe8ff";
    pts.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  });

/* ------------------------------------------------------- shared materials */

export const M = {
  white: new THREE.MeshPhysicalMaterial({ color: "#f4f7ff", roughness: 0.22, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.1 }),
  blue: new THREE.MeshStandardMaterial({ color: "#2f7bff", roughness: 0.35, metalness: 0.2, emissive: "#0a2c78", emissiveIntensity: 0.4 }),
  dark: new THREE.MeshPhysicalMaterial({ color: "#070b16", roughness: 0.18, metalness: 0.5, clearcoat: 1 }),
  floor: new THREE.MeshStandardMaterial({ color: "#0b1428", roughness: 0.4, metalness: 0.55 }),
  metal: new THREE.MeshStandardMaterial({ color: "#8fa4c8", roughness: 0.32, metalness: 0.85 }),
  building: new THREE.MeshStandardMaterial({ color: "#0b1330", roughness: 0.55, metalness: 0.45 }),
  rock: new THREE.MeshStandardMaterial({ color: "#16203b", roughness: 0.9, metalness: 0.1, flatShading: true }),
  glowBlue: new THREE.MeshBasicMaterial({ color: "#4da3ff", toneMapped: false }),
  glowPale: new THREE.MeshBasicMaterial({ color: "#cfe8ff", toneMapped: false }),
  glowWarm: new THREE.MeshBasicMaterial({ color: "#ffc58a", toneMapped: false }),
};

export const additive = (color: string, opacity: number) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  });
