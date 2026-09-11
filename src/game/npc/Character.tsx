import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Animatable runtime state shared between owner controller and figure.
export type FigureAnim = {
  speed: number;      // horizontal speed (m/s)
  run: boolean;
  attackT: number;    // 0..1 progress while attacking, -1 = idle
  block: boolean;
  hurtT: number;      // 0..1 hurt flash, -1 = idle
  down: boolean;      // KO
};

export const makeAnim = (): FigureAnim => ({
  speed: 0,
  run: false,
  attackT: -1,
  block: false,
  hurtT: -1,
  down: false,
});

type Props = {
  anim: MutableRefObject<FigureAnim>;
  color: string;      // top / uniform color
  accent: string;     // collar / tie accent
  scale?: number;
  nameTag?: string;
  tag?: string;
  // stylized-realistic overrides (data/npcs.ts NpcDef)
  skin?: string;
  pants?: string;
  skirt?: string;     // presence swaps legwear for a skirt
  hair?: { color: string; style: 'short' | 'wave' | 'ponytail' | 'buzz' };
};

const SKIN_DEFAULT = '#f2c9a4';
const HAIR_DEFAULT = '#1f2937';
const PANTS_DEFAULT = '#233043';

// Stylized-realistic student figure, fully procedural (no GLB payload):
// capsule limbs, shaped hair styles, facial dots, uniform collar + tie,
// optional skirt. Procedural limb animation kept from v1 (DECISIONS.md #13).
export function Figure({ anim, color, accent, scale = 1, nameTag, tag, skin = SKIN_DEFAULT, pants = PANTS_DEFAULT, skirt, hair }: Props) {
  const root = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const phase = useRef(0);

  const hairColor = hair?.color ?? HAIR_DEFAULT;

  useFrame((_, dt) => {
    const a = anim.current;
    if (!root.current) return;
    const g = root.current;
    if (a.down) {
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -Math.PI / 2.2, 0.12);
      g.position.y = THREE.MathUtils.lerp(g.position.y, 0.12, 0.12);
      return;
    }
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0, 0.2);
    g.position.y = THREE.MathUtils.lerp(g.position.y, 0, 0.2);

    const moving = a.speed > 0.15;
    const stride = a.run ? 11 : 7.5;
    phase.current += dt * (moving ? stride * Math.max(0.35, a.speed / 3.2) : 1.6);

    const swing = moving ? Math.sin(phase.current) * (a.run ? 0.85 : 0.55) : Math.sin(phase.current * 0.6) * 0.05;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    const atk = a.attackT >= 0 ? Math.sin(Math.min(1, a.attackT) * Math.PI) : 0;
    if (armL.current) {
      if (a.block) {
        armL.current.rotation.x = -1.9;
        armL.current.rotation.z = 0.5;
      } else {
        armL.current.rotation.x = -swing * 0.8;
        armL.current.rotation.z = 0;
      }
    }
    if (armR.current) {
      if (atk > 0) {
        armR.current.rotation.x = -1.2 - atk * 1.6;
        armR.current.rotation.z = 0;
      } else if (a.block) {
        armR.current.rotation.x = -1.9;
        armR.current.rotation.z = -0.5;
      } else {
        armR.current.rotation.x = swing * 0.8;
        armR.current.rotation.z = 0;
      }
    }
    if (torso.current) {
      torso.current.rotation.y = moving ? Math.sin(phase.current) * 0.12 : Math.sin(phase.current * 0.6) * 0.03;
      torso.current.rotation.x = a.attackT >= 0 ? -atk * 0.35 : moving ? 0.08 + (a.run ? 0.1 : 0) : 0;
      const bob = moving ? Math.abs(Math.sin(phase.current)) * (a.run ? 0.05 : 0.03) : 0;
      // base position 0.92 keeps torso+head above the legs; bob is additive.
      torso.current.position.y = 0.92 + bob;
    }
    // subtle head follow for life-like idle
    if (head.current) {
      head.current.rotation.y = moving ? 0 : Math.sin(phase.current * 0.35) * 0.14;
    }
  });

  return (
    <group ref={root} scale={scale}>
      <group ref={torso} position={[0, 0.92, 0]}>
        {/* torso — capsule for softer silhouette */}
        <mesh castShadow position={[0, 0.02, 0]}>
          <capsuleGeometry args={[0.155, 0.34, 6, 14]} />
          <meshStandardMaterial color={color} roughness={0.62} />
        </mesh>
        {/* shirt hem shadow band */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.148, 0.152, 0.07, 14]} />
          <meshStandardMaterial color="#00000022" transparent opacity={0.16} roughness={0.8} />
        </mesh>
        {/* collar */}
        <mesh position={[0, 0.245, 0.015]}>
          <boxGeometry args={[0.2, 0.055, 0.19]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>
        {/* tie */}
        <mesh position={[0, 0.13, 0.135]} rotation={[0.06, 0, 0]}>
          <coneGeometry args={[0.035, 0.16, 8]} />
          <meshStandardMaterial color={accent} roughness={0.42} />
        </mesh>
        {/* head group: skull + face + hair */}
        <group ref={head} position={[0, 0.5, 0]}>
          <mesh castShadow scale={[1, 1.1, 1.02]}>
            <sphereGeometry args={[0.155, 20, 18]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          {/* jaw */}
          <mesh position={[0, -0.09, 0.02]} scale={[0.82, 0.6, 0.85]}>
            <sphereGeometry args={[0.14, 14, 12]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
          {/* eyes */}
          <mesh position={[-0.055, 0.015, 0.135]}>
            <sphereGeometry args={[0.017, 8, 8]} />
            <meshStandardMaterial color="#15181d" roughness={0.3} />
          </mesh>
          <mesh position={[0.055, 0.015, 0.135]}>
            <sphereGeometry args={[0.017, 8, 8]} />
            <meshStandardMaterial color="#15181d" roughness={0.3} />
          </mesh>
          {/* brows */}
          <mesh position={[-0.055, 0.062, 0.132]} rotation={[0, 0, 0.12]}>
            <boxGeometry args={[0.045, 0.009, 0.012]} />
            <meshStandardMaterial color={hairColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.055, 0.062, 0.132]} rotation={[0, 0, -0.12]}>
            <boxGeometry args={[0.045, 0.009, 0.012]} />
            <meshStandardMaterial color={hairColor} roughness={0.7} />
          </mesh>
          {/* hair variants */}
          <Hair color={hairColor} style={hair?.style ?? 'short'} />
        </group>
        {/* arms — capsule upper + skin hand */}
        <group ref={armL} position={[-0.235, 0.22, 0]}>
          <mesh castShadow position={[0, -0.17, 0]}>
            <capsuleGeometry args={[0.052, 0.3, 4, 10]} />
            <meshStandardMaterial color={color} roughness={0.62} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>
        <group ref={armR} position={[0.235, 0.22, 0]}>
          <mesh castShadow position={[0, -0.17, 0]}>
            <capsuleGeometry args={[0.052, 0.3, 4, 10]} />
            <meshStandardMaterial color={color} roughness={0.62} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color={skin} roughness={0.55} />
          </mesh>
        </group>
      </group>
      {/* legs (or skirt + lower legs) */}
      {skirt ? (
        <>
          <mesh position={[0, 0.62, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.27, 0.42, 14]} />
            <meshStandardMaterial color={skirt} roughness={0.7} />
          </mesh>
          <group ref={legL} position={[-0.09, 0.45, 0]}>
            <mesh castShadow position={[0, -0.19, 0]}>
              <capsuleGeometry args={[0.045, 0.24, 4, 10]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.36, 0.03]}>
              <boxGeometry args={[0.1, 0.06, 0.2]} />
              <meshStandardMaterial color="#111318" roughness={0.5} />
            </mesh>
          </group>
          <group ref={legR} position={[0.09, 0.45, 0]}>
            <mesh castShadow position={[0, -0.19, 0]}>
              <capsuleGeometry args={[0.045, 0.24, 4, 10]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.36, 0.03]}>
              <boxGeometry args={[0.1, 0.06, 0.2]} />
              <meshStandardMaterial color="#111318" roughness={0.5} />
            </mesh>
          </group>
        </>
      ) : (
        <>
          <group ref={legL} position={[-0.1, 0.63, 0]}>
            <mesh castShadow position={[0, -0.33, 0]}>
              <capsuleGeometry args={[0.062, 0.52, 4, 10]} />
              <meshStandardMaterial color={pants} roughness={0.72} />
            </mesh>
            <mesh position={[0, -0.63, 0.035]}>
              <boxGeometry args={[0.11, 0.06, 0.21]} />
              <meshStandardMaterial color="#111318" roughness={0.5} />
            </mesh>
          </group>
          <group ref={legR} position={[0.1, 0.63, 0]}>
            <mesh castShadow position={[0, -0.33, 0]}>
              <capsuleGeometry args={[0.062, 0.52, 4, 10]} />
              <meshStandardMaterial color={pants} roughness={0.72} />
            </mesh>
            <mesh position={[0, -0.63, 0.035]}>
              <boxGeometry args={[0.11, 0.06, 0.21]} />
              <meshStandardMaterial color="#111318" roughness={0.5} />
            </mesh>
          </group>
        </>
      )}
      {nameTag && (
        <group position={[0, 1.85, 0]}>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[nameTag.length * 0.09 + 0.2, 0.3]} />
            <meshBasicMaterial color="#0f1520" transparent opacity={0.55} />
          </mesh>
          <NewText text={nameTag} y={0.07} size={0.11} color="#ffffff" />
          {tag && <NewText text={tag} y={-0.075} size={0.075} color="#f59e0b" />}
        </group>
      )}
    </group>
  );
}

// Procedural hair styles. Positioned relative to the head group (skull r≈0.155).
function Hair({ color, style }: { color: string; style: 'short' | 'wave' | 'ponytail' | 'buzz' }) {
  if (style === 'buzz') {
    return (
      <mesh position={[0, 0.035, -0.005]} scale={[1.02, 1.02, 1.04]}>
        <sphereGeometry args={[0.156, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    );
  }
  if (style === 'wave') {
    return (
      <group>
        <mesh position={[0, 0.03, -0.005]} scale={[1.06, 1.04, 1.08]}>
          <sphereGeometry args={[0.156, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* back volume */}
        <mesh position={[0, -0.03, -0.09]} scale={[1, 1.25, 0.7]}>
          <sphereGeometry args={[0.13, 14, 12]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* front tuft */}
        <mesh position={[0, 0.115, 0.1]} rotation={[0.5, 0, 0]} scale={[1, 0.6, 0.8]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  if (style === 'ponytail') {
    return (
      <group>
        <mesh position={[0, 0.03, -0.005]} scale={[1.05, 1.02, 1.06]}>
          <sphereGeometry args={[0.156, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        {/* tie + tail */}
        <mesh position={[0, 0.02, -0.14]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
        <mesh position={[0, -0.16, -0.17]} rotation={[0.5, 0, 0]}>
          <capsuleGeometry args={[0.032, 0.18, 4, 10]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      </group>
    );
  }
  // 'short' — classic cap
  return (
    <mesh position={[0, 0.03, -0.005]} scale={[1.06, 1.03, 1.07]}>
      <sphereGeometry args={[0.156, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

// Lazy drei Text import would be circular in some builds; use direct import.
import { Text } from '@react-three/drei';
function NewText({ text, y, size, color }: { text: string; y: number; size: number; color: string }) {
  return (
    <Text fontSize={size} color={color} anchorX="center" anchorY="middle" position={[0, y, 0]} outlineWidth={0.008} outlineColor="#0b0f16">
      {text}
    </Text>
  );
}
