import type { ChapterDef, ChapterId, HoldKind, SceneId } from '../types';

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
  o2_c1: 'fp_class_desk',
  o2_6a: 'fp_class_desk',
  o2_7a: 'fp_class_desk',
  o2_6b: 'fp_class_desk',
  o2_7b: 'fp_class_desk',
  o2_8: 'fp_class',
  // Scene 3 — peringatan pertama di lorong
  o3_1: 'fp_corridor',
  o3_2: 'fp_siti_hall',
  o3_3: 'fp_siti_hall',
  o3_4: 'fp_siti_hall_close',
  o3_c2: 'fp_siti_hall_close',
  o3_6a: 'fp_siti_hall',
  o3_7a: 'fp_siti_hall',
  o3_6b: 'fp_siti_hall',
  o3_7b: 'fp_siti_hall',
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
  // ---- v0.15.0: bonding arc (doc Ch3 perpustakaan + Ch4 PTS) ----
  ch1_lib_1: 'library_wide',
  ch1_lib_2: 'library_close',
  ch1_lib_3: 'library_close',
  ch1_lib_4: 'library_close',
  ch1_lib_5: 'library_close',
  ch1_lib_6: 'library_shelf',
  ch1_pts_1: 'classroom_view',
  ch1_pts_2: 'classroom_budi',
  ch1_pts_3: 'classroom_view',
  ch1_pts_4: 'classroom_close',
  ch1_pts_5: 'classroom_close',
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
  // v0.14.1: penutup bab 2 kini punya cameraStage — sebelumnya jatuh ke
  // fallback 'courtyard_view' (tebakan lokasi) padahal scene masih di tangga.
  ch2_close: 'stairs_wide',
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
  n2_c3: 'library_close',
  n2_7b: 'library_close',
  n2_8b: 'library_pull',
  // v0.15.0: urutan doc — n3 = surat pengunduran diri (kelas/Budi), n4 =
  // pengabaian Bimo (koridor), n5 = bulan-bulan sunyi (kelas).
  n3_1: 'classroom_view',
  n3_2: 'classroom_budi',
  n3_3: 'classroom_view',
  n3_4: 'classroom_close',
  n4_1: 'corridor_view',
  n4_2: 'corridor_close',
  n4_3: 'corridor_close',
  n4_4: 'corridor_view',
  n4_5: 'corridor_close',
  n4_6: 'corridor_view',
  n5_1: 'classroom_view',
  n5_2: 'classroom_view',
  // ---- rute netral: lulus tanpa nama (gerbang) ----
  ch4_neu_grad_1: 'grad_gate',
  ch4_neu_grad_2: 'grad_gate',
  ch4_neu_grad_4: 'grad_siti',
  ch4_neu_grad_5: 'grad_gate',
  ch4_neu_grad_6: 'grad_siti',
  ch4_neu_grad_7: 'grad_siti',
  ch4_neu_grad_8: 'grad_gate',
  // v0.15.0: SECRET CHOICE POINT — tiga rantai penutup rute netral
  ch4_neu_out_1: 'grad_gate',
  ch4_neu_out_2: 'grad_gate',
  ch4_neu_secret_1: 'alley_wide',
  ch4_neu_secret_2: 'alley_close',
  ch4_neu_secret_3: 'alley_close',
  ch4_neu_secret_4: 'alley_wide',
  ch4_neu_sbw_1: 'alley_wide',
  ch4_neu_sbw_2: 'alley_wide',
  ch4_neu_sbw_3: 'alley_close',
  ch4_neu_sbw_4: 'alley_close',
  ch4_neu_sbl_1: 'alley_close',
  ch4_neu_sbl_2: 'alley_wide',
  ch4_neu_sbl_3: 'alley_close',
  // rooftop & late-story cinematics (GARIS MERAH)
  // ---- bab 3 rute aksi: pendekatan OSIS + sergapan parkiran ----
  // v0.14.1: pose lama corridor_* mewarisi framing montase n3 (koridor z≈17)
  // padahal Siti distage di hall z≈23.5 — kamera meleset ±22 m dari lokasi
  // scene. hall_view/hall_close memframing persis spot Siti (look -3,23.5).
  ch3_osis_1: 'hall_view',
  ch3_osis_2: 'hall_close',
  ch3_osis_3: 'hall_close',
  ch3_osis_4: 'hall_close',
  ch3_osis_5: 'hall_close',
  ch3_osis_6: 'hall_view',
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
  ch3_fc4: 'rooftop_close',
  ch3_fc4a: 'rooftop_close',
  ch3_fc4a2: 'rooftop_close',
  ch3_fc4b: 'rooftop_close',
  ch3_fc4b2: 'rooftop_close',
  ch3_choice: 'rooftop_close',
  ch3_accept_1: 'rooftop_close',
  ch3_accept_2: 'rooftop_close',
  ch3_reject_1: 'rooftop_close',
  ch3_reject_2: 'rooftop_close',
  ch4_bad_1: 'corridor_view',
  ch4_bad_2: 'classroom_close',
  ch4_bad_3: 'classroom_view',
  // v0.14.1: dua node ini masih di konteks KELAS (pindah gudang terjadi di
  // ch4_bad_warehouse) — pose lama 'warehouse_close' memotret area gudang
  // jauh dari scene aktif.
  ch4_bad_4: 'classroom_close',
  ch4_bad_4b: 'classroom_close',
  ch4_bad_warehouse: 'whin',
  ch4_bad_after: 'whin_close',
  ch4_bad_after_2: 'whin',
  // ---- bad ending 1: kelulusan (GARIS MERAH) ----
  ch4_bad_grad_1: 'grad_gate',
  ch4_bad_grad_2: 'grad_gate',
  ch4_bad_grad_3: 'grad_gate',
  // ---- resistance: penyanderaan + FINAL BOSS + CHOICE 3 ----
  // GARIS MERAH — montase resistance: kampanye hukuman di COURTYARD (aktor
  // distage courtyard; v0.14.1: alley_wide lama memotret gang belakang 53 m
  // dari scene aktif)
  ch4_res_1: 'courtyard_view',
  ch4_res_2: 'courtyard_view',
  ch4_res_3: 'courtyard_view',
  ch4_res_4: 'courtyard_view',
  ch4_res_alley: 'alley_wide',
  ch4_res_alley_2: 'alley_close',
  ch4_res_alley_3: 'alley_wide',
  ch4_res_alley_4: 'alley_close',
  ch4_res_goons_win: 'alley_wide',
  ch4_res_goons_win_2: 'alley_close',
  ch4_fc5: 'alley_close',
  ch4_fc5a: 'alley_close',
  ch4_fc5a2: 'alley_close',
  ch4_fc5b: 'alley_close',
  ch4_fc5b2: 'alley_close',
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
  // v0.15.0: montase bonding + rantai secret rute netral
  ch1_lib_1: { fx: 'fade-in' },
  ch1_pts_1: { fx: 'fade-in' },
  n5_1: { fx: 'fade-in' },
  ch4_neu_out_1: { fx: 'fade-in' },
  ch4_neu_secret_1: { fx: 'fade-in' },
  // v0.14.0: scene-start yang distage (player teleport) kini selalu difade —
  // transisi sinematik out→place→in, tidak ada teleport kasat mata
  ch3_f2_1: { fx: 'fade-in' },
  ch3_f2_win: { fx: 'fade-in' },
  ch4_bad_1: { fx: 'fade-in' },
  ch4_good_1: { fx: 'fade-in' },
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
export type StorySpot = { pos: [number, number]; face?: [number, number]; sit?: boolean; crouch?: boolean; hold?: HoldKind };
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
  // v0.12.0: kotak pensil jatuh (STORY_PROPS) — Aris buru-buru memungut
  o2_3: {
    bullies: [
      { pos: [-6.1, 10.2], face: [-4.4, 12.2] },
      { pos: [-7.0, 12.2], face: [-4.4, 12.2] },
    ],
    aris: { pos: [-4.0, 11.3], crouch: true, face: [-4.5, 10.6] },
  },
  o2_4: {
    bullies: [
      { pos: [-7.4, 12.6], face: [-9.5, 9.0] },
      { pos: [-6.6, 12.9], face: [-9.5, 9.0] },
    ],
    aris: { pos: [-4.0, 11.3], crouch: true, face: [-4.5, 10.6] },
  },
  o2_3b: {
    bullies: [
      { pos: [-7.4, 12.6], face: [-9.5, 9.0] },
      { pos: [-6.6, 12.9], face: [-9.5, 9.0] },
    ],
    aris: { pos: [-4.0, 11.3], crouch: true, face: [-4.5, 10.6] },
  },
  // v0.12.0: Aris berdiri lagi, menyodorkan penghapus (naskah scene 2)
  // v0.15.0: FLAVOR CHOICE 1 — Aris tetap berdiri dengan penghapus sampai
  // jawaban Ren selesai; semua cabang kembali ke meja (o2_8).
  o2_5: { aris: { pos: [-4.0, 11.3], face: [-3.9, 12.4], hold: 'eraser' } },
  o2_c1: { aris: { pos: [-4.0, 11.3], face: [-3.9, 12.4], hold: 'eraser' } },
  o2_6a: { aris: arisDesk },
  o2_7a: { aris: arisDesk },
  o2_6b: { aris: arisDesk },
  o2_7b: { aris: arisDesk },
  o2_8: { aris: arisDesk },
  // Scene 3 — lorong: Siti dekat papan & loket
  o3_1: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_2: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_3: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_4: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_c2: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_6a: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_7a: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_6b: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
  o3_7b: { siti: { pos: [-3.0, 23.5], face: [3, 26] } },
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
// v0.12.0: bab 2 pindah dari halaman belakang gedung ke JALUR tangga →
// kantin belakang (sesuai naskah "Lorong tangga menuju kantin belakang"):
// geng nongkrong di pinggir jalur beton timur tangga, Aris lewat membawa
// tumpukan buku + botol minum, tersandung, air tumpah ke sepatu geng.
// Koordinat di jalur halaman belakang (path beton x -11..11, z -7.5..3.5).
const gangStairs: StorySpot[] = [
  { pos: [6.3, 1.6], face: [4.6, 2.9] },
  { pos: [7.3, 2.4], face: [4.6, 2.9] },
];
// Aris berjalan membawa tumpukan buku (hold 'stack' — dirender di tangan).
// Semua spot di timur shaft tangga (x > 4.2) — DI DALAM shaft ada undakan.
const arisWalk: StorySpot = { pos: [4.5, 3.5], face: [6.3, 1.6], hold: 'stack' };
const arisTrip: StorySpot = { pos: [5.2, 3.0], face: [6.3, 1.6], hold: 'stack' };
// Aris berlutut memungut buku yang berserakan (prop dunia: STORY_PROPS)
const arisSpill: StorySpot = { pos: [5.2, 3.0], face: [6.3, 1.6], crouch: true };
// Setelah ditolong: Aris berdiri, buku terkumpul lagi di tangan
const arisThanks: StorySpot = { pos: [5.2, 3.0], face: [2.0, 2.6], hold: 'stack' };
// GARIS MERAH: pengaturan aktor berulang (Siti koridor, letnan parkiran,
// penyanderaan gang, kelulusan good/bad).
const sitiHall: StorySpot = { pos: [-3.0, 23.5], face: [3, 26] };
// v0.14.0: konfrontasi netral n2 pindah ke interior perpustakaan — sinkron
// dengan pose kamera library_* (sebelumnya masih spot hall, tak pernah masuk
// frame). Ren distage di sampingnya via REN_STAGING.
const LIB_SITI: StorySpot = { pos: [30.0, 19.2], face: [29.2, 20.2] };
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
// montase resistance (courtyard) — verbatim dari hardcode lama CinematicActors
const RES_COURTYARD_ARIS: StorySpot = { pos: [6, 33] };
const RES_COURTYARD_SITI: StorySpot = { pos: [4.5, 34.5] };
// rooftop scene (koordinat lokal scene) — verbatim dari hardcode lama
// CinematicActors: Bimo di parapet utara menghadap kota
const ROOFTOP_BIMO: StorySpot = { pos: [0.3, -5.6], face: [0, -10] };
// interior gudang (koordinat lokal scene) — Bimo menghadap Ren (WAREHOUSE_REN)
const WAREHOUSE_BIMO: StorySpot = { pos: [0.0, -4.6], face: [0.3, -2.4] };
const sitiHidden: StorySpot = { pos: [12.5, -22.0], face: [6.0, -22.0] };
const gradAris: StorySpot = { pos: [7.2, 43.4], face: [6.4, 44.6] };
const gradSiti: StorySpot = { pos: [8.4, 44.4], face: [6.8, 43.2] };
const gradFollowers: StorySpot[] = [
  { pos: [6.2, 43.8], face: [7.0, 42.0] },
  { pos: [8.6, 43.2], face: [7.0, 42.0] },
];
// v0.15.0 — bonding arc: Aris meja perpustakaan (memakai titik n2 Siti — spot
// berdiri valid yang sudah di-frame kamera library_*) + kelas PTS (spot Budi
// n4 lama). Budi & Aris saling menghadap; Ren distage via REN_STAGING.
const LIB_ARIS: StorySpot = { pos: [30.0, 19.2], face: [29.0, 20.4] };
const BUDI_CLASS: StorySpot = { pos: [-12.2, 11.6], face: [-8, 9] };
const ARIS_CLASS: StorySpot = { pos: [-4.0, 11.3], face: [-12.2, 11.6] };
// v0.15.0 — rombongan secret battle (doc: 6-8 anggota; stage 4 — sisanya
// lewat narasi supaya draw call tetap dijaga)
const secretCrowd: StorySpot[] = [
  { pos: [4.5, -20.5], face: [6.0, -22.0] },
  { pos: [7.5, -20.6], face: [6.0, -22.0] },
  { pos: [3.8, -22.6], face: [6.0, -22.0] },
  { pos: [8.7, -20.0], face: [6.0, -22.0] },
];
export const SCENE_ACTORS: Record<string, OpeningCast> = {
  // Bab 2 — jalur tangga belakang → kantin: Aris + dua anak geng inti
  ch2_intro_1: { bullies: gangStairs },
  ch2_intro_2: { bullies: gangStairs, aris: arisWalk },
  ch2_intro_3: { bullies: gangStairs, aris: arisTrip },
  ch2_intro_4: { bullies: gangStairs, aris: arisSpill },
  ch2_intro_5: { bullies: gangStairs, aris: arisSpill },
  ch2_intro_6: { bullies: gangStairs, aris: arisSpill },
  ch2_choice: { bullies: gangStairs, aris: arisSpill },
  ch2_fight_1: { bullies: gangStairs, aris: arisSpill },
  ch2_fight_1b: { bullies: gangStairs, aris: arisSpill },
  ch2_fight_1c: { bullies: gangStairs, aris: arisSpill },
  ch2_fight_2: { bullies: gangStairs, aris: arisSpill },
  ch2_win: { bullies: gangStairs, aris: arisSpill },
  ch2_win_2: { bullies: gangStairs, aris: arisSpill },
  ch2_win_3: { aris: arisThanks },
  ch2_win_4: { aris: arisThanks },
  ch2_win_5: {},
  ch2_win_6: {},
  ch2_away_1: { bullies: gangStairs, aris: arisSpill },
  ch2_away_2: { bullies: gangStairs, aris: arisSpill },
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
  // GARIS MERAH — rooftop: penawaran Bimo (scene lokal; aktor via data —
  // v0.14.1 pindah dari hardcode CinematicActors ke SCENE_ACTORS supaya
  // node.cam speaker-shot tervalidasi terhadap cast yang sama)
  ch3_intro_1: { bimo: ROOFTOP_BIMO },
  ch3_intro_2: { bimo: ROOFTOP_BIMO },
  ch3_intro_3: { bimo: ROOFTOP_BIMO },
  ch3_intro_4: { bimo: ROOFTOP_BIMO },
  ch3_intro_5: { bimo: ROOFTOP_BIMO },
  ch3_fc4: { bimo: ROOFTOP_BIMO },
  ch3_fc4a: { bimo: ROOFTOP_BIMO },
  ch3_fc4a2: { bimo: ROOFTOP_BIMO },
  ch3_fc4b: { bimo: ROOFTOP_BIMO },
  ch3_fc4b2: { bimo: ROOFTOP_BIMO },
  ch3_choice: { bimo: ROOFTOP_BIMO },
  ch3_accept_1: { bimo: ROOFTOP_BIMO },
  ch3_accept_2: { bimo: ROOFTOP_BIMO },
  ch3_reject_1: { bimo: ROOFTOP_BIMO },
  ch3_reject_2: { bimo: ROOFTOP_BIMO },
  // GARIS MERAH — montase resistance (courtyard): Aris & Siti korban hukuman
  // v0.14.1: pindah dari hardcode CinematicActors ke SCENE_ACTORS supaya
  // node.cam (close_speaker) tervalidasi terhadap cast yang sama
  ch4_res_1: { aris: RES_COURTYARD_ARIS, siti: RES_COURTYARD_SITI },
  ch4_res_2: { aris: RES_COURTYARD_ARIS, siti: RES_COURTYARD_SITI },
  ch4_res_3: { aris: RES_COURTYARD_ARIS, siti: RES_COURTYARD_SITI },
  ch4_res_4: { aris: RES_COURTYARD_ARIS, siti: RES_COURTYARD_SITI },
  // GARIS MERAH — pasca gudang: Bimo menyerahkan wilayah (scene lokal gudang;
  // spot persis di look-target whin_close — Ren distage menghadapinya)
  ch4_bad_after: { bimo: WAREHOUSE_BIMO },
  ch4_bad_after_2: { bimo: WAREHOUSE_BIMO },
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
  ch4_fc5: { aris: arisHostage, bimo: bimoAlley },
  ch4_fc5a: { aris: arisHostage, bimo: bimoAlley },
  ch4_fc5a2: { aris: arisHostage, bimo: bimoAlley },
  ch4_fc5b: { aris: arisHostage, bimo: bimoAlley },
  ch4_fc5b2: { aris: arisHostage, bimo: bimoAlley },
  ch4_res_choice: { aris: arisHostage, bimo: bimoAlley },
  // GARIS MERAH — good: penangkapan + kelulusan bersama
  // v0.12.0: Siti merekam aksi geng dari sembunyi (pegang ponsel)
  ch4_good_1: { aris: arisHostage },
  ch4_good_2: { aris: arisHostage, siti: { ...sitiHidden, hold: 'phone' } },
  ch4_good_3: { aris: arisHostage, siti: { ...sitiHidden, hold: 'phone' } },
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
  n2_1: { siti: LIB_SITI },
  n2_2: { siti: LIB_SITI },
  n2_3: { siti: LIB_SITI },
  n2_4: { siti: LIB_SITI },
  n2_5: { siti: LIB_SITI },
  n2_6: { siti: LIB_SITI },
  n2_c3: { siti: LIB_SITI },
  n2_7: { siti: LIB_SITI },
  n2_8: { siti: LIB_SITI },
  n2_7b: { siti: LIB_SITI },
  n2_8b: { siti: LIB_SITI },
  // v0.15.0: n3 = surat pengunduran diri (Pak Budi, kelas); n4 = pengabaian
  // Bimo (koridor — spot lama n3 pindah ke sini); n5 = kelas tanpa aktor.
  n3_1: { budi: BUDI_CLASS },
  n3_2: { budi: BUDI_CLASS },
  n3_3: { budi: BUDI_CLASS },
  n3_4: { budi: BUDI_CLASS },
  n4_1: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-9, 17.4] }],
  },
  n4_2: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-9, 17.4] }],
  },
  n4_3: {
    bimo: { pos: [-4.0, 17.0], face: [-3.2, 17.6] },
    followers: [{ pos: [-5.4, 17.7], face: [-4.0, 17.1] }],
  },
  n4_4: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-4.0, 17.1] }],
  },
  n4_5: {
    bimo: { pos: [-4.0, 17.0], face: [-3.2, 17.6] },
    followers: [{ pos: [-5.4, 17.7], face: [-4.0, 17.1] }],
  },
  n4_6: {
    bimo: { pos: [-4.0, 17.0], face: [-9, 17.4] },
    followers: [{ pos: [-5.4, 17.7], face: [-9, 17.4] }],
  },
  n5_1: {},
  n5_2: {},
  // Graduasi — gerbang utama (v0.15.0: konfrontasi Siti + SECRET CHOICE POINT)
  ch4_neu_grad_1: {},
  ch4_neu_grad_2: {},
  ch4_neu_grad_4: { siti: gradSiti },
  ch4_neu_grad_5: { siti: gradSiti },
  ch4_neu_grad_6: { siti: gradSiti },
  ch4_neu_grad_7: { siti: gradSiti },
  ch4_neu_grad_8: { siti: gradSiti },
  ch4_neu_out_1: {},
  ch4_neu_out_2: {},
  // secret battle: Bimo + rombongan (doc: 6-8 orang) di gang belakang
  ch4_neu_secret_1: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_secret_2: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_secret_3: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_secret_4: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_sbw_1: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_sbw_2: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_sbw_3: { bimo: bimoAlley, followers: secretCrowd, siti: sitiHidden },
  ch4_neu_sbw_4: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_sbl_1: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_sbl_2: { bimo: bimoAlley, followers: secretCrowd },
  ch4_neu_sbl_3: { bimo: bimoAlley, followers: secretCrowd },
  // v0.15.0 — bonding arc (doc Ch3 perpustakaan + Ch4 PTS)
  ch1_lib_1: { aris: LIB_ARIS },
  ch1_lib_2: { aris: LIB_ARIS },
  ch1_lib_3: { aris: LIB_ARIS },
  ch1_lib_4: { aris: LIB_ARIS },
  ch1_lib_5: { aris: LIB_ARIS },
  ch1_lib_6: { aris: LIB_ARIS },
  ch1_pts_1: { budi: BUDI_CLASS, aris: ARIS_CLASS },
  ch1_pts_2: { budi: BUDI_CLASS, aris: ARIS_CLASS },
  ch1_pts_3: { budi: BUDI_CLASS, aris: ARIS_CLASS },
  ch1_pts_4: { budi: BUDI_CLASS, aris: ARIS_CLASS },
  ch1_pts_5: { budi: BUDI_CLASS, aris: ARIS_CLASS },
};

// ---------------------------------------------------------------------------
// v0.12.0 — Prop dunia pendukung cerita (dirender StoryPropFX di App.tsx).
// Per node dialogue: keadaan prop — kotak pensil Aris (scene 2 kelas),
// buku + botol minum + genangan air (bab 2 jalur tangga).
//   pencase: 'desk' di meja | 'fall' animasi jatuh | 'floor' di lantai |
//            'none' sudah dipungut (disembunyikan)
//   books:   'held' di tangan Aris | 'scatter' berserakan di lantai | 'none'
//   bottle:  'held' | 'drop' jatuh | 'none'
//   spill:   genangan air terlihat di lantai
// ---------------------------------------------------------------------------
export type StoryPropDef = {
  pencase?: 'desk' | 'fall' | 'floor' | 'none';
  books?: 'held' | 'scatter' | 'none';
  bottle?: 'held' | 'drop' | 'none';
  spill?: boolean;
};

const SPILL: StoryPropDef = { books: 'scatter', bottle: 'drop', spill: true };

export const STORY_PROPS: Record<string, StoryPropDef> = {
  // Scene 2 kelas: kotak pensil jatuh dari meja Aris (o2_3), Aris memungut,
  // lalu lenyap dari lantai saat scene lanjut (sudah terkumpul)
  o2_1: { pencase: 'desk' },
  o2_2: { pencase: 'desk' },
  o2_3: { pencase: 'fall' },
  o2_3b: { pencase: 'floor' },
  o2_4: { pencase: 'floor' },
  o2_5: { pencase: 'floor' },
  // v0.15.0: FLAVOR CHOICE 1 — cabang 6a/7a & 6b/7b sama-sama tanpa pensil
  o2_6a: { pencase: 'none' },
  o2_7a: { pencase: 'none' },
  o2_6b: { pencase: 'none' },
  o2_7b: { pencase: 'none' },
  o2_8: { pencase: 'none' },
  // Bab 2: Aris bawa buku+botol (intro_2), tersandung & tumpah (intro_3),
  // buku berserakan sampai duel usai; ch2_win_3 buku sudah terkumpul lagi
  ch2_intro_1: {},
  ch2_intro_2: { books: 'held', bottle: 'held' },
  ch2_intro_3: SPILL,
  ch2_intro_4: SPILL,
  ch2_intro_5: SPILL,
  ch2_intro_6: SPILL,
  ch2_choice: SPILL,
  ch2_fight_1: SPILL,
  ch2_fight_1b: SPILL,
  ch2_fight_1c: SPILL,
  ch2_fight_2: SPILL,
  ch2_win: SPILL,
  ch2_win_2: SPILL,
  ch2_win_3: { books: 'none', bottle: 'none', spill: true },
  ch2_win_4: { books: 'none', bottle: 'none' },
  ch2_win_5: {},
  ch2_win_6: {},
  ch2_away_1: SPILL,
  ch2_away_2: SPILL,
};

// Study mini-game questions [PROPOSED content]
export const STUDY_QUESTIONS: { q: string; options: string[]; answer: number }[] = [
  { q: 'Hasil dari 12 × 8 − 6 adalah...', options: ['84', '90', '96', '102'], answer: 1 },
  { q: 'Kalimat "Kami pergi ke perpustakaan setelah bel." termasuk jenis kalimat...', options: ['Verbal', 'Nominal', 'Imperatif', 'Interogatif'], answer: 1 },
  { q: 'Choose the correct sentence:', options: ['He don\'t like school.', 'He doesn\'t likes school.', 'He doesn\'t like school.', 'He not like school.'], answer: 2 },
  { q: 'Ibu kota Provinsi Jawa Barat adalah...', options: ['Bandung', 'Semarang', 'Surabaya', 'Serang'], answer: 0 },
  { q: 'Pada ekosistem, organisme yang menguraikan bahan organik disebut...', options: ['Produsen', 'Konsumen', 'Detritivor/Decomposer', 'Herbivora'], answer: 2 },
];

// ---------------------------------------------------------------------------
// v0.14.0 — PLAYER STAGING (Task story-staging): posisi deterministik REN per
// node cerita. Melengkapi SCENE_ACTORS (NPC) + CAM_BY_NODE (kamera) +
// STORY_PROPS: sebuah story scene kini menentukan WHERE (scene+pos), WHO
// (aktor), POSE, CAMERA, DIALOGUE — bukan cuma DIALOGUE.
//
// Aturan penempatan (dipatuhi test/staging.test.ts):
//  - bab 2: semua spot x ≥ 4.4 (di dalam shaft tangga x -4..4, z -2..4 ada
//    undakan — jangan menaruh aktor di sana).
//  - spot mengikuti look-target pose kamera (CAM_BY_NODE) supaya Ren masuk
//    frame, dan menghadap lawan bicara (face → posisi aktor).
//  - node kombat TIDAK distage ulang saat fight berjalan (combat memegang
//    penempatan musuh); staging dipakai di node dialog sebelum/ sesudahnya.
//  - scene selain kampus WAJIB mengisi `scene` (rooftop/warehouse lokal).
//  - opening FP (o1..o5) sengaja TIDAK distage: kamera FP memakai pose
//    authoran + viewmodel tangan; badan Ren di spawn tidak terlihat.
// ---------------------------------------------------------------------------
export type PlayerStaging = {
  pos: [number, number];
  face?: [number, number];
  /** wajib untuk node di scene non-kampus (koordinat lokal scene) */
  scene?: SceneId;
};

const WATCH_STAIRS: [number, number] = [5.9, 0.7]; // timur shaft, selatan geng
const STAIR_FACE_GANG: [number, number] = [6.6, 2.0];
const STAIR_FACE_ARIS: [number, number] = [5.2, 3.0];
const ROOFTOP_REN: PlayerStaging = { pos: [1.3, -4.3], face: [0.3, -5.6], scene: 'rooftop' };
const WAREHOUSE_REN: PlayerStaging = { pos: [0.3, -2.4], face: [0, -4.2], scene: 'warehouse' };
const HOSTAGE_REN: [number, number] = [5.0, -17.6]; // depan lingkaran sandera
const HOSTAGE_FACE: [number, number] = [6.0, -21.5];
const GATE_SOLO: [number, number] = [7.0, 42.8];
const GATE_SOLO_FACE: [number, number] = [7.0, 44.6];
const PARK_REN: [number, number] = [30.4, 30.6];
const PARK_FACE: [number, number] = [34.0, 33.4];
const CLASS_REN: [number, number] = [-3.4, 11.2];

export const REN_STAGING: Record<string, PlayerStaging> = {
  // ---- BAB 2: Kesalahan Kecil Aris (jalur timur tangga) ----
  ch2_intro_1: { pos: WATCH_STAIRS, face: STAIR_FACE_GANG },
  ch2_intro_2: { pos: WATCH_STAIRS, face: STAIR_FACE_GANG },
  ch2_intro_3: { pos: [5.4, 1.2], face: STAIR_FACE_ARIS },
  ch2_intro_4: { pos: [5.4, 1.2], face: STAIR_FACE_ARIS },
  ch2_intro_5: { pos: [5.4, 1.2], face: STAIR_FACE_ARIS },
  ch2_intro_6: { pos: [5.4, 1.2], face: STAIR_FACE_ARIS },
  ch2_choice: { pos: [5.4, 1.2], face: STAIR_FACE_ARIS },
  ch2_away_1: { pos: [4.6, 0.8], face: [6.0, 2.2] },
  ch2_away_2: { pos: [4.6, 0.8], face: [6.0, 2.2] },
  // sesudah duel menang (node kombat ch2_fight_* biar combat yang pegang)
  ch2_win: { pos: [4.8, 1.6], face: [6.6, 2.0] },
  ch2_win_2: { pos: [4.8, 1.6], face: [6.6, 2.0] },
  ch2_win_3: { pos: [4.5, 2.2], face: STAIR_FACE_ARIS },
  ch2_win_4: { pos: [4.5, 2.2], face: STAIR_FACE_ARIS },
  ch2_win_5: { pos: [4.8, 1.6], face: [6.6, 2.0] },
  ch2_win_6: { pos: [4.8, 1.6], face: [6.6, 2.0] },
  // ---- BAB 3: pendekatan OSIS (Siti di lorong hall) ----
  ch3_osis_1: { pos: [-1.2, 24.8], face: [-3.0, 23.5] },
  ch3_osis_2: { pos: [-1.2, 24.8], face: [-3.0, 23.5] },
  ch3_osis_3: { pos: [-1.2, 24.8], face: [-3.0, 23.5] },
  ch3_osis_4: { pos: [-1.2, 24.8], face: [-3.0, 23.5] },
  ch3_osis_5: { pos: [-1.2, 24.8], face: [-3.0, 23.5] },
  ch3_osis_6: { pos: [-1.2, 24.8], face: [-3.0, 23.5] },
  // ---- BAB 3: sergapan parkiran [FIGHT 2] + pasca-menang ----
  ch3_f2_1: { pos: PARK_REN, face: PARK_FACE },
  ch3_f2_2: { pos: PARK_REN, face: PARK_FACE },
  ch3_f2_3: { pos: PARK_REN, face: PARK_FACE },
  ch3_f2_win: { pos: [31.4, 32.0], face: [34.2, 33.4] },
  ch3_f2_win_2: { pos: [31.4, 32.0], face: [34.2, 33.4] },
  ch3_f2_win_3: { pos: [31.4, 32.0], face: [34.2, 33.4] },
  // ---- BAB 3: rooftop (scene lokal; Bimo (0.3,-5.6)) ----
  ch3_intro_1: ROOFTOP_REN,
  ch3_intro_2: ROOFTOP_REN,
  ch3_intro_3: ROOFTOP_REN,
  ch3_intro_4: ROOFTOP_REN,
  ch3_intro_5: ROOFTOP_REN,
  ch3_accept_1: ROOFTOP_REN,
  ch3_accept_2: ROOFTOP_REN,
  ch3_reject_1: ROOFTOP_REN,
  ch3_reject_2: ROOFTOP_REN,
  // v0.15.0: FLAVOR CHOICE 4 (masih di rooftop, sebelum CHOICE 2)
  ch3_fc4: ROOFTOP_REN,
  ch3_fc4a: ROOFTOP_REN,
  ch3_fc4a2: ROOFTOP_REN,
  ch3_fc4b: ROOFTOP_REN,
  ch3_fc4b2: ROOFTOP_REN,
  // ---- RUTE BAD: montase eksekutor + gudang ----
  ch4_bad_1: { pos: [-4.0, 17.0], face: [-1.5, 16.8] },
  ch4_bad_2: { pos: CLASS_REN, face: [-4.0, 11.3] },
  ch4_bad_3: { pos: CLASS_REN, face: [-4.0, 11.3] },
  ch4_bad_warehouse: WAREHOUSE_REN,
  ch4_bad_after: WAREHOUSE_REN,
  ch4_bad_after_2: WAREHOUSE_REN,
  // ---- RUTE RESISTANCE: montase (aktor courtyard) + penyanderaan ----
  ch4_res_1: { pos: [7.4, 31.2], face: [6.0, 33.0] },
  ch4_res_2: { pos: [7.4, 31.2], face: [6.0, 33.0] },
  ch4_res_3: { pos: [7.4, 31.2], face: [6.0, 33.0] },
  ch4_res_4: { pos: [7.4, 31.2], face: [6.0, 33.0] },
  ch4_res_alley: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_res_alley_2: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_res_alley_3: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_res_alley_4: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_res_goons_win: { pos: [5.4, -19.0], face: [6.0, -22.0] },
  ch4_res_goons_win_2: { pos: [5.4, -19.0], face: [6.0, -22.0] },
  // v0.15.0: FLAVOR CHOICE 5 (gertakan sebelum duel final)
  ch4_fc5: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_fc5a: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_fc5a2: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_fc5b: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_fc5b2: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_res_choice: { pos: [5.4, -19.0], face: [6.0, -22.0] },
  // ---- GOOD: penyanderaan + rekaman Siti + penangkapan ----
  ch4_good_1: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_good_2: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_good_3: { pos: HOSTAGE_REN, face: HOSTAGE_FACE },
  ch4_good_4: { pos: [5.4, -19.0], face: [6.0, -22.0] },
  // ---- KELULUSAN (gerbang utama) ----
  ch4_neu_grad_1: { pos: GATE_SOLO, face: GATE_SOLO_FACE },
  ch4_neu_grad_2: { pos: GATE_SOLO, face: GATE_SOLO_FACE },
  ch4_neu_grad_4: { pos: GATE_SOLO, face: [8.4, 44.4] },
  ch4_neu_grad_5: { pos: GATE_SOLO, face: [8.4, 44.4] },
  ch4_neu_grad_6: { pos: GATE_SOLO, face: [8.4, 44.4] },
  ch4_neu_grad_7: { pos: GATE_SOLO, face: [8.4, 44.4] },
  ch4_neu_grad_8: { pos: GATE_SOLO, face: GATE_SOLO_FACE },
  // v0.15.0: SECRET CHOICE POINT — keluar gerbang / secret battle / hasilnya
  ch4_neu_out_1: { pos: [7.0, 46.5], face: [7.0, 50] },
  ch4_neu_out_2: { pos: [7.0, 46.5], face: [7.0, 50] },
  ch4_neu_secret_1: { pos: HOSTAGE_REN, face: [8.4, -22.8] },
  ch4_neu_secret_2: { pos: HOSTAGE_REN, face: [8.4, -22.8] },
  ch4_neu_secret_3: { pos: HOSTAGE_REN, face: [8.4, -22.8] },
  ch4_neu_secret_4: { pos: HOSTAGE_REN, face: [8.4, -22.8] },
  ch4_neu_sbw_1: { pos: [5.4, -19.0], face: [8.4, -22.8] },
  ch4_neu_sbw_2: { pos: [5.4, -19.0], face: [8.4, -22.8] },
  ch4_neu_sbw_3: { pos: [5.4, -19.0], face: [12.5, -22.0] },
  ch4_neu_sbw_4: { pos: [5.4, -19.0], face: [8.4, -22.8] },
  ch4_neu_sbl_1: { pos: [6.4, -20.4], face: [8.4, -22.8] },
  ch4_neu_sbl_2: { pos: [6.4, -20.4], face: [8.4, -22.8] },
  ch4_neu_sbl_3: { pos: [6.4, -20.4], face: [8.4, -22.8] },
  ch4_bad_grad_1: { pos: [7.0, 42.2], face: [7.4, 43.5] },
  ch4_bad_grad_2: { pos: [7.0, 42.2], face: [7.4, 43.5] },
  ch4_bad_grad_3: { pos: [7.0, 42.2], face: [7.4, 43.5] },
  ch4_good_grad_1: { pos: [6.6, 42.9], face: [7.2, 43.4] },
  ch4_good_grad_2: { pos: [6.6, 42.9], face: [7.2, 43.4] },
  ch4_good_grad_3: { pos: [6.6, 42.9], face: [7.2, 43.4] },
  ch4_good_grad_4: { pos: [6.6, 42.9], face: [7.2, 43.4] },
  ch4_good_grad_5: { pos: [6.6, 42.9], face: [7.2, 43.4] },
  // ---- BAD ENDING 2: gang belakang, rasa menang yang pahit ----
  ch4_bad2_1: { pos: [6.4, -20.4], face: [8.2, -22.6] },
  ch4_bad2_2: { pos: [6.4, -20.4], face: [8.2, -22.6] },
  ch4_bad2_3: { pos: [6.4, -20.4], face: [8.2, -22.6] },
  ch4_bad2_4: { pos: [6.4, -20.4], face: [8.2, -22.6] },
  ch4_bad2_5: { pos: [6.4, -20.4], face: [8.2, -22.6] },
  // v0.14.1: penutup bab 2 (setelah Bimo "...Tidak buruk.") — deterministik,
  // kamera stairs_wide memframing titik ini
  ch2_close: { pos: [4.8, 1.6], face: [6.6, 2.0] },
  // ---- v0.15.0: bonding arc (doc Ch3 perpustakaan + Ch4 PTS) ----
  ch1_lib_1: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  ch1_lib_2: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  ch1_lib_3: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  ch1_lib_4: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  ch1_lib_5: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  ch1_lib_6: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  ch1_pts_1: { pos: CLASS_REN, face: [-12.2, 11.6] },
  ch1_pts_2: { pos: CLASS_REN, face: [-12.2, 11.6] },
  ch1_pts_3: { pos: CLASS_REN, face: [-12.2, 11.6] },
  ch1_pts_4: { pos: CLASS_REN, face: [-12.2, 11.6] },
  ch1_pts_5: { pos: CLASS_REN, face: [-12.2, 11.6] },
  // ---- RUTE NETRAL: montase "Dinding Dingin" ----
  n1_1: { pos: CLASS_REN, face: [-4.0, 11.3] },
  n1_2: { pos: CLASS_REN, face: [-4.0, 11.3] },
  n1_3: { pos: CLASS_REN, face: [-4.0, 11.3] },
  n1_4: { pos: CLASS_REN, face: [-4.0, 11.3] },
  n1_5: { pos: CLASS_REN, face: [-4.0, 11.3] },
  n1_6: { pos: CLASS_REN, face: [-4.0, 11.3] },
  n1_7: { pos: CLASS_REN, face: [-4.0, 11.3] },
  // v0.14.0 FIX: konfrontasi Siti kini BENAR-BENAR di interior perpustakaan
  // (kamera library_* sudah dipotong ke sana sejak v0.8.0, tapi aktor Siti
  // masih memakai spot hall — sekarang sinkron + Ren distage).
  n2_1: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_2: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_3: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_4: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_5: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_6: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_c3: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_7: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_8: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_7b: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  n2_8b: { pos: [29.0, 20.4], face: [30.0, 19.2] },
  // v0.15.0: n3 = surat (kelas/Budi), n4 = Bimo (koridor), n5 = kelas
  n3_1: { pos: CLASS_REN, face: [-12.2, 11.6] },
  n3_2: { pos: CLASS_REN, face: [-12.2, 11.6] },
  n3_3: { pos: CLASS_REN, face: [-12.2, 11.6] },
  n3_4: { pos: CLASS_REN, face: [-12.2, 11.6] },
  n4_1: { pos: [-2.9, 16.6], face: [-4.0, 17.0] },
  n4_2: { pos: [-2.9, 16.6], face: [-4.0, 17.0] },
  n4_3: { pos: [-2.9, 16.6], face: [-4.0, 17.0] },
  n4_4: { pos: [-2.9, 16.6], face: [-4.0, 17.0] },
  n4_5: { pos: [-2.9, 16.6], face: [-4.0, 17.0] },
  n4_6: { pos: [-2.9, 16.6], face: [-4.0, 17.0] },
  n5_1: { pos: CLASS_REN, face: [-4.0, 11.3] },
  n5_2: { pos: CLASS_REN, face: [-4.0, 11.3] },
};
