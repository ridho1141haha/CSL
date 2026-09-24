import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// v0.16.0 QA handle: headless tests (scripts/qa-*.mjs) read engine state
// without probing the DOM. Harmless in production — read-only refs.
import { useGame } from './stores/gameStore';
import { useCombat } from './stores/combatStore';
import { useDialogue } from './stores/dialogueStore';
import { useStory } from './stores/storyStore';
import { usePlayer } from './stores/playerStore';
import { input } from './game/input';
import { playerPos, enemyPos, camState } from './game/runtime';
import { camForwardAngle } from './game/systems/facing';

(window as unknown as Record<string, unknown>).__csl = {
  mode: () => useGame.getState().mode,
  phase: () => useGame.getState().phase,
  pos: () => ({ x: playerPos.x, y: playerPos.y, z: playerPos.z, facing: playerPos.facing }),
  // v0.16.1: camera yaw + the facing target it implies — qa-face.mjs asserts
  // the body actually converges to this angle after a real camera drag.
  camYaw: () => camState.yaw,
  camFacingTarget: () => camForwardAngle(camState.yaw),
  enemy: () => ({ x: enemyPos.x, z: enemyPos.z, active: enemyPos.active }),
  combat: () => {
    const c = useCombat.getState();
    return { encounterId: c.encounterId, phase: c.phase, index: c.index, enemies: c.enemies.map((e) => ({ name: e.name, hp: e.hp })) };
  },
  dialogue: () => useDialogue.getState().nodeId,
  beat: () => useStory.getState().beat,
  // QA actions — mirror the real effects.ts path (start + setMode), used by
  // scripts/qa-walk.mjs to reach combat without walking the whole story.
  startCombat: (id: string) => {
    useCombat.getState().start(id);
    useGame.getState().setMode('COMBAT');
  },
  // face the combat enemy — what walking toward them does; lets headless
  // QA land light attacks without a camera-relative walk dance.
  faceEnemy: () => {
    if (!enemyPos.active) return;
    playerPos.facing = Math.atan2(enemyPos.x - playerPos.x, enemyPos.z - playerPos.z);
  },
  // real teleport path (store → Player teleport effect, same as 'teleport'
  // story effect) — QA uses it to reach open ground away from spawn NPCs.
  teleport: (x: number, z: number) => {
    usePlayer.getState().setPos(x, z);
  },
  axes: () => ({ x: input.touch.axes.x, y: input.touch.axes.y }),
  // drive the touch axes the way TouchControls' joystick handlers do — lets
  // headless QA verify the axes→locomotion pipeline (the DOM event→axes leg
  // can't be exercised headless: CDP input hit-testing lags the compositor
  // at ~1 FPS and retargets to <body>).
  setAxes: (x: number, y: number) => input.setAxes(x, y),
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
