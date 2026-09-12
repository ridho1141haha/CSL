import { describe, expect, it } from 'vitest';
import { computeShot } from '../game/systems/shot';
import { SHOT_PRESETS } from '../data/shots';

// Dialogue camera shot math (mentor feedback #2) — pure functions, so the
// framing rules can be regression-tested without a renderer.

const speaker = { x: 0, z: 0 };
const listener = { x: 0, z: -4 }; // listener 4m north of the speaker

describe('dialogue shot presets', () => {
  it('every referenced preset exists and has a valid kind', () => {
    const valid = new Set(['close', 'medium', 'wide', 'ots', 'two']);
    for (const [key, shot] of Object.entries(SHOT_PRESETS)) {
      expect(valid.has(shot.kind), `preset ${key} has invalid kind`).toBe(true);
    }
    // core presets used by dialogue data
    for (const key of ['close_speaker', 'medium_speaker', 'wide_scene', 'ren_ots']) {
      expect(SHOT_PRESETS[key]).toBeDefined();
    }
  });
});

describe('computeShot', () => {
  it('close shot sits ~1.8m from the subject', () => {
    const r = computeShot(SHOT_PRESETS.close_speaker!, speaker, listener);
    const d = Math.hypot(r.pos.x - speaker.x, r.pos.z - speaker.z);
    expect(d).toBeGreaterThan(1.2);
    expect(d).toBeLessThan(2.4);
  });

  it('camera sits on the listener side of the subject (faces the speaker, OTS style)', () => {
    const r = computeShot(SHOT_PRESETS.close_speaker!, speaker, listener);
    // listener is north (z-), camera must also be north of the subject
    expect(r.pos.z).toBeLessThan(speaker.z);
  });

  it('look target sits between subject and listener on the conversation axis', () => {
    const r = computeShot(SHOT_PRESETS.close_speaker!, speaker, listener);
    // speaker z=0, listener z=-4 → look z should be between -0.8 and 0
    expect(r.look.z).toBeLessThanOrEqual(0);
    expect(r.look.z).toBeGreaterThan(-0.8);
  });

  it('two-shot looks at the midpoint of both parties', () => {
    const r = computeShot(SHOT_PRESETS.two_shot!, speaker, listener);
    expect(r.look.x).toBeCloseTo(0, 5);
    expect(r.look.z).toBeCloseTo(-2, 5);
  });

  it('listener-subject shots frame the listener position', () => {
    const r = computeShot(SHOT_PRESETS.close_listener!, speaker, listener);
    const d = Math.hypot(r.pos.x - listener.x, r.pos.z - listener.z);
    expect(d).toBeLessThan(2.4);
  });

  it('degrades gracefully without a listener (solo framing, default axis)', () => {
    const r = computeShot(SHOT_PRESETS.close_speaker!, speaker, null);
    const d = Math.hypot(r.pos.x - speaker.x, r.pos.z - speaker.z);
    expect(d).toBeGreaterThan(1.2);
    expect(d).toBeLessThan(2.4);
    expect(Number.isFinite(r.pos.x)).toBe(true);
    expect(Number.isFinite(r.look.z)).toBe(true);
  });

  it('side=-1 mirrors the camera to the other shoulder', () => {
    const right = computeShot(SHOT_PRESETS.ots_speaker!, speaker, listener);
    const left = computeShot({ ...SHOT_PRESETS.ots_speaker!, side: -1 }, speaker, listener);
    expect(Math.sign(right.pos.x)).not.toBe(Math.sign(left.pos.x));
  });
});
