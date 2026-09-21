import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// RUTE NETRAL — montase "Dinding Dingin" (kelas → perpustakaan → koridor → surat Aris)
// n1_ kelas → n2_ perpustakaan → n3_ koridor → n4_ surat pengunduran diri.
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const NEUTRAL_NODES: DialogueNode[] = [
    // ============================================================
    // BAB 3-4 — RUTE NETRAL (GARIS MERAH): "DINDING DINGIN & KEHENINGAN
    // KELAS" → NEUTRAL ENDING "LULUS TANPA NAMA". Montase sinematik empat
    // scene; dibuka StoryDirector saat beat ch3_neutral.
    // ============================================================
    // ---- Scene 1: Bangku Kosong & Kacamata Retak (kelas, dua hari kemudian) ----
    N({ id: 'n1_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelas 11-B, dua hari setelah kejadian di lorong. Bangku Aris kosong. Ren mencatat materi seperti biasa — sendirian.', next: 'n1_2' }),
    N({ id: 'n1_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Hari ketiga, Aris akhirnya datang. Duduknya makin membungkuk. Ada sudut kacamata yang ditempel isolasi bening, dan lebam biru di bawah mata kirinya.', next: 'n1_3' }),
    N({ id: 'n1_3', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: '(Menoleh pelan) Aris... muka lo kenapa?', next: 'n1_4' }),
    N({ id: 'n1_4', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Kaget pelan, langsung membuang muka) A-ah... bukan apa-apa, Ren. Cuma... jatuh di tangga beberapa hari lalu.', next: 'n1_5' }),
    N({ id: 'n1_5', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Soal anak-anak geng waktu itu... gue—', next: 'n1_6' }),
    N({ id: 'n1_6', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Memotong cepat dengan suara gemetar tapi dingin) Lupakan aja. Lagipula... itu bukan urusan lo, kan? Aku mau fokus dengerin Pak Budi aja.', next: 'n1_7' }),
    N({ id: 'n1_7', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Kata-katanya sederhana, tapi nempel banget di dada. Dia tahu gue ada di sana hari itu. Dia tahu gue milih jalan pergi.)', next: 'n2_1' }),
    // ---- Scene 2: Konfrontasi Siti (perpustakaan, sore) ----
    N({ id: 'n2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Perpustakaan sekolah yang sepi, sore hari. Ren sedang mengembalikan buku pelajaran. Siti berdiri dekat rak — sengaja menunggu Ren selesai.', next: 'n2_2' }),
    N({ id: 'n2_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Kemarin... lu lewat tangga belakang kantin, kan? Aris dihajar sampai catatannya dibakar.', next: 'n2_3' }),
    N({ id: 'n2_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: '(Tetap menata buku di rak) Gue cuma lewat, mau ke perpustakaan.', next: 'n2_4' }),
    N({ id: 'n2_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Jangan pura-pura. Lu lihat mereka nyeret Aris, tapi lu cuma jalan terus. Dia enggak berani melapor ke OSIS atau guru karena diancam.', next: 'n2_5' }),
    N({ id: 'n2_5', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Lalu? Kenapa lu ngomong ini ke gue?', next: 'n2_6' }),
    N({ id: 'n2_6', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: '(Menatap lurus mata Ren) Karena lu satu-satunya yang ada di sana. Dan satu-satunya yang bisa milih.', next: 'n2_7' }),
    N({ id: 'n2_7', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Siti, gue ke sini cuma buat belajar dan lulus. Gue enggak punya kewajiban buat urusin masalah orang lain.', next: 'n2_8' }),
    N({ id: 'n2_8', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Tersenyum sinis, mengangguk pelan) Pintar. Lu emang pintar jaga diri. Nilai lu aman, seragam lu bersih tanpa noda. Tapi jujur... cara hidup lu dingin banget.', next: 'n3_1' }),
    // ---- Scene 3: Pengabaian Bimo (koridor utama, seminggu kemudian) ----
    N({ id: 'n3_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Koridor utama sekolah, seminggu kemudian. Ren berpapasan dengan Bimo dan rombongannya. Salah satu anak buahnya berbisik sambil melirik.', next: 'n3_2' }),
    N({ id: 'n3_2', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Boss, itu anak baru yang sekelas sama Aris. Yang nilainya paling tinggi.', next: 'n3_3' }),
    N({ id: 'n3_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Melirik Ren sekilas tanpa menghentikan langkah) Terus kenapa? Dia bikin ulah?', next: 'n3_4' }),
    N({ id: 'n3_4', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'neutral', text: 'Kagak sih... tiap kita ngacak-ngacak Aris, dia cuma diem aja nunduk.', next: 'n3_5' }),
    N({ id: 'n3_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Kekeh pelan) Ya udah, ngapain diurusin. Cuma penakut lain yang kebetulan pinter. Gak usah buang waktu.', next: 'n3_6' }),
    N({ id: 'n3_6', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Rencana gue berhasil. Buat Bimo, gue cuma angin lalu. Gue gak terseret perkelahian apa pun. Tapi kenapa rasanya makin sesak?)', next: 'n4_1' }),
    // ---- Scene 4: Surat Pengunduran Diri Aris (kelas, pertengahan semester) ----
    N({ id: 'n4_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelas 11-B, pertengahan semester. Bangku di sebelah Ren kosong selama seminggu penuh. Pak Budi melangkah masuk dengan raut wajah muram.', next: 'n4_2' }),
    N({ id: 'n4_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Anak-anak, sekadar informasi. Teman kalian, Aris, resmi mengajukan surat pengunduran diri dari SMA Yuson mulai hari ini — karena alasan kesehatan dan keluarga.', next: 'n4_3' }),
    N({ id: 'n4_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Suasana kelas tetap dingin. Beberapa murid preman malah terkekeh pelan. Ren menatap bangku kosong di sebelahnya.', next: 'n4_4' }),
    N({
      id: 'n4_4',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: '(Aris menyerah. Dia pergi. Dan gue... berhasil mempertahankan nilai gue tanpa tergores sedikit pun.)',
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
