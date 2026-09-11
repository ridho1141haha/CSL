import type { ZoneDef, CameraPose } from '../types';

// SMA Yuson grounds. The school GLB (scaled 2.5) occupies roughly
// x[-3.5,17.5] z[-6.25,22.5]; its facade faces +Z toward the gate.
export const WORLD_BOUNDS = { minX: -42, maxX: 42, minZ: -34, maxZ: 46 };

export const BUILDING_BOX = { x: 7, z: 8.1, w: 21.5, d: 29.2 }; // collider footprint

export const PLAYER_SPAWN: [number, number] = [7, 29];

export const ZONES: ZoneDef[] = [
  { id: 'street', label: 'Jalan Depan Sekolah', center: [7, 42.5], radius: 5.5, map: [0.5, 0.97] },
  { id: 'gate', label: 'Gerbang SMA Yuson', center: [7, 38], radius: 5.5, map: [0.5, 0.9] },
  { id: 'courtyard', label: 'Halaman Utama', center: [7, 28.5], radius: 9, map: [0.5, 0.78] },
  { id: 'class_door', label: 'Pintu Kelas', center: [16.5, 24.5], radius: 3.5, map: [0.66, 0.72] },
  { id: 'parking', label: 'Area Parkir', center: [30, 31], radius: 7, map: [0.83, 0.82] },
  { id: 'canteen', label: 'Kantin Belakang', center: [27, 8], radius: 7.5, map: [0.8, 0.5] },
  { id: 'field', label: 'Lapangan', center: [-24, 8], radius: 12, map: [0.14, 0.5] },
  { id: 'back_stairs', label: 'Tangga Belakang', center: [1.5, -12], radius: 4.5, map: [0.45, 0.27] },
  { id: 'back_alley', label: 'Gang Belakang', center: [7, -24], radius: 8, map: [0.5, 0.12] },
  { id: 'warehouse', label: 'Gudang Tua', center: [-32, -27], radius: 8.5, map: [0.1, 0.1] },
];

export const ZONE_BY_ID: Record<string, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z]));

export function zoneAt(x: number, z: number): ZoneDef | null {
  let best: ZoneDef | null = null;
  let bestD = Infinity;
  for (const zn of ZONES) {
    const d = Math.hypot(x - zn.center[0], z - zn.center[1]);
    if (d <= zn.radius && d < bestD) {
      best = zn;
      bestD = d;
    }
  }
  return best;
}

// Cinematic camera poses (first-person opening + story beats)
export const CAMERA_POSES: Record<string, CameraPose> = {
  fp_gate: { pos: [7, 1.62, 44], look: [7, 2.4, 20] },
  fp_gate_side: { pos: [10.5, 1.62, 42.5], look: [4, 2.6, 24] },
  fp_enter: { pos: [7, 1.62, 36], look: [7, 2.2, 18] },
  fp_courtyard: { pos: [5, 1.62, 31], look: [9, 1.8, 20] },
  fp_students: { pos: [12, 1.62, 29], look: [24, 1.6, 14] },
  fp_bully: { pos: [-6, 1.62, 24], look: [-12, 1.4, 17] },
  fp_bully_close: { pos: [-8.5, 1.62, 20], look: [-12, 1.3, 16.5] },
  fp_siti: { pos: [-9.5, 1.62, 21.5], look: [-12.5, 1.4, 15.5] },
  fp_meet: { pos: [-10.5, 1.62, 19], look: [-13, 1.3, 15] },
  fp_bimo: { pos: [22, 1.62, 12], look: [27.5, 1.5, 9] },
  fp_bimo_close: { pos: [24.5, 1.62, 10.5], look: [27.5, 1.45, 8.5] },
  fp_end: { pos: [7, 1.62, 26], look: [7, 2.2, 12] },
  // third-person story beats
  tp_gate: { pos: [12, 4.2, 45], look: [7, 1.4, 38] },
  tp_bimo_watch: { pos: [23, 3, 13.5], look: [27, 1.3, 9] },
  rooftop: { pos: [7, 12.5, -2], look: [7, 1.5, -12] },
  rooftop_close: { pos: [3.5, 2.6, -13.5], look: [7, 1.5, -12] },
  alley_wide: { pos: [7, 6, -14], look: [7, 1.2, -24] },
  alley_close: { pos: [4.5, 2.2, -21], look: [7, 1.3, -24] },
  warehouse: { pos: [-32, 5, -18], look: [-32, 1.2, -27] },
  warehouse_close: { pos: [-29.5, 2.2, -24.5], look: [-32, 1.3, -27] },
  courtyard_view: { pos: [7, 5.5, 18], look: [7, 1.4, 26] },
};
