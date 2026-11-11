import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { WallColliders, SchoolSign } from './props';

export const ROOFTOP_GLB_PATH = '/models/csl_rooftop_world.glb';

export function RooftopWorld() {
  const W = 28;
  const D = 22;
  const { scene } = useGLTF(ROOFTOP_GLB_PATH);

  const clonedRoof = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const parapets = [
    { x: 0, z: -D / 2 + 0.12, w: W, d: 0.25 },
    { x: -W / 2 + 0.12, z: 0, w: 0.25, d: D },
    { x: W / 2 - 0.12, z: 0, w: 0.25, d: D },
    { x: -8, z: D / 2 - 0.12, w: 12, d: 0.25 },
    { x: 8, z: D / 2 - 0.12, w: 12, d: 0.25 },
  ];

  return (
    <group>
      <primitive object={clonedRoof} />
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[W / 2, 0.25, D / 2]} position={[0, -0.25, 0]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false}>
        {parapets.map((p, i) => (
          <CuboidCollider key={i} args={[p.w / 2, 1.4, p.d / 2 + 0.15]} position={[p.x, 1.4, p.z]} />
        ))}
      </RigidBody>
      <group position={[0, 0, 9.5]}>
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
        <SchoolSign position={[0, 2.15, -1.68]} text="TANGGA" size={0.22} color="#5d6a76" rotY={Math.PI} />
      </group>
    </group>
  );
}

useGLTF.preload(ROOFTOP_GLB_PATH);