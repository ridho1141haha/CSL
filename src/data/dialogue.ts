import type { DialogueNode } from '../types';

// Story spine. Canon per master directive §22–31.
// Node graph integrity is verified by a test (test/dialogue.test.ts).

const N = (n: DialogueNode) => n;

export const DIALOGUE: Record<string, DialogueNode> = Object.fromEntries(
  [
    // ============================================================
    // OPENING — Chapter 1 (first-person cinematic)
    // ============================================================
    N({ id: 'o1_1', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'SMA Yuson. Sekolah baru.', next: 'o1_2' }),
    N({ id: 'o1_2', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Rencananya sederhana. Nilai aman, tidak cari masalah, lulus, pergi.', next: 'o1_3' }),
    N({ id: 'o1_3', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Cukup lihat. Jangan ikut campur.', next: 'o2_1' }),

    N({ id: 'o2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Pagar yang sedikit lapuk. Lukisan dinding yang setengah terhapus. Tapi sekolahnya tetap berjalan seperti biasa.', next: 'o2_2' }),
    N({ id: 'o2_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Hanya saja... beberapa siswa berjalan seolah sedang menghindari sesuatu. Berbisik. Lalu diam.', next: 'o3_1' }),

    N({ id: 'o3_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Di sisi halaman, dua siswa mengepung satu anak. Buku-bukunya dijatuhkan ke tanah.', next: 'o3_2' }),
    N({ id: 'o3_2', speaker: 'BULLY', portrait: 'bully', emotion: 'tense', text: 'Kamu lambat lagi, Aris. Bukuimu juga lambat.', next: 'o3_3' }),
    N({ id: 'o3_3', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'T-tolong... itu catatan ujianku...', next: 'o3_4' }),
    N({ id: 'o3_4', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: '...Bukan urusanku. Jangan ikut campur. Nilai. Lulus. Pergi.', next: 'o3_choice' }),

    N({
      id: 'o3_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: 'Tapi kalau aku berjalan terus...',
      choices: [
        {
          id: 'help_aris',
          text: '[A] Bantu Aris mengumpulkan bukunya',
          next: 'o_help_1',
          effects: [
            { k: 'flag', id: 'helped_aris' },
            { k: 'rel', target: 'aris', delta: 4 },
            { k: 'stat', stat: 'diplomacy', delta: 3 },
          ],
        },
        {
          id: 'walk_past',
          text: '[B] Berjalan terus',
          next: 'o_walk_1',
          effects: [
            { k: 'flag', id: 'ignored_aris' },
            { k: 'rel', target: 'aris', delta: -2 },
          ],
        },
      ],
    }),

    N({ id: 'o_help_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren berhenti. Berjongkok. Mengumpulkan buku-buku yang berserak.', next: 'o_help_2' }),
    N({ id: 'o_help_2', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Bukumu. Aku tidak berani apa-apa. Tapi berjalan terus rasanya... salah.', next: 'o4_1' }),

    N({ id: 'o_walk_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren mempercepat langkah. Pandangannya lurus ke depan. Suara tawa kecil di belakangnya.', next: 'o_walk_2' }),
    N({ id: 'o_walk_2', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Aku di sini untuk lulus. Bukan untuk jadi pahlawan.', next: 'o4_1' }),

    N({ id: 'o4_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Berhenti. Sekarang.', next: 'o4_2' }),
    N({ id: 'o4_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Kalau kalian ingin mencari masalah, cari saja aku di ruang OSIS. Di sini, tidak.', next: 'o4_3' }),
    N({ id: 'o4_3', speaker: 'BULLY', portrait: 'bully', emotion: 'tense', text: 'Che... OSIS memang. Pergi sana, Aris. Hari ini cuma pemanasan.', next: 'o4_4' }),
    N({ id: 'o4_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Kedua anak itu pergi tanpa menghadap Siti. Siti berjongkok, merapikan buku Aris.', next: 'o5_1' }),

    N({ id: 'o5_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Ren... tadi. Makasih, ya.', next: 'o5_2' }),
    N({ id: 'o5_2', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Kamu yang murid pindahan? Ren, kan? Siti. Kalau di Yuson, jangan jalan sendirian di belakang kantin.', next: 'o5_3' }),
    N({ id: 'o5_3', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Beberapa jalur itu... bukan sekadar jalur. Jaga nilaimu, dan jaga temanmu.', next: 'o6_1' }),

    N({ id: 'o6_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Sore menjelang. Di dekat kantin belakang, kerumunan siswa tiba-tiba menipis.', next: 'o6_2' }),
    N({ id: 'o6_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Seorang siswa berjalan santai, diikuti tiga anak. Tidak ada yang berani berpapasan dengannya.', next: 'o6_3' }),
    N({ id: 'o6_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Bimo. Ia tidak bicara, tidak mengejar, tidak mengancam. Ia hanya melihat Ren — lebih lama dari yang perlu.', next: 'o6_4' }),
    N({ id: 'o6_4', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '...Sepertinya aku baru saja dicatat.', next: 'o7_1' }),

    N({ id: 'o7_1', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Orientasi dulu. Jaga nilai. Jangan cari masalah.', effects: [{ k: 'flag', id: 'opening_complete' }], end: true }),

    // ============================================================
    // NPC ambient dialogue
    // ============================================================
    N({
      id: 'npc_aris',
      speaker: 'ARIS',
      portrait: 'aris',
      emotion: 'neutral',
      text: 'Kamu Ren, kan? Tempat duduk kita sebangku.',
      choices: [
        { id: 'aris_chat', text: 'Sekolah ini... seperti apa sebenarnya?', next: 'aris_chat' },
        { id: 'aris_bye', text: 'Sampai nanti.', end: true },
      ],
    }),
    N({ id: 'aris_chat', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Secara umum? Normal. Tapi jangan lewat gang belakang kantin sendirian. Dan jangan tatap anak-anak Bimo terlalu lama.', next: 'aris_chat2' }),
    N({ id: 'aris_chat2', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Ah— kalau kamu butuh catatan pelajaran, pinjam saja bukuku.', effects: [{ k: 'stat', stat: 'academic', delta: 1 }, { k: 'flag', id: 'aris_chat_done' }, { k: 'notify', text: 'Catatan Aris membantu pemahamanmu. (Akademik +1)' }], end: true }),

    N({
      id: 'npc_siti',
      speaker: 'SITI',
      portrait: 'siti',
      emotion: 'firm',
      text: 'Ren. Tepat waktu, bagus. Ada yang bisa kubantu?',
      choices: [
        {
          id: 'siti_form',
          text: 'Kamu kelihatan sibuk. Ada yang bisa kubantu?',
          next: 'siti_form_1',
          condition: { k: 'flag', id: 'osis_form_given', not: true },
        },
        { id: 'siti_chat', text: 'Sekadar menyapa.', next: 'siti_chat_1' },
        { id: 'siti_bye', text: 'Sampai nanti.', end: true },
      ],
    }),
    N({ id: 'siti_form_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Hmm... tolong antarkan formulir OSIS ini ke Pak Budi di ruang guru, ya. Aku harus siapkan rapat.', effects: [{ k: 'item', id: 'osis_form' }, { k: 'quest', id: 'osis_form', state: 'active' }, { k: 'flag', id: 'osis_form_given' }, { k: 'notify', text: 'Quest baru: Bantuan Siti' }], next: 'siti_form_2' }),
    N({ id: 'siti_form_2', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Terima kasih, Ren. Kamu tipe yang bisa diandalkan.', end: true }),
    N({ id: 'siti_chat_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Ingat: nilai baik itu perisai. Lebih kuat dari apapun di sekolah ini. Kalau kamu ragu, mulai dari belajar.', effects: [{ k: 'stat', stat: 'diplomacy', delta: 1 }], end: true }),

    N({
      id: 'npc_bimo',
      speaker: 'BIMO',
      portrait: 'bimo',
      emotion: 'dark',
      text: 'Anak baru. Ren, kan.',
      choices: [
        { id: 'bimo_why', text: 'Kamu kenal aku?', next: 'bimo_1' },
        { id: 'bimo_bye', text: '(Menjauh tanpa bicara)', end: true },
      ],
    }),
    N({ id: 'bimo_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Semua orang di Yuson saling kenal. Yang tidak biasa — kau berjalan seperti orang yang tidak takut.', next: 'bimo_2' }),
    N({ id: 'bimo_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kita lihat saja sampai kapan.', effects: [{ k: 'flag', id: 'bimo_talked' }], end: true }),

    N({
      id: 'npc_budi',
      speaker: 'PAK BUDI',
      portrait: 'budi',
      emotion: 'neutral',
      text: 'Ren, murid pindahan. Bagaimana penyesuaian di Yuson?',
      choices: [
        { id: 'budi_class', text: 'Ikut kelas tambahan (45 menit)', next: 'budi_class_done' },
        {
          id: 'budi_study',
          text: 'Belajar sekarang (kuis singkat)',
          next: '__study__',
          // BUG-FIX: activate study_habit quest when player first chooses to study.
          // Previously this quest was locked forever and only visible after completion.
          effects: [{ k: 'quest', id: 'study_habit', state: 'active' }],
        },
        {
          id: 'budi_form',
          text: 'Siti menyuruh saya mengantar formulir OSIS.',
          next: 'budi_form_done',
          condition: { k: 'and', all: [{ k: 'flag', id: 'osis_form_given' }, { k: 'flag', id: 'osis_form_done', not: true }] },
        },
        { id: 'budi_bye', text: 'Baik, Pak. Terima kasih.', end: true },
      ],
    }),
    N({ id: 'budi_class_done', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'warm', text: 'Bagus. Ikut kelas tambahan. Ingat — nilai baik itu perisai yang tidak bisa direbut siapa-siapa.', effects: [{ k: 'time', minutes: 45 }, { k: 'stat', stat: 'academic', delta: 4 }, { k: 'stat', stat: 'focus', delta: -5 }, { k: 'notify', text: 'Kelas tambahan selesai. (Akademik +4, Fokus -5, +45 menit)' }], end: true }),
    N({ id: 'budi_form_done', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Formulir OSIS? Saya terima. Sampaikan ke Siti, kerjanya rapi.', effects: [{ k: 'item', id: 'osis_form', remove: true }, { k: 'quest', id: 'osis_form', state: 'completed' }, { k: 'flag', id: 'osis_form_done' }, { k: 'rel', target: 'siti', delta: 3 }, { k: 'rel', target: 'budi', delta: 2 }, { k: 'stat', stat: 'diplomacy', delta: 2 }, { k: 'stat', stat: 'reputation', delta: 4 }, { k: 'notify', text: 'Formulir terkirim. Siti menghargai itu. (Rel Siti +3)' }], end: true }),

    // ============================================================
    // CHAPTER 2 — Gesekan Pertama & Pengamatan Bimo
    // ============================================================
    N({ id: 'ch2_intro_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Bel istirahat. Dari arah gerbang terdengar suara yang bukan suara siswa — logo jaket yang bukan logo sekolah ini.', next: 'ch2_intro_2' }),
    N({ id: 'ch2_intro_2', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Yuson memang sekolah yang rapi. Sayang, perlindungannya belum bayar bulan ini.', next: 'ch2_intro_3' }),
    N({ id: 'ch2_intro_3', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Aku cuma mau melewati gerbang. Ren sudah melangkah menjauh — tapi jalan keluarnya diblokir.', next: 'ch2_intro_4' }),
    N({ id: 'ch2_intro_4', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Mau ke mana? Cerita dulu. Dengan sopan.', next: '__combat__' }),

    N({ id: 'ch2_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Anak geng itu jatuh, menepi, dan pergi sambil menjerawut. Halaman depan menutup riwayatnya cepat — seolah tidak terjadi apa-apa.', next: 'ch2_win_2' }),
    N({ id: 'ch2_win_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Tapi ada satu pasang mata yang tidak pura-pura sibuk. Di dekat kantin, Bimo melipat tangannya.', next: 'ch2_win_3' }),
    N({ id: 'ch2_win_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Tidak buruk.', effects: [{ k: 'flag', id: 'bimo_impressed' }], next: 'ch2_close' }),
    N({ id: 'ch2_close', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Aku tidak mencari ini. Masalah yang mencariku. Sejak kapan aku bisa seperti ini...?', effects: [{ k: 'stat', stat: 'violence', delta: 3 }, { k: 'stat', stat: 'reputation', delta: 6 }, { k: 'chapter', id: 3 }, { k: 'time', minutes: 245 }, { k: 'quest', id: 'rooftop_meeting', state: 'active' }, { k: 'notify', text: 'Kabar menyebar cepat. (Reputasi meningkat)' }], end: true }),

    // ============================================================
    // CHAPTER 3 — Momen Kunci (rooftop proposition)
    // ============================================================
    N({ id: 'ch3_intro_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Sepulang sekolah, seorang anak menghampiri tanpa banyak bicara: "Bimo nunggu di atas."', next: 'ch3_intro_2' }),
    N({ id: 'ch3_intro_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Rooftop. Angin menggantung antara dua gedung. Bimo berdiri menghadap kota, tidak menoleh.', next: 'ch3_intro_3' }),
    N({ id: 'ch3_intro_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Aku lihat kamu di gerbang. Aku lihat kamu di gang. Kamu tidak menang karena kuat — kamu menang karena tidak panik.', next: 'ch3_intro_4' }),
    N({ id: 'ch3_intro_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Jadi begini. Kubeaskan tempat di sisiku. Status. Perlindungan. Tidak ada yang berani menyentuhmu.', next: 'ch3_intro_5' }),
    N({ id: 'ch3_intro_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Tapi semua punya harga. Kadang aku butuh tangan. Tanganmu.', next: 'ch3_choice' }),

    N({
      id: 'ch3_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '...Rencanaku tinggal satu tahun lagi.',
      choices: [
        {
          id: 'accept_bimo',
          text: '[A] Terima tawaran Bimo',
          next: 'ch3_accept_1',
          effects: [
            { k: 'flag', id: 'accepted_bimo' },
            { k: 'route', id: 'bad' },
            { k: 'rel', target: 'bimo', delta: 15 },
            { k: 'rel', target: 'aris', delta: -6 },
            { k: 'rel', target: 'siti', delta: -4 },
          ],
        },
        {
          id: 'reject_bimo',
          text: '[B] Tolak tawaran Bimo',
          next: 'ch3_reject_1',
          effects: [
            { k: 'flag', id: 'rejected_bimo' },
            { k: 'route', id: 'resistance' },
            { k: 'rel', target: 'bimo', delta: -15 },
            { k: 'stat', stat: 'diplomacy', delta: 2 },
          ],
        },
      ],
    }),

    // ============================================================
    // CHAPTER 4 — BAD ROUTE
    // ============================================================
    N({ id: 'ch3_accept_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Pilihan yang benar. Kamu tidak akan menyesal. Semua yang butuh dilindungi — akan terlindungi.', next: 'ch3_accept_2' }),
    N({ id: 'ch3_accept_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Hanya sampai lulus. Hanya sampai aku punya jalan keluar. Begitu kataku, waktu itu.', effects: [{ k: 'stat', stat: 'violence', delta: 5 }, { k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_bad_warehouse' }], end: true }),

    N({ id: 'ch4_bad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Minggu berjalan. Tugas terkumpul terlambat. Nilai turun pelan — seperti kabut naik, tidak terasa sampai menutupi.', effects: [{ k: 'time', minutes: 2600 }, { k: 'stat', stat: 'academic', delta: -8 }], next: 'ch4_bad_2' }),
    N({ id: 'ch4_bad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Aris mulai duduk lebih jauh di kelas. Siti berhenti mengirim pesan. Jalur-jalur sekolah terasa lebih luas dari biasanya.', next: 'ch4_bad_3' }),
    N({ id: 'ch4_bad_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Malam ini ada urusan di gudang tua. Geng dari luar mencoba masuk wilayah kita. Kau ikut. Bukan permintaan.', effects: [{ k: 'quest', id: 'warehouse_call', state: 'active' }], next: 'ch4_bad_4' }),
    N({ id: 'ch4_bad_4', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Aku bilang pada diriku: ini yang terakhir. Kata yang sama, minggu lalu. Dan minggu sebelumnya.', next: 'ch4_bad_warehouse' }),

    N({ id: 'ch4_bad_warehouse', speaker: 'NARATOR', portrait: 'narrator', text: 'Gudang tua. Bau karat dan asap rokok. Penghuninya tidak datang untuk berbicara.', effects: [{ k: 'teleport', x: -32, z: -25 }, { k: 'visit-zone', zone: 'warehouse' }], next: '__combat__' }),

    N({ id: 'ch4_bad_raid', speaker: 'NARATOR', portrait: 'narrator', text: 'Lampu sorot membelah atap gudang. Polisi. Teriakan. Langkah berat di semua arah.', next: 'ch4_bad_raid_2' }),
    N({ id: 'ch4_bad_raid_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Bimo sudah tidak ada — keluar lewat pintu samping, entah sejak kapan. Yang tertinggal: Ren, di tengah ruangan, dengan tangan yang masih hangat.', next: 'ch4_bad_raid_3' }),
    N({ id: 'ch4_bad_raid_3', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Yang mengatur semua itu? Anak SMA itu. Tanyakan saja pada Bimo — dia tahu.', next: 'ch4_bad_raid_4' }),
    N({ id: 'ch4_bad_raid_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Dan Bimo, ditemui para penyidik, mengangguk dengan wajah yang benar-benar berduka.', effects: [{ k: 'flag', id: 'arrested' }], next: 'ch4_bad_raid_5' }),
    N({ id: 'ch4_bad_raid_5', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Namaku tercatat di berkas. Namaku dielus-elus di lorong itu. Keduanya terjadi di hari yang sama.', effects: [{ k: 'flag', id: 'expelled' }, { k: 'ending' }], end: true }),

    // ============================================================
    // CHAPTER 4 — RESISTANCE ROUTE
    // ============================================================
    N({ id: 'ch3_reject_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Kau tahu, orang yang menolakku jarang bilang dua kali. Tapi baiklah. Kupikir kau beda. Kusalah, mungkin.', next: 'ch3_reject_2' }),
    N({ id: 'ch3_reject_2', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Aku hanya mau lulus. Kalau itu jadi masalah bagimu — itu masalahmu.', effects: [{ k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_res_search' }, { k: 'time', minutes: 1500 }, { k: 'notify', text: 'Kamu menolak Bimo. Dia tidak akan lupa.' }], end: true }),

    N({ id: 'ch4_res_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Dua hari kemudian, hukuman mulai. Bukan untuk Ren — untuk orang-orang di sekitarnya. Anak-anak yang pernah bicara pada Ren dihadang.', next: 'ch4_res_2' }),
    N({ id: 'ch4_res_2', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Ren... kalau mereka datang lagi ke aku, kamu tidak perlu ikut campur. Serius. Kamu sudah terlalu terlihat.', next: 'ch4_res_3' }),
    N({ id: 'ch4_res_3', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Bimo sedang menguji kamu, Ren. Dia tahu cara menang dari orang yang tidak mau bertarung: dia menyerang apa yang tidak bisa membela diri.', effects: [{ k: 'quest', id: 'find_aris', state: 'active' }, { k: 'notify', text: 'Quest baru: Aris Tidak Pulang' }], next: 'ch4_res_4' }),
    N({ id: 'ch4_res_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Keesokan harinya, Aris tidak masuk. Pesan terakhirnya, jam tiga pagi: "maaf ya".', end: true }),

    N({ id: 'ch4_res_alley', speaker: 'NARATOR', portrait: 'narrator', text: 'Gang belakang. Dua anak geng membentuk lingkaran. Di tengahnya, Aris — tasnya robek, tangan gemetar melindungi kepala.', next: 'ch4_res_choice' }),

    N({
      id: 'ch4_res_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: 'Mata Ren menemukan mereka. Tubuhnya sudah bergerak sebelum keputusannya selesai.',
      choices: [
        {
          id: 'help_aris_final',
          text: '[A] Tolong Aris. Sekarang.',
          next: 'ch4_res_help_1',
          effects: [
            { k: 'flag', id: 'helped_aris_final' },
            { k: 'rel', target: 'aris', delta: 10 },
            { k: 'stat', stat: 'diplomacy', delta: 3 },
          ],
        },
        {
          id: 'walk_away_final',
          text: '[B] Berbalik. Selesaikan sekolahmu.',
          next: 'ch4_res_away_1',
          effects: [
            { k: 'flag', id: 'ignored_aris_final' },
            { k: 'rel', target: 'aris', delta: -15 },
            { k: 'rel', target: 'siti', delta: -10 },
          ],
        },
      ],
    }),

    N({ id: 'ch4_res_help_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Dari semua alasan untuk tidak ikut campur — tidak ada satu pun yang berdiri di sini.', next: 'ch4_res_help_2' }),
    N({ id: 'ch4_res_help_2', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'DIA. SISI KIRIMU.', next: '__combat__' }),

    N({ id: 'ch4_res_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Kedua anak itu kabur saat sorot lampu jalan berkedip. Ren membantu Aris berdiri. Tanpa banyak kata — tidak ada kata yang cukup malam itu.', next: 'ch4_res_win_2' }),
    N({ id: 'ch4_res_win_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Aku di sini sejak tadi. Semua terekam. Nama-nama, waktu, kejadian — semua. Kubecheck dua kali.', next: 'ch4_res_win_3' }),
    N({ id: 'ch4_res_win_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Bukti itu tidak memenangkan pertarungan. Bukti itu mengakhirinya — salinan ditembuskan ke sekolah, ke orang tua, ke yang berwenang.', effects: [{ k: 'item', id: 'rekaman' }, { k: 'flag', id: 'gang_exposed' }], next: 'ch4_res_win_4' }),
    N({ id: 'ch4_res_win_4', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Ren... kau datang. Aku tidak akan lupa itu.', effects: [{ k: 'flag', id: 'aris_safe' }, { k: 'ending' }], end: true }),

    N({ id: 'ch4_res_away_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren berbalik. Langkahnya tenang. Terlalu tenang. Di belakangnya, suara yang tidak ingin didengarnya pelan-pelan memudar.', next: 'ch4_res_away_2' }),
    N({ id: 'ch4_res_away_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Aku harus lulus. Aku harus masuk universitas. Aku harus... aku harus berhenti menghitung kata "harus".', effects: [{ k: 'flag', id: 'left_aris_final' }, { k: 'ending' }], end: true }),

    // ============================================================
    // Zone flavor (short one-shots when exploring, once per zone)
    // ============================================================
    N({ id: 'zone_field', speaker: 'REN', portrait: 'ren', text: 'Lapangan. Sunyi di jam pelajaran. Di sinilah masalah biasanya "diselesaikan" setelah pulang.', end: true }),
    N({ id: 'zone_canteen', speaker: 'REN', portrait: 'ren', text: 'Kantin belakang. Menu: roti, teh, dan aturan tidak tertulis tentang siapa duduk di mana.', end: true }),
    N({ id: 'zone_alley', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gang belakang. Siti bilang jangan lewat sini sendirian. Dia benar, seperti biasa.', end: true }),
    N({ id: 'zone_parking', speaker: 'REN', portrait: 'ren', text: 'Parkir. Motor-motor geng selalu berderet di sudut yang sama.', end: true }),
    N({ id: 'zone_street', speaker: 'REN', portrait: 'ren', text: 'Jalan depan. Seharusnya tempat paling aman di Yuson. "Seharusnya" sedang melakukan kerja berat.', end: true }),
  ].map((n) => [n.id, n]),
);

// Special node ids consumed by the dialogue runner (not real nodes)
export const SPECIAL_NODES = { combat: '__combat__', study: '__study__' };

export const getDialogue = (id: string): DialogueNode | undefined => DIALOGUE[id];
