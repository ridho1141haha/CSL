import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { WallMeshes, WallColliders, SchoolSign } from './props';
import { Pbr } from './pbr';

// Rooftop scene (Bab III — Momen Kunci). Local coordinates: the stair
// bulkhead sits at the south edge (z ~8..11), Bimo's spot is at the north
// parapet (z ~-6) facing the city. The city skyline below sells the height.

const FLOOR = '#9d9a92';
const PARAPET = '#b3aea2';

function CityBelow() {
  // ring of distant building tops around the school, low relative to the roof
  const blocks: { x: number; z: number; w: number; d: number; h: number; c: string }[] = [];
  const palette = ['#7c8894', '#8a94a0', '#6f7a86', '#93a0ab'];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + 0.2;
    const r = 52 + (i % 5) * 14;
    blocks.push({
      x: Math.sin(a) * r,
      z: Math.cos(a) * r - 6,
      w: 8 + (i % 4) * 4,
      d: 8 + ((i * 3) % 4) * 4,
      h: 7 + ((i * 7) % 22),
      c: palette[i % palette.length],
    });
  }
  return (
    <group>
      <mesh position={[0, -14, -6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[400, 400]} />
        <Pbr name="asphalt" repeat={[40, 40]} color="#9aa5ad" roughness={1} envMapIntensity={0.2} />
      </mesh>
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, -14 + b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <Pbr name="concrete" repeat={[3, 2]} color={b.c} roughness={0.9} envMapIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

export function RooftopWorld() {
  const W = 28; // x extent
  const D = 22; // z extent
  const parapetH = 1.05;
  const parapets = [
    { x: 0, z: -D / 2 + 0.12, w: W, d: 0.25, h: parapetH, color: PARAPET },
    { x: -W / 2 + 0.12, z: 0, w: 0.25, d: D, h: parapetH, color: PARAPET },
    { x: W / 2 - 0.12, z: 0, w: 0.25, d: D, h: parapetH, color: PARAPET },
    // south side splits around the bulkhead (x -2..2)
    { x: -8, z: D / 2 - 0.12, w: 12, d: 0.25, h: parapetH, color: PARAPET },
    { x: 8, z: D / 2 - 0.12, w: 12, d: 0.25, h: parapetH, color: PARAPET },
  ];
  return (
    <group>
      <CityBelow />
      {/* floor */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[W / 2, 0.25, D / 2]} position={[0, -0.25, 0]} />
      </RigidBody>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <Pbr name="concrete" repeat={[7, 6]} color="#ccc9c0" roughness={0.96} envMapIntensity={0.3} />
      </mesh>
      {/* painted guide lines (rooftop maintenance lane) */}
      <mesh position={[0, 0.01, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 2, 0.12]} />
        <meshStandardMaterial color="#c9a23f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.01, -3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W - 2, 0.12]} />
        <meshStandardMaterial color="#c9a23f" roughness={0.9} />
      </mesh>
      {/* parapets: visual + blocking collider (taller than a jump) */}
      <WallMeshes segs={parapets} />
      <RigidBody type="fixed" colliders={false}>
        {parapets.map((p, i) => (
          <CuboidCollider key={i} args={[p.w / 2, 1.4, p.d / 2 + 0.15]} position={[p.x, 1.4, p.z]} />
        ))}
      </RigidBody>
      {/* stair bulkhead (exit back down) */}
      <group position={[0, 0, 9.5]}>
        <WallMeshes
          segs={[
            { x: -2, z: 0, w: 0.25, d: 3.2, h: 2.7, color: '#cfc6b2' },
            { x: 2, z: 0, w: 0.25, d: 3.2, h: 2.7, color: '#cfc6b2' },
            { x: 0, z: -1.5, w: 4.25, d: 0.25, h: 2.7, color: '#cfc6b2' },
            // south face split by the door gap
            { x: -1.45, z: 1.5, w: 1.35, d: 0.25, h: 2.7, color: '#cfc6b2' },
            { x: 1.45, z: 1.5, w: 1.35, d: 0.25, h: 2.7, color: '#cfc6b2' },
          ]}
        />
        <WallColliders
          segs={[
            { x: -2, z: 0, w: 0.25, d: 3.2, h: 2.7 },
            { x: 2, z: 0, w: 0.25, d: 3.2, h: 2.7 },
            { x: 0, z: -1.5, w: 4.25, d: 0.25, h: 2.7 },
            { x: -1.45, z: 1.5, w: 1.35, d: 0.25, h: 2.7 },
            { x: 1.45, z: 1.5, w: 1.35, d: 0.25, h: 2.7 },
          ]}
          defaultH={2.7}
        />
        <mesh position={[0, 2.85, 0]} castShadow>
          <boxGeometry args={[4.6, 0.25, 3.5]} />
          <Pbr name="roof" repeat={[2, 1]} roughness={0.9} envMapIntensity={0.35} />
        </mesh>
        {/* open door into the stairwell */}
        <mesh position={[0, 1.1, 1.55]} rotation={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.2, 2.2, 0.08]} />
          <meshStandardMaterial color="#3a5a7c" roughness={0.5} metalness={0.2} />
        </mesh>
        <SchoolSign position={[0, 2.15, -1.68]} text="TANGGA" size={0.22} color="#5d6a76" rotY={Math.PI} />
      </group>
      {/* AC units */}
      {[
        [-7.5, -1.5],
        [-4.5, -4.5],
        [6.5, 2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i * 0.5, 0]}>
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.9, 1.2, 1.4]} />
            <Pbr name="metal" repeat={[1, 1]} color="#ccd2d8" roughness={0.6} metalness={0.35} envMapIntensity={0.6} />
          </mesh>
          <mesh position={[0, 1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.5, 18]} />
            <meshStandardMaterial color="#565c63" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[0, 1.24, 0]}>
            <boxGeometry args={[0.06, 0.9, 0.06]} />
            <meshStandardMaterial color="#3d4248" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* water tank on legs */}
      <group position={[-9, 0, -7.5]}>
        {[
          [-0.7, -0.7],
          [0.7, -0.7],
          [-0.7, 0.7],
          [0.7, 0.7],
        ].map(([ox, oz], i) => (
          <mesh key={i} position={[ox, 0.75, oz]}>
            <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
            <meshStandardMaterial color="#4a5057" roughness={0.7} metalness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 2.45, 0]} castShadow>
          <cylinderGeometry args={[1.25, 1.25, 1.9, 18]} />
          <Pbr name="metal" repeat={[3, 1]} color="#7f9cb8" roughness={0.65} metalness={0.3} envMapIntensity={0.5} />
        </mesh>
        <mesh position={[0, 3.55, 0]}>
          <coneGeometry args={[1.3, 0.5, 18]} />
          <meshStandardMaterial color="#4e6a83" roughness={0.7} metalness={0.2} />
        </mesh>
      </group>
      {/* antenna mast */}
      <group position={[9.5, 0, -8]}>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 3.2, 8]} />
          <meshStandardMaterial color="#6b7076" roughness={0.6} metalness={0.5} />
        </mesh>
        {[-0.4, 0.1].map((y, i) => (
          <mesh key={i} position={[0, 2.6 + y * 2, 0]}>
            <boxGeometry args={[i ? 0.7 : 1, 0.04, 0.04]} />
            <meshStandardMaterial color="#6b7076" roughness={0.6} metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 3.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
        </mesh>
      </group>
      {/* vent pipes */}
      {[
        [3.5, -7.5],
        [11, 5.5],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.26, 1, 12]} />
            <meshStandardMaterial color="#828a91" roughness={0.75} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.08, 0]}>
            <cylinderGeometry args={[0.3, 0.22, 0.22, 12]} />
            <meshStandardMaterial color="#6f777e" roughness={0.75} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* clothesline with sheets */}
      <group position={[-10.5, 0, 4.5]}>
        {[-1.6, 1.6].map((oz, i) => (
          <mesh key={i} position={[0, 0.9, oz]}>
            <cylinderGeometry args={[0.04, 0.05, 1.8, 8]} />
            <meshStandardMaterial color="#6b7076" roughness={0.7} />
          </mesh>
        ))}
        {[
          [-0.5, '#e7e2d4'],
          [0.5, '#cfd8e2'],
        ].map(([oz, c], i) => (
          <mesh key={i} position={[0, 1.45, Number(oz)]} rotation={[0, 0.08 * (i ? 1 : -1), 0]} castShadow>
            <planeGeometry args={[1.05, 1.3]} />
            <meshStandardMaterial color={String(c)} roughness={0.92} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      {/* pallet stack + crate */}
      <mesh position={[11.5, 0.35, 0.5]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.4, 0.7, 1.2]} />
        <Pbr name="wood" repeat={[1, 1]} color="#d9c3a3" roughness={0.95} envMapIntensity={0.25} />
      </mesh>
      <mesh position={[11.2, 0.15, 2.2]} rotation={[0, -0.2, 0]}>
        <boxGeometry args={[1.5, 0.3, 1.3]} />
        <Pbr name="wood" repeat={[1, 1]} color="#e0c8a8" roughness={0.95} envMapIntensity={0.25} />
      </mesh>
      {/* pipes along the east parapet */}
      <mesh position={[13.6, 0.35, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 16, 10]} />
        <meshStandardMaterial color="#79828a" roughness={0.6} metalness={0.45} />
      </mesh>
    </group>
  );
}
