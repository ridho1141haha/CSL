import type { NpcDef } from '../types';

// Waypoint coordinates are [x, z] on the school grounds (see data/world.ts).
export const NPCS: NpcDef[] = [
  {
    id: 'aris',
    name: 'Aris',
    role: 'Teman Sebangku',
    color: '#3b82f6',
    accent: '#93c5fd',
    height: 1.62,
    schedule: {
      arrive: [11, 30],
      class: [15.5, 25],
      break: [3.5, 31.5],
      class2: [15.5, 25],
      lunch: [26, 11],
      class3: [15.5, 25],
      after: [-19, 11],
    },
    dialogueRoot: 'npc_aris',
  },
  {
    id: 'siti',
    name: 'Siti',
    role: 'OSIS',
    color: '#10b981',
    accent: '#6ee7b7',
    height: 1.58,
    schedule: {
      arrive: [3, 26],
      class: [15, 25],
      break: [12, 24],
      class2: [15, 25],
      lunch: [29, 8],
      class3: [15, 25],
      after: [12, 24],
    },
    dialogueRoot: 'npc_siti',
  },
  {
    id: 'bimo',
    name: 'Bimo',
    role: 'Di Mana-mana',
    color: '#ef4444',
    accent: '#fca5a5',
    height: 1.78,
    schedule: {
      arrive: [30, 31],
      class: [15.8, 25.4],
      break: [26, 14],
      class2: [26, 14],
      lunch: [26, 14],
      class3: [15.8, 25.4],
      after: [7, -21],
    },
    dialogueRoot: 'npc_bimo',
  },
  {
    id: 'budi',
    name: 'Pak Budi',
    role: 'Guru',
    color: '#0ea5e9',
    accent: '#7dd3fc',
    height: 1.7,
    schedule: {
      arrive: [17.5, 25.5],
      class: [17.5, 25.5],
      break: [9, 24],
      class2: [17.5, 25.5],
      lunch: [20, 24],
      class3: [17.5, 25.5],
      after: [17.5, 25.5],
    },
    dialogueRoot: 'npc_budi',
  },
];

export const NPC_BY_ID: Record<string, NpcDef> = Object.fromEntries(NPCS.map((n) => [n.id, n]));

// Ambient students: [x, z] patrol waypoints per period are simplified to a
// home point + wander radius to keep per-frame cost near zero.
export const AMBIENT_STUDENTS: { pos: [number, number]; wander: number; color: string }[] = [
  { pos: [10, 33], wander: 3, color: '#64748b' },
  { pos: [16, 29], wander: 3.5, color: '#7c6f64' },
  { pos: [2, 23], wander: 3, color: '#5b6b7a' },
  { pos: [24, 12], wander: 3.5, color: '#6b7280' },
  { pos: [-18, 6], wander: 6, color: '#64748b' },
  { pos: [29, 28], wander: 3, color: '#57534e' },
  { pos: [9, 40], wander: 2.5, color: '#6b7280' },
];
