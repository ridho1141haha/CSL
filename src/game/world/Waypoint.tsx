import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuests } from '../../stores/questStore';
import { useGame } from '../../stores/gameStore';
import { playerPos } from '../runtime';
import { pickActiveQuest, questTargetFor, type WaypointTarget } from '../waypoint';

// ============================================================================
// ObjectiveWaypoint (v0.10.0) — floating marker over the active quest's
// target zone. Diamond + light beam, rendered with depthTest OFF so it stays
// visible through walls (the whole point of a waypoint). One marker at a
// time; hidden while cinematic frames play or when the player stands in the
// target zone (no "you are here" arrow hovering over your head).
// ============================================================================

const AMBER = '#f59e0b';

export function ObjectiveWaypoint() {
  const quests = useQuests((s) => s.quests);
  const visited = useGame((s) => s.visitedZones);

  // Recomputed only when quests/visited actually change (discrete events).
  const target: WaypointTarget | null = useMemo(() => {
    const q = pickActiveQuest(quests);
    if (!q) return null;
    return questTargetFor(q, { visited, px: playerPos.x, pz: playerPos.z });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quests, visited]);

  const group = useRef<THREE.Group>(null);
  const diamond = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Mesh>(null);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    if (!g) return;
    const game = useGame.getState();
    // hide during cinematics/dialogue — story shots stay clean
    if (!target || game.mode !== 'GAMEPLAY') {
      g.visible = false;
      return;
    }
    const dist = Math.hypot(playerPos.x - target.pos[0], playerPos.z - target.pos[1]);
    if (dist < 3.5) {
      g.visible = false;
      return;
    }
    g.visible = true;
    const t = clock.elapsedTime;
    g.position.set(target.pos[0], target.y + 1.6 + Math.sin(t * 2.1) * 0.16, target.pos[1]);
    if (diamond.current) diamond.current.rotation.y += dt * 1.4;
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.22 + Math.sin(t * 2.4) * 0.08;
    }
  });

  return (
    <group ref={group} visible={false}>
      {/* diamond — depthTest off so walls never hide the objective */}
      <mesh ref={diamond} renderOrder={999} position={[0, 0.9, 0]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial color={AMBER} depthTest={false} toneMapped={false} transparent opacity={0.95} />
      </mesh>
      {/* light beam down to the target point */}
      <mesh ref={beam} renderOrder={998} position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.055, 0.14, 1.5, 8, 1, true]} />
        <meshBasicMaterial color={AMBER} depthTest={false} toneMapped={false} transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* ground ring */}
      <mesh renderOrder={997} position={[0, 0.06, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.55, 0.72, 32]} />
        <meshBasicMaterial color={AMBER} depthTest={false} toneMapped={false} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
