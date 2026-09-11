import type { ChapterDef, ChapterId } from '../types';

export const CHAPTERS: Record<ChapterId, ChapterDef> = {
  1: { id: 1, title: 'BAB I', subtitle: 'Murid Pindahan & Janji Pada Diri Sendiri' },
  2: { id: 2, title: 'BAB II', subtitle: 'Gesekan Pertama & Pengamatan Bimo' },
  3: { id: 3, title: 'BAB III', subtitle: 'Momen Kunci' },
  4: { id: 4, title: 'BAB IV', subtitle: 'Cabang Cerita & Penentuan Akhir' },
};

// Camera pose (see data/world.ts) shown while each opening node displays.
// Unlisted nodes reuse the last pose.
export const OPENING_ROOT = 'o1_1';

export const CAM_BY_NODE: Record<string, string> = {
  o1_1: 'fp_gate',
  o1_2: 'fp_gate_side',
  o1_3: 'fp_gate',
  o2_1: 'fp_enter',
  o2_2: 'fp_courtyard',
  o3_1: 'fp_bully',
  o3_2: 'fp_bully_close',
  o3_3: 'fp_bully_close',
  o3_4: 'fp_bully',
  o3_choice: 'fp_bully_close',
  o_help_1: 'fp_bully_close',
  o_help_2: 'fp_meet',
  o_walk_1: 'fp_courtyard',
  o_walk_2: 'fp_courtyard',
  o4_1: 'fp_siti',
  o4_2: 'fp_siti',
  o4_3: 'fp_bully_close',
  o4_4: 'fp_meet',
  o5_1: 'fp_meet',
  o5_2: 'fp_meet',
  o5_3: 'fp_meet',
  o6_1: 'fp_students',
  o6_2: 'fp_bimo',
  o6_3: 'fp_bimo_close',
  o6_4: 'fp_bimo_close',
  o7_1: 'fp_end',
  // rooftop & late-story cinematics
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
  ch4_bad_1: 'alley_wide',
  ch4_bad_2: 'alley_wide',
  ch4_bad_3: 'warehouse_close',
  ch4_bad_4: 'warehouse_close',
  ch4_bad_warehouse: 'whin',
  ch4_bad_raid: 'whin',
  ch4_bad_raid_2: 'whin_close',
  ch4_bad_raid_3: 'whin_close',
  ch4_bad_raid_4: 'whin_close',
  ch4_bad_raid_5: 'whin',
  ch4_res_1: 'alley_wide',
  ch4_res_2: 'courtyard_view',
  ch4_res_3: 'courtyard_view',
  ch4_res_4: 'alley_wide',
  ch4_res_alley: 'alley_close',
  ch4_res_choice: 'alley_close',
  ch4_res_help_1: 'alley_close',
  ch4_res_help_2: 'alley_close',
  ch4_res_win: 'alley_close',
  ch4_res_win_2: 'alley_close',
  ch4_res_win_3: 'alley_wide',
  ch4_res_win_4: 'alley_close',
  ch4_res_away_1: 'alley_wide',
  ch4_res_away_2: 'courtyard_view',
};

// Extra world-side effects fired when a node's dialogue completes.
export const NODE_FX: Record<string, { fx: 'fp-to-tp' | 'fade-out' | 'fade-in' | 'shake' }> = {
  o7_1: { fx: 'fp-to-tp' },
  ch4_bad_warehouse: { fx: 'fade-out' },
  ch4_res_alley: { fx: 'fade-in' },
  ch3_intro_2: { fx: 'fade-in' },
  ch2_intro_1: { fx: 'fade-in' },
};

// Opening actor placement: during specific node ranges, story actors appear.
// Format: nodeId -> actors to show at position (bullies etc.)
export const OPENING_ACTORS: Record<string, { bullies: [number, number]; aris: [number, number]; siti: [number, number]; bimo: [number, number] }> = (() => {
  const bullyScene: [number, number] = [-7.6, 29.6];
  const arisScene: [number, number] = [-7, 31.2];
  const sitiScene: [number, number] = [-9.6, 30.2];
  const bimoScene: [number, number] = [21, 10.5];
  const none = { bullies: [0, 0] as [number, number], aris: [0, 0] as [number, number], siti: [0, 0] as [number, number], bimo: [0, 0] as [number, number] };
  const place = (o: Partial<typeof none>) => ({ ...none, ...o });
  return {
    o3_1: place({ bullies: bullyScene, aris: arisScene }),
    o3_2: place({ bullies: bullyScene, aris: arisScene }),
    o3_3: place({ bullies: bullyScene, aris: arisScene }),
    o3_4: place({ bullies: bullyScene, aris: arisScene }),
    o3_choice: place({ bullies: bullyScene, aris: arisScene }),
    o_help_1: place({ bullies: bullyScene, aris: arisScene }),
    o_help_2: place({ aris: arisScene, siti: sitiScene }),
    o4_1: place({ aris: arisScene, siti: sitiScene }),
    o4_2: place({ aris: arisScene, siti: sitiScene }),
    o4_3: place({ aris: arisScene, siti: sitiScene }),
    o4_4: place({ aris: arisScene, siti: sitiScene }),
    o5_1: place({ aris: arisScene, siti: sitiScene }),
    o5_2: place({ aris: arisScene, siti: sitiScene }),
    o5_3: place({ aris: arisScene, siti: sitiScene }),
    o6_1: place({}),
    o6_2: place({ bimo: bimoScene }),
    o6_3: place({ bimo: bimoScene }),
    o6_4: place({ bimo: bimoScene }),
    o7_1: place({}),
  };
})();

// Study mini-game questions [PROPOSED content]
export const STUDY_QUESTIONS: { q: string; options: string[]; answer: number }[] = [
  { q: 'Hasil dari 12 × 8 − 6 adalah...', options: ['84', '90', '96', '102'], answer: 1 },
  { q: 'Kalimat "Kami pergi ke perpustakaan setelah bel." termasuk jenis kalimat...', options: ['Verbal', 'Nominal', 'Imperatif', 'Interogatif'], answer: 1 },
  { q: 'Choose the correct sentence:', options: ['He don\'t like school.', 'He doesn\'t likes school.', 'He doesn\'t like school.', 'He not like school.'], answer: 2 },
  { q: 'Ibu kota Provinsi Jawa Barat adalah...', options: ['Bandung', 'Semarang', 'Surabaya', 'Serang'], answer: 0 },
  { q: 'Pada ekosistem, organisme yang menguraikan bahan organik disebut...', options: ['Produsen', 'Konsumen', 'Detritivor/Decomposer', 'Herbivora'], answer: 2 },
];
