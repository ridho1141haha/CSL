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
  // v0.14.2 "PBR ringan": user lapor "texture pbr terlalu berat apalagi
  // refleksi cahayanya". Dua knob shader-cost (bukan VRAM):
  //   pbrMaps  — false → <Pbr> melepas normalMap+roughnessMap (albedo saja:
  //              tanpa TBN rebuild + 2 sample/px lebih sedikit di fragmen).
  //              Roughness tetap sebagai skalar hasil art direction.
  //   envMul   — pengali global refleksi environment (IBL). 0 → <Environment>
  //              TIDAK di-mount sama sekali (World.tsx) → scene.environment
  //              null → SEMUA material standard dikompilasi TANPA blok IBL
  //              (indirect specular "refleksi cahaya" + indirect diffuse
  //              hilang dari shader, hemat per-piksel di seluruh dunia).
  //              Nilai lain mengali environmentIntensity <Environment>.
  pbrMaps: boolean;
  envMul: number;
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
    pbrMaps: true,
    envMul: 0.8,
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

// ---------------------------------------------------------------------------
// v0.14.3 — "masih patah-patah padahal udah RENDAH" (laptop lemah)
//
// Audit: tier-based low-spec treatments (ambient crowd halving, MSAA off,
// cloth maps off) hanya mengikuti DEVICE tier — laptop sentuh/tier 'high'
// mendapat 19 figur × ~30 mesh + MSAA + peta kain full walau preset RENDAH.
// Knob draw-call & context juga tidak bisa berubah live, jadi:
//   lowSpecProfile — dipakai untuk halaman/ctx-level (AA) & crowd: TRUE juga
//   ketika USER memilih RENDAH, bukan cuma perangkat lemah.
//   adaptiveDpr    — jaring pengaman: FPS terjun → turunkan dpr bertahap
//   (fill-rate), FPS sehat → naik pelan ke dpr preset. Murni & teruji.
// ---------------------------------------------------------------------------

/** Weak-profile flag: weak device OR user-selected RENDAH. Pure & testable. */
export function lowSpecProfile(selected: Quality, tier: Tier): boolean {
  return tier === 'low' || resolveQuality(selected, tier) === 'low';
}

/** Dpr floor for the adaptive loop — blurry, but the game stays playable. */
export const ADAPTIVE_DPR_FLOOR = 0.55;

/** One adaptive step. Pure — drop on sustained low fps, recover on healthy. */
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
