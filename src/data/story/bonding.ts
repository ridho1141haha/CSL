import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BONDING ARC (dokumen laporan Ch3 + Ch4 — versi terbaru)
//   beat ch1_friendship → ch1_lib_*  (doc CH3: perpustakaan, tukar catatan)
//   beat ch1_pts        → ch1_pts_exam → ch1_pts_* (doc CH4: hasil PTS kelas 12-B)
// ============================================================================

export const PTS_EXAM = {
  /** flag penanda PTS sudah dimainkan (storyStore.flags — save-safe) */
  doneFlag: 'pts_quiz_done',
  /** montase hasil kanon yang dibuka setelah quiz (Pak Budi: Ren 98, Aris 90) */
  resume: 'ch1_pts_1',
  /** template toast HUD setelah lembar jawaban diserahkan */
  resultNote: 'PTS selesai — {correct}/{total} benar · Akademik +{academic} · Fokus {focus}',
} as const;

export const BONDING_NODES: DialogueNode[] = [
    // ---- doc CHAPTER 3: PERSAHABATAN ARIS (Perpustakaan, sore) ----
    N({ id: 'ch1_lib_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Perpustakaan sekolah yang sepi, sore hari. Ren dan Aris duduk berhadapan dengan tumpukan buku di meja. Hubungan mereka makin akrab secara akademis.', next: 'ch1_lib_2' }),
    N({ id: 'ch1_lib_2', speaker: 'ARIS', portrait: 'aris', emotion: 'neutral', text: 'Nih, Ren, rangkuman Fisika buat minggu depan. Rumus cepatnya udah aku stabilo sekalian biar gampang dicari.', next: 'ch1_lib_3' }),
    N({ id: 'ch1_lib_3', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: '(Menerima buku rangkuman) Rapi banget catatan lo, Ris. Makasih ya. Oiya nih, trik ngerjain soal kalkulus yang kemarin lo tanyain. Tiga langkah langsung ketemu.', next: 'ch1_lib_4' }),
    N({ id: 'ch1_lib_4', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Tersenyum gembira, mencatat cepat) Wah... asli, jauh lebih masuk akal pas kamu yang jelasin. Jujur ya, Ren... semenjak ada kamu di kelas, aku jadi gak sewas-was dulu tiap berangkat sekolah.', next: 'ch1_lib_5' }),
    N({ id: 'ch1_lib_5', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Lo itu sebenernya pinter, Ris. Kurang nekat dikit aja. Jangan dikit-dikit nunduk kalau lagi diisengin orang.', next: 'ch1_lib_6' }),
    N({
      id: 'ch1_lib_6',
      speaker: 'ARIS',
      portrait: 'aris',
      emotion: 'worried',
      text: '(Menunduk pelan, menyentuh kacamatanya) Susah, Ren... di Yuson, kalau gak punya bekingan geng, nekat ngelawan itu sama aja nyari mati.',
      effects: [{ k: 'beat', id: 'ch1_pts' }, { k: 'rel', target: 'aris', delta: 2 }, { k: 'time', minutes: 90 }, { k: 'save' }],
      end: true,
    }),
    // ---- doc CHAPTER 4: UJIAN PERTAMA (PTS — Ruang Kelas 12-B, pagi) ----
    N({ id: 'ch1_pts_exam', speaker: 'NARATOR', portrait: 'narrator', text: 'Hari Penilaian Tengah Semester. Suara kipas angin di plafon kelas 12-B terdengar jelas di antara derit bangku. Lembar soal berpindah dari tangan ke tangan, dan Ren menarik napas pelan — punggung Aris di sebelahnya tegak, pensil sudah di tangan.', next: '__exam__' }),
    N({ id: 'ch1_pts_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ruang Kelas 12-B, pagi hari. Pak Budi membagikan kertas hasil Ujian Tengah Semester dengan raut bangga menatap ke arah meja belakang.', next: 'ch1_pts_2' }),
    N({ id: 'ch1_pts_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Anak-anak, nilai PTS minggu lalu sudah keluar. Bapak salut sama murid baru kita, Ren, nilainya tembus sembilan puluh delapan — tertinggi di angkatan. Aris juga naik pesat sekarang, masuk lima besar.', next: 'ch1_pts_3' }),
    N({ id: 'ch1_pts_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Murid-murid lain berbisik-bisik. Beberapa anak preman di meja depan melirik sinis.', next: 'ch1_pts_4' }),
    N({ id: 'ch1_pts_4', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Menoleh ke Ren dengan mata berbinar) Ren! Lihat deh! Fisika sama Matematikaku tembus sembilan puluh!', next: 'ch1_pts_5' }),
    N({
      id: 'ch1_pts_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'calm',
      text: '(Tersenyum tipis, menyimpan kertas ujiannya) Mantap, Ris. Gak sia-sia kita lembur di perpus. (Aman. Rencana gue jalan mulus. Fokus belajar, cuekin geng preman, jaga nilai. Tinggal pertahanin kayak gini sampe lulus.)',
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
