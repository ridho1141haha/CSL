// ============================================================================
// daynight.ts — physically-inspired sky & lighting keyframes (v0.18.1).
// Pure module — no three.js import, unit-testable in node.
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

// Physically tuned keyframes for ACES Filmic tone mapping + realistic atmospheric scattering
const KEYS: SkyKey[] = [
  // 05:30 — fajar: matahari terbit rendah di timur, semburat hangat keemasan & kabut pagi lembut
  { at: 330, sun: [75, 10, 42], sunColor: 0xffa866, sunIntensity: 1.85, ambient: 0.42, hemi: 0.40, bg: 0xe5b895, fog: 0xdcb08e },
  // 08:00 — pagi: udara segar, langit biru jernih dengan cahaya matahari pagi hangat
  { at: 480, sun: [58, 38, 48], sunColor: 0xffecd2, sunIntensity: 2.65, ambient: 0.55, hemi: 0.52, bg: 0x9ec6e6, fog: 0xb5cfe3 },
  // 12:00 — tengah hari: matahari tinggi, kontras bayangan tajam, zenith biru dalam
  { at: 720, sun: [-6, 76, 34], sunColor: 0xfff9f0, sunIntensity: 3.10, ambient: 0.60, hemi: 0.58, bg: 0x8bb8de, fog: 0xb0cae0 },
  // 15:00 — sore: cahaya mulai miring dan hangat keemasan
  { at: 900, sun: [-50, 42, 44], sunColor: 0xffe0a8, sunIntensity: 2.70, ambient: 0.54, hemi: 0.48, bg: 0xa4bfd6, fog: 0xc2c7c8 },
  // 17:30 — senja (Golden Hour "Pulang Sekolah"): langit jingga kemerahan dramatis
  { at: 1050, sun: [-70, 11, 38], sunColor: 0xff7b38, sunIntensity: 2.10, ambient: 0.44, hemi: 0.38, bg: 0xd98a5c, fog: 0xcc926a },
  // 19:00 — maghrib / blue hour: transisi lembayung ke biru malam
  { at: 1140, sun: [-58, 5, 30], sunColor: 0x7b6eb0, sunIntensity: 0.85, ambient: 0.32, hemi: 0.28, bg: 0x2c3654, fog: 0x35405e },
  // 21:30 — malam: langit malam berbintang biru gelap, cahaya bulan perak kebiruan
  { at: 1290, sun: [-28, 36, 22], sunColor: 0x9bb8eb, sunIntensity: 0.55, ambient: 0.24, hemi: 0.22, bg: 0x0d1321, fog: 0x151e30 },
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

export const FREE_ROAM_STEP_SEC = 3;
export const EVENING_CAP = 19 * 60 + 30;

export function freeRoamCapFor(minutes: number): number {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(m / 60);
  if (m < 6 * 60) return 6 * 60;
  if (h < 8) return 8 * 60;
  if (h < 10) return 10 * 60;
  if (h < 11) return 11 * 60;
  if (h < 12) return 12 * 60;
  if (m < 13 * 60 + 30) return 13 * 60 + 30;
  if (m < 14 * 60) return 14 * 60;
  return Math.max(m, EVENING_CAP);
}

export function freeRoamStep(minutes: number): number {
  const cap = freeRoamCapFor(minutes);
  return Math.max(0, Math.min(1, cap - Math.round(minutes)));
}
