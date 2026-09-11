import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCombat } from '../../stores/combatStore';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { enemyPos, playerPos, requestShake } from '../runtime';
import { Figure } from '../npc/Character';
import { enemyAnim, resetCombatRuntime, finishCombatWin } from './combat';
import { audio } from '../audio';

// Renders the encounter enemy + drives victory transition. The enemy FSM runs
// inside combatTick (called from Player's frame); this component only mirrors
// enemyPos into the render graph and watches for KO.
export function CombatScene() {
  const group = useRef<THREE.Group>(null);
  const winTimer = useRef(-1);
  const encounterId = useCombat((s) => s.encounterId);
  const enemyCount = useCombat((s) => s.enemies.length);

  // (re)initialize when a new encounter or enemy starts
  useEffect(() => {
    if (!encounterId) return;
    resetCombatRuntime();
    const a = Math.random() * Math.PI * 2;
    enemyPos.x = playerPos.x + Math.sin(a) * 3.4;
    enemyPos.z = playerPos.z + Math.cos(a) * 3.4;
    enemyPos.active = true;
    enemyAnim.current.down = false;
    winTimer.current = -1;
    audio.combatStart();
    inputRelease();
  }, [encounterId, enemyCount]);

  useFrame(() => {
    const g = group.current;
    if (g) {
      g.position.x = THREE.MathUtils.lerp(g.position.x, enemyPos.x, 0.5);
      g.position.z = THREE.MathUtils.lerp(g.position.z, enemyPos.z, 0.5);
      const dx = playerPos.x - g.position.x;
      const dz = playerPos.z - g.position.z;
      if (Math.hypot(dx, dz) > 0.1) g.rotation.y = Math.atan2(dx, dz);
    }

    const combat = useCombat.getState();
    if (combat.phase !== 'fighting') return;
    const enemy = combat.enemy();
    if (!enemy) return;

    if (enemy.hp <= 0) {
      if (winTimer.current < 0) {
        winTimer.current = 1.4;
        requestShake(0.3);
      } else {
        winTimer.current -= 1 / 60;
        if (winTimer.current <= 0) finishCombatWin();
      }
    }
  });

  const combat = useCombat.getState();
  const enemy = combat.enemy();

  return (
    <>
      {enemy && (
        <group ref={group} position={[enemyPos.x, 0, enemyPos.z]}>
          <Figure anim={enemyAnim} color={enemy.color} accent="#111827" scale={enemy.scale ?? 1.05} nameTag={enemy.name} />
        </group>
      )}
    </>
  );
}

function inputRelease() {
  // nudge: ensure right-mouse block doesn't stick from the click that started combat
  // (handled by input module state naturally)
  void usePlayer;
  void useGame;
}
