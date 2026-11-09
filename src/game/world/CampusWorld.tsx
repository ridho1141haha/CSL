import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { registerOccluders } from '../runtime';
import { WallColliders, Blockers, SchoolSign, type Seg } from './props';

export const CAMPUS_GLB_PATH = '/models/csl_campus_world.glb';

const MAIN_SHELL: Seg[] = [
  { x: -8.8, z: 28, w: 14.4, d: 0.3 },
  { x: 8.8, z: 28, w: 14.4, d: 0.3 },
  { x: -8.5, z: 4, w: 15, d: 0.3 },
  { x: 8.5, z: 4, w: 15, d: 0.3 },
  { x: -16, z: 16, w: 0.3, d: 24.3 },
  { x: 16, z: 16, w: 0.3, d: 24.3 },
  { x: -9.25, z: 21, w: 13.5, d: 0.25 },
  { x: 9.25, z: 21, w: 13.5, d: 0.25 },
  { x: -2, z: 18.5, w: 0.25, d: 5.25 },
  { x: 2, z: 18.5, w: 0.25, d: 5.25 },
  { x: -12.75, z: 14, w: 6.5, d: 0.25 },
  { x: -0.25, z: 14, w: 15.5, d: 0.25 },
  { x: 13, z: 14, w: 6, d: 0.25 },
  { x: -2, z: 9.7, w: 0.25, d: 8.6 },
  { x: 2, z: 9.7, w: 0.25, d: 8.6 },
];

const CANTEEN_WALLS: Seg[] = [
  { x: 22, z: 4.5, w: 0.3, d: 5 },
  { x: 22, z: 11.5, w: 0.3, d: 5 },
  { x: 28, z: 2, w: 12.3, d: 0.3 },
  { x: 28, z: 14, w: 12.3, d: 0.3 },
  { x: 34, z: 8, w: 0.3, d: 12.3 },
];

const STAIR_SHAFT: Seg[] = [
  { x: -4, z: 1, w: 0.3, d: 6.3, h: 6.6 },
  { x: 4, z: 1, w: 0.3, d: 6.3, h: 6.6 },
  { x: -2.5, z: -2, w: 3.2, d: 0.3, h: 6.6 },
  { x: 2.5, z: -2, w: 3.2, d: 0.3, h: 6.6 },
];

const WAREHOUSE_WALLS: Seg[] = [
  { x: -26, z: -32.5, w: 0.4, d: 7, h: 5.5 },
  { x: -26, z: -21.5, w: 0.4, d: 7, h: 5.5 },
  { x: -36, z: -36, w: 20.4, d: 0.4, h: 5.5 },
  { x: -36, z: -18, w: 20.4, d: 0.4, h: 5.5 },
  { x: -46, z: -27, w: 0.4, d: 18.4, h: 5.5 },
  { x: -27.3, z: -27, w: 1.8, d: 3.6, h: 4.2 },
];

const LIBRARY_WALLS: Seg[] = [
  { x: 23, z: 17.5, w: 0.3, d: 3.5 },
  { x: 23, z: 22.5, w: 0.3, d: 3.5 },
  { x: 31, z: 16, w: 16.3, d: 0.3 },
  { x: 31, z: 24, w: 16.3, d: 0.3 },
  { x: 39, z: 20, w: 0.3, d: 8.3 },
];

const GEDUNG_B_FLOOR_SHELL: Seg[] = [
  { x: 24, z: -7.8, w: 0.3, d: 11.6 },
  { x: 44, z: -9, w: 0.3, d: 14.3 },
  { x: 34, z: -2, w: 20.6, d: 0.3 },
  { x: 26.5, z: -13.6, w: 5, d: 0.25 },
  { x: 33.2, z: -13.6, w: 5.6, d: 0.25 },
  { x: 36.3, z: -13.6, w: 0.6, d: 0.25 },
  { x: 41, z: -13.6, w: 6, d: 0.25 },
  { x: 36, z: -7.8, w: 0.25, d: 11.6 },
];

function gedungBShellAt(y0: number): Seg[] {
  return GEDUNG_B_FLOOR_SHELL.map((s) => ({ ...s, y0: s.y0 ? s.y0 + y0 : y0 }));
}

function GedungBFlightColliders({ x0, z, dir, y0 }: { x0: number; z: number; dir: 1 | -1; y0: number }) {
  const STEP_H = 0.35;
  const STEP_RUN = 0.62;
  const steps = [0, 1, 2, 3, 4];
  return (
    <RigidBody type="fixed" colliders={false}>
      {steps.map((i) => {
        const x = x0 + dir * (i + 0.5) * STEP_RUN;
        const h = (i + 1) * STEP_H;
        return <CuboidCollider key={i} args={[STEP_RUN / 2, h / 2, 0.5]} position={[x, y0 + h / 2, z]} />;
      })}
    </RigidBody>
  );
}

function CampusPhysicsAndSigns() {
  const classRows = [6.6, 8.8, 11];
  const gbRows = [-5.2, -7.4, -9.6];
  const canteenTables: [number, number][] = [
    [25.5, 5],
    [25.5, 9],
    [29.5, 7],
  ];

  return (
    <group>
      {/* Lantai dasar & batas pagar keliling */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[60, 0.25, 60]} position={[0, -0.25, 8]} />
        <CuboidCollider args={[27, 1.2, 0.3]} position={[-23, 1.2, 46]} />
        <CuboidCollider args={[27, 1.2, 0.3]} position={[37, 1.2, 46]} />
        <CuboidCollider args={[48.5, 2, 0.4]} position={[0, 2, -37.8]} />
        <CuboidCollider args={[0.4, 2, 46]} position={[-47.8, 2, 8]} />
        <CuboidCollider args={[0.4, 2, 46]} position={[47.8, 2, 8]} />
        <CuboidCollider args={[48.5, 2, 0.4]} position={[0, 2, 53.8]} />
      </RigidBody>

      {/* Kolider Dinding Utama, Kantin, Tangga Atap, Gudang & Perpustakaan */}
      <WallColliders segs={MAIN_SHELL} defaultH={3.3} />
      <WallColliders segs={CANTEEN_WALLS} defaultH={3.1} />
      <WallColliders segs={STAIR_SHAFT} defaultH={6.6} />
      <WallColliders segs={WAREHOUSE_WALLS} defaultH={5.5} />
      <WallColliders segs={LIBRARY_WALLS} defaultH={3.2} />

      {/* Kolider Luar Ruangan: Parkiran, Lapangan, Gang Belakang */}
      <Blockers
        boxes={[
          [29, 0.7, 37, 1.1, 0.7, 2.1],
          [32, 0.7, 37, 1.1, 0.7, 2.1],
          [35, 0.7, 37, 1.1, 0.7, 2.1],
          [38, 0.7, 37, 1.1, 0.7, 2.1],
          [34, 1.1, 28.5, 5.2, 1.1, 1.3],
          [-20.5, 0.9, 15, 1.1, 0.9, 7],
          [-36, 1.3, -27, 10.2, 1.3, 9.2],
          [-23, 1.3, -22, 3.1, 1.3, 1.3],
          [6, 0.7, -25.8, 9, 0.7, 0.5],
          [-3.2, 0.6, -21, 0.9, 0.6, 1.8],
          [14.5, 0.5, -18, 1.2, 0.5, 1.2],
        ]}
      />

      {/* Kolider Interior Gedung Utama & Kantin */}
      <RigidBody type="fixed" colliders={false}>
        {classRows.map((z) => (
          <CuboidCollider key={`c1x-${z}`} args={[4.6, 0.4, 0.45]} position={[-8.75, 0.4, z]} />
        ))}
        <CuboidCollider args={[0.5, 0.4, 0.9]} position={[-14.1, 0.4, 12.4]} />
        <CuboidCollider args={[2.2, 0.4, 1.2]} position={[8.5, 0.4, 9]} />
        <CuboidCollider args={[0.4, 0.9, 3.2]} position={[15.1, 0.9, 9]} />
        <CuboidCollider args={[1, 0.55, 2.7]} position={[32.4, 0.55, 8]} />
        {canteenTables.map(([x, z], i) => (
          <CuboidCollider key={`cnt-${i}`} args={[1, 0.4, 1]} position={[x, 0.4, z]} />
        ))}
        {/* Kolider Perpustakaan */}
        <CuboidCollider args={[3.8, 1.1, 0.35]} position={[31, 1.1, 16.55]} />
        <CuboidCollider args={[3.8, 1.1, 0.35]} position={[31, 1.1, 23.45]} />
        <CuboidCollider args={[0.35, 1.1, 3.2]} position={[38.45, 1.1, 20]} />
        <CuboidCollider args={[1.6, 0.4, 0.7]} position={[29.5, 0.4, 20]} />
        <CuboidCollider args={[1.6, 0.4, 0.7]} position={[34.2, 0.4, 20]} />
        <CuboidCollider args={[0.7, 0.5, 1.2]} position={[25.2, 0.5, 21.8]} />
      </RigidBody>

      {/* Kolider Gedung B (3 Lantai + Tangga Switchback) */}
      {[0, 3.5, 7].map((y0, idx) => (
        <group key={`gb-lvl-${idx}`}>
          <WallColliders segs={gedungBShellAt(y0)} defaultH={3.2} />
          <RigidBody type="fixed" colliders={false}>
            {y0 > 0 && <CuboidCollider args={[10, 0.15, 5.8]} position={[34, y0 - 0.15, -7.8]} />}
            {y0 > 0 && <CuboidCollider args={[6, 0.15, 1.2]} position={[30, y0 - 0.15, -14.8]} />}
            <CuboidCollider args={[6, 0.55, 0.08]} position={[30, y0 + 0.55, -15.95]} />
            <CuboidCollider args={[4, 0.95, 0.08]} position={[40, y0 + 0.95, -15.95]} />
            {gbRows.map((z) => (
              <CuboidCollider key={`gbr-${z}`} args={[4.6, 0.4, 0.45]} position={[30.25, y0 + 0.4, z]} />
            ))}
            <CuboidCollider args={[0.5, 0.4, 0.9]} position={[26, y0 + 0.4, -3.4]} />
            <CuboidCollider args={[1.6, 0.4, 0.6]} position={[40, y0 + 0.4, -7.5]} />
            <CuboidCollider args={[0.4, 0.95, 2.2]} position={[43.3, y0 + 0.95, -8]} />
            <CuboidCollider args={[1.7, 1, 0.3]} position={[40, y0 + 1, -2.45]} />
          </RigidBody>
        </group>
      ))}
      <GedungBFlightColliders x0={38.6} z={-15.3} dir={1} y0={0} />
      <GedungBFlightColliders x0={41.7} z={-14.25} dir={-1} y0={1.75} />
      <GedungBFlightColliders x0={38.6} z={-15.3} dir={1} y0={3.5} />
      <GedungBFlightColliders x0={41.7} z={-14.25} dir={-1} y0={5.25} />
      <RigidBody type="fixed" colliders={false}>
        {[1.75, 5.25].map((top, i) => (
          <CuboidCollider key={`mid-${i}`} args={[1.15, 0.15, 1.2]} position={[42.85, top - 0.15, -14.8]} />
        ))}
      </RigidBody>

      {/* Plang Teks Sekolah */}
      <SchoolSign position={[7, 3.55, 46.25]} text="SMA YUSON" size={0.42} />
      <SchoolSign position={[0, 3.05, 28.22]} text="GEDUNG UTAMA" size={0.32} />
      <SchoolSign position={[21.82, 2.65, 8]} text="KANTIN" size={0.28} color="#8a4b2a" rotY={-Math.PI / 2} />
      <SchoolSign position={[0, 2.65, -2.2]} text="TANGGA ATAP" size={0.22} color="#5d6a76" rotY={Math.PI} />
      <SchoolSign position={[-25.75, 3.2, -27]} text="GUDANG TUA" size={0.26} color="#6b4a3a" rotY={Math.PI / 2} />
      <SchoolSign position={[33.6, 2.2, 8]} text="ROTI · TEH · MI" size={0.2} color="#d8e4f0" rotY={-Math.PI / 2} />
      <SchoolSign position={[22.82, 2.7, 20]} text="PERPUSTAKAAN" size={0.24} color="#31547a" rotY={-Math.PI / 2} />
      <SchoolSign position={[24, 3.05, -15.8]} text="GEDUNG B" size={0.28} rotY={Math.PI} />
    </group>
  );
}

export function CampusWorld() {
  const meshGroupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(CAMPUS_GLB_PATH);

  const clonedCampus = useMemo(() => {
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

  useEffect(() => {
    const t = setTimeout(() => {
      if (meshGroupRef.current) {
        registerOccluders([meshGroupRef.current]);
      }
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <group>
      <group ref={meshGroupRef}>
        <primitive object={clonedCampus} />
      </group>
      <CampusPhysicsAndSigns />
    </group>
  );
}

useGLTF.preload(CAMPUS_GLB_PATH);