import { describe, it, expect } from 'vitest';
import {
  QUALITY_PRESETS,
  resolveQuality,
  qualityConfig,
  lowSpecProfile,
  adaptiveDpr,
  ADAPTIVE_DPR_FLOOR,
} from '../game/quality';
import {
  registerCull,
  unregisterCull,
  resetCullRegistry,
  cullDecision,
  cullRegistry,
  perfState,
  PREWARM,
} from '../game/runtime';
import { classifyGpu } from '../game/mobile';

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

describe('quality presets — PBR shader-cost knobs (v0.14.2)', () => {
  it('reflection strength (envMul) decreases high → low, RENDAH has none', () => {
    expect(QUALITY_PRESETS.high.envMul).toBeGreaterThan(QUALITY_PRESETS.medium.envMul);
    expect(QUALITY_PRESETS.medium.envMul).toBeGreaterThan(0);
    expect(QUALITY_PRESETS.low.envMul).toBe(0);
  });

  it('envMul never boosts beyond the authored look', () => {
    expect(QUALITY_PRESETS.high.envMul).toBeLessThanOrEqual(1);
  });

  it('RENDAH drops normal/roughness maps (albedo-only PBR); other tiers keep them', () => {
    expect(QUALITY_PRESETS.high.pbrMaps).toBe(true);
    expect(QUALITY_PRESETS.medium.pbrMaps).toBe(true);
    expect(QUALITY_PRESETS.low.pbrMaps).toBe(false);
  });
});

describe('quality presets — weak profile + adaptive dpr (v0.14.3)', () => {
  it('lowSpecProfile: weak device tier OR user-selected RENDAH', () => {
    // device tier decides when auto
    expect(lowSpecProfile('auto', 'low')).toBe(true);
    expect(lowSpecProfile('auto', 'high')).toBe(false);
    // explicit RENDAH means weak profile on ANY device (the laptop report)
    expect(lowSpecProfile('low', 'high')).toBe(true);
    // better presets never flag a healthy tier
    expect(lowSpecProfile('medium', 'high')).toBe(false);
    expect(lowSpecProfile('high', 'high')).toBe(false);
  });

  it('adaptiveDpr steps down on low fps, holds in the band, recovers on high', () => {
    // drop: 15% per step, never below the floor
    expect(adaptiveDpr(1, 1, 30)).toBe(0.85);
    expect(adaptiveDpr(1, 0.85, 30)).toBeCloseTo(0.72, 2);
    expect(adaptiveDpr(1, 0.6, 10)).toBe(ADAPTIVE_DPR_FLOOR);
    expect(adaptiveDpr(2, 0.6, 0)).toBe(ADAPTIVE_DPR_FLOOR);
    // band 42..56: hold
    expect(adaptiveDpr(1, 0.85, 50)).toBe(0.85);
    // recover: climbs back toward base, never beyond it
    expect(adaptiveDpr(1, 0.85, 60)).toBe(1);
    expect(adaptiveDpr(1, 1, 60)).toBe(1);
    expect(adaptiveDpr(1.5, 0.85, 60)).toBe(1);
  });
});

describe('quality presets — GPU-aware auto resolution (v0.14.4)', () => {
  it('classifyGpu reads real renderer strings', () => {
    // the reporting laptop — AMD Radeon iGPU over D3D11 (ANGLE string)
    expect(classifyGpu('ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('igpu');
    expect(classifyGpu('ANGLE (Intel, Intel(R) UHD Graphics Direct3D11, D3D11)')).toBe('igpu');
    expect(classifyGpu('Mesa Intel(R) Iris(R) Xe Graphics (TGL GT2)')).toBe('igpu');
    expect(classifyGpu('ANGLE (AMD, AMD Radeon 780M Graphics Direct3D11, D3D11)')).toBe('igpu');
    expect(classifyGpu('ANGLE (Intel, Intel(R) Arc(TM) Graphics Direct3D11, D3D11)')).toBe('igpu');
    // discrete cards keep the full-fat default
    expect(classifyGpu('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('dgpu');
    expect(classifyGpu('ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)')).toBe('dgpu');
    expect(classifyGpu('AMD Radeon Pro W6800')).toBe('dgpu');
    expect(classifyGpu('NVIDIA T1000')).toBe('dgpu');
    // CPU rasterizers = the weakest class
    expect(classifyGpu('SwiftShader')).toBe('soft');
    expect(classifyGpu('llvmpipe (LLVM 15.0.4, 256 bits)')).toBe('soft');
    // Apple / unrecognized strings keep the pre-v0.14.4 behavior
    expect(classifyGpu('Apple M1')).toBe('unknown');
    expect(classifyGpu('')).toBe('unknown');
  });

  it("resolveQuality('auto') drops an iGPU laptop to SEDANG, a soft GPU to RENDAH", () => {
    // the exact regression from the perf report: 8-core laptop, tier 'high',
    // integrated Radeon → used to resolve TINGHI (dpr 2.0, 18 FPS measured)
    expect(resolveQuality('auto', 'high', 'igpu')).toBe('medium');
    expect(resolveQuality('auto', 'high', 'soft')).toBe('low');
    expect(resolveQuality('auto', 'high', 'dgpu')).toBe('high');
    expect(resolveQuality('auto', 'high', 'unknown')).toBe('high');
    // phones unchanged
    expect(resolveQuality('auto', 'low', 'igpu')).toBe('medium');
    // explicit selection always wins over hardware hints
    expect(resolveQuality('high', 'high', 'igpu')).toBe('high');
    expect(resolveQuality('low', 'low', 'dgpu')).toBe('low');
  });

  it('lowSpecProfile: iGPU on SEDANG joins the weak budget, a dGPU desktop does not', () => {
    expect(lowSpecProfile('auto', 'high', 'igpu')).toBe(true);    // MSAA off + crowd halved
    expect(lowSpecProfile('medium', 'high', 'igpu')).toBe(true);
    expect(lowSpecProfile('medium', 'high', 'dgpu')).toBe(false); // desktop can afford it
    expect(lowSpecProfile('high', 'high', 'igpu')).toBe(false);   // user insisted TINGHI
    expect(lowSpecProfile('auto', 'high', 'soft')).toBe(true);
    expect(lowSpecProfile('auto', 'low', 'dgpu')).toBe(true);     // phones unchanged
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

  it('v0.14.3 fog culling: bundles fully past farRange hide even in frustum', () => {
    const entry = { center: [200, 0, 0] as [number, number, number], radius: 10, mode: 'frustum' as const };
    // near edge at 190m, farRange 110 → 100% fogged → hidden despite frustum
    expect(cullDecision(entry, origin, { interiorRange: 42, margin: 6, inFrustum: true, farRange: 110 })).toBe(true);
    // near edge still inside the fog (115-10=105 < 110) → keep visible
    const nearFog = { center: [115, 0, 0] as [number, number, number], radius: 10, mode: 'frustum' as const };
    expect(cullDecision(nearFog, origin, { interiorRange: 42, margin: 6, inFrustum: true, farRange: 110 })).toBe(false);
    // no farRange = legacy behavior (in-frustum bundle stays)
    expect(cullDecision(entry, origin, { interiorRange: 42, margin: 6, inFrustum: true })).toBe(false);
  });

  it('prewarm flag exists and perfState tracks readiness', () => {
    expect(typeof PREWARM).toBe('boolean');
    expect(perfState.worldReady).toBe(false);
    expect(perfState.hiddenBundles).toBe(0);
  });
});
