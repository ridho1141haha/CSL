import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// RUTE BAD — montase eksekutor geng + gudang (CHOICE 2: terima)
// ch4_bad_1..3 montase, ch4_bad_4..warehouse (scene gudang), ch4_bad_after.
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const BAD_ROUTE_NODES: DialogueNode[] = [
    N({ id: 'ch4_bad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Minggu-minggu berjalan. Ren bekerja untuk Bimo — dan tugasnya selalu sama: pastikan anak-anak lain patuh.', next: 'ch4_bad_2' }),
    N({ id: 'ch4_bad_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Perlahan, tangan gue mulai dipakai buat hal yang dulu gue hindari. Memalak murid kelas 10 demi mempertahankan posisi. "Nilai lo gue jamin aman seratus persen" — begitu katanya. Dan gue percaya.', effects: [{ k: 'stat', stat: 'violence', delta: 6 }, { k: 'stat', stat: 'focus', delta: -10 }, { k: 'time', minutes: 2600 }], next: 'ch4_bad_3' }),
    N({ id: 'ch4_bad_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Aris kini menatap Ren dengan rasa takut yang sama seperti saat ia melihat Bimo. Teman sebangku yang dulu menawarkan penghapus — sekarang memilih duduk sedikit lebih jauh setiap hari.', next: 'ch4_bad_4' }),
    N({ id: 'ch4_bad_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Malem ini ada urusan di gudang tua. Geng dari luar nyoba masuk wilayah kita. Lo ikut. Bukan permintaan.', effects: [{ k: 'quest', id: 'warehouse_call', state: 'active' }], next: 'ch4_bad_4b' }),
    N({ id: 'ch4_bad_4b', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: '"Ini yang terakhir." Kata yang sama, minggu lalu. Dan minggu sebelumnya.', next: 'ch4_bad_warehouse' }),
    N({ id: 'ch4_bad_warehouse', speaker: 'NARATOR', portrait: 'narrator', text: 'Gudang tua. Bau karat dan asap rokok. Penghuninya tidak datang untuk berbicara.', effects: [{ k: 'scene', id: 'warehouse', spawn: [0, 7] }, { k: 'visit-zone', zone: 'warehouse_in' }], next: '__combat__' }),
    N({ id: 'ch4_bad_after', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Bagus. Enggak nyampe sepuluh menit. Dari sekarang urusan gudang gue serahkan ke lo. Nilai lo aman — gue jaga, lo kerja.', next: 'ch4_bad_after_2' }),
    N({
      id: 'ch4_bad_after_2',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue menang terus. Tapi tiap kali nangkep bayangan gue di kaca jendela kelas, gue makin enggak kenal cowok yang berdiri di sana.',
      effects: [
        { k: 'quest', id: 'warehouse_call', state: 'completed' },
        { k: 'beat', id: 'ch4_bad_grad' },
        { k: 'quest', id: 'graduation_day', state: 'active' },
        { k: 'scene', id: 'campus', spawn: [-23.5, -26] },
        { k: 'notify', text: 'Tujuan: Pulang lewat gerbang utama' },
        { k: 'save' },
      ],
      end: true,
    }),
];
