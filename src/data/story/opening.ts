import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAB 1 — Prolog & Chapter 1–2 (opening sinematik FP, GARIS MERAH — versi terbaru)
// Scene 1 gerbang (map merah) → kelas 12-B (Aris) → lorong (Siti) → kantin (Bimo).
// Graph integrity dijaga test/dialogue.test.ts + test/storyStructure.test.ts.
// ============================================================================

export const OPENING_NODES: DialogueNode[] = [
    // ---- PROLOG: KEDATANGAN DI YUSON — Scene 1: Gerbang Utama & Map Merah ----
    N({ id: 'o1_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gerbang utama SMA Yuson, pagi hari. Pagar besi karatan berderit ditiup angin, bau cat semprot mural geng mengelupas di sepanjang tembok luar.', next: 'o1_2' }),
    N({ id: 'o1_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Seragam putih-abu-abu Ren masih bersih, berbanding terbalik dengan kondisi bangunan sekolah di hadapannya yang kusam. Di sekelilingnya, murid-murid lain berjalan terburu-buru sambil menundukkan kepala.', next: 'o1_3' }),
    N({ id: 'o1_3', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Di genggaman tangan gue, map merah berisi berkas pindahan dan lembar nilai akademis gue. Bekas luka tipis di buku-buku jari udah memudar — sisa dari insiden perkelahian di sekolah lama yang bikin gue terpaksa pindah di tahun terakhir.', next: 'o1_4' }),
    N({ id: 'o1_4', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'SMA Yuson. Kesempatan terakhir gue abis ditendang dari sekolah lama gara-gara ribut waktu itu.', next: 'o1_5' }),
    N({ id: 'o1_5', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Cuma perlu tahan satu tahun di kelas dua belas ini. Jaga emosi, pastiin nilai di atas delapan puluh, jangan ikut campur urusan orang, ambil ijazah, terus cabut.', next: 'o1_6' }),
    N({ id: 'o1_6', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Cukup lihat. Jangan ikut campur.', next: 'o2_1' }),
    // ---- CHAPTER 1: ADAPTASI SEKOLAH — Scene 1: Meja Baris Belakang & Perkenalan Aris ----
    N({ id: 'o2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ruang kelas 12-B, siang hari. Kipas angin gantung berderit pelan memutar udara panas. Ren duduk di sudut belakang dekat jendela.', next: 'o2_2' }),
    N({ id: 'o2_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Teman sebangkunya, Aris, duduk membungkuk sambil menulis rapi di buku catatan tebal.', next: 'o2_3' }),
    N({ id: 'o2_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Dua murid berbadan besar melintas dan sengaja menyenggol kursi Aris hingga tempat pensilnya jatuh berserakan. Aris buru-buru memungutnya tanpa bersuara.', next: 'o2_3b' }),
    N({ id: 'o2_3b', speaker: 'BULLY', portrait: 'gang', emotion: 'tense', text: 'Duh, sorry nggak sengaja. Lemes banget sih lu, Aris! Sok rajin amat belajar mulu, emang bakal nembus PTN? — "Wkwk, tahu tuh, kurang-kurangin jadi beban kelas, Ris!"', next: 'o2_4' }),
    N({ id: 'o2_4', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Ren melihat kejadian itu, tetapi memilih terus mencatat materi guru di papan tulis.', next: 'o2_5' }),
    // FLAVOR CHOICE 1: Perkenalan dengan Aris
    N({ id: 'o2_5', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Menunduk dalam, mengumpulkan alat tulisnya terburu-buru, lalu berbisik ragu menyodorkan penghapus) M-maaf… Nih... pake aja dulu. Eh, kamu anak pindahan yang baru masuk kelas 12 ini, ya?', next: 'o2_c1' }),
    N({
      id: 'o2_c1',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'neutral',
      text: '(Menerima penghapus itu)',
      choices: [
        {
          id: 'intro_brief',
          text: '[A] Singkat & praktis.',
          next: 'o2_6a',
          effects: [{ k: 'rel', target: 'aris', delta: 1 }],
        },
        {
          id: 'intro_friendly',
          text: '[B] Agak ramah.',
          next: 'o2_6b',
          effects: [{ k: 'rel', target: 'aris', delta: 2 }],
        },
      ],
    }),
    N({ id: 'o2_6a', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Sip, makasih. Gue Ren.', next: 'o2_7a' }),
    N({ id: 'o2_7a', speaker: 'ARIS', portrait: 'aris', emotion: 'neutral', text: '(Mengangguk canggung sambil merapikan bukunya) A-aku Aris. Santai aja, Ren. Kalau catatan Pak Budi ada yang kelewat, pinjem punyaku aja nanti.', next: 'o2_8' }),
    N({ id: 'o2_6b', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Makasih banyak. Pas banget, gue sering ketinggalan nyatet tadi. Gue Ren.', next: 'o2_7b' }),
    N({ id: 'o2_7b', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Tersenyum tipis, suaranya agak pelan) Sama-sama, Ren. Aku Aris. Gak usah sungkan kalau mau nyalin catatan Pak Budi, punya aku lengkap kok.', next: 'o2_8' }),
    N({ id: 'o2_8', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Satu bangku di sudut, satu teman sebangku yang takut sama sekolahnya sendiri. Tahun ini gue cuma butuh dua hal itu.', next: 'o3_1' }),
    // ---- CHAPTER 2: KEHIDUPAN SEKOLAH — Scene 1: Peringatan Pertama di Lorong ----
    N({ id: 'o3_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Lorong menuju kantin, waktu istirahat. Di lorong, Siti (Ketua OSIS) sedang mencatat nama-nama murid yang membolos. Saat Ren melintas, Siti memanggilnya.', next: 'o3_2' }),
    N({ id: 'o3_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: '(Menurunkan papan jalannya, menatap Ren lekat) Eh, lu murid pindahan kelas 12 yang masuk lewat jalur nilai prestasi itu, kan? Ren?', next: 'o3_3' }),
    N({ id: 'o3_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Iya.', next: 'o3_4' }),
    N({ id: 'o3_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Gue sempet denger desas-desus kenapa lu pindah dari sekolah lama lu. Saran aja buat lu di sini: kalau udah bubaran, mending langsung buruan pulang. Jangan pernah nongkrong di gang belakang kantin, terus kalau pas liat ada yang rusuh di halaman... langsung aja buang muka dan menghindar. Sekolah kita ini modelannya nggak bakal repot-repot belain anak baru kayak lu.', next: 'o3_c2' }),
    // FLAVOR CHOICE 2: Respons Atas Peringatan Siti
    N({
      id: 'o3_c2',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'neutral',
      text: '(Siti menatap Ren menunggu jawaban)',
      choices: [
        {
          id: 'warn_indifferent',
          text: '[A] Acuh tak acuh.',
          next: 'o3_6a',
        },
        {
          id: 'warn_curious',
          text: '[B] Penasaran dengan kondisi sekolah.',
          next: 'o3_6b',
          effects: [{ k: 'rel', target: 'siti', delta: 1 }],
        },
      ],
    }),
    N({ id: 'o3_6a', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Santai, dari awal juga gue males banget cari masalah.', next: 'o3_7a' }),
    N({ id: 'o3_7a', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: '(Mengangguk singkat) Bagus kalau lu paham. Tapi masalahnya di Yuson, kadang bukan lu yang sengaja nyari gara-gara... tapi gara-gara-nya sendiri yang demen nempel ke lu.', next: 'o4_1' }),
    N({ id: 'o3_6b', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Emang se-parah itu ya aturan main di sini? Emangnya OSIS ngga bisa gerak?', next: 'o3_7b' }),
    N({ id: 'o3_7b', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: '(Mengembuskan napas pelan, melirik ke ujung lorong) Parah banget. Kalau gampang ditertibin, gue nggak bakal repot-repot nyegat lu di sini. Makanya gue ingatin, jangan sok pahlawan. Di sini, gara-gara itu yang suka nempel sendiri ke anak-anak kayak lu.', next: 'o4_1' }),
    // ---- Scene 2: Bisik-Bisik & Pengenalan Bimo ----
    N({ id: 'o4_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kantin sekolah, sore hari menjelang jam pulang. Ren duduk sendirian di meja sudut kantin sambil membaca catatannya.', next: 'o4_2' }),
    N({ id: 'o4_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Di meja sebelah, dua murid kelas 10 berbisik-bisik cemas.', next: 'o4_3' }),
    N({ id: 'o4_3', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Eh, lu udah denger info belom? Geng anak SMA 67 kemarin sok ngabsen masuk ke parkiran belakang kita.', next: 'o4_4' }),
    N({ id: 'o4_4', speaker: 'MURID B', portrait: 'generic', emotion: 'worried', text: 'Wah, gila. Terus diapain? Ditegur guru piket?', next: 'o4_5' }),
    N({ id: 'o4_5', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Dih, mana mempan guru piket. Si Bimo sendiri yang langsung turun gunung bareng dua anak buahnya. Sumpah, nggak sampe lima menit, anak-anak SMA 67 langsung kocar-kacir ngibrit.', next: 'o4_6' }),
    N({ id: 'o4_6', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Katanya kapten mereka ampe bonyok nggak bisa ikut latihan seminggu.', next: 'o4_7' }),
    N({ id: 'o4_7', speaker: 'MURID B', portrait: 'generic', emotion: 'worried', text: '(Menelan ludah) Seriusan...? Padahal si Bimo kan chill banget, jarang banget keliatan rusuh terang-terangan.', next: 'o4_8' }),
    N({ id: 'o4_8', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Makanya itu. Dia mah nggak usah capek-capek ngegas atau sok jagoan teriak-teriak. Cukup sekali dia ngelirik atau nunjuk orang, antek-anteknya langsung auto-gerak beresin.', next: 'o4_9' }),
    N({ id: 'o4_9', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Pokoknya, ogah banget deh nyari gara-gara sama Bimo, bisa-bisa nama lu ilang permanen dari absensi.', next: 'o4_10' }),
    N({ id: 'o4_10', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Bimo... Oh, jadi cowok itu yang bikin satu sekolah pada ciut, jalan doang pada nunduk. Penguasa tongkrongan rupanya.)', next: 'o4_11' }),
    N({ id: 'o4_11', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Mending gue 3M aja deh — mager, menjauh, minggir dari awal. Jangan sampe nama gue keseret masuk radar mereka.)', next: 'o4_12' }),
    N({ id: 'o4_12', speaker: 'NARATOR', portrait: 'narrator', text: 'Gelombang keheningan mendadak menyebar dari arah pintu kantin. Kedua murid kelas 10 tadi mendadak bungkam dan menunduk dalam-dalam.', next: 'o4_13' }),
    N({ id: 'o4_13', speaker: 'NARATOR', portrait: 'narrator', text: 'Bimo melangkah masuk diikuti tiga pengikut utamanya. Santai, tanpa ekspresi, tangan di saku celana.', next: 'o4_14' }),
    N({ id: 'o4_14', speaker: 'NARATOR', portrait: 'narrator', text: 'Saat melintas di depan meja Ren, Bimo sempat menoleh dan menatap postur bahu serta buku jari Ren — lebih lama dari yang biasa.', next: 'o5_1' }),
    // ---- Penutup opening: transisi ke gameplay (Hub Area) ----
    N({ id: 'o5_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '…Sial, kayaknya dia mulai ngeh sama gue. Bawa santai aja, Ren. Fokus nilai, gak usah cari penyakit.', effects: [{ k: 'flag', id: 'opening_complete' }], end: true }),
];
