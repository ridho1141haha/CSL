import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { registerCull, unregisterCull, type CullMode } from '../runtime';
import { Pbr, type SurfaceName } from './pbr';

// Shared world-building primitives for the rebuilt (no-GLB) scenes.
// Walls are declared as data segments; visuals + physics colliders are
// generated from the same array so they can never drift apart.
//
// PBR: surfaces reference procedural texture sets (see pbr.ts). Texture
// repeat is quantized to whole tiles so the clone cache stays small on
// mobile GPUs (each combo shares the same 256px source canvas).

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
  pbr?: SurfaceName | 'none'; // surface texture (default: the mesh's `pbr` prop)
};

// Whole-tile repeat quantization: one texture clone per integer combo.
const q = (v: number, unit: number) => Math.max(1, Math.round(v / unit));

function SegMaterial({ s, defaultPbr, color, rough }: { s: Seg; defaultPbr: SurfaceName | 'none'; color: string; rough: number }) {
  const surf = s.pbr ?? defaultPbr;
  const h = s.h ?? 3.3;
  if (surf === 'none') {
    return <meshStandardMaterial color={s.color ?? color} roughness={s.rough ?? rough} metalness={s.metal ?? 0} />;
  }
  return (
    <Pbr
      name={surf}
      repeat={[Math.max(1, q(Math.max(s.w, s.d), 4)), q(h, 3.3)]}
      color={s.color ?? color}
      roughness={s.rough ?? rough}
      metalness={s.metal ?? 0}
    />
  );
}

// Visual wall boxes. Grounded at y0 (default 0), so position.y = y0 + h/2.
export function WallMeshes({ segs, color = '#e8e3d8', rough = 0.85, pbr = 'plaster' }: { segs: Seg[]; color?: string; rough?: number; pbr?: SurfaceName | 'none' }) {
  return (
    <>
      {segs.map((s, i) => (
        <mesh key={i} position={[s.x, (s.y0 ?? 0) + (s.h ?? 3.3) / 2, s.z]} castShadow receiveShadow>
          <boxGeometry args={[s.w, s.h ?? 3.3, s.d]} />
          <SegMaterial s={s} defaultPbr={pbr} color={color} rough={rough} />
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
        <Pbr name="bark" repeat={[2, 1]} roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[0, 2.35, 0]} castShadow>
        <sphereGeometry args={[1.15, 14, 12]} />
        <Pbr name="foliage" repeat={[3, 2]} color={tint ?? '#ffffff'} roughness={0.95} envMapIntensity={0.25} />
      </mesh>
      <mesh position={[0.45, 1.75, 0.2]} castShadow>
        <sphereGeometry args={[0.62, 12, 10]} />
        <Pbr name="foliage" repeat={[2, 1]} color={tint ?? '#e0e8da'} roughness={0.95} envMapIntensity={0.25} />
      </mesh>
    </group>
  );
}

export function LampPost({ x, z, h = 4.2 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.08, h, 8]} />
        <Pbr name="metal" repeat={[1, 3]} roughness={0.55} metalness={0.6} />
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
        <Pbr name="wood" repeat={[2, 1]} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.62, -0.24]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[2.1, 0.06, 0.4]} />
        <Pbr name="wood" repeat={[2, 1]} roughness={0.75} />
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
        <Pbr name="brick" repeat={[2, 1]} color="#c98873" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.67, 0]}>
        <boxGeometry args={[w - 0.2, 0.1, d - 0.2]} />
        <Pbr name="dirt" repeat={[2, 1]} color="#5a4f3d" roughness={1} />
      </mesh>
      {[-w / 4, w / 4].map((ox, i) => (
        <mesh key={i} position={[ox, 1.05, 0]} castShadow>
          <sphereGeometry args={[0.42, 12, 10]} />
          <Pbr name="foliage" repeat={[2, 1]} roughness={0.95} envMapIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export function Wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Cull — render-culling wrapper (v0.9.0, "yang ga keliatan ga dirender").
// Wraps a static world bundle and registers it with CullingManager:
//   mode 'frustum'  → hidden while the bundle sphere is fully outside the
//                     camera frustum (beyond the safety margin)
//   mode 'interior' → additionally hidden past `interiorRange` meters —
//                     interior furniture the player cannot see through walls
// Every scene-switch unmount unregisters, and CullingManager restores
// visibility for anything still registered when it unmounts.
// ---------------------------------------------------------------------------
export function Cull({
  center,
  radius,
  mode = 'frustum',
  children,
}: {
  center: [number, number, number];
  radius: number;
  mode?: CullMode;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!ref.current) return;
    const id = registerCull({ obj: ref.current, center, radius, mode });
    ref.current.matrixAutoUpdate = false; // static bundle — compose once
    ref.current.updateMatrixWorld(true);
    return () => {
      unregisterCull(id);
      if (ref.current) ref.current.visible = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <group ref={ref}>{children}</group>;
}

// ---------------------------------------------------------------------------
// Door — swung-open door leaf + frame for a doorway (v0.8.0: "ruang kelas
// dikasih pintu"). The leaf opens ~109° from closed, leaning back toward the
// hinge-side wall segment, so the passage stays fully walkable (visual only,
// same approach as the library's open double doors).
//
// Local frame: the wall runs along local X, the gap spans local -w/2..w/2,
// `open` picks the side of the wall the leaf swings to (local ±Z). rotY
// orients that frame in the world: wall along world X → rotY 0, wall along
// world Z → rotY ±Math.PI/2. hinge: -1 = left jamb, +1 = right jamb.
// ---------------------------------------------------------------------------
const DOOR_OPEN = 1.9; // rad from the closed position — past perpendicular

export function Door({
  x, z, y0 = 0, w = 1.4, rotY = 0, open = 1, hinge = -1,
  frame = '#31547a', leaf = '#4a6a8a',
}: {
  x: number; z: number; y0?: number; w?: number; rotY?: number;
  open?: 1 | -1; hinge?: 1 | -1; frame?: string; leaf?: string;
}) {
  const h = 2.45;
  const len = w - 0.12;
  const dx = -hinge * Math.cos(DOOR_OPEN);
  const dz = open * Math.sin(DOOR_OPEN);
  const hx = hinge * (w / 2 - 0.06);
  const ry = Math.atan2(-dz, dx);
  return (
    <group position={[x, y0, z]} rotation={[0, rotY, 0]}>
      {/* frame: jambs lining the gap + header above the leaf */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.05), (h + 0.1) / 2, 0]} castShadow>
          <boxGeometry args={[0.1, h + 0.1, 0.34]} />
          <meshStandardMaterial color={frame} roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, h + 0.07, 0]} castShadow>
        <boxGeometry args={[w + 0.24, 0.14, 0.34]} />
        <meshStandardMaterial color={frame} roughness={0.55} />
      </mesh>
      {/* leaf, rotated open around the hinge jamb */}
      <group position={[hx + dx * (len / 2), h / 2, dz * (len / 2)]} rotation={[0, ry, 0]}>
        <mesh castShadow>
          <boxGeometry args={[len, h, 0.07]} />
          <meshStandardMaterial color={leaf} roughness={0.5} metalness={0.15} />
        </mesh>
        {/* vision slot + handles on both faces */}
        <mesh position={[0, 0.55, 0.045]}>
          <boxGeometry args={[0.5, 0.35, 0.02]} />
          <meshStandardMaterial color="#9fb6c4" roughness={0.2} metalness={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[len / 2 - 0.16, -0.25, s * 0.06]}>
            <boxGeometry args={[0.12, 0.03, 0.03]} />
            <meshStandardMaterial color="#c8ccd0" roughness={0.35} metalness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// 3D text sign helper shared by every scene. Font is served LOCALLY
// (public/fonts/carlito-regular.ttf) — troika's default Roboto lives on a
// CDN, another mobile-network failure point we removed.
// rotY: signs on south-facing walls (viewed from their back) need Math.PI.
export function SchoolSign({ position, text, size = 0.4, color = '#ffd34d', rotY = 0 }: { position: [number, number, number]; text: string; size?: number; color?: string; rotY?: number }) {
  return (
    <Text
      position={position}
      rotation={[0, rotY, 0]}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={size * 0.06}
      outlineColor="#10141a"
      maxWidth={10}
      font="/fonts/carlito-regular.ttf"
    >
      {text}
    </Text>
  );
}
