import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../../stores/gameStore';
import { useStory } from '../../stores/storyStore';
import { playerPos, npcPositions, actorPositions } from '../runtime';
import { mobile } from '../mobile';
import { Figure, makeAnim } from './Character';
import { NPCS, AMBIENT_STUDENTS, NPC_BY_ID } from '../../data/npcs';
import { periodFor } from '../systems/time';

// Ambient students: light, non-collidable wanderers for crowd life.
function Student({ home, wander, color, seed }: { home: [number, number]; wander: number; color: string; seed: number }) {
  const group = useRef<THREE.Group>(null);
  const anim = useRef(makeAnim());
  const t = useRef(seed * 7.3);
  const target = useRef({ x: home[0], z: home[1] });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = group.current;
    if (!g) return;
    const game = useGame.getState();
    if (game.mode === 'CINEMATIC') return; // frozen during cutscenes
    t.current += dt;
    const dx = target.current.x - g.position.x;
    const dz = target.current.z - g.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.2) {
      // pick a new wander target
      target.current.x = home[0] + Math.sin(t.current * 0.13 + seed) * wander;
      target.current.z = home[1] + Math.cos(t.current * 0.11 + seed * 1.7) * wander * 0.6;
      anim.current.speed = 0;
    } else {
      const sp = 0.9;
      g.position.x += (dx / d) * sp * dt;
      g.position.z += (dz / d) * sp * dt;
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(dx, dz), 0.08);
      anim.current.speed = sp;
    }
  });

  return (
    <group ref={group} position={[home[0], 0.03, home[1]]} scale={0.96}>
      <Figure anim={anim} color={color} accent="#e5e7eb" />
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
  const ambient = useMemo(
    () => (mobile.lowSpec ? AMBIENT_STUDENTS.filter((_, i) => i % 2 === 0) : AMBIENT_STUDENTS),
    [],
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

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const g = group.current;
    if (!g || !def) return;
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
      if (d > 0.15) {
        const sp = 1.4;
        g.position.x += (dx / d) * sp * dt;
        g.position.z += (dz / d) * sp * dt;
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(dx, dz), 0.1);
        anim.current.speed = sp;
      } else {
        // face the player when nearby
        const pdx = playerPos.x - g.position.x;
        const pdz = playerPos.z - g.position.z;
        if (Math.hypot(pdx, pdz) < 3.5) {
          g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(pdx, pdz), 0.06);
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
export function StoryActors({ placements }: { placements: { id: string; x: number; z: number; color: string; faceTo?: [number, number] }[] }) {
  return (
    <>
      {placements.map((p, i) => (
        <StoryActor key={`${p.id}-${i}`} {...p} />
      ))}
    </>
  );
}

function StoryActor({ id, x, z, color, faceTo }: { id: string; x: number; z: number; color: string; faceTo?: [number, number] }) {
  const group = useRef<THREE.Group>(null);
  const anim = useRef(makeAnim());
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    if (faceTo) g.rotation.y = Math.atan2(faceTo[0] - g.position.x, faceTo[1] - g.position.z);
    // expose the placement to the dialogue camera + acting system
    actorPositions[id] = { x: g.position.x, z: g.position.z };
  });
  return (
    <group ref={group} position={[x, 0.03, z]} scale={0.98}>
      <Figure anim={anim} color={color} accent="#94a3b8" actId={id} />
    </group>
  );
}
