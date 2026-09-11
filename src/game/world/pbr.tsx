import * as THREE from 'three';
import { useMemo } from 'react';

// ============================================================================
// pbr.ts — procedural PBR texture factory (ZERO network).
//
// Every texture set (albedo + normal + roughness) is painted into canvases at
// runtime and cached. This replaces CDN-served assets, which was the cause of
// the blank-screen bug on mobile networks (Environment preset "city" fetched
// an HDR from an external CDN and the Canvas root crashed when it failed).
//
// All noise is tileable (wrapping lattice), so surfaces repeat cleanly.
// ============================================================================

export type SurfaceName =
  | 'concrete'   // outdoor concrete slabs, pores + hairline cracks
  | 'plaster'    // exterior building wall (warm cream render)
  | 'plaster_in' // interior wall (near white, subtle)
  | 'pavers'     // outdoor paving slabs with joints
  | 'asphalt'    // dark aggregate road
  | 'grass'      // school field
  | 'dirt'       // packed earth (running track / alley)
  | 'brick'      // red running-bond brick (accents, plinths)
  | 'wood'       // planks (benches, desks, floors)
  | 'tile'       // interior floor tile with grout
  | 'terrazzo'   // hallway terrazzo speckle
  | 'metal'      // brushed metal panels + scratches
  | 'corrugated' // vertical corrugated steel (warehouse walls, containers)
  | 'roof'       // standing-seam metal roofing
  | 'bark'       // tree bark
  | 'foliage';   // leafy canopy noise

type Painted = {
  rgb: Uint8ClampedArray;   // albedo (sRGB)
  height: Float32Array;     // 0..1
  rough: Float32Array;      // 0..1
  normalStrength: number;
};

// ---------------------------------------------------------------------------
// Seeded PRNG + tileable value-noise / fbm
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tileable value noise: lattice period `per` wraps, so the texture tiles. */
function valueNoise(seed: number, per: number) {
  const rand = mulberry32(seed);
  const lattice = new Float32Array(per * per);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    // x,y in [0,1)
    const gx = x * per, gy = y * per;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = sm(gx - x0), fy = sm(gy - y0);
    const x1 = (x0 + 1) % per, y1 = (y0 + 1) % per;
    const xa = ((x0 % per) + per) % per, ya = ((y0 % per) + per) % per;
    const v00 = lattice[ya * per + xa], v10 = lattice[ya * per + x1];
    const v01 = lattice[y1 * per + xa], v11 = lattice[y1 * per + x1];
    return (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
  };
}

function fbmFactory(seed: number, per: number, octaves: number) {
  const layers: ((x: number, y: number) => number)[] = [];
  for (let o = 0; o < octaves; o++) layers.push(valueNoise(seed + o * 101, per << o));
  return (x: number, y: number) => {
    let v = 0, amp = 0.5, norm = 0;
    for (let o = 0; o < octaves; o++) { v += layers[o](x, y) * amp; norm += amp; amp *= 0.5; }
    return v / norm;
  };
}

// ---------------------------------------------------------------------------
// Surface painters — each fills albedo/height/rough for a SIZE×SIZE tile
// ---------------------------------------------------------------------------
const SIZE = 256;

type Painter = () => Painted;

/** Mix two colors: c = a*(1-t) + b*t */
function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const PAINTERS: Record<SurfaceName, Painter> = {
  concrete: () => {
    const n = fbmFactory(11, 4, 4);
    const speck = mulberry32(77);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [156, 158, 156];
    const dark: [number, number, number] = [120, 122, 120];
    const light: [number, number, number] = [178, 180, 176];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        let t = n(u, v);
        // pores
        const pore = speck();
        let h = t;
        if (pore > 0.986) { t -= 0.28; h -= 0.5; }
        // hairline cracks — thin, noise-masked so they appear as short
        // faint fractures, not full-tile scribbles (they looked like veins
        // when tiled across large ground planes)
        const c1 = Math.abs(v - 0.3 - 0.05 * Math.sin(u * 21.7));
        const c2 = Math.abs(v - 0.72 + 0.04 * Math.sin(u * 13.3 + 2.1));
        const mask = n(u * 0.5 + 0.25, v * 0.5);
        if ((c1 < 0.0022 || c2 < 0.0018) && mask > 0.42) { t -= 0.1; h -= 0.14; }
        const col = t < 0.45 ? mix(dark, base, t / 0.45) : mix(base, light, (t - 0.45) / 0.55);
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = 0.78 + speck() * 0.18;
      }
    }
    return { rgb, height, rough, normalStrength: 0.7 };
  },

  plaster: () => {
    const n = fbmFactory(23, 5, 4);
    const speck = mulberry32(91);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [233, 226, 210];
    const dark: [number, number, number] = [206, 197, 178];
    const light: [number, number, number] = [245, 240, 226];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        let t = n(u, v);
        let h = t;
        const sp = speck();
        if (sp > 0.992) { t -= 0.15; h -= 0.3; } // small render pits
        // faint vertical streaks (rain stains)
        const streak = Math.sin(u * 40 + n(u, 0.5) * 6);
        if (streak > 0.86) t -= 0.05;
        const col = t < 0.5 ? mix(dark, base, t / 0.5) : mix(base, light, (t - 0.5) / 0.5);
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = 0.82 + speck() * 0.12;
      }
    }
    return { rgb, height, rough, normalStrength: 0.5 };
  },

  plaster_in: () => {
    const n = fbmFactory(41, 6, 3);
    const speck = mulberry32(15);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [238, 236, 230];
    const dark: [number, number, number] = [219, 216, 208];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const t = n(u, v);
        const col = mix(dark, base, 0.35 + t * 0.65);
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = t;
        rough[i] = 0.85 + speck() * 0.1;
      }
    }
    return { rgb, height, rough, normalStrength: 0.35 };
  },

  pavers: () => {
    const n = fbmFactory(57, 8, 3);
    const speck = mulberry32(31);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const stone: [number, number, number] = [167, 169, 171];
    const stoneD: [number, number, number] = [132, 134, 137];
    const joint: [number, number, number] = [96, 97, 99];
    const COLS = 4, ROWS = 4, JOINT = 0.018;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const cx = (u * COLS) % 1, cy = (v * ROWS) % 1;
        const edge = Math.min(cx, 1 - cx, cy, 1 - cy) < JOINT;
        const cell = ((Math.floor(u * COLS) * 7 + Math.floor(v * ROWS) * 13) % 10) / 10;
        let t = n(u, v) * 0.55 + cell * 0.45;
        let h = t;
        if (edge) { t = 0.2; h = 0.12; }
        const col = edge ? joint : mix(stoneD, stone, t);
        if (!edge && speck() > 0.985) { col[0] -= 18; col[1] -= 18; col[2] -= 18; h -= 0.2; }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = edge ? 0.95 : 0.8 + speck() * 0.15;
      }
    }
    return { rgb, height, rough, normalStrength: 1.1 };
  },

  asphalt: () => {
    const n = fbmFactory(71, 6, 4);
    const speck = mulberry32(51);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [65, 70, 76];
    const aggD: [number, number, number] = [38, 41, 45];
    const aggL: [number, number, number] = [96, 100, 105];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const t = n(u, v);
        const col = mix(aggD, base, 0.4 + t * 0.6);
        let h = t * 0.6;
        const sp = speck();
        if (sp > 0.93) { const a = mix(aggD, aggL, speck()); col[0] = a[0]; col[1] = a[1]; col[2] = a[2]; h = 0.5 + speck() * 0.5; }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = 0.9 + speck() * 0.1;
      }
    }
    return { rgb, height, rough, normalStrength: 0.8 };
  },

  grass: () => {
    const n = fbmFactory(83, 8, 4);
    const blade = valueNoise(97, 96);
    const speck = mulberry32(19);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [95, 122, 82];
    const dark: [number, number, number] = [64, 88, 58];
    const light: [number, number, number] = [128, 152, 96];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const t = n(u, v);
        // vertical-ish blade streaks
        const b = blade(u * 1 + Math.sin(v * 60) * 0.01, v * 8) ;
        let col = mix(dark, base, t);
        if (b > 0.62) col = mix(col, light, (b - 0.62) * 1.8);
        if (speck() > 0.99) col = mix(col, [164, 152, 84], 0.5); // dry bits
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = t * 0.7 + b * 0.3;
        rough[i] = 0.92 + speck() * 0.08;
      }
    }
    return { rgb, height, rough, normalStrength: 0.55 };
  },

  dirt: () => {
    const n = fbmFactory(103, 6, 4);
    const speck = mulberry32(63);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [148, 108, 72];
    const dark: [number, number, number] = [110, 80, 54];
    const light: [number, number, number] = [176, 138, 98];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const t = n(u, v);
        const col = mix(dark, base, t);
        if (speck() > 0.94) { const l = mix(dark, light, speck()); col[0] = l[0]; col[1] = l[1]; col[2] = l[2]; }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = t;
        rough[i] = 0.95;
      }
    }
    return { rgb, height, rough, normalStrength: 0.7 };
  },

  brick: () => {
    const n = fbmFactory(127, 8, 3);
    const speck = mulberry32(88);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const brick: [number, number, number] = [146, 74, 56];
    const brickV: [number, number, number] = [122, 60, 46];
    const mortar: [number, number, number] = [188, 182, 170];
    const ROWS = 8, BH = 1 / ROWS, MORTAR = 0.012;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const row = Math.floor(v / BH);
        const off = row % 2 ? 0.25 : 0;
        const cu = (u + off) % 1;
        const inRow = (v - row * BH) / BH;
        const isMortarY = inRow < MORTAR * 2 || inRow > 1 - MORTAR * 2;
        const BU = 0.25;
        const cu2 = cu / BU;
        const colI = Math.floor(cu2);
        const inCol = cu2 - colI;
        const isMortarX = inCol < MORTAR * 1.2 || inCol > 1 - MORTAR * 1.2;
        let col: [number, number, number];
        let h: number;
        if (isMortarY || isMortarX) { col = mortar; h = 0.15; }
        else {
          const vary = n(u, v) * 0.5 + ((colI * 37 + row * 11) % 7) / 7 * 0.5;
          col = mix(brickV, brick, vary);
          h = 0.75 + n(u * 3, v * 3) * 0.25;
          if (speck() > 0.99) { col = mix(col, [40, 34, 30], 0.4); h -= 0.2; }
        }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = isMortarY || isMortarX ? 0.95 : 0.8 + speck() * 0.15;
      }
    }
    return { rgb, height, rough, normalStrength: 1.2 };
  },

  wood: () => {
    const n = fbmFactory(139, 4, 4);
    const grain = valueNoise(151, 128);
    const speck = mulberry32(21);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const PLANKS = 4, GAP = 0.012;
    const base: [number, number, number] = [138, 111, 77];
    const dark: [number, number, number] = [104, 82, 55];
    const light: [number, number, number] = [166, 138, 100];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const row = Math.floor(v * PLANKS);
        const inRow = (v * PLANKS) - row;
        let col: [number, number, number];
        let h: number;
        if (inRow < GAP || inRow > 1 - GAP) { col = [58, 45, 32]; h = 0.1; }
        else {
          // horizontal grain stretched along x
          const g = grain(u * 6, v * 90 + row * 13);
          const t = n(u, v * 0.4 + row * 0.37) * 0.6 + g * 0.4;
          col = mix(dark, base, 0.35 + t * 0.65);
          if (t > 0.72) col = mix(col, light, (t - 0.72) * 1.6);
          h = 0.5 + t * 0.5;
          const knot = Math.hypot((u - ((row * 0.31 + 0.2) % 1)) * 3.4, (inRow - 0.5) * 5.2);
          if (knot < 0.09) { col = mix(col, [76, 58, 38], 0.7); h -= 0.25; }
          if (speck() > 0.995) h -= 0.2;
        }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = inRow < GAP || inRow > 1 - GAP ? 0.95 : 0.62 + speck() * 0.2;
      }
    }
    return { rgb, height, rough, normalStrength: 0.9 };
  },

  tile: () => {
    const speck = mulberry32(202);
    const n = fbmFactory(163, 6, 3);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [196, 200, 198];
    const dark: [number, number, number] = [168, 172, 171];
    const grout: [number, number, number] = [120, 122, 120];
    const COLS = 4, ROWS = 4, G = 0.02;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const cx = (u * COLS) % 1, cy = (v * ROWS) % 1;
        const edge = cx < G || cx > 1 - G || cy < G || cy > 1 - G;
        const checker = (Math.floor(u * COLS) + Math.floor(v * ROWS)) % 2;
        let col = checker ? mix(dark, base, 0.5 + n(u, v) * 0.5) : base;
        let h = 0.8 + n(u * 2, v * 2) * 0.2;
        if (edge) { col = grout; h = 0.12; }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = edge ? 0.9 : 0.35 + speck() * 0.15; // polished tile
      }
    }
    return { rgb, height, rough, normalStrength: 0.9 };
  },

  terrazzo: () => {
    const n = fbmFactory(181, 5, 3);
    const speck = mulberry32(214);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [205, 203, 196];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        let col = mix([188, 186, 180], base, n(u, v));
        let h = 0.8 + n(u * 2, v * 2) * 0.2;
        const sp = speck();
        if (sp > 0.9) { // stone chips
          const chip = sp > 0.97 ? [120, 118, 112] : [232, 230, 224];
          col = [chip[0], chip[1], chip[2]];
          h = 0.9;
        }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = 0.3 + speck() * 0.2;
      }
    }
    return { rgb, height, rough, normalStrength: 0.4 };
  },

  metal: () => {
    const brush = valueNoise(217, 8);
    const scratch = valueNoise(229, 64);
    const speck = mulberry32(45);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [126, 132, 138];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        // horizontal brushing
        const b = brush(u * 40, v * 2);
        let col: [number, number, number] = [
          base[0] + (b - 0.5) * 22,
          base[1] + (b - 0.5) * 22,
          base[2] + (b - 0.5) * 22,
        ];
        let h = 0.5 + (b - 0.5) * 0.3;
        // panel seams every 1/2
        const seam = Math.min(Math.abs((u * 2) % 1), Math.abs((u * 2) % 1 - 1)) < 0.006;
        if (seam) { col = [70, 74, 78]; h = 0.1; }
        const s = scratch(u * 3, v * 60);
        if (s > 0.8) { const d = (s - 0.8) * 1.5; col = mix(col, [160, 165, 170], d * 0.5); h += d * 0.1; }
        if (speck() > 0.995) { col = mix(col, [96, 70, 50], 0.6); } // rust freckle
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = seam ? 0.7 : 0.3 + (b - 0.5) * 0.2 + (speck() > 0.995 ? 0.4 : 0);
      }
    }
    return { rgb, height, rough, normalStrength: 0.5 };
  },

  corrugated: () => {
    const n = fbmFactory(233, 6, 3);
    const speck = mulberry32(58);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [142, 148, 152];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        // 8 vertical waves: cos profile drives BOTH height and shading
        const wave = Math.cos(u * Math.PI * 2 * 8);
        const shade = 0.72 + wave * 0.28;
        let col: [number, number, number] = [base[0] * shade, base[1] * shade, base[2] * shade];
        const t = n(u * 0.3, v);
        col = mix(col, [col[0] * 0.85, col[1] * 0.85, col[2] * 0.85], t * 0.5);
        let h = wave * 0.5 + 0.5;
        // rust streaks from the top
        const rust = speck();
        if (rust > 0.982 && v < 0.5) col = mix(col, [120, 74, 48], (0.5 - v) * 1.2);
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = 0.45 + t * 0.25 + (rust > 0.982 ? 0.3 : 0);
      }
    }
    return { rgb, height, rough, normalStrength: 1.4 };
  },

  roof: () => {
    const n = fbmFactory(251, 6, 3);
    const speck = mulberry32(72);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [92, 99, 107];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        // standing seams every 1/6 along u
        const seam = Math.abs(((u * 6) % 1) - 0.5) > 0.47;
        let col = mix([74, 80, 87], base, n(u, v));
        let h = 0.4 + n(u, v) * 0.2;
        if (seam) { col = [58, 63, 69]; h = 1; }
        if (speck() > 0.99) col = mix(col, [110, 82, 60], 0.5);
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = h;
        rough[i] = seam ? 0.6 : 0.75 + speck() * 0.15;
      }
    }
    return { rgb, height, rough, normalStrength: 1.0 };
  },

  bark: () => {
    const ridge = valueNoise(263, 32);
    const n = fbmFactory(269, 5, 4);
    const speck = mulberry32(84);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const base: [number, number, number] = [93, 74, 54];
    const dark: [number, number, number] = [58, 46, 34];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        // vertical ridges
        const r = ridge(u * 12 + Math.sin(v * 12) * 0.05, v * 2);
        const t = 0.35 + r * 0.5 + n(u, v) * 0.15;
        const col = mix(dark, base, t);
        if (speck() > 0.99) { col[0] += 18; col[1] += 14; col[2] += 8; }
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = t;
        rough[i] = 0.95;
      }
    }
    return { rgb, height, rough, normalStrength: 1.1 };
  },

  foliage: () => {
    const n = fbmFactory(281, 10, 4);
    const leaf = valueNoise(293, 48);
    const speck = mulberry32(96);
    const rgb = new Uint8ClampedArray(SIZE * SIZE * 3);
    const height = new Float32Array(SIZE * SIZE);
    const rough = new Float32Array(SIZE * SIZE);
    const dark: [number, number, number] = [52, 84, 48];
    const base: [number, number, number] = [76, 122, 68];
    const light: [number, number, number] = [110, 150, 84];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const i = y * SIZE + x, u = x / SIZE, v = y / SIZE;
        const t = n(u, v);
        const l = leaf(u * 10, v * 10);
        let col = mix(dark, base, t * 0.6 + l * 0.4);
        if (l > 0.66) col = mix(col, light, (l - 0.66) * 2);
        if (speck() > 0.985) col = mix(col, [140, 160, 90], 0.6);
        rgb[i * 3] = col[0]; rgb[i * 3 + 1] = col[1]; rgb[i * 3 + 2] = col[2];
        height[i] = t * 0.5 + l * 0.5;
        rough[i] = 0.85 + speck() * 0.1;
      }
    }
    return { rgb, height, rough, normalStrength: 0.6 };
  },
};

// ---------------------------------------------------------------------------
// Canvas composition: height -> normal (Sobel), rough map
// ---------------------------------------------------------------------------
function makeCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = SIZE; c.height = SIZE;
  return [c, c.getContext('2d')!];
}

function texFromCanvas(c: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

export type PbrSet = { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };

const BASE_SETS = new Map<SurfaceName, PbrSet>();

export function getBaseSet(name: SurfaceName): PbrSet {
  let set = BASE_SETS.get(name);
  if (set) return set;
  const p = PAINTERS[name]();
  // albedo
  const [aC, aCtx] = makeCanvas();
  const img = aCtx.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    img.data[i * 4] = p.rgb[i * 3];
    img.data[i * 4 + 1] = p.rgb[i * 3 + 1];
    img.data[i * 4 + 2] = p.rgb[i * 3 + 2];
    img.data[i * 4 + 3] = 255;
  }
  aCtx.putImageData(img, 0, 0);
  // normal (Sobel on height)
  const [nC, nCtx] = makeCanvas();
  const nImg = nCtx.createImageData(SIZE, SIZE);
  const H = (x: number, y: number) => p.height[(((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx =
        (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1)) -
        (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1));
      const dy =
        (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1)) -
        (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1));
      const s = p.normalStrength * 2.2;
      let nx = dx * s, ny = dy * s, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len; ny /= len; nz /= len;
      const o = (y * SIZE + x) * 4;
      nImg.data[o] = (nx * 0.5 + 0.5) * 255;
      nImg.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      nImg.data[o + 2] = (nz * 0.5 + 0.5) * 255;
      nImg.data[o + 3] = 255;
    }
  }
  nCtx.putImageData(nImg, 0, 0);
  // roughness (grayscale)
  const [rC, rCtx] = makeCanvas();
  const rImg = rCtx.createImageData(SIZE, SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const g = Math.max(0, Math.min(1, p.rough[i])) * 255;
    rImg.data[i * 4] = g; rImg.data[i * 4 + 1] = g; rImg.data[i * 4 + 2] = g; rImg.data[i * 4 + 3] = 255;
  }
  rCtx.putImageData(rImg, 0, 0);

  set = {
    map: texFromCanvas(aC, true),
    normalMap: texFromCanvas(nC, false),
    roughnessMap: texFromCanvas(rC, false),
  };
  BASE_SETS.set(name, set);
  return set;
}

// Textures cloned per repeat combination (clone shares the canvas image).
const REPEAT_CACHE = new Map<string, PbrSet>();

export function getPbr(name: SurfaceName, rx = 1, ry = 1): PbrSet {
  if (rx === 1 && ry === 1) return getBaseSet(name);
  const key = `${name}|${rx}|${ry}`;
  let set = REPEAT_CACHE.get(key);
  if (set) return set;
  const base = getBaseSet(name);
  const clone = (t: THREE.Texture) => {
    const c = t.clone();
    c.wrapS = c.wrapT = THREE.RepeatWrapping;
    c.repeat.set(rx, ry);
    c.needsUpdate = true;
    return c;
  };
  set = { map: clone(base.map), normalMap: clone(base.normalMap), roughnessMap: clone(base.roughnessMap) };
  REPEAT_CACHE.set(key, set);
  return set;
}

// ---------------------------------------------------------------------------
// React material helper
// ---------------------------------------------------------------------------
export type PbrProps = {
  name: SurfaceName;
  repeat?: [number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  envMapIntensity?: number;
  side?: THREE.Side;
};

/** `<Pbr />` is a drop-in for <meshStandardMaterial> with PBR maps. */
export function Pbr({ name, repeat = [1, 1], color = '#ffffff', roughness = 1, metalness = 0, emissive, emissiveIntensity, transparent, opacity, envMapIntensity = 0.55, side }: PbrProps) {
  const set = useMemo(() => getPbr(name, repeat[0], repeat[1]), [name, repeat[0], repeat[1]]);
  return (
    <meshStandardMaterial
      map={set.map}
      normalMap={set.normalMap}
      normalScale={new THREE.Vector2(1, 1)}
      roughnessMap={set.roughnessMap}
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity}
      transparent={transparent}
      opacity={opacity}
      envMapIntensity={envMapIntensity}
      side={side}
    />
  );
}
