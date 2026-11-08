import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// Dialog NPC free-roam (roots npc_*, dipakai data/npcs.ts dialogueRoot)
// Percakapan interaktif via tombol E (choices berkondisi, quest hooks).
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const NPC_NODES: DialogueNode[] = [
    // ============================================================
    // NPC AMBIENT DIALOGUE — per-character voice + repeat-visit
    // variation + callbacks. Variation is data-driven via
    // condition-gated choices — the same list shrinks/grows as
    // flags, quests and relationships change.
    // Voice guide lihat header file (GARIS MERAH).
    // ============================================================
    // ---- ARIS ----
    N({
      id: 'npc_aris',
      speaker: 'ARIS',
      portrait: 'aris',
      emotion: 'neutral',
      text: 'Ren... eh. Halo.',
      choices: [
        { id: 'aris_first', text: 'Kamu Aris, kan? Sebangku kita.', next: 'aris_first_1', condition: { k: 'flag', id: 'met_aris', not: true } },
        {
          id: 'aris_thanks',
          text: 'Soal waktu itu — bukumu. Semoga terpakai.',
          next: 'aris_thanks_1',
          condition: { k: 'and', all: [{ k: 'flag', id: 'met_aris' }, { k: 'flag', id: 'helped_aris' }, { k: 'flag', id: 'aris_thanks_done', not: true }] },
        },
        { id: 'aris_chat', text: 'Sekolah ini... seperti apa sebenarnya?', next: 'aris_chat', condition: { k: 'flag', id: 'met_aris' } },
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
    N({ id: 'aris_first_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'I-iya. Aris. Kamu... kamu bahkan ingat namaku. Di sekolah ini itu jarang, eh, maksudku—', effects: [{ k: 'flag', id: 'met_aris' }], next: 'aris_chat' }),
    N({ id: 'aris_thanks_1', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'A-ah, itu... tidak usah dipikirkan. Tapi, hmm. Tidak ada yang pernah berhenti untukku di sini. Jadi. Makasih, Ren.', effects: [{ k: 'rel', target: 'aris', delta: 2 }, { k: 'flag', id: 'aris_thanks_done' }], end: true }),
    N({ id: 'aris_gate_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Mereka bilang kamu tidak panik di gerbang. Orang yang tidak panik... di Yuson itu diperebutkan. Seperti tempat duduk.', next: 'aris_gate_2' }),
    N({ id: 'aris_gate_2', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Kalau Bimo memanggilmu... pikirkan dulu. Jawaban "tidak" di sini mahal. Tapi jawaban "ya" biasanya lebih mahal.', effects: [{ k: 'flag', id: 'aris_gate_talk' }, { k: 'rel', target: 'aris', delta: 1 }], end: true }),
    N({ id: 'aris_train_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Melindungi...? Kamu berubah, Ren. Ada anak-anak latihan di lapangan, pas pulang sekolah. Aku sering lihat dari jendela kelas.', effects: [{ k: 'quest', id: 'field_training', state: 'active' }, { k: 'notify', text: 'Quest baru: Latihan Senja' }], next: 'aris_train_2' }),
    N({ id: 'aris_train_2', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'K-kalau kamu ikut... hati-hati ya. Tubuh orang bisa dilatih. Jangan sampai kepalamu ikut.', end: true }),
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
    N({ id: 'aris_notes_2', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'B-baca sungguhan...? Kalau kamu sudah membacanya, kabari aku. Jarang ada yang sampai bagian bab tiga.', effects: [{ k: 'quest', id: 'aris_notes', state: 'active' }, { k: 'notify', text: 'Quest baru: Pinjaman Catatan' }], end: true }),
    N({ id: 'aris_notes_done_1', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Kamu... sampai bab tiga? Bahkan aku yang menulisnya mengantuk di situ. Tapi nilai kamu yang bicara. Bagus.', effects: [{ k: 'rel', target: 'aris', delta: 2 }, { k: 'flag', id: 'aris_notes_thanks' }], end: true }),
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
        {
          id: 'siti_neu',
          text: 'Soal Aris... aku masih memikirkannya.',
          next: 'siti_neu_1',
          condition: { k: 'and', all: [{ k: 'route', id: 'neutral' }, { k: 'chapterMin', id: 3 as const }, { k: 'flag', id: 'siti_neu_talk', not: true }] },
        },
        { id: 'siti_bye', text: 'Sampai nanti.', end: true },
      ],
    }),
    N({ id: 'siti_first_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Siti. Ketua OSIS. Yuson punya banyak aturan tidak tertulis — anggap gue pengingatnya.', effects: [{ k: 'flag', id: 'met_siti' }], next: 'siti_first_2' }),
    N({ id: 'siti_first_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Aturan satu: jangan lewat belakang kantin sendirian. Aturan dua: nilai itu perisai. Sisanya lu pelajari sendiri.', end: true }),
    N({ id: 'siti_alley_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Gue memetakan jadwal anak-anak Bimo dari laporan OSIS. Satu titik kosong: gang belakang. Gue enggak bisa lewat sana tanpa jadi tontonan.', effects: [{ k: 'quest', id: 'alley_check', state: 'active' }, { k: 'notify', text: 'Quest baru: Cek Gang Belakang' }], next: 'siti_alley_2' }),
    N({ id: 'siti_alley_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Kalau lu nemu tanda — ukiran, cat, apapun — catat bentuknya. Jangan dihapus. Itu data, bukan vandalisme.', end: true }),
    N({ id: 'siti_alley_thanks', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Segitiga ganda... itu penanda ronda, Ren. Lu baru aja mengisi celah yang gak bisa gue beli dengan harga apapun. Terima kasih.', effects: [{ k: 'rel', target: 'siti', delta: 3 }, { k: 'flag', id: 'siti_alley_thanks' }, { k: 'notify', text: 'Siti menghargai laporanmu. (Rel Siti +3)' }], end: true }),
    N({ id: 'siti_teh_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Satu favor kecil. Kalau lu lewat kantin saat istirahat siang — teh kotak. Rapat dua jam baru selesai.', effects: [{ k: 'quest', id: 'canteen_teh', state: 'active' }, { k: 'notify', text: 'Quest baru: Teh untuk Siti' }], next: 'siti_teh_2' }),
    N({ id: 'siti_teh_2', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Bukan perintah OSIS. Permintaan orang yang belum sarapan. Itu aja.', end: true }),
    N({ id: 'siti_teh_thanks', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Tehnya... lu beneran ingat, ya. Ren, lu tipe yang bisa diandalkan. Dan kalimat gue itu gak murah.', effects: [{ k: 'rel', target: 'siti', delta: 3 }, { k: 'flag', id: 'siti_teh_thanks' }, { k: 'notify', text: 'Siti mulai percaya pada Ren. (Rel Siti +3)' }], end: true }),
    N({ id: 'siti_rep_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Namamu mulai disebut di luar kelas. Semoga karena hal yang benar. Yuson ingat dua jenis orang: yang melindungi, dan yang menyerang.', effects: [{ k: 'flag', id: 'siti_rep_talk' }, { k: 'rel', target: 'siti', delta: 1 }], end: true }),
    N({ id: 'siti_neu_1', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Sekarang baru dipikirin? Aris mengajukan pengunduran diri, Ren. Anak itu menyerah pada sekolah ini — dan lu dapat nilai sempurna.', next: 'siti_neu_2' }),
    N({ id: 'siti_neu_2', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: 'Kadang gue gak tahu mana yang lebih dingin: geng yang menghajar, atau teman sebangku yang jalan terus.', effects: [{ k: 'flag', id: 'siti_neu_talk' }, { k: 'rel', target: 'siti', delta: -2 }], end: true }),
    N({ id: 'siti_form_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Hmm... tolong antarkan formulir OSIS ini ke Pak Budi di ruang guru, ya. Gue harus siapkan rapat.', effects: [{ k: 'item', id: 'osis_form' }, { k: 'quest', id: 'osis_form', state: 'active' }, { k: 'flag', id: 'osis_form_given' }, { k: 'notify', text: 'Quest baru: Bantuan Siti' }], next: 'siti_form_2' }),
    N({ id: 'siti_form_2', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Terima kasih, Ren. Lu tipe yang bisa diandalkan.', end: true }),
    N({ id: 'siti_chat_1', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Ingat ya: nilai bagus itu perisai. Lebih kuat dari apapun di sekolah ini. Kalau lu ragu, mulai dari belajar.', effects: [{ k: 'stat', stat: 'diplomacy', delta: 1 }], end: true }),
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
        {
          id: 'bimo_neu',
          text: 'Kita pernah bertemu di kantin.',
          next: 'bimo_neu_1',
          condition: { k: 'and', all: [{ k: 'route', id: 'neutral' }, { k: 'chapterMin', id: 3 as const }, { k: 'flag', id: 'bimo_neu_talk', not: true }] },
        },
        { id: 'bimo_bye', text: '(Menjauh tanpa bicara)', end: true },
      ],
    }),
    N({ id: 'bimo_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Semua orang di Yuson saling kenal. Yang gak biasa — lo jalan kayak orang yang gak takut.', next: 'bimo_2' }),
    N({ id: 'bimo_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kita lihat aja sampai kapan.', effects: [{ k: 'flag', id: 'bimo_talked' }], end: true }),
    N({ id: 'bimo_imp_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Gerbang itu. Orang lain berteriak. Lo enggak.', next: 'bimo_imp_2' }),
    N({ id: 'bimo_imp_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Yang panik ngerumpun. Yang tenang jalan sendiri. Simpan kalimat itu. Nanti gue pakai lagi.', effects: [{ k: 'flag', id: 'bimo_imp_talk' }, { k: 'rel', target: 'bimo', delta: 2 }], end: true }),
    N({ id: 'bimo_bad_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Lo keluarga sekarang. Aturan satu: gak ada yang megang sendirian. Aturan dua, nanti gue sambung.', effects: [{ k: 'flag', id: 'bimo_bad_talk' }, { k: 'rel', target: 'bimo', delta: 2 }], end: true }),
    N({ id: 'bimo_res_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Lo nolak dengan sopan. Justru itu yang bikin gue penasaran. Orang sopan biasanya paling berbahaya pas terpojok.', effects: [{ k: 'flag', id: 'bimo_res_talk' }, { k: 'rel', target: 'bimo', delta: -2 }], end: true }),
    N({ id: 'bimo_neu_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Anak yang diam itu. Nilai lo tinggi, mulut lo tutup. Di Yuson, kombinasi itu namanya aman.', next: 'bimo_neu_2' }),
    N({ id: 'bimo_neu_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Jangan berubah. Orang yang berubah di sini biasanya berubah ke arah yang salah.', effects: [{ k: 'flag', id: 'bimo_neu_talk' }, { k: 'rel', target: 'bimo', delta: 1 }], end: true }),
    // ---- PAK BUDI ----
    N({
      id: 'npc_budi',
      speaker: 'PAK BUDI',
      portrait: 'budi',
      emotion: 'neutral',
      text: 'Ren, kan? Mari duduk. Bagaimana Yuson selama ini — masih kuat bertahan?',
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
];
