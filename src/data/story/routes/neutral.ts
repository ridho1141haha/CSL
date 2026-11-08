import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// RUTE NETRAL — montase "Dinding Dingin" (v0.15.0 mengikuti urutan laporan):
//   n1_ kelas (bangku kosong & kacamata retak)      = doc CH6 scene 1
//   n2_ perpustakaan (konfrontasi Siti + FLAVOR CHOICE 3) = doc CH6 scene 2
//   n3_ kelas (surat pengunduran diri Aris)         = doc CH6 scene 3
//   n4_ koridor (pengabaian Bimo)                   = doc CH7
//   n5_ kelas (bulan-bulan sunyi + tryout lancar)   = doc CH8 + CH9
// → beat ch4_neutral_grad (kelulusan = doc CH10, file ending).
// ============================================================================

export const NEUTRAL_NODES: DialogueNode[] = [
    // ============================================================
    // BAB 3-4 — RUTE NETRAL (GARIS MERAH): "DINDING DINGIN & KEHENINGAN
    // KELAS" → NEUTRAL ENDING "LULUS TANPA NAMA" (+ SECRET BRANCH v0.15.0).
    // Montase sinematik; dibuka StoryDirector saat beat ch3_neutral.
    // ============================================================
    // ---- Scene 1: Bangku Kosong & Kacamata Retak (kelas, dua hari kemudian) ----
    N({ id: 'n1_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelas 11-B, dua hari setelah kejadian di lorong. Bangku Aris kosong. Ren mencatat materi seperti biasa — sendirian.', next: 'n1_2' }),
    N({ id: 'n1_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Hari ketiga, Aris akhirnya datang. Duduknya makin membungkuk. Ada sudut kacamata yang ditempel isolasi bening, dan lebam biru di bawah mata kirinya.', next: 'n1_3' }),
    N({ id: 'n1_3', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: '(Menoleh pelan) Aris... muka lo kenapa?', next: 'n1_4' }),
    N({ id: 'n1_4', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Kaget pelan, langsung membuang muka) A-ah... bukan apa-apa, Ren. Cuma... jatuh di tangga beberapa hari lalu.', next: 'n1_5' }),
    N({ id: 'n1_5', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Soal anak-anak geng waktu itu... gue—', next: 'n1_6' }),
    N({ id: 'n1_6', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Memotong cepat dengan suara gemetar tapi dingin) Lupakan aja. Lagipula... itu bukan urusan lo, kan? Aku mau fokus dengerin Pak Budi aja.', next: 'n1_7' }),
    N({ id: 'n1_7', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Kata-katanya sederhana, tapi nempel banget di dada. Dia tahu gue ada di sana hari itu. Dia tahu gue milih jalan pergi.)', next: 'n2_1' }),
    // ---- Scene 2: Konfrontasi Siti (perpustakaan, sore) + FLAVOR CHOICE 3 ----
    N({ id: 'n2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Perpustakaan sekolah, sore hari. Siti berdiri menahan langkah Ren di dekat rak buku.', next: 'n2_2' }),
    N({ id: 'n2_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Kemarin... lu lewat tangga belakang kantin, kan? Aris dihajar sampai catatannya dibakar.', next: 'n2_3' }),
    N({ id: 'n2_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: '(Tetap menata buku di rak) Gue cuma lewat, mau ke perpustakaan.', next: 'n2_4' }),
    N({ id: 'n2_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Jangan pura-pura. Lu lihat mereka nyeret Aris, tapi lu cuma jalan terus. Dia enggak berani melapor ke OSIS atau guru karena diancam.', next: 'n2_5' }),
    N({ id: 'n2_5', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Lalu? Kenapa lu ngomong ini ke gue?', next: 'n2_6' }),
    N({ id: 'n2_6', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: '(Menatap lurus mata Ren) Karena lu satu-satunya yang ada di sana. Dan satu-satunya yang bisa milih.', next: 'n2_c3' }),
    // v0.15.0 — FLAVOR CHOICE 3 (doc: "Pembelaan Diri Ren", rute neutral)
    N({
      id: 'n2_c3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'neutral',
      text: '(Rak buku di antara mereka terasa seperti tembok)',
      choices: [
        {
          id: 'defend_principle',
          text: '[A] Bertahan pada prinsip.',
          next: 'n2_7',
        },
        {
          id: 'defend_realistis',
          text: '[B] Alasan realistis.',
          next: 'n2_7b',
        },
      ],
    }),
    N({ id: 'n2_7', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Gue ke sini cuma buat belajar dan lulus. Gue enggak punya kewajiban buat urusin masalah orang lain.', next: 'n2_8' }),
    N({ id: 'n2_8', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Tersenyum sinis) Pintar. Lu emang pintar jaga diri. Nilai lu aman, seragam lu bersih tanpa noda. Tapi jujur... cara hidup lu dingin banget.', next: 'n3_1' }),
    N({ id: 'n2_7b', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Gue sendirian. Mau lawan mereka juga cuma bikin gue kena sanksi sekolah.', next: 'n2_8b' }),
    N({ id: 'n2_8b', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Mengangguk pelan, tatapannya menyindir) Alasan yang logis. Lu emang pinter nyari pembenaran buat menyelamatkan diri sendiri. Tapi ujung-ujungnya sama aja... lu milih lepas tangan.', next: 'n3_1' }),
    // ---- Scene 3: Surat Pengunduran Diri Aris (kelas) — doc CH6 scene 3 ----
    N({ id: 'n3_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelas 11-B. Bangku di sebelah Ren kosong selama seminggu penuh. Pak Budi melangkah masuk dengan raut wajah muram.', next: 'n3_2' }),
    N({ id: 'n3_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Anak-anak, sekadar informasi. Teman kalian, Aris, resmi mengajukan surat pengunduran diri dari SMA Yuson mulai hari ini — karena alasan kesehatan dan keluarga.', next: 'n3_3' }),
    N({ id: 'n3_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Suasana kelas tetap dingin. Beberapa murid preman malah terkekeh pelan. Ren menatap bangku kosong di sebelahnya.', next: 'n3_4' }),
    N({ id: 'n3_4', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: '(Aris menyerah. Dia pergi. Dan gue... berhasil mempertahankan nilai gue tanpa tergores sedikit pun.)', next: 'n4_1' }),
    // ---- Scene 4: Pengabaian Bimo (koridor utama) — doc CH7 ----
    N({ id: 'n4_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Koridor utama sekolah. Ren melintas di dekat tempat Bimo dan pengikutnya nongkrong. Salah satu anak buahnya berbisik sambil melirik.', next: 'n4_2' }),
    N({ id: 'n4_2', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Boss, itu anak baru yang sekelas sama Aris. Yang nilainya paling tinggi.', next: 'n4_3' }),
    N({ id: 'n4_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Melirik Ren sekilas) Kenapa? Dia bikin ulah?', next: 'n4_4' }),
    N({ id: 'n4_4', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'neutral', text: 'Kagak, tiap kita acak-acak Aris, dia cuma diam aja menunduk.', next: 'n4_5' }),
    N({ id: 'n4_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Kekeh pelan) Ya udah, ngapain diurus. Cuma penakut lain yang kebetulan pinter. Enggak usah buang waktu.', next: 'n4_6' }),
    N({ id: 'n4_6', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Rencana gue berhasil. Buat Bimo, gue cuma angin lalu. Gue gak terseret perkelahian apa pun. Tapi kenapa rasanya makin sesak?)', next: 'n5_1' }),
    // ---- Scene 5: Bulan-Bulan Sunyi (kelas & ujian) — doc CH8 + CH9 ----
    N({ id: 'n5_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Bulan-bulan berlalu. Ren terus belajar sendirian tanpa Aris. Nilai ujiannya tetap sempurna — tapi tidak ada murid lain yang mau duduk di dekatnya. Ruang kelas terasa hening dan asing.', next: 'n5_2' }),
    N({
      id: 'n5_2',
      speaker: 'NARATOR',
      portrait: 'narrator',
      text: 'Tryout dan Ujian Sekolah berlalu tanpa hambatan. Karena mengabaikan semua masalah sosial sekolah, Ren sama sekali tidak tersentuh oleh teror geng Bimo. Papan pengumuman kelulusan tinggal menunggu.',
      effects: [
        { k: 'chapter', id: 4 },
        { k: 'beat', id: 'ch4_neutral_grad' },
        { k: 'quest', id: 'graduation_day', state: 'active' },
        { k: 'time', minutes: 2880 },
        { k: 'notify', text: 'Tujuan: Pulang lewat gerbang utama untuk terakhir kali' },
        { k: 'save' },
      ],
      end: true,
    }),
];
