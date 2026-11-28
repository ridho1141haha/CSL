import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mobile } from '../mobile';
import { useSettings } from '../../stores/settingsStore';
import { lowSpecProfile } from '../quality';
import { acting, tickActing, type ActingState } from '../systems/acting';
import { retargetMixamoClip } from './retarget';

export const ANIM_GLB_PATH = '/models/csl_animations.glb';
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

export type CharModelId = 'ren' | 'aris' | 'siti' | 'bimo' | 'budi' | 'npc_male' | 'npc_female';

export const CHAR_GLB_PATHS: Record<CharModelId, string> = {
  ren: '/models/csl_char_ren.glb',
  aris: '/models/csl_char_aris.glb',
  siti: '/models/csl_char_siti.glb',
  bimo: '/models/csl_char_bimo.glb',
  budi: '/models/csl_char_budi.glb',
  npc_male: '/models/csl_char_npc_male.glb',
  npc_female: '/models/csl_char_npc_female.glb',
};

// Target reference height (meters) matching legacy character scale & camera framing
const TARGET_CHAR_HEIGHT = 1.65;

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

  if (id === 'ren' || name === 'ren') return 'ren';
  if (id === 'aris' || name.includes('aris')) return 'aris';
  if (id === 'siti' || name.includes('siti')) return 'siti';
  if (id === 'bimo' || name.includes('bimo')) return 'bimo';
  if (id === 'budi' || name.includes('budi') || p.hair?.style === 'buzz') return 'budi';

  if (
    id.startsWith('bully') ||
    id.startsWith('gang') ||
    id.startsWith('follower') ||
    id.startsWith('letnan') ||
    id.startsWith('rival') ||
    id.startsWith('secret_goon')
  ) {
    return 'npc_male';
  }
  if (p.skirt || p.hair?.style === 'ponytail') return 'npc_female';

  const c = p.color.toLowerCase();
  if (c === '#3b82f6') return 'aris';
  if (c === '#10b981') return 'siti';
  if (c === '#ef4444') return 'bimo';
  if (c === '#0ea5e9') return 'budi';

  return 'npc_male';
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

function HoldProp({
  kind,
  cylSeg,
  atForearm,
  isVrmHand,
}: {
  kind: HoldKind;
  cylSeg: number;
  atForearm: boolean;
  isVrmHand: boolean;
}) {
  // For VRoid J_Bip_R_Hand, hand is at local origin (0, 0, 0)
  const dy = isVrmHand ? 0.42 : atForearm ? 0.22 : 0;
  const dx = isVrmHand ? -0.05 : atForearm ? -0.07 : 0;
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

type VrmBoneRest = {
  node: THREE.Object3D;
  restQuat: THREE.Quaternion;
  restPos: THREE.Vector3;
};

type VrmFaceMorph = {
  mesh: THREE.Mesh;
  mouthIdx: number;
  blinkIdx: number;
};

function captureBone(root: THREE.Object3D, name: string): VrmBoneRest | null {
  const node = root.getObjectByName(name);
  if (!node) return null;
  return {
    node,
    restQuat: node.quaternion.clone(),
    restPos: node.position.clone(),
  };
}

// Reusable scratch math objects (zero per-frame GC churn)
const _qSwing = new THREE.Quaternion();
const _qDrop = new THREE.Quaternion();
const _qTarget = new THREE.Quaternion();
const _euler = new THREE.Euler();

function applyBoneEuler(
  b: VrmBoneRest | null,
  rx: number,
  ry: number,
  rz: number,
  damp: number,
  dropZ = 0,
) {
  if (!b) return;
  _euler.set(rx, ry, rz, 'YXZ');
  _qSwing.setFromEuler(_euler);
  if (dropZ !== 0) {
    _euler.set(0, 0, dropZ, 'XYZ');
    _qDrop.setFromEuler(_euler);
    _qTarget.copy(b.restQuat).multiply(_qSwing).multiply(_qDrop);
  } else {
    _qTarget.copy(b.restQuat).multiply(_qSwing);
  }
  b.node.quaternion.slerp(_qTarget, damp);
}

export function Figure(props: Props) {
  const { anim, scale = 1, nameTag, tag, actId, hold } = props;
  const root = useRef<THREE.Group>(null);
  const armRMount = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const blinkTimer = useRef(2.0 + Math.random() * 3.0);
  const wp = useRef(new THREE.Vector3());
  const poseT = useRef({ sit: 0, crouch: 0, move: 0, runMix: 0 });

  const charId = resolveCharModelId(props);
  const { scene } = useGLTF(CHAR_GLB_PATHS[charId]);
  const animGltf = useGLTF(ANIM_GLB_PATH);
  const SH = !mobile.lowSpec;
  const activeClip = useRef<string | null>(null);

  const { cloned, normScale, isVrm, vrm, legacy, faceMorph, mixer, actions } = useMemo(() => {
    const clone = cloneSkinned(scene);
    let foundMorph: VrmFaceMorph | null = null;
    const bbox = new THREE.Box3();

    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = SH;
        m.receiveShadow = true;
        m.frustumCulled = false; // SkinnedMesh bounds can drift during animation
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const rawMat of mats) {
          const mat = rawMat as THREE.MeshStandardMaterial;
          if (mat && mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace;
            mat.needsUpdate = true;
          }
        }
        if (!foundMorph && m.morphTargetDictionary && m.morphTargetInfluences) {
          const mouthIdx =
            m.morphTargetDictionary['Fcl_MTH_A'] ??
            m.morphTargetDictionary['aa'] ??
            -1;
          const blinkIdx =
            m.morphTargetDictionary['Fcl_EYE_Close'] ??
            m.morphTargetDictionary['blink'] ??
            -1;
          if (mouthIdx >= 0 || blinkIdx >= 0) {
            foundMorph = { mesh: m, mouthIdx, blinkIdx };
          }
        }
      }
    });

    const hips = captureBone(clone, 'J_Bip_C_Hips');
    const isVrmRig = !!hips;

    let computedNormScale = 1;
    if (isVrmRig) {
      clone.updateMatrixWorld(true);
      bbox.setFromObject(clone);
      const h = bbox.max.y - bbox.min.y;
      if (h > 0.5 && h < 3.0) {
        computedNormScale = TARGET_CHAR_HEIGHT / h;
      }
    }

    const vrmBones = isVrmRig
      ? {
          hips,
          spine: captureBone(clone, 'J_Bip_C_Spine'),
          chest: captureBone(clone, 'J_Bip_C_Chest'),
          head: captureBone(clone, 'J_Bip_C_Head'),
          upperArmL: captureBone(clone, 'J_Bip_L_UpperArm'),
          upperArmR: captureBone(clone, 'J_Bip_R_UpperArm'),
          lowerArmL: captureBone(clone, 'J_Bip_L_LowerArm'),
          lowerArmR: captureBone(clone, 'J_Bip_R_LowerArm'),
          handR: clone.getObjectByName('J_Bip_R_Hand') ?? null,
          upperLegL: captureBone(clone, 'J_Bip_L_UpperLeg'),
          upperLegR: captureBone(clone, 'J_Bip_R_UpperLeg'),
          lowerLegL: captureBone(clone, 'J_Bip_L_LowerLeg'),
          lowerLegR: captureBone(clone, 'J_Bip_R_LowerLeg'),
        }
      : null;

    const torso = clone.getObjectByName('Torso') ?? null;
    const legacyJoints = {
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
    };

    let animMixer: THREE.AnimationMixer | null = null;
    const actionMap: Record<string, THREE.AnimationAction> = {};
    if (isVrmRig && animGltf.animations?.length) {
      animMixer = new THREE.AnimationMixer(clone);
      for (const rawClip of animGltf.animations) {
        const retargeted = retargetMixamoClip(rawClip, animGltf.scene, clone);
        if (retargeted.tracks.length > 0) {
          const action = animMixer.clipAction(retargeted);
          if (rawClip.name === 'punch' || rawClip.name === 'cross_punch_bimo' || rawClip.name === 'cross_punch_mc' || rawClip.name === 'nod') {
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = false;
          } else {
            action.setLoop(THREE.LoopRepeat, Infinity);
          }
          actionMap[rawClip.name] = action;
        }
      }
    }

    return {
      cloned: clone,
      normScale: computedNormScale,
      isVrm: isVrmRig,
      vrm: vrmBones,
      legacy: legacyJoints,
      faceMorph: foundMorph as VrmFaceMorph | null,
      mixer: animMixer,
      actions: actionMap,
    };
  }, [scene, animGltf, SH]);

  useEffect(() => {
    activeClip.current = null;
    return () => {
      mixer?.stopAllAction();
    };
  }, [mixer]);

  // Attach HoldProp to J_Bip_R_Hand (VRoid) or ForeArmR/ArmR (legacy)
  useEffect(() => {
    const mount = armRMount.current;
    const targetJoint = isVrm
      ? (vrm?.handR ?? vrm?.lowerArmR?.node ?? null)
      : (legacy.foreArmR ?? legacy.armR);
    if (mount && targetJoint) {
      targetJoint.add(mount);
      return () => {
        targetJoint.remove(mount);
      };
    }
  }, [isVrm, vrm, legacy]);

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

    // 4. Dialogue acting & gestures (Talking.fbx-inspired upper-body motion)
    let act: ActingState | undefined;
    if (actId) {
      act = acting[actId];
      if (act) tickActing(act, dt, moving || p.sit > 0.5 || p.crouch > 0.5);
    }

    let gLx = 0, gLz = 0, gRx = 0, gRz = 0;
    let gForeL = 0, gForeR = 0;
    if (act && !moving && p.sit < 0.5 && p.crouch < 0.5) {
      if (act.gesture >= 0) {
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
      } else if (act.talking) {
        // Subtle continuous talking cadence for natural conversation
        const talkWave = Math.sin(act.talkPhase * 0.45) * 0.14 * act.energy;
        gRx = -0.18 + talkWave;
        gForeR = -0.35 - Math.abs(talkWave);
        gLx = -0.1 - talkWave * 0.6;
        gForeL = -0.25;
      }
    }

    // 5. Shared kinematics targets
    const strideAmp = THREE.MathUtils.lerp(0.52, 0.86, p.runMix) * p.move * stanceMask;
    const idleSway = Math.sin(ph * 0.6) * 0.025 * (1 - p.move) * stanceMask;

    const sinL = Math.sin(ph);
    const sinR = Math.sin(ph + Math.PI);
    const cosL = Math.cos(ph);
    const cosR = Math.cos(ph + Math.PI);

    const thighWalkL = (-sinL * strideAmp - Math.max(0, sinL) * 0.12 * p.runMix * p.move) + idleSway;
    const thighWalkR = (-sinR * strideAmp - Math.max(0, sinR) * 0.12 * p.runMix * p.move) - idleSway;
    const thighPose = p.sit * -1.42 + p.crouch * -0.90;
    const targetLegLX = thighPose + thighWalkL;
    const targetLegRX = thighPose + thighWalkR;

    const kneeAmp = THREE.MathUtils.lerp(0.68, 1.22, p.runMix) * p.move * stanceMask;
    const kneeWalkL = Math.max(0, cosL * 0.75 + Math.max(0, -sinL) * 0.45) * kneeAmp + 0.05 * stanceMask;
    const kneeWalkR = Math.max(0, cosR * 0.75 + Math.max(0, -sinR) * 0.45) * kneeAmp + 0.05 * stanceMask;
    const kneePose = p.sit * 1.42 + p.crouch * 1.55;
    const targetShinLX = kneePose + kneeWalkL;
    const targetShinRX = kneePose + kneeWalkR;

    const atk = a.attackT >= 0 ? Math.sin(Math.min(1, a.attackT) * Math.PI) : 0;
    const hurt = a.hurtT >= 0 ? Math.sin(Math.min(1, a.hurtT) * Math.PI) : 0;
    const twoHand = hold === 'stack' || hold === 'book' || hold === 'map';

    const armSwingAmp = THREE.MathUtils.lerp(0.38, 0.72, p.runMix) * p.move * stanceMask;
    const armWalkL = sinL * armSwingAmp;
    const armWalkR = sinR * armSwingAmp;

    const baseElbow = THREE.MathUtils.lerp(-0.22, -1.05, p.runMix) * p.move - 0.14 * (1 - p.move);
    const elbowWalkL = (baseElbow - Math.max(0, -sinL) * 0.35 * p.move) * stanceMask;
    const elbowWalkR = (baseElbow - Math.max(0, -sinR) * 0.35 * p.move) * stanceMask;

    const armPoseX = p.sit * -0.35 + p.crouch * -0.45;
    const elbowPoseX = p.sit * -0.85 + p.crouch * -0.75;

    let targetArmLX = armPoseX + armWalkL + gLx;
    let targetArmLZ = 0.04 * (1 - p.move) + gLz;
    let targetForeLX = elbowPoseX + elbowWalkL + gForeL;
    if (a.block) {
      targetArmLX = -1.15;
      targetArmLZ = 0.42;
      targetForeLX = -1.25;
    } else if (atk > 0) {
      targetArmLX = -0.45 - atk * 0.25;
      targetArmLZ = 0.25;
      targetForeLX = -1.15;
    } else if (twoHand) {
      targetArmLX = -0.45;
      targetArmLZ = 0.18;
      targetForeLX = -0.85;
    }

    let targetArmRX = armPoseX + armWalkR + gRx;
    let targetArmRZ = -0.04 * (1 - p.move) + gRz;
    let targetForeRX = elbowPoseX + elbowWalkR + gForeR;
    if (atk > 0) {
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

    const lean = act && act.talking && !moving ? 0.05 * act.energy : 0;
    const walkTwistY = -sinL * THREE.MathUtils.lerp(0.09, 0.16, p.runMix) * p.move * stanceMask;
    const idleTwistY = Math.sin(ph * 0.55) * 0.025 * (1 - p.move);
    const attackTwistY = atk > 0 ? atk * 0.38 : 0;
    const torsoTwistY = walkTwistY + idleTwistY + attackTwistY;

    const forwardLean =
      hurt > 0
        ? -hurt * 0.38
        : atk > 0
          ? atk * 0.24
          : p.crouch * 0.38 + p.sit * 0.04 + p.move * THREE.MathUtils.lerp(0.06, 0.18, p.runMix) + lean;

    const lateralSwayZ = Math.cos(ph) * 0.028 * p.move * stanceMask;
    const walkBob = -Math.abs(Math.cos(ph)) * THREE.MathUtils.lerp(0.032, 0.062, p.runMix) * p.move * stanceMask;
    const breathBob = Math.sin(ph * 0.65) * 0.007 * (1 - p.move);

    let targetHeadY = moving ? -torsoTwistY * 0.45 : Math.sin(ph * 0.35) * 0.12;
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
    const nodX = act && act.nodT >= 0 ? Math.sin(act.nodT * Math.PI * 2) * 0.1 * (0.5 + act.energy * 0.5) : 0;
    const counterLeanX = moving ? -0.05 * p.runMix : 0;
    const targetHeadX = nodX + counterLeanX - hurt * 0.25;

    // 6. Apply kinematics to VRoid Humanoid Rig OR Legacy Node Rig
    if (isVrm && vrm) {
      // Choose retargeted Mixamo clip when applicable (stand / sit / explain / nod / punch)
      let desiredClip: string | null = null;
      if (mixer) {
        if (a.attackT >= 0) {
          desiredClip =
            charId === 'bimo' && actions['cross_punch_bimo']
              ? 'cross_punch_bimo'
              : charId === 'ren' && actions['cross_punch_mc']
                ? 'cross_punch_mc'
                : actions['punch']
                  ? 'punch'
                  : null;
        } else if (a.sit && actions['sit']) {
          desiredClip = 'sit';
        } else if (!moving && !a.crouch && !a.block && a.hurtT < 0) {
          if (act && act.nodT >= 0 && actions['nod']) {
            desiredClip = 'nod';
          } else if (act && act.talking && actions['explain']) {
            desiredClip = 'explain';
          } else if (actions['stand']) {
            desiredClip = 'stand';
          }
        }
      }

      if (mixer && desiredClip && actions[desiredClip]) {
        if (activeClip.current !== desiredClip) {
          const prevAction = activeClip.current ? actions[activeClip.current] : null;
          const nextAction = actions[desiredClip];
          if (desiredClip === 'punch' || desiredClip === 'cross_punch_bimo' || desiredClip === 'cross_punch_mc') {
            nextAction.setEffectiveTimeScale(1.65);
          } else {
            nextAction.setEffectiveTimeScale(1.0);
          }
          nextAction.reset().setEffectiveWeight(1).play();
          if (prevAction && prevAction !== nextAction) {
            prevAction.crossFadeTo(nextAction, 0.22, false);
          }
          activeClip.current = desiredClip;
        }
        mixer.update(dt);

        // Keep facial morphs (lip-sync + natural blinking) alive during clips
        if (faceMorph && faceMorph.mesh.morphTargetInfluences) {
          const inf = faceMorph.mesh.morphTargetInfluences;
          if (faceMorph.mouthIdx >= 0) {
            const open = act && act.talking && !moving ? Math.abs(Math.sin(act.talkPhase)) * 0.72 * act.energy : 0;
            inf[faceMorph.mouthIdx] = THREE.MathUtils.lerp(
              inf[faceMorph.mouthIdx],
              open,
              1 - Math.exp(-14 * dt),
            );
          }
          if (faceMorph.blinkIdx >= 0) {
            blinkTimer.current -= dt;
            let blinkVal = 0;
            if (blinkTimer.current <= 0) {
              if (blinkTimer.current > -0.14) {
                blinkVal = Math.sin(((-blinkTimer.current) / 0.14) * Math.PI);
              } else {
                blinkTimer.current = 2.6 + Math.random() * 3.4;
              }
            }
            inf[faceMorph.blinkIdx] = blinkVal;
          }
        }
        return;
      }

      if (mixer && activeClip.current) {
        mixer.stopAllAction();
        activeClip.current = null;
      }
      // Hips vertical bob
      if (vrm.hips) {
        vrm.hips.node.position.y = THREE.MathUtils.lerp(
          vrm.hips.node.position.y,
          vrm.hips.restPos.y + walkBob + breathBob,
          damp,
        );
      }
      // Spine + Chest share torso twist & lean smoothly
      applyBoneEuler(vrm.spine, forwardLean * 0.5, torsoTwistY * 0.45, lateralSwayZ * 0.5, damp);
      applyBoneEuler(vrm.chest, forwardLean * 0.5, torsoTwistY * 0.55, lateralSwayZ * 0.5, damp);

      // Head gaze & nod
      const headDamp = 1 - Math.exp(-8 * dt);
      applyBoneEuler(vrm.head, targetHeadX, targetHeadY, 0, headDamp);

      // Arms: drop from T-pose (-1.26 rad L, +1.26 rad R) then apply swing
      applyBoneEuler(vrm.upperArmL, targetArmLX, 0, targetArmLZ, damp, -1.26);
      applyBoneEuler(vrm.upperArmR, targetArmRX, 0, targetArmRZ, damp, 1.26);
      // Forearms bend forward via Y rotation (L < 0, R > 0)
      applyBoneEuler(vrm.lowerArmL, 0, targetForeLX, 0, damp);
      applyBoneEuler(vrm.lowerArmR, 0, -targetForeRX, 0, damp);

      // Legs
      applyBoneEuler(vrm.upperLegL, targetLegLX, 0, p.crouch * -0.08, damp);
      applyBoneEuler(vrm.upperLegR, targetLegRX, 0, p.crouch * 0.08, damp);
      applyBoneEuler(vrm.lowerLegL, targetShinLX, 0, 0, damp);
      applyBoneEuler(vrm.lowerLegR, targetShinRX, 0, 0, damp);

      // VRoid facial morph targets: lip-sync & natural blinking
      if (faceMorph && faceMorph.mesh.morphTargetInfluences) {
        const inf = faceMorph.mesh.morphTargetInfluences;
        if (faceMorph.mouthIdx >= 0) {
          const open = act && act.talking && !moving ? Math.abs(Math.sin(act.talkPhase)) * 0.72 * act.energy : 0;
          inf[faceMorph.mouthIdx] = THREE.MathUtils.lerp(
            inf[faceMorph.mouthIdx],
            open,
            1 - Math.exp(-14 * dt),
          );
        }
        if (faceMorph.blinkIdx >= 0) {
          blinkTimer.current -= dt;
          let blinkVal = 0;
          if (blinkTimer.current <= 0) {
            if (blinkTimer.current > -0.14) {
              blinkVal = Math.sin(((-blinkTimer.current) / 0.14) * Math.PI);
            } else {
              blinkTimer.current = 2.6 + Math.random() * 3.4;
            }
          }
          inf[faceMorph.blinkIdx] = blinkVal;
        }
      }
      return;
    }

    // ---- Legacy procedural rig (e.g. Pak Budi csl_char_budi.glb) ----
    if (legacy.legL) {
      legacy.legL.rotation.x = THREE.MathUtils.lerp(legacy.legL.rotation.x, targetLegLX, damp);
      legacy.legL.rotation.z = THREE.MathUtils.lerp(legacy.legL.rotation.z, p.crouch * -0.08, damp);
    }
    if (legacy.legR) {
      legacy.legR.rotation.x = THREE.MathUtils.lerp(legacy.legR.rotation.x, targetLegRX, damp);
      legacy.legR.rotation.z = THREE.MathUtils.lerp(legacy.legR.rotation.z, p.crouch * 0.08, damp);
    }
    if (legacy.shinL) {
      legacy.shinL.rotation.x = THREE.MathUtils.lerp(legacy.shinL.rotation.x, targetShinLX, damp);
    }
    if (legacy.shinR) {
      legacy.shinR.rotation.x = THREE.MathUtils.lerp(legacy.shinR.rotation.x, targetShinRX, damp);
    }
    if (legacy.armL) {
      legacy.armL.rotation.x = THREE.MathUtils.lerp(legacy.armL.rotation.x, targetArmLX, damp);
      legacy.armL.rotation.z = THREE.MathUtils.lerp(legacy.armL.rotation.z, targetArmLZ, damp);
      if (legacy.foreArmL) {
        legacy.foreArmL.rotation.x = THREE.MathUtils.lerp(legacy.foreArmL.rotation.x, targetForeLX, damp);
      }
    }
    if (legacy.armR) {
      legacy.armR.rotation.x = THREE.MathUtils.lerp(legacy.armR.rotation.x, targetArmRX, damp);
      legacy.armR.rotation.z = THREE.MathUtils.lerp(legacy.armR.rotation.z, targetArmRZ, damp);
      if (legacy.foreArmR) {
        legacy.foreArmR.rotation.x = THREE.MathUtils.lerp(legacy.foreArmR.rotation.x, targetForeRX, damp);
      }
    }
    if (legacy.torso) {
      legacy.torso.rotation.y = THREE.MathUtils.lerp(legacy.torso.rotation.y, torsoTwistY, damp);
      legacy.torso.rotation.x = THREE.MathUtils.lerp(legacy.torso.rotation.x, forwardLean, damp);
      legacy.torso.rotation.z = THREE.MathUtils.lerp(legacy.torso.rotation.z, lateralSwayZ, damp);
      legacy.torso.position.y = THREE.MathUtils.lerp(
        legacy.torso.position.y,
        legacy.torsoBaseY + walkBob + breathBob,
        damp,
      );
    }
    if (legacy.head) {
      legacy.head.rotation.y = THREE.MathUtils.lerp(legacy.head.rotation.y, targetHeadY, 1 - Math.exp(-8 * dt));
      legacy.head.rotation.x = THREE.MathUtils.lerp(legacy.head.rotation.x, targetHeadX, 1 - Math.exp(-10 * dt));
    }
    if (legacy.mouth) {
      const open = act && act.talking && !moving ? Math.abs(Math.sin(act.talkPhase)) * 2.1 * act.energy : 0;
      legacy.mouth.scale.y = THREE.MathUtils.lerp(legacy.mouth.scale.y, 1 + open, 1 - Math.exp(-14 * dt));
    }
  });

  return (
    <group ref={root} scale={scale}>
      <group scale={normScale}>
        <primitive object={cloned} />
      </group>
      <group ref={armRMount}>
        {hold && (
          <HoldProp
            kind={hold}
            cylSeg={BOOT_LOW ? 6 : 10}
            atForearm={!!legacy.foreArmR}
            isVrmHand={isVrm}
          />
        )}
      </group>
      {nameTag && <NameSprite text={nameTag} tag={tag} />}
    </group>
  );
}

// v0.20.1 mobile memory optimization: always preload the tiny shared animations
// pack (746 KB), and only preload the opening pair on high-tier desktops.
// Other character models stream on-demand via Suspense to avoid a 60 MB mobile boot spike.
useGLTF.preload(ANIM_GLB_PATH);
if (!mobile.lowSpec) {
  useGLTF.preload(CHAR_GLB_PATHS.ren);
  useGLTF.preload(CHAR_GLB_PATHS.aris);
}
