// Procedural WebAudio engine (DECISIONS.md #4). All SFX/music are synthesized —
// no asset files required, silent no-op when WebAudio is unavailable.
// Replaceable later by a sample manifest without touching call sites.

import { useSettings } from '../stores/settingsStore';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private buses: Record<string, GainNode> = {};
  private ambientNodes: AudioNode[] = [];
  private unlocked = false;

  private ensure(): boolean {
    if (this.ctx) return true;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      this.ctx = new Ctor();
      const master = this.ctx.createGain();
      master.connect(this.ctx.destination);
      this.buses = { master };
      for (const name of ['music', 'sfx', 'ui', 'ambient']) {
        const g = this.ctx.createGain();
        g.connect(master);
        this.buses[name] = g;
      }
      this.applyVolumes();
      return true;
    } catch {
      return false;
    }
  }

  unlock() {
    if (this.unlocked) return;
    if (!this.ensure()) return;
    this.ctx?.resume().catch(() => undefined);
    this.unlocked = true;
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = useSettings.getState();
    const set = (bus: string, v: number) => {
      const g = this.buses[bus];
      if (g) g.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ctx!.currentTime, 0.05);
    };
    set('master', s.master);
    set('music', s.music * 0.5);
    set('sfx', s.sfx);
    set('ui', s.ui * 0.7);
    set('ambient', s.ambient * 0.4);
  }

  private tone(opts: {
    freq: number;
    dur: number;
    type?: OscillatorType;
    bus?: string;
    vol?: number;
    slideTo?: number;
    attack?: number;
  }) {
    if (!this.unlocked || !this.ensure()) return;
    const ctx = this.ctx!;
    const bus = this.buses[opts.bus ?? 'sfx'];
    if (!bus) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, ctx.currentTime);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slideTo), ctx.currentTime + opts.dur);
    const vol = opts.vol ?? 0.2;
    const atk = opts.attack ?? 0.005;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + atk);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + opts.dur);
    osc.connect(gain).connect(bus);
    osc.start();
    osc.stop(ctx.currentTime + opts.dur + 0.05);
  }

  private noise(dur: number, vol = 0.15, filterHz = 1200) {
    if (!this.unlocked || !this.ensure()) return;
    const ctx = this.ctx!;
    const bus = this.buses.sfx;
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterHz;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(bus);
    src.start();
  }

  // ---- hooks ----
  click() { this.tone({ freq: 660, dur: 0.06, bus: 'ui', vol: 0.12, type: 'square' }); }
  hover() { this.tone({ freq: 880, dur: 0.03, bus: 'ui', vol: 0.05, type: 'sine' }); }
  blip() { this.tone({ freq: 980, dur: 0.025, bus: 'ui', vol: 0.04, type: 'triangle' }); }
  step(run = false) { this.noise(run ? 0.09 : 0.07, run ? 0.05 : 0.035, 500); }
  jump() { this.tone({ freq: 300, slideTo: 520, dur: 0.14, vol: 0.12, type: 'triangle' }); }
  land() { this.noise(0.1, 0.08, 400); }
  attack() { this.noise(0.12, 0.14, 2200); this.tone({ freq: 220, slideTo: 120, dur: 0.1, vol: 0.1, type: 'sawtooth' }); }
  hit() { this.noise(0.16, 0.22, 900); this.tone({ freq: 140, slideTo: 70, dur: 0.18, vol: 0.22, type: 'square' }); }
  dodge() { this.noise(0.14, 0.08, 3000); }
  hurt() { this.tone({ freq: 200, slideTo: 90, dur: 0.2, vol: 0.2, type: 'sawtooth' }); }
  quest() { this.tone({ freq: 523, dur: 0.12, bus: 'ui', vol: 0.12 }); setTimeout(() => this.tone({ freq: 784, dur: 0.18, bus: 'ui', vol: 0.12 }), 110); }
  social() { this.tone({ freq: 660, dur: 0.1, bus: 'ui', vol: 0.1 }); setTimeout(() => this.tone({ freq: 880, dur: 0.14, bus: 'ui', vol: 0.1 }), 90); }
  sting(dark = false) {
    if (dark) {
      this.tone({ freq: 110, dur: 1.4, bus: 'music', vol: 0.16, type: 'sawtooth' });
      this.tone({ freq: 116.5, dur: 1.4, bus: 'music', vol: 0.12, type: 'sawtooth' });
    } else {
      this.tone({ freq: 261, dur: 0.9, bus: 'music', vol: 0.1 });
      this.tone({ freq: 392, dur: 1.1, bus: 'music', vol: 0.08 });
    }
  }
  combatStart() { this.tone({ freq: 90, slideTo: 60, dur: 0.5, bus: 'music', vol: 0.3, type: 'sawtooth' }); }
  victory() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.tone({ freq: f, dur: 0.25, bus: 'music', vol: 0.14 }), i * 140)); }
  defeat() { [330, 262, 196].forEach((f, i) => setTimeout(() => this.tone({ freq: f, dur: 0.4, bus: 'music', vol: 0.15, type: 'triangle' }), i * 220)); }

  startAmbient() {
    if (!this.unlocked || !this.ensure() || this.ambientNodes.length) return;
    const ctx = this.ctx!;
    const bus = this.buses.ambient;
    // soft wind: filtered noise loop
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain).connect(filter.frequency);
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    src.connect(filter).connect(gain).connect(bus);
    src.start();
    lfo.start();
    this.ambientNodes = [src, lfo];
  }

  stopAmbient() {
    for (const n of this.ambientNodes) {
      try {
        (n as OscillatorNode).stop();
      } catch {
        /* already stopped */
      }
    }
    this.ambientNodes = [];
  }

  // ---- v0.14.0: accessors for the MusicDirector (BGM) ----
  /** AudioContext only after a user gesture unlocked it; null otherwise. */
  contextForMusic(): AudioContext | null {
    if (!this.unlocked || !this.ensure()) return null;
    return this.ctx;
  }

  musicBus(): GainNode {
    return this.buses.music;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }
}

export const audio = new AudioEngine();

// Kind → hook mapping for notification sounds.
export function notifySound(kind: string) {
  if (kind === 'quest') audio.quest();
  else if (kind === 'social') audio.social();
  else if (kind === 'warn') audio.hurt();
}

// ============================================================================
// v0.14.0 — BGM / MusicDirector (Task 8): SATU source of truth musik latar.
// Semua track prosedural (WebAudio, tanpa file aset — konsisten dengan engine
// SFX di atas), semua suara lewat bus 'music' + gain track sendiri sehingga
// fade out → ganti → fade in mulus dan volume mengikuti setelan MUSIC.
//
// ATURAN PAKAI: komponen TIDAK boleh memanggil playMusic sendiri-sendiri.
// Satu pemantau (interval 1 dtk di App) memanggil bgm.sync(snapshot) —
// keputusan track ada di musicDecision() yang murni & teruji.
// ============================================================================

export type MusicTrack =
  | 'menu'
  | 'school_day'
  | 'school_evening'
  | 'tension'
  | 'combat'
  | 'neutral'
  | 'ending_good'
  | 'ending_neutral'
  | 'ending_bad';

export type MusicContext = {
  phase: 'boot' | 'menu' | 'play';
  mode: string;
  scene: string;
  chapter: number;
  route: string;
  periodId: string; // 'pagi' | 'istirahat' | 'makan_siang' | 'istirahat_siang' | 'pulang' | ... (systems/time)
  endingId: 'true' | 'bitter' | 'bad' | 'neutral' | null;
};

/**
 * Pure track decision (unit-testable). Urutan prioritas:
 * menu → ending → combat → tension (scene/cerita bab 3-4) → rute netral →
 * suasana sekolah per periode hari.
 */
export function musicDecision(ctx: MusicContext): MusicTrack | null {
  if (ctx.phase === 'boot') return null;
  if (ctx.phase === 'menu') return 'menu';
  if (ctx.mode === 'ENDING') {
    if (ctx.endingId === 'neutral') return 'ending_neutral';
    if (ctx.endingId === 'true') return 'ending_good';
    return 'ending_bad';
  }
  if (ctx.mode === 'COMBAT') return 'combat';
  // scene non-kampus selalu menegangkan (rooftop penawaran, gudang)
  if (ctx.scene !== 'campus' && ctx.mode !== 'MAIN_MENU') return 'tension';
  // cerita bab 3-4 dalam mode sinematik/dialog = momen tensi
  if ((ctx.mode === 'CINEMATIC' || ctx.mode === 'DIALOGUE' || ctx.mode === 'TRANSITION') && ctx.chapter >= 3) {
    return 'tension';
  }
  // rute netral: dingin & hening
  if (ctx.route === 'neutral' && ctx.chapter >= 3) return 'neutral';
  // suasana harian — 'after' = Pulang Sekolah (sore)
  if (ctx.periodId === 'after') return 'school_evening';
  return 'school_day';
}

// ---- pattern library: tiap track = urutan step [frekuensi, tipe, volume] ----
type Step = [freq: number, type: OscillatorType, vol: number];
const R: Step = [0, 'sine', 0]; // rest
const PATTERNS: Record<MusicTrack, { stepMs: number; steps: Step[] }> = {
  menu:          { stepMs: 900, steps: [[262, 'sine', 0.05], [392, 'sine', 0.04], [330, 'sine', 0.04], [392, 'sine', 0.04]] },
  school_day:    { stepMs: 700, steps: [[523, 'triangle', 0.035], R, [587, 'triangle', 0.03], R, [659, 'triangle', 0.035], R, [587, 'triangle', 0.03], [392, 'triangle', 0.03]] },
  school_evening:{ stepMs: 820, steps: [[392, 'sine', 0.045], [466, 'sine', 0.035], [349, 'sine', 0.04], R, [311, 'sine', 0.035], R, [294, 'sine', 0.04], R] },
  tension:       { stepMs: 640, steps: [[98, 'sawtooth', 0.05], R, [103, 'sawtooth', 0.04], R, [98, 'sawtooth', 0.05], R, R, [116, 'sawtooth', 0.04]] },
  combat:        { stepMs: 170, steps: [[82, 'sawtooth', 0.07], [82, 'square', 0.04], [110, 'sawtooth', 0.06], [82, 'square', 0.03], [73, 'sawtooth', 0.07], [110, 'square', 0.04], [82, 'sawtooth', 0.06], [98, 'square', 0.04]] },
  neutral:       { stepMs: 1100, steps: [[196, 'sine', 0.04], R, R, [233, 'sine', 0.03], R, R, [174, 'sine', 0.035], R] },
  ending_good:   { stepMs: 760, steps: [[523, 'sine', 0.05], [659, 'sine', 0.045], [784, 'sine', 0.05], [659, 'sine', 0.04], [523, 'sine', 0.045], [392, 'sine', 0.04]] },
  ending_neutral:{ stepMs: 980, steps: [[262, 'sine', 0.04], R, [311, 'sine', 0.03], R, [233, 'sine', 0.04], R, R, R] },
  ending_bad:    { stepMs: 880, steps: [[110, 'sawtooth', 0.05], R, [104, 'sawtooth', 0.045], R, [92, 'sawtooth', 0.05], R, R, [82, 'sawtooth', 0.04]] },
};

class MusicDirector {
  private track: MusicTrack | null = null;
  private gain: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;

  current(): MusicTrack | null {
    return this.track;
  }

  /** Ganti track dengan fade (out → stop → start → in). Same-track = no-op. */
  setTrack(next: MusicTrack | null, fadeSec = 1.1): void {
    if (next === this.track) return;
    const ctx = audio.contextForMusic();
    if (!ctx) {
      // audio belum unlock / tidak tersedia — catat target saja;
      // sync() berikutnya (setelah gesture pertama) akan memulai pattern-nya
      this.track = next;
      return;
    }
    // fade out track lama
    if (this.gain && this.timer != null) {
      const oldGain = this.gain;
      const oldTimer = this.timer;
      oldGain.gain.setTargetAtTime(0, ctx.currentTime, fadeSec / 3.5);
      window.setTimeout(() => {
        window.clearInterval(oldTimer);
        try { oldGain.disconnect(); } catch { /* already */ }
      }, fadeSec * 1000 + 120);
    } else if (this.timer != null) {
      window.clearInterval(this.timer);
    }
    this.timer = null;
    this.gain = null;
    this.track = next;
    if (!next) return;
    // fade in track baru
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(audio.musicBus());
    const pat = PATTERNS[next];
    this.gain = g;
    this.step = 0;
    g.gain.setTargetAtTime(1, ctx.currentTime, fadeSec / 3);
    this.timer = window.setInterval(() => {
      const s = pat.steps[this.step % pat.steps.length];
      this.step++;
      if (!audio.isUnlocked()) return;
      const [f, type, vol] = s;
      if (f <= 0) return;
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      const t = ctx.currentTime;
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(vol, t + 0.03);
      og.gain.exponentialRampToValueAtTime(0.0001, t + (pat.stepMs / 1000) * 0.92);
      osc.connect(og).connect(g);
      osc.start(t);
      osc.stop(t + (pat.stepMs / 1000) + 0.05);
    }, pat.stepMs);
  }

  /** Dipanggil satu pemantau saja (App, 1 dtk) — keputusan via musicDecision. */
  sync(ctx: MusicContext): void {
    this.setTrack(musicDecision(ctx));
  }

  reset(): void {
    this.setTrack(null, 0.4);
  }
}

export const bgm = new MusicDirector();
