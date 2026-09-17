import { describe, it, expect } from 'vitest';
import { isPoseCut } from '../game/camera/CameraRig';
import { STORY_PROPS, SCENE_ACTORS, OPENING_ACTORS } from '../data/chapters';
import { DIALOGUE } from '../data/dialogue';
import { QUALITY_PRESETS } from '../game/quality';

// ============================================================================
// v0.12.0 — cinematic polish: camera hard-cut antar scene, prop cerita
// (pensil jatuh / buku berserakan / botol tumpah), dan preset tekstur.
// ============================================================================

describe('isPoseCut (kamera hard-cut antar scene)', () => {
  it('snap saat pose pertama setelah mount (belum ada pose sebelumnya)', () => {
    expect(isPoseCut(null, { x: 7, y: 1.62, z: 52 })).toBe(true);
  });
  it('lerp (false) untuk perpindahan kecil dalam satu scene', () => {
    // fp_canteen → fp_canteen_whisper ≈ 3.2 m
    expect(isPoseCut({ x: 30.7, y: 1.55, z: 8.8 }, { x: 28.2, y: 1.5, z: 6.6 })).toBe(false);
  });
  it('cut (true) untuk scene cut jauh — lorong → kantin (bug kamera nembus kelas)', () => {
    // fp_siti_hall (lorong) → fp_canteen (kantin) ≈ 32 m
    expect(isPoseCut({ x: 2.4, y: 1.62, z: 25.2 }, { x: 30.7, y: 1.55, z: 8.8 })).toBe(true);
  });
  it('cut (true) untuk cut kelas → lorong di opening', () => {
    // fp_class_desk → fp_siti_hall
    expect(isPoseCut({ x: -4.1, y: 1.5, z: 13.1 }, { x: 2.4, y: 1.62, z: 25.2 })).toBe(true);
  });
});

describe('STORY_PROPS (prop dunia pendukung cerita)', () => {
  it('semua key STORY_PROPS adalah node dialogue yang valid', () => {
    for (const key of Object.keys(STORY_PROPS)) {
      expect(DIALOGUE[key], `node ${key} harus ada di DIALOGUE`).toBeDefined();
    }
  });
  it('scene 2: pensil jatuh di o2_3, di lantai sampai o2_5, terkumpul di o2_6', () => {
    expect(STORY_PROPS['o2_3']?.pencase).toBe('fall');
    expect(STORY_PROPS['o2_3b']?.pencase).toBe('floor');
    expect(STORY_PROPS['o2_5']?.pencase).toBe('floor');
    expect(STORY_PROPS['o2_6']?.pencase).toBe('none');
    expect(STORY_PROPS['o2_1']?.pencase).toBe('desk');
  });
  it('bab 2: buku+botol dipegang saat intro, berserakan setelah tersandung, terkumpul di ch2_win_3', () => {
    expect(STORY_PROPS['ch2_intro_2']).toMatchObject({ books: 'held', bottle: 'held' });
    expect(STORY_PROPS['ch2_intro_3']).toMatchObject({ books: 'scatter', bottle: 'drop', spill: true });
    expect(STORY_PROPS['ch2_choice']).toMatchObject({ books: 'scatter' });
    expect(STORY_PROPS['ch2_win_3']).toMatchObject({ books: 'none', bottle: 'none' });
  });
});

describe('SCENE_ACTORS: pose duduk/jongkok + prop tangan', () => {
  it('Aris jongkok memungut pensil di scene 2 dan memegang penghapus di o2_5', () => {
    expect(OPENING_ACTORS['o2_3']?.aris?.crouch).toBe(true);
    expect(OPENING_ACTORS['o2_5']?.aris?.hold).toBe('eraser');
  });
  it('bab 2: Aris membawa tumpukan buku lalu jongkok setelah tumpah', () => {
    expect(SCENE_ACTORS['ch2_intro_2']?.aris?.hold).toBe('stack');
    expect(SCENE_ACTORS['ch2_intro_3']?.aris?.hold).toBe('stack');
    expect(SCENE_ACTORS['ch2_intro_4']?.aris?.crouch).toBe(true);
    expect(SCENE_ACTORS['ch2_win_3']?.aris?.hold).toBe('stack');
    expect(SCENE_ACTORS['ch2_win_3']?.aris?.crouch).toBeUndefined();
  });
  it('rute good: Siti memegang ponsel saat merekam', () => {
    expect(SCENE_ACTORS['ch4_good_2']?.siti?.hold).toBe('phone');
  });
  it('semua node yang punya spot crouch/sit adalah node dialogue valid', () => {
    const all = { ...OPENING_ACTORS, ...SCENE_ACTORS };
    for (const [node, cast] of Object.entries(all)) {
      const spots = [cast.aris, cast.siti, cast.bimo, cast.budi, ...(cast.bullies ?? []), ...(cast.followers ?? [])].filter(Boolean);
      if (spots.some((s) => s!.sit || s!.crouch || s!.hold)) {
        expect(DIALOGUE[node], `node ${node} harus ada di DIALOGUE`).toBeDefined();
      }
    }
  });
});

describe('preset kualitas: low texture (v0.12.0)', () => {
  it('tekstur mengecil + anisotropy turun di preset lebih rendah', () => {
    expect(QUALITY_PRESETS.high.texScale).toBeGreaterThan(QUALITY_PRESETS.medium.texScale);
    expect(QUALITY_PRESETS.medium.texScale).toBeGreaterThan(QUALITY_PRESETS.low.texScale);
    expect(QUALITY_PRESETS.high.aniso).toBeGreaterThan(QUALITY_PRESETS.medium.aniso);
    expect(QUALITY_PRESETS.medium.aniso).toBeGreaterThan(QUALITY_PRESETS.low.aniso);
    expect(QUALITY_PRESETS.low.texScale).toBeGreaterThanOrEqual(0.5);
  });
});
