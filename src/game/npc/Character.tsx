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
  color: string;
  accent: string;
  scale?: number;
  nameTag?: string;
  tag?: string;
};

const SKIN = '#f2c9a4';

// Stylized student figure with procedural limb animation (DECISIONS.md #13).
// Final GLBs can replace this without touching controllers.
export function Figure({ anim, color, accent, scale = 1, nameTag, tag }: Props) {
  const root = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const phase = useRef(0);

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
      torso.current.position.y = bob;
    }
  });

  return (
    <group ref={root} scale={scale}>
      <group ref={torso} position={[0, 0.92, 0]}>
        {/* torso */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.58, 0.24]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        {/* collar / accent */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.42, 0.1, 0.26]} />
          <meshStandardMaterial color={accent} roughness={0.5} />
        </mesh>
        {/* head */}
        <mesh castShadow position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.17, 18, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </mesh>
        {/* hair */}
        <mesh position={[0, 0.56, -0.01]}>
          <sphereGeometry args={[0.175, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#1f2937" roughness={0.8} />
        </mesh>
        {/* arms */}
        <group ref={armL} position={[-0.27, 0.22, 0]}>
          <mesh castShadow position={[0, -0.18, 0]}>
            <boxGeometry args={[0.11, 0.42, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        </group>
        <group ref={armR} position={[0.27, 0.22, 0]}>
          <mesh castShadow position={[0, -0.18, 0]}>
            <boxGeometry args={[0.11, 0.42, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.44, 0]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        </group>
      </group>
      {/* legs */}
      <group ref={legL} position={[-0.11, 0.63, 0]}>
        <mesh castShadow position={[0, -0.33, 0]}>
          <boxGeometry args={[0.14, 0.66, 0.17]} />
          <meshStandardMaterial color="#233043" roughness={0.7} />
        </mesh>
      </group>
      <group ref={legR} position={[0.11, 0.63, 0]}>
        <mesh castShadow position={[0, -0.33, 0]}>
          <boxGeometry args={[0.14, 0.66, 0.17]} />
          <meshStandardMaterial color="#233043" roughness={0.7} />
        </mesh>
      </group>
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

// Lazy drei Text import would be circular in some builds; use direct import.
import { Text } from '@react-three/drei';
function NewText({ text, y, size, color }: { text: string; y: number; size: number; color: string }) {
  return (
    <Text fontSize={size} color={color} anchorX="center" anchorY="middle" position={[0, y, 0]} outlineWidth={0.008} outlineColor="#0b0f16">
      {text}
    </Text>
  );
}
