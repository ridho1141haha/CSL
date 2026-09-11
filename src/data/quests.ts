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
    id: 'gate_trouble',
    title: 'Keributan di Gerbang',
    type: 'main',
    desc: 'Geng dari luar sekolah mulai terlihat di gerbang saat jam istirahat.',
    objective: 'Periksa gerbang saat istirahat',
    chapter: 2,
  },
  {
    id: 'rooftop_meeting',
    title: 'Ajakan di Atap',
    type: 'main',
    desc: 'Bimo memanggil Ren lewat salah satu anaknya.Tempat: tangga belakang.',
    objective: 'Temui Bimo di tangga belakang setelah jam pelajaran',
    chapter: 3,
  },
  {
    id: 'warehouse_call',
    title: 'Panggilan Gudang',
    type: 'main',
    desc: 'Bimo membutuhkan "tenaga" Ren untuk urusan di gudang tua.',
    objective: 'Ikuti Bimo ke gudang',
    chapter: 4,
  },
  {
    id: 'find_aris',
    title: 'Aris Tidak Pulang',
    type: 'main',
    desc: 'Aris tidak muncul sejak pulang sekolah. Pesan terakhirnya aneh.',
    objective: 'Cari Aris di sekitar gang / jalan pulang',
    chapter: 4,
  },
  {
    id: 'osis_form',
    title: 'Bantuan Siti',
    type: 'side',
    desc: 'Siti minta tolong mengantar formulir OSIS ke ruang guru.',
    objective: 'Antarkan formulir ke Pak Budi',
    chapter: 1,
  },
  {
    id: 'study_habit',
    title: 'Kebiasaan Belajar',
    type: 'side',
    desc: 'Pak Budi menyarankan Ren menjaga ritme belajarnya.',
    objective: 'Selesaikan satu sesi belajar',
    chapter: 1,
  },
];

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

export const ENCOUNTERS: Record<string, EncounterDef> = {
  gate_fight: {
    id: 'gate_fight',
    arena: 'gate',
    enemies: [{ id: 'gang_out_1', name: 'Anak Geng Luar', hp: 60, dmg: 7, speed: 2.1, color: '#b45309' }],
    onWin: 'ch2_win',
    music: 'tense',
  },
  warehouse_fight: {
    id: 'warehouse_fight',
    arena: 'warehouse',
    enemies: [
      { id: 'rival_1', name: 'Anak Geng Rival', hp: 70, dmg: 9, speed: 2.3, color: '#7c3aed' },
      { id: 'rival_boss', name: 'Tuan Geng Rival', hp: 110, dmg: 12, speed: 2.6, color: '#4c1d95', scale: 1.15 },
    ],
    onWin: 'ch4_bad_raid',
    music: 'dark',
  },
  alley_fight: {
    id: 'alley_fight',
    arena: 'back_alley',
    enemies: [
      { id: 'gang_bimo_1', name: 'Anak Bimo', hp: 75, dmg: 9, speed: 2.4, color: '#b91c1c' },
      { id: 'gang_bimo_2', name: 'Anak Bimo', hp: 75, dmg: 9, speed: 2.4, color: '#991b1b' },
    ],
    onWin: 'ch4_res_win',
    music: 'dark',
  },
};
