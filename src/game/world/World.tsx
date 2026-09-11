import { Sky, Environment } from '@react-three/drei';
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
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={240}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
      />
      <CampusWorld />
      <Environment preset="city" environmentIntensity={0.4} />
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
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
      />
      <RooftopWorld />
    </>
  );
}

function WarehouseScene() {
  return (
    <>
      <color attach="background" args={['#07090c']} />
      <fog attach="fog" args={['#0a0d11', 10, 42]} />
      <ambientLight intensity={0.34} />
      <hemisphereLight args={['#3c4654', '#1a1c20', 0.4]} />
      {/* cool moonlight shaft through the skylights */}
      <directionalLight position={[2, 12, -4]} intensity={0.55} color="#9db8d9" />
      <directionalLight position={[-6, 8, 10]} intensity={0.25} color="#7d8ba0" />
      <WarehouseWorld />
    </>
  );
}
