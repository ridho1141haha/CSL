import { useEffect, useMemo, useRef, type ComponentType } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { mobile } from '../mobile';
import { useSettings } from '../../stores/settingsStore';
import { qualityConfig, resolveQuality } from '../quality';
import { useGame } from '../../stores/gameStore';
import type { SceneId } from '../../types';
import { skyStateFor, freeRoamStep, FREE_ROAM_STEP_SEC } from '../daynight';
import { CampusWorld } from './CampusWorld';
import { RooftopWorld } from './RooftopWorld';
import { WarehouseWorld } from './WarehouseWorld';
import { ObjectiveWaypoint } from './Waypoint';

// ============================================================================
// Realistic Atmospheric Sky Dome, Volumetric FBM Clouds, Sun Corona & Moon Shader
// Active on HIGH graphics setting (or when cfg.sky is enabled).
// ============================================================================

const SKY_ATMOSPHERE_VERT = /* glsl */ `
varying vec3 vWorldPos;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SKY_ATMOSPHERE_FRAG = /* glsl */ `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform float uNightMix;
uniform float uHighQuality;

varying vec3 vWorldPos;
varying vec2 vUv;

// Hash & 3D Value Noise for realistic FBM clouds & stars
float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
        mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
        mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.52;
  int octaves = uHighQuality > 0.5 ? 5 : 3;
  for (int i = 0; i < 5; i++) {
    if (i >= octaves) break;
    v += a * noise(p);
    p = p * 2.04 + vec3(13.1, 7.7, 19.3);
    a *= 0.48;
  }
  return v;
}

void main() {
  vec3 dir = normalize(vWorldPos);
  if (dir.y < -0.05) discard;

  float elev = clamp(dir.y, 0.0, 1.0);
  vec3 sunDir = normalize(uSunDir);
  vec3 moonDir = normalize(vec3(-sunDir.x, max(0.32, abs(sunDir.y)), -sunDir.z));

  // 1. Atmospheric gradient + Rayleigh/Mie horizon scattering
  vec3 skyCol = mix(uSkyHorizon, uSkyTop, pow(elev, 0.55));
  float sunAmt = max(dot(dir, sunDir), 0.0);
  
  // Golden hour & horizon scatter ring
  float horizonGlow = pow(1.0 - elev, 3.5) * max(0.0, 1.0 - uNightMix * 0.85);
  skyCol += uSunColor * horizonGlow * 0.32;
  skyCol += uSunColor * pow(sunAmt, 8.0) * 0.28 * (1.0 - uNightMix);

  // 2. Night Stars (visible when uNightMix > 0.15)
  if (uNightMix > 0.15 && elev > 0.08) {
    float starVal = pow(hash(floor(dir * 380.0)), 26.0);
    float twinkle = 0.65 + 0.35 * sin(uTime * 2.8 + starVal * 100.0);
    float starMask = smoothstep(0.08, 0.35, elev) * uNightMix;
    skyCol += vec3(0.88, 0.94, 1.0) * step(0.992, starVal) * twinkle * starMask * 1.4;
  }

  // 3. Realistic Sun Disk & Corona Bloom
  if (uNightMix < 0.95) {
    float sunDisk = smoothstep(0.9991, 0.99965, sunAmt);
    float sunCorona = pow(sunAmt, 64.0) * 0.65 + pow(sunAmt, 256.0) * 1.4;
    vec3 sunRender = (vec3(1.0, 0.98, 0.92) * sunDisk * 3.5 + uSunColor * sunCorona) * (1.0 - uNightMix);
    skyCol += sunRender;
  }

  // 4. Realistic Moon Disk with Procedural Craters & Earthshine Glow
  if (uNightMix > 0.08) {
    float moonDot = max(dot(dir, moonDir), 0.0);
    float moonDisk = smoothstep(0.99925, 0.99955, moonDot);
    float moonGlow = pow(moonDot, 48.0) * 0.38 + pow(moonDot, 180.0) * 0.65;
    float craters = fbm(dir * 95.0);
    vec3 moonSurface = mix(vec3(0.68, 0.74, 0.84), vec3(0.96, 0.98, 1.0), smoothstep(0.32, 0.68, craters));
    // Subtle phase shading on moon
    vec3 moonRight = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0)));
    float limb = clamp(dot(dir - moonDir, moonRight) * 35.0 + 0.65, 0.25, 1.0);
    skyCol += (moonSurface * limb * moonDisk * 2.2 + vec3(0.55, 0.70, 0.95) * moonGlow) * uNightMix;
  }

  // 5. Volumetric Cumulus Layer (Ray-Plane Intersection + Silver Lining)
  if (elev > 0.03) {
    vec2 cloudUv = dir.xz / (elev + 0.14) * 1.35 + vec2(uTime * 0.012, uTime * 0.005);
    vec3 p = vec3(cloudUv * 2.2, uTime * 0.008);
    float baseDensity = fbm(p);
    float detail = fbm(p * 2.7 - vec3(uTime * 0.015, 0.0, 0.0));
    float cloud = smoothstep(0.46, 0.74, baseDensity * 0.78 + detail * 0.22);

    // Self-shadowing & vertical gradient inside cloud volume
    float lightSample = fbm(p + sunDir.xzx * 0.18);
    float thickness = clamp((baseDensity - lightSample) * 2.2 + 0.55, 0.15, 1.0);

    // Forward scattering (silver lining near sun/moon)
    float phaseSun = pow(sunAmt, 5.0) * 0.9 + 0.25;
    vec3 cloudBright = mix(vec3(1.0, 0.99, 0.97), uSunColor, 0.35);
    vec3 cloudDark = mix(vec3(0.54, 0.62, 0.72), uSkyHorizon * 0.7, 0.45);
    if (uNightMix > 0.01) {
      cloudBright = mix(cloudBright, vec3(0.38, 0.46, 0.62), uNightMix);
      cloudDark = mix(cloudDark, vec3(0.10, 0.14, 0.22), uNightMix);
    }

    vec3 cloudCol = mix(cloudDark, cloudBright, thickness);
    cloudCol += uSunColor * pow(sunAmt, 10.0) * (1.0 - cloud * 0.5) * 0.75 * (1.0 - uNightMix * 0.7);

    // Distance fade near horizon so clouds blend seamlessly into atmospheric fog
    float horizonFade = smoothstep(0.03, 0.22, elev);
    float alpha = cloud * horizonFade * 0.88;
    skyCol = mix(skyCol, cloudCol, alpha);
  }

  gl_FragColor = vec4(skyCol, 1.0);
}
`;

export function RealisticSkyDome({ isHigh }: { isHigh: boolean }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const topColor = useRef(new THREE.Color(0x3b78b8));
  const horColor = useRef(new THREE.Color(0xa8c2d6));
  const sunCol = useRef(new THREE.Color(0xfff7ea));
  const scratch = useRef(new THREE.Color());

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSunDir: { value: new THREE.Vector3(50, 40, 40) },
      uSunColor: { value: new THREE.Color(0xfff7ea) },
      uSkyTop: { value: new THREE.Color(0x3b78b8) },
      uSkyHorizon: { value: new THREE.Color(0xa8c2d6) },
      uNightMix: { value: 0 },
      uHighQuality: { value: isHigh ? 1.0 : 0.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (matRef.current) {
      matRef.current.uniforms.uHighQuality.value = isHigh ? 1.0 : 0.0;
    }
  }, [isHigh]);

  useFrame((_, dt) => {
    const m = matRef.current;
    if (!m) return;
    m.uniforms.uTime.value += Math.min(dt, 0.05);

    const mins = useGame.getState().clock.minutes;
    const st = skyStateFor(mins);
    m.uniforms.uSunDir.value.set(st.sun[0], st.sun[1], st.sun[2]);

    // Compute smooth night blend factor (1.0 at night, 0.0 during day)
    const nightTarget = mins >= 1110 ? Math.min(1, (mins - 1110) / 120) : mins < 360 ? 1 - Math.max(0, (mins - 300) / 60) : 0;
    m.uniforms.uNightMix.value += (nightTarget - m.uniforms.uNightMix.value) * Math.min(1, dt * 2.5);

    // Derive deep zenith sky color from background/fog state
    sunCol.current.lerp(scratch.current.setHex(st.sunColor), 0.1);
    horColor.current.lerp(scratch.current.setHex(st.fog), 0.1);
    const zenithHex = nightTarget > 0.5 ? 0x060a14 : mins > 1000 ? 0x2b4570 : 0x2d6bb0;
    topColor.current.lerp(scratch.current.setHex(zenithHex), 0.1);

    m.uniforms.uSunColor.value.copy(sunCol.current);
    m.uniforms.uSkyHorizon.value.copy(horColor.current);
    m.uniforms.uSkyTop.value.copy(topColor.current);
  });

  return (
    <mesh position={[0, -5, 0]} scale={[380, 380, 380]} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={SKY_ATMOSPHERE_VERT}
        fragmentShader={SKY_ATMOSPHERE_FRAG}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function DayNightRig({
  far,
  area,
  hemiGround,
  turbidity,
  rayleigh,
}: {
  far: number;
  area: number;
  hemiGround: string;
  turbidity: number;
  rayleigh: number;
}) {
  const { scene, gl } = useThree();
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const quality = useSettings((s) => s.quality);
  const resolved = resolveQuality(quality, mobile.tier);
  const cfg = qualityConfig(quality, mobile.tier);
  const isHigh = resolved === 'high';
  const minutes = useGame((s) => s.clock.minutes);

  const cur = useRef<{ sun: [number, number, number]; sunIntensity: number; ambient: number; hemi: number } | null>(null);
  const sunColor = useRef(new THREE.Color(0xfff7ea));
  const bgColor = useRef(new THREE.Color(0xa8c2d6));
  const fogColor = useRef(new THREE.Color(0xb6c8d6));
  const scratch = useRef(new THREE.Color());

  // Configure high-precision soft shadows & shadow bias to eliminate acne/peter-panning
  useEffect(() => {
    const l = sunRef.current;
    if (!l) return;
    const size = cfg.shadowMapSize;
    l.shadow.bias = -0.00035;
    l.shadow.normalBias = 0.022;
    l.shadow.radius = isHigh ? 2.5 : 1.0;
    if (isHigh && gl.shadowMap.type !== THREE.PCFSoftShadowMap) {
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.shadowMap.needsUpdate = true;
    }
    if (l.shadow.mapSize.x !== size) {
      l.shadow.map?.dispose();
      l.shadow.map = null;
      l.shadow.mapSize.set(size, size);
      l.shadow.needsUpdate = true;
    }
  }, [cfg, isHigh, gl]);

  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.05);
    const target = skyStateFor(useGame.getState().clock.minutes);
    if (!cur.current) {
      cur.current = {
        sun: [...target.sun] as [number, number, number],
        sunIntensity: target.sunIntensity,
        ambient: target.ambient,
        hemi: target.hemi,
      };
    }
    const c = cur.current;
    const k = 1 - Math.exp(-1.8 * dt);
    c.sun[0] += (target.sun[0] - c.sun[0]) * k;
    c.sun[1] += (target.sun[1] - c.sun[1]) * k;
    c.sun[2] += (target.sun[2] - c.sun[2]) * k;
    c.sunIntensity += (target.sunIntensity - c.sunIntensity) * k;
    c.ambient += (target.ambient - c.ambient) * k;
    c.hemi += (target.hemi - c.hemi) * k;
    sunColor.current.lerp(scratch.current.setHex(target.sunColor), k);
    bgColor.current.lerp(scratch.current.setHex(target.bg), k);
    fogColor.current.lerp(scratch.current.setHex(target.fog), k);

    const sun = sunRef.current;
    if (sun) {
      sun.position.set(c.sun[0], c.sun[1], c.sun[2]);
      sun.intensity = c.sunIntensity * (isHigh ? 1.12 : 1.0);
      sun.color.copy(sunColor.current);
    }
    if (fillRef.current) {
      // Opposite sky bounce / rim light for realistic 3D volume on characters & buildings
      fillRef.current.position.set(-c.sun[0] * 0.6, Math.max(12, c.sun[1] * 0.5), -c.sun[2] * 0.6);
      fillRef.current.intensity = c.hemi * (isHigh ? 0.65 : 0.35);
    }
    if (ambRef.current) ambRef.current.intensity = c.ambient;
    if (hemiRef.current) hemiRef.current.intensity = c.hemi * (isHigh ? 1.15 : 1.0);
    if (scene.background instanceof THREE.Color) scene.background.copy(bgColor.current);
    else scene.background = bgColor.current.clone();
    if (scene.fog && 'color' in scene.fog) (scene.fog as THREE.Fog).color.copy(fogColor.current);
  });

  const sky = skyStateFor(minutes);
  return (
    <>
      <directionalLight
        ref={sunRef}
        position={sky.sun}
        intensity={sky.sunIntensity}
        color={sky.sunColor}
        castShadow={cfg.shadows}
        shadow-mapSize={[cfg.shadowMapSize, cfg.shadowMapSize]}
        shadow-camera-near={1}
        shadow-camera-far={far}
        shadow-camera-left={-area}
        shadow-camera-right={area}
        shadow-camera-top={area}
        shadow-camera-bottom={-area}
      />
      {/* Indirect sky bounce / rim fill light */}
      <directionalLight ref={fillRef} position={[-30, 25, -25]} intensity={sky.hemi * 0.55} color="#b8d4f2" />
      <ambientLight ref={ambRef} intensity={sky.ambient} />
      <hemisphereLight ref={hemiRef} args={['#dbeafe', hemiGround, sky.hemi]} />
      {cfg.sky && (
        <>
          <Sky
            distance={4500}
            sunPosition={sky.sun}
            turbidity={isHigh ? turbidity * 0.85 : turbidity}
            rayleigh={isHigh ? rayleigh * 1.25 : rayleigh}
            mieCoefficient={0.005}
            mieDirectionalG={0.88}
          />
          <RealisticSkyDome isHigh={isHigh} />
        </>
      )}
    </>
  );
}

function TimeFlow() {
  const acc = useRef(0);
  useFrame((_, deltaRaw) => {
    const dt = Math.min(deltaRaw, 0.25);
    const game = useGame.getState();
    if (game.mode !== 'GAMEPLAY') return;
    acc.current += dt;
    if (acc.current < FREE_ROAM_STEP_SEC) return;
    acc.current = 0;
    const step = freeRoamStep(game.clock.minutes);
    if (step > 0) game.advanceTime(step);
  });
  return null;
}

const SCENE_VIEWS: Record<SceneId, ComponentType> = {
  campus: CampusScene,
  rooftop: RooftopScene,
  warehouse: WarehouseScene,
};

export function World() {
  const scene = useGame((s) => s.scene);
  const View = SCENE_VIEWS[scene] ?? CampusScene;
  return <View />;
}

function CampusScene() {
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  const envRes = cfg.envRes ?? 128;
  return (
    <>
      <fog attach="fog" args={['#b6c8d6', cfg.fogNear, cfg.fogFar]} />
      <DayNightRig far={240} area={75} hemiGround="#4b5f45" turbidity={4.2} rayleigh={1.55} />
      <CampusWorld />
      <ObjectiveWaypoint />
      <TimeFlow />
      {cfg.envMul > 0 && (
        <Environment frames={1} resolution={envRes} environmentIntensity={0.52 * cfg.envMul}>
          <color attach="background" args={['#8fb2cc']} />
          {/* Warm zenith sun diffuser */}
          <Lightformer intensity={2.8} position={[0, 8, 2]} scale={[14, 14, 1]} rotation-x={Math.PI / 2} color="#fff5e4" />
          {/* Cool atmospheric sky dome fill */}
          <Lightformer intensity={1.25} position={[-10, 4, 8]} scale={[8, 4, 1]} color="#c4e0ff" />
          <Lightformer intensity={1.25} position={[10, 4, -8]} scale={[8, 4, 1]} color="#e0eeff" />
          {/* Warm horizon & ground bounce */}
          <Lightformer intensity={0.85} position={[0, 1.2, 12]} scale={[14, 2.5, 1]} color="#ffdcb8" />
          <Lightformer intensity={0.65} position={[0, -4, 0]} scale={[16, 16, 1]} rotation-x={-Math.PI / 2} color="#6c7d65" />
        </Environment>
      )}
    </>
  );
}

function RooftopScene() {
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  const envRes = cfg.envRes ?? 128;
  return (
    <>
      <fog attach="fog" args={['#aecbdd', Math.max(40, cfg.fogNear - 15), Math.min(cfg.fogFar, 320)]} />
      <DayNightRig far={180} area={45} hemiGround="#5a6a72" turbidity={3.6} rayleigh={1.35} />
      <RooftopWorld />
      {cfg.envMul > 0 && (
        <Environment frames={1} resolution={envRes} environmentIntensity={0.58 * cfg.envMul}>
          <color attach="background" args={['#9fc0d8']} />
          <Lightformer intensity={3.0} position={[0, 8, 0]} scale={[16, 16, 1]} rotation-x={Math.PI / 2} color="#fff7ea" />
          <Lightformer intensity={1.1} position={[12, 3, 0]} scale={[10, 4, 1]} rotation-y={-Math.PI / 3} color="#d0e6ff" />
          <Lightformer intensity={0.85} position={[0, 0.8, -12]} scale={[14, 3.5, 1]} color="#ffdfc2" />
        </Environment>
      )}
    </>
  );
}

function WarehouseScene() {
  const quality = useSettings((s) => s.quality);
  const cfg = qualityConfig(quality, mobile.tier);
  const envRes = cfg.envRes ?? 128;
  return (
    <>
      <color attach="background" args={['#07090c']} />
      <fog attach="fog" args={['#0a0d11', 10, 42]} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={['#3c4654', '#1a1c20', 0.65]} />
      <directionalLight
        position={[2, 12, -4]}
        intensity={0.95}
        color="#9db8d9"
        castShadow={cfg.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 8, 10]} intensity={0.45} color="#7d8ba0" />
      <WarehouseWorld />
      {cfg.envMul > 0 && (
        <Environment frames={1} resolution={envRes} environmentIntensity={0.38 * cfg.envMul}>
          <color attach="background" args={['#0a0d11']} />
          <Lightformer intensity={2.0} position={[0, 6, 0]} scale={[8, 8, 1]} rotation-x={Math.PI / 2} color="#bcd6e8" />
          <Lightformer intensity={0.7} position={[0, 1, 8]} scale={[6, 2, 1]} color="#7d8ba0" />
        </Environment>
      )}
    </>
  );
}
