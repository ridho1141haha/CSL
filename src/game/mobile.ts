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
