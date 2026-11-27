// v0.20.0: pure first-person camera helpers (third-person mode removed).
// Pure math only — no three.js, no React — so it stays unit-testable
// (see test/cammode.test.ts).

/** Look-down/up range for the first-person head-cam (radians; + = down). */
export const FP_PITCH = { min: -1.05, max: 1.2 } as const;

/** Eye height above the FEET position (playerPos.y is feet, not capsule center). */
export const FP_EYE = 1.52;

export function clampPitch(pitch: number): number {
  return Math.max(FP_PITCH.min, Math.min(FP_PITCH.max, pitch));
}

/**
 * First-person look direction from (yaw, pitch).
 * Forward is (-sin yaw, ·, -cos yaw); pitch > 0 looks down.
 */
export function fpLookDir(
  yaw: number,
  pitch: number,
): { x: number; y: number; z: number } {
  const cp = Math.cos(pitch);
  return { x: -Math.sin(yaw) * cp, y: -Math.sin(pitch), z: -Math.cos(yaw) * cp };
}
