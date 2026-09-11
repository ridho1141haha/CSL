import { useEffect, useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { WORLD_BOUNDS, BUILDING_BOX } from '../../data/world';
import { registerOccluders } from '../runtime';
import { useGLTF } from '@react-three/drei';

const GRASS = '#5a7052';
const PAVE = '#8d9299';
const ROAD = '#4b5259';
const WALL = '#6b7280';

// SMA Yuson grounds: school GLB, ground + colliders, perimeter fence with gate
// opening, landmark props per zone (GDD §6).
export function World() {
  const schoolRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (schoolRef.current) registerOccluders([schoolRef.current]);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const { minX, maxX, minZ, maxZ } = WORLD_BOUNDS;
  const gateL = 2;
  const gateR = 12;

  return (
    <>
      {/* ground */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[55, 0.25, 55]} position={[0, -0.25, 0]} />
      </RigidBody>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[110, 110]} />
        <meshStandardMaterial color={GRASS} roughness={0.95} />
      </mesh>

      {/* courtyard paving */}
      <mesh position={[7, 0.01, 28.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 16]} />
        <meshStandardMaterial color={PAVE} roughness={0.9} />
      </mesh>
      {/* road to gate */}
      <mesh position={[7, 0.012, 40]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 12]} />
        <meshStandardMaterial color={ROAD} roughness={0.95} />
      </mesh>
      {/* field */}
      <mesh position={[-24, 0.012, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 20]} />
        <meshStandardMaterial color="#63804f" roughness={1} />
      </mesh>
      {/* back alley asphalt */}
      <mesh position={[7, 0.012, -24]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 14]} />
        <meshStandardMaterial color="#3f454b" roughness={1} />
      </mesh>
      {/* parking */}
      <mesh position={[30, 0.014, 31]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color={ROAD} roughness={0.95} />
      </mesh>

      {/* school GLB */}
      <group ref={schoolRef} position={[0, -0.2, 0]} scale={2.5}>
        <School />
      </group>

      {/* building collider (invisible) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[BUILDING_BOX.w / 2, 4, BUILDING_BOX.d / 2]} position={[BUILDING_BOX.x, 4, BUILDING_BOX.z]} />
      </RigidBody>

      {/* perimeter walls (invisible) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[(maxX - minX) / 2, 2, 0.5]} position={[(minX + maxX) / 2, 2, minZ]} />
        <CuboidCollider args={[0.5, 2, (maxZ - minZ) / 2]} position={[minX, 2, (minZ + maxZ) / 2]} />
        <CuboidCollider args={[0.5, 2, (maxZ - minZ) / 2]} position={[maxX, 2, (minZ + maxZ) / 2]} />
        <CuboidCollider args={[(gateL - minX) / 2, 2, 0.5]} position={[(minX + gateL) / 2, 2, maxZ]} />
        <CuboidCollider args={[(maxX - gateR) / 2, 2, 0.5]} position={[(gateR + maxX) / 2, 2, maxZ]} />
      </RigidBody>

      <Fence minX={minX} maxX={maxX} minZ={minZ} maxZ={maxZ} />
      <GateProps />
      <CanteenProps />
      <FieldProps />
      <AlleyProps />
      <ParkingProps />
      <WarehouseProps />
      <Trees />
    </>
  );
}

function School() {
  const { scene } = useGLTF('/jamalpur_zilla_school_2022.glb');
  return <primitive object={scene} />;
}
useGLTF.preload('/jamalpur_zilla_school_2022.glb');

function Fence({ minX, maxX, minZ, maxZ }: { minX: number; maxX: number; minZ: number; maxZ: number }) {
  const posts: [number, number][] = [];
  for (let x = minX; x <= maxX; x += 6) posts.push([x, maxZ]);
  for (let z = minZ; z <= maxZ; z += 6) {
    posts.push([minX, z]);
    posts.push([maxX, z]);
  }
  return (
    <group>
      {posts.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.9, z]}>
          <cylinderGeometry args={[0.06, 0.06, 1.8, 6]} />
          <meshStandardMaterial color={WALL} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[(minX + maxX) / 2, 1.5, minZ]}>
        <boxGeometry args={[maxX - minX, 0.08, 0.08]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      <mesh position={[minX, 1.5, (minZ + maxZ) / 2]}>
        <boxGeometry args={[0.08, 0.08, maxZ - minZ]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      <mesh position={[maxX, 1.5, (minZ + maxZ) / 2]}>
        <boxGeometry args={[0.08, 0.08, maxZ - minZ]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
    </group>
  );
}

function GateProps() {
  return (
    <group position={[0, 0, WORLD_BOUNDS.maxZ]}>
      <mesh position={[2, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 2.8, 10]} />
        <meshStandardMaterial color="#9aa2ac" roughness={0.6} />
      </mesh>
      <mesh position={[12, 1.4, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 2.8, 10]} />
        <meshStandardMaterial color="#9aa2ac" roughness={0.6} />
      </mesh>
      <mesh position={[7, 3, 0]}>
        <boxGeometry args={[10.6, 0.7, 0.3]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} />
      </mesh>
      <mesh position={[7, 3.02, 0.17]}>
        <boxGeometry args={[9.8, 0.5, 0.06]} />
        <meshStandardMaterial color="#fbbf24" emissive="#92400e" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function CanteenProps() {
  return (
    <group position={[27, 0, 8]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[6, 2.2, 3]} />
        <meshStandardMaterial color="#7d8b99" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.45, 0.9]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[6.6, 0.12, 2.4]} />
        <meshStandardMaterial color="#b45309" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 1.8]}>
        <boxGeometry args={[5.6, 0.9, 0.15]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>
      <mesh position={[2.6, 0.35, 2.6]}>
        <boxGeometry args={[1.1, 0.7, 0.6]} />
        <meshStandardMaterial color="#dc2626" roughness={0.5} />
      </mesh>
    </group>
  );
}

function FieldProps() {
  return (
    <group position={[-24, 0, 8]}>
      {[9, -9].map((z, i) => (
        <group key={i} position={[0, 0, z]}>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[5, 0.1, 0.1]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <mesh position={[-2.5, 0.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 0.1]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
          <mesh position={[2.5, 0.4, 0]}>
            <boxGeometry args={[0.1, 0.8, 0.1]} />
            <meshStandardMaterial color="#e5e7eb" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.34, 24]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>
    </group>
  );
}

function AlleyProps() {
  return (
    <group position={[7, 0, -24]}>
      <mesh position={[-4, 0.5, -3]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.2, 1, 1.2]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.9} />
      </mesh>
      <mesh position={[-3.4, 1.3, -2.8]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1, 0.8, 1]} />
        <meshStandardMaterial color="#7a6344" roughness={0.9} />
      </mesh>
      <mesh position={[4.5, 0.7, -4]} castShadow>
        <boxGeometry args={[2, 1.4, 1.1]} />
        <meshStandardMaterial color="#3f6212" roughness={0.7} />
      </mesh>
      <mesh position={[5.6, 0.5, 2.5]} rotation={[0, -0.5, 0]} castShadow>
        <boxGeometry args={[1.2, 1, 1.2]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.9} />
      </mesh>
      {[-6, -1, 8].map((x, i) => (
        <mesh key={i} position={[x, 0.75, -6]} castShadow>
          <boxGeometry args={[2.2, 1.5, 1.2]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function ParkingProps() {
  const colors = ['#334155', '#7f1d1d', '#1e3a8a'];
  return (
    <group position={[30, 0, 31]}>
      {[-4, -1.3, 1.4, 4.1].map((x, i) => (
        <mesh key={i} position={[x, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.12, 10]} />
          <meshStandardMaterial color="#d1d5db" />
        </mesh>
      ))}
      {[[-3, 2], [0, 3], [3, -2]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[0.7, 0.9, 1.9]} />
            <meshStandardMaterial color={colors[i]} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.95, -0.4]} castShadow>
            <boxGeometry args={[0.65, 0.4, 0.9]} />
            <meshStandardMaterial color={colors[i]} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WarehouseProps() {
  return (
    <group position={[-32, 0, -27]}>
      <mesh position={[0, 2.5, -4]} castShadow>
        <boxGeometry args={[16, 5, 8]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.3, 0.2]}>
        <boxGeometry args={[3, 2.6, 0.3]} />
        <meshStandardMaterial color="#111827" roughness={0.9} />
      </mesh>
      {[-5, -1.5, 2].map((x, i) => (
        <mesh key={i} position={[x, 1.1, 2.5]} rotation={[0, 0.3 * i, 0]} castShadow>
          <boxGeometry args={[2.4, 2.2, 1.4]} />
          <meshStandardMaterial color={['#7f1d1d', '#3f6212', '#92400e'][i]} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Trees() {
  const trees: [number, number][] = [
    [-14, 30], [-10, 34], [20, 26], [16, 36], [-30, 20], [-34, -6], [34, 12], [-14, -16], [18, -18], [26, -10],
  ];
  return (
    <>
      {trees.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.2, 1.8, 8]} />
            <meshStandardMaterial color="#5d4a36" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.4, 0]} castShadow>
            <sphereGeometry args={[1.1 + (i % 3) * 0.15, 12, 10]} />
            <meshStandardMaterial color="#3f6f3f" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[[0, 24], [14, 24], [0, 36], [22, 14]].map(([x, z], i) => (
        <group key={`lamp-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 4, 8]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          <mesh position={[0, 4.1, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}
      <group position={[7, 0, 22]}>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 6, 8]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <mesh position={[0.55, 5.3, 0]}>
          <planeGeometry args={[1, 0.6]} />
          <meshStandardMaterial color="#dc2626" side={THREE.DoubleSide} />
        </mesh>
      </group>
      {[4.5, 8.5].map((x, i) => (
        <group key={`bench-${i}`} position={[x, 0, 33.5]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[2.2, 0.08, 0.5]} />
            <meshStandardMaterial color="#7a6344" />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[2, 0.3, 0.4]} />
            <meshStandardMaterial color="#5d4a36" />
          </mesh>
        </group>
      ))}
    </>
  );
}
