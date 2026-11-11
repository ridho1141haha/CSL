class MusicDirector {
  private track: MusicTrack | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private gain: GainNode | null = null;

  current(): MusicTrack | null {
    return this.track;
  }

  setTrack(next: MusicTrack | null, fadeSec = 1.0): void {
    if (next === this.track) return;
    const ctx = audio.contextForMusic();

    // Fade out audio lama
    if (this.gain && this.audioEl) {
      const oldGain = this.gain;
      const oldEl = this.audioEl;
      if (ctx) {
        oldGain.gain.setTargetAtTime(0, ctx.currentTime, fadeSec / 3);
      }
      window.setTimeout(() => {
        oldEl.pause();
        oldEl.src = '';
        try { oldGain.disconnect(); } catch { /* noop */ }
      }, fadeSec * 1000 + 100);
    }

    this.track = next;
    if (!next || !ctx) {
      this.audioEl = null;
      this.gain = null;
      return;
    }

    // Buat pemutar audio file .ogg
    const el = new Audio(`/audio/${next}.ogg`);
    el.loop = true;

    const source = ctx.createMediaElementSource(el);
    const g = ctx.createGain();
    g.gain.value = 0;
    source.connect(g).connect(audio.musicBus());

    this.audioEl = el;
    this.gain = g;

    el.play().then(() => {
      g.gain.setTargetAtTime(1, ctx.currentTime, fadeSec / 3);
    }).catch(() => {
      // Browser memblokir autoplay atau file gagal dimuat
    });
  }

  sync(ctx: MusicContext): void {
    this.setTrack(musicDecision(ctx));
  }

  reset(): void {
    this.setTrack(null, 0.4);
  }
}