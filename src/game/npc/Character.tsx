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

function HoldProp({ kind, cylSeg }: { kind: HoldKind; cylSeg: number }) {
  const hand: [number, number, number] = [0.0, -0.42, 0.03];
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
      <group position={[0.02, -0.4, 0.12]} rotation={[0.55, 0, 0]}>
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
      <group position={[0.01, -0.38, 0.1]} rotation={[0.5, 0, 0.08]}>
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
      <group position={[0.05, -0.38, 0.14]} rotation={[0.35, 0.15, 0]}>
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
    <group position={[0.005, -0.4, 0.05]} rotation={[0.35, 0, 0]}>
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
  const poseT = useRef({ sit: 0, crouch: 0 });

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
    return {
      cloned: clone,
      joints: {
        torso: clone.getObjectByName('Torso') ?? null,
        head: clone.getObjectByName('Head') ?? null,
        mouth: clone.getObjectByName('Mouth') ?? null,
        armL: clone.getObjectByName('ArmL') ?? null,
        armR: clone.getObjectByName('ArmR') ?? null,
        legL: clone.getObjectByName('LegL') ?? null,
        legR: clone.getObjectByName('LegR') ?? null,
      },
    };
  }, [scene, SH]);

  // Sambungkan grup HoldProp ke sendi tangan kanan GLB
  useEffect(() => {
    const mount = armRMount.current;
    const armR = joints.armR;
    if (mount && armR) {
      armR.add(mount);
      return () => {
        armR.remove(mount);
      };
    }
  }, [joints]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!root.current) return;
    const g = root.current;
    if (!g.visible || (g.parent && !g.parent.visible)) return;

    if (a.down) {
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -Math.PI / 2.2, 0.12);
      g.position.y = THREE.MathUtils.lerp(g.position.y, 0.12, 0.12);
      return;
    }
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0, 0.2);

    const p = poseT.current;
    p.sit = THREE.MathUtils.lerp(p.sit, a.sit ? 1 : 0, 1 - Math.exp(-9 * dt));
    p.crouch = THREE.MathUtils.lerp(p.crouch, !a.sit && a.crouch ? 1 : 0, 1 - Math.exp(-9 * dt));
    g.position.y = THREE.MathUtils.lerp(g.position.y, -0.13 * p.sit - 0.34 * p.crouch, 1 - Math.exp(-10 * dt));

    const moving = a.speed > 0.15;
    const stride = a.run ? 11 : 7.5;
    phase.current += dt * (moving ? stride * Math.max(0.35, a.speed / 3.2) : 1.6);

    let act: ActingState | undefined;
    if (actId) {
      act = acting[actId];
      if (act) tickActing(act, dt, moving || p.sit > 0.5 || p.crouch > 0.5);
    }

    let gLx = 0, gLz = 0, gRx = 0, gRz = 0;
    if (act && act.gesture >= 0 && !moving && p.sit < 0.5 && p.crouch < 0.5) {
      const env = Math.sin(Math.min(1, act.gestureT) * Math.PI) * act.energy;
      if (act.gesture === 0) {
        gRx = -0.5 * env;
        gRz = 0.28 * env;
      } else if (act.gesture === 1) {
        gRx = -0.9 * env;
      } else {
        gLx = -0.8 * env;
        gLz = 0.45 * env;
      }
    }

    const legPose = p.sit * -1.42 + p.crouch * 0.85;
    const swing = moving ? Math.sin(phase.current) * (a.run ? 0.85 : 0.55) : Math.sin(phase.current * 0.6) * 0.05;
    if (joints.legL) joints.legL.rotation.x = legPose + swing * (1 - Math.max(p.sit, p.crouch));
    if (joints.legR) joints.legR.rotation.x = legPose - swing * (1 - Math.max(p.sit, p.crouch));

    const atk = a.attackT >= 0 ? Math.sin(Math.min(1, a.attackT) * Math.PI) : 0;
    const twoHand = hold === 'stack' || hold === 'book' || hold === 'map';
    const armPose = p.sit * -0.95 + p.crouch * -0.62;

    if (joints.armL) {
      if (a.block) {
        joints.armL.rotation.x = -1.9;
        joints.armL.rotation.z = 0.5;
      } else {
        const base = twoHand ? -0.85 : 0;
        joints.armL.rotation.x = armPose + base * (1 - Math.max(p.sit, p.crouch)) - swing * 0.8 * (1 - Math.max(p.sit, p.crouch)) + gLx;
        joints.armL.rotation.z = gLz;
      }
    }

    if (joints.armR) {
      if (atk > 0) {
        joints.armR.rotation.x = -1.2 - atk * 1.6;
        joints.armR.rotation.z = 0;
      } else if (a.block) {
        joints.armR.rotation.x = -1.9;
        joints.armR.rotation.z = -0.5;
      } else {
        const base = hold === 'phone' ? -1.18 : twoHand ? -0.85 : 0;
        joints.armR.rotation.x = armPose + base * (1 - Math.max(p.sit, p.crouch)) + swing * 0.8 * (1 - Math.max(p.sit, p.crouch)) + gRx;
        joints.armR.rotation.z = gRz;
      }
    }

    if (joints.torso) {
      const lean = act && act.talking && !moving ? 0.05 * act.energy : 0;
      joints.torso.rotation.y = moving ? Math.sin(phase.current) * 0.12 : Math.sin(phase.current * 0.6) * 0.03;
      joints.torso.rotation.x =
        a.attackT >= 0 ? -atk * 0.35 : p.crouch * 0.5 + (moving ? 0.08 + (a.run ? 0.1 : 0) : lean);
      const bob = moving ? Math.abs(Math.sin(phase.current)) * (a.run ? 0.05 : 0.03) : Math.sin(phase.current * 0.55) * 0.006;
      joints.torso.position.y = 0.92 + bob;
    }

    if (joints.head) {
      if (act && !Number.isNaN(act.gazeX)) {
        g.getWorldPosition(wp.current);
        const desired = Math.atan2(act.gazeX - wp.current.x, act.gazeZ - wp.current.z);
        const parentYaw = g.parent?.rotation.y ?? 0;
        let local = desired - parentYaw;
        local = Math.atan2(Math.sin(local), Math.cos(local));
        const clamped = THREE.MathUtils.clamp(local, -0.62, 0.62);
        const sway = moving ? 0 : Math.sin(phase.current * 0.35) * 0.03;
        joints.head.rotation.y = THREE.MathUtils.lerp(joints.head.rotation.y, clamped + sway, 1 - Math.exp(-7 * dt));
      } else {
        joints.head.rotation.y = moving ? 0 : Math.sin(phase.current * 0.35) * 0.14;
      }
      const nodX = act && act.nodT >= 0 ? Math.sin(act.nodT * Math.PI * 2) * 0.1 * (0.5 + act.energy * 0.5) : 0;
      joints.head.rotation.x = THREE.MathUtils.lerp(joints.head.rotation.x, nodX, 1 - Math.exp(-10 * dt));
    }

    if (joints.mouth) {
      const open = act && act.talking && !moving ? Math.abs(Math.sin(act.talkPhase)) * 2.1 * act.energy : 0;
      joints.mouth.scale.y = THREE.MathUtils.lerp(joints.mouth.scale.y, 1 + open, 1 - Math.exp(-14 * dt));
    }
  });

  return (
    <group ref={root} scale={scale}>
      <primitive object={cloned} />
      <group ref={armRMount}>
        {hold && <HoldProp kind={hold} cylSeg={mobile.seg.cyl} />}
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