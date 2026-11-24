import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAD ENDING 2 — "Rantai Dendam" (doc Epilog Bad Ending 2 — versi terbaru)
// ============================================================================

export const BAD2_ENDING_NODES: DialogueNode[] = [
    N({ id: 'ch4_bad2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren gelap mata dan kehilangan kendali seperti di sekolah lamanya, membuat Bimo terluka parah dan harus dilarikan ke rumah sakit.', next: 'ch4_bad2_2' }),
    N({ id: 'ch4_bad2_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Keluarga Bimo menuntut Ren secara hukum atas penganiayaan berat.', next: 'ch4_bad2_3' }),
    N({ id: 'ch4_bad2_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren dijemput polisi di halaman sekolah pada Hari Kelulusan dan resmi dikeluarkan (expelled). Nilai akademisnya yang sempurna melayang.', effects: [{ k: 'flag', id: 'expelled' }], next: 'ch4_bad2_4' }),
    N({ id: 'ch4_bad2_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Saat melangkah masuk ke mobil polisi, Ren melihat Aris dan Siti menatapnya dengan raut kecewa berat.', next: 'ch4_bad2_5' }),
    N({
      id: 'ch4_bad2_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue menang berantem di gang itu, tapi gue ngancurin masa depan gue sendiri. Pas gue sibuk ngelawan monster yang nguasain Yuson… gue gak sadar kalau emosi udah ngubah gue jadi monster yang gak ada bedanya sama dia.',
      effects: [{ k: 'ending' }],
      end: true,
    }),
];
