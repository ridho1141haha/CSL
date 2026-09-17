import type { ChapterDef, ChapterId } from '../types';

export const CHAPTERS: Record<ChapterId, ChapterDef> = {
  // v0.7.0 — bab 1 & 2 mengikuti alur lambat baru (GDD §"Alur yang lebih lambat").
  // v0.11.0 GARIS MERAH: bab 3/4 default = rute aksi; variasi per rute
  // dilihat di chapterCardText (effects.ts): netral → "Dinding Dingin" /
  // "Lulus Tanpa Nama", bad → "Tunduk Pada Kekuasaan".
  1: { id: 1, title: 'BAB I', subtitle: 'Minggu Pertama — Pria Tanpa Wajah' },
  2: { id: 2, title: 'BAB II', subtitle: 'Kesalahan Kecil Aris' },
  3: { id: 3, title: 'BAB III', subtitle: 'Penawaran di Rooftop' },
  4: { id: 4, title: 'BAB IV', subtitle: 'Klimaks Gang Belakang' },
};

// Camera pose (see data/world.ts) shown while each opening node displays.
// Unlisted nodes reuse the last pose.
export const OPENING_ROOT = 'o1_1';

export const CAM_BY_NODE: Record<string, string> = {
  // ---- opening v0.7.0 "Minggu Pertama" (first person, campus) ----
  // Scene 1 — gerbang & map merah
  o1_1: 'fp_gate',
  o1_2: 'fp_gate',
  o1_3: 'fp_map_red',
  o1_4: 'fp_gate_side',
  o1_5: 'fp_gate_side',
  o1_6: 'fp_enter',
  // Scene 2 — meja baris belakang (kelas 11-B)
  o2_1: 'fp_class',
  o2_2: 'fp_class',
  o2_3: 'fp_class_desk',
  o2_3b: 'fp_class_desk',
  o2_4: 'fp_class_board',
  o2_5: 'fp_class_desk',
  o2_6: 'fp_class_desk',
  o2_7: 'fp_class_desk',
  o2_8: 'fp_class',
  // Scene 3 — peringatan pertama di lorong
  o3_1: 'fp_corridor',
  o3_2: 'fp_siti_hall',
  o3_3: 'fp_siti_hall',
  o3_4: 'fp_siti_hall_close',
  o3_5: 'fp_siti_hall_close',
  o3_6: 'fp_siti_hall',
  o3_7: 'fp_siti_hall',
  // Scene 4 — bisik-bisik kantin & kemunculan Bimo
  o4_1: 'fp_canteen',
  o4_2: 'fp_canteen',
  o4_3: 'fp_canteen_whisper',
  o4_4: 'fp_canteen_whisper',
  o4_5: 'fp_canteen_whisper',
  o4_6: 'fp_canteen_whisper',
  o4_7: 'fp_canteen_whisper',
  o4_8: 'fp_canteen_whisper',
  o4_9: 'fp_canteen_whisper',
  o4_10: 'fp_canteen',
  o4_11: 'fp_canteen',
  o4_12: 'fp_bimo_entry',
  o4_13: 'fp_bimo_entry',
  o4_14: 'fp_bimo_close',
  o5_1: 'fp_bimo_close',
  // ---- bab 2: Kesalahan Kecil Aris (third person, back stairs) ----
  ch2_intro_1: 'stairs_wide',
  ch2_intro_2: 'stairs_wide',
  ch2_intro_3: 'stairs_close',
  ch2_intro_4: 'stairs_close',
  ch2_intro_5: 'stairs_aris',
  ch2_intro_6: 'stairs_aris',
  ch2_choice: 'stairs_aris',
  ch2_away_1: 'stairs_away',
  ch2_away_2: 'stairs_away',
  ch2_fight_1: 'stairs_wide',
  ch2_fight_1b: 'stairs_close',
  ch2_fight_1c: 'stairs_close',
  ch2_fight_2: 'stairs_close',
  ch2_win: 'stairs_wide',
  ch2_win_2: 'stairs_close',
  ch2_win_3: 'stairs_aris',
  ch2_win_4: 'stairs_aris',
  ch2_win_5: 'stairs_wide',
  ch2_win_6: 'stairs_close',
  // ---- rute netral: Dinding Dingin (montage) ----
  n1_1: 'classroom_view',
  n1_2: 'classroom_close',
  n1_3: 'classroom_close',
  n1_4: 'classroom_close',
  n1_5: 'classroom_close',
  n1_6: 'classroom_close',
  n1_7: 'classroom_view',
  // v0.8.0: Scene 2 konfrontasi Siti kini benar-benar di perpustakaan
  n2_1: 'library_wide',
  n2_2: 'library_close',
  n2_3: 'library_shelf',
  n2_4: 'library_close',
  n2_5: 'library_close',
  n2_6: 'library_close',
  n2_7: 'library_shelf',
  n2_8: 'library_pull',
  n3_1: 'corridor_view',
  n3_2: 'corridor_view',
  n3_3: 'corridor_close',
  n3_4: 'corridor_view',
  n3_5: 'corridor_close',
  n3_6: 'corridor_view',
  n4_1: 'classroom_view',
  n4_2: 'classroom_budi',
  n4_3: 'classroom_view',
  n4_4: 'classroom_view',
  // ---- rute netral: lulus tanpa nama (gerbang) ----
  ch4_neu_grad_1: 'grad_gate',
  ch4_neu_grad_2: 'grad_gate',
  ch4_neu_grad_3: 'grad_gate',
  ch4_neu_grad_4: 'grad_siti',
  ch4_neu_grad_5: 'grad_gate',
  ch4_neu_grad_6: 'grad_gate',
  // rooftop & late-story cinematics (GARIS MERAH)
  // ---- bab 3 rute aksi: pendekatan OSIS + sergapan parkiran ----
  ch3_osis_1: 'corridor_view',
  ch3_osis_2: 'corridor_close',
  ch3_osis_3: 'corridor_close',
  ch3_osis_4: 'corridor_close',
  ch3_osis_5: 'corridor_close',
  ch3_osis_6: 'corridor_view',
  ch3_f2_1: 'pk_ambush',
  ch3_f2_2: 'pk_close',
  ch3_f2_3: 'pk_close',
  ch3_f2_win: 'pk_ambush',
  ch3_f2_win_2: 'pk_close',
  ch3_f2_win_3: 'pk_ambush',
  // ---- rooftop: penawaran Bimo (CHOICE 2) ----
  ch3_intro_1: 'rooftop',
  ch3_intro_2: 'rooftop_close',
  ch3_intro_3: 'rooftop_close',
  ch3_intro_4: 'rooftop',
  ch3_intro_5: 'rooftop_close',
  ch3_choice: 'rooftop_close',
  ch3_accept_1: 'rooftop_close',
  ch3_accept_2: 'rooftop_close',
  ch3_reject_1: 'rooftop_close',
  ch3_reject_2: 'rooftop_close',
  ch4_bad_1: 'corridor_view',
  ch4_bad_2: 'classroom_close',
  ch4_bad_3: 'classroom_view',
  ch4_bad_4: 'warehouse_close',
  ch4_bad_4b: 'warehouse_close',
  ch4_bad_warehouse: 'whin',
  ch4_bad_after: 'whin_close',
  ch4_bad_after_2: 'whin',
  // ---- bad ending 1: kelulusan (GARIS MERAH) ----
  ch4_bad_grad_1: 'grad_gate',
  ch4_bad_grad_2: 'grad_gate',
  ch4_bad_grad_3: 'grad_gate',
  // ---- resistance: penyanderaan + FINAL BOSS + CHOICE 3 ----
  ch4_res_1: 'alley_wide',
  ch4_res_2: 'courtyard_view',
  ch4_res_3: 'courtyard_view',
  ch4_res_4: 'alley_wide',
  ch4_res_alley: 'alley_wide',
  ch4_res_alley_2: 'alley_close',
  ch4_res_alley_3: 'alley_wide',
  ch4_res_alley_4: 'alley_close',
  ch4_res_goons_win: 'alley_wide',
  ch4_res_goons_win_2: 'alley_close',
  ch4_res_choice: 'alley_close',
  // ---- good ending: penangkapan + kelulusan (GARIS MERAH) ----
  ch4_good_1: 'alley_close',
  ch4_good_2: 'alley_wide',
  ch4_good_3: 'alley_close',
  ch4_good_4: 'alley_wide',
  ch4_good_grad_1: 'grad_gate',
  ch4_good_grad_2: 'grad_siti',
  ch4_good_grad_3: 'grad_siti',
  ch4_good_grad_4: 'grad_gate',
  ch4_good_grad_5: 'grad_gate',
  // ---- bad ending 2: rantai dendam (GARIS MERAH) ----
  ch4_bad2_1: 'alley_close',
  ch4_bad2_2: 'alley_wide',
  ch4_bad2_3: 'alley_wide',
  ch4_bad2_4: 'alley_wide',
  ch4_bad2_5: 'alley_close',
};

// Extra world-side effects fired when a node's dialogue completes.
export const NODE_FX: Record<string, { fx: 'fp-to-tp' | 'fade-out' | 'fade-in' | 'shake' }> = {
  o5_1: { fx: 'fp-to-tp' },
  // slow-cut antar scene opening (alur lambat)
  o2_1: { fx: 'fade-in' },
  o3_1: { fx: 'fade-in' },
  o4_1: { fx: 'fade-in' },
  // rute netral: cut antar scene montage + scene graduasi
  n1_1: { fx: 'fade-in' },
  n2_1: { fx: 'fade-in' },
  n3_1: { fx: 'fade-in' },
  n4_1: { fx: 'fade-in' },
  ch4_neu_grad_1: { fx: 'fade-in' },
  // GARIS MERAH: montase OSIS/resistansi + cut scene kelulusan/penangkapan
  ch3_osis_1: { fx: 'fade-in' },
  ch4_res_1: { fx: 'fade-in' },
  ch4_res_alley: { fx: 'fade-in' },
  ch4_bad_grad_1: { fx: 'fade-in' },
  ch4_good_grad_1: { fx: 'fade-in' },
  ch4_bad2_1: { fx: 'fade-in' },
  // alur utama (tidak berubah)
  ch4_bad_warehouse: { fx: 'fade-out' },
  ch3_intro_2: { fx: 'fade-in' },
  ch2_intro_1: { fx: 'fade-in' },
};

// ---------------------------------------------------------------------------
// Story actor placement (opening + cinematic scenes).
// v0.7.0: setiap aktor kini Spot { pos, face? } — posisi dunia + arah hadap
// opsional — plus slot `followers` untuk rombongan Bimo. Semua koordinat
// kampus; scene kelas/lorong/kantin memakai koordinat interior
// (lihat game/world/CampusInterior.tsx).
// ---------------------------------------------------------------------------
export type StorySpot = { pos: [number, number]; face?: [number, number] };
export type OpeningCast = {
  bullies?: StorySpot[]; // dua murid besar (kelas) / dua murid kelas 10 (kantin)
  aris?: StorySpot;
  siti?: StorySpot;
  bimo?: StorySpot;
  budi?: StorySpot; // Pak Budi (montage netral scene 4)
  followers?: StorySpot[]; // pengikut Bimo
};

// Kelas 11-B: meja Aris di sudut belakang (meja -4.8, 11.3); kursi Aris
// (-4.0, 11.3), bangku Ren di sampingnya. Lorong: Siti dekat loket z 21.5.
// Kantin: meja bisik-bisik (25.5, 5), meja Ren (29.5, 7), pintu barat x 22.
const arisDesk: StorySpot = { pos: [-4.0, 11.3], face: [-5.5, 12.3] };
const whisperers: StorySpot[] = [
  { pos: [24.65, 5.0], face: [26.2, 4.4] },
  { pos: [25.5, 4.15], face: [24.6, 4.9] },
];

export const OPENING_ACTORS: Record<string, OpeningCast> = {
  // Scene 2 — kelas: dua murid besar menyenggol kursi Aris
  o2_3: {
    bullies: [
      { pos: [-6.1, 10.2], face: [-4.4, 12.2] },
      { pos: [-7.0, 12.2], face: [-4.4, 12.2] },
    ],
    aris: { pos: [-4.0, 11.3], face: [-6.5, 11.2] },
  },
  o2_4: {
    bullies: [
      { pos: [-7.4, 12.6], face: [-9.5, 9.0] },
      { pos: [-6.6, 12.9], face: [-9.5, 9.0] },
    ],
    aris: arisDesk,
  },
  o2_3b: {
    bullies: [
      { pos: [-7.4, 12.6], face: [-9.5, 9.0] },
      { pos: [-6.6, 12.9], face: [-9.5, 9.0] },
    ],
    aris: { pos: [-4.0, 11.3], face: [-6.5, 11.2] },
  },
  o2_5: { aris: { pos: [-4.0, 11.3], face: [-3.9, 12.4] } },
  o2_6: { aris: arisDesk },
  o2_7: { aris: arisDesk },
  o2_8: { aris: arisDesk },
  // Scene 3 — lorong: Siti dekat papan & loket
  o3_1: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_2: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_3: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_4: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_5: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_6: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_7: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  // Scene 4 — kantin: pembisik, lalu Bimo + tiga pengikut
  o4_2: { bullies: whisperers },
  o4_3: { bullies: whisperers },
  o4_4: { bullies: whisperers },
  o4_5: { bullies: whisperers },
  o4_6: { bullies: whisperers },
  o4_7: { bullies: whisperers },
  o4_8: { bullies: whisperers },
  o4_9: { bullies: whisperers },
  o4_10: { bullies: whisperers },
  o4_11: { bullies: whisperers },
  o4_12: {
    bullies: whisperers,
    bimo: { pos: [23.8, 10.8], face: [27.5, 8] },
    followers: [
      { pos: [22.9, 12.1], face: [27.5, 8] },
      { pos: [24.9, 12.3], face: [27.5, 8] },
      { pos: [24.3, 9.5], face: [27.5, 8] },
    ],
  },
  o4_13: {
    bullies: whisperers,
    bimo: { pos: [25.4, 9.4], face: [29.5, 7] },
    followers: [
      { pos: [24.2, 10.9], face: [29.5, 7] },
      { pos: [26.3, 11.0], face: [29.5, 7] },
      { pos: [25.9, 8.3], face: [29.5, 7] },
    ],
  },
  o4_14: {
    bullies: whisperers,
    bimo: { pos: [27.3, 7.6], face: [29.5, 7.2] },
    followers: [
      { pos: [26.0, 9.2], face: [29.5, 7.2] },
      { pos: [28.2, 9.3], face: [29.5, 7.2] },
      { pos: [27.8, 6.4], face: [29.5, 7.2] },
    ],
  },
  o5_1: {
    bullies: whisperers,
    bimo: { pos: [28.6, 7.2], face: [30.5, 6.8] },
    followers: [
      { pos: [27.4, 8.8], face: [30.5, 6.8] },
      { pos: [29.4, 8.9], face: [30.5, 6.8] },
      { pos: [29.0, 6.1], face: [30.5, 6.8] },
    ],
  },
};

// Story actors untuk scene NON-opening (bab 2 tangga, montase, kelulusan).
// Keyed per node → placements (dipakai CinematicActors di App.tsx).
// Bab 2 bermain di halaman belakang tepat di luar pintu tangga (z ≈ -2.7),
// supaya bingkai kamera lega dan tidak menabrak dinding lorong tangga.
const gangStairs: StorySpot[] = [
  { pos: [1.4, -2.7], face: [-1.5, -3.1] },
  { pos: [2.5, -3.3], face: [-1.5, -3.1] },
];
const arisSpill: StorySpot = { pos: [-0.5, -2.7], face: [1.4, -2.8] };
// GARIS MERAH: pengaturan aktor berulang (Siti koridor, letnan parkiran,
// penyanderaan gang, kelulusan good/bad).
const sitiHall: StorySpot = { pos: [-3.0, 23.5], face: [3, 26] };
const parkingLieutenants: StorySpot[] = [
  { pos: [33.2, 33.0], face: [30.5, 31.0] },
  { pos: [35.2, 34.6], face: [31.0, 32.0] },
];
// gang belakang: sandera di tengah, dua anak buah membentuk lingkaran,
// Bimo berdiri sedikit di belakang (zona back_alley ≈ x 6, z -21).
const arisHostage: StorySpot = { pos: [6.0, -22.0], face: [6.0, -19.0] };
const alleyCircle: StorySpot[] = [
  { pos: [4.5, -20.5], face: [6.0, -22.0] },
  { pos: [7.5, -20.6], face: [6.0, -22.0] },
];
const bimoAlley: StorySpot = { pos: [8.4, -22.8], face: [6.0, -21.5] };
const sitiHidden: StorySpot = { pos: [12.5, -22.0], face: [6.0, -22.0] };
const gradAris: StorySpot = { pos: [7.2, 43.4], face: [6.4, 44.6] };
const gradSiti: StorySpot = { pos: [8.4, 44.4], face: [6.8, 43.2] };
const gradFollowers: StorySpot[] = [
  { pos: [6.2, 43.8], face: [7.0, 42.0] },
  { pos: [8.6, 43.2], face: [7.0, 42.0] },
];
export const SCENE_ACTORS: Record<string, OpeningCast> = {
  // Bab 2 — tangga belakang: Aris + dua anak geng inti
  ch2_intro_1: { bullies: gangStairs },
  ch2_intro_2: { bullies: gangStairs, aris: { pos: [-1.8, -3.4], face: [1.4, -2.8] } },
  ch2_intro_3: { bullies: gangStairs, aris: { pos: [-1.0, -3.0], face: [1.4, -2.8] } },
  ch2_intro_4: { bullies: gangStairs, aris: arisSpill },
  ch2_intro_5: { bullies: gangStairs, aris: arisSpill },
  ch2_intro_6: { bullies: gangStairs, aris: arisSpill },
  ch2_choice: { bullies: gangStairs, aris: arisSpill },
  // GARIS MERAH — pendekatan OSIS (Siti koridor)
  ch3_osis_1: { siti: sitiHall },
  ch3_osis_2: { siti: sitiHall },
  ch3_osis_3: { siti: sitiHall },
  ch3_osis_4: { siti: sitiHall },
  ch3_osis_5: { siti: sitiHall },
  ch3_osis_6: { siti: sitiHall },
  // GARIS MERAH — sergapan letnan di parkiran
  ch3_f2_1: { bullies: parkingLieutenants },
  ch3_f2_2: { bullies: parkingLieutenants },
  ch3_f2_3: { bullies: parkingLieutenants },
  ch3_f2_win: { bullies: parkingLieutenants },
  ch3_f2_win_2: { bullies: parkingLieutenants },
  ch3_f2_win_3: { bullies: parkingLieutenants },
  // GARIS MERAH — montase bad: Aris menjauh (kelas)
  ch4_bad_3: { aris: { pos: [-4.0, 11.3], face: [-9, 8.6] } },
  // GARIS MERAH — kelulusan bad: pengikut geng baru
  ch4_bad_grad_1: { followers: gradFollowers },
  ch4_bad_grad_2: { followers: gradFollowers },
  ch4_bad_grad_3: { followers: gradFollowers },
  // GARIS MERAH — penyanderaan + FINAL BOSS + CHOICE 3 (gang belakang)
  ch4_res_alley: { aris: arisHostage, bimo: bimoAlley, followers: alleyCircle },
  ch4_res_alley_2: { aris: arisHostage, bimo: bimoAlley, followers: alleyCircle },
  ch4_res_alley_3: { aris: arisHostage, bimo: bimoAlley, followers: alleyCircle },
  ch4_res_alley_4: { aris: arisHostage, bimo: bimoAlley, followers: alleyCircle },
  ch4_res_goons_win: { aris: arisHostage, bimo: bimoAlley },
  ch4_res_goons_win_2: { aris: arisHostage, bimo: bimoAlley },
  ch4_res_choice: { aris: arisHostage, bimo: bimoAlley },
  // GARIS MERAH — good: penangkapan + kelulusan bersama
  ch4_good_1: { aris: arisHostage },
  ch4_good_2: { aris: arisHostage, siti: sitiHidden },
  ch4_good_3: { aris: arisHostage, siti: sitiHidden },
  ch4_good_grad_1: { aris: gradAris, siti: gradSiti },
  ch4_good_grad_2: { aris: gradAris, siti: gradSiti },
  ch4_good_grad_3: { aris: gradAris, siti: gradSiti },
  ch4_good_grad_4: { aris: gradAris, siti: gradSiti },
  ch4_good_grad_5: { aris: gradAris, siti: gradSiti },
  // Rute netral — montage
  n1_1: {},
  n1_2: { aris: { pos: [-4.0, 11.3], face: [-9, 8.6] } },
  n1_3: { aris: { pos: [-4.0, 11.3], face: [-3.9, 12.4] } },
  n1_4: { aris: { pos: [-4.0, 11.3], face: [-3.9, 12.4] } },
  n1_5: { aris: { pos: [-4.0, 11.3], face: [-3.9, 12.4] } },
  n1_6: { aris: { pos: [-4.0, 11.3], face: [-9, 8.6] } },
  n1_7: { aris: { pos: [-4.0, 11.3], face: [-9, 8.6] } },
  n2_1: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n2_2: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n2_3: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n2_4: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n2_5: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n2_6: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n2_7: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n2_8: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  n3_1: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-9, 17.4] }],
  },
  n3_2: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-9, 17.4] }],
  },
  n3_3: {
    bimo: { pos: [-4.0, 17.0], face: [-3.2, 17.6] },
    followers: [{ pos: [-5.4, 17.7], face: [-4.0, 17.1] }],
  },
  n3_4: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-4.0, 17.1] }],
  },
  n3_5: {
    bimo: { pos: [-4.0, 17.0], face: [-3.2, 17.6] },
    followers: [{ pos: [-5.4, 17.7], face: [-4.0, 17.1] }],
  },
  n3_6: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-9, 17.4] }],
  },
  n4_1: { budi: { pos: [-12.2, 11.6], face: [-8, 9] } },
  n4_2: { budi: { pos: [-12.2, 11.6], face: [-8, 9] } },
  n4_3: { budi: { pos: [-12.2, 11.6], face: [-8, 9] } },
  n4_4: { budi: { pos: [-12.2, 11.6], face: [-8, 9] } },
  // Graduasi — gerbang utama
  ch4_neu_grad_1: {},
  ch4_neu_grad_2: {},
  ch4_neu_grad_3: { siti: { pos: [8.4, 44.4], face: [6.8, 43.2] } },
  ch4_neu_grad_4: { siti: { pos: [8.4, 44.4], face: [6.8, 43.2] } },
  ch4_neu_grad_5: {},
  ch4_neu_grad_6: {},
};

// Study mini-game questions [PROPOSED content]
export const STUDY_QUESTIONS: { q: string; options: string[]; answer: number }[] = [
  { q: 'Hasil dari 12 × 8 − 6 adalah...', options: ['84', '90', '96', '102'], answer: 1 },
  { q: 'Kalimat "Kami pergi ke perpustakaan setelah bel." termasuk jenis kalimat...', options: ['Verbal', 'Nominal', 'Imperatif', 'Interogatif'], answer: 1 },
  { q: 'Choose the correct sentence:', options: ['He don\'t like school.', 'He doesn\'t likes school.', 'He doesn\'t like school.', 'He not like school.'], answer: 2 },
  { q: 'Ibu kota Provinsi Jawa Barat adalah...', options: ['Bandung', 'Semarang', 'Surabaya', 'Serang'], answer: 0 },
  { q: 'Pada ekosistem, organisme yang menguraikan bahan organik disebut...', options: ['Produsen', 'Konsumen', 'Detritivor/Decomposer', 'Herbivora'], answer: 2 },
];
