// ============================================================================
// collision.ts — character-vs-character personal space (v0.16.0)
//
// User: "kasih batas/collision setiap karakter supaya tidak bisa
// gabung/menumpuk". Every figure except the player is a kinematic visual
// body (no physics collider), so the player used to walk straight through
// NPCs, ambient students and the combat enemy. This module keeps characters
// out of each other's personal space:
//
//   - resolveOverlaps()  — push a mover out of overlapping circles (XZ plane)
//   - stripIntoVelocity()— slide along a body instead of ploughing into it
//
// Pure math, no three/rapier imports — unit-testable in node.
// ============================================================================

export type XZ = { x: number; z: number };

/**
 * Personal-space radius per figure. Figures are slim (~0.3 m shoulder), so
 * two bodies stop at 2 × 0.42 = 0.84 m apart — close enough to look natural
 * in conversations, far enough that bodies never visually merge.
 */
export const CHAR_RADIUS = 0.42;

/**
 * Push `mover` out of every circle in `others` (XZ plane). Two relaxation
 * passes handle corner cases (moving between two bodies) without pumping.
 * Returns the corrected position and whether any overlap was resolved.
 */
export function resolveOverlaps(
  mover: XZ,
  others: XZ[],
  minDist = CHAR_RADIUS * 2,
  passes = 2,
): { x: number; z: number; hit: boolean } {
  let { x, z } = mover;
  let hit = false;
  for (let p = 0; p < passes; p++) {
    let moved = false;
    for (const o of others) {
      const dx = x - o.x;
      const dz = z - o.z;
      const d = Math.hypot(dx, dz);
      if (d >= minDist || d < 1e-5) continue;
      const push = (minDist - d) / d;
      x += dx * push;
      z += dz * push;
      moved = true;
    }
    hit = hit || moved;
    if (!moved) break;
  }
  return { x, z, hit };
}

/**
 * Remove the component of velocity (vx, vz) that points from the mover at
 * (mx, mz) toward a body at (ox, oz). The mover slides tangentially around
 * the body instead of pressing into it — same feel as sliding along a wall.
 */
export function stripIntoVelocity(
  vx: number,
  vz: number,
  mx: number,
  mz: number,
  ox: number,
  oz: number,
): { vx: number; vz: number } {
  const dx = ox - mx;
  const dz = oz - mz;
  const d = Math.hypot(dx, dz);
  if (d < 1e-5) return { vx: 0, vz: 0 }; // dead centre: stop, don't pick a side
  const nx = dx / d;
  const nz = dz / d;
  const into = vx * nx + vz * nz;
  if (into <= 0) return { vx, vz }; // already moving away / tangentially
  return { vx: vx - nx * into, vz: vz - nz * into };
}

/**
 * Collect bodies from position registries within a square shortlist radius
 * of (x, z). Collision only ever sees a handful of neighbours, so the per-
 * frame cost stays flat even with the full crowd registered.
 */
export function nearbyBodies(
  registries: Record<string, XZ>[],
  x: number,
  z: number,
  r = 1.4,
): XZ[] {
  const out: XZ[] = [];
  for (const reg of registries) {
    for (const k in reg) {
      const o = reg[k];
      if (Math.abs(o.x - x) <= r && Math.abs(o.z - z) <= r) out.push(o);
    }
  }
  return out;
}
