// ============================================================================
// daynight.ts — sky/lighting keyframes (v0.10.0, user request: siklus
// siang–malam). Pure module — no three.js import, unit-testable in node.
//
// The school clock is story-driven (PERIOD_TABLE in systems/time.ts), so the
// sky is sampled from `clock.minutes` and smoothly chased by DayNightRig
// (game/world/World.tsx). Keyframes follow the school day: dawn arrival →
// bright noon classes → golden "Pulang Sekolah" → dusk/night for the late
// story beats (graduation, gang meetings).
//
// Free-roam time flow: TimeFlow advances the clock +1 game-minute every
// FREE_ROAM_STEP seconds while the player walks around (mode GAMEPLAY), but
// NEVER crosses a period boundary — StoryDirector, hiddenEvents and side
// quests gate on `periodFor(...).id`, so crossing one would break quest
// windows (canteen_teh needs 'lunch', field_training needs 'after').
// 'after' (Pulang Sekolah, 14:00→23:59) is capped at EVENING_CAP so free
// roaming drifts into golden hour but never pitch-black night.
// ============================================================================

export type SkyState = {
  /** sun (or moon) light position — direction only, magnitude is free */
  sun: [number, number, number];
  /** sun light color, 0xRRGGBB */
  sunColor: number;
  sunIntensity: number;
  ambient: number;
  hemi: number;
  /** scene background + fog tint, 0xRRGGBB */
  bg: number;
  fog: number;
};

type SkyKey = SkyState & { at: number };

// Sun sweeps east → west across the school day (x = east+ here matches the
// campus' main street facing). y never reaches 0 so shadows stay sane.
const KEYS: SkyKey[] = [
  // 05:30 — fajar: matahari rendah di timur, oranye hangat
  { at: 330, sun: [70, 9, 40], sunColor: 0xffb27a, sunIntensity: 1.35, ambient: 0.44, hemi: 0.36, bg: 0xdfb494, fog: 0xd9ae8e },
  // 08:00 — pagi: kelas dimulai, langit biru cerah
  { at: 480, sun: [58, 36, 48], sunColor: 0xffe9c9, sunIntensity: 2.15, ambient: 0.56, hemi: 0.46, bg: 0xaccbdd, fog: 0xb8cad8 },
  // 12:00 — tengah hari: putih terang (look default lama)
  { at: 720, sun: [-6, 74, 34], sunColor: 0xfff7ea, sunIntensity: 2.5, ambient: 0.62, hemi: 0.5, bg: 0xa8c2d6, fog: 0xb6c8d6 },
  // 15:00 — sore: mulai keemasan
  { at: 900, sun: [-48, 44, 44], sunColor: 0xffe2b0, sunIntensity: 2.25, ambient: 0.56, hemi: 0.44, bg: 0xb0c2ce, fog: 0xbfc3c2 },
  // 17:30 — senja: golden hour "Pulang Sekolah"
  { at: 1050, sun: [-66, 13, 38], sunColor: 0xff9a55, sunIntensity: 1.6, ambient: 0.46, hemi: 0.36, bg: 0xd99a6c, fog: 0xcaa07e },
  // 19:00 — maghrib: ungu kebiruan, lampu gedung mulai terasa
  { at: 1140, sun: [-58, 6, 30], sunColor: 0x8a78b8, sunIntensity: 0.8, ambient: 0.36, hemi: 0.3, bg: 0x4a5570, fog: 0x55607a },
  // 21:30 — malam: biru gelap, bulan tipis
  { at: 1290, sun: [-28, 34, 22], sunColor: 0x8fa8d9, sunIntensity: 0.42, ambient: 0.28, hemi: 0.24, bg: 0x1f2937, fog: 0x2a3548 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Lerp two 0xRRGGBB colors per channel (pure, no three.js). */
export function lerpHex(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return (r << 16) | (g << 8) | bl;
}

function lerpState(a: SkyKey, b: SkyKey, t: number): SkyState {
  return {
    sun: [lerp(a.sun[0], b.sun[0], t), lerp(a.sun[1], b.sun[1], t), lerp(a.sun[2], b.sun[2], t)],
    sunColor: lerpHex(a.sunColor, b.sunColor, t),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity, t),
    ambient: lerp(a.ambient, b.ambient, t),
    hemi: lerp(a.hemi, b.hemi, t),
    bg: lerpHex(a.bg, b.bg, t),
    fog: lerpHex(a.fog, b.fog, t),
  };
}

/**
 * Sky state for a minute-of-day. Before dawn / after night the edge keyframes
 * hold (the school week never plays past 21:30 — story beats jump the clock).
 */
export function skyStateFor(minutes: number): SkyState {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  if (m <= KEYS[0].at) return lerpState(KEYS[0], KEYS[0], 0);
  const last = KEYS[KEYS.length - 1];
  if (m >= last.at) return lerpState(last, last, 0);
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (m >= a.at && m < b.at) return lerpState(a, b, (m - a.at) / (b.at - a.at));
  }
  return lerpState(last, last, 0);
}

// ---------------------------------------------------------------------------
// Free-roam time flow (TimeFlow component consumes these)
// ---------------------------------------------------------------------------

/** +1 game minute per step while the player walks around. */
export const FREE_ROAM_STEP_SEC = 3;

/**
 * Sunset cap for the 'after' period — golden hour yes, pitch black no.
 * (19:30; the graduation walk plays around here.)
 */
export const EVENING_CAP = 19 * 60 + 30;

/**
 * Highest minute free-roam drift may reach from `minutes` WITHOUT leaving the
 * current period (systems/time.ts PERIOD_TABLE). Returns the period's end for
 * school periods, EVENING_CAP for 'after'. When already at/after the cap the
 * result is ≤ minutes and callers simply no-op.
 */
export function freeRoamCapFor(minutes: number): number {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(m / 60);
  // PERIOD_TABLE (systems/time.ts): arrive 6-8, class 8-10, break 10-11,
  // class2 11-12, lunch 12-13:30, class3 13:30-14, after 14-24.
  if (m < 6 * 60) return 6 * 60;
  if (h < 8) return 8 * 60;
  if (h < 10) return 10 * 60;
  if (h < 11) return 11 * 60;
  if (h < 12) return 12 * 60;
  if (m < 13 * 60 + 30) return 13 * 60 + 30;
  if (m < 14 * 60) return 14 * 60;
  return Math.max(m, EVENING_CAP);
}

/**
 * Minutes TimeFlow should add this step (0 = at cap). Clamped so the sum
 * never overshoots the cap — story effects remain the only thing that can
 * cross a period boundary.
 */
export function freeRoamStep(minutes: number): number {
  const cap = freeRoamCapFor(minutes);
  return Math.max(0, Math.min(1, cap - Math.round(minutes)));
}
