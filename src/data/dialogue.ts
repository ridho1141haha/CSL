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
    // NPC AMBIENT DIALOGUE — v0.6 rework (mentor feedback #1 & #4)
    // Per-character voice + repeat-visit variation + callbacks to earlier
    // choices. Variation is data-driven via condition-gated choices — the
    // same list shrinks/grows as flags, quests and relationships change.
    //
    // Voice guide (keep consistent when adding lines):
    //   ARIS     — soft, hesitant, trails with "…", timid but kind
    //   SITI     — firm, structured, imperatives + rationale, protective
    //   BIMO     — minimal, declarative, cold, never explains twice
    //   PAK BUDI — formal, teacherly, advice framed as experience
    //   REN      — dry internal monologue, economical
    // ============================================================

    // ---- ARIS ----
    N({
      id: 'npc_aris',
      speaker: 'ARIS',
      portrait: 'aris',
      emotion: 'neutral',
      text: 'Ren… eh. Halo.',
      choices: [
        { id: 'aris_first', text: 'Kamu Aris, kan? Sebangku kita.', next: 'aris_first_1', condition: { k: 'flag', id: 'met_aris', not: true } },
        {
          id: 'aris_thanks',
          text: 'Soal waktu itu — bukumu. Semoga terpakai.',
          next: 'aris_thanks_1',
          condition: { k: 'and', all: [{ k: 'flag', id: 'met_aris' }, { k: 'flag', id: 'helped_aris' }, { k: 'flag', id: 'aris_thanks_done', not: true }] },
        },
        { id: 'aris_chat', text: 'Sekolah ini… seperti apa sebenarnya?', next: 'aris_chat', condition: { k: 'flag', id: 'met_aris' } },
        {
          id: 'aris_gate',
          text: 'Anak-anak Bimo. Mereka masih mencariku?',
          next: 'aris_gate_1',
          condition: { k: 'and', all: [{ k: 'flag', id: 'bimo_impressed' }, { k: 'flag', id: 'aris_gate_talk', not: true }] },
        },
        {
          id: 'aris_train',
          text: 'Aku ingin bisa melindungi sesuatu.',
          next: 'aris_train_1',
          condition: { k: 'and', all: [{ k: 'chapterMin', id: 2 as const }, { k: 'quest', id: 'field_training', state: 'locked' }] },
        },
        {
          id: 'aris_notes_done',
          text: 'Catatanmu sudah kubaca sampai habis.',
          next: 'aris_notes_done_1',
          condition: { k: 'and', all: [{ k: 'quest', id: 'aris_notes', state: 'completed' }, { k: 'flag', id: 'aris_notes_thanks', not: true }] },
        },
        { id: 'aris_bye', text: 'Sampai nanti.', end: true },
      ],
    }),
    N({ id: 'aris_first_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'I-iya. Aris. Kamu… kamu bahkan ingat namaku. Di sekolah ini itu jarang, eh, maksudku—', effects: [{ k: 'flag', id: 'met_aris' }], next: 'aris_chat' }),
    N({ id: 'aris_thanks_1', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'A-ah, itu… tidak usah dipikirkan. Tapi, hmm. Tidak ada yang pernah berhenti untukku di sini. Jadi. Makasih, Ren.', effects: [{ k: 'rel', target: 'aris', delta: 2 }, { k: 'flag', id: 'aris_thanks_done' }], end: true }),
    N({ id: 'aris_gate_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Mereka bilang kamu tidak panik di gerbang. Orang yang tidak panik… di Yuson itu diperebutkan. Seperti tempat duduk.', next: 'aris_gate_2' }),
    N({ id: 'aris_gate_2', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Kalau Bimo memanggilmu… pikirkan dulu. Jawaban "tidak" di sini mahal. Tapi jawaban "ya" biasanya lebih mahal.', effects: [{ k: 'flag', id: 'aris_gate_talk' }, { k: 'rel', target: 'aris', delta: 1 }], end: true }),
    N({ id: 'aris_train_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Melindungi…? Kamu berubah, Ren. Ada anak-anak latihan di lapangan, pas pulang sekolah. Aku sering lihat dari jendela kelas.', effects: [{ k: 'quest', id: 'field_training', state: 'active' }, { k: 'notify', text: 'Quest baru: Latihan Senja' }], next: 'aris_train_2' }),
    N({ id: 'aris_train_2', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'K-kalau kamu ikut… hati-hati ya. Tubuh orang bisa dilatih. Jangan sampai kepalamu ikut.', end: true }),
    N({ id: 'aris_chat', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Secara umum? Normal. Tapi jangan lewat gang belakang kantin sendirian. Dan jangan tatap anak-anak Bimo terlalu lama.', next: 'aris_chat2' }),
    N({ id: 'aris_chat2', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Ah— kalau kamu butuh catatan pelajaran, pinjam saja bukuku.', effects: [{ k: 'stat', stat: 'academic', delta: 1 }, { k: 'flag', id: 'aris_chat_done' }, { k: 'notify', text: 'Catatan Aris membantu pemahamanmu. (Akademik +1)' }], next: 'aris_notes_1' }),

    // side quest hook: borrowing the notes → quest Pinjaman Catatan
    N({
      id: 'aris_notes_1',
      speaker: 'ARIS',
      portrait: 'aris',
      emotion: 'neutral',
      text: 'Serius. Buku itu lebih berguna di meja kamu daripada di tas aku.',
      choices: [
        { id: 'aris_notes_yes', text: 'Aku pinjam. Aku baca sungguhan.', next: 'aris_notes_2', condition: { k: 'quest', id: 'aris_notes', state: 'locked' } },
        { id: 'aris_notes_later', text: 'Nanti kalau perlu.', end: true },
      ],
    }),
    N({ id: 'aris_notes_2', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'B-baca sungguhan…? Kalau kamu sudah membacanya, kabari aku. Jarang ada yang sampai bagian bab tiga.', effects: [{ k: 'quest', id: 'aris_notes', state: 'active' }, { k: 'notify', text: 'Quest baru: Pinjaman Catatan' }], end: true }),
    N({ id: 'aris_notes_done_1', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Kamu… sampai bab tiga? Bahkan aku yang menulisnya mengantuk di situ. Tapi nilai kamu yang bicara. Bagus.', effects: [{ k: 'rel', target: 'aris', delta: 2 }, { k: 'flag', id: 'aris_notes_thanks' }], end: true }),

    // ---- SITI ----
    N({
      id: 'npc_siti',
      speaker: 'SITI',
      portrait: 'siti',
      emotion: 'firm',
      text: 'Ren. Ada waktu?',
      choices: [
        { id: 'siti_first', text: 'Kita belum resmi berkenalan.', next: 'siti_first_1', condition: { k: 'flag', id: 'met_siti', not: true } },
        {
          id: 'siti_form',
          text: 'Kamu kelihatan sibuk. Ada yang bisa kubantu?',
          next: 'siti_form_1',
          condition: { k: 'flag', id: 'osis_form_given', not: true },
        },
        { id: 'siti_chat', text: 'Sekadar menyapa.', next: 'siti_chat_1', condition: { k: 'flag', id: 'met_siti' } },
        {
          id: 'siti_alley',
          text: 'Ada catatan OSIS yang bisa kubantu lengkapi?',
          next: 'siti_alley_1',
          condition: { k: 'and', all: [{ k: 'chapter', id: 2 as const }, { k: 'flag', id: 'met_siti' }, { k: 'quest', id: 'alley_check', state: 'locked' }] },
        },
        {
          id: 'siti_teh',
          text: 'Ada yang bisa kuambilkan? Permintaan terbuka.',
          next: 'siti_teh_1',
          condition: { k: 'and', all: [{ k: 'chapter', id: 1 as const }, { k: 'flag', id: 'met_siti' }, { k: 'quest', id: 'canteen_teh', state: 'locked' }] },
        },
        {
          id: 'siti_teh_done',
          text: 'Soal teh tadi. Sudah kubawa.',
          next: 'siti_teh_thanks',
          condition: { k: 'and', all: [{ k: 'quest', id: 'canteen_teh', state: 'completed' }, { k: 'flag', id: 'siti_teh_thanks', not: true }] },
        },
        {
          id: 'siti_alley_done',
          text: 'Soal gang belakang. Aku menemukan sesuatu.',
          next: 'siti_alley_thanks',
          condition: { k: 'and', all: [{ k: 'flag', id: 'alley_checked' }, { k: 'flag', id: 'siti_alley_thanks', not: true }] },
        },
        {
          id: 'siti_rep',
          text: '(Diam dulu, lihat suasana)',
          next: 'siti_rep_1',
          condition: { k: 'and', all: [{ k: 'statAbove', stat: 'reputation', v: 15 }, { k: 'flag', id: 'siti_rep_talk', not: true }] },
        },
        { id: 'siti_bye', text: 'Sampai nanti.', end: true },
      ],
    }),
    N({ id: 'siti_first_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Siti. Ketua OSIS. Yuson punya banyak aturan tidak tertulis — anggap aku pengingatnya.', effects: [{ k: 'flag', id: 'met_siti' }], next: 'siti_first_2' }),
    N({ id: 'siti_first_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Aturan satu: jangan lewat belakang kantin sendirian. Aturan dua: nilai itu perisai. Sisanya kamu pelajari sendiri.', end: true }),
    N({ id: 'siti_alley_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Aku memetakan jadwal anak-anak Bimo dari laporan OSIS. Satu titik kosong: gang belakang. Aku tidak bisa lewat sana tanpa jadi tontonan.', effects: [{ k: 'quest', id: 'alley_check', state: 'active' }, { k: 'notify', text: 'Quest baru: Cek Gang Belakang' }], next: 'siti_alley_2' }),
    N({ id: 'siti_alley_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Kalau kamu menemukan tanda — ukiran, cat, apapun — catat bentuknya. Jangan dihapus. Itu data, bukan vandalism.', end: true }),
    N({ id: 'siti_alley_thanks', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Segitiga ganda… itu penanda ronda, Ren. Kamu baru saja mengisi celah yang tidak bisa kubeli dengan harga apapun. Terima kasih.', effects: [{ k: 'rel', target: 'siti', delta: 3 }, { k: 'flag', id: 'siti_alley_thanks' }, { k: 'notify', text: 'Siti menghargai laporanmu. (Rel Siti +3)' }], end: true }),
    N({ id: 'siti_teh_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Satu favor kecil. Kalau kamu lewat kantin saat istirahat siang — teh kotak. Rapat dua jam baru saja selesai.', effects: [{ k: 'quest', id: 'canteen_teh', state: 'active' }, { k: 'notify', text: 'Quest baru: Teh untuk Siti' }], next: 'siti_teh_2' }),
    N({ id: 'siti_teh_2', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Bukan perintah OSIS. Permintaan orang yang belum sarapan. Itu saja.', end: true }),
    N({ id: 'siti_teh_thanks', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Tehnya… kamu benar-benar ingat. Ren, kamu tipe yang bisa diandalkan. Dan kalimatku itu tidak murah.', effects: [{ k: 'rel', target: 'siti', delta: 3 }, { k: 'flag', id: 'siti_teh_thanks' }, { k: 'notify', text: 'Siti mulai percaya pada Ren. (Rel Siti +3)' }], end: true }),
    N({ id: 'siti_rep_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Namamu mulai disebut di luar kelas. Semoga karena hal yang benar. Yuson mengingat dua jenis orang: yang melindungi, dan yang menyerang.', effects: [{ k: 'flag', id: 'siti_rep_talk' }, { k: 'rel', target: 'siti', delta: 1 }], end: true }),
    N({ id: 'siti_form_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Hmm... tolong antarkan formulir OSIS ini ke Pak Budi di ruang guru, ya. Aku harus siapkan rapat.', effects: [{ k: 'item', id: 'osis_form' }, { k: 'quest', id: 'osis_form', state: 'active' }, { k: 'flag', id: 'osis_form_given' }, { k: 'notify', text: 'Quest baru: Bantuan Siti' }], next: 'siti_form_2' }),
    N({ id: 'siti_form_2', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Terima kasih, Ren. Kamu tipe yang bisa diandalkan.', end: true }),
    N({ id: 'siti_chat_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Ingat: nilai baik itu perisai. Lebih kuat dari apapun di sekolah ini. Kalau kamu ragu, mulai dari belajar.', effects: [{ k: 'stat', stat: 'diplomacy', delta: 1 }], end: true }),

    // ---- BIMO ----
    N({
      id: 'npc_bimo',
      speaker: 'BIMO',
      portrait: 'bimo',
      emotion: 'dark',
      text: 'Anak baru.',
      choices: [
        { id: 'bimo_why', text: 'Kamu kenal aku?', next: 'bimo_1', condition: { k: 'flag', id: 'bimo_talked', not: true } },
        {
          id: 'bimo_imp',
          text: 'Semua orang membicarakan gerbang itu.',
          next: 'bimo_imp_1',
          condition: { k: 'and', all: [{ k: 'flag', id: 'bimo_impressed' }, { k: 'flag', id: 'bimo_imp_talk', not: true }] },
        },
        {
          id: 'bimo_bad',
          text: 'Aku sudah menjawab tawaranmu.',
          next: 'bimo_bad_1',
          condition: { k: 'and', all: [{ k: 'route', id: 'bad' }, { k: 'flag', id: 'bimo_bad_talk', not: true }] },
        },
        {
          id: 'bimo_res',
          text: 'Kita tidak punya urusan lagi.',
          next: 'bimo_res_1',
          condition: { k: 'and', all: [{ k: 'route', id: 'resistance' }, { k: 'flag', id: 'bimo_res_talk', not: true }] },
        },
        { id: 'bimo_bye', text: '(Menjauh tanpa bicara)', end: true },
      ],
    }),
    N({ id: 'bimo_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Semua orang di Yuson saling kenal. Yang tidak biasa — kau berjalan seperti orang yang tidak takut.', next: 'bimo_2' }),
    N({ id: 'bimo_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kita lihat saja sampai kapan.', effects: [{ k: 'flag', id: 'bimo_talked' }], end: true }),
    N({ id: 'bimo_imp_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Gerbang itu. Orang lain berteriak. Kamu tidak.', next: 'bimo_imp_2' }),
    N({ id: 'bimo_imp_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Yang panik mengelompok. Yang tenang berjalan sendiri. Simpan kalimat itu. Nanti kupakai lagi.', effects: [{ k: 'flag', id: 'bimo_imp_talk' }, { k: 'rel', target: 'bimo', delta: 2 }], end: true }),
    N({ id: 'bimo_bad_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kau keluarga sekarang. Aturan satu: tidak ada yang memikul sendirian. Aturan dua kuterus nanti.', effects: [{ k: 'flag', id: 'bimo_bad_talk' }, { k: 'rel', target: 'bimo', delta: 2 }], end: true }),
    N({ id: 'bimo_res_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kau menolak dengan sopan. Itu yang membuatku penasaran. Orang sopan biasanya paling berbahaya saat terpojok.', effects: [{ k: 'flag', id: 'bimo_res_talk' }, { k: 'rel', target: 'bimo', delta: -2 }], end: true }),

    // ---- PAK BUDI ----
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
        {
          id: 'budi_praise',
          text: 'Nilai saya, Pak. Sudah mulai membaik?',
          next: 'budi_praise_1',
          condition: { k: 'and', all: [{ k: 'statAbove', stat: 'academic', v: 80 }, { k: 'flag', id: 'budi_praise_talk', not: true }] },
        },
        { id: 'budi_bye', text: 'Baik, Pak. Terima kasih.', end: true },
      ],
    }),
    N({ id: 'budi_praise_1', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'warm', text: 'Saya baca daftar nilai, bukan mendengar gosip. Dua pekan terakhir naik teratur. Itu kerja, bukan kebetulan.', next: 'budi_praise_2' }),
    N({ id: 'budi_praise_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'warm', text: 'Pertahankan. Sekolah ini bisa berantakan di bagian lain — tapi nilai yang rapi sering jadi satu-satunya yang tetap berdiri.', effects: [{ k: 'flag', id: 'budi_praise_talk' }, { k: 'stat', stat: 'focus', delta: 5 }, { k: 'notify', text: 'Kepala lebih jernih setelah pujian jujur. (Fokus +5)' }], end: true }),
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
    N({ id: 'ch2_close', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Aku tidak mencari ini. Masalah yang mencariku. Sejak kapan aku bisa seperti ini...?', effects: [{ k: 'stat', stat: 'violence', delta: 3 }, { k: 'stat', stat: 'reputation', delta: 6 }, { k: 'chapter', id: 3 }, { k: 'time', minutes: 245 }, { k: 'quest', id: 'rooftop_meeting', state: 'active' }, { k: 'notify', text: 'Kabar menyebar cepat. (Reputasi meningkat)' }, { k: 'save' }], end: true }),

    // ============================================================
    // CHAPTER 3 — Momen Kunci (rooftop proposition)
    // ============================================================
    N({ id: 'ch3_intro_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Sepulang sekolah, seorang anak menghampiri tanpa banyak bicara: "Bimo nunggu di atas."', next: 'ch3_intro_2' }),
    N({ id: 'ch3_intro_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Rooftop. Angin menggantung antara dua gedung. Bimo berdiri menghadap kota, tidak menoleh.', next: 'ch3_intro_3' }),
    N({ id: 'ch3_intro_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Aku lihat kamu di gerbang. Aku lihat kamu di gang. Kamu tidak menang karena kuat — kamu menang karena tidak panik.', cam: 'medium_speaker', next: 'ch3_intro_4' }),
    N({ id: 'ch3_intro_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Jadi begini. Kubeaskan tempat di sisiku. Status. Perlindungan. Tidak ada yang berani menyentuhmu.', cam: 'close_speaker', next: 'ch3_intro_5' }),
    N({ id: 'ch3_intro_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Tapi semua punya harga. Kadang aku butuh tangan. Tanganmu.', cam: 'close_speaker', next: 'ch3_choice' }),

    N({
      id: 'ch3_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '...Rencanaku tinggal satu tahun lagi.',
      cam: 'ren_ots',
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
    N({ id: 'ch3_accept_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Pilihan yang benar. Kamu tidak akan menyesal. Semua yang butuh dilindungi — akan terlindungi.', cam: 'close_speaker', next: 'ch3_accept_2' }),
    N({ id: 'ch3_accept_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Hanya sampai lulus. Hanya sampai aku punya jalan keluar. Begitu kataku, waktu itu.', cam: 'ren_ots', effects: [{ k: 'stat', stat: 'violence', delta: 5 }, { k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_bad_warehouse' }, { k: 'scene', id: 'campus' }, { k: 'save' }], end: true }),

    N({ id: 'ch4_bad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Minggu berjalan. Tugas terkumpul terlambat. Nilai turun pelan — seperti kabut naik, tidak terasa sampai menutupi.', effects: [{ k: 'time', minutes: 2600 }, { k: 'stat', stat: 'academic', delta: -8 }], next: 'ch4_bad_2' }),
    N({ id: 'ch4_bad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Aris mulai duduk lebih jauh di kelas. Siti berhenti mengirim pesan. Jalur-jalur sekolah terasa lebih luas dari biasanya.', next: 'ch4_bad_3' }),
    N({ id: 'ch4_bad_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Malam ini ada urusan di gudang tua. Geng dari luar mencoba masuk wilayah kita. Kau ikut. Bukan permintaan.', effects: [{ k: 'quest', id: 'warehouse_call', state: 'active' }], next: 'ch4_bad_4' }),
    N({ id: 'ch4_bad_4', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Aku bilang pada diriku: ini yang terakhir. Kata yang sama, minggu lalu. Dan minggu sebelumnya.', next: 'ch4_bad_warehouse' }),

    N({ id: 'ch4_bad_warehouse', speaker: 'NARATOR', portrait: 'narrator', text: 'Gudang tua. Bau karat dan asap rokok. Penghuninya tidak datang untuk berbicara.', effects: [{ k: 'scene', id: 'warehouse', spawn: [0, 7] }, { k: 'visit-zone', zone: 'warehouse_in' }], next: '__combat__' }),

    N({ id: 'ch4_bad_raid', speaker: 'NARATOR', portrait: 'narrator', text: 'Lampu sorot membelah atap gudang. Polisi. Teriakan. Langkah berat di semua arah.', next: 'ch4_bad_raid_2' }),
    N({ id: 'ch4_bad_raid_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Bimo sudah tidak ada — keluar lewat pintu samping, entah sejak kapan. Yang tertinggal: Ren, di tengah ruangan, dengan tangan yang masih hangat.', next: 'ch4_bad_raid_3' }),
    N({ id: 'ch4_bad_raid_3', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Yang mengatur semua itu? Anak SMA itu. Tanyakan saja pada Bimo — dia tahu.', next: 'ch4_bad_raid_4' }),
    N({ id: 'ch4_bad_raid_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Dan Bimo, ditemui para penyidik, mengangguk dengan wajah yang benar-benar berduka.', effects: [{ k: 'flag', id: 'arrested' }], next: 'ch4_bad_raid_5' }),
    N({ id: 'ch4_bad_raid_5', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Namaku tercatat di berkas. Namaku dielus-elus di lorong itu. Keduanya terjadi di hari yang sama.', effects: [{ k: 'flag', id: 'expelled' }, { k: 'ending' }], end: true }),

    // ============================================================
    // CHAPTER 4 — RESISTANCE ROUTE
    // ============================================================
    N({ id: 'ch3_reject_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Kau tahu, orang yang menolakku jarang bilang dua kali. Tapi baiklah. Kupikir kau beda. Kusalah, mungkin.', cam: 'close_speaker', next: 'ch3_reject_2' }),
    N({ id: 'ch3_reject_2', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Aku hanya mau lulus. Kalau itu jadi masalah bagimu — itu masalahmu.', cam: 'ren_ots', effects: [{ k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_res_search' }, { k: 'scene', id: 'campus' }, { k: 'time', minutes: 1500 }, { k: 'notify', text: 'Kamu menolak Bimo. Dia tidak akan lupa.' }, { k: 'save' }], end: true }),

    N({ id: 'ch4_res_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Dua hari kemudian, hukuman mulai. Bukan untuk Ren — untuk orang-orang di sekitarnya. Anak-anak yang pernah bicara pada Ren dihadang.', next: 'ch4_res_2' }),
    N({ id: 'ch4_res_2', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Ren... kalau mereka datang lagi ke aku, kamu tidak perlu ikut campur. Serius. Kamu sudah terlalu terlihat.', cam: 'close_speaker', next: 'ch4_res_3' }),
    N({ id: 'ch4_res_3', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Bimo sedang menguji kamu, Ren. Dia tahu cara menang dari orang yang tidak mau bertarung: dia menyerang apa yang tidak bisa membela diri.', cam: 'close_speaker', effects: [{ k: 'quest', id: 'find_aris', state: 'active' }, { k: 'notify', text: 'Quest baru: Aris Tidak Pulang' }, { k: 'save' }], next: 'ch4_res_4' }),
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
    N({ id: 'ch4_res_win_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Aku di sini sejak tadi. Semua terekam. Nama-nama, waktu, kejadian — semua. Kubecheck dua kali.', cam: 'close_speaker', next: 'ch4_res_win_3' }),
    N({ id: 'ch4_res_win_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Bukti itu tidak memenangkan pertarungan. Bukti itu mengakhirinya — salinan ditembuskan ke sekolah, ke orang tua, ke yang berwenang.', effects: [{ k: 'item', id: 'rekaman' }, { k: 'flag', id: 'gang_exposed' }], next: 'ch4_res_win_4' }),
    N({ id: 'ch4_res_win_4', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Ren... kau datang. Aku tidak akan lupa itu.', cam: 'close_speaker', effects: [{ k: 'flag', id: 'aris_safe' }, { k: 'ending' }], end: true }),

    N({ id: 'ch4_res_away_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren berbalik. Langkahnya tenang. Terlalu tenang. Di belakangnya, suara yang tidak ingin didengarnya pelan-pelan memudar.', next: 'ch4_res_away_2' }),
    N({ id: 'ch4_res_away_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Aku harus lulus. Aku harus masuk universitas. Aku harus... aku harus berhenti menghitung kata "harus".', effects: [{ k: 'flag', id: 'left_aris_final' }, { k: 'ending' }], end: true }),

    // ============================================================
    // HIDDEN EVENT DIALOGUE (mentor feedback #5) — opened by
    // systems/hiddenEvents when discovery conditions are met.
    // Rewards ride on node effects; discovery persistence is the
    // `he_<id>` flag the runner sets BEFORE opening the node.
    // ============================================================
    N({ id: 'he_rooftop_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Di celah dinding atap tertancap potongan kayu. Tanda geng, ditulis cepat — dan ditinggalkan dengan sengaja. Seperti pesan untuk siapa yang rajin melihat.', effects: [{ k: 'item', id: 'coretan_atap' }, { k: 'notify', text: 'Item didapat: Coretan dari Atap' }], end: true }),
    N({ id: 'he_alley_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Tembok gang. Ukiran segitiga ganda, cat merah — masih menempel di kuku. Ini penanda ronda, bukan coretan iseng.', effects: [{ k: 'flag', id: 'alley_mark' }, { k: 'notify', text: 'Data penting: tanda ronda geng tercatat' }], end: true }),
    N({ id: 'he_canteen_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Ren… duduk di sudut saja. Anak-anak Bimo tidak pernah makan di kantin. Mereka makan di tempat lain. Itu… itu justru masalahnya, kurasa.', effects: [{ k: 'rel', target: 'aris', delta: 1 }], end: true }),
    N({ id: 'he_field_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Rumput kekuningan. Dekat tiang gawang, sepasang sarung tinju tua tergeletak. Ditinggal — bukan hilang. Pemiliknya tidak akan kembali mencari.', effects: [{ k: 'item', id: 'sarung_tangan' }, { k: 'hp', delta: 5 }, { k: 'notify', text: 'Item didapat: Sarung Tinju Tua' }], end: true }),
    N({ id: 'he_parking_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Dua motor masuk, satu keluar. Tiap jam pelajaran kedua. Ren mencatatnya — jadwal ronda mereka lebih rapi daripada jadwal OSIS.', effects: [{ k: 'flag', id: 'gang_patrol_info' }, { k: 'stat', stat: 'diplomacy', delta: 1 }, { k: 'notify', text: 'Info: jadwal ronda geng tercatat' }], end: true }),
    N({ id: 'he_budi_1', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Masih di sekolah, Pak Budi? Ruang guru paling sepi jam segini. Murid-murid bilang begitu.', next: 'he_budi_2' }),
    N({ id: 'he_budi_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'warm', text: 'Sekolah terbaik untuk belajar tentang orang, Ren. Dulu ada murid yang diam, rapi, terlalu sabar. Saya menyesal tidak bertanya padanya lebih cepat.', effects: [{ k: 'rel', target: 'budi', delta: 2 }, { k: 'stat', stat: 'focus', delta: 5 }, { k: 'notify', text: 'Cerita Pak Budi membuat kepala tenang. (Fokus +5)' }], end: true }),
    N({ id: 'he_classroom_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Bangku ketiga dari jendela. Di balik meja, goresan pahat — satu kata, ditulis berulang. "tolong. tolong. tolong."', next: 'he_classroom_2' }),
    N({ id: 'he_classroom_2', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Tulisan itu lama. Lebih lama dari hari Ren datang. Aris pernah duduk di bangku ini.', effects: [{ k: 'rel', target: 'aris', delta: 2 }, { k: 'notify', text: 'Ren memahami Aris sedikit lebih dalam. (Rel Aris +2)' }], end: true }),
    N({ id: 'he_hall_1', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Papan OSIS. Di antara lomba dan jadwal, satu lembar polos: "Melihat sesuatu? Catat. Kami memproses tanpa nama." — tanda tangan: S.', effects: [{ k: 'flag', id: 'osis_notice' }, { k: 'notify', text: 'Info: kanal pelaporan anonim OSIS' }], end: true }),
    N({ id: 'he_bimo_alley_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Ren.', next: 'he_bimo_alley_2' }),
    N({ id: 'he_bimo_alley_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Anak-anakku ronda malam. Kalau kamu lewat, mereka akan mengingat wajahmu. Jangan beri mereka alasan mengingat lebih lama.', effects: [{ k: 'flag', id: 'bimo_warning' }, { k: 'notify', text: 'Info: peringatan langsung dari Bimo' }], end: true }),

    // ============================================================
    // Zone flavor (short one-shots when exploring, once per zone)
    // ============================================================
    N({ id: 'zone_field', speaker: 'REN', portrait: 'ren', text: 'Lapangan. Sunyi di jam pelajaran. Di sinilah masalah biasanya "diselesaikan" setelah pulang.', end: true }),
    N({ id: 'zone_canteen', speaker: 'REN', portrait: 'ren', text: 'Kantin. Menu: roti, teh, dan aturan tidak tertulis tentang siapa duduk di mana.', end: true }),
    N({ id: 'zone_alley', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gang belakang. Siti bilang jangan lewat sini sendirian. Dia benar, seperti biasa.', end: true }),
    N({ id: 'zone_parking', speaker: 'REN', portrait: 'ren', text: 'Parkir. Motor-motor geng selalu berderet di sudut yang sama.', end: true }),
    N({ id: 'zone_street', speaker: 'REN', portrait: 'ren', text: 'Jalan depan. Seharusnya tempat paling aman di Yuson. "Seharusnya" sedang melakukan kerja berat.', end: true }),
    N({ id: 'zone_classroom', speaker: 'REN', portrait: 'ren', text: 'Kelas 1-X. Bangkuku di dekat jendela. Dari sini, halaman terlihat damai — dari jarak yang tepat.', end: true }),
    N({ id: 'zone_warehouse', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gudang tua. Pintu besinya tertutup rapat. Suara di dalamnya tidak diundang.', end: true }),
  ].map((n) => [n.id, n]),
);

// Special node ids consumed by the dialogue runner (not real nodes)
export const SPECIAL_NODES = { combat: '__combat__', study: '__study__' };

// Runtime wiring tables — single source of truth for how the story graph is
// entered from the world. StoryDirector consumes ZONE_FLAVOR; the montage
// roots + trigger nodes + checkpoints are asserted by test/storyFlow.test.ts
// so a broken link fails CI instead of dead-ending a playthrough.
export const MONTAGE_ROOTS = ['ch4_bad_1', 'ch4_res_1'] as const;
export const STORY_TRIGGER_NODES = ['ch2_intro_1', 'ch3_intro_1', 'ch4_res_alley'] as const;
export const ZONE_FLAVOR: Record<string, string> = {
  field: 'zone_field',
  canteen: 'zone_canteen',
  back_alley: 'zone_alley',
  parking: 'zone_parking',
  street: 'zone_street',
  classroom: 'zone_classroom',
  warehouse: 'zone_warehouse',
};
export const CHECKPOINT_NODES = ['ch2_close', 'ch3_accept_2', 'ch3_reject_2', 'ch4_res_3'] as const;

export const getDialogue = (id: string): DialogueNode | undefined => DIALOGUE[id];
