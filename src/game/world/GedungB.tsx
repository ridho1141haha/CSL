import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { WallMeshes, WallColliders, SchoolSign, Door, type Seg } from './props';
import { Pbr } from './pbr';

// Gedung B — three-storey classroom building (v0.8.0), east of the rear yard
// (footprint x 24..44, z -16..-2). Unlike the main building (second floor is
// facade-only), EVERY floor is reachable: a real switchback stair core at the
// east end of the open-air north corridor, built from walkable colliders.
//
// Layout per floor (mirrored x3, like a real school block):
//   - open-air corridor along the north edge (z -16..-13.6) with railing
//   - two rooms behind it: Kelas (x 24..36) + Ruang ekskul (x 36..44)
//   - stair core inside the corridor strip (x 36..44): two 1.7 m lanes with
//     5-step flights (rise 0.35, run 0.62), west floor landings on the
//     corridor line, east mid-landings between flights.
//
// Levels: L1 walk y=0, L2 y=3.5, L3 y=7.0; slabs 0.3 thick; walls 3.2 high;
// roof slab at y 10.2..10.5.

const WALL_CREAM = '#e9e2d2';
const WALL_INNER = '#ded5c2';
const TRIM_BLUE = '#31547a';

const LEVELS = [0, 3.5, 7];
const SLAB = 0.3;
const WALL_H = 3.2;

// Step geometry shared by every flight (matches the main stair shaft feel).
const STEP_H = 0.35;
const STEP_RUN = 0.62;
const STEPS_PER_FLIGHT = 5;

// Per-floor shell walls (y0 = walk height of the floor they belong to).
// Door gaps: Kelas door x 29..30.4, ekskul door x 36.6..38 (z=-13.6 wall);
// corridor west end (x 24, z -16..-13.6) stays open as the entrance.
const FLOOR_SHELL: Seg[] = [
  // west wall (Kelas only — corridor entrance stays open)
  { x: 24, z: -7.8, w: 0.3, d: 11.6 },
  // east facade
  { x: 44, z: -9, w: 0.3, d: 14.3 },
  // south facade
  { x: 34, z: -2, w: 20.6, d: 0.3 },
  // corridor/rooms wall — Kelas door gap x 29..30.4
  { x: 26.5, z: -13.6, w: 5, d: 0.25 },
  { x: 33.2, z: -13.6, w: 5.6, d: 0.25 },
  // ekskul north wall — door gap x 36.6..38
  { x: 36.3, z: -13.6, w: 0.6, d: 0.25 },
  { x: 41, z: -13.6, w: 6, d: 0.25 },
  // room divider x=36
  { x: 36, z: -7.8, w: 0.25, d: 11.6 },
];

// Lintels above the door gaps (visual only, elevated per level in FloorLevel).
const LINTELS: Seg[] = [
  { x: 29.7, z: -13.6, w: 1.4, d: 0.25, h: 0.7, y0: 2.5 },
  { x: 37.3, z: -13.6, w: 1.4, d: 0.25, h: 0.7, y0: 2.5 },
];

// Second/third-floor shell = same segments elevated (y0 per level).
function shellAt(y0: number): Seg[] {
  return FLOOR_SHELL.map((s) => ({ ...s, y0: s.y0 ? s.y0 + y0 : y0 }));
}

// ---------------------------------------------------------------------------
// Furniture helpers (y0-aware, local to this building)
// ---------------------------------------------------------------------------
function Desk({ x, z, y0 = 0, rot = 0 }: { x: number; z: number; y0?: number; rot?: number }) {
  return (
    <group position={[x, y0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[0.72, 0.05, 0.55]} />
        <Pbr name="wood" repeat={[1, 1]} color="#e6bd92" roughness={0.7} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[0.6, 0.62, 0.42]} />
        <meshStandardMaterial color="#8f9aa4" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.78, 0.32]}>
        <boxGeometry args={[0.72, 0.04, 0.06]} />
        <meshStandardMaterial color="#3d4650" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Chair({ x, z, y0 = 0, rot = 0 }: { x: number; z: number; y0?: number; rot?: number }) {
  return (
    <group position={[x, y0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.44, 0]} castShadow>
        <boxGeometry args={[0.42, 0.05, 0.42]} />
        <Pbr name="wood" repeat={[1, 1]} color="#e0aa75" roughness={0.75} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.72, -0.19]}>
        <boxGeometry args={[0.42, 0.5, 0.05]} />
        <Pbr name="wood" repeat={[1, 1]} color="#e0aa75" roughness={0.75} envMapIntensity={0.35} />
      </mesh>
      {[
        [-0.17, -0.17],
        [0.17, -0.17],
        [-0.17, 0.17],
        [0.17, 0.17],
      ].map(([ox, oz], i) => (
        <mesh key={i} position={[ox, 0.22, oz]}>
          <cylinderGeometry args={[0.02, 0.02, 0.44, 6]} />
          <meshStandardMaterial color="#3d4650" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function LightPanel({ x, z, y }: { x: number; z: number; y: number }) {
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[1.4, 0.06, 0.5]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff6dd" emissiveIntensity={1.4} />
      </mesh>
      <pointLight position={[0, -0.25, 0]} intensity={3.2} distance={8.5} color="#fff2d8" />
    </group>
  );
}

function Railing({ x, z, w, d, y0, h = 1.1 }: { x: number; z: number; w: number; d: number; y0: number; h?: number }) {
  return (
    <group>
      <mesh position={[x, y0 + h / 2, z]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="#54595f" roughness={0.6} metalness={0.35} />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[w / 2, h / 2, d / 2]} position={[x, y0 + h / 2, z]} />
      </RigidBody>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Stair core: 4 flights of walkable steps + tilted handrails
// Lane geometry (corridor strip z -16..-13.6, 2.4 wide):
//   lane N z -15.8..-14.8 (steps 1.0 deep) | lane S z -14.75..-13.75
//   divider rail z -14.775 | north parapet z -16..-15.9 (no step overlap)
// ---------------------------------------------------------------------------
function Flight({ x0, z, dir, y0 }: { x0: number; z: number; dir: 1 | -1; y0: number }) {
  const steps = [];
  for (let i = 0; i < STEPS_PER_FLIGHT; i++) {
    steps.push({
      x: x0 + dir * (i * STEP_RUN + STEP_RUN / 2),
      y: y0 + i * STEP_H + STEP_H / 2,
    });
  }
  const railLen = Math.hypot(STEPS_PER_FLIGHT * STEP_RUN, STEPS_PER_FLIGHT * STEP_H);
  const railAngle = Math.atan2(STEPS_PER_FLIGHT * STEP_H, STEPS_PER_FLIGHT * STEP_RUN) * dir;
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        {steps.map((s, i) => (
          <group key={i}>
            <mesh position={[s.x, s.y, z]} castShadow receiveShadow>
              <boxGeometry args={[STEP_RUN, STEP_H, 1]} />
              <Pbr name="concrete" repeat={[1, 1]} color="#d4ccbb" roughness={0.9} />
            </mesh>
            <CuboidCollider args={[STEP_RUN / 2, STEP_H / 2, 0.5]} position={[s.x, s.y, z]} />
          </group>
        ))}
      </RigidBody>
      {/* handrail between the lanes (divider side) */}
      <mesh
        position={[x0 + dir * (STEPS_PER_FLIGHT * STEP_RUN) / 2, y0 + (STEPS_PER_FLIGHT * STEP_H) / 2 + 1.0, -14.775]}
        rotation={[0, 0, railAngle]}
        castShadow
      >
        <boxGeometry args={[railLen, 0.07, 0.07]} />
        <meshStandardMaterial color="#54595f" roughness={0.55} metalness={0.4} />
      </mesh>
    </group>
  );
}

function StairCore() {
  return (
    <group>
      {/* flights: A ground->mid (east), B mid->L2 (west), C L2->mid, D mid->L3 */}
      <Flight x0={38.6} z={-15.3} dir={1} y0={0} />
      <Flight x0={41.7} z={-14.25} dir={-1} y0={1.75} />
      <Flight x0={38.6} z={-15.3} dir={1} y0={3.5} />
      <Flight x0={41.7} z={-14.25} dir={-1} y0={5.25} />
      {/* east mid-landings (turn platforms between flights) */}
      {[1.75, 5.25].map((top, i) => (
        <group key={i}>
          <mesh position={[42.85, top - SLAB / 2, -14.8]} receiveShadow castShadow>
            <boxGeometry args={[2.3, SLAB, 2.4]} />
            <Pbr name="concrete" repeat={[1, 1]} color="#d4ccbb" roughness={0.9} />
          </mesh>
          <CuboidCollider args={[1.15, SLAB / 2, 1.2]} position={[42.85, top - SLAB / 2, -14.8]} />
        </group>
      ))}
      {/* NOTE: no guard rail on the landing's east edge — flight B/D arrive
          there at landing height (legit descent path); the north edge is
          guarded by the parapet below */}
      {/* tall parapet along the stair-core north edge (clear of the 1.0-deep
          steps): covers full flight height + mid-landings so the player
          cannot step off the north side mid-flight */}
      <Railing x={40} z={-15.95} w={8} d={0.1} y0={0} h={1.9} />
      <Railing x={40} z={-15.95} w={8} d={0.1} y0={3.5} h={1.9} />
      <Railing x={40} z={-15.95} w={8} d={0.1} y0={7} h={1.9} />
      <Railing x={42.85} z={-15.95} w={2.3} d={0.1} y0={1.75} h={1.9} />
      <Railing x={42.85} z={-15.95} w={2.3} d={0.1} y0={5.25} h={1.9} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Floor build-out: shell + slabs + corridor dressing + room interiors
// ---------------------------------------------------------------------------
function Classroom({ y0 }: { y0: number }) {
  // Room 1: x 24..36, z -13.6..-2 — blackboard on the south wall, desks face it
  const rows = [-5.2, -7.4, -9.6];
  const cols = [26.5, 29, 31.5, 34];
  return (
    <group>
      {/* floor finish */}
      <mesh position={[30, y0 + 0.03, -7.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.5, 11]} />
        <Pbr name="tile" repeat={[4, 4]} color={y0 === 0 ? '#ded4bc' : '#d8d0be'} roughness={0.6} envMapIntensity={0.4} />
      </mesh>
      {/* blackboard + ledge (south wall interior) */}
      <mesh position={[30, y0 + 1.55, -2.2]}>
        <boxGeometry args={[4.6, 1.3, 0.1]} />
        <meshStandardMaterial color="#22402f" roughness={0.65} />
      </mesh>
      <mesh position={[30, y0 + 0.82, -2.2]}>
        <boxGeometry args={[4.6, 0.08, 0.16]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.8} />
      </mesh>
      {/* teacher desk + chair */}
      <Desk x={26} z={-3.4} y0={y0} rot={0.25} />
      <Chair x={26.9} z={-4.3} y0={y0} rot={2.6} />
      {/* student desks facing the board (south) */}
      {rows.map((z) =>
        cols.map((x) => (
          <group key={`${x}-${z}`}>
            <Desk x={x} z={z} y0={y0} rot={Math.PI} />
            <Chair x={x} z={z - 0.85} y0={y0} rot={0} />
          </group>
        )),
      )}
      {/* clock on the corridor wall (room side) */}
      <mesh position={[30, y0 + 2.75, -13.44]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.07, 20]} />
        <meshStandardMaterial color="#f4f4f2" roughness={0.5} />
      </mesh>
      <LightPanel x={30} z={-5.5} y={y0 + 3.05} />
      <LightPanel x={30} z={-10} y={y0 + 3.05} />
      {/* furniture colliders */}
      <RigidBody type="fixed" colliders={false}>
        {rows.map((z) => (
          <CuboidCollider key={z} args={[4.6, 0.4, 0.45]} position={[30.25, y0 + 0.4, z]} />
        ))}
        <CuboidCollider args={[0.5, 0.4, 0.9]} position={[26, y0 + 0.4, -3.4]} />
      </RigidBody>
    </group>
  );
}

function StudyRoom({ y0, label }: { y0: number; label: 'osis' | 'uks' | 'loker' }) {
  // Room 2: x 36..44, z -13.6..-2 — long table, cabinets, shelves
  return (
    <group>
      <mesh position={[40, y0 + 0.03, -7.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.5, 11]} />
        <Pbr name="wood" repeat={[3, 4]} color="#d8cbb4" roughness={0.8} envMapIntensity={0.35} />
      </mesh>
      {/* long table + chairs */}
      <mesh position={[40, y0 + 0.36, -7.5]} castShadow>
        <boxGeometry args={[2.8, 0.72, 0.8]} />
        <meshStandardMaterial color="#7d8590" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[40, y0 + 0.76, -7.5]} castShadow>
        <boxGeometry args={[3.2, 0.06, 1.2]} />
        <Pbr name="wood" repeat={[3, 1]} color="#e0aa75" roughness={0.7} envMapIntensity={0.35} />
      </mesh>
      {[-8.9, -7.5, -6.1].map((z, i) => (
        <group key={i}>
          <Chair x={38.9} z={z} y0={y0} rot={Math.PI / 2} />
          <Chair x={41.1} z={z} y0={y0} rot={-Math.PI / 2} />
        </group>
      ))}
      {/* cabinets along the east wall */}
      <mesh position={[43.3, y0 + 0.95, -8]} castShadow>
        <boxGeometry args={[0.8, 1.9, 4.4]} />
        <meshStandardMaterial color="#8d8578" roughness={0.8} />
      </mesh>
      {/* shelves with books along the south wall */}
      <mesh position={[40, y0 + 1, -2.45]} castShadow>
        <boxGeometry args={[3.4, 2, 0.55]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.85} />
      </mesh>
      {[0.55, 1.05, 1.55].map((dy, i) => (
        <mesh key={i} position={[40, y0 + dy, -2.42]}>
          <boxGeometry args={[3.1, 0.24, 0.4]} />
          <meshStandardMaterial color={['#a8524a', '#4a6a8a', '#6a8a4a'][i]} roughness={0.8} />
        </mesh>
      ))}
      {/* label-specific dressing */}
      {label === 'osis' && (
        <mesh position={[37, y0 + 1.7, -12.9]}>
          <boxGeometry args={[2.2, 1.1, 0.08]} />
          <meshStandardMaterial color="#6b4f2e" roughness={0.8} />
        </mesh>
      )}
      {label === 'uks' && (
        <>
          <mesh position={[37.5, y0 + 0.4, -11.5]} castShadow>
            <boxGeometry args={[1.9, 0.55, 0.8]} />
            <meshStandardMaterial color="#e8e4da" roughness={0.7} />
          </mesh>
          <mesh position={[37.5, y0 + 0.75, -11.9]} castShadow>
            <boxGeometry args={[1.9, 0.16, 0.7]} />
            <meshStandardMaterial color="#d8dcE2" roughness={0.85} />
          </mesh>
        </>
      )}
      {label === 'loker' &&
        [-11.4, -10.2].map((z, i) => (
          <mesh key={i} position={[37.4, y0 + 0.95, z]} castShadow>
            <boxGeometry args={[1.6, 1.9, 0.9]} />
            <meshStandardMaterial color={i ? '#5f83a8' : '#6d90b3'} roughness={0.55} metalness={0.35} />
          </mesh>
        ))}
      <LightPanel x={40} z={-7.5} y={y0 + 3.05} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.7, 0.42, 0.7]} position={[40, y0 + 0.42, -7.5]} />
        <CuboidCollider args={[0.45, 0.95, 2.2]} position={[43.3, y0 + 0.95, -8]} />
        <CuboidCollider args={[1.7, 1, 0.3]} position={[40, y0 + 1, -2.45]} />
      </RigidBody>
    </group>
  );
}

const CORRIDOR_LOCKERS = [25.5, 27.3, 31.5, 33.3];

function FloorLevel({ y0 }: { y0: number }) {
  const label = y0 === 0 ? 'osis' : y0 === 3.5 ? 'uks' : 'loker';
  const floorNo = y0 === 0 ? 1 : y0 === 3.5 ? 2 : 3;
  const kelasName = y0 === 0 ? 'KELAS 10-A' : y0 === 3.5 ? 'KELAS 12-A' : 'KELAS 12-B';
  const ekskulName = y0 === 0 ? 'RUANG OSIS' : y0 === 3.5 ? 'RUANG UKS' : 'RUANG LOKER';
  const top = y0 + 3.5;
  return (
    <group>
      {/* shell walls (elevated for L2/L3) */}
      <WallMeshes segs={shellAt(y0)} color={WALL_CREAM} />
      <WallColliders segs={shellAt(y0)} defaultH={WALL_H} />
      {/* door lintels — every level, elevated with the floor */}
      <WallMeshes segs={LINTELS.map((s) => ({ ...s, y0: y0 + (s.y0 ?? 0) }))} color={WALL_CREAM} />
      {/* v0.8.0: room doors swung open into the rooms (kelas hinges west, ekskul
          hinges east so the leaf clears the OSIS board on L1) */}
      <Door x={29.7} z={-13.6} y0={y0} w={1.4} open={1} hinge={-1} />
      <Door x={37.3} z={-13.6} y0={y0} w={1.4} open={1} hinge={1} />
      {/* slab over this floor = floor of the next (corridor x 24..38.6 + rooms) */}
      {y0 < 7 && (
        <group>
          <mesh position={[31.3, top - SLAB / 2, -14.8]} receiveShadow castShadow>
            <boxGeometry args={[14.6, SLAB, 2.4]} />
            <Pbr name="concrete" repeat={[5, 1]} color="#cfc8b8" roughness={0.9} />
          </mesh>
          <mesh position={[34, top - SLAB / 2, -7.8]} receiveShadow castShadow>
            <boxGeometry args={[20, SLAB, 11.6]} />
            <Pbr name="concrete" repeat={[8, 4]} color="#cfc8b8" roughness={0.9} />
          </mesh>
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[7.3, SLAB / 2, 1.2]} position={[31.3, top - SLAB / 2, -14.8]} />
            <CuboidCollider args={[10, SLAB / 2, 5.8]} position={[34, top - SLAB / 2, -7.8]} />
          </RigidBody>
        </group>
      )}
      {/* corridor railings (north edge every level; west end on upper levels).
          The stair-core section uses a taller parapet (see StairCore) — here
          only the calm corridor span x 24..36. */}
      <Railing x={30} z={-15.9} w={12} d={0.08} y0={y0} />
      {y0 > 0 && <Railing x={24.1} z={-14.8} w={0.08} d={2.4} y0={y0} />}
      {/* corridor lockers + planter */}
      <group>
        {CORRIDOR_LOCKERS.map((x, i) => (
          <group key={i} position={[x, y0, -13.42]}>
            <mesh position={[0, 0.95, 0]} castShadow>
              <boxGeometry args={[1.6, 1.9, 0.4]} />
              <meshStandardMaterial color={i % 2 ? '#5f83a8' : '#6d90b3'} roughness={0.55} metalness={0.35} />
            </mesh>
          </group>
        ))}
        <mesh position={[25, y0 + 0.3, -15.2]} castShadow>
          <cylinderGeometry args={[0.26, 0.32, 0.6, 12]} />
          <meshStandardMaterial color="#9c5f4a" roughness={0.9} />
        </mesh>
        <mesh position={[25, y0 + 0.95, -15.2]} castShadow>
          <sphereGeometry args={[0.5, 12, 10]} />
          <meshStandardMaterial color="#3f6f3f" roughness={0.95} />
        </mesh>
        <RigidBody type="fixed" colliders={false}>
          {CORRIDOR_LOCKERS.map((x, i) => (
            <CuboidCollider key={i} args={[0.8, 0.95, 0.2]} position={[x, y0 + 0.95, -13.42]} />
          ))}
        </RigidBody>
      </group>
      {/* room interiors */}
      <Classroom y0={y0} />
      <StudyRoom y0={y0} label={label} />
      {/* signs (corridor side, face north) */}
      <SchoolSign position={[41, y0 + 2.55, -13.74]} text={`LANTAI ${floorNo}`} size={0.3} color="#dfe7f0" rotY={Math.PI} />
      <SchoolSign position={[29.7, y0 + 2.55, -13.74]} text={kelasName} size={0.26} color="#9fc2e8" rotY={Math.PI} />
      <SchoolSign position={[37.3, y0 + 2.55, -13.74]} text={ekskulName} size={0.22} color="#9fc2e8" rotY={Math.PI} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export function GedungB() {
  return (
    <group>
      {LEVELS.map((y0) => (
        <FloorLevel key={y0} y0={y0} />
      ))}
      <StairCore />
      {/* blue trim bands between floors */}
      {[3.35, 6.85].map((y, i) => (
        <group key={i}>
          <mesh position={[34, y, -2]}>
            <boxGeometry args={[20.7, 0.22, 0.36]} />
            <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
          </mesh>
          <mesh position={[44, y, -9]}>
            <boxGeometry args={[0.36, 0.22, 14.6]} />
            <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
          </mesh>
          <mesh position={[24, y, -7.8]}>
            <boxGeometry args={[0.36, 0.22, 11.9]} />
            <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
          </mesh>
        </group>
      ))}
      {/* ground-floor windows on the south facade (upper floors get their own) */}
      {LEVELS.map((y0) =>
        [26.5, 30, 33.5, 38.5, 42].map((x, i) => (
          <group key={`w-${y0}-${i}`} position={[x, y0 + 1.7, -1.79]}>
            <mesh>
              <boxGeometry args={[1.9, 1.7, 0.14]} />
              <meshStandardMaterial color="#9fb6c4" roughness={0.18} metalness={0.5} emissive="#274a5c" emissiveIntensity={0.12} />
            </mesh>
            <mesh position={[0, 0.95, 0.01]}>
              <boxGeometry args={[2.1, 0.14, 0.16]} />
              <meshStandardMaterial color={TRIM_BLUE} roughness={0.6} />
            </mesh>
          </group>
        )),
      )}
      {/* roof slab + cap */}
      <mesh position={[34, 10.35, -9]} receiveShadow castShadow>
        <boxGeometry args={[21, 0.3, 15]} />
        <Pbr name="roof" repeat={[8, 6]} roughness={0.9} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[34, 10.56, -9]}>
        <boxGeometry args={[21.2, 0.12, 15.2]} />
        <Pbr name="roof" repeat={[8, 6]} color="#9aa2ab" roughness={0.95} envMapIntensity={0.3} />
      </mesh>
      {/* facade sign (faces the rear yard, south) */}
      <SchoolSign position={[34, 4.15, -1.8]} text="GEDUNG B" size={0.42} color="#dfe7f0" />
    </group>
  );
}
