"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { D } from "@/lib/robotDims";
import { frame } from "@/lib/timeline";
import { KEYS, MODES, NEUTRAL, groundRootY, type Pose } from "@/lib/robotPose";
import { audio } from "@/lib/audio";

const { damp } = THREE.MathUtils;

type G = THREE.Group | null;
interface Refs {
  root: G;
  inner: G;
  body: G;
  head: G;
  armL: G;
  armR: G;
  elbowL: G;
  elbowR: G;
  hipL: G;
  hipR: G;
  kneeL: G;
  kneeR: G;
  footL: G;
  footR: G;
  rotor: G;
  eyeL: G;
  eyeR: G;
  roundL: THREE.Object3D | null;
  roundR: THREE.Object3D | null;
  happyL: THREE.Object3D | null;
  happyR: THREE.Object3D | null;
  disc: THREE.Mesh | null;
  led: THREE.Mesh | null;
}

const WHITE = "#f4f7ff";
const BLUE = "#2f7bff";

export function RobotCharacter() {
  const R = useRef<Refs>({
    root: null,
    inner: null,
    body: null,
    head: null,
    armL: null,
    armR: null,
    elbowL: null,
    elbowR: null,
    hipL: null,
    hipR: null,
    kneeL: null,
    kneeR: null,
    footL: null,
    footR: null,
    rotor: null,
    eyeL: null,
    eyeR: null,
    roundL: null,
    roundR: null,
    happyL: null,
    happyR: null,
    disc: null,
    led: null,
  });
  const cur = useRef<Pose>({ ...NEUTRAL });
  const phase = useRef(0);
  const lastStep = useRef(0);
  const walkAmt = useRef(0);
  const flyAmt = useRef(0);
  const spin = useRef(0);

  const mats = useMemo(
    () => ({
      white: new THREE.MeshPhysicalMaterial({ color: WHITE, roughness: 0.2, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 }),
      blue: new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.35, metalness: 0.2, emissive: "#0a2c78", emissiveIntensity: 0.4 }),
      dark: new THREE.MeshPhysicalMaterial({ color: "#05070d", roughness: 0.1, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 }),
      eye: new THREE.MeshBasicMaterial({ color: "#72d4ff", toneMapped: false, side: THREE.DoubleSide }),
      glow: new THREE.MeshBasicMaterial({
        color: "#3b9dff",
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
      blade: new THREE.MeshStandardMaterial({ color: "#dfe8ff", roughness: 0.3, metalness: 0.4 }),
      disc: new THREE.MeshBasicMaterial({ color: "#9fc8ff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
    }),
    [],
  );

  useFrame((state, dtRaw) => {
    const r = R.current;
    if (!r.root || !r.inner || !r.body || !r.head) return;
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const mode = frame.mode;
    const cfg = MODES[mode];

    // ---- world placement
    r.root.position.set(frame.x, frame.y, frame.z);
    r.root.rotation.y = frame.yaw;

    // ---- walking cycle driven by actual motion (works in both scroll directions)
    const wantWalk = mode === "walk" ? THREE.MathUtils.smoothstep(frame.speed, 0.05, 0.6) : 0;
    walkAmt.current = damp(walkAmt.current, wantWalk, 9, dt);
    phase.current += Math.min(frame.speed, 3) * dt * 5.5;
    const wa = walkAmt.current;
    const stepIdx = Math.floor(phase.current / Math.PI);
    if (stepIdx !== lastStep.current) {
      lastStep.current = stepIdx;
      if (wa > 0.4) audio.step();
    }
    const sw = Math.sin(phase.current);
    const cw = Math.cos(phase.current);

    flyAmt.current = damp(flyAmt.current, mode === "fly" ? 1 : 0, 3, dt);
    const fa = flyAmt.current;

    // ---- target pose = mode pose + procedural layers
    const target: Pose = { ...cfg.pose };
    target.hL += sw * 0.55 * wa;
    target.hR -= sw * 0.55 * wa;
    target.kL += Math.max(0, cw) * 0.7 * wa;
    target.kR += Math.max(0, -cw) * 0.7 * wa;
    target.aLx += -sw * 0.5 * wa;
    target.aRx += sw * 0.5 * wa;
    target.roll += sw * 0.04 * wa;
    target.headRoll -= sw * 0.03 * wa;

    // pointing toward the floating panels
    const g = frame.gesture;
    if (g > 0.001) {
      target.aLz = THREE.MathUtils.lerp(target.aLz, 1.25, g);
      target.aLx = THREE.MathUtils.lerp(target.aLx, -0.55, g);
      target.eL = THREE.MathUtils.lerp(target.eL, -0.15, g);
      target.headYaw += 0.35 * g;
    }

    // mode specific motion
    let hop = 0;
    if (mode === "startup") {
      target.headYaw = Math.sin(t * 1.5) * 0.65;
      target.headPitch = Math.sin(t * 0.9 + 1) * 0.12;
    } else if (mode === "excited") {
      hop = Math.abs(Math.sin(t * 9)) * 0.11;
    } else if (mode === "present") {
      target.headYaw += Math.sin(t * 0.7) * 0.1;
      target.headPitch += Math.sin(t * 0.5) * 0.03;
    } else if (mode === "examine") {
      target.headYaw += Math.sin(t * 1.1) * 0.12;
    } else if (mode === "activate") {
      target.aRx += Math.sin(t * 6) * 0.12;
    } else if (mode === "nod") {
      target.headPitch += 0.4 * Math.sin(Math.PI * frame.modeT);
    } else if (mode === "ride") {
      target.pitch += Math.sin(t * 5) * 0.012;
    } else if (mode === "notice") {
      target.headYaw += Math.sin(t * 5) * 0.06;
    }
    if (mode === "fly" || mode === "liftoff" || mode === "land") {
      const lean = Math.min(frame.speed * 0.025, 0.3) * (mode === "fly" ? 1 : 0.5);
      target.pitch += lean;
      target.roll += Math.sin(t * 1.7) * 0.05 * (0.4 + fa);
    }
    if (mode === "spinup") {
      target.roll += Math.sin(t * 38) * 0.008 * frame.rotor;
    }

    // ---- damp toward the target
    const c = cur.current;
    const lam = cfg.lambda;
    for (let i = 0; i < KEYS.length; i++) {
      const k = KEYS[i];
      c[k] = damp(c[k], target[k], lam, dt);
    }

    // ---- ground contact / hover
    let rootY: number;
    if (cfg.ground) {
      rootY = groundRootY(c.hL, c.kL, c.hR, c.kR);
    } else {
      rootY = 0;
    }
    rootY += c.rootY + hop;
    if (mode === "fly" || mode === "liftoff") rootY += Math.sin(t * 2.3) * 0.035 * Math.max(fa, 0.3);
    r.inner.position.y = rootY;

    // ---- apply to joints
    r.body.rotation.x = c.pitch;
    r.body.rotation.z = c.roll;
    r.head.rotation.set(c.headPitch, c.headYaw, c.headRoll);
    r.armL?.rotation.set(c.aLx, 0, c.aLz);
    r.armR?.rotation.set(c.aRx, 0, c.aRz);
    r.elbowL?.rotation.set(c.eL, 0, 0);
    r.elbowR?.rotation.set(c.eR, 0, 0);
    r.hipL?.rotation.set(c.hL, 0, 0);
    r.hipR?.rotation.set(c.hR, 0, 0);
    r.kneeL?.rotation.set(c.kL, 0, 0);
    r.kneeR?.rotation.set(c.kR, 0, 0);
    // keep feet flat
    r.footL?.rotation.set(-(c.hL + c.kL), 0, 0);
    r.footR?.rotation.set(-(c.hR + c.kR), 0, 0);

    // ---- rotor
    const level = frame.rotor;
    spin.current += dt * level * 46;
    if (r.rotor) r.rotor.rotation.y = spin.current;
    mats.disc.opacity = level * 0.2;
    if (r.disc) r.disc.visible = level > 0.05;

    // ---- face
    const eyes = cfg.eyes;
    const blinkPhase = t % 3.7;
    const blink = blinkPhase < 0.14 ? 1 - Math.sin((Math.PI * blinkPhase) / 0.14) * 0.92 : 1;
    const big = eyes === "curious" ? 1.14 : 1;
    const lookX = eyes === "curious" ? Math.sin(t * 1.3) * 0.02 : 0;
    const happy = eyes === "happy";
    for (const side of ["L", "R"] as const) {
      const eye = side === "L" ? r.eyeL : r.eyeR;
      const round = side === "L" ? r.roundL : r.roundR;
      const arc = side === "L" ? r.happyL : r.happyR;
      if (!eye || !round || !arc) continue;
      round.visible = !happy;
      arc.visible = happy;
      eye.scale.set(big, happy ? 1 : blink * big, 1);
      eye.position.x = (side === "L" ? 0.115 : -0.115) + lookX;
    }
    if (r.led) (r.led.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(t * 3) * 0.3;

  });

  const set = <K extends keyof Refs>(k: K) => (o: Refs[K]) => {
    R.current[k] = o;
  };

  const arm = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    return (
      <group
        ref={set(`arm${s}` as "armL")}
        position={[side * D.shoulderX, D.shoulderY, 0]}
      >
        <mesh material={mats.blue}>
          <sphereGeometry args={[0.064, 20, 16]} />
        </mesh>
        <mesh position={[0, -D.upper / 2, 0]} material={mats.white}>
          <capsuleGeometry args={[0.044, D.upper - 0.088, 6, 14]} />
        </mesh>
        <group ref={set(`elbow${s}` as "elbowL")} position={[0, -D.upper, 0]}>
          <mesh material={mats.blue}>
            <sphereGeometry args={[0.046, 16, 12]} />
          </mesh>
          <mesh position={[0, -D.fore / 2 + 0.01, 0]} material={mats.white}>
            <capsuleGeometry args={[0.04, D.fore - 0.1, 6, 14]} />
          </mesh>
          <mesh position={[0, -D.fore, 0]} material={mats.white}>
            <sphereGeometry args={[0.058, 20, 16]} />
          </mesh>
          <mesh position={[0, -D.fore + 0.045, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.blue}>
            <torusGeometry args={[0.045, 0.012, 8, 20]} />
          </mesh>
        </group>
      </group>
    );
  };

  const leg = (side: 1 | -1) => {
    const s = side === 1 ? "L" : "R";
    return (
      <group ref={set(`hip${s}` as "hipL")} position={[side * D.hipX, D.hipY, 0]}>
        <mesh material={mats.blue}>
          <sphereGeometry args={[0.062, 16, 12]} />
        </mesh>
        <mesh position={[0, -D.thigh / 2, 0]} material={mats.white}>
          <capsuleGeometry args={[0.052, D.thigh - 0.104, 6, 14]} />
        </mesh>
        <group ref={set(`knee${s}` as "kneeL")} position={[0, -D.thigh, 0]}>
          <mesh material={mats.blue}>
            <sphereGeometry args={[0.054, 16, 12]} />
          </mesh>
          <mesh position={[0, -D.shin / 2, 0]} material={mats.white}>
            <capsuleGeometry args={[0.048, D.shin - 0.096, 6, 14]} />
          </mesh>
          <group ref={set(`foot${s}` as "footL")} position={[0, -D.shin, 0]}>
            <RoundedBox args={[0.14, D.footH, 0.22]} radius={0.028} smoothness={3} position={[0, -D.footH / 2, 0.045]} material={mats.white} />
            <mesh position={[0, -D.footH + 0.012, 0.045]} material={mats.blue}>
              <boxGeometry args={[0.142, 0.014, 0.222]} />
            </mesh>
          </group>
        </group>
      </group>
    );
  };

  return (
    <group ref={set("root")}>
      <group ref={set("inner")}>
        {/* legs live outside the body tilt group so the feet stay planted */}
        {leg(1)}
        {leg(-1)}

        <group ref={set("body")} position={[0, D.hipY, 0]}>
         <group position={[0, -D.hipY, 0]}>
          {/* torso */}
          <mesh position={[0, 0.58, 0]} material={mats.white}>
            <capsuleGeometry args={[0.19, 0.14, 8, 24]} />
          </mesh>
          {/* waist band */}
          <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.blue}>
            <torusGeometry args={[0.183, 0.016, 10, 40]} />
          </mesh>
          {/* chest panel + LED */}
          <RoundedBox args={[0.2, 0.13, 0.03]} radius={0.03} smoothness={4} position={[0, 0.6, 0.18]} material={mats.blue} />
          <mesh position={[0, 0.6, 0.197]} ref={(o) => { R.current.led = o; }}>
            <circleGeometry args={[0.028, 20]} />
            <meshBasicMaterial color="#bfe6ff" transparent opacity={0.8} toneMapped={false} />
          </mesh>

          {arm(1)}
          {arm(-1)}

          {/* head */}
          <group ref={set("head")} position={[0, D.headPivotY, 0]}>
            <mesh position={[0, D.headCenterY, 0]} scale={[1.18, 0.92, 1]} material={mats.white}>
              <sphereGeometry args={[0.33, 40, 32]} />
            </mesh>
            {/* black face screen */}
            <mesh position={[0, D.headCenterY, 0.2]} scale={[1.15, 0.82, 0.55]} material={mats.dark}>
              <sphereGeometry args={[0.26, 36, 28]} />
            </mesh>
            {/* eyes */}
            {([1, -1] as const).map((side) => (
              <group
                key={side}
                ref={set(side === 1 ? "eyeL" : "eyeR")}
                position={[side * 0.115, D.headCenterY + 0.015, 0.337]}
                rotation={[0, -side * 0.28, 0]}
              >
                <group ref={set(side === 1 ? "roundL" : "roundR")}>
                  <mesh material={mats.eye}>
                    <circleGeometry args={[0.062, 28]} />
                  </mesh>
                  <mesh position={[0, 0, -0.002]} material={mats.glow}>
                    <circleGeometry args={[0.1, 28]} />
                  </mesh>
                </group>
                <group ref={set(side === 1 ? "happyL" : "happyR")} visible={false}>
                  <mesh position={[0, -0.018, 0]} material={mats.eye}>
                    <ringGeometry args={[0.04, 0.07, 24, 1, 0, Math.PI]} />
                  </mesh>
                  <mesh position={[0, -0.018, -0.002]} material={mats.glow}>
                    <circleGeometry args={[0.1, 28]} />
                  </mesh>
                </group>
              </group>
            ))}
            {/* ear pods */}
            {([1, -1] as const).map((side) => (
              <group key={side} position={[side * 0.385, D.headCenterY, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh material={mats.blue}>
                  <cylinderGeometry args={[0.1, 0.1, 0.07, 28]} />
                </mesh>
                <mesh position={[0, side * 0.04, 0]} material={mats.white}>
                  <cylinderGeometry args={[0.055, 0.055, 0.02, 24]} />
                </mesh>
              </group>
            ))}
            {/* rotor assembly */}
            <mesh position={[0, D.headCenterY + 0.3, 0]} material={mats.blue}>
              <cylinderGeometry args={[0.07, 0.085, 0.04, 24]} />
            </mesh>
            <mesh position={[0, D.headCenterY + 0.37, 0]} material={mats.white}>
              <cylinderGeometry args={[0.022, 0.026, 0.12, 14]} />
            </mesh>
            <group ref={set("rotor")} position={[0, D.headCenterY + 0.44, 0]}>
              <mesh material={mats.blue}>
                <sphereGeometry args={[0.045, 16, 12]} />
              </mesh>
              <mesh material={mats.blade}>
                <boxGeometry args={[0.66, 0.012, 0.07]} />
              </mesh>
              <mesh position={[0.3, 0.001, 0]} material={mats.blue}>
                <boxGeometry args={[0.07, 0.013, 0.071]} />
              </mesh>
              <mesh position={[-0.3, 0.001, 0]} material={mats.blue}>
                <boxGeometry args={[0.07, 0.013, 0.071]} />
              </mesh>
            </group>
            <mesh
              position={[0, D.headCenterY + 0.44, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              material={mats.disc}
              ref={(o) => { R.current.disc = o; }}
              visible={false}
            >
              <circleGeometry args={[0.33, 40]} />
            </mesh>
          </group>
         </group>
        </group>
      </group>
    </group>
  );
}
