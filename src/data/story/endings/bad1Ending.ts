import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAD ENDING 1 — "Tunduk Pada Kekuasaan" (kelulusan sebagai bos geng)
// ch4_bad_grad_1..3 — TERPISAH total dari ending lain (Task 5).
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const BAD1_ENDING_NODES: DialogueNode[] = [
    // ---- BAD ENDING 1: "TUNDUK PADA KEKUASAAN" (gerbang, hari kelulusan) ----
    N({ id: 'ch4_bad_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelulusan tiba. Bimo lulus bulan itu — dan nama yang bikin anak-anak Yuson menunduk berganti: Ren.', next: 'ch4_bad_grad_2' }),
    N({ id: 'ch4_bad_grad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Nilai Ren tinggi. Rekamannya bersih — bersih karena tidak ada yang berani melapor. Ia resmi jadi pemimpin geng baru, terjebak dalam lingkaran yang dulu ia janjikan tidak akan ia masuki.', next: 'ch4_bad_grad_3' }),
    N({
      id: 'ch4_bad_grad_3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Nilai gue aman. Gue enggak pernah kalah dalam perkelahian. Tapi saat ngelihat bayangan gue di kaca... gue enggak lagi mengenali siapa cowok yang berdiri di sana. Gue selamat dari sistem Yuson, cuma buat jadi bagian dari sistem yang gue rusak.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
];
