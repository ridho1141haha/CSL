import type { QuestDef, EncounterDef } from '../types';

export const QUESTS: QuestDef[] = [
  {
    id: 'explore_school',
    title: 'Jelajahi SMA Yuson',
    type: 'main',
    desc: 'Hari pertama. Kenali lingkungan sekolah sebelum bel berikutnya.',
    objective: 'Kunjungi halaman, kantin, lapangan, dan gang belakang',
    chapter: 1,
  },
  {
    // v0.7.0: menggantikan gate_trouble — Bab 2 kini "Kesalahan Kecil Aris"
    id: 'aris_incident',
    title: 'Kesalahan Kecil Aris',
    type: 'main',
    desc: 'Jam istirahat. Ren mencari tempat makan — tangga belakang menuju kantin adalah jalur terdekat.',
    objective: 'Lewati tangga belakang menuju kantin saat istirahat',
    chapter: 2,
    waypoint: 'back_stairs',
  },
  {
    // v0.7.0: rute netral — pemicu scene ending di gerbang
    id: 'graduation_day',
    title: 'Hari Kelulusan',
    type: 'main',
    desc: 'Bulan-bulan berlalu. SMA Yuson akhirnya melepaskan Ren dengan nilai tertinggi di angkatan.',
    objective: 'Pulang lewat gerbang utama untuk terakhir kali',
    chapter: 4,
    waypoint: 'gate',
  },
  {
    id: 'rooftop_meeting',
    title: 'Ajakan di Atap',
    type: 'main',
    desc: 'Bimo memanggil Ren lewat salah satu anaknya.Tempat: tangga belakang.',
    objective: 'Temui Bimo di tangga belakang setelah jam pelajaran',
    chapter: 3,
    waypoint: 'back_stairs',
  },
  {
    // v0.11.0 GARIS MERAH: teror fisik letnan geng sebelum rooftop [FIGHT 2]
    id: 'gang_ambush',
    title: 'Teror di Parkiran',
    type: 'main',
    desc: 'Anak-anak geng mulai panas karena keberanian Ren. Siti sempat memperingatkan — parkiran adalah jalur paling sepi.',
    objective: 'Lewati area parkir setelah jam pelajaran',
    chapter: 3,
    waypoint: 'parking',
  },
  {
    id: 'warehouse_call',
    title: 'Panggilan Gudang',
    type: 'main',
    desc: 'Bimo membutuhkan "tenaga" Ren untuk urusan di gudang tua. Bukan permintaan.',
    objective: 'Ikuti Bimo ke gudang',
    chapter: 4,
    waypoint: 'warehouse',
  },
  {
    // v0.11.0 GARIS MERAH: penyanderaan Aris — pemicu klimaks gang belakang
    id: 'find_aris',
    title: 'Aris Tidak Pulang',
    type: 'main',
    desc: 'Aris tidak muncul sejak pulang sekolah. Pesan terakhirnya, jam tiga pagi: "maaf ya".',
    objective: 'Cari Aris — mulai dari gang belakang kantin',
    chapter: 4,
    waypoint: 'back_alley',
  },
  {
    id: 'osis_form',
    title: 'Bantuan Siti',
    type: 'side',
    desc: 'Siti minta tolong mengantar formulir OSIS ke ruang guru.',
    objective: 'Antarkan formulir ke Pak Budi',
    chapter: 1,
    waypoint: 'teacher_room',
  },
  {
    id: 'study_habit',
    title: 'Kebiasaan Belajar',
    type: 'side',
    desc: 'Pak Budi menyarankan Ren menjaga ritme belajarnya.',
    objective: 'Selesaikan satu sesi belajar',
    chapter: 1,
    waypoint: 'classroom',
  },
  // ---- side quests v0.6 (mentor feedback #6) ----
  {
    id: 'aris_notes',
    title: 'Pinjaman Catatan',
    type: 'side',
    desc: 'Aris menawarkan buku catatannya. Catatan itu hanya berguna kalau Ren benar-benar membacanya.',
    objective: 'Selesaikan satu sesi belajar dengan catatan Aris',
    chapter: 1,
    waypoint: 'classroom',
    // v0.17.0: completion rule moved from StoryDirector.tsx (hardcoded block).
    completeWhen: { k: 'flag', id: 'studied_once' },
    onComplete: [
      { k: 'quest', id: 'aris_notes', state: 'completed' },
      { k: 'stat', stat: 'academic', delta: 3 },
      { k: 'rel', target: 'aris', delta: 2 },
      { k: 'notify', text: 'Quest selesai: Pinjaman Catatan (Akademik +3)' },
    ],
  },
  {
    id: 'canteen_teh',
    title: 'Teh untuk Siti',
    type: 'side',
    desc: 'Siti minta satu favor kecil: teh kotak dari kantin saat istirahat siang.',
    objective: 'Bawakan teh dari kantin saat istirahat siang',
    chapter: 1,
    waypoint: 'canteen',
    completeWhen: { k: 'and', all: [{ k: 'zone', id: 'canteen' }, { k: 'period', id: 'lunch' }] },
    onComplete: [
      { k: 'quest', id: 'canteen_teh', state: 'completed' },
      { k: 'flag', id: 'canteen_teh_done' },
      { k: 'notify', text: 'Teh dibawa. Pulangkan ke Siti.' },
    ],
  },
  {
    id: 'field_training',
    title: 'Latihan Senja',
    type: 'side',
    desc: 'Aris bilang ada anak-anak latihan di lapangan setelah pulang sekolah. Ren ingin tubuhnya tidak berdiri diam lagi.',
    objective: 'Berlatih di lapangan setelah pulang sekolah',
    chapter: 2,
    waypoint: 'field',
    completeWhen: { k: 'and', all: [{ k: 'zone', id: 'field' }, { k: 'period', id: 'after' }] },
    onComplete: [
      { k: 'quest', id: 'field_training', state: 'completed' },
      { k: 'stat', stat: 'violence', delta: 2 },
      { k: 'hp', delta: 10 },
      { k: 'notify', text: 'Latihan senja selesai. (Instink +2, Tenaga +10)' },
    ],
  },
  {
    id: 'alley_check',
    title: 'Cek Gang Belakang',
    type: 'side',
    desc: 'Siti mencatat aktivitas anak-anak Bimo. Satu titik kosong: gang belakang. Dia tidak bisa lewat sana tanpa menarik perhatian.',
    objective: 'Periksa gang belakang, cari tanda aktivitas geng',
    chapter: 2,
    waypoint: 'back_alley',
    completeWhen: { k: 'any', of: [{ k: 'zone', id: 'back_alley' }, { k: 'flag', id: 'alley_mark' }] },
    onComplete: [
      { k: 'quest', id: 'alley_check', state: 'completed' },
      { k: 'flag', id: 'alley_checked' },
      { k: 'stat', stat: 'diplomacy', delta: 2 },
      { k: 'notify', text: 'Tanda geng tercatat. Laporkan ke Siti. (Diplomasi +2)' },
    ],
  },
];

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export const ENCOUNTERS: Record<string, EncounterDef> = {
  // v0.7.0: pertarungan tangga belakang — Ren membela Aris dari dua anak
  // geng inti Bimo (menggantikan gate_fight dari alur lama).
  stair_fight: {
    id: 'stair_fight',
    arena: 'back_stairs',
    enemies: [
      { id: 'gang_core_1', name: 'Anak Geng Inti', hp: 62, dmg: 7, speed: 2.1, color: '#b91c1c' },
      { id: 'gang_core_2', name: 'Anak Geng Inti', hp: 62, dmg: 7, speed: 2.1, color: '#991b1b' },
    ],
    onWin: 'ch2_win',
    music: 'tense',
  },
  // v0.11.0 GARIS MERAH: teror fisik letnan geng di parkiran [FIGHT 2]
  parking_fight: {
    id: 'parking_fight',
    arena: 'parking',
    enemies: [
      { id: 'letnan_1', name: 'Letnan Geng', hp: 66, dmg: 8, speed: 2.2, color: '#b91c1c' },
      { id: 'letnan_2', name: 'Letnan Geng', hp: 66, dmg: 8, speed: 2.2, color: '#991b1b' },
    ],
    onWin: 'ch3_f2_win',
    music: 'tense',
  },
  warehouse_fight: {
    id: 'warehouse_fight',
    arena: 'warehouse',
    enemies: [
      { id: 'rival_1', name: 'Anak Geng Rival', hp: 70, dmg: 9, speed: 2.3, color: '#7c3aed' },
      { id: 'rival_boss', name: 'Tuan Geng Rival', hp: 110, dmg: 12, speed: 2.6, color: '#4c1d95', scale: 1.15 },
    ],
    onWin: 'ch4_bad_after',
    music: 'dark',
  },
  alley_fight: {
    id: 'alley_fight',
    arena: 'back_alley',
    enemies: [
      { id: 'gang_bimo_1', name: 'Anak Bimo', hp: 75, dmg: 9, speed: 2.4, color: '#b91c1c' },
      { id: 'gang_bimo_2', name: 'Anak Bimo', hp: 75, dmg: 9, speed: 2.4, color: '#991b1b' },
    ],
    onWin: 'ch4_res_goons_win',
    music: 'dark',
  },
  // v0.11.0 GARIS MERAH: FIGHT 3 — FINAL BOSS, satu lawan satu vs Bimo
  bimo_fight: {
    id: 'bimo_fight',
    arena: 'back_alley',
    enemies: [
      { id: 'bimo_boss', name: 'Bimo', hp: 150, dmg: 11, speed: 2.7, color: '#7f1d1d', scale: 1.12 },
    ],
    onWin: 'ch4_res_choice',
    music: 'dark',
  },
  // v0.15.0 GARIS MERAH — doc SUB-CABANG 1B: SECRET BATTLE rute netral.
  // "Ren datang sendirian tanpa bantuan OSIS/guru/polisi. Bimo berdiri
  // bersama 6-8 anggota gengnya." Musuh berurutan (sistem duel 1v1):
  // tiga anak buah dulu, Bimo terakhir — kalah jumlah terasa akumulatif.
  // KALAH adalah hasil cerita yang sah (onLose → Secret Bad Ending A
  // "Bonyok Tanpa Nama"); MENANG → Secret Bad Ending B "Kemenangan Terlambat".
  secret_fight: {
    id: 'secret_fight',
    arena: 'back_alley',
    enemies: [
      { id: 'secret_goon_1', name: 'Anak Bimo', hp: 70, dmg: 9, speed: 2.3, color: '#b91c1c' },
      { id: 'secret_goon_2', name: 'Anak Bimo', hp: 70, dmg: 9, speed: 2.3, color: '#991b1b' },
      { id: 'secret_goon_3', name: 'Anak Bimo', hp: 75, dmg: 10, speed: 2.4, color: '#7f1d1d' },
      { id: 'secret_bimo', name: 'Bimo', hp: 150, dmg: 11, speed: 2.7, color: '#450a0a', scale: 1.12 },
    ],
    onWin: 'ch4_neu_sbw_1',
    onLose: 'ch4_neu_sbl_1',
    music: 'dark',
  },
};
