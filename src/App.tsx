import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
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
import { mobile } from './game/mobile';
import { OPENING_ROOT, OPENING_ACTORS } from './data/chapters';
import { PLAYER_SPAWN } from './data/world';

import { World } from './game/world/World';
import { Player } from './game/player/Player';
import { CameraRig } from './game/camera/CameraRig';
import { Npcs, StoryActors } from './game/npc/Npc';
import { CombatScene } from './game/combat/CombatScene';
import { StoryDirector } from './game/StoryDirector';
import { resetCombatRuntime } from './game/combat/combat';
import { SCENES } from './data/world';

import { MainMenu } from './game-ui/MainMenu';
import { Hud, Notifications, CombatHud } from './game-ui/Hud';
import { DialogueUI } from './game-ui/DialogueUI';
import { LoadingScreen, ChapterTransition, GameOverScreen, EndingScreen } from './game-ui/Screens';
import { TouchControls } from './game-ui/TouchControls';
import { DiagnosticsChip } from './game-ui/DiagnosticsChip';
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
  const scene = useGame((s) => s.scene);
  const sceneLoading = useGame((s) => s.sceneLoading);
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
    useGame.getState().setScene('campus');
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
    // BUG-FIX: don't overwrite the auto checkpoint after an ending — the
    // post-ending snapshot (route resolved, finale flags set) is not a
    // playable state and would poison CONTINUE on the main menu.
    if (!useGame.getState().ending) saveGame('auto');
    useGame.getState().resetAll();
    useStory.getState().resetAll();
    audio.stopAmbient();
  }, []);

  return (
    <div className="app">
      <Canvas
        camera={{ position: [7, 1.62, 44], fov: 60, near: 0.1, far: 500 }}
        shadows={mobile.lowSpec ? 'basic' : true}
        // v0.5.0 mobile tier: dpr cap 1.5 + antialias off on phones — the v0.4.x
        // full-fat config (dpr 2 + MSAA + 2048 shadows) could kill the GPU loop
        // on mid-range Android = the "blank world" report
        dpr={mobile.dpr}
        gl={{
          antialias: !mobile.lowSpec,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          // WebGL context loss recovery — previously a lost context meant a
          // permanently blank canvas with zero user-visible feedback.
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault(); // allow restore
            mobile.report('webgl', 'Konteks WebGL hilang — mencoba pulihkan…');
          });
          gl.domElement.addEventListener('webglcontextrestored', () => {
            mobile.contextRecovered = true;
            mobile.report('webgl', 'Konteks WebGL pulih');
          });
        }}
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
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          {phase === 'play' && (
            <>
              {/* If anything inside the world throws (asset hiccup, driver
                  quirk), fall back to a walkable flat plane instead of a
                  blank canvas — the show must go on. */}
              <SceneErrorBoundary>
                <Suspense fallback={null}>
                  <World />
                </Suspense>
              </SceneErrorBoundary>
              <Player />
              {scene === 'campus' && <Npcs hideMain={mode === 'CINEMATIC'} />}
              <StoryDirector />
              {mode === 'COMBAT' && <CombatScene />}
              {mode === 'CINEMATIC' && <CinematicActors />}
            </>
          )}
          <CameraRig />
        </Physics>
      </Canvas>

      {phase === 'boot' && <LoadingScreen />}
      {sceneLoading && <SceneLoadingOverlay />}
      {fade !== 'none' && <div className={`fade-overlay fade-${fade}`} />}
      <TouchControls />
      <DiagnosticsChip />
      {phase === 'menu' && (mode === 'SAVELOAD_MENU' || mode === 'SETTINGS') && (
        <FullMenu title={mode === 'SETTINGS' ? <>PENGATURAN <em>//</em> SISTEM</> : <>MUAT <em>//</em> PERMAINAN</>} onClose={() => useGame.getState().setMode('MAIN_MENU')}>
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
        <FullMenu title={<>JEDA <em>//</em> SISTEM</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="SISTEM // MENU JEDA">
          <div className="pause-options">
            <button onClick={() => useGame.getState().setMode('STATUS_MENU')}>STATUS REN <kbd>TAB</kbd></button>
            <button onClick={() => useGame.getState().setMode('RELATIONSHIP_MENU')}>JARINGAN SOSIAL <kbd>R</kbd></button>
            <button onClick={() => useGame.getState().setMode('QUEST_MENU')}>JURNAL AGENDA <kbd>J</kbd></button>
            <button onClick={() => useGame.getState().setMode('INVENTORY_MENU')}>TAS <kbd>I</kbd></button>
            <button onClick={() => useGame.getState().setMode('MAP_MENU')}>PETA SEKOLAH <kbd>M</kbd></button>
            <button onClick={() => useGame.getState().setMode('PHONE_MENU')}>PONSEL <kbd>P</kbd></button>
            <button onClick={() => useGame.getState().setMode('SAVELOAD_MENU')}>SIMPAN / MUAT <kbd>O</kbd></button>
            <button onClick={() => useGame.getState().setMode('SETTINGS')}>PENGATURAN</button>
            <button onClick={() => { saveGame('auto'); useGame.getState().setMode('GAMEPLAY'); }}>LANJUTKAN <kbd>ESC</kbd></button>
          </div>
        </FullMenu>
      )}
      {phase === 'play' && mode === 'STATUS_MENU' && <FullMenu title={<>STATUS <em>//</em> REN</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="PERSONNEL // ACADEMIC RECORD"><StatusPanel /></FullMenu>}
      {phase === 'play' && mode === 'RELATIONSHIP_MENU' && <FullMenu title={<>JARINGAN <em>//</em> SOSIAL</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="CAMPUS // SYNDICATE LOG"><RelationshipsPanel /></FullMenu>}
      {phase === 'play' && mode === 'QUEST_MENU' && <FullMenu title={<>JURNAL <em>//</em> AGENDA</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="MISSION // TASK LOG"><QuestsPanel /></FullMenu>}
      {phase === 'play' && mode === 'INVENTORY_MENU' && <FullMenu title={<>TAS <em>//</em> REN</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="STORAGE // ITEM LOG"><InventoryPanel /></FullMenu>}
      {phase === 'play' && mode === 'MAP_MENU' && <FullMenu title={<>PETA <em>//</em> SEKOLAH</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="SCHEMATIC // CAMPUS MAP"><MapPanel /></FullMenu>}
      {phase === 'play' && mode === 'PHONE_MENU' && <FullMenu title={<>PONSEL <em>//</em> REN</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="DIEGETIC UI // YUSON_PHONE"><PhonePanel /></FullMenu>}
      {phase === 'play' && mode === 'SAVELOAD_MENU' && <FullMenu title={<>SIMPAN <em>//</em> MUAT</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="MEMORY // SLOT LOG"><SaveLoadPanel /></FullMenu>}
      {phase === 'play' && mode === 'SETTINGS' && <FullMenu title={<>PENGATURAN <em>//</em> SISTEM</>} onClose={() => useGame.getState().setMode('GAMEPLAY')}><SettingsPanel /></FullMenu>}
      {phase === 'play' && mode === 'STUDY' && (
        <FullMenu title={<>BELAJAR <em>//</em> SESI</>} onClose={() => useGame.getState().setMode('GAMEPLAY')} eyebrow="SCHOOL LIFE // STUDY SESSION">
          <StudyPanel />
        </FullMenu>
      )}

      {mode === 'GAME_OVER' && <GameOverScreen onRestart={restart} />}
      {mode === 'ENDING' && <EndingScreen onRestart={restart} onMenu={toMenu} />}
    </div>
  );
}

// BUG-3.1: pointer lock UX hint. The overlay is pointer-events:none so it
// NEVER blocks mouse events. Auto-dismisses after 5 seconds so it doesn't
// block the view permanently. Camera works via drag-look (hold LMB) or
// pointer lock (click once).
function PointerLockHint() {
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    // Auto-request pointer lock on first click
    const onClick = () => {
      input.requestLock();
      setDismissed(true);
    };
    // Auto-dismiss after 5 seconds regardless
    const timer = setTimeout(() => setDismissed(true), 5000);
    window.addEventListener('click', onClick, { once: true });
    return () => {
      window.removeEventListener('click', onClick);
      clearTimeout(timer);
    };
  }, []);
  if (dismissed) return null;
  return (
    <div className="pointer-lock-hint">
      <div className="plh-inner brackets">
        <span className="chip chip-amber">KONTROL KAMERA</span>
        <strong>TAHAN KLIK KIRI + GERAKKAN MOUSE</strong>
        <span>untuk menggerakkan kamera</span>
        <span className="plh-alt">WASD bergerak · SHIFT lari · SPACE lompat · ESC jeda</span>
      </div>
    </div>
  );
}

// Cinematic actor placement (opening bullies, rooftop Bimo, alley gang…).
// Coordinates follow each scene's local layout (see data/world.ts).
function CinematicActors() {
  const nodeId = useDialogue((s) => s.nodeId);
  const placements = useMemo(() => {
    const list: { id: string; x: number; z: number; color: string; faceTo?: [number, number] }[] = [];
    if (!nodeId) return list;
    const open = OPENING_ACTORS[nodeId];
    if (open) {
      if (open.bullies[0]) {
        list.push({ id: 'bully1', x: open.bullies[0] - 0.8, z: open.bullies[1] + 0.4, color: '#57534e', faceTo: [-7, 31.2] });
        list.push({ id: 'bully2', x: open.bullies[0] + 0.9, z: open.bullies[1] - 0.3, color: '#44403c', faceTo: [-7, 31.2] });
      }
      if (open.aris[0]) list.push({ id: 'aris', x: open.aris[0], z: open.aris[1], color: '#3b82f6', faceTo: [-7.6, 29.6] });
      if (open.siti[0]) list.push({ id: 'siti', x: open.siti[0], z: open.siti[1], color: '#10b981', faceTo: [-7.6, 29.6] });
      if (open.bimo[0]) list.push({ id: 'bimo', x: open.bimo[0], z: open.bimo[1], color: '#ef4444', faceTo: [24, 4] });
      return list;
    }
    if (nodeId.startsWith('ch3_')) {
      // rooftop scene (local coords): Bimo at the north parapet
      list.push({ id: 'bimo', x: 0.3, z: -5.6, color: '#ef4444', faceTo: [0, -10] });
      return list;
    }
    if (['ch4_res_alley', 'ch4_res_choice', 'ch4_res_help_1', 'ch4_res_help_2', 'ch4_res_win', 'ch4_res_win_2'].includes(nodeId)) {
      list.push({ id: 'aris', x: 8, z: -20.5, color: '#3b82f6', faceTo: [6, -22] });
      list.push({ id: 'gang1', x: 5.5, z: -19.5, color: '#7f1d1d', faceTo: [8, -20.5] });
      list.push({ id: 'gang2', x: 10, z: -19, color: '#991b1b', faceTo: [8, -20.5] });
      if (['ch4_res_win_2'].includes(nodeId)) list.push({ id: 'siti', x: 12.5, z: -22, color: '#10b981', faceTo: [6, -22] });
      return list;
    }
    if (nodeId.startsWith('ch4_bad_raid')) {
      // warehouse scene (local coords)
      list.push({ id: 'gang1', x: -2.5, z: -2.5, color: '#7f1d1d', faceTo: [0, 7] });
      return list;
    }
    if (['ch4_res_1', 'ch4_res_2', 'ch4_res_3', 'ch4_res_4'].includes(nodeId)) {
      list.push({ id: 'aris', x: 6, z: 33, color: '#3b82f6' });
      list.push({ id: 'siti', x: 4.5, z: 34.5, color: '#10b981' });
      return list;
    }
    return list;
  }, [nodeId]);

  return <StoryActors placements={placements} />;
}

// Emergency fallback world: if the scene tree crashes, keep lights + a walkable
// floor so the player is never stuck in a void. Physics floor keeps colliders.
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    // eslint-disable-next-line no-console
    console.error('[CSL] world scene error — using fallback plane:', err);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color="#8d9298" roughness={0.9} />
        </mesh>
        {/* attaches to the outer <Physics> world — never nest Physics */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, -0.5, 0]} visible={false}>
            <boxGeometry args={[300, 1, 300]} />
            <meshStandardMaterial />
          </mesh>
        </RigidBody>
      </>
    );
  }
}

// Dark overlay shown while a scene transition (requestScene) is in flight.
function SceneLoadingOverlay() {
  const scene = useGame((s) => s.scene);
  const label = SCENES[scene]?.label ?? '';
  return (
    <div className="scene-loading">
      <div className="sl-inner">
        <div className="sl-spinner" />
        <strong>Berpindah lokasi…</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
