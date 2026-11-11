// ============================================================================
// quality.ts — graphics quality presets (v0.9.0 -> v0.18.1 Realistic High Preset).
// One place that maps a user-selected quality tier to concrete renderer knobs:
//   dpr            — pixel ratio cap (biggest mobile GPU lever)
//   shadows        — shadow maps on/off at all
//   shadowMapSize  — directional shadow resolution (4096 on HIGH for crisp edges)
//   sky            — Preetham atmospheric <Sky> shader + volumetric clouds/sun/moon
//   fogNear/Far    — view distance; also hides the pop of distant culling
//   interiorRange  — interior furniture beyond this camera distance is hidden
//   cullMargin     — extra meters added to cull spheres so edges don't pop
//   texScale       — procedural PBR texture scale factor
//   aniso          — anisotropic filtering max level (8x on HIGH)
//   pbrMaps        — enables normalMap + roughnessMap
//   envMul         — global IBL reflection multiplier (1.15 on HIGH for realistic PBR)
//   realisticSky   — enables custom GLSL volumetric clouds, sun corona, moon & stars
//   envRes         — Environment map cubemap resolution (256 on HIGH, 64 on MEDIUM)
// ============================================================================

import { mobile, type Tier, type GpuClass } from './mobile';

export type Quality = 'auto' | 'high' | 'medium' | 'low';
export type Resolved = Exclude<Quality, 'auto'>;

export type QualityConfig = {
  dpr: number;
  shadows: boolean;
  shadowMapSize: number;
  sky: boolean;
  fogNear: number;
  fogFar: number;
  interiorRange: number;
  cullMargin: number;
  texScale: number;
  aniso: number;
  pbrMaps: boolean;
  envMul: number;
  realisticSky?: boolean;
  envRes?: number;
};

export const QUALITY_PRESETS: Record<Resolved, QualityConfig> = {
  high: {
    dpr: 2,
    shadows: true,
    shadowMapSize: 4096,
    sky: true,
    fogNear: 85,
    fogFar: 280,
    interiorRange: 95,
    cullMargin: 6,
    texScale: 1,
    aniso: 8,
    pbrMaps: true,
    envMul: 1.15,
    realisticSky: true,
    envRes: 256,
  },
  medium: {
    dpr: 1.5,
    shadows: true,
    shadowMapSize: 1024,
    sky: true,
    fogNear: 55,
    fogFar: 170,
    interiorRange: 60,
    cullMargin: 8,
    texScale: 0.75,
    aniso: 2,
    pbrMaps: true,
    envMul: 0.5,
    realisticSky: false,
    envRes: 64,
  },
  low: {
    dpr: 1,
    shadows: false,
    shadowMapSize: 512,
    sky: false,
    fogNear: 38,
    fogFar: 110,
    interiorRange: 42,
    cullMargin: 10,
    texScale: 0.5,
    aniso: 1,
    pbrMaps: false,
    envMul: 0,
    realisticSky: false,
    envRes: 32,
  },
};

export function resolveQuality(selected: Quality, tier: Tier, gpu: GpuClass = mobile.gpu): Resolved {
  if (selected === 'high' || selected === 'medium' || selected === 'low') return selected;
  if (selected !== 'auto') return 'medium';
  if (gpu === 'soft') return 'low';
  if (tier === 'low' || gpu === 'igpu') return 'medium';
  return 'high';
}

export function qualityConfig(selected: Quality, tier: Tier): QualityConfig {
  return QUALITY_PRESETS[resolveQuality(selected, tier)];
}

export function lowSpecProfile(selected: Quality, tier: Tier, gpu: GpuClass = mobile.gpu): boolean {
  const resolved = resolveQuality(selected, tier, gpu);
  return tier === 'low' || resolved === 'low' || (resolved === 'medium' && gpu === 'igpu');
}

export const ADAPTIVE_DPR_FLOOR = 0.55;

export function adaptiveDpr(base: number, current: number, fps: number): number {
  if (fps < 42) return Math.max(ADAPTIVE_DPR_FLOOR, Math.round(current * 0.85 * 100) / 100);
  if (fps > 56 && current < base) return Math.min(base, Math.round((current / 0.85) * 100) / 100);
  return current;
}

export const QUALITY_LABELS: Record<Quality, string> = {
  auto: 'OTOMATIS',
  high: 'TINGGI',
  medium: 'SEDANG',
  low: 'RENDAH',
};
