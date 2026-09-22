import { useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mobile } from '../mobile';
import { useSettings } from '../../stores/settingsStore';
import { lowSpecProfile } from '../quality';
import { acting, tickActing, type ActingState } from '../systems/acting';
import type { HoldKind } from '../../types';

// v0.14.3: cloth weave normal/rough maps cost fragment work on every
// character pixel (19 figures × ~30 meshes on screen). Materials are cached
// per color at creation, so the profile is read ONCE at boot — a preset
// switch applies on the next session (same boot-time semantics as AA/segments).
const BOOT_LOW = lowSpecProfile(useSettings.getState().quality, mobile.tier);

// Animatable runtime state shared between owner controller and figure.
export type FigureAnim = {
  speed: number;      // horizontal speed (m/s)
  run: boolean;
  attackT: number;    // 0..1 progress while attacking, -1 = idle
  block: boolean;
  hurtT: number;      // 0..1 hurt flash, -1 = idle
  down: boolean;      // KO
  sit: boolean;       // v0.12.0: seated pose (chairs / desks)
  crouch: boolean;    // v0.12.0: crouched pose (picking things up)
};

export const makeAnim = (): FigureAnim => ({
  speed: 0,
  run: false,
  attackT: -1,
  block: false,
  hurtT: -1,
  down: false,
  sit: false,
  crouch: false,
});

type Props = {
  anim: MutableRefObject<FigureAnim>;
  color: string;      // top / uniform color
  accent: string;     // collar / tie accent
  scale?: number;
  nameTag?: string;
  tag?: string;
  // dialogue acting (mentor #3): entity key in systems/acting registry.
  // Present = this figure looks/gestures/nods during conversations.
  actId?: string;
  // v0.12.0: story prop rendered in the right hand (declarative — owners
  // re-render with a new hold when the scene's cast changes)
  hold?: HoldKind;
  // stylized-realistic overrides (data/npcs.ts NpcDef)
  skin?: string;
  pants?: string;
  skirt?: string;     // presence swaps legwear for a skirt
  hair?: { color: string; style: 'short' | 'wave' | 'ponytail' | 'buzz' };
};

const SKIN_DEFAULT = '#f2c9a4';
const HAIR_DEFAULT = '#1f2937';
const PANTS_DEFAULT = '#233043';

// ============================================================================
// v0.5.0 CHARACTER OVERHAUL — stylized-realistic + PBR + mobile-safe labels
//
// ROOT-CAUSE FIX (mobile blank world): the old nameTag used drei <Text>
// (troika), which downloads its default Roboto font from a CDN at runtime.
// On a phone network that fetch hangs → the component suspends → React hides
// the ENTIRE canvas subtree (no Suspense boundary between Physics and the
// NPC list) → sky-colored blank world while the DOM UI kept working. That is
// exactly the reported bug. Name tags are now canvas-sprite based: zero
// network, zero suspense, zero GLB.
//
// Also in this overhaul:
//  - shared procedural PBR maps (fabric weave normal + roughness variation),
//    cached per material — one texture set serves every character
//  - face upgrade: sclera + iris + catchlight, nose, mouth
//  - neck + shoulder + hips structure for a better silhouette
//  - tier-aware segment counts / shadow casting (mobile.friendly)
// ============================================================================

// ---------- procedural PBR texture factory (shared, lazy, cached) ----------

let weaveN: THREE.CanvasTexture | null = null;
let weaveR: THREE.CanvasTexture | null = null;

function makeWeave(kind: 'normal' | 'rough'): THREE.CanvasTexture {
  const S = 128;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  if (kind === 'normal') {
    // neutral flat base
    g.fillStyle = '#8080ff';
    g.fillRect(0, 0, S, S);
    // woven over/under threads — horizontal strips displace up, vertical down
    const th = 8; // thread thickness px
    for (let y = 0; y < S; y += th * 2) {
      for (let x = 0; x < S; x += th * 2) {
        // horizontal thread (bump out)
        const grd = g.createLinearGradient(0, y, 0, y + th);
        grd.addColorStop(0, '#6f6fee');
        grd.addColorStop(0.5, '#9f9fff');
        grd.addColorStop(1, '#6f6fee');
        g.fillStyle = grd;
        g.fillRect(x, y, th * 2, th);
        // vertical thread (bump in)
        const grd2 = g.createLinearGradient(x, 0, x + th, 0);
        grd2.addColorStop(0, '#5a5ae0');
        grd2.addColorStop(0.5, '#7676ea');
        grd2.addColorStop(1, '#5a5ae0');
        g.fillStyle = grd2;
        g.fillRect(x, y + th, th, th);
      }
    }
  } else {
    // roughness variation: mid-rough base with speckled pills/wear
    g.fillStyle = '#a8a8a8';
    g.fillRect(0, 0, S, S);
    for (let i = 0; i < 900; i++) {
      const v = 140 + Math.floor(Math.random() * 90);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(Math.random() * S, Math.random() * S, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function weaveNormal() {
  if (!weaveN) weaveN = typeof document === 'undefined' ? null : makeWeave('normal');
  return weaveN;
}
function weaveRough() {
  if (!weaveR) weaveR = typeof document === 'undefined' ? null : makeWeave('rough');
  return weaveR;
}

// ---------- shared material cache (one GL program per kind+color) ----------

const matCache = new Map<string, THREE.MeshStandardMaterial>();

function fabricMat(color: string, rough = 0.68): THREE.MeshStandardMaterial {
  const key = `fab|${color}|${rough}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: rough,
      metalness: 0.0,
      normalMap: BOOT_LOW ? undefined : (weaveNormal() ?? undefined),
      normalScale: new THREE.Vector2(0.55, 0.55),
      roughnessMap: BOOT_LOW ? undefined : (weaveRough() ?? undefined),
      envMapIntensity: 0.5,
    });
    matCache.set(key, m);
  }
  return m;
}

function skinMat(color: string): THREE.MeshStandardMaterial {
  const key = `skin|${color}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.0, envMapIntensity: 0.75 });
    matCache.set(key, m);
  }
  return m;
}

function hairMat(color: string): THREE.MeshStandardMaterial {
  const key = `hair|${color}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.05, envMapIntensity: 0.65 });
    matCache.set(key, m);
  }
  return m;
}

function hardMat(color: string, rough = 0.4): THREE.MeshStandardMaterial {
  const key = `hard|${color}|${rough}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02, envMapIntensity: 0.55 });
    matCache.set(key, m);
  }
  return m;
}

// ---------- component ----------

export function Figure({ anim, color, accent, scale = 1, nameTag, tag, actId, hold, skin = SKIN_DEFAULT, pants = PANTS_DEFAULT, skirt, hair }: Props) {
  const root = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const phase = useRef(0);
  const wp = useRef(new THREE.Vector3());
  const poseT = useRef({ sit: 0, crouch: 0 }); // smoothed 0..1 blend

  const hairColor = hair?.color ?? HAIR_DEFAULT;

  // tier-aware budgets
  const seg = mobile.seg;             // { cyl, cap, sph }
  const SH = !mobile.lowSpec;         // shadow casting on decent GPUs only

  const fab = fabricMat(color);
  const fabAccent = fabricMat(accent, 0.5);
  const fabPants = fabricMat(pants, 0.74);
  const fabSkirt = skirt ? fabricMat(skirt, 0.7) : null;
  const mSkin = skinMat(skin);
  const mHair = hairMat(hairColor);
  const mShoe = hardMat('#14161c', 0.42);
  const mSole = hardMat('#0c0d11', 0.6);
  const mEyeDark = hardMat('#1a1c22', 0.25);

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

    // ---- v0.12.0 sit / crouch pose blending ----
    const p = poseT.current;
    p.sit = THREE.MathUtils.lerp(p.sit, a.sit ? 1 : 0, 1 - Math.exp(-9 * dt));
    p.crouch = THREE.MathUtils.lerp(p.crouch, !a.sit && a.crouch ? 1 : 0, 1 - Math.exp(-9 * dt));
    // sit: hips drop onto the chair seat (seat ≈ 0.44) — root offset -0.13
    // crouch: knees fold, body lowers 0.34 and leans forward
    g.position.y = THREE.MathUtils.lerp(g.position.y, -0.13 * p.sit - 0.34 * p.crouch, 1 - Math.exp(-10 * dt));

    const moving = a.speed > 0.15;
    const stride = a.run ? 11 : 7.5;
    phase.current += dt * (moving ? stride * Math.max(0.35, a.speed / 3.2) : 1.6);

    // ---- dialogue acting (mentor #3): timers + gesture/nod scheduling ----
    let act: ActingState | undefined;
    if (actId) {
      act = acting[actId];
      if (act) tickActing(act, dt, moving || p.sit > 0.5 || p.crouch > 0.5);
    }
    // additive gesture offsets resolved below (amp × sin envelope = smooth in/out)
    let gLx = 0, gLz = 0, gRx = 0, gRz = 0;
    if (act && act.gesture >= 0 && !moving && p.sit < 0.5 && p.crouch < 0.5) {
      const env = Math.sin(Math.min(1, act.gestureT) * Math.PI) * act.energy;
      if (act.gesture === 0) {
        // open palm — right forearm rises, hand turns slightly outward
        gRx = -0.5 * env; gRz = 0.28 * env;
      } else if (act.gesture === 1) {
        // emphasis — a short forward punch of the right arm
        gRx = -0.9 * env;
      } else {
        // reserved/emotional — hand to chest (left)
        gLx = -0.8 * env; gLz = 0.45 * env;
      }
    }

    // legs: walk swing, or pose override (sit = thighs forward, crouch = folded)
    const legPose = p.sit * -1.42 + p.crouch * 0.85;
    const swing = moving ? Math.sin(phase.current) * (a.run ? 0.85 : 0.55) : Math.sin(phase.current * 0.6) * 0.05;
    if (legL.current) legL.current.rotation.x = legPose + swing * (1 - Math.max(p.sit, p.crouch));
    if (legR.current) legR.current.rotation.x = legPose - swing * (1 - Math.max(p.sit, p.crouch));
    const atk = a.attackT >= 0 ? Math.sin(Math.min(1, a.attackT) * Math.PI) : 0;
    // two-hand props reach across with the left arm; phone raises the right
    const twoHand = hold === 'stack' || hold === 'book' || hold === 'map';
    const armPose = p.sit * -0.95 + p.crouch * -0.62; // rest forward on desk / reach down
    if (armL.current) {
      if (a.block) {
        armL.current.rotation.x = -1.9;
        armL.current.rotation.z = 0.5;
      } else {
        const base = twoHand ? -0.85 : 0;
        armL.current.rotation.x = armPose + base * (1 - Math.max(p.sit, p.crouch)) - swing * 0.8 * (1 - Math.max(p.sit, p.crouch)) + gLx;
        armL.current.rotation.z = gLz;
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
        const base = hold === 'phone' ? -1.18 : twoHand ? -0.85 : 0;
        armR.current.rotation.x = armPose + base * (1 - Math.max(p.sit, p.crouch)) + swing * 0.8 * (1 - Math.max(p.sit, p.crouch)) + gRx;
        armR.current.rotation.z = gRz;
      }
    }
    if (torso.current) {
      const lean = act && act.talking && !moving ? 0.05 * act.energy : 0;
      torso.current.rotation.y = moving ? Math.sin(phase.current) * 0.12 : Math.sin(phase.current * 0.6) * 0.03;
      torso.current.rotation.x = a.attackT >= 0 ? -atk * 0.35
        : p.crouch * 0.5 + (moving ? 0.08 + (a.run ? 0.1 : 0) : lean);
      const bob = moving ? Math.abs(Math.sin(phase.current)) * (a.run ? 0.05 : 0.03) : Math.sin(phase.current * 0.55) * 0.006; // idle: gentle breathing
      torso.current.position.y = 0.92 + bob;
    }
    if (head.current) {
      if (act && !Number.isNaN(act.gazeX)) {
        // gaze: yaw the head toward the conversation partner (world → local)
        g.getWorldPosition(wp.current);
        const desired = Math.atan2(act.gazeX - wp.current.x, act.gazeZ - wp.current.z);
        const parentYaw = g.parent?.rotation.y ?? 0;
        let local = desired - parentYaw;
        local = Math.atan2(Math.sin(local), Math.cos(local)); // wrap to [-π, π]
        const clamped = THREE.MathUtils.clamp(local, -0.62, 0.62);
        const sway = moving ? 0 : Math.sin(phase.current * 0.35) * 0.03;
        head.current.rotation.y = THREE.MathUtils.lerp(head.current.rotation.y, clamped + sway, 1 - Math.exp(-7 * dt));
      } else {
        head.current.rotation.y = moving ? 0 : Math.sin(phase.current * 0.35) * 0.14;
      }
      // listening nod (two quick dips) — reading state, tiny amplitude
      const nodX = act && act.nodT >= 0 ? Math.sin(act.nodT * Math.PI * 2) * 0.1 * (0.5 + act.energy * 0.5) : 0;
      head.current.rotation.x = THREE.MathUtils.lerp(head.current.rotation.x, nodX, 1 - Math.exp(-10 * dt));
    }
    if (mouth.current) {
      // speech: mouth opens/closes on the talk phase; silent when not talking
      const open = act && act.talking && !moving ? Math.abs(Math.sin(act.talkPhase)) * 2.1 * act.energy : 0;
      mouth.current.scale.y = THREE.MathUtils.lerp(mouth.current.scale.y, 1 + open, 1 - Math.exp(-14 * dt));
    }
  });

  return (
    <group ref={root} scale={scale}>
      <group ref={torso} position={[0, 0.92, 0]}>
        {/* torso — flattened capsule for a natural chest silhouette */}
        <mesh castShadow={SH} position={[0, 0.02, 0]} scale={[1.12, 1, 0.86]} material={fab}>
          <capsuleGeometry args={[0.155, 0.34, seg.cap, seg.cap + 4]} />
        </mesh>
        {/* hips block grounds the torso into the legs */}
        <mesh position={[0, -0.235, 0]} material={skirt ? fabSkirt! : fabPants}>
          <cylinderGeometry args={[0.128, 0.146, 0.1, seg.cyl]} />
        </mesh>
        {/* shirt hem shadow band */}
        <mesh position={[0, -0.205, 0]}>
          <cylinderGeometry args={[0.15, 0.154, 0.05, seg.cyl]} />
          <meshStandardMaterial color="#00000033" transparent opacity={0.16} roughness={0.85} />
        </mesh>
        {/* collar — V pair */}
        <mesh position={[-0.052, 0.245, 0.068]} rotation={[0.35, 0, 0.5]} material={fabAccent}>
          <boxGeometry args={[0.085, 0.045, 0.016]} />
        </mesh>
        <mesh position={[0.052, 0.245, 0.068]} rotation={[0.35, 0, -0.5]} material={fabAccent}>
          <boxGeometry args={[0.085, 0.045, 0.016]} />
        </mesh>
        {/* tie */}
        <mesh position={[0, 0.16, 0.128]} rotation={[0.06, 0, 0]} material={fabAccent}>
          <coneGeometry args={[0.034, 0.15, 8]} />
        </mesh>
        <mesh position={[0, 0.245, 0.125]} rotation={[0.06, 0, 0]} material={fabAccent}>
          <boxGeometry args={[0.05, 0.045, 0.024]} />
        </mesh>
        {/* buttons */}
        <mesh position={[0, 0.06, 0.136]} material={hardMat('#e8eaf0', 0.3)}>
          <sphereGeometry args={[0.011, 6, 6]} />
        </mesh>
        <mesh position={[0, -0.04, 0.14]} material={hardMat('#e8eaf0', 0.3)}>
          <sphereGeometry args={[0.011, 6, 6]} />
        </mesh>

        {/* neck */}
        <mesh position={[0, 0.315, 0.005]} material={mSkin}>
          <cylinderGeometry args={[0.042, 0.05, 0.12, seg.cap]} />
        </mesh>

        {/* head group: skull + face + hair */}
        <group ref={head} position={[0, 0.5, 0]}>
          <mesh castShadow={SH} scale={[1, 1.1, 1.02]} material={mSkin}>
            <sphereGeometry args={[0.155, seg.sph, seg.sph - 4]} />
          </mesh>
          {/* jaw */}
          <mesh position={[0, -0.09, 0.02]} scale={[0.82, 0.6, 0.85]} material={mSkin}>
            <sphereGeometry args={[0.14, seg.sph - 4, seg.sph - 6]} />
          </mesh>
          {/* ears */}
          <mesh position={[-0.152, 0.0, 0.0]} scale={[0.4, 0.7, 0.55]} material={mSkin}>
            <sphereGeometry args={[0.05, 8, 8]} />
          </mesh>
          <mesh position={[0.152, 0.0, 0.0]} scale={[0.4, 0.7, 0.55]} material={mSkin}>
            <sphereGeometry args={[0.05, 8, 8]} />
          </mesh>
          {/* eyes — sclera + iris + catchlight */}
          {[-1, 1].map((s) => (
            <group key={s} position={[0.054 * s, 0.015, 0.128]}>
              <mesh material={hardMat('#f4f5f7', 0.25)}>
                <sphereGeometry args={[0.022, 10, 10]} />
              </mesh>
              <mesh position={[0, 0, 0.014]} material={mEyeDark}>
                <sphereGeometry args={[0.012, 8, 8]} />
              </mesh>
              <mesh position={[0.004 * s, 0.005, 0.022]} material={hardMat('#ffffff', 0.1)}>
                <sphereGeometry args={[0.004, 6, 6]} />
              </mesh>
            </group>
          ))}
          {/* brows */}
          <mesh position={[-0.055, 0.066, 0.132]} rotation={[0, 0, 0.12]} material={mHair}>
            <boxGeometry args={[0.048, 0.01, 0.012]} />
          </mesh>
          <mesh position={[0.055, 0.066, 0.132]} rotation={[0, 0, -0.12]} material={mHair}>
            <boxGeometry args={[0.048, 0.01, 0.012]} />
          </mesh>
          {/* nose */}
          <mesh position={[0, -0.022, 0.152]} rotation={[0.35, 0, 0]} material={mSkin}>
            <boxGeometry args={[0.022, 0.042, 0.03]} />
          </mesh>
          {/* mouth — ref-driven so dialogue acting can open/close it */}
          <mesh ref={mouth} position={[0, -0.072, 0.143]} material={hardMat('#9a4f46', 0.5)}>
            <boxGeometry args={[0.05, 0.009, 0.012]} />
          </mesh>
          {/* hair variants */}
          <Hair color={hairColor} style={hair?.style ?? 'short'} mats={{ m: mHair, seg }} />
        </group>

        {/* shoulders */}
        <mesh position={[-0.235, 0.22, 0]} material={fab}>
          <sphereGeometry args={[0.062, seg.sph - 6, seg.sph - 8]} />
        </mesh>
        <mesh position={[0.235, 0.22, 0]} material={fab}>
          <sphereGeometry args={[0.062, seg.sph - 6, seg.sph - 8]} />
        </mesh>
        {/* arms — capsule upper (rolled sleeve) + skin forearm + hand */}
        <group ref={armL} position={[-0.235, 0.22, 0]}>
          <mesh castShadow={SH} position={[0, -0.09, 0]} material={fab}>
            <capsuleGeometry args={[0.055, 0.1, seg.cap - 2, seg.cap]} />
          </mesh>
          <mesh position={[0, -0.26, 0]} material={mSkin}>
            <capsuleGeometry args={[0.044, 0.2, seg.cap - 2, seg.cap - 2]} />
          </mesh>
          <mesh position={[0, -0.4, 0]} material={mSkin}>
            <sphereGeometry args={[0.055, seg.cap, seg.cap]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.235, 0.22, 0]}>
          <mesh castShadow={SH} position={[0, -0.09, 0]} material={fab}>
            <capsuleGeometry args={[0.055, 0.1, seg.cap - 2, seg.cap]} />
          </mesh>
          <mesh position={[0, -0.26, 0]} material={mSkin}>
            <capsuleGeometry args={[0.044, 0.2, seg.cap - 2, seg.cap - 2]} />
          </mesh>
          <mesh position={[0, -0.4, 0]} material={mSkin}>
            <sphereGeometry args={[0.055, seg.cap, seg.cap]} />
          </mesh>
          {hold && <HoldProp kind={hold} seg={seg} />}
        </group>
      </group>

      {/* legs (or skirt + lower legs) */}
      {skirt ? (
        <>
          {/* pleated skirt: flared cylinder + hem band */}
          <mesh position={[0, 0.6, 0]} castShadow={SH} material={fabSkirt!}>
            <cylinderGeometry args={[0.2, 0.285, 0.44, seg.cyl + 4, 1, true]} />
          </mesh>
          <mesh position={[0, 0.385, 0]} material={hardMat('#00000055', 0.8)}>
            <cylinderGeometry args={[0.286, 0.286, 0.018, seg.cyl + 4, 1, true]} />
          </mesh>
          <group ref={legL} position={[-0.09, 0.45, 0]}>
            <mesh castShadow={SH} position={[0, -0.19, 0]} material={mSkin}>
              <capsuleGeometry args={[0.045, 0.24, seg.cap - 2, seg.cap - 2]} />
            </mesh>
            {/* sock + shoe */}
            <mesh position={[0, -0.325, 0]} material={hardMat('#e9edf2', 0.6)}>
              <cylinderGeometry args={[0.047, 0.047, 0.07, seg.cyl]} />
            </mesh>
            <mesh position={[0, -0.372, 0.03]} material={mShoe}>
              <boxGeometry args={[0.1, 0.055, 0.2]} />
            </mesh>
            <mesh position={[0, -0.404, 0.03]} material={mSole}>
              <boxGeometry args={[0.104, 0.012, 0.206]} />
            </mesh>
          </group>
          <group ref={legR} position={[0.09, 0.45, 0]}>
            <mesh castShadow={SH} position={[0, -0.19, 0]} material={mSkin}>
              <capsuleGeometry args={[0.045, 0.24, seg.cap - 2, seg.cap - 2]} />
            </mesh>
            <mesh position={[0, -0.325, 0]} material={hardMat('#e9edf2', 0.6)}>
              <cylinderGeometry args={[0.047, 0.047, 0.07, seg.cyl]} />
            </mesh>
            <mesh position={[0, -0.372, 0.03]} material={mShoe}>
              <boxGeometry args={[0.1, 0.055, 0.2]} />
            </mesh>
            <mesh position={[0, -0.404, 0.03]} material={mSole}>
              <boxGeometry args={[0.104, 0.012, 0.206]} />
            </mesh>
          </group>
        </>
      ) : (
        <>
          <group ref={legL} position={[-0.1, 0.63, 0]}>
            <mesh castShadow={SH} position={[0, -0.33, 0]} material={fabPants}>
              <capsuleGeometry args={[0.062, 0.52, seg.cap - 2, seg.cap]} />
            </mesh>
            <mesh position={[0, -0.62, 0.035]} material={mShoe}>
              <boxGeometry args={[0.11, 0.06, 0.21]} />
            </mesh>
            <mesh position={[0, -0.655, 0.035]} material={mSole}>
              <boxGeometry args={[0.114, 0.012, 0.216]} />
            </mesh>
          </group>
          <group ref={legR} position={[0.1, 0.63, 0]}>
            <mesh castShadow={SH} position={[0, -0.33, 0]} material={fabPants}>
              <capsuleGeometry args={[0.062, 0.52, seg.cap - 2, seg.cap]} />
            </mesh>
            <mesh position={[0, -0.62, 0.035]} material={mShoe}>
              <boxGeometry args={[0.11, 0.06, 0.21]} />
            </mesh>
            <mesh position={[0, -0.655, 0.035]} material={mSole}>
              <boxGeometry args={[0.114, 0.012, 0.216]} />
            </mesh>
          </group>
        </>
      )}
      {nameTag && <NameTagSprite text={nameTag} tag={tag} y={skirt ? 1.52 : 1.85} />}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Canvas-sprite name tag — ZERO network, ZERO suspense (troika/drei <Text>
// fetched a Roboto webfont at runtime; on mobile networks that fetch hung and
// hid the whole canvas subtree = the blank-world bug).
// ---------------------------------------------------------------------------
function NameTagSprite({ text, tag, y }: { text: string; tag?: string; y: number }) {
  const tex = useRef<THREE.CanvasTexture | null>(null);
  if (!tex.current && typeof document !== 'undefined') {
    const W = 512;
    const H = tag ? 160 : 128;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = 'rgba(10,13,20,0.72)';
    roundRect(g, 6, 6, W - 12, H - 12, 18);
    g.fill();
    g.strokeStyle = 'rgba(245,158,11,0.85)';
    g.lineWidth = 4;
    roundRect(g, 6, 6, W - 12, H - 12, 18);
    g.stroke();
    g.textAlign = 'center';
    g.fillStyle = '#f1f3f9';
    g.font = '700 56px "Space Grotesk", Arial, sans-serif';
    g.fillText(text, W / 2, tag ? 68 : 86);
    if (tag) {
      g.fillStyle = '#f59e0b';
      g.font = '600 34px "JetBrains Mono", monospace';
      g.fillText(tag, W / 2, 122);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    tex.current = t;
  }
  const w = 1.35;
  const h = tag ? 0.42 : 0.34;
  return (
    <sprite position={[0, y, 0]} scale={[w, h, 1]}>
      <spriteMaterial map={tex.current ?? undefined} transparent depthTest={false} />
    </sprite>
  );
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------------------------------------------------------------------------
// v0.12.0 — HoldProp: prop cerita kecil di tangan kanan figur. Semua material
// memakai cache hardMat/fabricMat agar tidak menambah GL program.
//   pencil — alat tulis; eraser — penghapus (scene 2); book — buku catatan
//   dibaca; map — map merah berkas pindahan; stack — tumpukan buku Aris;
//   bottle — botol minum; phone — ponsel Siti (rekaman).
// ---------------------------------------------------------------------------
function HoldProp({ kind, seg }: { kind: HoldKind; seg: { cyl: number; cap: number; sph: number } }) {
  const hand: [number, number, number] = [0.0, -0.42, 0.03];
  if (kind === 'pencil') {
    return (
      <group position={hand} rotation={[1.25, 0, 0.2]}>
        <mesh castShadow position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.011, 0.011, 0.17, 8]} />
          <meshStandardMaterial color="#e8a33d" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.115, 0]}>
          <coneGeometry args={[0.011, 0.03, 8]} />
          <meshStandardMaterial color="#d9c9a3" roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (kind === 'eraser') {
    return (
      <group position={hand}>
        <mesh castShadow>
          <boxGeometry args={[0.055, 0.024, 0.036]} />
          <meshStandardMaterial color="#eef2f7" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0, -0.012]}>
          <boxGeometry args={[0.056, 0.025, 0.014]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.55} />
        </mesh>
      </group>
    );
  }
  if (kind === 'book') {
    return (
      <group position={[0.02, -0.4, 0.12]} rotation={[0.55, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.026, 0.17]} />
          <meshStandardMaterial color="#5a4a35" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.004, 0.004]}>
          <boxGeometry args={[0.215, 0.02, 0.15]} />
          <meshStandardMaterial color="#e7dcc3" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.016, 0]}>
          <boxGeometry args={[0.012, 0.024, 0.172]} />
          <meshStandardMaterial color="#3f352a" roughness={0.7} />
        </mesh>
      </group>
    );
  }
  if (kind === 'map') {
    return (
      <group position={[0.01, -0.38, 0.1]} rotation={[0.5, 0, 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.012, 0.34]} />
          <meshStandardMaterial color="#b3282d" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.008, 0]}>
          <boxGeometry args={[0.225, 0.004, 0.3]} />
          <meshStandardMaterial color="#f1e8d8" roughness={0.85} />
        </mesh>
      </group>
    );
  }
  if (kind === 'stack') {
    // tumpukan buku catatan tebal — digenggam depan dada (dua tangan)
    return (
      <group position={[0.05, -0.38, 0.14]} rotation={[0.35, 0.15, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.05, 0.22]} />
          <meshStandardMaterial color="#d9c9a3" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.015, 0.05, 0.01]} rotation={[0, 0.12, 0]}>
          <boxGeometry args={[0.28, 0.045, 0.2]} />
          <meshStandardMaterial color="#5a7ea0" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.01, 0.092, -0.01]} rotation={[0, -0.08, 0]}>
          <boxGeometry args={[0.26, 0.04, 0.19]} />
          <meshStandardMaterial color="#6b8f6a" roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (kind === 'bottle') {
    return (
      <group position={hand}>
        <mesh castShadow position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.042, 0.046, 0.2, seg.cyl]} />
          <meshStandardMaterial color="#8ec7e8" roughness={0.15} metalness={0.1} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.035, 8]} />
          <meshStandardMaterial color="#2f6db1" roughness={0.5} />
        </mesh>
      </group>
    );
  }
  // phone — layar menyala tipis (Siti merekam)
  return (
    <group position={[0.005, -0.4, 0.05]} rotation={[0.35, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.078, 0.155, 0.012]} />
        <meshStandardMaterial color="#11151c" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.008]}>
        <boxGeometry args={[0.066, 0.135, 0.004]} />
        <meshStandardMaterial color="#7fb7d9" emissive="#9fd3ef" emissiveIntensity={0.55} roughness={0.25} />
      </mesh>
    </group>
  );
}

// Procedural hair styles. Positioned relative to the head group (skull r≈0.155).
function Hair({ color: _color, style, mats }: { color: string; style: 'short' | 'wave' | 'ponytail' | 'buzz'; mats: { m: THREE.MeshStandardMaterial; seg: { cyl: number; cap: number; sph: number } } }) {
  const { m, seg } = mats;
  if (style === 'buzz') {
    return (
      <mesh position={[0, 0.035, -0.005]} scale={[1.02, 1.02, 1.04]} material={m}>
        <sphereGeometry args={[0.156, seg.sph - 4, seg.sph - 8, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>
    );
  }
  if (style === 'wave') {
    return (
      <group>
        <mesh position={[0, 0.03, -0.005]} scale={[1.06, 1.04, 1.08]} material={m}>
          <sphereGeometry args={[0.156, seg.sph - 4, seg.sph - 6, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        </mesh>
        {/* back volume */}
        <mesh position={[0, -0.03, -0.09]} scale={[1, 1.25, 0.7]} material={m}>
          <sphereGeometry args={[0.13, seg.sph - 6, seg.sph - 8]} />
        </mesh>
        {/* front tuft */}
        <mesh position={[0, 0.115, 0.1]} rotation={[0.5, 0, 0]} scale={[1, 0.6, 0.8]} material={m}>
          <sphereGeometry args={[0.07, seg.sph - 8, seg.sph - 8]} />
        </mesh>
      </group>
    );
  }
  if (style === 'ponytail') {
    return (
      <group>
        <mesh position={[0, 0.03, -0.005]} scale={[1.05, 1.02, 1.06]} material={m}>
          <sphereGeometry args={[0.156, seg.sph - 4, seg.sph - 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        {/* tie + tail */}
        <mesh position={[0, 0.02, -0.14]} material={m}>
          <sphereGeometry args={[0.045, seg.cap, seg.cap]} />
        </mesh>
        <mesh position={[0, -0.16, -0.17]} rotation={[0.5, 0, 0]} material={m}>
          <capsuleGeometry args={[0.032, 0.18, seg.cap - 2, seg.cap]} />
        </mesh>
      </group>
    );
  }
  // 'short' — classic cap
  return (
    <mesh position={[0, 0.03, -0.005]} scale={[1.06, 1.03, 1.07]} material={m}>
      <sphereGeometry args={[0.156, seg.sph - 4, seg.sph - 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
    </mesh>
  );
}
