import { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { WallColliders, SchoolSign } from './props';

export const WAREHOUSE_GLB_PATH = '/models/csl_warehouse_world.glb';

export function WarehouseWorld() {
  const W = 30;
  const D = 24;
  const H = 5.4;
  const th = 0.4;
  const { scene } = useGLTF(WAREHOUSE_GLB_PATH);

  const clonedWarehouse = useMemo(() => {
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

  const walls = [
    { x: 0, z: -D / 2, w: W, d: th, h: H },
    { x: -W / 2, z: 0, w: th, d: D, h: H },
    { x: W / 2, z: 0, w: th, d: D, h: H },
    { x: -8.25, z: D / 2, w: 13.5, d: th, h: H },
    { x: 8.25, z: D / 2, w: 13.5, d: th, h: H },
    { x: -2.1, z: D / 2, w: 1.2, d: th, h: H },
    { x: 2.1, z: D / 2, w: 1.2, d: th, h: H },
  ];

  return (
    <group>
      <primitive object={clonedWarehouse} />
      <RigidBody type="fixed" colliders={false} friction={0.9}>
        <CuboidCollider args={[W / 2, 0.25, D / 2]} position={[0, -0.25, 0]} />
      </RigidBody>
      <WallColliders segs={walls} defaultH={H} />
      <spotLight position={[0, H, 0]} angle={0.62} penumbra={0.7} intensity={38} distance={18} color="#bcd6e8" />
      <pointLight position={[-5, 3.8, -4]} intensity={22} distance={16} decay={1.6} color="#ffcf8a" />
      <pointLight position={[5, 3.8, -4]} intensity={22} distance={16} decay={1.6} color="#ffcf8a" />
      <pointLight position={[-5, 3.8, 5]} intensity={22} distance={16} decay={1.6} color="#ffcf8a" />
      <pointLight position={[5, 3.8, 5]} intensity={22} distance={16} decay={1.6} color="#ffcf8a" />
      <SchoolSign position={[0, 3, 11.7]} text="KELUAR" size={0.24} color="#9fc06a" rotY={Math.PI} />
      <SchoolSign position={[0, 2.4, -11.7]} text="WILAYAH KITA" size={0.4} color="#c4546a" />
    </group>
  );
}

useGLTF.preload(WAREHOUSE_GLB_PATH);