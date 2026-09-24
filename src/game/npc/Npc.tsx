import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../stores/gameStore';
import { useStory } from '../../stores/storyStore';
import { useSettings } from '../../stores/settingsStore';
import { playerPos, npcPositions, crowdPositions, actorPositions } from '../runtime';
import { mobile } from '../mobile';
import { lowSpecProfile, qualityConfig } from '../quality';
import { Figure, makeAnim, BOOT_LOW } from './Character';
import { NPCS, AMBIENT_STUDENTS, NPC_BY_ID } from '../../data/npcs';
import { periodFor } from '../systems/time';
import type { HoldKind } from '../../types';

// v0.14.3: crowd/figures are the heaviest draw-call source (each Figure is
// ~30 meshes — 14 students ≈ 420 calls). Weak GPU profile (device tier low
// OR preset RENDAH) gets the halved crowd — see <Npcs> below (live-reactive).

/** Hide radius: NPCs past it sit deep inside fog — invisible anyway. */
function figureHideR(): number {
  return Math.max(45, qualityConfig(useSettings.getState().quality, mobile.tier).fogFar - 25);
}

// Ambient students: light wanderers for crowd life.
// v0.16.0: no longer "non-collidable" — each student registers its live
// position into crowdPositions (consumed by the player collision system)
// and steps AROUND the player instead of walking through them.
function Student({ home, wander, color, seed }: { home: [number, number]; wander: number; color: string; seed: number }) {
  const group = useRef<THREE.Group>(null);
  const anim = useRef(makeAnim());
  const t = useRef(seed * 7.3);
  const target = useRef({ x: home[0], z: home[1] });
  const key = `s${seed}`;

  // stale-position guard (same contract as ScheduledNpc/StoryActor)
  useEffect(() => () => { delete crowdPositions[key]; }, [key]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = group.current;
    if (!g) return;
    // v0.14.3 distance visibility — checked before mode freezes so the flag
    // also settles during cutscenes (story shots stay ≤ ~20 m from the cast,
    // far inside the hide radius; fog masks the pop at ~85-90% fogged).
    const R = figureHideR();
    const c = state.camera.position;
    const cd2 = (g.position.x - c.x) ** 2 + (g.position.z - c.z) ** 2;
    g.visible = cd2 < R * R;
    const game = useGame.getState();
    if (game.mode === 'CINEMATIC') return; // frozen during cutscenes
    t.current += dt;
    const dx = target.current.x - g.position.x;
    const dz = target.current.z - g.position.z;
    const d = Math.hypot(dx, dz);
    // v0.16.0 anti-overlap: never step closer than CHAR_RADIUS+margin to the
    // player — wait instead of walking through them.
    const pdx = g.position.x - playerPos.x;
    const pdz = g.position.z - playerPos.z;
    const pd = Math.hypot(pdx, pdz);
    if (d < 0.2) {
      // pick a new wander target
      target.current.x = home[0] + Math.sin(t.current * 0.13 + seed) * wander;
      target.current.z = home[1] + Math.cos(t.current * 0.11 + seed * 1.7) * wander * 0.6;
      anim.current.speed = 0;
    } else if (pd < 0.7) {
      anim.current.speed = 0; // too close to the player — hold position
    } else {
      const sp = 0.9;
      g.position.x += (dx / d) * sp * dt;
      g.position.z += (dz / d) * sp * dt;
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(dx, dz), 0.08);
      anim.current.speed = sp;
    }
    crowdPositions[key] = { x: g.position.x, z: g.position.z };
  });

  return (
    <group ref={group} position={[home[0], 0.03, home[1]]} scale={0.96}>
      {/* v0.14.4: trim — ambient wanderers never get a close-up; on weak boot
          profiles drop their micro-detail meshes (buttons/catchlights/hem) */}
      <Figure anim={anim} color={color} accent="#e5e7eb" trim={BOOT_LOW} />
    </group>
  );
}

// Scheduled main NPCs. Stand at their period waypoint; glide there on change.
export function Npcs({ hideMain = false }: { hideMain?: boolean }) {
  // v0.7.0 rute netral: Aris mengundurkan diri di akhir bab 3 (montage n4) —
  // dari bab 4 dia tidak lagi muncul di sekolah.
  const route = useStory((s) => s.route);
  const chapter = useStory((s) => s.chapter);
  const nodes = useMemo(
    () =>
      NPCS.filter((def) => !(def.id === 'aris' && route === 'neutral' && chapter >= 4)).map((def) => ({ def })),
    [route, chapter],
  );
  // v0.5.0 mobile tier: halve the ambient crowd on phones (draw-call budget —
  // each figure is ~30 meshes; 14 figures ≈ 420 calls is too much for low GPUs)
  // v0.14.3: preset RENDAH now gets the same treatment — and LIVE (subscribes
  // to quality; tier alone used to give weak laptops the full-fat crowd).
  const quality = useSettings((s) => s.quality);
  const ambient = useMemo(
    () =>
      lowSpecProfile(quality, mobile.tier)
        ? AMBIENT_STUDENTS.filter((_, i) => i % 2 === 0)
        : AMBIENT_STUDENTS,
    [quality],
  );

  return (
    <>
      {!hideMain && nodes.map(({ def }) => (
        <ScheduledNpc key={def.id} id={def.id} />
      ))}
      {ambient.map((s, i) => (
        <Student key={i} home={s.pos} wander={s.wander} color={s.color} seed={i + 1} />
      ))}
    </>
  );
}

function ScheduledNpc({ id }: { id: string }) {
  const def = NPC_BY_ID[id];
  const group = useRef<THREE.Group>(null);
  const anim = useRef(makeAnim());
  const dest = useRef<[number, number]>(def.schedule.arrive ?? [0, 0]);

  // stale-position guard: when the scheduled NPC unmounts (cinematic hideMain,
  // scene switch) its last written position must not leak into npcPositions —
  // the dialogue camera and acting system would aim at a ghost.
  useEffect(() => () => { delete npcPositions[id]; }, [id]);

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = group.current;
    if (!g || !def) return;
    // v0.14.3 distance visibility (same contract as Student above)
    const R = figureHideR();
    const c = state.camera.position;
    const cd2 = (g.position.x - c.x) ** 2 + (g.position.z - c.z) ** 2;
    g.visible = cd2 < R * R;
    const game = useGame.getState();

    // period waypoint
    const period = periodFor(game.clock.minutes).id;
    const wp = def.schedule[period] ?? def.schedule.arrive;
    if (wp && (wp[0] !== dest.current[0] || wp[1] !== dest.current[1])) dest.current = wp;

    if (game.mode === 'CINEMATIC') {
      anim.current.speed = 0;
    } else {
      const dx = dest.current[0] - g.position.x;
      const dz = dest.current[1] - g.position.z;
      const d = Math.hypot(dx, dz);
      // v0.16.0 anti-overlap: hold position instead of gliding through the
      // player when they stand on the waypoint path.
      const pdx = g.position.x - playerPos.x;
      const pdz = g.position.z - playerPos.z;
      const playerTooClose = Math.hypot(pdx, pdz) < 0.7;
      if (d > 0.15 && !playerTooClose) {
        const sp = 1.4;
        g.position.x += (dx / d) * sp * dt;
        g.position.z += (dz / d) * sp * dt;
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(dx, dz), 0.1);
        anim.current.speed = sp;
        anim.current.sit = false; // berdiri selama berjalan
      } else {
        // v0.12.0: duduk di bangku saat periode kelas (def.sitAt) — menghadap
        // titik sitFace (papan tulis). Blend duduk ditangani Figure.
        const sitting = !!def.sitAt?.includes(period);
        anim.current.sit = sitting;
        if (sitting && def.sitFace) {
          g.rotation.y = THREE.MathUtils.lerp(
            g.rotation.y,
            Math.atan2(def.sitFace[0] - g.position.x, def.sitFace[1] - g.position.z),
            0.08,
          );
        } else {
          // face the player when nearby
          const pdx = playerPos.x - g.position.x;
          const pdz = playerPos.z - g.position.z;
          if (Math.hypot(pdx, pdz) < 3.5) {
            g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(pdx, pdz), 0.06);
          }
        }
        anim.current.speed = 0;
      }
      npcPositions[id] = { x: g.position.x, z: g.position.z };
    }
  });

  const start = def.schedule.arrive ?? [0, 0];
  return (
    <group ref={group} position={[start[0], 0.03, start[1]]} userData={{ npcId: id }}>
      <Figure
        anim={anim}
        color={def.color}
        accent={def.accent}
        scale={def.height / 1.65}
        nameTag={def.name}
        tag={def.role}
        skin={def.skin}
        pants={def.pants}
        skirt={def.skirt}
        hair={def.hair}
        actId={def.id}
      />
    </group>
  );
}

// Cinematic-only extras: bullies (opening) + story actors placed by the director.
// v0.12.0: placements bisa membawa sit/crouch (pose) + hold (prop tangan).
export type StoryPlacement = {
  id: string; x: number; z: number; color: string; faceTo?: [number, number];
  sit?: boolean; crouch?: boolean; hold?: HoldKind;
};
export function StoryActors({ placements }: { placements: StoryPlacement[] }) {
  return (
    <>
      {placements.map((p, i) => (
        <StoryActor key={`${p.id}-${i}`} {...p} />
      ))}
    </>
  );
}

function StoryActor({ id, x, z, color, faceTo, sit, crouch, hold }: StoryPlacement) {
  const group = useRef<THREE.Group>(null);
  const anim = useRef(makeAnim());
  // stale-position guard (v0.14.1, mirrors ScheduledNpc): when a story actor
  // unmounts (scene change / next node without this actor) its last written
  // position must not linger in actorPositions — a ghost from an older scene
  // used to be picked up as a camera/acting target for unrelated scenes.
  useEffect(() => () => { delete actorPositions[id]; }, [id]);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    if (faceTo) g.rotation.y = Math.atan2(faceTo[0] - g.position.x, faceTo[1] - g.position.z);
    // pose + prop cerita per frame (blend halus dilakukan di Figure)
    anim.current.sit = !!sit;
    anim.current.crouch = !!crouch;
    // expose the placement to the dialogue camera + acting system
    actorPositions[id] = { x: g.position.x, z: g.position.z };
  });
  return (
    <group ref={group} position={[x, 0.03, z]} scale={0.98}>
      <Figure anim={anim} color={color} accent="#94a3b8" actId={id} hold={hold} />
    </group>
  );
}
