// ============================================================================
// quality.ts — graphics quality presets (v0.9.0, user request: "menurunkan
// grafik"). One place that maps a user-selected quality tier to concrete
// renderer knobs:
//   dpr            — pixel ratio cap (biggest mobile GPU lever)
//   shadows        — shadow maps on/off at all
//   shadowMapSize  — directional shadow resolution
//   sky            — drei <Sky> shader (expensive on weak GPUs; flat bg color
//                    + fog reads almost the same at distance)
//   fogNear/Far    — view distance; also hides the pop of distant culling
//   interiorRange  — interior furniture beyond this camera distance is hidden
//                    (interior culling; walls hide it anyway)
//   cullMargin     — extra meters added to cull spheres so edges don't pop
//
// 'auto' resolves from the device tier (mobile.ts) so phones default to a
// safe preset while desktops keep the full look.
// ============================================================================

import type { Tier } from './mobile';

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
  // v0.12.0 "low texture": faktor skala tekstur prosedural (256px × scale)
  // + anisotropy maksimum — memangkas VRAM ~4× di RENDAH, tanpa mengubah
  // geometri/culling. Dibaca pbr.ts saat tekstur pertama dibangun.
  texScale: number;
  aniso: number;
};

export const QUALITY_PRESETS: Record<Resolved, QualityConfig> = {
  high: {
    dpr: 2,
    shadows: true,
    shadowMapSize: 2048,
    sky: true,
    fogNear: 70,
    fogFar: 230,
    interiorRange: 80,
    cullMargin: 6,
    texScale: 1,
    aniso: 4,
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
  },
};

/** Pure mapping — unit-testable without a DOM. */
export function resolveQuality(selected: Quality, tier: Tier): Resolved {
  if (selected !== 'auto') return selected;
  return tier === 'low' ? 'medium' : 'high';
}

export function qualityConfig(selected: Quality, tier: Tier): QualityConfig {
  return QUALITY_PRESETS[resolveQuality(selected, tier)];
}

export const QUALITY_LABELS: Record<Quality, string> = {
  auto: 'OTOMATIS',
  high: 'TINGGI',
  medium: 'SEDANG',
  low: 'RENDAH',
};
