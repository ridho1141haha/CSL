import type { ZoneDef, CameraPose, SceneId } from '../types';

// ============================================================================
// WORLD v2 — multi-scene layout (rebuilt from scratch, no school GLB).
// 'campus' is the main grounds; 'rooftop' & 'warehouse' are separate scenes
// mounted on demand by SceneRoot (game/world/World.tsx).
//
// Campus layout (top-down, +Z = south/toward the street):
//   street      z 46..54   (outside the fence)
//   gate        z ~45      (opening x 4..10)
//   courtyard   z 28..44   (paved plaza)
//   main bldg   x -16..16, z 4..28  (accessible interior: hall, corridor,
//               classroom, teacher room; stair shaft on the north side)
//   canteen     x 22..34, z 2..14   (accessible interior)
//   parking     x 26..42, z 26..42
//   field       x -46..-20, z 0..30
//   stair shaft x -4..4, z -2..4   (rooftop access → rooftop scene)
//   rear yard   z -8..4
//   back alley  x -6..18, z -30..-12
//   warehouse   x -46..-26, z -36..-18 (exterior; interior is its own scene)
// ============================================================================

export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

export type SceneDef = {
  id: SceneId;
  label: string;
  bounds: Bounds;
  spawn: [number, number]; // where the player appears on scene enter
  zones: ZoneDef[];
};

// ---------------------------------------------------------------------------
// Campus
// ---------------------------------------------------------------------------
export const CAMPUS_BOUNDS: Bounds = { minX: -48, maxX: 48, minZ: -38, maxZ: 54 };

export const CAMPUS_ZONES: ZoneDef[] = [
  { id: 'street', label: 'Jalan Depan Sekolah', center: [7, 50], radius: 6 },
  { id: 'gate', label: 'Gerbang SMA Yuson', center: [7, 44.5], radius: 5 },
  { id: 'courtyard', label: 'Halaman Utama', center: [7, 36], radius: 10 },
  { id: 'hall', label: 'Lobi & Lorong', center: [0, 24.5], radius: 6.5 },
  { id: 'class_door', label: 'Pintu Kelas', center: [-8.5, 15.5], radius: 2.5 },
  { id: 'classroom', label: 'Kelas 1-X', center: [-9, 9], radius: 5.5 },
  { id: 'teacher_room', label: 'Ruang Guru', center: [9, 9], radius: 5.5 },
  { id: 'canteen', label: 'Kantin', center: [28, 8], radius: 5.5 },
  { id: 'parking', label: 'Area Parkir', center: [34, 34], radius: 7 },
  { id: 'field', label: 'Lapangan', center: [-33, 15], radius: 12 },
  { id: 'back_stairs', label: 'Tangga Belakang', center: [0, 1], radius: 4.5 },
  { id: 'back_alley', label: 'Gang Belakang', center: [6, -21], radius: 8 },
  { id: 'warehouse', label: 'Gudang Tua', center: [-36, -27], radius: 8 },
];

// ---------------------------------------------------------------------------
// Rooftop (scene-local coordinates, origin at the stair bulkhead door)
// ---------------------------------------------------------------------------
export const ROOFTOP_BOUNDS: Bounds = { minX: -14, maxX: 14, minZ: -11, maxZ: 11 };

export const ROOFTOP_ZONES: ZoneDef[] = [
  { id: 'rooftop', label: 'Atap Gedung Utama', center: [0, -1], radius: 10 },
  // exit trigger sits behind the bulkhead door — NOT overlapping the spawn
  // point, so arriving players are not bounced straight back to campus
  { id: 'rooftop_door', label: 'Tangga Turun', center: [0, 9.6], radius: 2.2 },
];

// ---------------------------------------------------------------------------
// Warehouse interior (scene-local coordinates)
// ---------------------------------------------------------------------------
export const WAREHOUSE_BOUNDS: Bounds = { minX: -15, maxX: 15, minZ: -12, maxZ: 12 };

export const WAREHOUSE_ZONES: ZoneDef[] = [
  { id: 'warehouse_in', label: 'Dalam Gudang Tua', center: [0, -1], radius: 9.5 },
  // exit trigger at the door threshold, clear of the spawn point (0, 7)
  { id: 'warehouse_door', label: 'Pintu Keluar', center: [0, 10.4], radius: 2.2 },
];

// ---------------------------------------------------------------------------
// Scene registry
// ---------------------------------------------------------------------------
export const SCENES: Record<SceneId, SceneDef> = {
  campus: { id: 'campus', label: 'SMA Yuson — Kampus', bounds: CAMPUS_BOUNDS, spawn: [7, 36], zones: CAMPUS_ZONES },
  rooftop: { id: 'rooftop', label: 'Atap Gedung Utama', bounds: ROOFTOP_BOUNDS, spawn: [0, 6], zones: ROOFTOP_ZONES },
  warehouse: { id: 'warehouse', label: 'Gudang Tua — Dalam', bounds: WAREHOUSE_BOUNDS, spawn: [0, 7], zones: WAREHOUSE_ZONES },
};

// Legacy flat campus list (HUD labels, tests). Kept for compatibility.
export const WORLD_BOUNDS: Bounds = CAMPUS_BOUNDS;

export const PLAYER_SPAWN: [number, number] = SCENES.campus.spawn;

export const ZONES: ZoneDef[] = CAMPUS_ZONES;

export const ZONE_BY_ID: Record<string, ZoneDef> = Object.fromEntries(
  [...CAMPUS_ZONES, ...ROOFTOP_ZONES, ...WAREHOUSE_ZONES].map((z) => [z.id, z]),
);

// Zone lookup is scene-aware: each scene has its own local coordinates.
export function zoneAt(x: number, z: number, scene: SceneId = 'campus'): ZoneDef | null {
  const zones = SCENES[scene]?.zones ?? CAMPUS_ZONES;
  let best: ZoneDef | null = null;
  let bestD = Infinity;
  for (const zn of zones) {
    const d = Math.hypot(x - zn.center[0], z - zn.center[1]);
    if (d <= zn.radius && d < bestD) {
      best = zn;
      bestD = d;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Cinematic camera poses. Campus poses are world coordinates; rooftop &
// warehouse poses are scene-local (their scenes render at the origin).
// ---------------------------------------------------------------------------
export const CAMERA_POSES: Record<string, CameraPose> = {
  // ---- opening: first person (campus) ----
  fp_gate: { pos: [7, 1.62, 52], look: [7, 2.3, 34] },
  fp_gate_side: { pos: [11.5, 1.62, 50], look: [3, 2.5, 36] },
  fp_enter: { pos: [7, 1.62, 44], look: [7, 2.2, 28] },
  fp_courtyard: { pos: [2, 1.62, 39], look: [11, 1.8, 30] },
  fp_students: { pos: [20.5, 1.62, 20], look: [27.5, 1.5, 10] },
  fp_bully: { pos: [-1.5, 1.62, 34], look: [-7.5, 1.4, 30] },
  fp_bully_close: { pos: [-4.6, 1.62, 31.6], look: [-7.2, 1.3, 29.8] },
  fp_siti: { pos: [-4.8, 1.62, 30.6], look: [-9, 1.4, 29.6] },
  fp_meet: { pos: [-5.6, 1.62, 30], look: [-8.6, 1.3, 29.8] },
  fp_bimo: { pos: [17, 1.62, 14.5], look: [21, 1.5, 10] },
  fp_end: { pos: [7, 1.7, 35.5], look: [0, 2.6, 28] },
  // ---- opening v0.7.0 "Minggu Pertama" (first person, interior shots) ----
  // Scene 1: map merah di tangan Ren
  fp_map_red: { pos: [7.6, 1.55, 50.5], look: [7.2, 1.1, 48.2] },
  // Scene 2: kelas 11-B (interior x -16..-2, z 4..14; meja Aris -4.8,11.3)
  fp_class: { pos: [-2.9, 1.62, 13.3], look: [-11.5, 1.3, 8.4] },
  fp_class_desk: { pos: [-4.1, 1.5, 13.1], look: [-4.0, 1.15, 11.2] },
  fp_class_board: { pos: [-3.4, 1.62, 12.6], look: [-14.5, 1.55, 9.0] },
  // Scene 3: lorong / hall (z 21..28; Siti dekat loket -3, 23.5)
  fp_corridor: { pos: [4.2, 1.62, 26.6], look: [-3.2, 1.45, 23.6] },
  fp_siti_hall: { pos: [2.4, 1.62, 25.2], look: [-3.0, 1.4, 23.5] },
  fp_siti_hall_close: { pos: [-0.4, 1.55, 24.6], look: [-3.0, 1.4, 23.5] },
  // Scene 4: kantin (x 22..34, z 2..14; meja Ren 29.5,7; meja bisik 25.5,5)
  fp_canteen: { pos: [30.7, 1.55, 8.8], look: [25.6, 1.15, 5.2] },
  fp_canteen_whisper: { pos: [28.2, 1.5, 6.6], look: [25.3, 1.1, 4.7] },
  fp_bimo_entry: { pos: [28.9, 1.6, 9.6], look: [23.4, 1.45, 10.6] },
  fp_bimo_close: { pos: [27.1, 1.55, 8.9], look: [28.6, 1.5, 7.3] },
  // ---- bab 2 "Kesalahan Kecil Aris": halaman belakang, luar pintu tangga ----
  stairs_wide: { pos: [4.8, 2.2, -7.0], look: [0, 1.3, -2.6] },
  stairs_close: { pos: [2.4, 1.6, -4.8], look: [-0.3, 1.3, -2.8] },
  stairs_aris: { pos: [-3.0, 1.5, -4.2], look: [-0.5, 1.1, -2.9] },
  stairs_away: { pos: [-3.5, 2.0, -6.5], look: [1.5, 1.5, -2.2] },
  // ---- rute netral: montage interior ----
  classroom_view: { pos: [-2.5, 2.1, 13.6], look: [-9.8, 1.15, 9.4] },
  classroom_close: { pos: [-6.6, 1.45, 12.9], look: [-4.0, 1.2, 11.3] },
  classroom_budi: { pos: [-8.4, 1.6, 12.6], look: [-12.2, 1.45, 11.4] },
  hall_view: { pos: [4.6, 2.0, 27.4], look: [-3.4, 1.35, 23.4] },
  hall_close: { pos: [-0.2, 1.5, 25.4], look: [-3.0, 1.4, 23.5] },
  corridor_view: { pos: [2.2, 1.9, 20.2], look: [-4.2, 1.4, 17.2] },
  corridor_close: { pos: [-0.6, 1.55, 18.6], look: [-4.0, 1.45, 17.1] },
  // ---- rute netral: graduasi di gerbang ----
  grad_gate: { pos: [10.5, 2.1, 49.0], look: [7, 1.5, 42.5] },
  grad_siti: { pos: [6.2, 1.55, 45.6], look: [8.4, 1.45, 44.4] },
  // ---- third person story beats (campus) ----
  tp_gate: { pos: [13, 4.4, 53], look: [7, 1.4, 45] },
  tp_bimo_watch: { pos: [18, 3, 14.5], look: [21.5, 1.3, 10.2] },
  courtyard_view: { pos: [7, 5.5, 23], look: [7, 1.4, 36] },
  alley_wide: { pos: [6, 6.5, -9], look: [6, 1.2, -22] },
  alley_close: { pos: [3.4, 2.2, -19], look: [6, 1.3, -22] },
  warehouse: { pos: [-36, 5, -14], look: [-36, 1.6, -27] },
  warehouse_close: { pos: [-30.5, 2.2, -21.5], look: [-35, 1.6, -25.5] },
  // ---- rooftop scene (local) ----
  rooftop: { pos: [0, 7.5, 10], look: [0, 1.6, -6] },
  rooftop_close: { pos: [2.8, 2.5, -3.4], look: [0.2, 1.5, -5.6] },
  // ---- warehouse scene interior (local) ----
  whin: { pos: [0, 6.5, 9], look: [0, 1.5, -4] },
  whin_close: { pos: [2.8, 2.3, -1.2], look: [0, 1.4, -4] },
};
