import { describe, it, expect } from 'vitest';
import {
  skyStateFor,
  freeRoamCapFor,
  freeRoamStep,
  lerpHex,
  EVENING_CAP,
  FREE_ROAM_STEP_SEC,
} from '../game/daynight';

const lum = (hex: number) => ((hex >> 16) & 0xff) + ((hex >> 8) & 0xff) + (hex & 0xff);

describe('daynight sky keyframes (v0.10.0)', () => {
  it('noon is the brightest state, night the darkest', () => {
    const noon = skyStateFor(12 * 60);
    const night = skyStateFor(21 * 60 + 30);
    expect(noon.sunIntensity).toBeGreaterThan(2);
    expect(night.sunIntensity).toBeLessThan(0.6);
    expect(night.ambient).toBeLessThan(noon.ambient);
    expect(lum(night.bg)).toBeLessThan(lum(noon.bg) / 2);
  });

  it('dawn/sunset sun is warm (red > blue), noon sun is near-white', () => {
    const dawn = skyStateFor(330);
    const noon = skyStateFor(720);
    const rD = (dawn.sunColor >> 16) & 0xff;
    const bD = dawn.sunColor & 0xff;
    expect(rD).toBeGreaterThan(bD + 40);
    const rN = (noon.sunColor >> 16) & 0xff;
    const bN = noon.sunColor & 0xff;
    expect(Math.abs(rN - bN)).toBeLessThan(30);
  });

  it('golden hour ("Pulang Sekolah" drift target) is dimmer and warmer than noon', () => {
    const sunset = skyStateFor(17 * 60 + 30);
    const noon = skyStateFor(720);
    expect(sunset.sunIntensity).toBeLessThan(noon.sunIntensity);
    expect(((sunset.sunColor >> 16) & 0xff) - (sunset.sunColor & 0xff)).toBeGreaterThan(
      ((noon.sunColor >> 16) & 0xff) - (noon.sunColor & 0xff),
    );
  });

  it('interpolates smoothly inside a segment (no overshoot beyond keyframes)', () => {
    const a = skyStateFor(480); // 08:00 key
    const b = skyStateFor(720); // 12:00 key
    const mid = skyStateFor(600);
    expect(mid.sunIntensity).toBeGreaterThanOrEqual(Math.min(a.sunIntensity, b.sunIntensity) - 1e-9);
    expect(mid.sunIntensity).toBeLessThanOrEqual(Math.max(a.sunIntensity, b.sunIntensity) + 1e-9);
  });

  it('clamps out-of-range minutes', () => {
    expect(skyStateFor(-5)).toEqual(skyStateFor(0));
    expect(skyStateFor(2000)).toEqual(skyStateFor(1439));
  });

  it('lerpHex blends per channel', () => {
    expect(lerpHex(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(lerpHex(0x000000, 0xffffff, 1)).toBe(0xffffff);
    // half-way grey: every channel equal
    const mid = lerpHex(0x000000, 0xffffff, 0.5);
    const r = (mid >> 16) & 0xff;
    const g = (mid >> 8) & 0xff;
    const b = mid & 0xff;
    expect(r).toBe(g);
    expect(g).toBe(b);
    expect(Math.abs(r - 128)).toBeLessThanOrEqual(1);
  });
});

describe('free-roam time drift (TimeFlow guardrails)', () => {
  it('caps at the current period end, never crossing it', () => {
    expect(freeRoamCapFor(7 * 60 + 12)).toBe(8 * 60); // arrive → class
    expect(freeRoamCapFor(9 * 60 + 30)).toBe(10 * 60); // class → break
    expect(freeRoamCapFor(10 * 60 + 20)).toBe(11 * 60); // break → class2
    expect(freeRoamCapFor(11 * 60 + 5)).toBe(12 * 60); // class2 → lunch
    expect(freeRoamCapFor(12 * 60 + 45)).toBe(13 * 60 + 30); // lunch → class3
    expect(freeRoamCapFor(13 * 60 + 45)).toBe(14 * 60); // class3 → after
  });

  it("'after' drifts to the evening cap, no further", () => {
    expect(freeRoamCapFor(14 * 60 + 10)).toBe(EVENING_CAP);
    expect(EVENING_CAP).toBe(19 * 60 + 30);
  });

  it('is a no-op at or past the cap', () => {
    expect(freeRoamStep(EVENING_CAP)).toBe(0);
    expect(freeRoamStep(23 * 60)).toBe(0);
    expect(freeRoamCapFor(23 * 60)).toBe(23 * 60);
  });

  it('emits at most 1 minute per step', () => {
    expect(freeRoamStep(7 * 60 + 12)).toBe(1);
    expect(freeRoamStep(7 * 60 + 59)).toBe(1);
    expect(freeRoamStep(8 * 60)).toBe(1); // just entered 'class', room until 10:00
  });

  it('step interval is slow enough to feel ambient, fast enough to notice', () => {
    // 6 min of walking covers a 2h period window; golden hour reachable in a
    // session but quest windows (which the story sets explicitly) stay intact.
    expect(FREE_ROAM_STEP_SEC).toBeGreaterThanOrEqual(2);
    expect(FREE_ROAM_STEP_SEC).toBeLessThanOrEqual(5);
  });
});
