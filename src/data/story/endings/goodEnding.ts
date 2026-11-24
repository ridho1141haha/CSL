import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// GOOD ENDING — "Lulus Bersama" (doc Epilog Aksi Utama — versi terbaru)
// ============================================================================

export const GOOD_ENDING_NODES: DialogueNode[] = [
    N({ id: 'ch4_good_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren menarik napas panjang, menahan kepalan tangannya, dan merapikan seragamnya.', next: 'ch4_good_2' }),
    N({ id: 'ch4_good_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Tepat saat itu, Siti datang membawa Pihak Kepolisian dan Kepala Sekolah beserta bukti rekaman video lengkap. Bimo dan pengikut utamanya resmi ditangkap dan dikeluarkan dari sekolah.', effects: [{ k: 'item', id: 'rekaman' }, { k: 'flag', id: 'gang_exposed' }], next: 'ch4_good_3' }),
    N({ id: 'ch4_good_3', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Ren... aku enggak tahu harus bilang apa. Kamu... kamu datang beneran.', effects: [{ k: 'flag', id: 'aris_safe' }], next: 'ch4_good_4' }),
    N({
      id: 'ch4_good_4',
      speaker: 'NARATOR',
      portrait: 'narrator',
      text: 'Beberapa bulan berlalu. Hari kelulusan akhirnya tiba di SMA Yuson.',
      effects: [
        { k: 'beat', id: 'ch4_good_grad' },
        { k: 'quest', id: 'graduation_day', state: 'active' },
        { k: 'time', minutes: 2880 },
        { k: 'notify', text: 'Tujuan: Pulang lewat gerbang utama' },
        { k: 'save' },
      ],
      end: true,
    }),
    // ---- Scene Kelulusan (Gerbang Utama SMA Yuson) ----
    N({ id: 'ch4_good_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Hari kelulusan berlangsung meriah di gerbang utama SMA Yuson. Ren berdiri memegang ijazah nilai tertinggi. Aris (dengan kacamata baru) dan Siti menghampirinya membawa teh kotak.', next: 'ch4_good_grad_2' }),
    N({ id: 'ch4_good_grad_2', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Nih, teh kotak buat kamu, Ren. Makasih banyak ya... buat semuanya. Kalau hari itu kamu gak nolongin aku di tangga, mungkin aku udah gak di sekolah ini lagi.', next: 'ch4_good_grad_3' }),
    N({ id: 'ch4_good_grad_3', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Nilai lu tetep paling atas, Ren. Dan kali ini... lu gak ngerayain itu sendirian. Sini, foto bertiga dulu lah!', next: 'ch4_good_grad_4' }),
    N({ id: 'ch4_good_grad_4', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: '(Menerima teh kotak, tersenyum tipis) Boleh. Sini.', next: 'ch4_good_grad_5' }),
    N({
      id: 'ch4_good_grad_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'calm',
      text: 'Masa percobaan pindah gue selesai. Nilai lulus gue sempurna. Sempet ada lebam yang mampir di muka gue, tapi Bimo sama gengnya sekarang tinggal cerita lama yang udah kelar. Niat awal gue ke sini emang cuma ngejar nilai sama selembar ijazah… tapi pas melangkah keluar gerbang ini bareng temen-temen gue, gue bersyukur gue lulus tanpa harus kehilangan hati gue.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
];
