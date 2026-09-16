import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { registerOccluders } from '../runtime';
import { WallMeshes, WallColliders, Blockers, Tree, LampPost, Bench, Planter, SchoolSign, Door, type Seg } from './props';
import { Pbr } from './pbr';
import { CampusInterior } from './CampusInterior';
import { GedungB } from './GedungB';
import { Library } from './Library';

// SMA Yuson campus — rebuilt from scratch (no school GLB). Grounds, main
// building with accessible interior, canteen, field, parking, back alley,
// rear yard, the old warehouse exterior, the 3-storey Gedung B (all floors
// walkable) and the library. Colliders mirror every wall.

const GRASS = '#5f7a52';
const GRASS_D = '#546c4a';
const PAVE = '#a7a9ab';
const PAVE_D = '#8e9194';
const ROAD = '#41464c';
const WALL_CREAM = '#e9e2d2';
const TRIM_BLUE = '#31547a';
const ROOF_GREY = '#5c636b';

// ---------------------------------------------------------------------------
// Walls (data)
// ---------------------------------------------------------------------------
const MAIN_SHELL: Seg[] = [
  // south facade z=28, door gap x -1.6..1.6
  { x: -8.8, z: 28, w: 14.4, d: 0.3, color: WALL_CREAM },
  { x: 8.8, z: 28, w: 14.4, d: 0.3, color: WALL_CREAM },
  // north wall z=4, stair-shaft door gap x -1..1
  { x: -8.5, z: 4, w: 15, d: 0.3, color: WALL_CREAM },
  { x: 8.5, z: 4, w: 15, d: 0.3, color: WALL_CREAM },
  // west / east
  { x: -16, z: 16, w: 0.3, d: 24.3, color: WALL_CREAM },
  { x: 16, z: 16, w: 0.3, d: 24.3, color: WALL_CREAM },
  // hall/corridor divider z=21, gap x -2.5..2.5
  { x: -9.25, z: 21, w: 13.5, d: 0.25, color: '#ded5c2' },
  { x: 9.25, z: 21, w: 13.5, d: 0.25, color: '#ded5c2' },
  // storage core (z 16..21, x -2..2)
  { x: -2, z: 18.5, w: 0.25, d: 5.25, color: '#ded5c2' },
  { x: 2, z: 18.5, w: 0.25, d: 5.25, color: '#ded5c2' },
  { x: 0, z: 16, w: 4.25, d: 0.25, color: '#ded5c2' },
  // rooms wall z=14 — classroom door x -9.5..-7.5, teacher door x 8..10
  { x: -12.75, z: 14, w: 6.5, d: 0.25, color: '#ded5c2' },
  { x: -0.25, z: 14, w: 15.5, d: 0.25, color: '#ded5c2' },
  { x: 13, z: 14, w: 6, d: 0.25, color: '#ded5c2' },
  // room dividers x=±2 (z 4..14)
  { x: -2, z: 9, w: 0.25, d: 10, color: '#ded5c2' },
  { x: 2, z: 9, w: 0.25, d: 10, color: '#ded5c2' },
];

// v0.8.0: lintels above the classroom / teacher-room door gaps (visual only)
const MAIN_LINTELS: Seg[] = [
  { x: -8.75, z: 14, w: 1.7, d: 0.25, h: 0.78, y0: 2.52, color: WALL_CREAM },
  { x: 8.75, z: 14, w: 2.6, d: 0.25, h: 0.78, y0: 2.52, color: WALL_CREAM },
];

// Second-floor facade bands + roof (visual only, above reachable space)
const UPPER_FACADE: Seg[] = [
  { x: 0, z: 28.05, w: 32.3, d: 0.3, h: 3.2, y0: 3.35, color: WALL_CREAM },
  { x: 0, z: 3.95, w: 32.3, d: 0.3, h: 3.2, y0: 3.35, color: WALL_CREAM },
  { x: -16.05, z: 16, w: 0.3, d: 24.3, h: 3.2, y0: 3.35, color: WALL_CREAM },
  { x: 16.05, z: 16, w: 0.3, d: 24.3, h: 3.2, y0: 3.35, color: WALL_CREAM },
];

const CANTEEN_WALLS: Seg[] = [
  { x: 22, z: 4.5, w: 0.3, d: 5, color: '#d8cdb6' },
  { x: 22, z: 11.5, w: 0.3, d: 5, color: '#d8cdb6' },
  { x: 28, z: 2, w: 12.3, d: 0.3, color: '#d8cdb6' },
  { x: 28, z: 14, w: 12.3, d: 0.3, color: '#d8cdb6' },
  { x: 34, z: 8, w: 0.3, d: 12.3, color: '#d8cdb6' },
];

const STAIR_SHAFT: Seg[] = [
  { x: -4, z: 1, w: 0.3, d: 6.3, h: 6.6, color: '#cfc6b2' },
  { x: 4, z: 1, w: 0.3, d: 6.3, h: 6.6, color: '#cfc6b2' },
  { x: -2.5, z: -2, w: 3.2, d: 0.3, h: 6.6, color: '#cfc6b2' },
  { x: 2.5, z: -2, w: 3.2, d: 0.3, h: 6.6, color: '#cfc6b2' },
];

const WAREHOUSE_WALLS: Seg[] = [
  { x: -26, z: -32.5, w: 0.4, d: 7, h: 5.5, color: '#9aa4ae', pbr: 'corrugated' },
  { x: -26, z: -21.5, w: 0.4, d: 7, h: 5.5, color: '#9aa4ae', pbr: 'corrugated' },
  { x: -36, z: -36, w: 20.4, d: 0.4, h: 5.5, color: '#8f99a3', pbr: 'corrugated' },
  { x: -36, z: -18, w: 20.4, d: 0.4, h: 5.5, color: '#8f99a3', pbr: 'corrugated' },
  { x: -46, z: -27, w: 0.4, d: 18.4, h: 5.5, color: '#8f99a3', pbr: 'corrugated' },
  // dark interior blocker behind the doorway (door "closed")
  { x: -27.3, z: -27, w: 1.8, d: 3.6, h: 4.2, color: '#0b0d10', rough: 1, pbr: 'none' },
];

// ---------------------------------------------------------------------------
// Sub-scenes
// ---------------------------------------------------------------------------
function Ground() {
  return (
    <group>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[60, 0.25, 60]} position={[0, -0.25, 8]} />
      </RigidBody>
      <mesh position={[0, 0, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[130, 130]} />
        <Pbr name="grass" repeat={[26, 26]} roughness={1} envMapIntensity={0.35} />
      </mesh>
      {/* street + sidewalk (south edge) */}
      <mesh position={[0, 0.012, 50.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 8.5]} />
        <Pbr name="asphalt" repeat={[24, 2]} roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.02, 45.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 1.6]} />
        <Pbr name="concrete" repeat={[30, 1]} roughness={0.9} />
      </mesh>
      {/* zebra crossing */}
      {[-2.4, -1.2, 0, 1.2, 2.4].map((dx, i) => (
        <mesh key={i} position={[7 + dx, 0.02, 47.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 2.6]} />
          <meshStandardMaterial color="#d8dadd" roughness={0.8} />
        </mesh>
      ))}
      {/* courtyard plaza + entry path */}
      <mesh position={[7, 0.015, 36]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 16]} />
        <Pbr name="pavers" repeat={[10, 5]} roughness={0.92} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[7, 0.02, 36]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.5, 15.8]} />
        <Pbr name="pavers" repeat={[2, 5]} color="#b0b2b4" roughness={0.94} />
      </mesh>
      {/* entrance steps landing */}
      <mesh position={[0, 0.05, 29.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 2.6]} />
        <Pbr name="concrete" repeat={[2, 1]} color="#9fa2a5" roughness={0.9} />
      </mesh>
      {/* parking */}
      <mesh position={[34, 0.014, 34]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <Pbr name="asphalt" repeat={[5, 5]} roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      {/* field */}
      <mesh position={[-33, 0.013, 15]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 30]} />
        <Pbr name="grass" repeat={[7, 8]} color="#cdd8c9" roughness={1} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[-33, 0.02, 15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8, 10.4, 48]} />
        <Pbr name="dirt" repeat={[6, 1]} roughness={1} envMapIntensity={0.25} />
      </mesh>
      {/* back alley */}
      <mesh position={[6, 0.012, -21]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 18]} />
        <Pbr name="asphalt" repeat={[6, 5]} color="#8b929c" roughness={1} envMapIntensity={0.25} />
      </mesh>
      <mesh position={[6, 0.018, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 1.6]} />
        <meshStandardMaterial color="#2b2e33" roughness={0.35} metalness={0.2} envMapIntensity={0.8} />
      </mesh>
      {/* rear yard path */}
      <mesh position={[0, 0.014, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 11]} />
        <Pbr name="concrete" repeat={[6, 3]} color="#b4afa6" roughness={0.95} />
      </mesh>
      {/* warehouse yard */}
      <mesh position={[-36, 0.014, -26]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[23, 21]} />
        <Pbr name="concrete" repeat={[6, 6]} color="#a2a4a5" roughness={1} envMapIntensity={0.25} />
      </mesh>
      {/* canteen front slab */}
      <mesh position={[20, 0.016, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 9]} />
        <Pbr name="pavers" repeat={[2, 3]} roughness={0.94} />
      </mesh>
      {/* v0.8.0: library plaza + approach from the main building */}
      <mesh position={[31, 0.016, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 10.5]} />
        <Pbr name="pavers" repeat={[6, 3]} roughness={0.92} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[19.4, 0.015, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.6, 4]} />
        <Pbr name="pavers" repeat={[2, 1]} color="#b0b2b4" roughness={0.94} />
      </mesh>
      {/* v0.8.0: Gedung B approach path (rear yard → corridor entrance) */}
      <mesh position={[17.5, 0.015, -14.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 3.6]} />
        <Pbr name="concrete" repeat={[5, 1]} color="#b4afa6" roughness={0.95} />
      </mesh>
    </group>
  );
}

function FenceGate() {
  return (
    <group>
      {/* Fence visuals removed per user request (0.2.x fix: was blocking the
          camera). Invisible colliders below still stop the player leaving the
          grounds; the gate pillars + arch remain as landmarks. */}
      {/* school fence line colliders (south, gate gap x 4..10) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[27, 1.2, 0.3]} position={[-23, 1.2, 46]} />
        <CuboidCollider args={[27, 1.2, 0.3]} position={[37, 1.2, 46]} />
      </RigidBody>
      {/* perimeter (west/north/east/south-outer) invisible blockers */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[48.5, 2, 0.4]} position={[0, 2, -37.8]} />
        <CuboidCollider args={[0.4, 2, 46]} position={[-47.8, 2, 8]} />
        <CuboidCollider args={[0.4, 2, 46]} position={[47.8, 2, 8]} />
        <CuboidCollider args={[48.5, 2, 0.4]} position={[0, 2, 53.8]} />
      </RigidBody>
      {/* gate pillars + arch */}
      {[4, 10].map((x, i) => (
        <group key={i} position={[x, 0, 46]}>
          <mesh position={[0, 1.6, 0]} castShadow>
            <boxGeometry args={[0.7, 3.2, 0.7]} />
            <Pbr name="concrete" repeat={[1, 4]} color="#b6babe" roughness={0.75} />
          </mesh>
          <mesh position={[0, 3.35, 0]}>
            <boxGeometry args={[0.95, 0.25, 0.95]} />
            <Pbr name="metal" repeat={[1, 1]} color="#9aa0a6" roughness={0.6} metalness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[7, 3.85, 46]} castShadow>
        <boxGeometry args={[6.8, 0.9, 0.25]} />
        <meshStandardMaterial color="#1f3a5c" roughness={0.55} />
      </mesh>
      <SchoolSign position={[7, 3.85, 46.15]} text="SMA YUSON" size={0.52} color="#ffd34d" />
      {/* school name board near sidewalk */}
      <group position={[-2, 0, 45]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[3.4, 1.5, 0.18]} />
          <meshStandardMaterial color="#26405e" roughness={0.6} />
        </mesh>
        <SchoolSign position={[0, 1.35, 0.11]} text="SMA YUSON" size={0.3} color="#e8edf4" />
        <SchoolSign position={[0, 0.95, 0.11]} text="DISIPLIN · PRESTASI · EMPATI" size={0.14} color="#9fc2e8" />
        {[-1.4, 1.4].map((dx, i) => (
          <mesh key={i} position={[dx, 0.4, 0]}>
            <boxGeometry args={[0.16, 1.1, 0.16]} />
            <meshStandardMaterial color="#4a5058" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function MainBuilding() {
  const g = useRef<THREE.Group>(null);
  return (
    <group ref={g}>
      <WallMeshes segs={MAIN_SHELL} color={WALL_CREAM} />
      <WallColliders segs={MAIN_SHELL} />
      {/* v0.8.0: classroom & teacher-room doors, swung open into the rooms */}
      <WallMeshes segs={MAIN_LINTELS} color={WALL_CREAM} />
      <Door x={-8.75} z={14} w={1.5} open={-1} hinge={-1} />
      <Door x={8.75} z={14} w={2.4} open={-1} hinge={1} />
      {/* second floor + roof */}
      <WallMeshes segs={UPPER_FACADE} color={WALL_CREAM} />
      {/* blue trim band between floors */}
      {[28.05, 3.95].map((z, i) => (
        <mesh key={i} position={[0, 3.42, z]}>
          <boxGeometry args={[32.5, 0.22, 0.36]} />
          <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
        </mesh>
      ))}
      {[-16.05, 16.05].map((x, i) => (
        <mesh key={i} position={[x, 3.42, 16]}>
          <boxGeometry args={[0.36, 0.22, 24.5]} />
          <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 6.75, 16]} receiveShadow castShadow>
        <boxGeometry args={[33.2, 0.35, 25.6]} />
        <Pbr name="roof" repeat={[10, 8]} roughness={0.9} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0, 6.95, 16]}>
        <boxGeometry args={[33.4, 0.12, 25.8]} />
        <Pbr name="roof" repeat={[10, 8]} color="#9aa2ab" roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      {/* ground-floor windows (south facade) */}
      {[-12, -7, 7, 12].map((x, i) => (
        <group key={i} position={[x, 1.7, 27.83]}>
          <mesh>
            <boxGeometry args={[1.9, 1.7, 0.12]} />
            <meshStandardMaterial color="#9fb6c4" roughness={0.18} metalness={0.5} emissive="#274a5c" emissiveIntensity={0.12} />
          </mesh>
          <mesh position={[0, 0.95, 0.02]}>
            <boxGeometry args={[2.1, 0.14, 0.16]} />
            <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* second-floor window band */}
      {[-12, -8, -4, 0, 4, 8, 12].map((x, i) => (
        <group key={`u${i}`} position={[x, 5.05, 28.08]}>
          <mesh>
            <boxGeometry args={[1.7, 1.5, 0.14]} />
            <meshStandardMaterial color="#8fadb8" roughness={0.2} metalness={0.45} emissive="#274a5c" emissiveIntensity={0.1} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[1.9, 0.12, 0.18]} />
            <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* entrance: steps, door frame, canopy, sign */}
      <mesh position={[0, 0.09, 28.9]} receiveShadow>
        <boxGeometry args={[4.4, 0.18, 1.8]} />
        <Pbr name="concrete" repeat={[2, 1]} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.2, 29.6]} receiveShadow>
        <boxGeometry args={[4.4, 0.2, 0.7]} />
        <Pbr name="concrete" repeat={[2, 1]} roughness={0.85} />
      </mesh>
      <group position={[0, 0, 28]}>
        {[-1.9, 1.9].map((x, i) => (
          <mesh key={i} position={[x, 1.55, 0.3]} castShadow>
            <boxGeometry args={[0.22, 3.1, 0.22]} />
            <meshStandardMaterial color="#6e747b" roughness={0.6} metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 3.05, 0.5]} castShadow>
          <boxGeometry args={[4.6, 0.28, 2.2]} />
          <meshStandardMaterial color={TRIM_BLUE} roughness={0.55} />
        </mesh>
        {/* double door (open, swung inward) */}
        {[-0.75, 0.75].map((x, i) => (
          <mesh key={i} position={[x, 1.35, -0.55]} rotation={[0, i === 0 ? 0.5 : -0.5, 0]} castShadow>
            <boxGeometry args={[1.4, 2.7, 0.08]} />
            <meshStandardMaterial color="#2c4a68" roughness={0.5} metalness={0.25} />
          </mesh>
        ))}
      </group>
      <SchoolSign position={[0, 3.55, 28.35]} text="GEDUNG UTAMA" size={0.3} color="#dfe7f0" />
    </group>
  );
}

function StairShaft() {
  const steps: { y: number; z: number }[] = [];
  for (let i = 0; i < 8; i++) steps.push({ y: i * 0.34, z: -1.35 + i * 0.62 });
  return (
    <group>
      <WallMeshes segs={STAIR_SHAFT} />
      <WallColliders segs={STAIR_SHAFT} defaultH={6.6} />
      <mesh position={[0, 6.75, 1]} castShadow>
        <boxGeometry args={[8.6, 0.3, 6.9]} />
        <Pbr name="roof" repeat={[3, 2]} roughness={0.9} envMapIntensity={0.35} />
      </mesh>
      {/* steps (visual + walkable) */}
      {steps.map((s, i) => (
        <mesh key={i} position={[0, s.y + 0.17, s.z]} castShadow receiveShadow>
          <boxGeometry args={[6.2, 0.34, 0.62]} />
          <Pbr name="concrete" repeat={[3, 1]} color="#d4ccbb" roughness={0.9} />
        </mesh>
      ))}
      {/* landing platform below roof access door */}
      <mesh position={[0, 3.4, 3.4]} castShadow receiveShadow>
        <boxGeometry args={[6.2, 0.3, 1.6]} />
        <Pbr name="concrete" repeat={[3, 1]} color="#d4ccbb" roughness={0.9} />
      </mesh>
      {/* rooftop access door on upper landing (decor) */}
      <mesh position={[0, 4.7, 3.95]}>
        <boxGeometry args={[1.6, 2.2, 0.14]} />
        <meshStandardMaterial color="#3a5a7c" roughness={0.55} metalness={0.2} />
      </mesh>
      {/* door frame at ground entry */}
      <mesh position={[0, 1.5, -2.05]}>
        <boxGeometry args={[2.3, 3, 0.18]} />
        <meshStandardMaterial color="#8c8474" roughness={0.8} />
      </mesh>
      {/* side railing visual */}
      {[-3.85, 3.85].map((x, i) => (
        <mesh key={i} position={[x, 1.1, 1]}>
          <boxGeometry args={[0.06, 2.2, 6]} />
          <meshStandardMaterial color="#54595f" roughness={0.6} metalness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function Canteen() {
  return (
    <group>
      <WallMeshes segs={CANTEEN_WALLS} color="#d8cdb6" />
      <WallColliders segs={CANTEEN_WALLS} defaultH={3.1} />
      <mesh position={[28, 3.25, 8]} castShadow>
        <boxGeometry args={[13, 0.3, 13]} />
        <Pbr name="corrugated" repeat={[5, 1]} color="#c98f6d" roughness={0.85} envMapIntensity={0.3} />
      </mesh>
      {/* windows */}
      {[5, 11].map((z, i) => (
        <mesh key={i} position={[34.06, 1.8, z]}>
          <boxGeometry args={[0.14, 1.5, 2]} />
          <meshStandardMaterial color="#9fb6c4" roughness={0.2} metalness={0.45} />
        </mesh>
      ))}
      <mesh position={[28, 1.8, 1.93]}>
        <boxGeometry args={[7, 1.5, 0.14]} />
        <meshStandardMaterial color="#9fb6c4" roughness={0.2} metalness={0.45} />
      </mesh>
      <SchoolSign position={[21.6, 2.6, 8]} text="KANTIN" size={0.42} color="#7a3b12" />
    </group>
  );
}

function Parking() {
  const carColors = ['#7f1d1d', '#1e3a5f', '#3f3f46'];
  return (
    <group>
      {/* stall lines */}
      {[27.5, 30.5, 33.5, 36.5, 39.5].map((x, i) => (
        <mesh key={i} position={[x, 0.02, 34]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.14, 9]} />
          <meshStandardMaterial color="#d6d8da" roughness={0.8} />
        </mesh>
      ))}
      {[29, 32, 35, 38].map((x, i) => (
        <group key={i} position={[x, 0, 31.5]} rotation={[0, i % 2 ? 0.06 : -0.05, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.7, 0.75, 3.6]} />
            <meshStandardMaterial color={carColors[i % 3]} roughness={0.35} metalness={0.55} />
          </mesh>
          <mesh position={[0, 1.05, -0.25]} castShadow>
            <boxGeometry args={[1.55, 0.5, 1.9]} />
            <meshStandardMaterial color={carColors[i % 3]} roughness={0.3} metalness={0.55} />
          </mesh>
          <mesh position={[0, 1.06, -0.25]}>
            <boxGeometry args={[1.58, 0.34, 1.6]} />
            <meshStandardMaterial color="#20262c" roughness={0.15} metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* motorbikes */}
      {[29.2, 30.6].map((x, i) => (
        <group key={`m${i}`} position={[x, 0, 37.5]} rotation={[0, 0.3 * (i ? 1 : -1), 0]}>
          <mesh position={[0, 0.62, 0]} castShadow>
            <boxGeometry args={[0.45, 0.4, 1.5]} />
            <meshStandardMaterial color={['#166534', '#1d4ed8'][i]} roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0.3, 0.7]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.12, 12]} />
            <meshStandardMaterial color="#14161a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.3, -0.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.12, 12]} />
            <meshStandardMaterial color="#14161a" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <LampPost x={26.5} z={28.5} h={4.6} />
      <LampPost x={41.5} z={39.5} h={4.6} />
    </group>
  );
}

function FieldProps() {
  return (
    <group>
      {/* goals */}
      {[7, 23].map((z, i) => (
        <group key={i} position={[-33, 0, z]}>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[5.4, 0.09, 0.09]} />
            <meshStandardMaterial color="#eef0f2" roughness={0.6} />
          </mesh>
          {[-2.6, 2.6].map((dx, j) => (
            <mesh key={j} position={[dx, 0.5, 0]}>
              <boxGeometry args={[0.09, 1, 0.09]} />
              <meshStandardMaterial color="#eef0f2" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      {/* bleachers */}
      <group position={[-43.5, 0, 15]} rotation={[0, Math.PI / 2, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[i * 0.9, 0.3 + i * 0.42, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.18 + i * 0.42, 10]} />
            <Pbr name="concrete" repeat={[1, 3]} color={i % 2 ? '#b9bec5' : '#ccd1d7'} roughness={0.85} />
          </mesh>
        ))}
      </group>
      <Tree x={-24} z={4} s={1.05} />
      <Tree x={-42} z={27} s={1.1} />
    </group>
  );
}

function Alley() {
  return (
    <group>
      {/* low side walls keep the alley identity without blocking the camera
          (fence visuals removed per user preference; colliders stay invisible) */}
      <WallMeshes
        segs={[
          { x: 18, z: -21, w: 0.25, d: 18, h: 1.1, color: '#828a91' },
          { x: -6, z: -21, w: 0.25, d: 18, h: 1.1, color: '#828a91' },
        ]}
        rough={0.75}
      />
      <WallColliders segs={[{ x: 18, z: -21, w: 0.25, d: 18, h: 2.2 }, { x: -6, z: -21, w: 0.25, d: 18, h: 2.2 }]} defaultH={2.2} />
      {/* dumpsters */}
      {[[2, -27.5], [10.5, -28]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, i * 0.3, 0]}>
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[2.2, 1.5, 1.2]} />
            <meshStandardMaterial color="#2f5d3a" roughness={0.75} metalness={0.3} />
          </mesh>
          <mesh position={[0, 1.55, 0]} rotation={[0.12, 0, 0]} castShadow>
            <boxGeometry args={[2.3, 0.12, 1.3]} />
            <meshStandardMaterial color="#285033" roughness={0.75} metalness={0.3} />
          </mesh>
        </group>
      ))}
      {/* crates & pallets */}
      {[[14.5, -25, 0.4], [15.2, -24.2, -0.2], [14.6, -23.4, 0.1]].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.55, z]} rotation={[0, r, 0]} castShadow>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <Pbr name="wood" repeat={[1, 1]} color="#d9c3a3" roughness={0.95} envMapIntensity={0.25} />
        </mesh>
      ))}
      <mesh position={[-3, 0.3, -14]} rotation={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.6, 0.5, 1.4]} />
        <Pbr name="wood" repeat={[1, 1]} color="#e0c8a8" roughness={0.95} envMapIntensity={0.25} />
      </mesh>
      <LampPost x={12.5} z={-15.5} h={3.6} />
    </group>
  );
}

function RearYard() {
  return (
    <group>
      {/* clotheslines */}
      {[-6.5, -1.5].map((z, i) => (
        <group key={i} position={[-9, 0, z]}>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.05, 0.06, 2.6, 8]} />
            <meshStandardMaterial color="#6b7076" roughness={0.7} />
          </mesh>
        </group>
      ))}
      <mesh position={[-9, 2.5, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.03, 5]} />
        <meshStandardMaterial color="#d5d8da" />
      </mesh>
      {[[-9.4, -5.2], [-8.6, -3.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.55, z]} rotation={[0, 0.2, 0]} castShadow>
          <planeGeometry args={[1.1, 1.5]} />
          <meshStandardMaterial color={i ? '#e7e2d4' : '#cfd8e2'} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* bins */}
      {[9.5, 10.8].map((x, i) => (
        <mesh key={i} position={[x, 0.55, -3.2]} castShadow>
          <cylinderGeometry args={[0.42, 0.36, 1.1, 12]} />
          <meshStandardMaterial color={i ? '#3f5a68' : '#4a6b52'} roughness={0.8} />
        </mesh>
      ))}
      {/* bike shed */}
      <group position={[19.5, 0, -3]}>
        <mesh position={[0, 1.15, -1.4]} castShadow>
          <boxGeometry args={[4.6, 2.3, 0.15]} />
          <Pbr name="corrugated" repeat={[3, 1]} color="#aeb6bd" roughness={0.75} metalness={0.3} />
        </mesh>
        <mesh position={[0, 2.4, 0]} castShadow>
          <boxGeometry args={[5, 0.14, 3]} />
          <Pbr name="corrugated" repeat={[3, 1]} color="#8a9299" roughness={0.8} metalness={0.3} envMapIntensity={0.35} />
        </mesh>
        {[-2.3, 2.3].map((x, i) => (
          <mesh key={i} position={[x, 1.15, 0]}>
            <boxGeometry args={[0.14, 2.3, 2.8]} />
            <Pbr name="metal" repeat={[1, 2]} color="#9aa2a9" roughness={0.75} metalness={0.3} />
          </mesh>
        ))}
        {[[-1.2], [0.4]].map(([x], i) => (
          <mesh key={i} position={[x, 0.45, 0.2]} rotation={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.4, 0.8, 1.5]} />
            <meshStandardMaterial color="#26405e" roughness={0.4} metalness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WarehouseExt() {
  return (
    <group>
      <WallMeshes segs={WAREHOUSE_WALLS} color="#6f7a84" rough={0.9} />
      <WallColliders segs={WAREHOUSE_WALLS} defaultH={5.5} />
      <mesh position={[-36, 5.65, -27]} castShadow>
        <boxGeometry args={[21, 0.3, 19]} />
        <Pbr name="corrugated" repeat={[8, 1]} color="#9aa2ab" roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      {/* rust streaks */}
      {[[-31, -18.1, 3], [-40, -18.1, 4.5], [-26.1, -33, 4]].map(([x, z, w], i) => (
        <mesh key={i} position={[x, 2.4, z]}>
          <planeGeometry args={[w * 0.3, 3]} />
          <meshStandardMaterial color="#7a4a2e" roughness={1} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* door frame sign */}
      <SchoolSign position={[-25.7, 3.6, -27]} text="GUDANG 3" size={0.34} color="#c9d2da" />
      {/* containers outside */}
      <group position={[-22.5, 0, -21]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 1.3, 0]} castShadow>
          <boxGeometry args={[6, 2.6, 2.4]} />
          <Pbr name="corrugated" repeat={[4, 1]} color="#c97a5e" roughness={0.75} metalness={0.3} envMapIntensity={0.35} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[6.05, 2.65, 2.3]} />
          <meshStandardMaterial color="#8a4632" roughness={0.8} wireframe />
        </mesh>
      </group>
      <mesh position={[-24.5, 0.8, -33.5]} rotation={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[5.6, 1.6, 2.2]} />
        <Pbr name="corrugated" repeat={[4, 1]} color="#8fae94" roughness={0.8} metalness={0.25} envMapIntensity={0.35} />
      </mesh>
      {/* tires */}
      {[[-29, -20.5], [-30.4, -20.2], [-29.7, -21.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} rotation={[Math.PI / 2, 0, i * 0.4]}>
          <torusGeometry args={[0.32, 0.14, 10, 18]} />
          <meshStandardMaterial color="#17191c" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function Greenery() {
  return (
    <group>
      <Tree x={-14} z={33} s={1.1} />
      <Tree x={-9} z={41} s={0.95} />
      <Tree x={21} z={40} s={1.05} />
      <Tree x={17} z={30} s={0.9} />
      {/* v0.8.0: trees at (26,22)/(36,20) replaced by the library; (30,-8)
          replaced by Gedung B — replanted around the new buildings */}
      <Tree x={-20} z={40} s={1.2} />
      <Tree x={-38} z={36} s={1.1} />
      <Tree x={20} z={27.5} s={1.1} />
      <Tree x={44} z={1} s={1} />
      <Tree x={20.5} z={13} s={0.95} tint="#517a42" />
      <Tree x={26} z={-20} s={1.05} />
      <Tree x={41} z={-21} s={1.1} />
      <Tree x={14} z={-10} s={1} tint="#517a42" />
      <Tree x={-12} z={-14} s={1.15} tint="#517a42" />
      <Tree x={-30} z={-10} s={1.1} />
      <Planter x={0} z={33} />
      <Planter x={14} z={33} />
      <Planter x={2} z={41.5} w={3} />
      <Planter x={22.8} z={27} w={2} d={1} />
    </group>
  );
}

function StreetFurniture() {
  return (
    <group>
      {/* flag pole */}
      <group position={[7, 0, 41]}>
        <mesh position={[0, 4, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.06, 8, 8]} />
          <meshStandardMaterial color="#c8ccd0" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[0.8, 7.1, 0]} castShadow>
          <planeGeometry args={[1.4, 0.85]} />
          <meshStandardMaterial color="#b91c1c" side={THREE.DoubleSide} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.3, 12]} />
          <meshStandardMaterial color="#8e9296" roughness={0.8} />
        </mesh>
      </group>
      <Bench x={13.5} z={39.5} rot={-0.4} />
      <Bench x={0.5} z={39.5} rot={0.4} />
      <Bench x={20} z={24.5} rot={Math.PI / 2} />
      <LampPost x={-2} z={31} />
      <LampPost x={16} z={31} />
      <LampPost x={-2} z={42} />
      <LampPost x={16} z={42} />
      <LampPost x={-2} z={49} h={5} />
      <LampPost x={16} z={49} h={5} />
      <LampPost x={22} z={16} h={4} />
      <LampPost x={2} z={-8} h={3.8} />
    </group>
  );
}

// Small sign helper moved to props.tsx (shared with other scenes).

// ---------------------------------------------------------------------------
// v0.8.0: directional signpost in the main courtyard (user request: make the
// new buildings findable). Pole + labelled arrow boards pointing at the
// library, canteen, Gedung B and the field. ry maps local +X to the pointing
// direction: ry = atan2(-pz, px).
// ---------------------------------------------------------------------------
const SIGNPOST_BOARDS: { text: string; ry: number; y: number; color: string }[] = [
  { text: 'PERPUSTAKAAN', ry: Math.PI / 4, y: 2.35, color: '#ffd34d' },
  { text: 'KANTIN', ry: Math.PI / 3, y: 1.95, color: '#dfe7f0' },
  { text: 'GEDUNG B', ry: Math.PI / 2, y: 1.55, color: '#dfe7f0' },
  { text: 'LAPANGAN', ry: Math.PI, y: 1.95, color: '#dfe7f0' },
];

function Signpost() {
  return (
    <group position={[11.5, 0, 34.5]}>
      <mesh position={[0, 0.09, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.1, 0.18, 1.1]} />
        <Pbr name="concrete" repeat={[1, 1]} color="#9fa2a5" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.07, 2.7, 10]} />
        <meshStandardMaterial color="#5d646b" roughness={0.5} metalness={0.5} />
      </mesh>
      {SIGNPOST_BOARDS.map((b) => (
        <group key={b.text} position={[0, b.y, 0]} rotation={[0, b.ry, 0]}>
          <mesh position={[0.9, 0, 0]} castShadow>
            <boxGeometry args={[1.75, 0.3, 0.07]} />
            <meshStandardMaterial color="#1f3a5c" roughness={0.6} />
          </mesh>
          {/* arrow head at the far end of the board */}
          <mesh position={[1.92, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
            <coneGeometry args={[0.15, 0.26, 4]} />
            <meshStandardMaterial color="#1f3a5c" roughness={0.6} />
          </mesh>
          <SchoolSign position={[0.9, 0.01, 0.045]} text={b.text} size={0.17} color={b.color} />
          <SchoolSign position={[0.9, 0.01, -0.045]} text={b.text} size={0.17} color={b.color} rotY={Math.PI} />
        </group>
      ))}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.2, 1.4, 0.2]} position={[0, 1.4, 0]} />
      </RigidBody>
    </group>
  );
}

export function CampusWorld() {
  const bldg = useRef<THREE.Group>(null);
  const canteen = useRef<THREE.Group>(null);
  const wh = useRef<THREE.Group>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const objs = [bldg.current, canteen.current, wh.current].filter(Boolean) as THREE.Object3D[];
      if (objs.length) registerOccluders(objs);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <group>
      <Ground />
      <FenceGate />
      <group ref={bldg}>
        <MainBuilding />
        <StairShaft />
      </group>
      <group ref={canteen}>
        <Canteen />
      </group>
      <group ref={wh}>
        <WarehouseExt />
      </group>
      <Parking />
      <FieldProps />
      <Alley />
      <RearYard />
      <Greenery />
      <Signpost />
      <StreetFurniture />
      <CampusInterior />
      <GedungB />
      <Library />
    </group>
  );
}
