import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { WallMeshes, WallColliders, SchoolSign } from './props';
import { Pbr } from './pbr';

// Warehouse interior scene (Bab IV — jalur bad). Local coordinates: player
// enters from the south door (z ~12) and the duel happens in the open middle
// floor between container stacks. Dim hangar lighting + skylight shafts.

const FLOOR = '#5d6066';
const WALL_C = '#68707a';

function HangLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 4.6, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial color="#2c3036" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.15, 0]} castShadow>
        <coneGeometry args={[0.42, 0.35, 14, 1, true]} />
        <meshStandardMaterial color="#3a4046" roughness={0.6} metalness={0.5} side={2} />
      </mesh>
      <mesh position={[0, 3.98, 0]}>
        <sphereGeometry args={[0.13, 10, 10]} />
        <meshStandardMaterial color="#ffe9b0" emissive="#ffd27a" emissiveIntensity={2.2} />
      </mesh>
      <pointLight position={[0, 3.8, 0]} intensity={22} distance={16} decay={1.6} color="#ffcf8a" />
    </group>
  );
}

function ContainerStack({ x, z, rot = 0, c1, c2 }: { x: number; z: number; rot?: number; c1: string; c2: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {/* corrugated PBR carries the ribbing via its normal map */}
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.1, 2.6, 2.45]} />
        <Pbr name="corrugated" repeat={[4, 1]} color={c1} roughness={0.78} metalness={0.3} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0.15, 3.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.1, 2.6, 2.45]} />
        <Pbr name="corrugated" repeat={[4, 1]} color={c2} roughness={0.85} metalness={0.25} envMapIntensity={0.45} />
      </mesh>
    </group>
  );
}

export function WarehouseWorld() {
  const W = 30; // x extent
  const D = 24; // z extent
  const H = 5.4;
  const th = 0.4;
  const walls = [
    { x: 0, z: -D / 2, w: W, d: th, h: H, color: WALL_C },
    { x: -W / 2, z: 0, w: th, d: D, h: H, color: WALL_C },
    { x: W / 2, z: 0, w: th, d: D, h: H, color: WALL_C },
    // south wall with the entry gap x -1.5..1.5
    { x: -8.25, z: D / 2, w: 13.5, d: th, h: H, color: WALL_C },
    { x: 8.25, z: D / 2, w: 13.5, d: th, h: H, color: WALL_C },
    { x: -2.1, z: D / 2, w: 1.2, d: th, h: H, color: WALL_C },
    { x: 2.1, z: D / 2, w: 1.2, d: th, h: H, color: WALL_C },
  ];
  return (
    <group>
      {/* floor */}
      <RigidBody type="fixed" colliders={false} friction={0.9}>
        <CuboidCollider args={[W / 2, 0.25, D / 2]} position={[0, -0.25, 0]} />
      </RigidBody>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <Pbr name="concrete" repeat={[8, 6]} color="#8b8e94" roughness={0.97} envMapIntensity={0.25} />
      </mesh>
      {/* oil stains */}
      {[
        [-4, 1, 3.4, 1.8],
        [6, -6, 2.4, 2.6],
        [0, 6, 1.8, 1.2],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#3a3d42" roughness={0.4} metalness={0.15} />
        </mesh>
      ))}
      {/* walls */}
      <WallMeshes segs={walls} pbr="corrugated" color="#8d99a5" rough={0.85} />
      <WallColliders segs={walls} defaultH={H} />
      {/* roof with skylight strips */}
      <mesh position={[-8, H + 0.14, 0]} receiveShadow>
        <boxGeometry args={[W - 9, 0.28, D - 1]} />
        <Pbr name="corrugated" repeat={[6, 1]} color="#6e7880" roughness={0.95} envMapIntensity={0.2} />
      </mesh>
      <mesh position={[8, H + 0.14, 0]} receiveShadow>
        <boxGeometry args={[W - 9, 0.28, D - 1]} />
        <Pbr name="corrugated" repeat={[6, 1]} color="#6e7880" roughness={0.95} envMapIntensity={0.2} />
      </mesh>
      {[-6, 0, 6].map((z, i) => (
        <mesh key={i} position={[0, H + 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[7, 2.2]} />
          <meshStandardMaterial color="#cfe2ee" emissive="#b8d4e6" emissiveIntensity={0.75} roughness={0.4} />
        </mesh>
      ))}
      {/* skylight light shafts */}
      <spotLight position={[0, H, 0]} angle={0.62} penumbra={0.7} intensity={38} distance={18} color="#bcd6e8" target-position={[0, 0, 0]} />
      {/* steel entry door (open) + frame */}
      <mesh position={[1.35, 1.35, 11.85]} rotation={[0, -0.55, 0]} castShadow>
        <boxGeometry args={[1.5, 2.7, 0.1]} />
        <meshStandardMaterial color="#4a545e" roughness={0.55} metalness={0.45} />
      </mesh>
      <SchoolSign position={[0, 3, 11.7]} text="KELUAR" size={0.24} color="#9fc06a" rotY={Math.PI} />
      {/* container stacks framing the arena */}
      <ContainerStack x={-8.5} z={-5.5} rot={0.12} c1="#7f3b2a" c2="#4c6a52" />
      <ContainerStack x={8.5} z={-5.5} rot={-0.1} c1="#31547a" c2="#7f3b2a" />
      <ContainerStack x={-9.5} z={5.5} rot={-0.06} c1="#4c6a52" c2="#31547a" />
      {/* crate clusters (cover) */}
      {[
        [-2.8, -3.5, 0.3],
        [-3.6, -2.4, -0.2],
        [-2.4, -1.6, 0.1],
        [4.2, -2.8, -0.4],
        [5.4, -2, 0.2],
        [-5, 6.5, 0.5],
        [6.8, 6, -0.3],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.55, z]} rotation={[0, r, 0]} castShadow>
          <boxGeometry args={[1.15, 1.1, 1.15]} />
          <Pbr name="wood" repeat={[1, 1]} color={i % 2 ? '#d9c3a3' : '#c8b190'} roughness={0.95} envMapIntensity={0.3} />
        </mesh>
      ))}
      {/* shelving racks along the west wall */}
      {[-8, -3, 2].map((z, i) => (
        <group key={i} position={[-13.2, 0, z]}>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1.4, 2, 4]} />
            <meshStandardMaterial color="#545c64" roughness={0.7} metalness={0.35} />
          </mesh>
          {[1.4, 2.1].map((y, j) => (
            <mesh key={j} position={[0, y, 0]}>
              <boxGeometry args={[1.5, 0.08, 4.1]} />
              <meshStandardMaterial color="#6a737b" roughness={0.65} metalness={0.4} />
            </mesh>
          ))}
          {[[-0.3, 1.6], [0.35, 2.3]].map(([oy, oz], j) => (
            <mesh key={`b${j}`} position={[0, oy, oz]} castShadow>
              <boxGeometry args={[1.1, 0.5, 0.7]} />
              <Pbr name={j ? 'wood' : 'metal'} repeat={[1, 1]} color={j ? '#d9c3a3' : '#7e8f80'} roughness={0.9} metalness={j ? 0 : 0.3} envMapIntensity={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      {/* forklift */}
      <group position={[9.5, 0, 7.5]} rotation={[0, -2.5, 0]}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[1.5, 1, 2.4]} />
          <meshStandardMaterial color="#c9a23f" roughness={0.55} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.5, -0.7]} castShadow>
          <boxGeometry args={[1.2, 1, 0.9]} />
          <meshStandardMaterial color="#3a4046" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 1.35, 1.3]}>
          <boxGeometry args={[1.2, 2.4, 0.14]} />
          <meshStandardMaterial color="#2b3036" roughness={0.6} metalness={0.4} />
        </mesh>
        {[[-0.55], [0.55]].map(([ox], i) => (
          <mesh key={i} position={[ox, 0.06, 1.75]}>
            <boxGeometry args={[0.24, 0.12, 1.3]} />
            <meshStandardMaterial color="#4a5057" roughness={0.6} metalness={0.5} />
          </mesh>
        ))}
      </group>
      {/* oil drums */}
      {[
        [-11.8, 9.6],
        [-11, 9.2],
        [12.3, -9.6],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.58, z]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 1.16, 14]} />
          <meshStandardMaterial color={i % 2 ? '#5a6a52' : '#7f3b2a'} roughness={0.75} metalness={0.3} />
        </mesh>
      ))}
      {/* pallet stacks near the entry */}
      {[
        [-4.5, 9, 0.2],
        [-4.5, 9.8, -0.1],
        [4.8, 9.2, 0.35],
      ].map(([x, z, r], i) => (
        <mesh key={i} position={[x, 0.16, z]} rotation={[0, r, 0]}>
          <boxGeometry args={[1.5, 0.32, 1.3]} />
          <Pbr name="wood" repeat={[1, 1]} color="#e0c8a8" roughness={0.95} envMapIntensity={0.3} />
        </mesh>
      ))}
      {/* catwalk along the east wall */}
      <group position={[13.9, 0, 0]}>
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[1.6, 0.1, D - 4]} />
          <meshStandardMaterial color="#565e66" roughness={0.7} metalness={0.4} />
        </mesh>
        <mesh position={[0.6, 3.5, 0]}>
          <boxGeometry args={[0.05, 1, D - 4]} />
          <meshStandardMaterial color="#454c54" roughness={0.6} metalness={0.5} />
        </mesh>
        {[-9, -4.5, 0, 4.5, 9].map((z, i) => (
          <mesh key={i} position={[-0.75, 1.45, z]}>
            <cylinderGeometry args={[0.06, 0.06, 2.9, 8]} />
            <meshStandardMaterial color="#454c54" roughness={0.6} metalness={0.5} />
          </mesh>
        ))}
      </group>
      {/* hanging lamps */}
      <HangLamp x={-5} z={-4} />
      <HangLamp x={5} z={-4} />
      <HangLamp x={-5} z={5} />
      <HangLamp x={5} z={5} />
      {/* graffiti banner on the north wall */}
      <mesh position={[0, 2.4, -11.75]}>
        <planeGeometry args={[6, 1.6]} />
        <meshStandardMaterial color="#5c2430" roughness={0.95} />
      </mesh>
      <SchoolSign position={[0, 2.4, -11.7]} text="WILAYAH KITA" size={0.4} color="#c4546a" />
    </group>
  );
}
