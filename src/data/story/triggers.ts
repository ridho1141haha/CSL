// ============================================================================
// src/data/story/triggers.ts — STORY TRIGGER registry (v0.17.1).
//
// Dunia → cerita. Semua blok if per-beat yang dulu hidup di StoryDirector.tsx
// (montase, sergapan parkiran, kelulusan, SECRET CHOICE POINT, kartu BAB II,
// scene BAB II, find_aris) kini baris data di sini. StoryDirector mengevaluasi
// registry ini secara generik: kondisi lewat sistem Condition yang ada,
// efek lewat pipeline applyEffects yang ada — TIDAK ada logika game baru.
//
// Aturan menambah konten:
//   • "beat X tercapai → buka dialog Y"  = satu baris di sini.
//   • `once` WAJIB memakai nama flag historis (save lama sudah menyimpannya);
//     tanpa `once` hanya untuk trigger yang satu-shot lewat kondisinya sendiri
//     (mis. quest berpindah ke 'completed' oleh `fire`).
//   • Urutan array = urutan evaluasi per frame (montase dulu, lalu gameplay) —
//     jangan diacak; trigger pertama yang cocok menang.
//   • Perilaku khusus yang tidak cocok pola ini tetap boleh jadi kode engine
//     (lihat StoryDirector: eksplorasi tutorial lama sudah pindah ke
//     QuestDef.completeWhen; E-interact & hidden events memang generic).
// ============================================================================

import type { StoryTriggerDef } from '../../types';

export const STORY_TRIGGERS: StoryTriggerDef[] = [
  // ------------------------------------------------------------------
  // MONTASE — boleh menyala saat mode masih CINEMATIC (beat di-set node
  // penutup scene sebelumnya; guard scene campus melindungi dari async
  // requestScene yang belum selesai).
  // ------------------------------------------------------------------
  {
    // v0.15.0 bonding arc: selesai jelajah → montase perpustakaan (doc Ch3)
    id: 'montage_lib',
    once: 'bond_lib_done',
    duringCinematic: true,
    open: 'ch1_lib_1',
    when: { k: 'beat', id: 'ch1_friendship' },
  },
  {
    // v0.15.0 bonding arc: hasil PTS (doc Ch4) → beat ch1_break di ch1_pts_5
    id: 'montage_pts',
    once: 'bond_pts_done',
    duringCinematic: true,
    open: 'ch1_pts_1',
    when: { k: 'beat', id: 'ch1_pts' },
  },
  {
    // Rute netral: montase "Dinding Dingin" setelah mengabaikan Aris
    id: 'montage_neutral',
    once: 'neu_montage_done',
    duringCinematic: true,
    open: 'n1_1',
    when: { k: 'and', all: [{ k: 'beat', id: 'ch3_neutral' }, { k: 'route', id: 'neutral' }] },
  },
  {
    // GARIS MERAH bab 3: montase pendekatan OSIS
    id: 'montage_osis',
    once: 'osis_montage_done',
    duringCinematic: true,
    open: 'ch3_osis_1',
    when: { k: 'and', all: [{ k: 'beat', id: 'ch3_osis' }, { k: 'chapter', id: 3 }] },
  },
  {
    // GARIS MERAH rute bad: montase setelah menerima tawaran Bimo
    id: 'montage_bad',
    once: 'bad_montage_done',
    duringCinematic: true,
    open: 'ch4_bad_1',
    when: { k: 'and', all: [{ k: 'beat', id: 'ch4_bad_warehouse' }, { k: 'route', id: 'bad' }] },
  },
  {
    // GARIS MERAH rute resistance: montase setelah menolak
    id: 'montage_res',
    once: 'res_montage_done',
    duringCinematic: true,
    open: 'ch4_res_1',
    when: { k: 'and', all: [{ k: 'beat', id: 'ch4_res_search' }, { k: 'route', id: 'resistance' }] },
  },

  // ------------------------------------------------------------------
  // PEMICU GAMEPLAY — hanya saat GAMEPLAY (mode guard default runner).
  // ------------------------------------------------------------------
  {
    // GARIS MERAH: sergapan letnan di parkiran [FIGHT 2]
    id: 'ambush_parking',
    once: 'ch3_parking_started',
    open: 'ch3_f2_1',
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch3_parking' },
        { k: 'chapter', id: 3 },
        { k: 'zone', id: 'parking' },
        { k: 'quest', id: 'gang_ambush', state: 'active' },
      ],
    },
  },
  {
    // Rute netral: hari kelulusan di gerbang utama
    id: 'grad_neutral',
    once: 'grad_scene_done',
    open: 'ch4_neu_grad_1',
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch4_neutral_grad' },
        { k: 'chapter', id: 4 },
        { k: 'route', id: 'neutral' },
        { k: 'zone', id: 'gate' },
      ],
    },
  },
  {
    // v0.15.0 SECRET CHOICE POINT — cabang A: keluar lewat gerbang (standard
    // neutral). Guard flag DIKELOLAS BERSAMA secret_alley: zona mana pun yang
    // kena duluan mengunci keduanya (perilaku asli StoryDirector).
    id: 'secret_out',
    once: 'neu_secret_done',
    open: 'ch4_neu_out_1',
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch4_neu_secret' },
        { k: 'chapter', id: 4 },
        { k: 'route', id: 'neutral' },
        { k: 'zone', id: 'street' },
      ],
    },
  },
  {
    // v0.15.0 SECRET CHOICE POINT — cabang B: balik ke gang belakang
    // (secret battle → dua secret endings). once SAMA dengan secret_out.
    id: 'secret_alley',
    once: 'neu_secret_done',
    open: 'ch4_neu_secret_1',
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch4_neu_secret' },
        { k: 'chapter', id: 4 },
        { k: 'route', id: 'neutral' },
        { k: 'zone', id: 'back_alley' },
      ],
    },
  },
  {
    // GARIS MERAH: BAD ENDING 1 — kelulusan sebagai pemimpin geng
    id: 'grad_bad',
    once: 'bad_grad_done',
    open: 'ch4_bad_grad_1',
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch4_bad_grad' },
        { k: 'chapter', id: 4 },
        { k: 'route', id: 'bad' },
        { k: 'zone', id: 'gate' },
      ],
    },
  },
  {
    // GARIS MERAH: GOOD ENDING — kelulusan bersama Aris & Siti (butuh
    // CHOICE 3 "menahan emosi" → flag restrained_bimo)
    id: 'grad_good',
    once: 'good_grad_done',
    open: 'ch4_good_grad_1',
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch4_good_grad' },
        { k: 'chapter', id: 4 },
        { k: 'route', id: 'resistance' },
        { k: 'zone', id: 'gate' },
        { k: 'flag', id: 'restrained_bimo' },
      ],
    },
  },
  {
    // Bab 3: sampai di atap → proposition dimulai (scene rooftop, bukan campus)
    id: 'rooftop_intro',
    scene: 'rooftop',
    once: 'ch3_rooftop_started',
    open: 'ch3_intro_1',
    when: { k: 'and', all: [{ k: 'beat', id: 'ch3_rooftop' }, { k: 'chapter', id: 3 }] },
  },
  {
    // Bab 2 fase 1: sampai di tangga belakang → kartu BAB II (chapter effect
    // juga men-set beat default bab 2 = ch2_key_error via ChapterDef)
    id: 'ch2_card',
    once: 'ch2_scene_started',
    fire: [{ k: 'chapter', id: 2 }],
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch1_break' },
        { k: 'quest', id: 'aris_incident', state: 'active' },
        { k: 'zone', id: 'back_stairs' },
      ],
    },
  },
  {
    // Bab 2 fase 2: kartu ditutup, masih di tangga → scene "Kesalahan Kecil Aris"
    id: 'ch2_scene',
    once: 'ch2_scene_opened',
    open: 'ch2_intro_1',
    when: {
      k: 'and',
      all: [
        { k: 'beat', id: 'ch2_key_error' },
        { k: 'quest', id: 'aris_incident', state: 'active' },
        { k: 'zone', id: 'back_stairs' },
      ],
    },
  },
  {
    // Bab 4 rute resistance: mencari Aris — gang belakang ATAU jalan (tanpa
    // once: satu-shot karena `fire` menyelesaikan quest-nya sendiri)
    id: 'find_aris',
    open: 'ch4_res_alley',
    fire: [
      { k: 'quest', id: 'find_aris', state: 'completed', silent: true },
      { k: 'beat', id: 'ch4_res_alley' },
    ],
    when: {
      k: 'and',
      all: [
        { k: 'quest', id: 'find_aris', state: 'active' },
        { k: 'chapter', id: 4 },
        { k: 'any', of: [{ k: 'zone', id: 'back_alley' }, { k: 'zone', id: 'street' }] },
      ],
    },
  },
];
