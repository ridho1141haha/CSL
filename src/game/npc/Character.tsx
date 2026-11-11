import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mobile } from '../mobile';
import { useSettings } from '../../stores/settingsStore';
import { lowSpecProfile } from '../quality';
import { acting, tickActing, type ActingState } from '../systems/acting';
import type { HoldKind } from '../../types';

export const BOOT_LOW = lowSpecProfile(useSettings.getState().quality, mobile.tier);

export type FigureAnim = {
  speed: number;
  run: boolean;
  attackT: number;
  block: boolean;
  hurtT: number;
  down: boolean;
  sit: boolean;
  crouch: boolean;
};

export const makeAnim = (): FigureAnim => ({
  speed: 0,
  run: false,
  attackT: -1,
  block: false,
  hurtT: -1,
  down: false,
  sit: false,
  crouch: false,
});

export type CharModelId = 'ren' | 'aris' | 'siti' | 'bimo' | 'budi';

export const CHAR_GLB_PATHS: Record<CharModelId, string> = {
  ren: '/models/csl_char_ren.glb',
  aris: '/models/csl_char_aris.glb',
  siti: '/models/csl_char_siti.glb',
  bimo: '/models/csl_char_bimo.glb',
  budi: '/models/csl_char_budi.glb',
};

type Props = {
  anim: MutableRefObject<FigureAnim>;
  color: string;
  accent: string;
  scale?: number;
  nameTag?: string;
  tag?: string;
  actId?: string;
  hold?: HoldKind;
  skin?: string;
  pants?: string;
  skirt?: string;
  hair?: { color: string; style: 'short' | 'wave' | 'ponytail' | 'buzz' };
  trim?: boolean;
  modelId?: CharModelId;
};

function resolveCharModelId(p: Props): CharModelId {
  if (p.modelId) return p.modelId;
  const id = (p.actId ?? '').toLowerCase();
  const name = (p.nameTag ?? '').toLowerCase();

  if (id === 'aris' || name.includes('aris')) return 'aris';
  if (id === 'siti' || name.includes('siti') || p.skirt || p.hair?.style === 'ponytail') return 'siti';
  if (id === 'bimo' || name.includes('bimo') || id.startsWith('bully') || id.startsWith('gang')) return 'bimo';
  if (id === 'budi' || name.includes('budi') || p.hair?.style === 'buzz') return 'budi';

  const c = p.color.toLowerCase();
  if (c === '#3b82f6') return 'aris';
  if (c === '#10b981') return 'siti';
  if (c === '#ef4444') return 'bimo';
  if (c === '#0ea5e9') return 'budi';

  return 'ren';
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function NameSprite({ text, tag, y = 1.95 }: { text: string; tag?: string; y?: number }) {
  const tex = useRef<THREE.CanvasTexture | null>(null);
  if (!tex.current && typeof document !== 'undefined') {
    const W = 512;
    const H = tag ? 148 : 112;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(10,13,20,0.72)';
    roundRect(g, 6, 6, W - 12, H - 12, 18);
    g.fill();
    g.strokeStyle = 'rgba(245,158,11,0.85)';
    g.lineWidth = 4;
    roundRect(g, 6, 6, W - 12, H - 12, 18);
    g.stroke();
    g.textAlign = 'center';
    g.fillStyle = '#f1f3f9';
    g.font = '700 56px "Space Grotesk", Arial, sans-serif';
    g.fillText(text, W / 2, tag ? 68 : 86);
    if (tag) {
      g.fillStyle = '#f59e0b';
      g.font = '600 34px "JetBrains Mono", monospace';
      g.fillText(tag, W / 2, 122);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    tex.current = t;
  }
  const w = 1.35;
  const h = tag ? 0.42 : 0.34;
  return (
    <sprite position={[0, y, 0]} scale={[w, h, 1]}>
      <spriteMaterial map={tex.current ?? undefined} transparent depthTest={false} />
    </sprite>
  );
}

function HoldProp({ kind, cylSeg, atForearm }: { kind: HoldKind; cylSeg: number; atForearm: boolean }) {
  // If mounted on ForeArmR (elbow y ≈ -0.22), shift y by +0.22 so the hand offset matches
  const dy = atForearm ? 0.22 : 0;
  const dx = atForearm ? -0.07 : 0;
  const hand: [number, number, number] = [dx, -0.42 + dy, 0.03];
  if (kind === 'pencil') {
    return (
      <group position={hand} rotation={[1.25, 0, 0.2]}>
        <mesh castShadow position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.17, 8]} />
          <meshStandardMaterial color="#e8a33d" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.115, 0]}>
          <coneGeometry args={[0.011, 0.03, 8]} />
          <meshStandardMaterial color="#d9c9a3" roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (kind === 'eraser') {
    return (
      <group position={hand}>
        <mesh castShadow>
          <boxGeometry args={[0.055, 0.024, 0.036]} />
          <meshStandardMaterial color="#eef2f7" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0, -0.012]}>
          <boxGeometry args={[0.056, 0.025, 0.014]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.55} />
        </mesh>
      </group>
    );
  }
  if (kind === 'book') {
    return (
      <group position={[0.02 + dx, -0.4 + dy, 0.12]} rotation={[0.55, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.026, 0.17]} />
          <meshStandardMaterial color="#5a4a35" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.004, 0.004]}>
          <boxGeometry args={[0.215, 0.02, 0.15]} />
          <meshStandardMaterial color="#e7dcc3" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.016, 0]}>
          <boxGeometry args={[0.012, 0.024, 0.172]} />
          <meshStandardMaterial color="#3f352a" roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (kind === 'map') {
    return (
      <group position={[0.01 + dx, -0.38 + dy, 0.1]} rotation={[0.5, 0, 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.012, 0.34]} />
          <meshStandardMaterial color="#b3282d" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.008, 0]}>
          <boxGeometry args={[0.225, 0.004, 0.3]} />
          <meshStandardMaterial color="#f1e8d8" roughness={0.85} />
        </mesh>
      </group>
    );
  }
  if (kind === 'stack') {
    return (
      <group position={[0.05 + dx, -0.38 + dy, 0.14]} rotation={[0.35, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.05, 0.22]} />
          <meshStandardMaterial color="#d9c9a3" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.015, 0.05, 0.01]} rotation={[0, 0.12, 0]}>
          <boxGeometry args={[0.28, 0.045, 0.2]} />
          <meshStandardMaterial color="#5a7ea0" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.01, 0.092, -0.01]} rotation={[0, -0.08, 0]}>
          <boxGeometry args={[0.26, 0.04, 0.19]} />
          <meshStandardMaterial color="#6b8f6a" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (kind === 'bottle') {
    return (
      <group position={hand}>
        <mesh castShadow position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.042, 0.046, 0.2, cylSeg]} />
          <meshStandardMaterial color="#8ec7e8" roughness={0.15} metalness={0.1} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.035, 8]} />
          <meshStandardMaterial color="#2f6db1" roughness={0.5} />
        </mesh>
      </group>
    );
  }
  return (
    <group position={[0.005 + dx, -0.4 + dy, 0.05]} rotation={[0.35, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.078, 0.155, 0.012]} />
        <meshStandardMaterial color="#11151c" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.066, 0.135, 0.004]} />
        <meshStandardMaterial color="#7fb7d9" emissive="#9fd3ef" emissiveIntensity={0.55} roughness={0.25} />
      </mesh>
    </group>
  );
}

export function Figure(props: Props) {
  const { anim, scale = 1, nameTag, tag, actId, hold } = props;
  const root = useRef<THREE.Group>(null);
  const armRMount = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const wp = useRef(new THREE.Vector3());
  const poseT = useRef({ sit: 0, crouch: 0, move: 0, runMix: 0 });

  const charId = resolveCharModelId(props);
  const { scene } = useGLTF(CHAR_GLB_PATHS[charId]);
  const SH = !mobile.lowSpec;

  const { cloned, joints } = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = SH;
        m.receiveShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace;
          mat.needsUpdate = true;
        }
      }
    });
    const torso = clone.getObjectByName('Torso') ?? null;
    return {
      cloned: clone,
      joints: {
        torso,
        torsoBaseY: torso ? torso.position.y : 1.0,
        head: clone.getObjectByName('Head') ?? null,
        mouth: clone.getObjectByName('Mouth') ?? null,
        armL: clone.getObjectByName('ArmL') ?? null,
        armR: clone.getObjectByName('ArmR') ?? null,
        foreArmL: clone.getObjectByName('ForeArmL') ?? null,
        foreArmR: clone.getObjectByName('ForeArmR') ?? null,
        legL: clone.getObjectByName('LegL') ?? null,
        legR: clone.getObjectByName('LegR') ?? null,
        shinL: clone.getObjectByName('ShinL') ?? null,
        shinR: clone.getObjectByName('ShinR') ?? null,
      },
    };
  }, [scene, SH]);

  // Attach HoldProp to ForeArmR if available, otherwise ArmR
  useEffect(() => {
    const mount = armRMount.current;
    const targetJoint = joints.foreArmR ?? joints.armR;
    if (mount && targetJoint) {
      targetJoint.add(mount);
      return () => {
        targetJoint.remove(mount);
      };
    }
  }, [joints]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const a = anim.current;
    if (!root.current) return;
    const g = root.current;
    if (!g.visible || (g.parent && !g.parent.visible)) return;

    const damp = 1 - Math.exp(-12 * dt);

    // 1. Knocked down state
    if (a.down) {
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -Math.PI / 2.15, 0.14);
      g.position.y = THREE.MathUtils.lerp(g.position.y, 0.12, 0.14);
      return;
    }
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0, 0.22);

    // 2. Smooth pose & locomotion blends
    const p = poseT.current;
    const movingTarget = a.speed > 0.15 ? 1 : 0;
    const runTarget = a.run && a.speed > 3.8 ? 1 : 0;
    p.sit = THREE.MathUtils.lerp(p.sit, a.sit ? 1 : 0, 1 - Math.exp(-9 * dt));
    p.crouch = THREE.MathUtils.lerp(p.crouch, !a.sit && a.crouch ? 1 : 0, 1 - Math.exp(-9 * dt));
    p.move = THREE.MathUtils.lerp(p.move, movingTarget, 1 - Math.exp(-10 * dt));
    p.runMix = THREE.MathUtils.lerp(p.runMix, runTarget, 1 - Math.exp(-8 * dt));

    const stanceMask = 1 - Math.max(p.sit, p.crouch);

    // Vertical root offset for sitting / crouching
    g.position.y = THREE.MathUtils.lerp(
      g.position.y,
      -0.18 * p.sit - 0.28 * p.crouch,
      1 - Math.exp(-10 * dt),
    );

    // 3. Phase advance (natural gait cadence)
    const moving = a.speed > 0.15;
    const cadence = THREE.MathUtils.lerp(7.2, 10.8, p.runMix);
    const speedRatio = moving ? Math.max(0.45, Math.min(1.35, a.speed / (a.run ? 5.2 : 3.2))) : 0;
    phase.current += dt * (moving ? cadence * speedRatio : 1.7);
    const ph = phase.current;

    // 4. Dialogue acting & gestures
    let act: ActingState | undefined;
    if (actId) {
      act = acting[actId];
      if (act) tickActing(act, dt, moving || p.sit > 0.5 || p.crouch > 0.5);
    }

    let gLx = 0, gLz = 0, gRx = 0, gRz = 0;
    let gForeL = 0, gForeR = 0;
    if (act && act.gesture >= 0 && !moving && p.sit < 0.5 && p.crouch < 0.5) {
      const env = Math.sin(Math.min(1, act.gestureT) * Math.PI) * act.energy;
      if (act.gesture === 0) {
        gRx = -0.35 * env;
        gRz = 0.22 * env;
        gForeR = -0.55 * env;
      } else if (act.gesture === 1) {
        gRx = -0.55 * env;
        gForeR = -0.65 * env;
      } else {
        gLx = -0.45 * env;
        gLz = 0.32 * env;
        gForeL = -0.6 * env;
      }
    }

    // 5. Realistic Two-Segment Leg Kinematics (Thigh + Knee/Shin)
    // In GLB local space (+Z forward, -Y down):
    //   rotation.x < 0 swings limb FORWARD (flexes hip)
    //   rotation.x > 0 swings limb BACKWARD (extends hip / bends knee backward)
    const strideAmp = THREE.MathUtils.lerp(0.52, 0.86, p.runMix) * p.move * stanceMask;
    const idleSway = Math.sin(ph * 0.6) * 0.025 * (1 - p.move) * stanceMask;

    // Left and right leg phases (opposite by PI)
    const sinL = Math.sin(ph);
    const sinR = Math.sin(ph + Math.PI);
    const cosL = Math.cos(ph);
    const cosR = Math.cos(ph + Math.PI);

    // Asymmetric thigh curve: slightly higher forward knee-lift than backward push
    const thighWalkL = (-sinL * strideAmp - Math.max(0, sinL) * 0.12 * p.runMix * p.move) + idleSway;
    const thighWalkR = (-sinR * strideAmp - Math.max(0, sinR) * 0.12 * p.runMix * p.move) - idleSway;

    // Sitting: thighs raised ~82 deg forward (-1.42 rad); Crouching: thighs raised ~52 deg (-0.90 rad)
    const thighPose = p.sit * -1.42 + p.crouch * -0.90;
    const targetLegLX = thighPose + thighWalkL;
    const targetLegRX = thighPose + thighWalkR;

    // Knee flexion (ShinL/R rotation.x >= 0 bends shin backward):
    // During walk/run, knee bends mainly during forward swing (cos > 0) and push-off
    const kneeAmp = THREE.MathUtils.lerp(0.68, 1.22, p.runMix) * p.move * stanceMask;
    const kneeWalkL = Math.max(0, cosL * 0.75 + Math.max(0, -sinL) * 0.45) * kneeAmp + 0.05 * stanceMask;
    const kneeWalkR = Math.max(0, cosR * 0.75 + Math.max(0, -sinR) * 0.45) * kneeAmp + 0.05 * stanceMask;

    // Sitting: shins bend +1.42 rad so lower legs hang vertically down!
    // Crouching: shins bend +1.55 rad for deep natural squat
    const kneePose = p.sit * 1.42 + p.crouch * 1.55;
    const targetShinLX = kneePose + kneeWalkL;
    const targetShinRX = kneePose + kneeWalkR;

    if (joints.legL) {
      joints.legL.rotation.x = THREE.MathUtils.lerp(joints.legL.rotation.x, targetLegLX, damp);
      joints.legL.rotation.z = THREE.MathUtils.lerp(joints.legL.rotation.z, p.crouch * -0.08, damp);
    }
    if (joints.legR) {
      joints.legR.rotation.x = THREE.MathUtils.lerp(joints.legR.rotation.x, targetLegRX, damp);
      joints.legR.rotation.z = THREE.MathUtils.lerp(joints.legR.rotation.z, p.crouch * 0.08, damp);
    }
    if (joints.shinL) {
      joints.shinL.rotation.x = THREE.MathUtils.lerp(joints.shinL.rotation.x, targetShinLX, damp);
    }
    if (joints.shinR) {
      joints.shinR.rotation.x = THREE.MathUtils.lerp(joints.shinR.rotation.x, targetShinRX, damp);
    }

    // 6. Realistic Two-Segment Arm Kinematics (Shoulder + Elbow/ForeArm)
    const atk = a.attackT >= 0 ? Math.sin(Math.min(1, a.attackT) * Math.PI) : 0;
    const hurt = a.hurtT >= 0 ? Math.sin(Math.min(1, a.hurtT) * Math.PI) : 0;
    const twoHand = hold === 'stack' || hold === 'book' || hold === 'map';

    // Opposite arm counter-swing: when Left leg swings forward (sinL > 0), Right arm swings forward
    const armSwingAmp = THREE.MathUtils.lerp(0.38, 0.72, p.runMix) * p.move * stanceMask;
    const armWalkL = sinL * armSwingAmp; // swings forward when sinL < 0 (Right leg forward)
    const armWalkR = sinR * armSwingAmp; // swings forward when sinR < 0 (Left leg forward)

    // Natural elbow flexion (ForeArm rotation.x <= 0 bends forearm forward/upward)
    const baseElbow = THREE.MathUtils.lerp(-0.22, -1.05, p.runMix) * p.move - 0.14 * (1 - p.move);
    const elbowWalkL = (baseElbow - Math.max(0, -sinL) * 0.35 * p.move) * stanceMask;
    const elbowWalkR = (baseElbow - Math.max(0, -sinR) * 0.35 * p.move) * stanceMask;

    const armPoseX = p.sit * -0.35 + p.crouch * -0.45;
    const elbowPoseX = p.sit * -0.85 + p.crouch * -0.75;

    // Left Arm + ForeArm
    if (joints.armL) {
      let targetArmLX = armPoseX + armWalkL + gLx;
      let targetArmLZ = 0.04 * (1 - p.move) + gLz;
      let targetForeLX = elbowPoseX + elbowWalkL + gForeL;

      if (a.block) {
        targetArmLX = -1.15;
        targetArmLZ = 0.42;
        targetForeLX = -1.25;
      } else if (atk > 0) {
        // Guard hand pulls back slightly during right-hand punch
        targetArmLX = -0.45 - atk * 0.25;
        targetArmLZ = 0.25;
        targetForeLX = -1.15;
      } else if (twoHand) {
        targetArmLX = -0.45;
        targetArmLZ = 0.18;
        targetForeLX = -0.85;
      }

      joints.armL.rotation.x = THREE.MathUtils.lerp(joints.armL.rotation.x, targetArmLX, damp);
      joints.armL.rotation.z = THREE.MathUtils.lerp(joints.armL.rotation.z, targetArmLZ, damp);
      if (joints.foreArmL) {
        joints.foreArmL.rotation.x = THREE.MathUtils.lerp(joints.foreArmL.rotation.x, targetForeLX, damp);
      }
    }

    // Right Arm + ForeArm
    if (joints.armR) {
      let targetArmRX = armPoseX + armWalkR + gRx;
      let targetArmRZ = -0.04 * (1 - p.move) + gRz;
      let targetForeRX = elbowPoseX + elbowWalkR + gForeR;

      if (atk > 0) {
        // Snappy punch extension: shoulder drives forward (-1.45), elbow snaps straight (-0.15) at peak
        targetArmRX = -0.55 - atk * 1.05;
        targetArmRZ = -0.12 * (1 - atk);
        targetForeRX = -1.1 * (1 - atk) - 0.12 * atk;
      } else if (a.block) {
        targetArmRX = -1.15;
        targetArmRZ = -0.42;
        targetForeRX = -1.25;
      } else if (hold === 'phone') {
        targetArmRX = -0.48;
        targetArmRZ = -0.15;
        targetForeRX = -1.12;
      } else if (twoHand) {
        targetArmRX = -0.45;
        targetArmRZ = -0.18;
        targetForeRX = -0.85;
      } else if (hold) {
        targetArmRX = armPoseX + armWalkR * 0.5 - 0.25;
        targetForeRX = -0.65;
      }

      joints.armR.rotation.x = THREE.MathUtils.lerp(joints.armR.rotation.x, targetArmRX, damp);
      joints.armR.rotation.z = THREE.MathUtils.lerp(joints.armR.rotation.z, targetArmRZ, damp);
      if (joints.foreArmR) {
        joints.foreArmR.rotation.x = THREE.MathUtils.lerp(joints.foreArmR.rotation.x, targetForeRX, damp);
      }
    }

    // 7. Torso Counter-Rotation, Forward Lean, Hurt Recoil & Correct Base Height (1.0m)
    if (joints.torso) {
      const lean = act && act.talking && !moving ? 0.05 * act.energy : 0;
      const walkTwistY = -sinL * THREE.MathUtils.lerp(0.09, 0.16, p.runMix) * p.move * stanceMask;
      const idleTwistY = Math.sin(ph * 0.55) * 0.025 * (1 - p.move);
      const attackTwistY = atk > 0 ? atk * 0.38 : 0;

      const forwardLean =
        hurt > 0
          ? -hurt * 0.38
          : atk > 0
            ? atk * 0.24
            : p.crouch * 0.38 + p.sit * 0.04 + p.move * THREE.MathUtils.lerp(0.06, 0.18, p.runMix) + lean;

      const lateralSwayZ = Math.cos(ph) * 0.028 * p.move * stanceMask;

      // Double-frequency vertical bob (2 steps per cycle) anchored at exact GLB rest height (1.0m)
      const walkBob = -Math.abs(Math.cos(ph)) * THREE.MathUtils.lerp(0.032, 0.062, p.runMix) * p.move * stanceMask;
      const breathBob = Math.sin(ph * 0.65) * 0.007 * (1 - p.move);

      joints.torso.rotation.y = THREE.MathUtils.lerp(
        joints.torso.rotation.y,
        walkTwistY + idleTwistY + attackTwistY,
        damp,
      );
      joints.torso.rotation.x = THREE.MathUtils.lerp(joints.torso.rotation.x, forwardLean, damp);
      joints.torso.rotation.z = THREE.MathUtils.lerp(joints.torso.rotation.z, lateralSwayZ, damp);
      joints.torso.position.y = THREE.MathUtils.lerp(
        joints.torso.position.y,
        joints.torsoBaseY + walkBob + breathBob,
        damp,
      );
    }

    // 8. Head Stabilization, Gaze Tracking & Nodding
    if (joints.head) {
      let targetHeadY = moving ? (joints.torso ? -joints.torso.rotation.y * 0.45 : 0) : Math.sin(ph * 0.35) * 0.12;
      if (act && !Number.isNaN(act.gazeX)) {
        g.getWorldPosition(wp.current);
        const desired = Math.atan2(act.gazeX - wp.current.x, act.gazeZ - wp.current.z);
        const parentYaw = g.parent?.rotation.y ?? 0;
        let local = desired - parentYaw;
        local = Math.atan2(Math.sin(local), Math.cos(local));
        const clamped = THREE.MathUtils.clamp(local, -0.65, 0.65);
        const sway = moving ? 0 : Math.sin(ph * 0.35) * 0.03;
        targetHeadY = clamped + sway;
      }
      joints.head.rotation.y = THREE.MathUtils.lerp(joints.head.rotation.y, targetHeadY, 1 - Math.exp(-8 * dt));

      const nodX = act && act.nodT >= 0 ? Math.sin(act.nodT * Math.PI * 2) * 0.1 * (0.5 + act.energy * 0.5) : 0;
      const counterLeanX = moving ? -0.05 * p.runMix : 0;
      joints.head.rotation.x = THREE.MathUtils.lerp(
        joints.head.rotation.x,
        nodX + counterLeanX - hurt * 0.25,
        1 - Math.exp(-10 * dt),
      );
    }

    // 9. Lip-sync Mouth Animation
    if (joints.mouth) {
      const open = act && act.talking && !moving ? Math.abs(Math.sin(act.talkPhase)) * 2.1 * act.energy : 0;
      joints.mouth.scale.y = THREE.MathUtils.lerp(joints.mouth.scale.y, 1 + open, 1 - Math.exp(-14 * dt));
    }
  });

  return (
    <group ref={root} scale={scale}>
      <primitive object={cloned} />
      <group ref={armRMount}>
        {hold && <HoldProp kind={hold} cylSeg={BOOT_LOW ? 6 : 10} atForearm={!!joints.foreArmR} />}
      </group>
      {nameTag && <NameSprite text={nameTag} tag={tag} />}
    </group>
  );
}

useGLTF.preload(CHAR_GLB_PATHS.ren);
useGLTF.preload(CHAR_GLB_PATHS.aris);
useGLTF.preload(CHAR_GLB_PATHS.siti);
useGLTF.preload(CHAR_GLB_PATHS.bimo);
useGLTF.preload(CHAR_GLB_PATHS.budi);
