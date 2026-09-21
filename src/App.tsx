import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import { Physics, RigidBody, useRapier } from '@react-three/rapier';
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
import { useFrame } from '@react-three/fiber';
import { input } from './game/input';
import { audio, bgm } from './game/audio';
import { periodFor } from './game/systems/time';
import { saveGame } from './game/save';
import { mobile } from './game/mobile';
import { perfState, PREWARM } from './game/runtime';
import { GraphicsManager, CullingManager, WorldReadyProbe } from './game/perf';
import { OPENING_ROOT, OPENING_ACTORS, SCENE_ACTORS, type StorySpot } from './data/chapters';
import { PLAYER_SPAWN } from './data/world';
import { StoryPropFX } from './game/story/StoryProps';
import { applyPlayerStaging } from './game/story/staging';
import type { StoryPlacement } from './game/npc/Npc';

import { World } from './game/world/World';
import { Player } from './game/player/Player';
import { CameraRig } from './game/camera/CameraRig';
import { Npcs, StoryActors } from './game/npc/Npc';
import { CombatScene } from './game/combat/CombatScene';
import { StoryDirector } from './game/StoryDirector';
import { resetCombatRuntime } from './game/combat/combat';
import { nextMode } from './game/camera/mode';
import { useSettings } from './stores/settingsStore';
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

// v0.9.0: desktop-class devices build the world during boot/menu (prewarm,
// see runtime.ts) so "MULAI" lands in a ready scene and the loading bar
// tracks REAL progress. Low-tier phones keep lazy mounting (battery + memory).
const BOOT_MIN_MS = 1600;
// fail-open: if the render loop is dead (or extremely slow — old hardware,
// headless test shells) worldReady never flips, so we proceed shortly after
// the minimum window instead of hanging the loading screen
const BOOT_FAILSAFE_MS = 5100;

export default function App() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const scene = useGame((s) => s.scene);
  const sceneLoading = useGame((s) => s.sceneLoading);
  const boot = useGame((s) => s.boot);
  const pointerLocked = useGame((s) => s.pointerLocked);
  const fade = useGame((s) => s.fade);

  // v0.14.0 — BGM monitor (Task 8): SATU-satunya pemanggil bgm.sync di game.
  // Snapshot state 1x/detik → musicDecision (murni) → setTrack dengan fade
  // out/in bila track berubah. Komponen lain TIDAK boleh main musik sendiri
  // (anti-overlap audio): menu/combat/ending/tensi cerita/suasana hari
  // semuanya lewat sini.
  useEffect(() => {
    const tick = () => {
      const g = useGame.getState();
      const st = useStory.getState();
      bgm.sync({
        phase: g.phase,
        mode: g.mode,
        scene: g.scene,
        chapter: st.chapter,
        route: st.route,
        periodId: periodFor(g.clock.minutes).id,
        endingId: g.ending?.id ?? null,
      });
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  // v0.9.0: world prewarm (see PREWARM) — mounted during boot/menu on
  // desktop-class devices, always during play
  const worldMounted = phase === 'play' || PREWARM;

  // boot sequence: real loading gate — engine builds the world while the
  // loading screen tracks assets + first rendered frames, then menu
  useEffect(() => {
    input.attach();
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

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
        // v0.10.0 map-fix: Escape ALWAYS closes an overlay back to gameplay.
        // Previously menu modes fell through to setMode('PAUSE') here while
        // FullMenu's own onClose went to GAMEPLAY — the winner depended on
        // listener order, so Esc from the map could pop the pause menu open
        // instead of closing it. Both handlers now agree on the target mode.
        if (g.mode === 'GAMEPLAY') {
          e.preventDefault();
          g.setMode('PAUSE');
        } else if (['PAUSE', 'STATUS_MENU', 'RELATIONSHIP_MENU', 'QUEST_MENU', 'INVENTORY_MENU', 'MAP_MENU', 'PHONE_MENU', 'SAVELOAD_MENU', 'SETTINGS', 'STUDY'].includes(g.mode)) {
          e.preventDefault();
          g.setMode('GAMEPLAY');
        }
        return;
      }
      // v0.13.0: V toggles first-person / third-person camera in gameplay AND
      // combat — persisted via settings so the choice survives reloads.
      if (e.code === 'KeyV' && (inGameplay || g.mode === 'COMBAT')) {
        const s = useSettings.getState();
        const next = nextMode(s.camMode);
        s.set('camMode', next);
        g.notify(next === 'first' ? 'Kamera: Orang Pertama' : 'Kamera: Orang Ketiga', 'quest');
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
        // on mid-range Android = the "blank world" report. v0.9.0: GraphicsManager
        // re-applies dpr/shadows live from the quality preset.
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
        {/* v0.9.0: root-level duplicate light rig REMOVED — every scene mounts
            its own ambient/hemi/sun (previously BOTH ran at once, so two
            shadow-casting directionals rendered the shadow map twice). The
            plain background color covers the first frames before World mounts. */}
        <color attach="background" args={['#9fb6c9']} />
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          {/* v0.9.0: world prewarm — mounts during boot/menu on desktop-class
              devices so the loading screen covers real engine work */}
          {worldMounted && (
            <SceneErrorBoundary>
              <Suspense fallback={null}>
                <World />
              </Suspense>
            </SceneErrorBoundary>
          )}
          {worldMounted && <WorldReadyProbe />}
          {phase === 'play' && (
            <>
              <Player />
              {scene === 'campus' && <Npcs hideMain={mode === 'CINEMATIC'} />}
              {scene === 'campus' && <StoryPropFX />}
              <StoryDirector />
              <InputJanitor />
              {mode === 'COMBAT' && <CombatScene />}
              {mode === 'CINEMATIC' && <CinematicActors />}
              <StoryPlayerStaging />
              <FPViewModel />
            </>
          )}
          <PhysicsProbe />
          <CameraRig />
        </Physics>
        <GraphicsManager />
        <CullingManager />
      </Canvas>

      {phase === 'boot' && <LoadingScreen />}
      {phase === 'boot' && <BootGate onReady={boot} />}
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

// v0.9.0: real loading gate — flips to the main menu only when the world has
// actually rendered its first frames (prewarm), async assets finished, and the
// minimum branding time elapsed. Failsafe timer keeps a dead GPU from hanging
// the loading screen forever.
function BootGate({ onReady }: { onReady: () => void }) {
  const { active, progress } = useProgress();
  const stateRef = useRef({ active, progress });
  stateRef.current = { active, progress };
  const done = useRef(false);
  useEffect(() => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (done.current) {
        clearInterval(iv);
        return;
      }
      if (useGame.getState().phase !== 'boot') {
        done.current = true;
        return;
      }
      const elapsed = Date.now() - t0;
      const { active: a, progress: p } = stateRef.current;
      // fail-open when the render loop looks dead (headless test shells, dead
      // GPU): CameraRig's frame loop pets mobile.lastFrameAt — if it has never
      // petted or stalled >1.2s, don't wait for world-first-frame anymore
      const loopDead = mobile.lastFrameAt === 0 || Date.now() - mobile.lastFrameAt > 1200;
      const worldOk = perfState.worldReady || !PREWARM || loopDead;
      const assetsOk = !a && p >= 100;
      if ((worldOk && assetsOk && elapsed >= BOOT_MIN_MS) || elapsed >= BOOT_FAILSAFE_MS) {
        done.current = true;
        clearInterval(iv);
        onReady();
      }
    }, 100);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
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

// v0.14.0 — Story staging runner (Task 2/3): setiap node dialogue yang punya
// data REN_STAGING memindahkan Ren ke titik cerita deterministik + menghadap-
// kan dia. Input sudah terkunci saat DIALOGUE/CINEMATIC, dan scene-start
// difade via NODE_FX — teleport tidak pernah terlihat kasar. Node tanpa data
// (NPC talk, zone flavor, opening FP) tidak pernah disentuh → free roam utuh.
function StoryPlayerStaging() {
  const nodeId = useDialogue((s) => s.nodeId);
  useEffect(() => {
    if (nodeId) applyPlayerStaging(nodeId);
  }, [nodeId]);
  return null;
}

// Cinematic actor placement. v0.7.0: satu schema Spot { pos, face } untuk
// OPENING_ACTORS (alur lambat "Minggu Pertama") dan SCENE_ACTORS (bab 2 tangga,
// montage netral, graduasi). Semua koordinat kampus/interior (data/chapters.ts).
// v0.12.0: Spot juga membawa sit/crouch/hold — dipakai Figure untuk pose
// duduk/jongkok dan prop cerita di tangan.
function CinematicActors() {
  const nodeId = useDialogue((s) => s.nodeId);
  const placements = useMemo(() => {
    const list: StoryPlacement[] = [];
    if (!nodeId) return list;
    const cast = OPENING_ACTORS[nodeId] ?? SCENE_ACTORS[nodeId];
    if (cast) {
      const push = (base: string, i: number, spot: StorySpot, color: string) => {
        list.push({
          id: i === 0 ? base : `${base}${i}`,
          x: spot.pos[0],
          z: spot.pos[1],
          color,
          faceTo: spot.face,
          sit: spot.sit,
          crouch: spot.crouch,
          hold: spot.hold,
        });
      };
      // base id 'gang*' → placedActor('gang') menemukannya untuk shot ORANG
      // GENG (ch2 & montage netral); opening sendiri tidak punya node BULLY.
      cast.bullies?.forEach((s, i) => push('gang', i, s, i % 2 ? '#44403c' : '#57534e'));
      if (cast.aris) push('aris', 0, cast.aris, '#3b82f6');
      if (cast.siti) push('siti', 0, cast.siti, '#10b981');
      if (cast.bimo) push('bimo', 0, cast.bimo, '#ef4444');
      cast.followers?.forEach((s, i) => push('follower', i, s, '#7f1d1d'));
      return list;
    }
    if (nodeId.startsWith('ch3_') && !nodeId.startsWith('ch3_osis') && !nodeId.startsWith('ch3_f2')) {
      // rooftop scene (local coords): Bimo at the north parapet
      list.push({ id: 'bimo', x: 0.3, z: -5.6, color: '#ef4444', faceTo: [0, -10] });
      return list;
    }
    // v0.11.0 GARIS MERAH: aktor gang/kelulusan kini dipasok data
    // SCENE_ACTORS (chapters.ts) — tidak ada lagi hardcode di sini.
    if (['ch4_res_1', 'ch4_res_2', 'ch4_res_3', 'ch4_res_4'].includes(nodeId)) {
      list.push({ id: 'aris', x: 6, z: 33, color: '#3b82f6' });
      list.push({ id: 'siti', x: 4.5, z: 34.5, color: '#10b981' });
      return list;
    }
    return list;
  }, [nodeId]);

  return <StoryActors placements={placements} />;
}

// v0.12.0 — Viewmodel tangan Ren saat opening FIRST-PERSON (permintaan user:
// "pas di opening, kan ren pegang buku"). Scene 1: map merah berkas pindahan
// di genggaman; scene 2 & 4: buku catatan. Ikut kamera + sway halus napas.
const FP_MAP_NODES = new Set(['o1_3', 'o1_4', 'o1_5', 'o1_6']);
const FP_BOOK_NODES = new Set(
  [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `o2_${i}`).concat(Array.from({ length: 11 }, (_, i) => `o4_${i + 1}`)),
);

function FPViewModel() {
  const nodeId = useDialogue((s) => s.nodeId);
  const mode = useGame((s) => s.mode);
  const openingDone = useStory((s) => s.flags.includes('opening_complete'));
  const kind = FP_MAP_NODES.has(nodeId ?? '') ? 'map' : FP_BOOK_NODES.has(nodeId ?? '') ? 'book' : null;
  const ref = useRef<THREE.Group>(null);
  const tmp = useRef(new THREE.Vector3());
  useFrame(({ camera, clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = clock.elapsedTime;
    tmp.current.set(0.33, -0.3 + Math.sin(t * 1.6) * 0.007, -0.55)
      .applyQuaternion(camera.quaternion)
      .add(camera.position);
    g.position.copy(tmp.current);
    g.quaternion.copy(camera.quaternion);
    g.rotateY(-0.3);
    g.rotateX(0.12);
    g.rotateZ(Math.sin(t * 1.1) * 0.02);
  });
  if (openingDone || mode !== 'CINEMATIC' || !kind) return null;
  return (
    <group ref={ref}>
      {kind === 'map' ? (
        // map merah berkas pindahan (naskah scene 1)
        <group rotation={[0.9, 0, 0.1]}>
          <mesh>
            <boxGeometry args={[0.13, 0.006, 0.17]} />
            <meshStandardMaterial color="#b3282d" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[0.112, 0.003, 0.15]} />
            <meshStandardMaterial color="#f1e8d8" roughness={0.85} />
          </mesh>
        </group>
      ) : (
        // buku catatan dibaca ulang (scene 2 & 4)
        <group rotation={[1.0, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.12, 0.006, 0.16]} />
            <meshStandardMaterial color="#5a4a35" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.006, 0]}>
            <boxGeometry args={[0.105, 0.004, 0.14]} />
            <meshStandardMaterial color="#e7dcc3" roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}

// Input janitor (v0.6 regression fix): input.endFrame() clears just-pressed
// actions, so it must run AFTER every consumer. The Player used to clear at
// the end of its own frame — but R3F runs frames in mount order and the
// Player mounts BEFORE StoryDirector, so justPressed('interact') was read
// from an already-cleared set and E-interaction silently never fired.
// The janitor mounts after StoryDirector (inside Physics) and owns the
// cleanup. Wheel is untouched (explicit consume in CameraRig, which runs last).
function InputJanitor() {
  useFrame(() => input.endFrame());
  return null;
}

// TEMP DEBUG (remove before release): expose the live Rapier world so the
// console can verify collider registration. v0.12.0: also expose the Ray
// class — scripts/qa-walkability.mjs casts physics rays through the building
// to prove the new corridor/vestibule passages are truly walkable.
function PhysicsProbe() {
  const { world, rapier } = useRapier();
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__cslWorld = world;
    (window as unknown as Record<string, unknown>).__cslRayClass = (rapier as unknown as { Ray: unknown }).Ray;
    (window as unknown as Record<string, unknown>).__cslInput = input;
    (window as unknown as Record<string, unknown>).__cslGame = useGame;
    (window as unknown as Record<string, unknown>).__cslPlayer = usePlayer;
  }, [world, rapier]);
  return null;
}

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
        {/* own minimal light rig — the root lights were removed in v0.9.0 */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} />
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
