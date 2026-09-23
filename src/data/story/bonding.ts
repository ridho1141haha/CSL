import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// v0.15.0 — BONDING ARC (dokumen laporan Ch3 + Ch4), disisipkan di hub BAB I
// SEBELUM insiden tangga (doc Ch5 = game BAB II). Dibuka StoryDirector sebagai
// montase otomatis (pattern montase rute: beat-driven, tidak butuh zona):
//   beat ch1_friendship → ch1_lib_*  (doc CH3: perpustakaan, tukar catatan)
//   beat ch1_pts        → ch1_pts_*  (doc CH4: hasil PTS, Pak Budi, nilai 98)
// Rantai beat: ch1_explore → ch1_friendship → ch1_pts → ch1_break (tangga).
// ============================================================================

export const BONDING_NODES: DialogueNode[] = [
    // ============================================================
    // doc CHAPTER 3 — "PERSAHABATAN ARIS": Ikatan Belajar & Ketergantungan
    // Scene 1: Saling Tukar Catatan & Rutinitas (perpustakaan, sore)
    // ============================================================
    N({ id: 'ch1_lib_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Perpustakaan sekolah yang sepi, sore hari. Ren dan Aris duduk berhadapan dengan tumpukan buku di meja. Hubungan mereka makin akrab secara akademis.', next: 'ch1_lib_2' }),
    N({ id: 'ch1_lib_2', speaker: 'ARIS', portrait: 'aris', emotion: 'neutral', text: 'Nih, Ren. Soal latihan Fisika buat minggu depan udah aku buatkan rangkumannya. Rumus cepatnya juga udah aku kasih stabilo.', next: 'ch1_lib_3' }),
    N({ id: 'ch1_lib_3', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: '(Menerima buku rangkuman) Rapi banget tulisan lo, Ris. Makasih ya. Nih, cara cepat ngerjain kalkulus yang kemarin lo tanyain. Cuma butuh tiga langkah.', next: 'ch1_lib_4' }),
    N({ id: 'ch1_lib_4', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Tersenyum gembira, mencatat cepat) Wah... gampang banget kalau dijelasin sama kamu. Jujur ya, Ren... sejak kamu pindah ke sini, aku jadi enggak terlalu takut masuk sekolah.', next: 'ch1_lib_5' }),
    N({ id: 'ch1_lib_5', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Lo pinter, Ris. Cuma kurang berani aja. Jangan biasain nunduk kalau ada orang yang sengaja nyari gara-gara.', next: 'ch1_lib_6' }),
    N({
      id: 'ch1_lib_6',
      speaker: 'ARIS',
      portrait: 'aris',
      emotion: 'worried',
      text: '(Menunduk pelan, menyentuh kacamatanya) Susah, Ren... di sekolah ini, kalau kamu enggak punya backing-an geng, milih berani itu sama aja kayak bunuh diri.',
      effects: [{ k: 'beat', id: 'ch1_pts' }, { k: 'rel', target: 'aris', delta: 2 }, { k: 'time', minutes: 90 }, { k: 'save' }],
      end: true,
    }),
    // ============================================================
    // doc CHAPTER 4 — "UJIAN PERTAMA": Penilaian Tengah Semester (PTS)
    // Scene 1: Pembagian Lembar Hasil Ujian (kelas 11-B, pagi)
    // ============================================================
    N({ id: 'ch1_pts_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelas 11-B, pagi hari. Pak Budi berjalan di antara barisan meja, membagikan lembar hasil Ujian Tengah Semester dengan raut bangga.', next: 'ch1_pts_2' }),
    N({ id: 'ch1_pts_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Anak-anak, hasil PTS minggu lalu sudah bapak rekap. Bapak sangat mengapresiasi murid baru kita, Ren, yang meraih nilai tertinggi sembilan puluh delapan di angkatan ini. Dan Aris juga menunjukkan peningkatan luar biasa di peringkat lima besar.', next: 'ch1_pts_3' }),
    N({ id: 'ch1_pts_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Murid-murid lain berbisik-bisik. Beberapa anak preman di meja depan melirik sinis ke arah meja belakang.', next: 'ch1_pts_4' }),
    N({ id: 'ch1_pts_4', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Menoleh ke Ren dengan mata berbinar) Ren! Kita berhasil! Nilai Fisika dan Matematika aku dapet sembilan puluh!', next: 'ch1_pts_5' }),
    N({
      id: 'ch1_pts_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'calm',
      text: '(Tersenyum tipis, menyimpan kertas ujian) Bagus. Strategi kita berhasil. (Sempurna. Strategi gue jalan seratus persen. Fokus belajar, abaikan geng preman, jaga nilai. Cuma perlu dipertahankan sampai kelulusan.)',
      effects: [
        { k: 'beat', id: 'ch1_break' },
        { k: 'stat', stat: 'academic', delta: 3 },
        { k: 'quest', id: 'aris_incident', state: 'active' },
        { k: 'time', minutes: 120 },
        { k: 'save' },
      ],
      end: true,
    }),
];
