import { describe, it, expect } from 'vitest';
import {
  clampPitch,
  nextMode,
  fpLookDir,
  reclampOnSwitch,
  FP_EYE,
  FP_PITCH,
  TP_PITCH,
} from '../game/camera/mode';

describe('camera mode helpers (v0.13.0)', () => {
  it('third-person pitch stays in the orbit elevation band', () => {
    expect(clampPitch('third', -0.5)).toBe(TP_PITCH.min);
    expect(clampPitch('third', 0.4)).toBe(0.4);
    expect(clampPitch('third', 2)).toBe(TP_PITCH.max);
  });

  it('first-person pitch allows looking up and down', () => {
    expect(clampPitch('first', -0.6)).toBe(-0.6); // look up
    expect(clampPitch('first', 0)).toBe(0); // straight ahead
    expect(clampPitch('first', 1.5)).toBe(FP_PITCH.max); // clamped look down
    expect(clampPitch('first', -9)).toBe(FP_PITCH.min);
  });

  it('reclampOnSwitch keeps a mode switch from going under the floor', () => {
    // player looked up in FP (-0.7) then switched to TP → orbit clamps up
    expect(reclampOnSwitch('third', -0.7)).toBe(TP_PITCH.min);
    // steep TP elevation entering FP stays valid
    expect(reclampOnSwitch('first', 0.85)).toBe(0.85);
  });

  it('nextMode toggles both ways', () => {
    expect(nextMode('third')).toBe('first');
    expect(nextMode('first')).toBe('third');
  });

  it('fpLookDir matches the orbit yaw convention (forward = -sin, -cos)', () => {
    // yaw = π is the spawn orbit: camera behind at (sin π, cos π)·d ≈ (0, -1)·d
    // → forward points +z... with yaw = π: -sin π = 0, -cos π = 1 → (0, 0, 1)? No:
    // -cos(π) = 1 → forward +z. Camera at z - d, looking +z. Consistent.
    const d = fpLookDir(Math.PI, 0);
    expect(d.x).toBeCloseTo(0, 5);
    expect(d.y).toBeCloseTo(0, 5);
    expect(d.z).toBeCloseTo(1, 5);

    // straight ahead is level; positive pitch looks DOWN
    const level = fpLookDir(0, 0);
    expect(level.y).toBeCloseTo(0, 5);
    const down = fpLookDir(0, 0.5);
    expect(down.y).toBeLessThan(0);
    const up = fpLookDir(0, -0.5);
    expect(up.y).toBeGreaterThan(0);

    // unit length for arbitrary angles
    const any = fpLookDir(2.3, -0.42);
    expect(Math.hypot(any.x, any.y, any.z)).toBeCloseTo(1, 6);
  });

  it('eye height sits above the feet anchor', () => {
    expect(FP_EYE).toBeGreaterThan(1.2);
    expect(FP_EYE).toBeLessThan(1.9);
  });
});
