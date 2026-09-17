import { useEffect, useRef } from 'react';
import { Sky, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { mobile } from '../mobile';
import { useSettings } from '../../stores/settingsStore';
import { qualityConfig } from '../quality';
import { useGame } from '../../stores/gameStore';
import { CampusWorld } from './CampusWorld';
import { RooftopWorld } from './RooftopWorld';
import { WarehouseWorld } from './WarehouseWorld';

// SceneRoot: mounts exactly one scene bundle (campus / rooftop / warehouse).
// Scenes are small procedural geometry, so "load on demand" is achieved by
// mounting/unmounting here — colliders, props and lights all swap together,
// driven by gameStore.requestScene() (fade out → swap → fade in).
//
// v0.9.0: fog range, <Sky> and shadow-map resolution follow the selected
// graphics quality preset (see game/quality.ts). The sun light syncs its
// shadow map size reactively — stale shadow buffers are disposed on change.

function SunLight({
  position,
  intensity,
  color,
  far,
  area,
}: {
  position: [number, number, number];
  intensity: number;
  color: string;
  far: number;
  area: number;
}) {
  const ref = useRef<THREE.DirectionalLight>(null);
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);

  useEffect(() => {
    const l = ref.current;
    if (!l) return;
    const size = cfg.shadowMapSize;
    if (l.shadow.mapSize.x !== size) {
      l.shadow.map?.dispose();
      l.shadow.map = null;
      l.shadow.mapSize.set(size, size);
      l.shadow.needsUpdate = true;
    }
  }, [cfg]);

  return (
    <directionalLight
      ref={ref}
      position={position}
      intensity={intensity}
      color={color}
      castShadow={cfg.shadows}
      shadow-mapSize={[cfg.shadowMapSize, cfg.shadowMapSize]}
      shadow-camera-near={1}
      shadow-camera-far={far}
      shadow-camera-left={-area}
      shadow-camera-right={area}
      shadow-camera-top={area}
      shadow-camera-bottom={-area}
    />
  );
}

export function World() {
  const scene = useGame((s) => s.scene);
  if (scene === 'rooftop') return <RooftopScene />;
  if (scene === 'warehouse') return <WarehouseScene />;
  return <CampusScene />;
}

function CampusScene() {
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  return (
    <>
      <color attach="background" args={['#a8c2d6']} />
      <fog attach="fog" args={['#b6c8d6', cfg.fogNear, cfg.fogFar]} />
      {cfg.sky && <Sky distance={4500} sunPosition={[-40, 48, 60]} turbidity={5} rayleigh={1.4} mieCoefficient={0.006} mieDirectionalG={0.85} />}
      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#dbeafe', '#4b5f45', 0.5]} />
      <SunLight position={[-40, 55, 60]} intensity={2.5} color="#fff3dd" far={240} area={75} />
      <CampusWorld />
      {/* Local env map (generated in-scene, NO network fetch). The previous
          <Environment preset="city"> downloaded an HDR from a CDN at runtime;
          on mobile networks that fetch failed and crashed the whole Canvas
          root — the "blank screen" bug. Lightformers render locally. */}
      <Environment frames={1} resolution={64} environmentIntensity={0.45}>
        <color attach="background" args={['#8fb2cc']} />
        <Lightformer intensity={2.2} position={[0, 6, 0]} scale={[12, 12, 1]} rotation-x={Math.PI / 2} color="#fff4e0" />
        <Lightformer intensity={0.9} position={[-8, 3, 6]} scale={[6, 3, 1]} color="#cfe4ff" />
        <Lightformer intensity={0.9} position={[8, 3, -6]} scale={[6, 3, 1]} color="#e8f0ff" />
        <Lightformer intensity={0.5} position={[0, 1, 10]} scale={[10, 2, 1]} color="#88a878" />
      </Environment>
    </>
  );
}

function RooftopScene() {
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  return (
    <>
      <color attach="background" args={['#9fc0d8']} />
      <fog attach="fog" args={['#aecbdd', Math.max(40, cfg.fogNear - 15), Math.min(cfg.fogFar, 320)]} />
      {cfg.sky && <Sky distance={4500} sunPosition={[60, 55, -35]} turbidity={4} rayleigh={1.1} mieCoefficient={0.005} mieDirectionalG={0.85} />}
      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#dbeafe', '#5a6a72', 0.55]} />
      <SunLight position={[55, 60, -35]} intensity={2.9} color="#fff7e6" far={180} area={45} />
      <RooftopWorld />
      {/* local env for metal/glass reflections — no CDN fetch */}
      <Environment frames={1} resolution={64} environmentIntensity={0.5}>
        <color attach="background" args={['#9fc0d8']} />
        <Lightformer intensity={2.4} position={[0, 6, 0]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} color="#fff7ea" />
        <Lightformer intensity={0.8} position={[10, 2, 0]} scale={[8, 3, 1]} rotation-y={-Math.PI / 3} color="#d8e8ff" />
        <Lightformer intensity={0.6} position={[0, 0.5, -12]} scale={[12, 3, 1]} color="#a8b8c8" />
      </Environment>
    </>
  );
}

function WarehouseScene() {
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
      {/* dim local env so metals keep subtle sheen in the dark */}
      <Environment frames={1} resolution={64} environmentIntensity={0.3}>
        <color attach="background" args={['#0a0d11']} />
        <Lightformer intensity={1.6} position={[0, 6, 0]} scale={[8, 8, 1]} rotation-x={Math.PI / 2} color="#bcd6e8" />
        <Lightformer intensity={0.5} position={[0, 1, 8]} scale={[6, 2, 1]} color="#7d8ba0" />
      </Environment>
    </>
  );
}
