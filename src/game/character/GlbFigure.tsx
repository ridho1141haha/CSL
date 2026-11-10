import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mobile } from '../mobile';
import { acting, tickActing, type ActingState } from '../systems/acting';
import { bindableClips, CharacterAnimationController } from './CharacterAnimationController';
import { CharacterAnimDirector, type AnimSnapshot } from './stateMapping';
import { TINT_SLOT_ALIASES, type TintSlot } from '../npc/characters';
import { NameSprite, HoldProp } from '../npc/parts';
import type { FigureAnim, FigureProps } from '../npc/figureTypes';

// PHASE 2 — skeletal GLB character adapter.
//
// Rendered by Figure (same props contract) when a loaded GLB actually carries
// a skeleton + animation clips (see isSkeletalRig). For the legacy joint-rig
// GLBs currently in public/models (no skins, no clips) Figure keeps rendering
// the procedural path, so today's visuals and behavior are untouched.
//
// Skeleton handling: SkeletonUtils.clone() — a plain scene.clone() on a rigged
// model keeps SkinnedMeshes bound to the ORIGINAL skeleton, which would make
// every instance share one pose. SkeletonUtils rebinds skin weights to the
// cloned bones so each character owns its skeleton state.
//
// Resource lifecycle: geometries/materials/textures stay shared with the
// useGLTF cache and are NEVER disposed here; only per-instance tinted
// material clones are disposed (same policy as the legacy renderer). The
// AnimationMixer is stopped and un-cached on unmount.

export type GlbFigureProps = FigureProps & {
  /** Cached GLTF scene for this character (from useGLTF — shared, read-only). */
  gltf: THREE.Group;
  /** Cached glTF animations for this character. */
  clips: THREE.AnimationClip[];
};

/** True when the GLB is a rigged, animated model (SkinnedMesh + clips). */
export function isSkeletalRig(scene: THREE.Object3D, animations?: THREE.AnimationClip[]): boolean {
  if (!animations || animations.length === 0) return false;
  let skinned = false;
  scene.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  return skinned;
}

export function GlbFigure({ anim, gltf, clips: rawClips, scale = 1, nameTag, tag, actId, hold, tint }: GlbFigureProps) {
  const root = useRef<THREE.Group>(null);
  const armRMount = useRef<THREE.Group>(null);
  const wp = useRef(new THREE.Vector3());
  const SH = !mobile.lowSpec;
  const tintKey = tint
    ? (Object.keys(TINT_SLOT_ALIASES) as TintSlot[])
        .filter((s) => tint[s])
        .map((s) => `${s}=${tint[s]}`)
        .join(';')
    : '';

  const { cloned, clips, head, mouthMesh, mouthOpenIdx, blinkIdx, handR, tintedMaterials } = useMemo(() => {
    // Skeleton-safe clone; rebinds SkinnedMeshes to the cloned bones.
    const clone = skeletonClone(gltf) as THREE.Group;
    const tintedClones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    const tintMaterial = (mat: THREE.Material): THREE.Material => {
      const color = tint?.[(Object.keys(TINT_SLOT_ALIASES) as TintSlot[]).find(
        (s) => TINT_SLOT_ALIASES[s].includes(mat.name),
      ) ?? '' as TintSlot];
      if (!color) return mat;
      let c = tintedClones.get(mat);
      if (!c) {
        c = mat.clone() as THREE.MeshStandardMaterial;
        c.color.set(color);
        tintedClones.set(mat, c);
      }
      return c;
    };
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = SH;
        m.receiveShadow = true;
        if (Array.isArray(m.material)) m.material = m.material.map(tintMaterial);
        else m.material = tintMaterial(m.material);
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
        if (mat && mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace;
          mat.needsUpdate = true;
        }
      }
    });
    // Drop clips that would bind to missing nodes — prevents per-frame
    // "No target node" warnings when a rig ships clips it cannot play.
    const playable = bindableClips(clone, rawClips);
    let mouth: THREE.Mesh | null = null;
    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mouth && mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) mouth = mesh;
    });
    const mm = mouth as THREE.Mesh | null;
    return {
      cloned: clone,
      clips: playable,
      head: clone.getObjectByName('Head') as THREE.Bone | null,
      mouthMesh: mm,
      mouthOpenIdx: mm?.morphTargetDictionary?.mouthOpen ?? -1,
      blinkIdx: mm?.morphTargetDictionary?.blink ?? -1,
      handR: clone.getObjectByName('Hand_R') as THREE.Bone | null,
      tintedMaterials: [...tintedClones.values()],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf, rawClips, SH, tintKey]);

  // One mixer per instance, created once (never per frame).
  const ctrl = useMemo(() => new CharacterAnimationController(cloned, clips), [cloned, clips]);
  const director = useMemo(() => new CharacterAnimDirector(ctrl), [ctrl]);
  const snap = useRef<AnimSnapshot>({
    speed: 0, run: false, attackT: -1, block: false, hurtT: -1, down: false, sit: false, crouch: false, act: null,
  });
  const snapAct = useRef({ talking: false, gesture: -1, nodT: -1 });
  const blinkT = useRef(0);
  const mouthOpen = useRef(0);

  useEffect(() => () => ctrl.dispose(), [ctrl]);

  useEffect(() => {
    const mats = tintedMaterials;
    return () => {
      for (const m of mats) m.dispose();
    };
  }, [tintedMaterials]);

  // Hold props parent to the Hand_R bone (ANIMATION_MAP adapter notes).
  useEffect(() => {
    const mount = armRMount.current;
    if (mount && handR) {
      handR.add(mount);
      return () => {
        handR.remove(mount);
      };
    }
  }, [handR]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = root.current;
    if (!g) return;
    // Hidden characters freeze (no mixer update) — same contract as Figure.
    if (!g.visible || (g.parent && !g.parent.visible)) return;

    const a = anim.current as FigureAnim;
    let act: ActingState | undefined;
    if (actId) {
      act = acting[actId];
      if (act) tickActing(act, dt, a.speed > 0.15 || a.sit || a.crouch);
    }

    // Snapshot without allocations (mutate the refs in place).
    const s = snap.current;
    s.speed = a.speed;
    s.run = a.run;
    s.attackT = a.attackT;
    s.block = a.block;
    s.hurtT = a.hurtT;
    s.down = a.down;
    s.sit = a.sit;
    s.crouch = a.crouch;
    s.hold = hold;
    const sa = snapAct.current;
    if (act) {
      sa.talking = act.talking;
      sa.gesture = act.gesture;
      sa.nodT = act.nodT;
      s.act = sa;
    } else {
      s.act = null;
    }
    director.apply(s);
    ctrl.update(dt);

    // Procedural layer after the mixer update (per ANIMATION_MAP):
    // gaze yaw on the Head bone + mouthOpen morph from the talk phase.
    if (head) {
      const moving = a.speed > 0.15;
      if (act && !Number.isNaN(act.gazeX)) {
        g.getWorldPosition(wp.current);
        const desired = Math.atan2(act.gazeX - wp.current.x, act.gazeZ - wp.current.z);
        const parentYaw = g.parent?.rotation.y ?? 0;
        let local = desired - parentYaw;
        local = Math.atan2(Math.sin(local), Math.cos(local));
        const clamped = THREE.MathUtils.clamp(local, -0.62, 0.62);
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, clamped, 1 - Math.exp(-7 * dt));
      } else {
        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, moving ? 0 : Math.sin(performance.now() * 0.00035) * 0.14, 1 - Math.exp(-5 * dt));
      }
    }
    if (mouthMesh && mouthOpenIdx >= 0 && mouthMesh.morphTargetInfluences) {
      const open = act && act.talking ? Math.min(1, Math.abs(Math.sin(act.talkPhase)) * 2.1 * act.energy) : 0;
      mouthOpen.current = THREE.MathUtils.lerp(mouthOpen.current, open, 1 - Math.exp(-14 * dt));
      mouthMesh.morphTargetInfluences[mouthOpenIdx] = mouthOpen.current;
    }
    if (mouthMesh && blinkIdx >= 0 && mouthMesh.morphTargetInfluences) {
      // Deterministic blink: quick close every ~3.7 s (no Math.random churn).
      blinkT.current += dt;
      const cycle = blinkT.current % 3.7;
      const closed = cycle > 3.55 && cycle < 3.7 ? 1 : 0;
      mouthMesh.morphTargetInfluences[blinkIdx] = closed;
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
