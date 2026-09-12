import { Sky, Environment, Lightformer } from '@react-three/drei';
import { mobile } from '../mobile';
import { useGame } from '../../stores/gameStore';
import { CampusWorld } from './CampusWorld';
import { RooftopWorld } from './RooftopWorld';
import { WarehouseWorld } from './WarehouseWorld';

// SceneRoot: mounts exactly one scene bundle (campus / rooftop / warehouse).
// Scenes are small procedural geometry, so "load on demand" is achieved by
// mounting/unmounting here — colliders, props and lights all swap together,
// driven by gameStore.requestScene() (fade out → swap → fade in).

export function World() {
  const scene = useGame((s) => s.scene);
  if (scene === 'rooftop') return <RooftopScene />;
  if (scene === 'warehouse') return <WarehouseScene />;
  return <CampusScene />;
}

function CampusScene() {
  return (
    <>
      <color attach="background" args={['#a8c2d6']} />
      <fog attach="fog" args={['#b6c8d6', 70, 230]} />
      <Sky distance={4500} sunPosition={[-40, 48, 60]} turbidity={5} rayleigh={1.4} mieCoefficient={0.006} mieDirectionalG={0.85} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#dbeafe', '#4b5f45', 0.5]} />
      <directionalLight
        position={[-40, 55, 60]}
        intensity={2.5}
        color="#fff3dd"
        castShadow
        shadow-mapSize={[mobile.shadowMapSize, mobile.shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={240}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
      />
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
  return (
    <>
      <color attach="background" args={['#9fc0d8']} />
      <fog attach="fog" args={['#aecbdd', 90, 320]} />
      <Sky distance={4500} sunPosition={[60, 55, -35]} turbidity={4} rayleigh={1.1} mieCoefficient={0.005} mieDirectionalG={0.85} />
      <ambientLight intensity={0.72} />
      <hemisphereLight args={['#dbeafe', '#5a6a72', 0.55]} />
      <directionalLight
        position={[55, 60, -35]}
        intensity={2.9}
        color="#fff7e6"
        castShadow
        shadow-mapSize={[mobile.shadowMapSize, mobile.shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
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
      <fog attach="fog" args={['#0a0d11', 10, 42]} />
      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#3c4654', '#1a1c20', 0.6]} />
      {/* cool moonlight shaft through the skylights */}
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
