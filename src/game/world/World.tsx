import { useEffect, useRef, type ComponentType } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { mobile } from '../mobile';
import { useSettings } from '../../stores/settingsStore';
import { qualityConfig } from '../quality';
import { useGame } from '../../stores/gameStore';
import type { SceneId } from '../../types';
import { skyStateFor, freeRoamStep, FREE_ROAM_STEP_SEC } from '../daynight';
import { CampusWorld } from './CampusWorld';
import { RooftopWorld } from './RooftopWorld';
import { WarehouseWorld } from './WarehouseWorld';
import { ObjectiveWaypoint } from './Waypoint';

// SceneRoot: mounts exactly one scene bundle (campus / rooftop / warehouse).
// Scenes are small procedural geometry, so "load on demand" is achieved by
// mounting/unmounting here — colliders, props and lights all swap together,
// driven by gameStore.requestScene() (fade out → swap → fade in).
//
// v0.9.0: fog range, <Sky> and shadow-map resolution follow the selected
// graphics quality preset (see game/quality.ts).
// v0.10.0: campus & rooftop skies are DAY/NIGHT — sun position, light colors
// and fog tint chase the school clock (game/daynight.ts). Free-roam walking
// drifts the clock forward without ever crossing a period boundary
// (TimeFlow), so period-gated quest windows keep working.

function DayNightRig({
  far,
  area,
  hemiGround,
  turbidity,
  rayleigh,
}: {
  far: number;
  area: number;
  hemiGround: string;
  turbidity: number;
  rayleigh: number;
}) {
  const { scene } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  // clock.minutes re-renders this component only when the STORY (or TimeFlow)
  // moves time — the smooth per-frame chase below does the in-between work.
  const minutes = useGame((s) => s.clock.minutes);

  // chased state: what the lights currently show (lerps toward the target).
  // Colors are chased as real RGB (THREE.Color.lerp) — lerping the packed hex
  // integer would bleed bits across channels.
  const cur = useRef<{ sun: [number, number, number]; sunIntensity: number; ambient: number; hemi: number } | null>(null);
  const sunColor = useRef(new THREE.Color(0xfff7ea));
  const bgColor = useRef(new THREE.Color(0xa8c2d6));
  const fogColor = useRef(new THREE.Color(0xb6c8d6));
  const scratch = useRef(new THREE.Color());

  // quality-driven shadow-map resize (stale buffers disposed on change)
  useEffect(() => {
    const l = sunRef.current;
    if (!l) return;
    const size = cfg.shadowMapSize;
    if (l.shadow.mapSize.x !== size) {
      l.shadow.map?.dispose();
      l.shadow.map = null;
      l.shadow.mapSize.set(size, size);
      l.shadow.needsUpdate = true;
    }
  }, [cfg]);

  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.05);
    const target = skyStateFor(useGame.getState().clock.minutes);
    if (!cur.current) cur.current = { sun: [...target.sun] as [number, number, number], sunIntensity: target.sunIntensity, ambient: target.ambient, hemi: target.hemi };
    const c = cur.current;
    const k = 1 - Math.exp(-1.8 * dt); // ~0.5s chase — no visible popping
    c.sun[0] += (target.sun[0] - c.sun[0]) * k;
    c.sun[1] += (target.sun[1] - c.sun[1]) * k;
    c.sun[2] += (target.sun[2] - c.sun[2]) * k;
    c.sunIntensity += (target.sunIntensity - c.sunIntensity) * k;
    c.ambient += (target.ambient - c.ambient) * k;
    c.hemi += (target.hemi - c.hemi) * k;
    sunColor.current.lerp(scratch.current.setHex(target.sunColor), k);
    bgColor.current.lerp(scratch.current.setHex(target.bg), k);
    fogColor.current.lerp(scratch.current.setHex(target.fog), k);

    const sun = sunRef.current;
    if (sun) {
      sun.position.set(c.sun[0], c.sun[1], c.sun[2]);
      sun.intensity = c.sunIntensity;
      sun.color.copy(sunColor.current);
    }
    if (ambRef.current) ambRef.current.intensity = c.ambient;
    if (hemiRef.current) hemiRef.current.intensity = c.hemi;
    if (scene.background instanceof THREE.Color) scene.background.copy(bgColor.current);
    else scene.background = bgColor.current.clone();
    if (scene.fog && 'color' in scene.fog) (scene.fog as THREE.Fog).color.copy(fogColor.current);
  });

  const sky = skyStateFor(minutes);
  return (
    <>
      <directionalLight
        ref={sunRef}
        position={sky.sun}
        intensity={sky.sunIntensity}
        color={sky.sunColor}
        castShadow={cfg.shadows}
        shadow-mapSize={[cfg.shadowMapSize, cfg.shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={far}
        shadow-camera-left={-area}
        shadow-camera-right={area}
        shadow-camera-top={area}
        shadow-camera-bottom={-area}
      />
      <ambientLight ref={ambRef} intensity={sky.ambient} />
      <hemisphereLight ref={hemiRef} args={['#dbeafe', hemiGround, sky.hemi]} />
      {cfg.sky && <Sky distance={4500} sunPosition={sky.sun} turbidity={turbidity} rayleigh={rayleigh} mieCoefficient={0.006} mieDirectionalG={0.85} />}
    </>
  );
}

// Free-roam clock drift: +1 game minute every FREE_ROAM_STEP_SEC of active
// walking, clamped to the current period's end (game/daynight.ts). Story
// effects remain the only way to cross a period boundary, so period-gated
// quest windows (canteen_teh='lunch', field_training='after', hidden events)
// keep working exactly as before.
function TimeFlow() {
  const acc = useRef(0);
  useFrame((_, deltaRaw) => {
    // clamp at 0.25s: tab-switch stalls must not fast-forward the clock, but
    // genuinely slow renderers (low-end phones ~15fps, SwiftShader QA) still
    // accumulate real time — a 0.05 clamp would freeze drift below ~20fps.
    const dt = Math.min(deltaRaw, 0.25);
    const game = useGame.getState();
    if (game.mode !== 'GAMEPLAY') return;
    acc.current += dt;
    if (acc.current < FREE_ROAM_STEP_SEC) return;
    acc.current = 0;
    const step = freeRoamStep(game.clock.minutes);
    if (step > 0) game.advanceTime(step);
  });
  return null;
}

// v0.17.0: declarative scene→view registry (was an if-chain). Adding a scene
// = a SCENES data row + one entry here + its world component — no logic edits.
const SCENE_VIEWS: Record<SceneId, ComponentType> = {
  campus: CampusScene,
  rooftop: RooftopScene,
  warehouse: WarehouseScene,
};

export function World() {
  const scene = useGame((s) => s.scene);
  const View = SCENE_VIEWS[scene] ?? CampusScene;
  return <View />;
}

function CampusScene() {
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  return (
    <>
      {/* background/fog COLOR is owned by DayNightRig; this <fog> keeps the
          quality-driven near/far range (color overwritten per-frame) */}
      <fog attach="fog" args={['#b6c8d6', cfg.fogNear, cfg.fogFar]} />
      <DayNightRig far={240} area={75} hemiGround="#4b5f45" turbidity={5} rayleigh={1.4} />
      <CampusWorld />
      <ObjectiveWaypoint />
      <TimeFlow />
      {/* Local env map (generated in-scene, NO network fetch). The previous
          <Environment preset="city"> downloaded an HDR from a CDN at runtime;
          on mobile networks that fetch failed and crashed the whole Canvas
          root — the "blank screen" bug. Lightformers render locally.
          v0.14.2: gated by quality — envMul 0 (RENDAH) skips the mount
          entirely so every standard material compiles WITHOUT the IBL block
          ("refleksi cahaya" is the heaviest per-pixel PBR term); otherwise
          environmentIntensity is scaled by envMul (TINGGI 0.8, SEDANG 0.5). */}
      {cfg.envMul > 0 && (
        <Environment frames={1} resolution={64} environmentIntensity={0.45 * cfg.envMul}>
          <color attach="background" args={['#8fb2cc']} />
          <Lightformer intensity={2.2} position={[0, 6, 0]} scale={[12, 12, 1]} rotation-x={Math.PI / 2} color="#fff4e0" />
          <Lightformer intensity={0.9} position={[-8, 3, 6]} scale={[6, 3, 1]} color="#cfe4ff" />
          <Lightformer intensity={0.9} position={[8, 3, -6]} scale={[6, 3, 1]} color="#e8f0ff" />
          <Lightformer intensity={0.5} position={[0, 1, 10]} scale={[10, 2, 1]} color="#88a878" />
        </Environment>
      )}
    </>
  );
}

function RooftopScene() {
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  return (
    <>
      <fog attach="fog" args={['#aecbdd', Math.max(40, cfg.fogNear - 15), Math.min(cfg.fogFar, 320)]} />
      <DayNightRig far={180} area={45} hemiGround="#5a6a72" turbidity={4} rayleigh={1.1} />
      <RooftopWorld />
      {/* local env for metal/glass reflections — no CDN fetch; v0.14.2: quality-gated */}
      {cfg.envMul > 0 && (
        <Environment frames={1} resolution={64} environmentIntensity={0.5 * cfg.envMul}>
          <color attach="background" args={['#9fc0d8']} />
          <Lightformer intensity={2.4} position={[0, 6, 0]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} color="#fff7ea" />
          <Lightformer intensity={0.8} position={[10, 2, 0]} scale={[8, 3, 1]} rotation-y={-Math.PI / 3} color="#d8e8ff" />
          <Lightformer intensity={0.6} position={[0, 0.5, -12]} scale={[12, 3, 1]} color="#a8b8c8" />
        </Environment>
      )}
    </>
  );
}

function WarehouseScene() {
  // v0.14.2: cfg was quality-independent here by design (dark tight interior);
  // only envMul is consumed (reflections gate) — fog/lights stay untouched.
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  return (
    <>
      <color attach="background" args={['#07090c']} />
      {/* dark tight interior fog — quality-independent by design */}
      <fog attach="fog" args={['#0a0d11', 10, 42]} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#3c4654', '#1a1c20', 0.6]} />
      {/* cool moonlight shafts through the skylights (no shadows — dark scene) */}
      <directionalLight position={[2, 12, -4]} intensity={0.75} color="#9db8d9" />
      <directionalLight position={[-6, 8, 10]} intensity={0.35} color="#7d8ba0" />
      <WarehouseWorld />
      {/* dim local env so metals keep subtle sheen in the dark — v0.14.2: quality-gated */}
      {cfg.envMul > 0 && (
        <Environment frames={1} resolution={64} environmentIntensity={0.3 * cfg.envMul}>
          <color attach="background" args={['#0a0d11']} />
          <Lightformer intensity={1.6} position={[0, 6, 0]} scale={[8, 8, 1]} rotation-x={Math.PI / 2} color="#bcd6e8" />
          <Lightformer intensity={0.5} position={[0, 1, 8]} scale={[6, 2, 1]} color="#7d8ba0" />
        </Environment>
      )}
    </>
  );
}
