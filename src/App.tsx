import { Suspense, useCallback, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { useGame } from './stores/gameStore';
import { useStory } from './stores/storyStore';
import { useDialogue } from './stores/dialogueStore';
import { useCombat } from './stores/combatStore';
import { usePlayer } from './stores/playerStore';
import { useStats } from './stores/statsStore';
import { useSocial } from './stores/socialStore';
import { useQuests } from './stores/questStore';
import { useInventory } from './stores/inventoryStore';
import { input } from './game/input';
import { audio } from './game/audio';
import { saveGame } from './game/save';
import { OPENING_ROOT, OPENING_ACTORS } from './data/chapters';
import { PLAYER_SPAWN } from './data/world';

import { World } from './game/world/World';
import { Player } from './game/player/Player';
import { CameraRig } from './game/camera/CameraRig';
import { Npcs, StoryActors } from './game/npc/Npc';
import { CombatScene } from './game/combat/CombatScene';
import { StoryDirector } from './game/StoryDirector';
import { resetCombatRuntime } from './game/combat/combat';

import { MainMenu } from './game-ui/MainMenu';
import { Hud, Notifications, CombatHud } from './game-ui/Hud';
import { DialogueUI } from './game-ui/DialogueUI';
import { LoadingScreen, ChapterTransition, GameOverScreen, EndingScreen } from './game-ui/Screens';
import {
  FullMenu,
  StatusPanel,
  RelationshipsPanel,
  QuestsPanel,
  InventoryPanel,
  MapPanel,
  PhonePanel,
  SettingsPanel,
  SaveLoadPanel,
  StudyPanel,
} from './game-ui/menus';

export default function App() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const boot = useGame((s) => s.boot);
  const pointerLocked = useGame((s) => s.pointerLocked);
  const fade = useGame((s) => s.fade);

  // boot sequence: show loading, unlock audio on first gesture, then menu
  useEffect(() => {
    input.attach();
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    const t = setTimeout(() => {
      if (useGame.getState().phase === 'boot') boot();
    }, 1400);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [boot]);

  // BUG-3.1: mirror pointer lock state into gameStore so the "click to control"
  // overlay can render when gameplay is active but pointer is not locked.
  useEffect(() => {
    const onLockChange = () => {
      useGame.getState().setPointerLocked(document.pointerLockElement != null);
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, []);

  // UI keyboard shortcuts (mode-aware)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = useGame.getState();
      if (g.phase !== 'play') return;
      const inGameplay = g.mode === 'GAMEPLAY';
      if (e.code === 'Escape') {
        if (['GAMEPLAY', 'PAUSE', 'STATUS_MENU', 'RELATIONSHIP_MENU', 'QUEST_MENU', 'INVENTORY_MENU', 'MAP_MENU', 'PHONE_MENU', 'SAVELOAD_MENU', 'SETTINGS', 'STUDY'].includes(g.mode)) {
          e.preventDefault();
          if (g.mode === 'PAUSE' || g.mode === 'SETTINGS' || g.mode === 'STUDY') g.setMode('GAMEPLAY');
          else if (g.mode === 'GAMEPLAY') g.setMode('PAUSE');
          else g.setMode('PAUSE');
        }
        return;
      }
      if (!inGameplay) return;
      if (e.code === 'Tab') { e.preventDefault(); g.setMode('STATUS_MENU'); }
      if (e.code === 'KeyR') g.setMode('RELATIONSHIP_MENU');
      if (e.code === 'KeyM') g.setMode('MAP_MENU');
      if (e.code === 'KeyP') g.setMode('PHONE_MENU');
      if (e.code === 'KeyI') g.setMode('INVENTORY_MENU');
      if (e.code === 'KeyJ') g.setMode('QUEST_MENU');
      if (e.code === 'KeyO') g.setMode('SAVELOAD_MENU');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startGame = useCallback(() => {
    audio.unlock();
    useGame.getState().resetAll();
    useStory.getState().resetAll();
    usePlayer.getState().resetAll();
    useStats.getState().resetAll();
    useSocial.getState().resetAll();
    useQuests.getState().resetAll();
    useInventory.getState().resetAll();
    useCombat.getState().reset();
    useDialogue.getState().reset();
    // Reset combat runtime anim state — ensures playerAnim.current.down = false
    // so the player character starts upright, not crouched/lying from a previous session
    resetCombatRuntime();
    usePlayer.getState().spawn(PLAYER_SPAWN[0], PLAYER_SPAWN[1]);
    const g = useGame.getState();
    g.setPhase('play');
    g.setMode('CINEMATIC');
    audio.sting(false);
    audio.startAmbient();
    saveGame('auto');
    useDialogue.getState().open(OPENING_ROOT, true);
  }, []);

  const continueGame = useCallback(() => {
    audio.unlock();
    // lazy import to avoid cycle: loadGame applies + sets mode
    import('./game/save').then(({ loadGame }) => {
      const err = loadGame('auto');
      if (err) useGame.getState().notify(err, 'warn');
      else {
        useGame.getState().setPhase('play');
        audio.startAmbient();
      }
    });
  }, []);

  const restart = useCallback(() => {
    startGame();
  }, [startGame]);

  const toMenu = useCallback(() => {
    saveGame('auto');
    useGame.getState().resetAll();
    useStory.getState().resetAll();
    audio.stopAmbient();
  }, []);

  return (
    <div className="app">
      <Canvas
        camera={{ position: [7, 1.62, 44], fov: 60, near: 0.1, far: 500 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#9fb6c9']} />
        <fog attach="fog" args={['#a8bccb', 60, 220]} />
        <ambientLight intensity={0.65} />
        <hemisphereLight args={['#dbeafe', '#4b5f45', 0.5]} />
        <directionalLight
          position={[-40, 55, 60]}
          intensity={2.6}
          color="#fff3dd"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={1}
          shadow-camera-far={220}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
        />
        <Environment preset="city" environmentIntensity={0.45} />
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          {phase === 'play' && (
            <>
              <World />
              <Player />
              <Npcs hideMain={mode === 'CINEMATIC'} />
              <StoryDirector />
              {mode === 'COMBAT' && <CombatScene />}
              {mode === 'CINEMATIC' && <CinematicActors />}
            </>
          )}
          <CameraRig />
        </Physics>
      </Canvas>

      {phase === 'boot' && <LoadingScreen />}
      {fade !== 'none' && <div className={`fade-overlay fade-${fade}`} />}
      {phase === 'menu' && (mode === 'SAVELOAD_MENU' || mode === 'SETTINGS') && (
        <FullMenu title={mode === 'SETTINGS' ? 'SETTINGS' : 'LOAD GAME'} onClose={() => useGame.getState().setMode('MAIN_MENU')}>
          {mode === 'SETTINGS' ? <SettingsPanel /> : <SaveLoadPanel />}
        </FullMenu>
      )}
      {phase === 'menu' && mode !== 'SAVELOAD_MENU' && mode !== 'SETTINGS' && <MainMenu onStart={startGame} onLoad={continueGame} />}

      {phase === 'play' && (mode === 'CINEMATIC' || mode === 'DIALOGUE') && <DialogueUI cinematic={mode === 'CINEMATIC'} />}

      {phase === 'play' && mode === 'GAMEPLAY' && <Hud />}
      {phase === 'play' && mode === 'GAMEPLAY' && !pointerLocked && <PointerLockHint />}
      {phase === 'play' && mode === 'COMBAT' && <CombatHud />}
      {phase === 'play' && mode === 'TRANSITION' && <ChapterTransition />}
      <Notifications />

      {phase === 'play' && mode === 'PAUSE' && (
        <FullMenu title="PAUSED" onClose={() => useGame.getState().setMode('GAMEPLAY')}>
          <div className="pause-options">
            <button onClick={() => useGame.getState().setMode('STATUS_MENU')}>CHARACTER / STATUS <kbd>TAB</kbd></button>
            <button onClick={() => useGame.getState().setMode('RELATIONSHIP_MENU')}>RELATIONSHIPS <kbd>R</kbd></button>
            <button onClick={() => useGame.getState().setMode('QUEST_MENU')}>QUESTS <kbd>J</kbd></button>
            <button onClick={() => useGame.getState().setMode('INVENTORY_MENU')}>INVENTORY <kbd>I</kbd></button>
            <button onClick={() => useGame.getState().setMode('MAP_MENU')}>SCHOOL MAP <kbd>M</kbd></button>
            <button onClick={() => useGame.getState().setMode('PHONE_MENU')}>PHONE <kbd>P</kbd></button>
            <button onClick={() => useGame.getState().setMode('SAVELOAD_MENU')}>SAVE / LOAD <kbd>O</kbd></button>
            <button onClick={() => useGame.getState().setMode('SETTINGS')}>SETTINGS</button>
            <button onClick={() => { saveGame('auto'); useGame.getState().setMode('GAMEPLAY'); }}>RESUME <kbd>ESC</kbd></button>
          </div>
        </FullMenu>
      )}
      {phase === 'play' && mode === 'STATUS_MENU' && <FullMenu title="CHARACTER / STATUS" onClose={() => useGame.getState().setMode('GAMEPLAY')}><StatusPanel /></FullMenu>}
      {phase === 'play' && mode === 'RELATIONSHIP_MENU' && <FullMenu title="RELATIONSHIPS" onClose={() => useGame.getState().setMode('GAMEPLAY')}><RelationshipsPanel /></FullMenu>}
      {phase === 'play' && mode === 'QUEST_MENU' && <FullMenu title="QUESTS" onClose={() => useGame.getState().setMode('GAMEPLAY')}><QuestsPanel /></FullMenu>}
      {phase === 'play' && mode === 'INVENTORY_MENU' && <FullMenu title="INVENTORY" onClose={() => useGame.getState().setMode('GAMEPLAY')}><InventoryPanel /></FullMenu>}
      {phase === 'play' && mode === 'MAP_MENU' && <FullMenu title="SCHOOL MAP" onClose={() => useGame.getState().setMode('GAMEPLAY')}><MapPanel /></FullMenu>}
      {phase === 'play' && mode === 'PHONE_MENU' && <FullMenu title="PHONE" onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="DIEGETIC UI // YUSON_PHONE"><PhonePanel /></FullMenu>}
      {phase === 'play' && mode === 'SAVELOAD_MENU' && <FullMenu title="SAVE / LOAD" onClose={() => useGame.getState().setMode('GAMEPLAY')}><SaveLoadPanel /></FullMenu>}
      {phase === 'play' && mode === 'SETTINGS' && <FullMenu title="SETTINGS" onClose={() => useGame.getState().setMode('GAMEPLAY')}><SettingsPanel /></FullMenu>}
      {phase === 'play' && mode === 'STUDY' && (
        <FullMenu title="BELAJAR" onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="SCHOOL LIFE // STUDY SESSION">
          <StudyPanel />
        </FullMenu>
      )}

      {mode === 'GAME_OVER' && <GameOverScreen onRestart={restart} />}
      {mode === 'ENDING' && <EndingScreen onRestart={restart} onMenu={toMenu} />}
    </div>
  );
}

// BUG-3.1: pointer lock UX hint. The overlay is pointer-events:none so it
// NEVER blocks mouse events from reaching the CameraRig's window-level
// listeners. Click anywhere to engage pointer lock (CameraRig handles it).
function PointerLockHint() {
  useEffect(() => {
    // Auto-request pointer lock on first click after mount
    const onClick = () => input.requestLock();
    window.addEventListener('click', onClick, { once: true });
    return () => window.removeEventListener('click', onClick);
  }, []);
  return (
    <div className="pointer-lock-hint">
      <div className="plh-inner">
        <div className="plh-icon">🖱</div>
        <strong>KLIK MANA SAJA UNTUK KAMERA</strong>
        <span>WASD bergerak · MOUSE lihat sekeliling · ESC pause</span>
        <span className="plh-alt">atau tahan KLIK KIRI untuk drag-look</span>
      </div>
    </div>
  );
}

// Cinematic actor placement (opening bullies, rooftop Bimo, alley gang…)
function CinematicActors() {
  const nodeId = useDialogue((s) => s.nodeId);
  const placements = useMemo(() => {
    const list: { id: string; x: number; z: number; color: string; faceTo?: [number, number] }[] = [];
    if (!nodeId) return list;
    const open = OPENING_ACTORS[nodeId];
    if (open) {
      if (open.bullies[0]) {
        list.push({ id: 'bully1', x: open.bullies[0] - 0.8, z: open.bullies[1] + 0.4, color: '#57534e', faceTo: [-12.6, 15.4] });
        list.push({ id: 'bully2', x: open.bullies[0] + 0.9, z: open.bullies[1] - 0.3, color: '#44403c', faceTo: [-12.6, 15.4] });
      }
      if (open.aris[0]) list.push({ id: 'aris', x: open.aris[0], z: open.aris[1], color: '#3b82f6', faceTo: [-8, 22] });
      if (open.siti[0]) list.push({ id: 'siti', x: open.siti[0], z: open.siti[1], color: '#10b981', faceTo: [-12.2, 16.5] });
      if (open.bimo[0]) list.push({ id: 'bimo', x: open.bimo[0], z: open.bimo[1], color: '#ef4444', faceTo: [22, 12] });
      return list;
    }
    if (nodeId.startsWith('ch3_')) {
      list.push({ id: 'bimo', x: 4.5, z: -13.5, color: '#ef4444', faceTo: [1.5, -12] });
      return list;
    }
    if (['ch4_res_alley', 'ch4_res_choice', 'ch4_res_help_1', 'ch4_res_help_2', 'ch4_res_win', 'ch4_res_win_2'].includes(nodeId)) {
      list.push({ id: 'aris', x: 8.6, z: -24.6, color: '#3b82f6', faceTo: [7, -21] });
      list.push({ id: 'gang1', x: 6.2, z: -23.2, color: '#7f1d1d', faceTo: [8.6, -24.6] });
      list.push({ id: 'gang2', x: 9.4, z: -22.8, color: '#991b1b', faceTo: [8.6, -24.6] });
      if (['ch4_res_win_2'].includes(nodeId)) list.push({ id: 'siti', x: 10.6, z: -26, color: '#10b981', faceTo: [7, -24] });
      return list;
    }
    if (nodeId.startsWith('ch4_bad_raid')) {
      list.push({ id: 'gang1', x: -30, z: -25, color: '#7f1d1d' });
      return list;
    }
    if (['ch4_res_1', 'ch4_res_2', 'ch4_res_3', 'ch4_res_4'].includes(nodeId)) {
      list.push({ id: 'aris', x: 12, z: 24, color: '#3b82f6' });
      list.push({ id: 'siti', x: 10, z: 25, color: '#10b981' });
      return list;
    }
    return list;
  }, [nodeId]);

  return <StoryActors placements={placements} />;
}
