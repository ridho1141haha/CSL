// v0.13.0: first-person / third-person camera modes (user request:
// "kasih mode thirdperson dan firstperson").
//
// Pure helpers only — no three.js, no React — so the mode math stays
// unit-testable (see test/cammode.test.ts).

export type CamMode = 'third' | 'first';

/** Orbit elevation range for the third-person rig (existing v0.x feel). */
export const TP_PITCH = { min: 0.06, max: 0.85 } as const;
/** Look-down/up range for the first-person head-cam (radians; + = down). */
export const FP_PITCH = { min: -1.05, max: 1.2 } as const;

/** Eye height above the FEET position (playerPos.y is feet, not capsule center). */
export const FP_EYE = 1.52;

export function clampPitch(mode: CamMode, pitch: number): number {
  const r = mode === 'first' ? FP_PITCH : TP_PITCH;
  return Math.max(r.min, Math.min(r.max, pitch));
}

/** Re-clamp when switching modes so a stale FP look-up never drives the TP
 *  orbit camera under the floor (and vice versa). */
export function reclampOnSwitch(mode: CamMode, pitch: number): number {
  return clampPitch(mode, pitch);
}

export function nextMode(mode: CamMode): CamMode {
  return mode === 'first' ? 'third' : 'first';
}

/**
 * First-person look direction from (yaw, pitch).
 * Convention matches the orbit rig: the camera sits at
 * (sin yaw, cos yaw) * dist BEHIND the player, so its forward is
 * (-sin yaw, ·, -cos yaw). pitch>0 looks down (same sign as TP elevation).
 */
export function fpLookDir(
  yaw: number,
  pitch: number,
): { x: number; y: number; z: number } {
  const cp = Math.cos(pitch);
  return { x: -Math.sin(yaw) * cp, y: -Math.sin(pitch), z: -Math.cos(yaw) * cp };
}
