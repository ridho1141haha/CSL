import type { ReactNode } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';

// Shared world-building primitives for the rebuilt (no-GLB) scenes.
// Walls are declared as data segments; visuals + physics colliders are
// generated from the same array so they can never drift apart.

export type Seg = {
  x: number;      // center x
  z: number;      // center z
  w: number;      // width (x extent)
  d: number;      // depth (z extent)
  h?: number;     // height (default 3.3)
  y0?: number;    // base elevation (default 0)
  color?: string;
  rough?: number;
  metal?: number;
};

// Visual wall boxes. Grounded at y0 (default 0), so position.y = y0 + h/2.
export function WallMeshes({ segs, color = '#e8e3d8', rough = 0.85 }: { segs: Seg[]; color?: string; rough?: number }) {
  return (
    <>
      {segs.map((s, i) => (
        <mesh key={i} position={[s.x, (s.y0 ?? 0) + (s.h ?? 3.3) / 2, s.z]} castShadow receiveShadow>
          <boxGeometry args={[s.w, s.h ?? 3.3, s.d]} />
          <meshStandardMaterial color={s.color ?? color} roughness={s.rough ?? rough} metalness={s.metal ?? 0} />
        </mesh>
      ))}
    </>
  );
}

// Physics for the same segments. One RigidBody, many static cuboids.
export function WallColliders({ segs, defaultH = 3.3 }: { segs: Seg[]; defaultH?: number }) {
  return (
    <RigidBody type="fixed" colliders={false}>
      {segs.map((s, i) => {
        const h = s.h ?? defaultH;
        return (
          <CuboidCollider
            key={i}
            args={[s.w / 2, h / 2, s.d / 2]}
            position={[s.x, (s.y0 ?? 0) + h / 2, s.z]}
          />
        );
      })}
    </RigidBody>
  );
}

// Low collider-only blockers (crates, counters, furniture blocks).
export function Blockers({ segs }: { segs: Seg[] }) {
  return <WallColliders segs={segs} defaultH={1} />;
}

export function Tree({ x, z, s = 1, tint }: { x: number; z: number; s?: number; tint?: string }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.22, 1.8, 8]} />
        <meshStandardMaterial color="#5d4a36" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <sphereGeometry args={[1.15, 14, 12]} />
        <meshStandardMaterial color={tint ?? '#4c7a44'} roughness={0.95} />
      </mesh>
      <mesh position={[0.45, 1.75, 0.2]} castShadow>
        <sphereGeometry args={[0.62, 12, 10]} />
        <meshStandardMaterial color={tint ?? '#44703e'} roughness={0.95} />
      </mesh>
    </group>
  );
}

export function LampPost({ x, z, h = 4.2 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, h, 8]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0.22, h + 0.05, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0.45, h - 0.05, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={0.9} />
      </mesh>
      <pointLight position={[0.45, h - 0.1, 0]} intensity={2.2} distance={9} color="#ffd98a" />
    </group>
  );
}

export function Bench({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[2.1, 0.07, 0.5]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.62, -0.24]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[2.1, 0.06, 0.4]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.8} />
      </mesh>
      {[-0.85, 0.85].map((ox, i) => (
        <mesh key={i} position={[ox, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.44]} />
          <meshStandardMaterial color="#3f3a34" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Planter box with shrub blob.
export function Planter({ x, z, w = 2.4, d = 1.2 }: { x: number; z: number; w?: number; d?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.32, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.64, d]} />
        <meshStandardMaterial color="#9c5f4a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <boxGeometry args={[w - 0.2, 0.1, d - 0.2]} />
        <meshStandardMaterial color="#3d3529" roughness={1} />
      </mesh>
      {[-w / 4, w / 4].map((ox, i) => (
        <mesh key={i} position={[ox, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.42, 12, 10]} />
          <meshStandardMaterial color="#4c7a44" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export function Wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// 3D text sign helper shared by every scene.
export function SchoolSign({ position, text, size = 0.4, color = '#ffd34d' }: { position: [number, number, number]; text: string; size?: number; color?: string }) {
  return (
    <Text
      position={position}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={size * 0.06}
      outlineColor="#10141a"
      maxWidth={10}
    >
      {text}
    </Text>
  );
}
