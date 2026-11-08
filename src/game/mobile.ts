// ============================================================================
// mobile.ts — device tier detection + render diagnostics (v0.5.0)
//
// WHY: v0.4.0 deploy showed a blank world on Android Chrome while the DOM UI
// kept working — the GPU side died silently (likely heavy mobile defaults:
// dpr 2 + antialias + 2048 shadow map + Sky shader on a weak GPU, possibly
// followed by a context loss nobody could see).
//
// This module gives us three weapons:
//   1. TIER — device classification so Canvas/lights/geometry can degrade
//      gracefully on phones instead of dying.
//   2. DIAG — a tiny diagnostic bus: JS errors, unhandled rejections and
//      WebGL context loss are captured and surfaced by a small on-screen
//      chip, so "blank" is never silent again (user can screenshot the cause).
//   3. WATCHDOG — lastRenderedAt timestamp the frame loop pets; UI can detect
//      a dead render loop and offer one-tap recovery.
// ============================================================================

export type Tier = 'high' | 'low';

// v0.14.4 — GPU class from the WebGL renderer string. Tier alone says nothing
// about a laptop's graphics muscle: a Ryzen ultrabook has 8+ cores and 8GB+
// RAM (→ tier 'high') while its only GPU is an integrated Radeon/UHD chip that
// chokes on dpr 2.0 + MSAA + 2048 shadows (measured 18 FPS on v0.14.3).
//   'soft'    — CPU rasterizers (SwiftShader / llvmpipe): no real GPU at all
//   'igpu'    — integrated silicon (Intel UHD/Iris, AMD Radeon w/o RX, Arc)
//   'dgpu'    — discrete cards (GeForce, Radeon RX/Pro, FirePro)
//   'unknown' — no WebGL / no UNMASKED string (keep the pre-v0.14.4 behavior)
export type GpuClass = 'dgpu' | 'igpu' | 'soft' | 'unknown';

/**
 * Pure renderer-string classification — unit-testable without a DOM.
 * Order matters: explicit dGPU brand marks win before the generic iGPU rules.
 */
export function classifyGpu(renderer: string): GpuClass {
  const r = renderer.toLowerCase();
  if (!r) return 'unknown';
  // CPU rasterizers — treat as the weakest possible device.
  if (r.includes('swiftshader') || r.includes('llvmpipe') || r.includes('softpipe') || r.includes('software rasterizer')) return 'soft';
  // Discrete cards — brand lines that only exist on real GPUs. Bare 'nvidia'
  // is included: everything NVIDIA ships in browsers is discrete (Quadro T /
  // RTX A laptop cards report neither 'geforce' nor 'quadro').
  if (r.includes('nvidia') || r.includes('firepro') || r.includes('titan')) return 'dgpu';
  if (/\brx\s?\d/.test(r) || r.includes('radeon pro')) return 'dgpu';
  // Integrated — Intel's graphics lines, AMD Radeon WITHOUT an RX mark
  // ("AMD Radeon(TM) Graphics" = iGPU; "Radeon 610M/780M" also land here),
  // and Intel Arc (which covers both iGPU-branded Arc and entry laptop dGPU —
  // medium preset is safe for either).
  if (r.includes('intel') && (r.includes('hd graphics') || r.includes('uhd graphics') || r.includes('iris') || r.includes('arc'))) return 'igpu';
  if (r.includes('radeon')) return 'igpu';
  return 'unknown';
}

/** Browser probe — read the real renderer string once, cheapest context. */
function sniffGpu(): GpuClass {
  if (typeof document === 'undefined') return 'unknown';
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'unknown';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    // D3D/mac strings arrive like "ANGLE (AMD, AMD Radeon(TM) Graphics ...)"
    return classifyGpu(renderer);
  } catch {
    return 'unknown';
  }
}

export type DiagEntry = {
  kind: 'js' | 'promise' | 'webgl' | 'watchdog';
  message: string;
  at: number; // Date.now()
};

const UA_MOBILE = /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i;

function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (typeof navigator !== 'undefined' && (navigator.maxTouchPoints ?? 0) > 0);
}

function detectMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return UA_MOBILE.test(navigator.userAgent);
}

/** Pure classification — unit-testable without a DOM. */
export function classifyTier(opts: { mobileUA: boolean; touch: boolean; shortSide: number; cores?: number; memoryGB?: number }): Tier {
  // Small touchscreen device (phone / small tablet) → low tier.
  if (opts.touch && opts.mobileUA) return 'low';
  // Touch laptop / big tablet: decide by muscle.
  const cores = opts.cores ?? 8;
  const mem = opts.memoryGB ?? 8;
  if (opts.touch && opts.shortSide <= 500) return 'low';
  if (cores <= 4 || mem <= 2) return 'low';
  return 'high';
}

class MobileSys {
  /** true when the device is touch-first (phones & tablets) */
  touch = false;
  /** resolved quality tier */
  tier: Tier = 'high';
  /** v0.14.4 — GPU muscle class from the WebGL renderer string */
  gpu: GpuClass = 'unknown';

  /** diagnostics ring (latest last) — UI shows the most recent entry */
  diag: DiagEntry[] = [];
  /** ms timestamp of the last completed rendered frame (watchdog food) */
  lastFrameAt = 0;
  /** set true once WebGL context restoration has been attempted */
  contextRecovered = false;

  private installed = false;

  init(): void {
    if (this.installed || typeof window === 'undefined') return;
    this.installed = true;

    this.touch = detectTouch();
    this.tier = classifyTier({
      mobileUA: detectMobileUA(),
      touch: this.touch,
      shortSide: Math.min(window.innerWidth, window.innerHeight),
      cores: (navigator as unknown as { hardwareConcurrency?: number }).hardwareConcurrency,
      memoryGB: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
    });
    // v0.14.4 — sniff the GPU once at boot; quality resolution ('auto') reads
    // this to keep iGPU laptops off the TINGHI preset (dpr 2 + MSAA + IBL).
    this.gpu = sniffGpu();

    window.addEventListener('error', (e) => {
      this.report('js', e.message || String(e.error ?? 'unknown error'));
    });
    window.addEventListener('unhandledrejection', (e) => {
      this.report('promise', e.reason instanceof Error ? e.reason.message : String(e.reason ?? 'unhandled rejection'));
    });
  }

  report(kind: DiagEntry['kind'], message: string): void {
    const trimmed = message.slice(0, 180);
    // dedupe identical consecutive entries (render-loop errors repeat per frame)
    const last = this.diag[this.diag.length - 1];
    if (last && last.kind === kind && last.message === trimmed) {
      last.at = Date.now();
      return;
    }
    this.diag.push({ kind, message: trimmed, at: Date.now() });
    if (this.diag.length > 8) this.diag.shift();
    // eslint-disable-next-line no-console
    console.warn(`[CSL-diag:${kind}]`, trimmed);
  }

  get lowSpec(): boolean {
    return this.tier === 'low';
  }

  /** Canvas dpr cap per tier */
  get dpr(): [number, number] {
    return this.lowSpec ? [1, 1.5] : [1, 2];
  }

  /** shadow map resolution per tier */
  get shadowMapSize(): number {
    return this.lowSpec ? 1024 : 2048;
  }

  /** geometry segment budget per tier (capsules/spheres) */
  get seg(): { cyl: number; cap: number; sph: number } {
    return this.lowSpec ? { cyl: 10, cap: 8, sph: 12 } : { cyl: 14, cap: 10, sph: 20 };
  }

  markFrame(): void {
    this.lastFrameAt = Date.now();
  }

  /** true when the render loop looks dead while the game is active */
  stalled(windowMs = 4000): boolean {
    if (typeof document === 'undefined') return false;
    if (document.hidden) return false;
    if (this.lastFrameAt === 0) return false;
    return Date.now() - this.lastFrameAt > windowMs;
  }
}

export const mobile = new MobileSys();

// Auto-init on import in the browser (safe no-op on server/tests).
if (typeof window !== 'undefined') mobile.init();
