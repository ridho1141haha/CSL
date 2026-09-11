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
}

export const audio = new AudioEngine();

// Kind → hook mapping for notification sounds.
export function notifySound(kind: string) {
  if (kind === 'quest') audio.quest();
  else if (kind === 'social') audio.social();
  else if (kind === 'warn') audio.hurt();
}
