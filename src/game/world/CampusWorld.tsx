import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { registerOccluders } from '../runtime';
import { useGame } from '../../stores/gameStore';
import { useSettings } from '../../stores/settingsStore';
import { resolveQuality, qualityConfig } from '../quality';
import { mobile } from '../mobile';
import { skyStateFor } from '../daynight';
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
    <RigidBody type="fixed" colliders={false} friction={1}>
      {steps.map((i) => {
        const x = x0 + dir * (i + 0.5) * STEP_RUN;
        const h = (i + 1) * STEP_H;
        return <CuboidCollider key={i} args={[STEP_RUN / 2, h / 2, 0.52]} position={[x, y0 + h / 2, z]} />;
      })}
    </RigidBody>
  );
}

// ============================================================================
// Custom GLSL Shaders for Sun Corona Halo & Moon Surface
// ============================================================================

const HALO_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HALO_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float d = length(vUv - vec2(0.5)) * 2.0;
  float alpha = pow(max(0.0, 1.0 - d), 3.2) * uOpacity;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export function SkyAtmosphere() {
  const sunGroupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const quality = useSettings((s) => s.quality);
  const isHigh = resolveQuality(quality, mobile.tier) === 'high';
  // drei <Sky> (World.tsx) already paints its own sun disc at the sun direction; a second
  // solid sun sphere on top of it shows up as a duplicate sun. Only draw the mesh sun when
  // the Sky shader is off (low quality).
  const skyShaderOn = qualityConfig(quality, mobile.tier).sky;

  const sunHaloUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#ffdfa0') },
      uOpacity: { value: 0.85 },
    }),
    [],
  );

  const moonHaloUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#9ec5ff') },
      uOpacity: { value: 0.0 },
    }),
    [],
  );

  useFrame(({ camera }) => {
    const mins = useGame.getState().clock.minutes;
    const st = skyStateFor(mins);
    const nightMix = mins >= 1110 ? Math.min(1, (mins - 1110) / 120) : mins < 360 ? 1 - Math.max(0, (mins - 300) / 60) : 0;

    sunHaloUniforms.uColor.value.setHex(st.sunColor);
    sunHaloUniforms.uOpacity.value = (1 - nightMix) * 0.85;
    moonHaloUniforms.uOpacity.value = nightMix * 0.65;

    if (sunGroupRef.current) {
      // camera-relative: the sky is at infinity, so the sun must not parallax against the
      // <Sky> dome when the player walks away from the world origin (was: double sun).
      sunGroupRef.current.position.set(
        camera.position.x + st.sun[0] * 1.4,
        camera.position.y + Math.max(8, st.sun[1] * 1.4),
        camera.position.z + st.sun[2] * 1.4,
      );
      sunGroupRef.current.lookAt(camera.position);
      sunGroupRef.current.visible = !skyShaderOn && nightMix < 0.98;
    }
    if (moonGroupRef.current) {
      // at night st.sun IS the moon-light direction and <Sky> draws its disc there: converge
      // the moon onto it (w -> 1) instead of the mirrored dusk position (was: double moon).
      const w = THREE.MathUtils.smoothstep(nightMix, 0.3, 0.8);
      const my = Math.max(24, Math.abs(st.sun[1]) * 1.25);
      moonGroupRef.current.position.set(
        camera.position.x + THREE.MathUtils.lerp(-st.sun[0] * 1.3, st.sun[0] * 1.3, w),
        camera.position.y + THREE.MathUtils.lerp(my, Math.max(24, st.sun[1] * 1.25), w),
        camera.position.z + THREE.MathUtils.lerp(-st.sun[2] * 1.3, st.sun[2] * 1.3, w),
      );
      moonGroupRef.current.lookAt(camera.position);
      moonGroupRef.current.visible = !skyShaderOn && nightMix > 0.05;
    }
  });

  return (
    <group name="SkyAtmosphere_Root">
      {/* MATAHARI REALISTIS DENGAN CORONA GLOW */}
      <group ref={sunGroupRef} name="Sky_Sun_Dynamic" position={[65, 50, 45]}>
        <mesh visible={!skyShaderOn}>
          <sphereGeometry args={[3.4, 24, 24]} />
          <meshBasicMaterial color="#fffbeb" fog={false} />
        </mesh>
        <mesh position={[0, 0, -0.5]}>
          <planeGeometry args={[26, 26]} />
          <shaderMaterial
            vertexShader={HALO_VERT}
            fragmentShader={HALO_FRAG}
            uniforms={sunHaloUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* BULAN REALISTIS DENGAN EARTHSHINE HALO */}
      <group ref={moonGroupRef} name="Sky_Moon_Dynamic" position={[-55, 45, -35]}>
        <mesh>
          <sphereGeometry args={[2.6, 24, 24]} />
          <meshStandardMaterial
            color="#e2e8f0"
            emissive="#93c5fd"
            emissiveIntensity={0.65}
            roughness={0.85}
            fog={false}
          />
        </mesh>
        <mesh position={[0, 0, -0.4]}>
          <planeGeometry args={[18, 18]} />
          <shaderMaterial
            vertexShader={HALO_VERT}
            fragmentShader={HALO_FRAG}
            uniforms={moonHaloUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

    </group>
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
      {/* Lantai dasar kampus & pagar pembatas luar */}
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[60, 0.25, 60]} position={[0, -0.25, 8]} />
        <CuboidCollider args={[27, 1.2, 0.3]} position={[-23, 1.2, 46]} />
        <CuboidCollider args={[27, 1.2, 0.3]} position={[37, 1.2, 46]} />
        <CuboidCollider args={[48.5, 2, 0.4]} position={[0, 2, -37.8]} />
        <CuboidCollider args={[0.4, 2, 46]} position={[-47.8, 2, 8]} />
        <CuboidCollider args={[0.4, 2, 46]} position={[47.8, 2, 8]} />
        <CuboidCollider args={[48.5, 2, 0.4]} position={[0, 2, 53.8]} />
        {/* Pelat lantai atas Gedung Utama (Lantai 2) agar ada pijakan penuh */}
        <CuboidCollider args={[16.2, 0.2, 12.2]} position={[0, 3.3, 16]} />
      </RigidBody>

      {/* Kolider Dinding Utama, Kantin, Tangga Atap, Gudang & Perpustakaan */}
      <WallColliders segs={MAIN_SHELL} defaultH={3.3} />
      <WallColliders segs={CANTEEN_WALLS} defaultH={3.1} />
      <WallColliders segs={STAIR_SHAFT} defaultH={6.6} />
      <WallColliders segs={WAREHOUSE_WALLS} defaultH={5.5} />
      <WallColliders segs={LIBRARY_WALLS} defaultH={3.2} />

      {/* Kolider Luar Ruangan: Parkiran, Lapangan, Gang Belakang */}
      <Blockers
        segs={[
          { x: 29, z: 37, w: 2.2, d: 4.2, h: 1.4 },
          { x: 32, z: 37, w: 2.2, d: 4.2, h: 1.4 },
          { x: 35, z: 37, w: 2.2, d: 4.2, h: 1.4 },
          { x: 38, z: 37, w: 2.2, d: 4.2, h: 1.4 },
          { x: 34, z: 28.5, w: 10.4, d: 2.6, h: 2.2 },
          { x: -20.5, z: 15, w: 2.2, d: 14, h: 1.8 },
          { x: -36, z: -27, w: 20.4, d: 18.4, h: 2.6 },
          { x: -23, z: -22, w: 6.2, d: 2.6, h: 2.6 },
          { x: 6, z: -25.8, w: 18, d: 1, h: 1.4 },
          { x: -3.2, z: -21, w: 1.8, d: 3.6, h: 1.2 },
          { x: 14.5, z: -18, w: 2.4, d: 2.4, h: 1 },
        ]}
      />

      {/* Kolider Interior Gedung Utama & Kantin */}
      <RigidBody type="fixed" colliders={false} friction={1}>
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

      {/* Kolider Gedung B (Lantai 1, Lantai 2, dan Lantai 3 Lengkap dengan Pelat Lantai Utuh) */}
      {[0, 3.5, 7].map((y0, idx) => (
        <group key={`gb-lvl-${idx}`}>
          <WallColliders segs={gedungBShellAt(y0)} defaultH={3.2} />
          <RigidBody type="fixed" colliders={false} friction={1}>
            <CuboidCollider args={[10.2, 0.18, 6.0]} position={[34, y0 - 0.15, -7.8]} />
            <CuboidCollider args={[7.3, 0.18, 1.25]} position={[31.3, y0 - 0.15, -14.8]} />
            <CuboidCollider args={[10.0, 0.65, 0.1]} position={[34, y0 + 0.6, -15.95]} />
            {gbRows.map((z) => (
              <CuboidCollider key={`gbr-${idx}-${z}`} args={[4.6, 0.4, 0.45]} position={[30.25, y0 + 0.4, z]} />
            ))}
            <CuboidCollider args={[0.5, 0.4, 0.9]} position={[26, y0 + 0.4, -3.4]} />
            <CuboidCollider args={[1.6, 0.4, 0.6]} position={[40, y0 + 0.4, -7.5]} />
            <CuboidCollider args={[0.4, 0.95, 2.2]} position={[43.3, y0 + 0.95, -8]} />
            <CuboidCollider args={[1.7, 1, 0.3]} position={[40, y0 + 1, -2.45]} />
          </RigidBody>
        </group>
      ))}

      {/* Tangga Switchback Gedung B Lantai 1 -> 2 -> 3 */}
      <GedungBFlightColliders x0={38.6} z={-15.3} dir={1} y0={0} />
      <GedungBFlightColliders x0={41.7} z={-14.25} dir={-1} y0={1.75} />
      <GedungBFlightColliders x0={38.6} z={-15.3} dir={1} y0={3.5} />
      <GedungBFlightColliders x0={41.7} z={-14.25} dir={-1} y0={5.25} />
      <RigidBody type="fixed" colliders={false} friction={1}>
        {[1.75, 5.25].map((top, i) => (
          <CuboidCollider key={`mid-${i}`} args={[1.25, 0.18, 1.25]} position={[42.85, top - 0.15, -14.8]} />
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
  const quality = useSettings((s) => s.quality);
  const isHigh = resolveQuality(quality, mobile.tier) === 'high';

  const clonedCampus = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.castShadow = true;
        m.receiveShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && mat.isMeshStandardMaterial) {
          mat.envMapIntensity = isHigh ? 1.25 : 0.85;
          mat.needsUpdate = true;
        }
      }
    });
    return c;
  }, [scene, isHigh]);

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
      <SkyAtmosphere />
      <group ref={meshGroupRef}>
        <primitive object={clonedCampus} />
      </group>
      <CampusPhysicsAndSigns />
    </group>
  );
}

useGLTF.preload(CAMPUS_GLB_PATH);
