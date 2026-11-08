import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { WallMeshes, WallColliders, SchoolSign, Cull, type Seg } from './props';
import { Pbr } from './pbr';

// Perpustakaan — school library (v0.8.0), between the main building and the
// parking lot (footprint x 23..39, z 16..24). Ground-floor interior: bookshelf
// rows with a cross aisle on the door axis, reading tables, librarian counter.
// The neutral-route montage ("Siti di perpustakaan") frames this interior.

const WALL_CREAM = '#e9e2d2';

const LIB_SHELL: Seg[] = [
  // west wall with entrance gap z 19.2..21.2
  { x: 23, z: 17.6, w: 0.3, d: 3.2 },
  { x: 23, z: 22.6, w: 0.3, d: 2.8 },
  // east / north / south
  { x: 39, z: 20, w: 0.3, d: 8.3 },
  { x: 31, z: 16, w: 16.3, d: 0.3 },
  { x: 31, z: 24, w: 16.3, d: 0.3 },
  // lintel above the entrance
  { x: 23, z: 20.2, w: 0.3, d: 2.3, h: 0.9, y0: 2.7 },
];

const BOOK_COLORS = ['#a8524a', '#4a6a8a', '#6a8a4a', '#8a6a4a', '#5a5a8a'];

function LibLight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 3.3, z]}>
      <mesh>
        <boxGeometry args={[1.4, 0.06, 0.5]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff6dd" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, -0.25, 0]} intensity={3} distance={9} color="#fff2d8" />
    </group>
  );
}

// One shelf unit: body + 3 book strips (two-sided).
function ShelfUnit({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 2.1, 2.4]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.85} />
      </mesh>
      {BOOK_COLORS.slice(0, 3).map((c, i) => (
        <mesh key={i} position={[0, 0.55 + i * 0.5, 0]}>
          <boxGeometry args={[0.68, 0.3, 2.1]} />
          <meshStandardMaterial color={c} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function ReadingTable({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[1.9, 0.72, 0.9]} />
        <meshStandardMaterial color="#7d8590" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.77, 0]} castShadow>
        <boxGeometry args={[2.3, 0.06, 1.2]} />
        <Pbr name="wood" repeat={[2, 1]} color="#e0aa75" roughness={0.7} envMapIntensity={0.35} />
      </mesh>
      {[-0.75, 0.75].map((ox, i) => (
        <group key={i}>
          <mesh position={[ox, 0.44, -0.75]} castShadow>
            <boxGeometry args={[0.4, 0.05, 0.4]} />
            <Pbr name="wood" repeat={[1, 1]} color="#e0aa75" roughness={0.75} />
          </mesh>
          <mesh position={[ox, 0.22, -0.75]}>
            <cylinderGeometry args={[0.04, 0.06, 0.44, 8]} />
            <meshStandardMaterial color="#5d646b" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[ox, 0.44, 0.75]} castShadow>
            <boxGeometry args={[0.4, 0.05, 0.4]} />
            <Pbr name="wood" repeat={[1, 1]} color="#e0aa75" roughness={0.75} />
          </mesh>
          <mesh position={[ox, 0.22, 0.75]}>
            <cylinderGeometry args={[0.04, 0.06, 0.44, 8]} />
            <meshStandardMaterial color="#5d646b" roughness={0.6} metalness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Library() {
  // shelf rows (north-south), split by the cross aisle on the door axis
  const shelfXs = [27.5, 31, 34.5];
  const shelfZs = [18.4, 21.6];
  const tables: [number, number][] = [
    [25.3, 18.6],
    [25.3, 21.4],
    [37, 21],
  ];
  return (
    // v0.9.0: shell is a frustum-cull bundle; furniture/lights are an
    // 'interior' bundle hidden past interiorRange (walls hide them anyway)
    <Cull center={[31, 1.8, 20]} radius={10.5}>
      <WallMeshes segs={LIB_SHELL} color={WALL_CREAM} />
      <WallColliders segs={LIB_SHELL} defaultH={3.6} />
      {/* roof + cap */}
      <mesh position={[31, 3.75, 20]} receiveShadow castShadow>
        <boxGeometry args={[16.6, 0.3, 8.6]} />
        <Pbr name="roof" repeat={[6, 3]} roughness={0.9} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[31, 3.96, 20]}>
        <boxGeometry args={[16.8, 0.12, 8.8]} />
        <Pbr name="roof" repeat={[6, 3]} color="#9aa2ab" roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      {/* windows: north face, south face, east face */}
      {[26, 31, 36].map((x, i) => (
        <group key={`n${i}`} position={[x, 1.8, 15.92]}>
          <mesh>
            <boxGeometry args={[2, 1.5, 0.14]} />
            <meshStandardMaterial color="#9fb6c4" roughness={0.18} metalness={0.5} emissive="#274a5c" emissiveIntensity={0.12} />
          </mesh>
        </group>
      ))}
      {[26, 31, 36].map((x, i) => (
        <group key={`s${i}`} position={[x, 1.8, 24.08]}>
          <mesh>
            <boxGeometry args={[2, 1.5, 0.14]} />
            <meshStandardMaterial color="#9fb6c4" roughness={0.18} metalness={0.5} emissive="#274a5c" emissiveIntensity={0.12} />
          </mesh>
        </group>
      ))}
      <mesh position={[39.08, 1.8, 20]}>
        <boxGeometry args={[0.14, 1.5, 2]} />
        <meshStandardMaterial color="#9fb6c4" roughness={0.18} metalness={0.5} />
      </mesh>
      {/* entrance: swung-open double doors + canopy */}
      {[-0.62, 0.62].map((dz, i) => (
        <mesh key={i} position={[22.72, 1.35, 20.2 + dz]} rotation={[0, i === 0 ? -0.55 : 0.55, 0]} castShadow>
          <boxGeometry args={[0.08, 2.7, 1.15]} />
          <meshStandardMaterial color="#2c4a68" roughness={0.5} metalness={0.25} />
        </mesh>
      ))}
      <mesh position={[22.3, 2.95, 20.2]} castShadow>
        <boxGeometry args={[1.6, 0.22, 3]} />
        <meshStandardMaterial color="#31547a" roughness={0.55} />
      </mesh>
      {/* interior floor + ceiling */}
      <mesh position={[31, 0.04, 20]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15.4, 7.4]} />
        <Pbr name="tile" repeat={[6, 3]} color="#e2dccd" roughness={0.6} envMapIntensity={0.4} />
      </mesh>
      <mesh position={[31, 3.55, 20]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15.4, 7.4]} />
        <meshStandardMaterial color="#f2efe6" roughness={0.95} />
      </mesh>
      <Cull mode="interior" center={[31, 1.2, 20]} radius={8}>
      <LibLight x={26} z={20} />
      <LibLight x={31} z={20} />
      <LibLight x={36} z={20} />
      {/* rug in the cross aisle */}
      <mesh position={[31, 0.06, 20.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 2]} />
        <meshStandardMaterial color="#7a4a5a" roughness={0.95} />
      </mesh>
      {/* bookshelf rows */}
      {shelfXs.map((x) =>
        shelfZs.map((z) => <ShelfUnit key={`${x}-${z}`} x={x} z={z} />),
      )}
      {/* reading tables */}
      {tables.map(([x, z], i) => (
        <ReadingTable key={i} x={x} z={z} rot={i === 2 ? Math.PI / 2 : 0} />
      ))}
      {/* librarian counter + return bin + board */}
      <mesh position={[37.4, 0.52, 17.6]} castShadow>
        <boxGeometry args={[1.7, 1.04, 3.2]} />
        <meshStandardMaterial color="#8d8578" roughness={0.8} />
      </mesh>
      <mesh position={[37.4, 1.08, 17.6]}>
        <boxGeometry args={[1.85, 0.07, 3.35]} />
        <meshStandardMaterial color="#b9bec4" roughness={0.35} metalness={0.5} />
      </mesh>
      <SchoolSign position={[37.4, 1.45, 17.6]} text="LOKET" size={0.2} color="#26405e" />
      <mesh position={[36.2, 0.45, 22.9]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#3f5a68" roughness={0.8} />
      </mesh>
      <mesh position={[28, 1.7, 23.8]}>
        <boxGeometry args={[2.4, 1.2, 0.08]} />
        <meshStandardMaterial color="#6b4f2e" roughness={0.8} />
      </mesh>
      <mesh position={[28, 1.7, 23.74]}>
        <planeGeometry args={[2.1, 0.95]} />
        <meshStandardMaterial color="#e9e2ce" roughness={0.95} />
      </mesh>
      {/* corner plants */}
      {[
        [24.1, 23.2],
        [38.2, 23.2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.34, 0.6, 12]} />
            <meshStandardMaterial color="#9c5f4a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <sphereGeometry args={[0.5, 12, 10]} />
            <meshStandardMaterial color="#3f6f3f" roughness={0.95} />
          </mesh>
        </group>
      ))}
      </Cull>
      {/* furniture colliders */}
      <RigidBody type="fixed" colliders={false}>
        {shelfXs.map((x) =>
          shelfZs.map((z) => (
            <CuboidCollider key={`${x}-${z}`} args={[0.3, 1.05, 1.2]} position={[x, 1.05, z]} />
          )),
        )}
        {tables.map(([x, z], i) =>
          i === 2 ? (
            <CuboidCollider key={`t${i}`} args={[0.6, 0.4, 1.15]} position={[x, 0.4, z]} />
          ) : (
            <CuboidCollider key={`t${i}`} args={[1.15, 0.4, 0.6]} position={[x, 0.4, z]} />
          ),
        )}
        <CuboidCollider args={[0.85, 0.55, 1.6]} position={[37.4, 0.55, 17.6]} />
        <CuboidCollider args={[0.45, 0.45, 0.45]} position={[36.2, 0.45, 22.9]} />
      </RigidBody>
      {/* facade sign (faces west, toward the main building path) */}
      <SchoolSign position={[22.8, 3.2, 20.2]} text="PERPUSTAKAAN" size={0.34} color="#ffd34d" rotY={-Math.PI / 2} />
    </Cull>
  );
}
