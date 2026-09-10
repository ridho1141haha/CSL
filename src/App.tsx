import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Center, Environment, Text, useGLTF } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { useGameStore } from './store';
import { openingLines, type Choice, type Line } from './game';

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const gameMode = useGameStore((s) => s.gameMode);
  const player = useGameStore((s) => s.player);
  const dialogue = useGameStore((s) => s.dialogue);
  const line = useGameStore((s) => s.line);
  const awaitingChoice = useGameStore((s) => s.awaitingChoice);
  const startGame = useGameStore((s) => s.startGame);
  const setPhase = useGameStore((s) => s.setPhase);
  const setDialogue = useGameStore((s) => s.setDialogue);
  const nextLine = useGameStore((s) => s.nextLine);
  const openChoice = useGameStore((s) => s.openChoice);
  const makeChoice = useGameStore((s) => s.makeChoice);
  const flag = useGameStore((s) => s.flag);
  const visit = useGameStore((s) => s.visit);
  const reset = useGameStore((s) => s.reset);
  const setMode = useGameStore((s) => s.setMode);
  const interact = useGameStore((s) => s.interact);
  const restart = useGameStore((s) => s.restart);

  useEffect(() => {
    if (phase !== 'opening') return;
    flag('arrived');
    setDialogue(openingLines);
  }, [flag, phase, setDialogue]);

  useEffect(() => {
    if (phase !== 'opening' || dialogue.length || awaitingChoice) return;
    const t = setTimeout(openChoice, 900);
    return () => clearTimeout(t);
  }, [awaitingChoice, dialogue.length, openChoice, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'play' || ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Escape') setMode(gameMode === 'PAUSE' ? 'NORMAL_GAMEPLAY' : 'PAUSE');
      if (e.code === 'Tab') { e.preventDefault(); setMode(gameMode === 'STATUS_MENU' ? 'NORMAL_GAMEPLAY' : 'STATUS_MENU'); }
      if (e.code === 'KeyR') setMode(gameMode === 'RELATIONSHIP_MENU' ? 'NORMAL_GAMEPLAY' : 'RELATIONSHIP_MENU');
      if (e.code === 'KeyM') setMode(gameMode === 'MAP_MENU' ? 'NORMAL_GAMEPLAY' : 'MAP_MENU');
      if (e.code === 'KeyE') interact();
      if (gameMode === 'COMBAT' && e.code === 'KeyJ') useGameStore.getState().combatAction('strike');
      if (gameMode === 'COMBAT' && e.code === 'KeyK') useGameStore.getState().combatAction('guard');
      if (gameMode === 'COMBAT' && e.code === 'KeyL') useGameStore.getState().combatAction('focus');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameMode, interact, phase, setMode]);

  const finishOpening = (choice: Choice) => {
    makeChoice(choice);
    flag('opening_complete');
    visit('aris');
    visit('siti');
    visit('bimo');
  };

  return (
    <div className="app">
      <Canvas camera={{ position: [0, 1.7, 0.1], fov: 60 }} shadows gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }} dpr={[1, 2]}>
        <color attach="background" args={['#242e38']} />
        <fog attach="fog" args={['#242e38', 150, 450]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[-30, 60, 40]} intensity={2.8} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-near={1} shadow-camera-far={250} shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={80} shadow-camera-bottom={-80} />
        <Environment preset="city" environmentIntensity={0.5} />
        <Physics gravity={[0, -9.81, 0]}>
          <World phase={phase} gameMode={gameMode} />
        </Physics>
      </Canvas>

      {phase === 'menu' && <Menu onStart={startGame} onReset={reset} />}
      {(phase === 'opening' || (phase === 'play' && gameMode === 'DIALOGUE')) && <OpeningUI line={dialogue[line]} awaitingChoice={awaitingChoice} onNext={nextLine} onChoice={finishOpening} />}
      {phase === 'play' && <GameplayUI mode={gameMode} setMode={setMode} player={player} />}
      {phase === 'play' && gameMode === 'COMBAT' && <CombatUI />}
      {gameMode === 'GAME_OVER' && <FullMenu title="GAME OVER" onClose={restart}><GameOverPanel restart={restart} /></FullMenu>}
    </div>
  );
}

function World({ phase, gameMode }: { phase: string; gameMode: string }) {
  return (
    <>
      <School />
      <Ren phase={phase} gameMode={gameMode} />
      <CameraRig phase={phase} />
      {phase !== 'menu' && <Npcs />}
    </>
  );
}

function School() {
  const { scene } = useGLTF('/jamalpur_zilla_school_2022.glb');
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[400, 400]} />
          <meshStandardMaterial color="#4a5568" roughness={0.8} />
        </mesh>
      </RigidBody>
      <primitive object={scene} position={[0, -0.2, 0]} scale={2.5} />
    </>
  );
}

useGLTF.preload('/jamalpur_zilla_school_2022.glb');

function Ren({ phase, gameMode }: { phase: string; gameMode: string }) {
  const player = useGameStore((s) => s.player);
  const { scene, animations } = useGLTF('/char.glb');
  const body = useRef<any>(null);
  const mixer = useRef<any>(null);
  const action = useRef<any>(null);

  useFrame((state, delta) => {
    body.current?.setTranslation({ x: player.x, y: 2, z: player.z }, true);
    if (mixer.current) mixer.current.update(delta);
  });

  useEffect(() => {
    if (animations && animations.length > 0) {
      mixer.current = new THREE.AnimationMixer(scene);
      const idleClip = animations.find((a: any) => /idle|stand/i.test(a.name)) || animations[0];
      action.current = mixer.current.clipAction(idleClip);
      action.current.play();
    }
  }, [animations]);

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[player.x, 2, player.z]}>
      <Center bottom>
        <primitive object={scene} scale={2.4} />
      </Center>
    </RigidBody>
  );
}

useGLTF.preload('/char.glb');

function CameraRig({ phase }: { phase: string }) {
  const { camera } = useThree();
  const player = useGameStore((s) => s.player);
  const move = useGameStore((s) => s.move);
  const angle = useRef(0);
  const distance = useRef(4.5);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const pitch = useRef(0.28);

  useEffect(() => {
    if (phase !== 'play') return;
    const down = (e: KeyboardEvent) => {
      if (useGameStore.getState().gameMode !== 'NORMAL_GAMEPLAY') return;
      const speed = e.shiftKey ? 0.32 : 0.18;
      const forward = e.code === 'KeyW' ? 1 : e.code === 'KeyS' ? -1 : 0;
      const strafe = e.code === 'KeyD' ? 1 : e.code === 'KeyA' ? -1 : 0;
      if (!forward && !strafe) return;
      e.preventDefault();
      move(
        (-Math.sin(angle.current) * forward + Math.cos(angle.current) * strafe) * speed,
        (-Math.cos(angle.current) * forward - Math.sin(angle.current) * strafe) * speed,
      );
    };
    const start = () => {
      if (document.pointerLockElement !== document.body) {
        document.body.requestPointerLock?.();
      }
    };
    const drag = (e: MouseEvent) => {
      if (document.pointerLockElement === document.body) {
        angle.current -= e.movementX * 0.0025;
        pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.002, 0.05, 0.75);
      } else if (dragging.current) {
        const dx = e.clientX - lastX.current;
        angle.current -= dx * 0.004;
        lastX.current = e.clientX;
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== document.body) {
        dragging.current = true;
        lastX.current = e.clientX;
      }
    };
    const onMouseUp = () => {
      dragging.current = false;
    };
    const zoom = (e: WheelEvent) => { distance.current = THREE.MathUtils.clamp(distance.current + e.deltaY * 0.004, 2.5, 8); };
    window.addEventListener('keydown', down);
    window.addEventListener('click', start);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', drag);
    window.addEventListener('wheel', zoom, { passive: true });
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('click', start);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', drag);
      window.removeEventListener('wheel', zoom);
    };
  }, [move, phase]);

  useFrame(() => {
    if (phase === 'opening') {
      camera.position.set(0, 1.65, 2.5);
      camera.lookAt(0, 1.55, -1);
      return;
    }
    if (phase === 'play') {
      // Over-the-shoulder RPG camera offset
      const shoulderOffsetX = Math.cos(angle.current) * 0.45;
      const shoulderOffsetZ = -Math.sin(angle.current) * 0.45;

      const camX = player.x + Math.sin(angle.current) * distance.current + shoulderOffsetX;
      const camY = 1.2 + distance.current * pitch.current;
      const camZ = player.z + Math.cos(angle.current) * distance.current + shoulderOffsetZ;

      const target = new THREE.Vector3(player.x + shoulderOffsetX * 0.5, 1.3, player.z + shoulderOffsetZ * 0.5);
      camera.position.lerp(new THREE.Vector3(camX, camY, camZ), 0.14);
      camera.lookAt(target);
    }
  });
  return null;
}

function Npcs() {
  return (
    <>
      <Npc name="Aris" position={[-3, 0.9, 2]} color="#3b82f6" tag="TEMAN" />
      <Npc name="Siti" position={[2, 0.9, 1]} color="#10b981" tag="OSIS" />
      <Npc name="Bimo" position={[8, 0.9, -8]} color="#ef4444" tag="LEADER GENG" />
    </>
  );
}

function Npc({ name, position, color, tag }: { name: string; position: [number, number, number]; color: string; tag: string }) {
  return (
    <group position={position}>
      {/* Head */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#fed7aa" roughness={0.6} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.42, 0.55, 0.24]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Legs */}
      <mesh position={[-0.12, -0.38, 0]} castShadow>
        <boxGeometry args={[0.16, 0.6, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, -0.38, 0]} castShadow>
        <boxGeometry args={[0.16, 0.6, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>
      <Text position={[0, 1.15, 0]} fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle">
        {name}
      </Text>
      <Text position={[0, 0.95, 0]} fontSize={0.13} color="#f59e0b" anchorX="center" anchorY="middle">
        {`[ ${tag} ]`}
      </Text>
    </group>
  );
}

function OpeningUI({ line, awaitingChoice, onNext, onChoice }: { line: Line | undefined; awaitingChoice: boolean; onNext: () => void; onChoice: (choice: Choice) => void; }) {
  return (
    <div className="cinematic">
      <div className="camera-tag">FIRST PERSON</div>
      <div className="dialogue-box">
        <div className="speaker">{line?.speaker || '...'}</div>
        <p>{line?.text || ''}</p>
        {!awaitingChoice ? (
          <button onClick={onNext}>Lanjut</button>
        ) : (
          <div className="choices">
            <button onClick={() => onChoice('help_aris')}>Help Aris</button>
            <button onClick={() => onChoice('walk_past')}>Walk Past</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Menu({ onStart, onReset }: { onStart: () => void; onReset: () => void }) {
  return (
    <div className="menu">
      <div className="menu-main">
        <div className="menu-kicker">SMA YUSON CHRONICLES <span>ACT I // SEMESTER GANJIL</span></div>
        <h1>CHAOS SCHOOL <em>LIFE</em></h1>
        <p>A story of survival, academics, and violence at SMA Yuson.</p>
        <nav className="menu-nav">
          <button className="active" onClick={onStart}><b>01</b><strong>NEW GAME</strong><kbd>[ENTER]</kbd></button>
          <button><b>02</b><strong>CONTINUE</strong><small>SLOT 01 // SENIN, BAB 01</small></button>
          <button><b>03</b><strong>LOAD GAME</strong><small>3 SLOTS</small></button>
          <button><b>04</b><strong>SETTINGS</strong><small>GRAPHICS / AUDIO / KEYS</small></button>
        </nav>
        <div className="menu-footer"><button>CREDITS</button><button onClick={onReset}>RESET SAVE</button></div>
      </div>
      <aside className="timeline-card panel-cut">
        <div className="eyebrow">CURRENT TIMELINE OVERVIEW <span>SLOT_01.SAV</span></div>
        <div className="timeline-label">PROLOGUE TO CHAPTER 01</div>
        <h2>MURID PINDAHAN</h2>
        <p>Hari pertama di SMA Yuson. Jaga nilai akademik, hindari mata para geng lorong kantin belakang, dan ambil ijazah hidup-hidup.</p>
        <div className="telemetry"><span>ACADEMIC<b>B</b></span><span>REPUTATION<b>012</b></span><span>RELATION<b>03</b></span></div>
        <div className="sync">CLOUD_SYNC: OK <i>18:42:09 WIB</i></div>
      </aside>
      <div className="menu-version">BUILD_HASH: 0x9FA812C <span>CONTROLLER DETECTED: XINPUT_PAD_0</span></div>
      </div>
  );
}

function GameplayUI({ mode, setMode, player }: { mode: ReturnType<typeof useGameStore.getState>['gameMode']; setMode: (mode: ReturnType<typeof useGameStore.getState>['gameMode']) => void; player: { x: number; z: number } }) {
  if (mode === 'DIALOGUE' || mode === 'CHOICE' || mode === 'COMBAT') return null;
  if (mode === 'NORMAL_GAMEPLAY') return <MinimalHud />;
  if (mode === 'STATUS_MENU') return <FullMenu title="CHARACTER / STATUS" onClose={() => setMode('NORMAL_GAMEPLAY')}><StatusPanel /></FullMenu>;
  if (mode === 'RELATIONSHIP_MENU') return <FullMenu title="RELATIONSHIPS" onClose={() => setMode('NORMAL_GAMEPLAY')}><Relationships /></FullMenu>;
  if (mode === 'MAP_MENU') return <FullMenu title="SCHOOL MAP" onClose={() => setMode('NORMAL_GAMEPLAY')}><MapPanel player={player} /></FullMenu>;
  if (mode === 'SETTINGS') return <FullMenu title="SETTINGS" onClose={() => setMode('PAUSE')}><div className="settings-panel"><label>CAMERA DISTANCE <input type="range" min="3" max="9" defaultValue="5" /></label><label>CAMERA HEIGHT <input type="range" min="2" max="6" defaultValue="3" /></label><p>CONTROLS: WASD MOVE, SHIFT RUN, MOUSE ROTATE, WHEEL ZOOM</p></div></FullMenu>;
  return <FullMenu title="PAUSED" onClose={() => setMode('NORMAL_GAMEPLAY')}><div className="pause-options"><button onClick={() => setMode('STATUS_MENU')}>CHARACTER / STATUS <kbd>TAB</kbd></button><button onClick={() => setMode('RELATIONSHIP_MENU')}>RELATIONSHIPS <kbd>R</kbd></button><button onClick={() => setMode('MAP_MENU')}>SCHOOL MAP <kbd>M</kbd></button><button onClick={() => setMode('SETTINGS')}>SETTINGS</button><button onClick={() => setMode('NORMAL_GAMEPLAY')}>RESUME <kbd>ESC</kbd></button></div></FullMenu>;
}

function MinimalHud() {
  const focus = useGameStore((s) => s.focus);
  const quests = useGameStore((s) => s.quests);
  return <div className="minimal-hud"><div className="minimal-vitals"><b>REN</b><Meter label="HP" value="485 / 500" color="red" width="97%" /><Meter label="FOCUS" value={`${focus} / 100`} color="cyan" width={`${focus}%`} /></div><div className="objective"><b>MONDAY // 07:42</b><span>CURRENT OBJECTIVE</span><strong>{quests.explore_school === 'complete' ? 'Find the next lead' : 'Explore SMA Yuson'}</strong></div><div className="interact">[E] <span>INTERACT</span></div><div className="controls">WASD MOVE &nbsp; SHIFT RUN &nbsp; TAB STATUS &nbsp; M MAP &nbsp; ESC PAUSE</div></div>;
}

function CombatUI() {
  const enemyHp = useGameStore((s) => s.enemyHp);
  const hp = useGameStore((s) => s.hp);
  const action = useGameStore((s) => s.combatAction);
  return <div className="combat-ui"><div className="combat-title">DUEL // BIMO</div><Meter label="REN HP" value={`${hp} / 100`} color="cyan" width={`${hp}%`} /><Meter label="BIMO HP" value={`${enemyHp} / 100`} color="red" width={`${enemyHp}%`} /><div className="combat-actions"><button onClick={() => action('strike')}>STRIKE [J]</button><button onClick={() => action('guard')}>GUARD [K]</button><button onClick={() => action('focus')}>FOCUS [L]</button></div></div>;
}

function GameOverPanel({ restart }: { restart: () => void }) { return <div className="ending-panel"><p>Ren jatuh di lorong belakang SMA Yuson.</p><button onClick={restart}>RESTART ACT I</button></div>; }

function FullMenu({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="full-menu"><header><span className="eyebrow">DOSSIER // YUSON_SYS_V1.04</span><h1>{title}</h1><button onClick={onClose}>CLOSE [ESC]</button></header><main>{children}</main></div>;
}

function Relationships() {
  const relationship = useGameStore((s) => s.relationship);
  return <div className="relationship-list"><div className="eyebrow">SOCIAL NETWORK // PERSISTENT DATA</div>{(['aris', 'siti', 'bimo'] as const).map((name) => <div className="relationship-row" key={name}><strong>{name.toUpperCase()}</strong><span>RELATIONSHIP</span><b>{relationship[name]}</b></div>)}</div>;
}

function Meter({ label, value, color, width }: { label: string; value: string; color: 'red' | 'cyan'; width: string }) {
  return <div className="meter"><div><span>{label}</span><b>{value}</b></div><i><b className={color} style={{ width }} /></i></div>;
}

function StatusPanel() {
  const flags = useGameStore((s) => s.flags);
  return <section className="status-panel panel-cut"><div className="eyebrow">CHARACTER STATUS // PERSISTENT DATA</div><h2>REN</h2><div className="stat-grid"><span>HEALTH<b>485 / 500</b></span><span>FOCUS<b>240 / 300</b></span><span>ACADEMIC<b>UNSET</b></span><span>VIOLENCE<b>UNSET</b></span><span>DIPLOMACY<b>UNSET</b></span><span>FLAGS<b>{flags.length}</b></span></div></section>;
}

function MapPanel({ player }: { player: { x: number; z: number } }) {
  return <section className="map-panel panel-cut"><div className="eyebrow">SCHEMATIC NODE MAP // SMA YUSON</div><h2>BLUEPRINT KORIDOR</h2><div className="map-grid"><span className="node ren">REN</span><span className="node aris">ARIS</span><span className="node siti">SITI</span><span className="node bimo">BIMO</span><div className="map-player" style={{ left: `${50 + player.x * 2}%`, top: `${55 + player.z * 2}%` }} /></div></section>;
}
