import type { NpcDef } from '../types';

// Waypoint coordinates are [x, z] on the campus grounds (see data/world.ts
// CAMPUS_ZONES). Interior waypoints: classroom ≈ x -15..-2 z 4..14,
// teacher room ≈ x 2..15 z 4..14, hall ≈ z 21..28, canteen ≈ x 22..34 z 2..14.
export const NPCS: NpcDef[] = [
  {
    id: 'aris',
    name: 'Aris',
    role: 'Teman Sebangku',
    color: '#3b82f6',
    accent: '#93c5fd',
    height: 1.62,
    skin: '#f0c39d',
    pants: '#334155',
    hair: { color: '#241c16', style: 'short' },
    schedule: {
      // v0.12.0: jam kelas Aris duduk di kursinya (kursi -4.0, 11.3 — meja
      // -4.8) menghadap papan tulis; sesuai scene 2 GARIS MERAH
      arrive: [11, 34],
      class: [-4.0, 11.3],
      break: [3.5, 35.5],
      class2: [-4.0, 11.3],
      lunch: [26, 10],
      class3: [-4.0, 11.3],
      after: [-22, 14],
    },
    sitAt: ['class', 'class2', 'class3'],
    sitFace: [-15.7, 9.5],
    dialogueRoot: 'npc_aris',
    // v0.17.0 registry metadata — single source for stores, migration and UI (was
    // hand-synced literals in socialStore / save.migrateV1 / menus / Screens
    // / Npc.tsx engine branch).
    storyCast: true,
    relTag: { text: 'SEBANGKU', cls: 'chip-cyan' },
    relQuote: '“Ren, buku catatan aku titipin ya kalau ada kuis.”',
    // v0.7.0 rute netral: Aris mengundurkan diri di akhir bab 3 (montage n4)
    // — dari bab 4 dia tidak lagi muncul di sekolah.
    hiddenWhen: { route: 'neutral', chapterMin: 4 },
  },
  {
    id: 'siti',
    name: 'Siti',
    role: 'OSIS',
    color: '#10b981',
    accent: '#6ee7b7',
    height: 1.58,
    skin: '#e8b98e',
    skirt: '#1f2937',
    hair: { color: '#17110c', style: 'ponytail' },
    schedule: {
      // v0.12.0: jam kelas Siti duduk satu barisan dengan Aris (kursi -6.75,
      // 11.3 — meja -7.6) menghadap papan tulis
      arrive: [3, 30],
      class: [-6.75, 11.3],
      break: [12, 32],
      class2: [-6.75, 11.3],
      lunch: [30, 6],
      class3: [-6.75, 11.3],
      after: [30, 20], // v0.8.0: Siti selepas sekolah di perpustakaan (sesuai alur netral)
    },
    sitAt: ['class', 'class2', 'class3'],
    sitFace: [-15.7, 9.5],
    dialogueRoot: 'npc_siti',
    storyCast: true,
    relTag: { text: 'OSIS', cls: 'chip-green' },
    relQuote: '“Jangan lupa formulir OSIS kalau kamu yang bawa.”',
  },
  {
    id: 'bimo',
    name: 'Bimo',
    role: 'Di Mana-mana',
    color: '#ef4444',
    accent: '#fca5a5',
    height: 1.78,
    skin: '#d9a878',
    pants: '#18181b',
    hair: { color: '#0f0d0b', style: 'wave' },
    schedule: {
      arrive: [30, 33],
      class: [-13, 24.5],
      break: [20, 18],
      class2: [20, 18],
      lunch: [24, 9],
      class3: [-13, 24.5],
      after: [6, -19],
    },
    dialogueRoot: 'npc_bimo',
    storyCast: true,
    relTag: { text: 'ANCAMAN', cls: 'chip-red' },
    relQuote: '“Kami melihatmu di gerbang. Hati-hati di jalan pulang.”',
  },
  {
    id: 'budi',
    name: 'Pak Budi',
    role: 'Guru',
    color: '#0ea5e9',
    accent: '#7dd3fc',
    height: 1.7,
    skin: '#e6b283',
    pants: '#1f2937',
    hair: { color: '#3a3a3a', style: 'buzz' },
    schedule: {
      arrive: [9, 8.5],
      class: [9, 8.5],
      break: [9, 17.5],
      class2: [9, 8.5],
      lunch: [28, 5],
      class3: [9, 8.5],
      after: [9, 8.5],
    },
    dialogueRoot: 'npc_budi',
    relTag: { text: 'GURU', cls: '' },
    relQuote: '“Kelas X-C? Jaga perilaku, aku mengamati dari ruang guru.”',
  },
];

export const NPC_BY_ID: Record<string, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));

// Ambient students: [x, z] patrol waypoints per period are simplified to a
// home point + wander radius to keep per-frame cost near zero.
export const AMBIENT_STUDENTS: { pos: [number, number]; wander: number; color: string }[] = [
  { pos: [12, 38], wander: 3, color: '#64748b' },
  { pos: [18, 32], wander: 3.5, color: '#7c6f64' },
  { pos: [-4, 33], wander: 3, color: '#5b6b7a' },
  { pos: [-6, 17.5], wander: 2.5, color: '#6b7280' },   // corridor
  { pos: [4, 24.5], wander: 2.5, color: '#94a3b8' },    // hall
  { pos: [27, 9], wander: 2, color: '#64748b' },        // canteen interior
  { pos: [-28, 10], wander: 6, color: '#64748b' },      // field
  { pos: [33, 32], wander: 3, color: '#57534e' },       // parking
  { pos: [9, 49], wander: 2.5, color: '#6b7280' },      // street
  { pos: [4, -18], wander: 3, color: '#7c6f64' },       // alley mouth
  { pos: [29.3, 20.2], wander: 1.2, color: '#64748b' }, // v0.8.0: library reading area
  { pos: [30, -14.8], wander: 1.5, color: '#7c6f64' },  // v0.8.0: Gedung B corridor
];
