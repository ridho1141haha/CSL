import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAD ENDING 2 — "Rantai Dendam" (brutal → ditangkap, dikeluarkan)
// ch4_bad2_1..5 — TERPISAH total dari ending lain (Task 5).
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const BAD2_ENDING_NODES: DialogueNode[] = [
    // ---- BAD ENDING 2: "RANTAI DENDAM" / JADI MONSTER ----
    N({ id: 'ch4_bad2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gelap mata. Pukulan berikutnya turun lagi — dan lagi — sampai tangan yang tadi gemetar sekarang tidak mau berhenti.', next: 'ch4_bad2_2' }),
    N({ id: 'ch4_bad2_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Bimo dilarikan ke rumah sakit dalam kondisi kritis. Keluarganya melaporkan Ren atas penganiayaan berat. Rekaman OSIS cukup untuk menjatuhkan Bimo — tapi tidak cukup membebaskan Ren dari main hakim sendiri.', next: 'ch4_bad2_3' }),
    N({ id: 'ch4_bad2_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren ditangkap polisi di halaman sekolah dan resmi dikeluarkan dari SMA Yuson. Nilai akademisnya yang sempurna melayang — tertinggal di dalam berkas perkara.', effects: [{ k: 'flag', id: 'expelled' }], next: 'ch4_bad2_4' }),
    N({ id: 'ch4_bad2_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Saat mobil polisi menutup pintunya, Ren melihat Aris dan Siti di balik pagar sekolah. Keduanya menatap tanpa bicara — kecewa yang jauh lebih berat daripada marah.', next: 'ch4_bad2_5' }),
    N({
      id: 'ch4_bad2_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue memenangkan pertarungan di gang itu, tapi gue kehilangan masa depan gue. Dalam usaha gue melawan monster yang menguasai Yuson... gue enggak sadar bahwa amarah udah mengubah gue jadi monster yang sama mengerikannya.',
      effects: [{ k: 'ending' }],
      end: true,
    }),
];
