import { describe, it, expect } from 'vitest';
import { QUALITY_PRESETS, resolveQuality, qualityConfig } from '../game/quality';
import {
  registerCull,
  unregisterCull,
  resetCullRegistry,
  cullDecision,
  cullRegistry,
  perfState,
  PREWARM,
} from '../game/runtime';

describe('quality presets (v0.9.0)', () => {
  it('orders presets from full-fat (high) to lean (low)', () => {
    expect(QUALITY_PRESETS.high.dpr).toBeGreaterThan(QUALITY_PRESETS.medium.dpr);
    expect(QUALITY_PRESETS.medium.dpr).toBeGreaterThan(QUALITY_PRESETS.low.dpr);
    expect(QUALITY_PRESETS.high.shadowMapSize).toBeGreaterThan(QUALITY_PRESETS.medium.shadowMapSize);
    expect(QUALITY_PRESETS.high.fogFar).toBeGreaterThan(QUALITY_PRESETS.low.fogFar);
    expect(QUALITY_PRESETS.low.shadows).toBe(false);
    expect(QUALITY_PRESETS.low.sky).toBe(false);
    expect(QUALITY_PRESETS.high.shadows).toBe(true);
  });

  it('resolveQuality maps auto from the device tier', () => {
    expect(resolveQuality('auto', 'high')).toBe('high');
    expect(resolveQuality('auto', 'low')).toBe('medium');
    // explicit selection always wins over the tier
    expect(resolveQuality('low', 'high')).toBe('low');
    expect(resolveQuality('high', 'low')).toBe('high');
  });

  it('qualityConfig returns the resolved preset object', () => {
    expect(qualityConfig('auto', 'low')).toBe(QUALITY_PRESETS.medium);
    expect(qualityConfig('medium', 'high')).toBe(QUALITY_PRESETS.medium);
  });
});

describe('cull registry + decision (v0.9.0)', () => {
  it('registers and unregisters entries with unique ids', () => {
    resetCullRegistry();
    const idA = registerCull({ obj: {}, center: [0, 0, 0], radius: 5, mode: 'frustum' });
    const idB = registerCull({ obj: {}, center: [10, 0, 0], radius: 5, mode: 'interior' });
    expect(cullRegistry.entries.length).toBe(2);
    expect(idA).not.toBe(idB);
    unregisterCull(idA);
    expect(cullRegistry.entries.length).toBe(1);
    expect(cullRegistry.entries[0].mode).toBe('interior');
    // unregistering a missing id is a no-op
    unregisterCull(idA);
    expect(cullRegistry.entries.length).toBe(1);
    resetCullRegistry();
    expect(cullRegistry.entries.length).toBe(0);
  });

  const origin = { x: 0, y: 1.6, z: 0 };

  it('hides interior bundles beyond interiorRange regardless of frustum', () => {
    const entry = { center: [40, 1, 0] as [number, number, number], radius: 8, mode: 'interior' as const };
    // 40m away, inside the frustum, but past the low-tier interiorRange 42? → on the edge
    expect(cullDecision(entry, origin, { interiorRange: 42, margin: 6, inFrustum: true })).toBe(false);
    expect(cullDecision(entry, origin, { interiorRange: 30, margin: 6, inFrustum: true })).toBe(true);
  });

  it('keeps frustum bundles visible while in view, hides only when far behind', () => {
    const entry = { center: [0, 0, -50] as [number, number, number], radius: 10, mode: 'frustum' as const };
    expect(cullDecision(entry, origin, { interiorRange: 42, margin: 6, inFrustum: true })).toBe(false);
    // outside frustum but within reach (radius + margin = 16): bundle at 14m → visible
    const near = { center: [0, 0, -14] as [number, number, number], radius: 10, mode: 'frustum' as const };
    expect(cullDecision(near, origin, { interiorRange: 42, margin: 6, inFrustum: false })).toBe(false);
    // outside frustum and far beyond reach (50m > 16) → hide
    expect(cullDecision(entry, origin, { interiorRange: 42, margin: 6, inFrustum: false })).toBe(true);
    const far = { center: [0, 0, -500] as [number, number, number], radius: 10, mode: 'frustum' as const };
    expect(cullDecision(far, origin, { interiorRange: 42, margin: 6, inFrustum: false })).toBe(true);
  });

  it('distance uses full 3D center (elevated bundles)', () => {
    const mezz = { center: [0, 8, 0] as [number, number, number], radius: 5, mode: 'interior' as const };
    // 8m up, range 6 → hidden even though x/z overlap
    expect(cullDecision(mezz, origin, { interiorRange: 6, margin: 6, inFrustum: true })).toBe(true);
  });

  it('prewarm flag exists and perfState tracks readiness', () => {
    expect(typeof PREWARM).toBe('boolean');
    expect(perfState.worldReady).toBe(false);
    expect(perfState.hiddenBundles).toBe(0);
  });
});
