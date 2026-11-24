import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// RUTE NETRAL — doc Chapter 6–9 (versi terbaru)
// ============================================================================

export const NEUTRAL_NODES: DialogueNode[] = [
    // ---- Chapter 6 Scene 1: Bangku Kosong & Kacamata Retak ----
    N({ id: 'n1_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ruang kelas 12-B, dua hari setelah kejadian di lorong tangga. Aris tidak masuk sekolah selama dua hari.', next: 'n1_2' }),
    N({ id: 'n1_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Di hari ketiga, Aris datang dengan sudut kacamata yang ditempel isolasi bening dan luka lebam di bawah mata kirinya. Sikapnya berubah menjadi sangat tertutup.', next: 'n1_3' }),
    N({ id: 'n1_3', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: '(Menoleh pelan) Ris… ujung mata lo kenapa?', next: 'n1_4' }),
    N({ id: 'n1_4', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Kaget pelan, langsung membuang muka) Gak kenapa-kenapa. Cuma... kepeleset di tangga waktu itu.', next: 'n1_5' }),
    N({ id: 'n1_5', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Soal anak-anak Bimo di tangga waktu itu… gue—', next: 'n1_6' }),
    N({ id: 'n1_6', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Memotong cepat dengan suara gemetar tapi dingin) Udahlah, gak usah dibahas. Lagian bukan urusan kamu juga, kan? Aku mau dengerin Pak Budi dulu.', next: 'n1_7' }),
    N({ id: 'n1_7', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Kalimatnya singkat, tapi nusuk banget. Dia tahu gue ada di situ hari itu. Dia tahu gue milih buang muka.)', next: 'n2_1' }),
    // ---- Chapter 6 Scene 2: Konfrontasi Siti di Perpustakaan + FLAVOR CHOICE 3 ----
    N({ id: 'n2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Perpustakaan sekolah, sore hari. Siti berdiri menahan langkah Ren di dekat rak buku.', next: 'n2_2' }),
    N({ id: 'n2_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Waktu Aris diseret ke belakang kantin beberapa hari lalu… lu ada di situ, kan? Dia dipukulin abis-abisan, buku catatannya sampe dibakar.', next: 'n2_3' }),
    N({ id: 'n2_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: '(Tetap menata buku di rak) Gue cuma lewat, mau ke perpustakaan.', next: 'n2_4' }),
    N({ id: 'n2_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Jangan pura-pura. Lu lihat mereka nyeret Aris, tapi lu cuma jalan terus. Dia enggak berani melapor ke OSIS atau guru karena diancam.', next: 'n2_5' }),
    N({ id: 'n2_5', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Lalu? Kenapa lu ngomong ini ke gue?', next: 'n2_6' }),
    N({ id: 'n2_6', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: '(Menatap lurus mata Ren) Karena lu satu-satunya yang ada di sana. Dan satu-satunya yang bisa milih.', next: 'n2_c3' }),
    // FLAVOR CHOICE 3: Pembelaan Diri Ren
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
    N({ id: 'n2_7', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Target gue di sini cuma belajar sampe lulus. Gue gak punya kewajiban beresin masalah orang lain.', next: 'n2_8' }),
    N({ id: 'n2_8', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Tersenyum sinis) Pinter. Pinter banget lu cari aman. Nilai lu mulus, seragam lu bersih. Tapi asli, Ren… lu tega banget jadi orang.', next: 'n3_1' }),
    N({ id: 'n2_7b', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Mereka ramean, Siti. Kalau gue nekat maju, yang ada gue ikut kena skors dan rencana gue lulus tenang di sini ikut hancur.', next: 'n2_8b' }),
    N({ id: 'n2_8b', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Mengangguk pelan, tatapannya menyindir) Masuk akal sih. Lu emang jago nyari alasan biar keliatan gak salah. Tapi intinya tetep sama aja... lu ninggalin temen lu sendiri.', next: 'n3_1' }),
    // ---- Chapter 6 Scene 3: Surat Pengunduran Diri Aris ----
    N({ id: 'n3_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ruang kelas 12-B. Bangku di sebelah Ren mendadak kosong selama seminggu penuh. Pak Budi melangkah masuk dengan raut muram.', next: 'n3_2' }),
    N({ id: 'n3_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Anak-anak, Bapak mau menyampaikan kabar. Mulai hari ini, teman kalian, Aris, resmi mengundurkan diri dan pindah dari SMA Yuson karena alasan kesehatan.', next: 'n3_3' }),
    N({ id: 'n3_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren menatap bangku kosong di sebelahnya dalam diam.', next: 'n3_4' }),
    N({ id: 'n3_4', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: '(Aris cabut. Dan gue... berhasil ngejaga nilai gue tetep aman tanpa lecet sedikit pun.)', next: 'n4_1' }),
    // ---- Chapter 7 (Neutral): Pengabaian Bimo ----
    N({ id: 'n4_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Koridor utama sekolah. Ren melintas di dekat tempat Bimo dan pengikutnya nongkrong.', next: 'n4_2' }),
    N({ id: 'n4_2', speaker: 'ANAK GENG A', portrait: 'gang', emotion: 'tense', text: 'Bos, itu anak baru yang nilainya paling tinggi sekelas sama si Aris.', next: 'n4_3' }),
    N({ id: 'n4_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Melirik Ren sekilas) Kenapa emang? Dia nyari ribut?', next: 'n4_4' }),
    N({ id: 'n4_4', speaker: 'ANAK GENG A', portrait: 'gang', emotion: 'neutral', text: 'Kagak, pas kita ngacak-acak Aris kemarin aja dia cuma diem nunduk terus ngeloyor pergi.', next: 'n4_5' }),
    N({ id: 'n4_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Kekeh pelan) Oh, ya udah biarin aja. Paling cuma kutu buku penakut kayak biasanya. Gak usah buang-buang tenaga.', next: 'n4_6' }),
    N({ id: 'n4_6', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Kelas ini makin berisik, tapi rasanya makin sepi buat gue. Gak masalah. Makin dikit temen, makin dikit beban.)', next: 'n5_1' }),
    // ---- Chapter 8 & 9 (Neutral): Keterasingan Akademis & Persaingan Ujian Akhir ----
    N({ id: 'n5_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Bulan-bulan berlalu di kelas 12-B. Ren terus belajar sendirian tanpa Aris. Saat praktikum Fisika, semua murid menghindarinya — "Saya kerjain sendiri aja, Pak. Udah biasa."', next: 'n5_2' }),
    N({
      id: 'n5_2',
      speaker: 'NARATOR',
      portrait: 'narrator',
      text: 'Tryout dan Ujian Sekolah berjalan lancar tanpa gangguan geng Bimo. Di papan peringkat, nama Ren sendirian di puncak tanpa nama Aris di bawahnya. "Gue cuma ngerjain bagian gue, Siti." — "Iya. Dan lu ngerjain bagian lu tanpa peduli sekitar."',
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
