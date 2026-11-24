import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// RUTE BAD — doc Sub-Cabang 2A: Tangan Kanan Baru & Pewaris Tahta Yuson
// ============================================================================

export const BAD_ROUTE_NODES: DialogueNode[] = [
    N({ id: 'ch4_bad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Koridor Kelas 10 & Belakang Kantin. Ren memilih jalan aman demi nilainya — menerima tawaran Bimo dan menjadi eksekutor geng baru.', next: 'ch4_bad_2' }),
    N({ id: 'ch4_bad_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Mantap, Ren. Kasih paham, besok-besok kalau setoran telat lagi, lo langsung yang turun tangan. — Ren (wajah datar, melepaskan kerah adik kelas): "Lo denger, kan? Besok jangan bikin gue capek nyariin lo lagi."', effects: [{ k: 'stat', stat: 'violence', delta: 6 }, { k: 'stat', stat: 'focus', delta: -10 }, { k: 'time', minutes: 2600 }], next: 'ch4_bad_3' }),
    N({ id: 'ch4_bad_3', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Berdiri terpaku dari kejauhan, menatap Ren dengan rasa takut yang sama seperti saat ia melihat Bimo) R-Ren...? Kamu ngapain...? — Ren (memalingkan wajah dingin): "Lewat aja sana, Ris. Gak usah ngeliatin gue."', next: 'ch4_bad_4' }),
    N({ id: 'ch4_bad_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Malem ini ada urusan di gudang tua. Geng dari luar nyoba masuk wilayah kita. Lo ikut. Bukan permintaan.', effects: [{ k: 'quest', id: 'warehouse_call', state: 'active' }], next: 'ch4_bad_4b' }),
    N({ id: 'ch4_bad_4b', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: '"Ini yang terakhir." Kata yang sama, minggu lalu. Dan minggu sebelumnya.', next: 'ch4_bad_warehouse' }),
    N({ id: 'ch4_bad_warehouse', speaker: 'NARATOR', portrait: 'narrator', text: 'Gudang tua. Bau karat dan asap rokok. Penghuninya tidak datang untuk berbicara.', effects: [{ k: 'scene', id: 'warehouse', spawn: [0, 7] }, { k: 'visit-zone', zone: 'warehouse_in' }], next: '__combat__' }),
    N({ id: 'ch4_bad_after', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Bagus. Enggak nyampe sepuluh menit. Dari sekarang urusan gudang gue serahkan ke lo. Nilai lo aman — gue jaga, lo kerja.', next: 'ch4_bad_after_2' }),
    N({
      id: 'ch4_bad_after_2',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue gak pernah kalah berantem. Tapi pas ngelihat bayangan gue di kaca jendela kelas, gue makin gak kenal siapa cowok yang berdiri di sana.',
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
