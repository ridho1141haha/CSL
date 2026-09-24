// v0.16.1 — "arah hadap karakter mengikuti kamera" (user feedback).
//
// Convention shared with locomotion (Player.tsx / combat.ts): a body facing
// angle is `atan2(dirX, dirZ)`, and the orbit camera's forward direction on
// the ground plane is `(-sin(yaw), -cos(yaw))` — the same vector pressing W
// walks toward. Keeping one source of truth for that mapping means the idle
// target equals exactly the facing a W-press would have produced, so there is
// no visual snap when the player stops holding a key.

/** Turn speed while idle, radians per second. ~0.35 s for a half turn. */
export const IDLE_TURN_RATE = 9;

/** Turn speed in combat idle/block — snappier so blocks land on a circling enemy. */
export const COMBAT_TURN_RATE = 12;

/**
 * Ground-plane angle the camera currently looks toward, in body-facing
 * convention (atan2(dirX, dirZ)).
 *
 * camForwardAngle(π) === 0: the default rig sits behind the player at
 * yaw = π looking down -Z... corrected: looking toward angle 0 (+Z). Unit
 * tests pin the mapping to the exact formula locomotion uses.
 */
export function camForwardAngle(yaw: number): number {
  return Math.atan2(-Math.sin(yaw), -Math.cos(yaw));
}

/**
 * Rotate `current` toward `target` along the shortest arc by at most
 * `rate * dt` radians, snapping when the remaining distance fits in one step
 * (no overshoot / no oscillation around the target).
 *
 * Pure so the turn feel is unit-testable without a rendered frame.
 */
export function approachFacing(
  current: number,
  target: number,
  dt: number,
  rate: number = IDLE_TURN_RATE,
): number {
  if (dt <= 0) return current;
  let d = target - current;
  // wrap to (-π, π] — e.g. current 3.0 → target -3.0 must turn +0.28 via π,
  // not spin the long way around the circle.
  d = Math.atan2(Math.sin(d), Math.cos(d));
  const step = rate * dt;
  if (Math.abs(d) <= step) return target;
  return current + Math.sign(d) * step;
}
