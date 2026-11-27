import { describe, it, expect } from 'vitest';
import { clampPitch, fpLookDir, FP_EYE, FP_PITCH } from '../game/camera/mode';

describe('first-person camera helpers (v0.20.0)', () => {
  it('first-person pitch allows looking up and down within safe bounds', () => {
    expect(clampPitch(-0.6)).toBe(-0.6); // look up
    expect(clampPitch(0)).toBe(0); // straight ahead
    expect(clampPitch(1.5)).toBe(FP_PITCH.max); // clamped look down
    expect(clampPitch(-9)).toBe(FP_PITCH.min); // clamped look up
  });

  it('fpLookDir computes unit forward vector (forward = -sin, -cos)', () => {
    const d = fpLookDir(Math.PI, 0);
    expect(d.x).toBeCloseTo(0, 5);
    expect(d.y).toBeCloseTo(0, 5);
    expect(d.z).toBeCloseTo(1, 5);

    const level = fpLookDir(0, 0);
    expect(level.y).toBeCloseTo(0, 5);
    const down = fpLookDir(0, 0.5);
    expect(down.y).toBeLessThan(0);
    const up = fpLookDir(0, -0.5);
    expect(up.y).toBeGreaterThan(0);

    const any = fpLookDir(2.3, -0.42);
    expect(Math.hypot(any.x, any.y, any.z)).toBeCloseTo(1, 6);
  });

  it('eye height sits above the feet anchor', () => {
    expect(FP_EYE).toBeGreaterThan(1.2);
    expect(FP_EYE).toBeLessThan(1.9);
  });
});
