import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// GOOD ENDING — "Lulus Bersama" (penangkapan + kelulusan bersama Aris & Siti)
// ch4_good_1..4 (rekaman Siti + penangkapan) + ch4_good_grad_1..5.
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const GOOD_ENDING_NODES: DialogueNode[] = [
    // ---- GOOD ENDING: "LULUS BERSAMA" ----
    N({ id: 'ch4_good_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren menarik napas panjang. Tangan yang terkepal perlahan dilonggarkan. Ia merapikan seragamnya — dan mundur selangkah dari garis yang tidak mau ia lewati.', next: 'ch4_good_2' }),
    N({ id: 'ch4_good_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Suara sirene. Siti keluar dari persembunyiannya bersama polisi dan Kepala Sekolah, membawa rekaman lengkap pemerasan dan penyanderaan. Bimo dan pengikutnya diborgol — ditangkap, lalu dikeluarkan dari SMA Yuson.', effects: [{ k: 'item', id: 'rekaman' }, { k: 'flag', id: 'gang_exposed' }], next: 'ch4_good_3' }),
    N({ id: 'ch4_good_3', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Ren... aku enggak tahu harus bilang apa. Kamu... kamu datang beneran.', effects: [{ k: 'flag', id: 'aris_safe' }], next: 'ch4_good_4' }),
    N({
      id: 'ch4_good_4',
      speaker: 'NARATOR',
      portrait: 'narrator',
      text: 'Beberapa bulan berlalu. Senin terakhir Ren di Yuson: hari kelulusan.',
      effects: [
        { k: 'beat', id: 'ch4_good_grad' },
        { k: 'quest', id: 'graduation_day', state: 'active' },
        { k: 'time', minutes: 2880 },
        { k: 'notify', text: 'Tujuan: Pulang lewat gerbang utama' },
        { k: 'save' },
      ],
      end: true,
    }),
    // ---- Kelulusan (trigger StoryDirector: gate + restrained_bimo) ----
    N({ id: 'ch4_good_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Hari kelulusan berlangsung meriah. Ren berdiri di gerbang memegang ijazah — nilai tertinggi di angkatannya.', next: 'ch4_good_grad_2' }),
    N({ id: 'ch4_good_grad_2', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Dengan kacamata baru) Nih, teh kotakmu, Ren. Makasih... buat semuanya. Kalau bukan karena kamu di tangga waktu itu, aku pasti udah putus sekolah.', next: 'ch4_good_grad_3' }),
    N({ id: 'ch4_good_grad_3', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Nilai lu tetap nomor satu, Ren. Dan yang paling penting... lu enggak lulus sendirian. Ayo foto bertiga.', next: 'ch4_good_grad_4' }),
    N({ id: 'ch4_good_grad_4', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: '(Menerima teh kotak, tersenyum tipis) Boleh.', next: 'ch4_good_grad_5' }),
    N({
      id: 'ch4_good_grad_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'calm',
      text: 'Surat pindah gue selesai. Nilai lulus gue sempurna. Ada memar yang sempat singgah di muka gue, tapi Bimo dan gengnya kini cuma sejarah kelam yang berhasil ditumbangkan. Target awal gue memang cuma mengejar nilai dan ijazah... tapi saat melangkah keluar melewati gerbang ini bareng teman-teman gue, gue tahu gue keluar dari sini tanpa kehilangan hati gue.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
];
