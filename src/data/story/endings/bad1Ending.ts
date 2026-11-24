import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAD ENDING 1 — "Tunduk Pada Kekuasaan" (doc Chapter 10 & Epilog Bad 1)
// ============================================================================

export const BAD1_ENDING_NODES: DialogueNode[] = [
    N({ id: 'ch4_bad_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Hari kelulusan tiba. Nilai Ren tetap aman berkat intimidasi geng, dan Bimo menyerahkan kekuasaan tongkrongan sekolah kepada Ren.', next: 'ch4_bad_grad_2' }),
    N({ id: 'ch4_bad_grad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren berdiri di koridor dipatuhi oleh seluruh preman sekolah, sementara Aris dan Siti berjalan menunduk menghindarinya.', next: 'ch4_bad_grad_3' }),
    N({
      id: 'ch4_bad_grad_3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Nilai gue aman. Gue gak pernah kalah berantem. Tapi pas ngelihat bayangan gue sendiri di kaca… gue udah gak kenal lagi siapa cowok yang berdiri di situ. Gue selamat dari kerasnya Yuson, cuma buat berubah jadi preman yang dulunya gue benci.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
];
