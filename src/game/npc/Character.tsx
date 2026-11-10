import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { mobile } from '../mobile';
import { useSettings } from '../../stores/settingsStore';
import { lowSpecProfile } from '../quality';
import { acting, tickActing, type ActingState } from '../systems/acting';
import { CHAR_GLB_PATHS, TINT_SLOT_MATERIALS, type CharModelId, type TintSlot } from './characters';
import { GlbFigure, isSkeletalRig } from '../character/GlbFigure';
import { NameSprite, HoldProp } from './parts';
import { makeAnim, type FigureAnim, type FigureProps } from './figureTypes';

export const BOOT_LOW = lowSpecProfile(useSettings.getState().quality, mobile.tier);

// Shared figure contract lives in ./figureTypes — one source for both the
// legacy renderer and the skeletal adapter (no circular import). Re-exported
// so existing importers (combat.ts, CombatScene, Player) keep working.
export { makeAnim };
export type { FigureAnim };
type Props = FigureProps;

// v0.18.1: CharModelId + CHAR_GLB_PATHS live in the centralized registry
// (./characters). Re-exported here so existing importers keep working.
export { CHAR_GLB_PATHS };
export type { CharModelId, TintSlot };

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

// Figure — public entry point. Contract unchanged for every caller (Player,
// Npc, CombatScene): the loaded GLB itself decides which renderer runs — a
// rigged GLB (SkinnedMesh + clips, pipeline output) renders through the
// skeletal adapter; the legacy joint-rig GLBs keep the procedural path below.
export function Figure(props: Props) {
  const charId = resolveCharModelId(props);
  const gltf = useGLTF(CHAR_GLB_PATHS[charId]);
  const skeletal = useMemo(() => isSkeletalRig(gltf.scene, gltf.animations), [gltf.scene, gltf.animations]);
  if (skeletal) {
    return <GlbFigure {...props} gltf={gltf.scene} clips={gltf.animations} />;
  }
  return <LegacyFigure {...props} />;
}

// Legacy procedural renderer — joint-rig GLBs (public/models today). Body
// unchanged from pre-integration behavior (v0.18.1 tint/dispose included).
function LegacyFigure(props: Props) {
  const { anim, scale = 1, nameTag, tag, actId, hold, tint } = props;
  const root = useRef<THREE.Group>(null);
  const armRMount = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const wp = useRef(new THREE.Vector3());
  const poseT = useRef({ sit: 0, crouch: 0 });

  const charId = resolveCharModelId(props);
  const { scene } = useGLTF(CHAR_GLB_PATHS[charId]);
  const SH = !mobile.lowSpec;
  // Canonical form of the tint map for memo matching — registry objects are
  // module constants, but an inline object from a caller must not retrigger
  // material cloning on every render.
  const tintKey = tint
    ? Object.keys(TINT_SLOT_MATERIALS)
        .filter((s) => tint[s as TintSlot])
        .map((s) => `${s}=${tint[s as TintSlot]}`)
        .join(';')
    : '';

  const { cloned, joints, tintedMaterials } = useMemo(() => {
    // scene.clone(true): these GLBs contain plain meshes (no skins, no
    // animation clips — joints are posed in useFrame below), so cloning the
    // hierarchy is safe. Geometries and untouched materials stay shared
    // between instances; tinted slots are cloned per instance below so
    // variants never share tinted material state.
    const clone = scene.clone(true);
    const tintedClones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    const tintMaterial = (mat: THREE.Material): THREE.Material => {
      const slot = (Object.keys(TINT_SLOT_MATERIALS) as TintSlot[]).find(
        (s) => TINT_SLOT_MATERIALS[s] === mat.name,
      );
      if (!slot || !tint?.[slot]) return mat;
      let c = tintedClones.get(mat);
      if (!c) {
        c = mat.clone() as THREE.MeshStandardMaterial;
        c.color.set(tint[slot]!);
        tintedClones.set(mat, c);
      }
      return c;
    };
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = SH;
        m.receiveShadow = true;
        if (Array.isArray(m.material)) {
          m.material = m.material.map(tintMaterial);
        } else {
          m.material = tintMaterial(m.material);
        }
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
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
      // Per-instance tinted material clones — the ONLY GPU resources this
      // Figure owns exclusively (see the dispose effect below).
      tintedMaterials: [...tintedClones.values()],
    };
  }, [scene, SH, tintKey]);

  // Lifecycle: tinted clones are owned by this Figure instance alone, so they
  // are disposed on unmount (campus → other-world switches remount every
  // Student). Geometries and untinted materials are shared with the useGLTF
  // cache and intentionally NOT disposed here — disposing those would break
  // every other instance of the same base model. material.dispose() never
  // disposes textures, so the shared face texture is safe.
  // React 18 StrictMode (dev) runs setup→cleanup→setup on mount: the
  // intermediate cleanup disposes materials while still mounted, and three.js
  // transparently re-initializes a disposed material on its next render —
  // same tradeoff as R3F's own auto-dispose. Production unmounts run the
  // cleanup exactly once.
  useEffect(() => {
    const mats = tintedMaterials;
    return () => {
      for (const m of mats) m.dispose();
    };
  }, [tintedMaterials]);

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