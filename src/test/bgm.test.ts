import { describe, it, expect } from 'vitest';
import { musicDecision, bgm, type MusicContext } from '../game/audio';

// v0.14.0 — BGM: keputusan track harus murni & deterministik; MusicDirector
// hanya mengeksekusi hasilnya dengan fade (tanpa AudioContext pun state-nya
// tetap benar — penting untuk test headless & browser tanpa WebAudio).

const base: MusicContext = {
  phase: 'play',
  mode: 'GAMEPLAY',
  scene: 'campus',
  chapter: 1,
  route: 'none',
  periodId: 'class',
  endingId: null,
};

describe('musicDecision (BGM single source of truth)', () => {
  it('boot tidak memainkan apa pun, menu memainkan menu', () => {
    expect(musicDecision({ ...base, phase: 'boot' })).toBeNull();
    expect(musicDecision({ ...base, phase: 'menu' })).toBe('menu');
  });

  it('ending memilih track sesuai hasil resolver', () => {
    const ending = (id: MusicContext['endingId']) => musicDecision({ ...base, mode: 'ENDING', endingId: id });
    expect(ending('neutral')).toBe('ending_neutral');
    expect(ending('true')).toBe('ending_good');
    expect(ending('bad')).toBe('ending_bad');
    expect(ending('bitter')).toBe('ending_bad');
  });

  it('combat selalu menang atas suasana', () => {
    expect(musicDecision({ ...base, mode: 'COMBAT', chapter: 4, route: 'resistance' })).toBe('combat');
  });

  it('scene non-kampus (rooftop/warehouse) = tension', () => {
    expect(musicDecision({ ...base, scene: 'rooftop', chapter: 3 })).toBe('tension');
    expect(musicDecision({ ...base, scene: 'warehouse', chapter: 4, route: 'bad' })).toBe('tension');
  });

  it('cerita bab 3-4 sinematik/dialog = tension', () => {
    expect(musicDecision({ ...base, mode: 'CINEMATIC', chapter: 3 })).toBe('tension');
    expect(musicDecision({ ...base, mode: 'DIALOGUE', chapter: 4 })).toBe('tension');
    expect(musicDecision({ ...base, mode: 'TRANSITION', chapter: 4 })).toBe('tension');
  });

  it('rute netral (bab 3-4) = neutral, walau gameplay', () => {
    expect(musicDecision({ ...base, chapter: 3, route: 'neutral' })).toBe('neutral');
    expect(musicDecision({ ...base, chapter: 4, route: 'neutral', mode: 'GAMEPLAY' })).toBe('neutral');
  });

  it('hari sekolah vs sore pulang', () => {
    expect(musicDecision({ ...base, periodId: 'class' })).toBe('school_day');
    expect(musicDecision({ ...base, periodId: 'lunch' })).toBe('school_day');
    expect(musicDecision({ ...base, periodId: 'after' })).toBe('school_evening');
  });

  it('bab 1 sinematik (opening) tetap suasana harian', () => {
    expect(musicDecision({ ...base, mode: 'CINEMATIC', chapter: 1, periodId: 'arrive' })).toBe('school_day');
  });
});

describe('MusicDirector state (headless, tanpa AudioContext)', () => {
  it('setTrack mencatat track target meski audio belum unlock', () => {
    bgm.setTrack(null);
    bgm.setTrack('tension');
    expect(bgm.current()).toBe('tension');
    bgm.setTrack('tension'); // no-op same-track
    expect(bgm.current()).toBe('tension');
    bgm.setTrack('combat');
    expect(bgm.current()).toBe('combat');
    bgm.setTrack(null);
    expect(bgm.current()).toBeNull();
  });

  it('sync meneruskan keputusan musicDecision', () => {
    bgm.sync({ ...base, phase: 'menu' });
    expect(bgm.current()).toBe('menu');
    bgm.sync({ ...base, mode: 'COMBAT' });
    expect(bgm.current()).toBe('combat');
    bgm.reset();
    expect(bgm.current()).toBeNull();
  });
});
