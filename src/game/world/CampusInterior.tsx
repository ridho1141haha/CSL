import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { SchoolSign } from './props';
import { Pbr } from './pbr';

// Interiors of the main building (hall, corridor, classroom, teacher room)
// and the canteen. Floors/ceilings/light fixtures are visual; furniture gets
// low colliders so the player can walk between desks but not through them.

function Desk({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
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

function Chair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
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

function LightPanel({ x, z, y = 3.12 }: { x: number; z: number; y?: number }) {
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

function Classroom() {
  // room x -16..-2, z 4..14; blackboard on west wall
  const desks: [number, number][] = [];
  for (const z of [6.3, 8.8, 11.3]) for (const x of [-13.2, -10.4, -7.6, -4.8]) desks.push([x, z]);
  return (
    <group>
      {/* floor + ceiling */}
      <mesh position={[-9, 0.03, 9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[13.8, 9.8]} />
        <Pbr name="tile" repeat={[5, 4]} color="#ded4bc" roughness={0.6} envMapIntensity={0.4} />
      </mesh>
      <mesh position={[-9, 3.26, 9]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13.8, 9.8]} />
        <meshStandardMaterial color="#f2efe6" roughness={0.95} />
      </mesh>
      <LightPanel x={-9} z={7.2} />
      <LightPanel x={-9} z={11} />
      {/* blackboard */}
      <mesh position={[-15.72, 1.55, 9]}>
        <boxGeometry args={[0.1, 1.3, 4.6]} />
        <meshStandardMaterial color="#22402f" roughness={0.65} />
      </mesh>
      <mesh position={[-15.66, 0.82, 9]}>
        <boxGeometry args={[0.16, 0.08, 4.6]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.8} />
      </mesh>
      {/* teacher desk + chair */}
      <Desk x={-13.6} z={12.4} rot={Math.PI / 2} />
      <Chair x={-12.5} z={12.4} rot={-Math.PI / 2} />
      {/* student desks facing the board (+x direction) */}
      {desks.map(([x, z], i) => (
        <group key={i}>
          <Desk x={x} z={z} rot={Math.PI / 2} />
          <Chair x={x + 0.85} z={z} rot={-Math.PI / 2} />
        </group>
      ))}
      {/* clock */}
      <mesh position={[-9, 2.75, 4.3]}>
        <cylinderGeometry args={[0.28, 0.28, 0.08, 20]} />
        <meshStandardMaterial color="#f4f4f2" roughness={0.5} />
      </mesh>
      {/* colliders: desks in two blocks, teacher desk */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[4.9, 0.4, 0.45]} position={[-11.8, 0.4, 6.3]} />
        <CuboidCollider args={[4.9, 0.4, 0.45]} position={[-11.8, 0.4, 8.8]} />
        <CuboidCollider args={[4.9, 0.4, 0.45]} position={[-11.8, 0.4, 11.3]} />
        <CuboidCollider args={[0.5, 0.4, 0.9]} position={[-13.6, 0.4, 12.4]} />
      </RigidBody>
    </group>
  );
}

function TeacherRoom() {
  // room x 2..16, z 4..14
  return (
    <group>
      <mesh position={[9, 0.03, 9]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[13.8, 9.8]} />
        <Pbr name="wood" repeat={[6, 4]} color="#d8cbb4" roughness={0.8} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[9, 3.26, 9]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13.8, 9.8]} />
        <meshStandardMaterial color="#f2efe6" roughness={0.95} />
      </mesh>
      <LightPanel x={9} z={7} />
      <LightPanel x={9} z={11} />
      {/* meeting table + chairs */}
      <mesh position={[9, 0.74, 9]} castShadow>
        <boxGeometry args={[3.4, 0.06, 1.4]} />
        <Pbr name="wood" repeat={[3, 1]} color="#e0aa75" roughness={0.7} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[9, 0.38, 9]}>
        <boxGeometry args={[3, 0.7, 1]} />
        <meshStandardMaterial color="#7d8590" roughness={0.7} metalness={0.2} />
      </mesh>
      {[[-1.9, 0], [1.9, 0], [0, -1], [0, 1]].map(([ox, oz], i) => (
        <Chair key={i} x={9 + ox} z={9 + oz} rot={i < 2 ? (ox < 0 ? Math.PI / 2 : -Math.PI / 2) : oz < 0 ? Math.PI : 0} />
      ))}
      {/* cabinets along east wall */}
      <mesh position={[15.4, 0.95, 7]} castShadow>
        <boxGeometry args={[0.8, 1.9, 4.4]} />
        <meshStandardMaterial color="#8d8578" roughness={0.8} />
      </mesh>
      {/* desk */}
      <Desk x={5} z={6} rot={0.4} />
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.75, 0.42, 0.75]} position={[9, 0.42, 9]} />
        <CuboidCollider args={[0.45, 0.95, 2.2]} position={[15.4, 0.95, 7]} />
        <CuboidCollider args={[0.5, 0.4, 0.6]} position={[5, 0.4, 6]} />
      </RigidBody>
    </group>
  );
}

function HallAndCorridor() {
  // hall z 21..28 x -16..16, corridor z 14..21
  const lockers: [number, number][] = [
    [-12, 21.45],
    [-7, 21.45],
    [7, 21.45],
    [12, 21.45],
  ];
  return (
    <group>
      {/* floors */}
      <mesh position={[0, 0.03, 24.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[31.8, 6.8]} />
        <Pbr name="terrazzo" repeat={[8, 2]} envMapIntensity={0.45} />
      </mesh>
      <mesh position={[0, 0.03, 17.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[31.8, 6.9]} />
        <Pbr name="terrazzo" repeat={[8, 2]} color="#d8d2c4" envMapIntensity={0.45} />
      </mesh>
      {/* ceilings */}
      <mesh position={[0, 3.26, 24.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[31.8, 6.8]} />
        <meshStandardMaterial color="#f2efe6" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.26, 17.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[31.8, 6.9]} />
        <meshStandardMaterial color="#f2efe6" roughness={0.95} />
      </mesh>
      <LightPanel x={-8} z={24.5} />
      <LightPanel x={0} z={24.5} />
      <LightPanel x={8} z={24.5} />
      <LightPanel x={-8} z={17.5} />
      <LightPanel x={8} z={17.5} />
      {/* lockers */}
      {lockers.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.95, 0]} castShadow>
            <boxGeometry args={[2.4, 1.9, 0.5]} />
            <meshStandardMaterial color={i % 2 ? '#5f83a8' : '#6d90b3'} roughness={0.55} metalness={0.35} />
          </mesh>
          {[[-0.6], [0.6]].map(([ox], j) => (
            <mesh key={j} position={[ox, 0.95, 0.26]}>
              <boxGeometry args={[0.03, 1.4, 0.04]} />
              <meshStandardMaterial color="#31404f" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      {/* bulletin board (hall) */}
      <mesh position={[0, 1.7, 27.7]}>
        <boxGeometry args={[3.2, 1.2, 0.08]} />
        <meshStandardMaterial color="#6b4f2e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.7, 27.74]}>
        <planeGeometry args={[2.9, 0.95]} />
        <meshStandardMaterial color="#e9e2ce" roughness={0.95} />
      </mesh>
      {/* benches */}
      <mesh position={[-5, 0.45, 26.6]} castShadow>
        <boxGeometry args={[2.6, 0.06, 0.5]} />
        <Pbr name="wood" repeat={[2, 1]} roughness={0.8} envMapIntensity={0.35} />
      </mesh>
      <mesh position={[5, 0.45, 26.6]} castShadow>
        <boxGeometry args={[2.6, 0.06, 0.5]} />
        <Pbr name="wood" repeat={[2, 1]} roughness={0.8} envMapIntensity={0.35} />
      </mesh>
      {/* plants */}
      {[[-14.6, 26.8], [14.6, 26.8]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.36, 0.6, 12]} />
            <meshStandardMaterial color="#9c5f4a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.95, 0]} castShadow>
            <sphereGeometry args={[0.55, 12, 10]} />
            <meshStandardMaterial color="#3f6f3f" roughness={0.95} />
          </mesh>
        </group>
      ))}
      <RigidBody type="fixed" colliders={false}>
        {lockers.map(([x, z], i) => (
          <CuboidCollider key={i} args={[1.2, 0.95, 0.25]} position={[x, 0.95, z]} />
        ))}
        <CuboidCollider args={[1.3, 0.25, 0.25]} position={[-5, 0.25, 26.6]} />
        <CuboidCollider args={[1.3, 0.25, 0.25]} position={[5, 0.25, 26.6]} />
      </RigidBody>
    </group>
  );
}

function CanteenInterior() {
  // x 22..34, z 2..14; counter along east wall, tables
  const tables: [number, number][] = [
    [25.5, 5],
    [25.5, 9],
    [29.5, 7],
  ];
  return (
    <group>
      <mesh position={[28, 0.03, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11.8, 11.8]} />
        <Pbr name="tile" repeat={[5, 5]} color="#e2dccd" roughness={0.65} envMapIntensity={0.4} />
      </mesh>
      <mesh position={[28, 3.06, 8]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11.8, 11.8]} />
        <meshStandardMaterial color="#efe9db" roughness={0.95} />
      </mesh>
      <LightPanel x={28} z={5} y={3.0} />
      <LightPanel x={28} z={11} y={3.0} />
      {/* serving counter */}
      <mesh position={[32.4, 0.5, 8]} castShadow>
        <boxGeometry args={[2, 1, 5.4]} />
        <meshStandardMaterial color="#8d8578" roughness={0.8} />
      </mesh>
      <mesh position={[32.4, 1.05, 8]}>
        <boxGeometry args={[2.15, 0.07, 5.55]} />
        <meshStandardMaterial color="#b9bec4" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* display case */}
      <mesh position={[32.4, 1.7, 8]}>
        <boxGeometry args={[1.9, 0.9, 5.2]} />
        <meshStandardMaterial color="#aebfcb" roughness={0.12} metalness={0.55} transparent opacity={0.45} />
      </mesh>
      {/* warm food trays on the counter */}
      {[6.4, 8, 9.6].map((z, i) => (
        <mesh key={i} position={[32.3, 1.12, z]}>
          <boxGeometry args={[1.3, 0.1, 0.9]} />
          <meshStandardMaterial color={['#b45309', '#92400e', '#a16207'][i]} roughness={0.6} />
        </mesh>
      ))}
      {/* menu board */}
      <mesh position={[33.7, 2.2, 8]}>
        <boxGeometry args={[0.08, 1.1, 3.4]} />
        <meshStandardMaterial color="#26405e" roughness={0.7} />
      </mesh>
      <SchoolSign position={[33.6, 2.2, 8]} text="ROTII · TEH · MI" size={0.2} color="#d8e4f0" />
      {/* tables + stools */}
      {tables.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.74, 0]} castShadow>
            <cylinderGeometry args={[0.62, 0.62, 0.05, 16]} />
            <meshStandardMaterial color="#e8e2d2" roughness={0.55} />
          </mesh>
          <mesh position={[0, 0.37, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 0.74, 10]} />
            <meshStandardMaterial color="#5d646b" roughness={0.6} metalness={0.4} />
          </mesh>
          {[[0.85, 0], [-0.85, 0], [0, 0.85], [0, -0.85]].map(([ox, oz], j) => (
            <group key={j} position={[ox, 0, oz]}>
              <mesh position={[0, 0.44, 0]} castShadow>
                <cylinderGeometry args={[0.19, 0.19, 0.05, 12]} />
                <meshStandardMaterial color="#c2543a" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.22, 0]}>
                <cylinderGeometry args={[0.04, 0.06, 0.44, 8]} />
                <meshStandardMaterial color="#5d646b" roughness={0.6} metalness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1, 0.55, 2.7]} position={[32.4, 0.55, 8]} />
        {tables.map(([x, z], i) => (
          <CuboidCollider key={i} args={[1, 0.4, 1]} position={[x, 0.4, z]} />
        ))}
      </RigidBody>
    </group>
  );
}

export function CampusInterior() {
  return (
    <group>
      <HallAndCorridor />
      <Classroom />
      <TeacherRoom />
      <CanteenInterior />
    </group>
  );
}
