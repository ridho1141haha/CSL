import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDialogue } from '../../stores/dialogueStore';
import { STORY_PROPS, type StoryPropDef } from '../../data/chapters';

// ============================================================================
// v0.12.0 — StoryPropFX: prop dunia pendukung cerita (feedback user:
// "setiap aksi kayak pensil jatuh, ambil pensil … dikasih animasi").
//
// Dua adegan yang dilengkapi:
//   • Scene 2 kelas (o2_*): kotak pensil Aris tersenggol dari meja → jatuh
//     dengan pantulan → pensil bergelaran di lantai → Aris memungut (crouch
//     di SCENE_ACTORS) → kotak lenyap (sudah terkumpul) pada o2_6.
//   • Bab 2 jalur tangga (ch2_*): tumpukan buku + botol Aris jatuh saat
//     tersandung (ch2_intro_3) — buku berserakan, botol kuyu, genangan air
//     menghitam di beton — sampai buku terkumpul lagi (ch2_win_3).
//
// Semua animasi di-drive per-node dari STORY_PROPS (data/chapters.ts) dan
// dianimasikan di sini dengan progres 0..1 (sekali main saat state berubah).
// ============================================================================

// ---- koordinat dunia (kelas 11-B: meja Aris -4.8,11.3; bab 2: jalur timur
// ---- shaft tangga — DI DALAM shaft ada undakan, jadi prop di timurnya)
const CASE_DESK = new THREE.Vector3(-4.52, 0.79, 11.02);
const CASE_FLOOR = new THREE.Vector3(-4.3, 0.035, 10.68);
const BOOKS_FLOOR: [number, number, number][] = [
  [4.85, 0.035, 2.5],
  [5.45, 0.035, 2.1],
  [5.85, 0.035, 2.7],
];
const BOOKS_ROT: number[] = [0.45, -0.35, 1.15];
const BOTTLE_FLOOR = new THREE.Vector3(5.75, 0.05, 3.35);
const SPILL_POS: [number, number, number] = [5.5, 0.021, 3.1];

type Anim = { t: number; active: boolean };

export function StoryPropFX() {
  const nodeId = useDialogue((s) => s.nodeId);
  const def: StoryPropDef = (nodeId && STORY_PROPS[nodeId]) || {};

  // re-animate whenever the node changes (refs survive re-renders)
  const caseAnim = useRef<Anim>({ t: 0, active: true });
  const bottleAnim = useRef<Anim>({ t: 0, active: true });
  const booksAnim = useRef<Anim>({ t: 0, active: true });
  const spillAnim = useRef<Anim>({ t: 0, active: true });
  const lastNode = useRef<string | null>(null);

  if (nodeId !== lastNode.current) {
    lastNode.current = nodeId;
    caseAnim.current = { t: 0, active: def.pencase === 'fall' };
    bottleAnim.current = { t: 0, active: def.bottle === 'drop' };
    booksAnim.current = { t: 0, active: def.books === 'scatter' };
    spillAnim.current = { t: 0, active: !!def.spill };
  }

  return (
    <group>
      <PencilCase def={def} anim={caseAnim} />
      <LoosePencils def={def} />
      <ScatteredBooks def={def} anim={booksAnim} />
      <Bottle def={def} anim={bottleAnim} />
      <WaterSpill def={def} anim={spillAnim} />
    </group>
  );
}

function stepAnim(a: Anim, dt: number, dur: number) {
  if (!a.active) return 1;
  a.t = Math.min(1, a.t + dt / dur);
  if (a.t >= 1) a.active = false;
  return a.t;
}

// Kotak pensil — jatuh dari tepi meja dengan sedikit pantulan + rotasi.
function PencilCase({ def, anim }: { def: StoryPropDef; anim: React.MutableRefObject<Anim> }) {
  const group = useRef<THREE.Group>(null);
  const state = def.pencase ?? 'none';
  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    if (state === 'none') {
      g.visible = false;
      return;
    }
    g.visible = true;
    if (state === 'desk') {
      g.position.copy(CASE_DESK);
      g.rotation.set(0, 0.4, 0);
      return;
    }
    // 'fall' → animasi; 'floor' → pose akhir
    const t = state === 'fall' ? stepAnim(anim.current, dt, 0.55) : 1;
    const e = t * t; // ease-in (gravitasi)
    const bounce = t > 0.78 ? Math.abs(Math.sin((t - 0.78) * Math.PI * 3.6)) * 0.09 * (1 - t) : 0;
    g.position.lerpVectors(CASE_DESK, CASE_FLOOR, e);
    g.position.y += bounce;
    g.rotation.set(e * 1.15, 0.4 + e * 0.5, 0);
  });
  return (
    <group ref={group} visible={false}>
      <mesh castShadow>
        <boxGeometry args={[0.17, 0.05, 0.095]} />
        <meshStandardMaterial color="#c2410c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.027, 0]}>
        <boxGeometry args={[0.175, 0.008, 0.1]} />
        <meshStandardMaterial color="#9a3412" roughness={0.6} />
      </mesh>
      <mesh position={[0.06, 0, 0.05]}>
        <boxGeometry args={[0.03, 0.052, 0.01]} />
        <meshStandardMaterial color="#f2c14e" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

// Dua pensil lepas dari kotak — bergelaran di lantai dekat kotak.
function LoosePencils({ def }: { def: StoryPropDef }) {
  const shown = def.pencase === 'fall' || def.pencase === 'floor';
  return (
    <group visible={shown}>
      {[
        { p: [-4.12, 0.02, 10.52] as const, r: [0, 0, 1.5] as const },
        { p: [-4.45, 0.02, 10.42] as const, r: [1.5, 0, -0.3] as const },
      ].map((s, i) => (
        <group key={i} position={[s.p[0], s.p[1], s.p[2]]} rotation={[s.r[0], s.r[1], s.r[2]]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.011, 0.011, 0.17, 8]} />
            <meshStandardMaterial color="#e8a33d" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Tumpukan buku berserakan (bab 2) — pop-in kecil saat menyebar.
function ScatteredBooks({ def, anim }: { def: StoryPropDef; anim: React.MutableRefObject<Anim> }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const shown = def.books === 'scatter';
  useFrame((_, dtRaw) => {
    const t = shown ? stepAnim(anim.current, Math.min(dtRaw, 0.05), 0.4) : 0;
    const s = 0.25 + 0.75 * t;
    groups.current.forEach((g) => {
      if (g) g.scale.setScalar(shown ? s : 0.001);
    });
  });
  if (!shown) return null;
  return (
    <group>
      {BOOKS_FLOOR.map((p, i) => (
        <group key={i} ref={(g) => { groups.current[i] = g; }} position={p} rotation={[0, BOOKS_ROT[i], 0]} scale={0.001}>
          <mesh castShadow>
            <boxGeometry args={[0.3, 0.055, 0.22]} />
            <meshStandardMaterial color={['#d9c9a3', '#5a7ea0', '#6b8f6a'][i]} roughness={0.8} />
          </mesh>
          <mesh position={[0.012, 0, 0]}>
            <boxGeometry args={[0.24, 0.057, 0.19]} />
            <meshStandardMaterial color="#efe6cf" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Botol minum — jatuh menggelinding (genangan ditangani WaterSpill).
function Bottle({ def, anim }: { def: StoryPropDef; anim: React.MutableRefObject<Anim> }) {
  const group = useRef<THREE.Group>(null);
  const state = def.bottle ?? 'none';
  useFrame((_, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    if (state === 'drop') {
      const t = stepAnim(anim.current, dt, 0.4);
      g.visible = true;
      g.position.set(BOTTLE_FLOOR.x, BOTTLE_FLOOR.y + (1 - t) * 0.5, BOTTLE_FLOOR.z);
      g.rotation.set(t * Math.PI / 2 + 0.15, 0, 0.3);
      return;
    }
    if (state === 'held' || state === 'none') {
      g.visible = false; // di tangan Aris (hold 'bottle' pada Figure) / belum ada
      return;
    }
    g.visible = false;
  });
  return (
    <group ref={group} visible={false} position={[BOTTLE_FLOOR.x, BOTTLE_FLOOR.y + 0.5, BOTTLE_FLOOR.z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.042, 0.046, 0.2, 10]} />
        <meshStandardMaterial color="#8ec7e8" roughness={0.15} metalness={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.035, 8]} />
        <meshStandardMaterial color="#2f6db1" roughness={0.5} />
      </mesh>
    </group>
  );
}

// Genangan air di beton — membesar saat botol tumpah, lalu diam.
function WaterSpill({ def, anim }: { def: StoryPropDef; anim: React.MutableRefObject<Anim> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const shown = !!def.spill;
  useFrame((_, dtRaw) => {
    const m = mesh.current;
    if (!m) return;
    const t = shown ? stepAnim(anim.current, Math.min(dtRaw, 0.05), 0.7) : 0;
    const s = 0.2 + 0.8 * t;
    m.scale.set(s, s, s);
    (m.material as THREE.MeshStandardMaterial).opacity = 0.5 * t;
  });
  return (
    <mesh ref={mesh} position={SPILL_POS} rotation={[-Math.PI / 2, 0, 0]} scale={0.001}>
      <circleGeometry args={[0.55, 20]} />
      <meshStandardMaterial color="#274a5c" roughness={0.08} metalness={0.25} transparent opacity={0} />
    </mesh>
  );
}
