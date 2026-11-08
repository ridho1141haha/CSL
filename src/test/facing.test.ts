import { describe, it, expect } from 'vitest';
import { approachFacing, camForwardAngle, IDLE_TURN_RATE, COMBAT_TURN_RATE } from '../game/systems/facing';

// v0.16.1 — "arah hadap karakter mengikuti kamera". The idle facing target
// must use the EXACT same mapping as locomotion (facing = atan2(dirX, dirZ),
// camera forward = (-sin yaw, -cos yaw)) so releasing W never snaps the
// figure, and approachFacing must turn along the shortest arc without
// overshooting.

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

describe('camForwardAngle', () => {
  it('matches the locomotion forward vector (-sin yaw, -cos yaw)', () => {
    for (const yaw of [0, 0.7, Math.PI / 2, Math.PI, -2.1, 5.5]) {
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      expect(camForwardAngle(yaw)).toBeCloseTo(Math.atan2(fx, fz), 12);
    }
  });

  it('pins the default rig orientation (yaw = π → facing 0)', () => {
    expect(camForwardAngle(Math.PI)).toBeCloseTo(0, 12);
    // yaw = 0 → ±π (atan2(-0, -1) = -π because -sin(0) is negative zero;
    // -π and +π are the same direction on the circle)
    expect(Math.abs(wrap(camForwardAngle(0)))).toBeCloseTo(Math.PI, 12);
  });

  it('quarter turns of the camera map to quarter turns of the body', () => {
    const base = wrap(camForwardAngle(0)); // -π
    expect(wrap(camForwardAngle(Math.PI / 2) - base)).toBeCloseTo(Math.PI / 2, 12);
    expect(wrap(camForwardAngle(-Math.PI / 2) - base)).toBeCloseTo(-Math.PI / 2, 12);
  });
});

describe('approachFacing', () => {
  it('steps toward the target by rate*dt (no overshoot)', () => {
    const next = approachFacing(0, 1.0, 0.1, 9);
    expect(next).toBeCloseTo(0.9, 12);
    // converging, never past the target
    const next2 = approachFacing(next, 1.0, 0.1, 9);
    expect(Math.abs(1.0 - next2)).toBeLessThan(Math.abs(1.0 - next));
  });

  it('snaps exactly onto the target when the step covers the distance', () => {
    expect(approachFacing(0, 0.05, 0.1, 9)).toBe(0.05);
    expect(approachFacing(0, 0, 0.1, 9)).toBe(0);
  });

  it('takes the shortest arc across the ±π wrap (3.0 → -3.0 turns THROUGH π)', () => {
    const next = approachFacing(3.0, -3.0, 0.01, 9);
    // shortest path from 3.0 to -3.0 is +0.283 via π, so the step is positive
    expect(next).toBeGreaterThan(3.0);
    expect(wrap(next - 3.0)).toBeCloseTo(9 * 0.01, 9);
  });

  it('never spins the long way around the circle', () => {
    const next = approachFacing(0.1, Math.PI - 0.1, 0.05, 9);
    expect(Math.abs(wrap(next - 0.1))).toBeLessThanOrEqual(9 * 0.05 + 1e-9);
  });

  it('is a no-op at dt <= 0 and when already facing the target', () => {
    expect(approachFacing(1.234, -2.0, 0, 9)).toBe(1.234);
    expect(approachFacing(1.234, -2.0, -0.016, 9)).toBe(1.234);
    expect(approachFacing(2.5, 2.5, 0.1, 9)).toBe(2.5);
  });

  it('idle turn rates are sane (half turn in well under a second)', () => {
    expect(IDLE_TURN_RATE).toBeGreaterThan(4);
    expect(IDLE_TURN_RATE).toBeLessThan(20);
    expect(COMBAT_TURN_RATE).toBeGreaterThanOrEqual(IDLE_TURN_RATE);
    // 180° at idle rate: 0.35 s
    expect(Math.PI / IDLE_TURN_RATE).toBeLessThan(0.5);
  });

  it('full convergence sequence reaches the target without drift', () => {
    let f = 0;
    const target = 2.4;
    for (let i = 0; i < 200; i++) f = approachFacing(f, target, 1 / 60, 9);
    expect(f).toBeCloseTo(target, 12);
  });
});
