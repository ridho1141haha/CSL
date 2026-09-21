import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// NEUTRAL ENDING — "Lulus Tanpa Nama" (kelulusan sendirian di gerbang)
// ch4_neu_grad_1..6 — TERPISAH total dari ending lain (Task 5).
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const NEUTRAL_ENDING_NODES: DialogueNode[] = [
    // ---- NEUTRAL ENDING: "LULUS TANPA NAMA" (gerbang, hari kelulusan) ----
    N({ id: 'ch4_neu_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gerbang utama SMA Yuson. Beberapa bulan kemudian — hari kelulusan.', next: 'ch4_neu_grad_2' }),
    N({ id: 'ch4_neu_grad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Nama Ren berada di urutan pertama dengan nilai rata-rata tertinggi di SMA Yuson. Di halaman, murid-murid lain saling corat-coret seragam, berfoto, dan berpelukan dengan teman geng mereka.', next: 'ch4_neu_grad_3' }),
    N({ id: 'ch4_neu_grad_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Siti lewat membawa berkas penutupan OSIS. Ia sempat melirik Ren yang berdiri sendirian di dekat gerbang.', next: 'ch4_neu_grad_4' }),
    N({ id: 'ch4_neu_grad_4', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Mengangguk dingin — tanpa satu kata pun tentang selamat — lalu berjalan pergi.)', next: 'ch4_neu_grad_5' }),
    N({ id: 'ch4_neu_grad_5', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Surat pindah gue selesai. Nilai lulus gue sempurna. Gak ada bekas luka, gak ada panggilan kepolisian, dan Bimo bahkan gak pernah ingat nama gue.', next: 'ch4_neu_grad_6' }),
    N({
      id: 'ch4_neu_grad_6',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Target awal gue tercapai seratus persen. Tapi saat melangkah keluar melewati gerbang ini sendirian... gue sadar. Gue memang selamat di SMA Yuson, tapi gue keluar dari sini sebagai orang yang kehilangan hatinya.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
];
