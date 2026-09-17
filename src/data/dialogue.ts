import type { DialogueNode } from '../types';

// ============================================================================
// Story spine — CANON: naskah final "GARIS MERAH" (draf lengkap, v0.11.0).
// Tiga titik pilihan (Choice 1 tangga / Choice 2 rooftop / Choice 3 gang),
// empat ending: Lulus Tanpa Nama (netral), Tunduk Pada Kekuasaan (bad 1),
// Lulus Bersama (good), Rantai Dendam (bad 2).
// Voice guide (gaya anak sekolah, santai — jangan dikembalikan ke baku):
//   REN      — gue; monolog batin kering, ekonomis
//   ARIS     — aku/kamu (hangat) → lo (dingin, rute netral) → kamu lagi (good)
//   SITI     — lu/gue; tegas, imperatif + alasan
//   BIMO     — gue/lo; minimal, deklaratif, dingin, tidak menjelaskan dua kali
//   GENG     — lo; kasar, provokatif
//   PAK BUDI — formal (saya), saran berbingkai pengalaman
// Node graph integrity is verified by a test (test/dialogue.test.ts).
// ============================================================================

const N = (n: DialogueNode) => n;

export const DIALOGUE: Record<string, DialogueNode> = Object.fromEntries(
  [
    // ============================================================
    // BAB 1 — "MINGGU PERTAMA: PRIA TANPA WAJAH" (GARIS MERAH)
    // Scene 1 gerbang & map merah → Scene 2 kelas → Scene 3 lorong
    // → Scene 4 kantin & kemunculan Bimo. First-person cinematic.
    // ============================================================

    // ---- Scene 1: Gerbang & Map Merah ----
    N({ id: 'o1_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gerbang utama SMA Yuson, pagi hari. Pagar besi karatan, bau cat semprot mural mengelupas di tembok.', next: 'o1_2' }),
    N({ id: 'o1_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Seragam putih-abu-abu Ren masih bersih — kebalikan dari kondisi bangunan di hadapannya. Murid-murid lain berjalan terburu-buru sambil menunduk.', next: 'o1_3' }),
    N({ id: 'o1_3', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Di genggaman tangan gue, map merah: berkas pindahan dan lembar nilai akademis gue yang hampir sempurna.', next: 'o1_4' }),
    N({ id: 'o1_4', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'SMA Yuson. Cuma perlu bertahan satu tahun.', next: 'o1_5' }),
    N({ id: 'o1_5', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Jaga nilai tetap di atas delapan puluh, jangan cari masalah, ambil ijazah, terus cabut dari tempat ini.', next: 'o1_6' }),
    N({ id: 'o1_6', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Cukup lihat. Jangan ikut campur.', next: 'o2_1' }),

    // ---- Scene 2: Meja Baris Belakang ----
    N({ id: 'o2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelas 11-B, siang hari. Kipas angin gantung berderit pelan. Ren duduk di sudut belakang dekat jendela — posisi ideal untuk tidak terlihat.', next: 'o2_2' }),
    N({ id: 'o2_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Teman sebangkunya, seorang anak bertubuh ringkih, membungkuk di atas buku catatannya yang tebal. Aris.', next: 'o2_3' }),
    N({ id: 'o2_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Dua murid berbadan besar lewat di samping meja mereka — dan sengaja menyenggol kursi Aris sampai kotak pensilnya jatuh. Aris buru-buru memungutnya tanpa bersuara.', next: 'o2_3b' }),
    N({ id: 'o2_3b', speaker: 'MURID BESAR', portrait: 'gang', emotion: 'tense', text: 'Ups, sengaja. Bergerak aja lelet lo, Aris! Belajar terus buat apa sih?', next: 'o2_4' }),
    N({ id: 'o2_4', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Ren melihat kejadian itu — lalu memilih terus mencatat materi guru di papan tulis.', next: 'o2_5' }),
    N({ id: 'o2_5', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Berbisik ragu sambil menyodorkan penghapus) N-nih... kalau butuh. Kamu murid baru yang pindahan itu, kan?', next: 'o2_6' }),
    N({ id: 'o2_6', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: '(Menerima tanpa menoleh dari catatannya) Makasih. Gue Ren.', next: 'o2_7' }),
    N({ id: 'o2_7', speaker: 'ARIS', portrait: 'aris', emotion: 'neutral', text: 'Aku Aris. Kalau ada materi Pak Budi yang kelewat, kamu bisa lihat catatanku kok.', next: 'o2_8' }),
    N({ id: 'o2_8', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Satu bangku di sudut, satu teman sebangku yang takut sama sekolahnya sendiri. Tahun ini gue cuma butuh dua hal itu.', next: 'o3_1' }),

    // ---- Scene 3: Peringatan Pertama di Lorong ----
    N({ id: 'o3_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Waktu istirahat. Ren menuju kantin. Di lorong, Siti — Ketua OSIS — sedang mencatat nama-nama murid yang membolos. Saat Ren melintas, Siti memperhatikannya.', next: 'o3_2' }),
    N({ id: 'o3_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Lu murid baru yang nilai transfernya tinggi itu, kan? Ren?', next: 'o3_3' }),
    N({ id: 'o3_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Iya.', next: 'o3_4' }),
    N({ id: 'o3_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Saran aja nih. Kalau habis jam sekolah, mending langsung pulang. Jangan lewat gang belakang kantin, terus kalau lihat keributan di halaman... balik badan.', next: 'o3_5' }),
    N({ id: 'o3_5', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Sekolah ini enggak punya hukum buat melindungi anak pintar.', next: 'o3_6' }),
    N({ id: 'o3_6', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Emang dari awal gue enggak berniat cari masalah kok.', next: 'o3_7' }),
    N({ id: 'o3_7', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Bagus kalau paham. Tapi di Yuson, kadang bukan lu yang cari masalah... masalah yang datang nyari lu.', next: 'o4_1' }),

    // ---- Scene 4: Bisik-Bisik & Pengenalan Bimo ----
    N({ id: 'o4_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kantin sekolah, sore menjelang jam pulang. Ren duduk sendirian di meja sudut, membaca ulang catatannya.', next: 'o4_2' }),
    N({ id: 'o4_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Di meja sebelah, dua murid kelas 10 berbisik-bisik cemas.', next: 'o4_3' }),
    N({ id: 'o4_3', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Eh, lu udah tahu belum? Geng anak SMA 4 kemarin coba-coba masuk ke parkiran belakang sekolah kita.', next: 'o4_4' }),
    N({ id: 'o4_4', speaker: 'MURID B', portrait: 'generic', emotion: 'worried', text: 'Terus gimana? Ditegur sama guru piket?', next: 'o4_5' }),
    N({ id: 'o4_5', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Mana ada guru yang berani. Bimo sendiri yang turun tangan sama dua temannya. Enggak nyampe lima menit, anak-anak SMA 4 lari kocar-kacir.', next: 'o4_6' }),
    N({ id: 'o4_6', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Katanya kapten mereka sampai enggak bisa ikut latihan seminggu.', next: 'o4_7' }),
    N({ id: 'o4_7', speaker: 'MURID B', portrait: 'generic', emotion: 'worried', text: 'Seriusan...? Padahal Bimo jarang kelihatan berantem langsung di depan umum.', next: 'o4_8' }),
    N({ id: 'o4_8', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Justru itu. Dia enggak perlu teriak-teriak. Sekali dia ngomong atau nunjuk orang, anak buahnya yang bakal eksekusi.', next: 'o4_9' }),
    N({ id: 'o4_9', speaker: 'MURID A', portrait: 'generic', emotion: 'worried', text: 'Jangan pernah cari urusan sama Bimo, atau nama lu hilang dari daftar hadir.', next: 'o4_10' }),
    N({ id: 'o4_10', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Bimo... jadi nama itu yang bikin satu sekolah jalan sambil menunduk.)', next: 'o4_11' }),
    N({ id: 'o4_11', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Penguasa geng sekolah. Mending jauhin dari awal — jangan sampai nama gue masuk radar mereka.)', next: 'o4_12' }),
    N({ id: 'o4_12', speaker: 'NARATOR', portrait: 'narrator', text: 'Tiba-tiba gelombang keheningan menyebar dari arah pintu kantin. Gelak tawa di meja depan terhenti seketika. Kedua murid di sebelah Ren langsung bungkam dan menunduk dalam-dalam.', next: 'o4_13' }),
    N({ id: 'o4_13', speaker: 'NARATOR', portrait: 'narrator', text: 'Bimo melangkah masuk, diikuti tiga pengikutnya. Santai, tanpa ekspresi, tangan di saku celana. Kehadirannya seolah menyedot seluruh keributan di ruangan itu.', next: 'o4_14' }),
    N({ id: 'o4_14', speaker: 'NARATOR', portrait: 'narrator', text: 'Ia tidak bicara, tidak membentak. Tapi saat melintas, Bimo sempat menoleh menatap Ren — lebih lama dari yang perlu.', next: 'o5_1' }),

    // ---- Penutup opening: transisi ke gameplay (Hub Area) ----
    N({ id: 'o5_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '...Sepertinya gue sempat menarik perhatiannya. Bikin biasa aja. Jaga nilai. Jangan cari masalah.', effects: [{ k: 'flag', id: 'opening_complete' }], end: true }),

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
    // BAB 2 — "KESALAHAN KECIL ARIS" (GARIS MERAH)
    // Trigger StoryDirector: zone back_stairs saat istirahat setelah
    // eksplorasi. Node inilah GARIS CABANG pertama (CHOICE 1):
    //   [A] Mengabaikan Aris  → route 'neutral' → montage "Dinding Dingin"
    //                          → Netral Ending "Lulus Tanpa Nama"
    //   [B] Menolong Aris     → FIGHT 1 → Bimo terkesan → rute aksi
    // ============================================================
    N({ id: 'ch2_intro_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Lorong tangga menuju kantin belakang, jam istirahat. Dua anak geng inti Bimo merokok tipis di undakan — santai, seperti yang punya tempat.', next: 'ch2_intro_2' }),
    N({ id: 'ch2_intro_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Dari arah berlawanan, Aris berjalan terburu-buru sambil membawa tumpukan buku catatan tebal dan sebotol minuman.', next: 'ch2_intro_3' }),
    N({ id: 'ch2_intro_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Langkahnya yang panik membuat kakinya tersandung undakan. Botol minumnya terlepas — air menumpah tepat ke sepatu salah satu anak geng. Buku-buku Aris berserakan di tanah.', next: 'ch2_intro_4' }),
    N({ id: 'ch2_intro_4', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Woy! Mata lo ditaruh mana, hah?! (Menendang tumpukan buku Aris sampai kotor)', next: 'ch2_intro_5' }),
    N({ id: 'ch2_intro_5', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Pucat pasi, berlutut gemetar) M-maaf... maaf banget! Aku enggak sengaja, beneran!', next: 'ch2_intro_6' }),
    N({ id: 'ch2_intro_6', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: '(Mencengkeram kerah baju Aris sampai terangkat) Sepatu ini mahal. Lo pikir kata "maaf" cukup buat ganti rugi? Seret dia ke belakang kantin!', next: 'ch2_choice' }),

    N({
      id: 'ch2_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '(Tangan Ren terkepal di balik saku seragamnya. Sepuluh meter lagi mereka mencapai belakang kantin.)',
      choices: [
        {
          id: 'ignore_aris',
          text: '[A] Mengabaikan Aris. Jaga jarak. Pulang.',
          next: 'ch2_away_1',
          effects: [
            { k: 'flag', id: 'ignored_aris_stairs' },
            { k: 'route', id: 'neutral' },
            { k: 'rel', target: 'aris', delta: -5 },
            { k: 'rel', target: 'siti', delta: -3 },
            { k: 'quest', id: 'aris_incident', state: 'completed' },
          ],
        },
        {
          id: 'defend_aris',
          text: '[B] Menolong Aris. Hadangi mereka.',
          next: 'ch2_fight_1',
          effects: [
            { k: 'flag', id: 'defended_aris' },
            { k: 'rel', target: 'aris', delta: 5 },
            { k: 'stat', stat: 'diplomacy', delta: 2 },
            { k: 'quest', id: 'aris_incident', state: 'completed' },
          ],
        },
      ],
    }),

    // ---- [A] mengabaikan → RUTE NETRAL ----
    N({ id: 'ch2_away_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren berbalik arah secara perlahan, lalu mempercepat langkahnya menuju ruang kelas tanpa pernah menoleh ke belakang. Dari kejauhan, suara tumpukan buku yang ditendang perlahan memudar.', next: 'ch2_away_2' }),
    N({
      id: 'ch2_away_2',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'neutral',
      text: 'Jangan lihat ke belakang. Gue datang ke sini cuma buat belajar dan lulus. Bukan buat jadi pahlawan. Biarkan saja...',
      effects: [
        { k: 'chapter', id: 3 },
        { k: 'beat', id: 'ch3_neutral' },
        { k: 'notify', text: 'Rute terkunci: NETRAL — Dinding Dingin' },
        { k: 'save' },
      ],
      end: true,
    }),

    // ---- [B] menolong → FIGHT 1 (tangga belakang) → alur aksi ----
    N({ id: 'ch2_fight_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Ren melangkah keluar dari balik pilar, wajah datar. Janji "jangan ikut campur" runtuh saat catatan Aris diinjak. "Lepasin dia."', next: 'ch2_fight_1b' }),
    N({ id: 'ch2_fight_1b', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Siapa lagi nih? Anak baru sok pahlawan?', next: 'ch2_fight_1c' }),
    N({ id: 'ch2_fight_1c', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Sepatu lo cuma basah kena air. Gak ada alasan buat seret orang ke belakang kantin.', next: 'ch2_fight_2' }),
    N({ id: 'ch2_fight_2', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: 'Belagu lo!', next: '__combat__' }),

    N({ id: 'ch2_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren tidak panik. Dengan gerakan efisien, ia menepis pukulan mentah itu, menangkap pergelangan tangan si anak geng, memutarnya pelan hingga meringis — lalu menghempaskannya ke dinding.', next: 'ch2_win_2' }),
    N({ id: 'ch2_win_2', speaker: 'ORANG GENG', portrait: 'gang', emotion: 'tense', text: '(Mundur ketakutan, melepaskan kerah baju Aris) Awas lo ya... kita laporin Bimo! (Kedua anak geng itu ngacir pergi)', next: 'ch2_win_3' }),
    N({ id: 'ch2_win_3', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Gemetaran sambil memungut catatannya) R-Ren... kamu... kenapa kamu nolongin aku? Mereka itu orang-orangnya Bimo...', next: 'ch2_win_4' }),
    N({ id: 'ch2_win_4', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: '(Membantu merapikan buku Aris) Catatanmu berguna buat gue. Gue enggak mau catatan gue rusak. Ayo balik ke kelas.', next: 'ch2_win_5' }),
    N({ id: 'ch2_win_5', speaker: 'NARATOR', portrait: 'narrator', text: 'Tapi ada satu pasang mata yang tidak pura-pura sibuk. Dari ujung lorong, Bimo melipat tangannya — mencatat setiap gerakan Ren tadi.', next: 'ch2_win_6' }),
    N({ id: 'ch2_win_6', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Tidak buruk.', effects: [{ k: 'flag', id: 'bimo_impressed' }], next: 'ch2_close' }),
    N({ id: 'ch2_close', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gue gak nyari ini. Masalah yang nyari gue. Sejak kapan gue bisa kayak gini...?', effects: [{ k: 'stat', stat: 'violence', delta: 3 }, { k: 'stat', stat: 'reputation', delta: 6 }, { k: 'chapter', id: 3 }, { k: 'beat', id: 'ch3_osis' }, { k: 'time', minutes: 245 }, { k: 'notify', text: 'Kabar menyebar cepat. (Reputasi meningkat)' }, { k: 'save' }], end: true }),

    // ============================================================
    // BAB 3 (GARIS MERAH) — Scene 1: PENDEKATAN OSIS & TEROR FISIK
    // [FIGHT 2 parkiran], lalu Scene 2: panggilan ke rooftop.
    // Montase OSIS dibuka StoryDirector pada beat ch3_osis; sergapan
    // parkiran terpicu saat pemain memasuki zona parking (beat ch3_parking).
    // ============================================================

    // ---- Pendekatan OSIS (Siti) ----
    N({ id: 'ch3_osis_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Esoknya, koridor utama. Siti menghadang Ren dekat papan pengumuman OSIS — langkah mantap, tanpa basa-basi.', next: 'ch3_osis_2' }),
    N({ id: 'ch3_osis_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Lu beneran nahan anak buahnya Bimo kemarin?', next: 'ch3_osis_3' }),
    N({ id: 'ch3_osis_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Gue cuma refleks belain catatan gue.', next: 'ch3_osis_4' }),
    N({ id: 'ch3_osis_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Tindakan lu bikin anak-anak geng mulai panas. Tapi jujur... baru lu yang berani pasang badan di sekolah ini.', next: 'ch3_osis_5' }),
    N({ id: 'ch3_osis_5', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'OSIS punya catatan pelanggaran geng Bimo. Kalau lu butuh bantuan data buat melapor, kabari gue.', next: 'ch3_osis_6' }),
    N({
      id: 'ch3_osis_6',
      speaker: 'NARATOR',
      portrait: 'narrator',
      text: 'Siti berlalu. Di ujung koridor, dua anak geng yang mendengar semuanya saling panduk — lalu salah satunya mengetik pesan sambil menatap Ren.',
      effects: [
        { k: 'quest', id: 'gang_ambush', state: 'active' },
        { k: 'beat', id: 'ch3_parking' },
        { k: 'notify', text: 'Tujuan: Lewati area parkir' },
        { k: 'save' },
      ],
      end: true,
    }),

    // ---- Teror fisik di parkiran [FIGHT 2] ----
    N({ id: 'ch3_f2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Area parkir. Dua letnan geng berdiri santai di samping motor, menghadang jalur keluar. Yang di depan melangkah duluan.', next: 'ch3_f2_2' }),
    N({ id: 'ch3_f2_2', speaker: 'LETNAN GENG', portrait: 'gang', emotion: 'tense', text: 'Ini anak baru yang sok jagoan itu? Hajar!', next: 'ch3_f2_3' }),
    N({ id: 'ch3_f2_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Tangan Ren sudah bergerak sebelum pikirannya selesai.', next: '__combat__' }),

    N({ id: 'ch3_f2_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Kedua letnan itu tumbang kurang dari semenit. Yang ketiga — pengawal paling belakang — cuma mematung, lalu memilih kabur.', next: 'ch3_f2_win_2' }),
    N({ id: 'ch3_f2_win_2', speaker: 'LETNAN GENG', portrait: 'gang', emotion: 'tense', text: '(Sambil meraih keseimbangan) Gaya tarung lo... pantes Bimo penasaran sama lo.', next: 'ch3_f2_win_3' }),
    N({
      id: 'ch3_f2_win_3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '(Dua kali. Kata itu nempel di kepala gue. Bimo penasaran — dan penasaran Bimo gak pernah berakhir baik-baik aja.)',
      effects: [
        { k: 'quest', id: 'gang_ambush', state: 'completed' },
        { k: 'quest', id: 'rooftop_meeting', state: 'active' },
        { k: 'notify', text: 'Tujuan: Temui Bimo — lewat tangga belakang' },
        { k: 'save' },
      ],
      end: true,
    }),

    // ============================================================
    // BAB 3 — Scene 2: PENAWARAN DI ROOFTOP (GARIS MERAH)
    // Trigger StoryDirector: quest rooftop_meeting + zone back_stairs
    // → scene rooftop → beat ch3_rooftop → CHOICE 2.
    // ============================================================
    N({ id: 'ch3_intro_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Sepulang sekolah, seorang anak menghampiri tanpa banyak bicara: "Bimo nunggu di atas."', next: 'ch3_intro_2' }),
    N({ id: 'ch3_intro_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Rooftop. Angin menggantung antara dua gedung. Bimo berdiri menghadap kota, tidak menoleh.', next: 'ch3_intro_3' }),
    N({ id: 'ch3_intro_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Dua kali anak buah gue lo tumbangin. Lo bertarung tanpa panik, dan itu langka di Yuson. Jadi gue kasih dua penawaran.', cam: 'medium_speaker', next: 'ch3_intro_4' }),
    N({ id: 'ch3_intro_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Pertama, masuk ke kelompok gue. Jadi tangan kanan gue, bantu gue pegang sekolah ini, dan nilai lo gue jamin aman seratus persen.', cam: 'close_speaker', next: 'ch3_intro_5' }),
    N({ id: 'ch3_intro_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kedua... lo terus sok pahlawan, dan hidup lo di sini bakal gue bikin kayak neraka.', cam: 'close_speaker', next: 'ch3_choice' }),

    N({
      id: 'ch3_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '...Rencana gue tinggal satu tahun lagi.',
      cam: 'ren_ots',
      choices: [
        {
          id: 'accept_bimo',
          text: '[A] Terima penawaran & ikut geng Bimo',
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
          text: '[B] Tolak penawaran Bimo',
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
    // BAB 4 — RUTE BAD (GARIS MERAH): eksekutor geng → gudang
    // → kelulusan sebagai pemimpin baru. BAD ENDING 1:
    // "TUNDUK PADA KEKUASAAN".
    // ============================================================
    N({ id: 'ch3_accept_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Pilihan yang benar. Lo gak akan nyesal. Semua yang butuh dilindungi — bakal terlindungi.', cam: 'close_speaker', next: 'ch3_accept_2' }),
    N({ id: 'ch3_accept_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Hanya sampai lulus. Hanya sampai gue punya jalan keluar. Begitu kata gue, waktu itu.', cam: 'ren_ots', effects: [{ k: 'stat', stat: 'violence', delta: 5 }, { k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_bad_warehouse' }, { k: 'scene', id: 'campus' }, { k: 'save' }], end: true }),

    N({ id: 'ch4_bad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Minggu-minggu berjalan. Ren bekerja untuk Bimo — dan tugasnya selalu sama: pastikan anak-anak lain patuh.', next: 'ch4_bad_2' }),
    N({ id: 'ch4_bad_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Perlahan, tangan gue mulai dipakai buat hal yang dulu gue hindari. Memalak murid kelas 10 demi mempertahankan posisi. "Nilai lo gue jamin aman seratus persen" — begitu katanya. Dan gue percaya.', effects: [{ k: 'stat', stat: 'violence', delta: 6 }, { k: 'stat', stat: 'focus', delta: -10 }, { k: 'time', minutes: 2600 }], next: 'ch4_bad_3' }),
    N({ id: 'ch4_bad_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Aris kini menatap Ren dengan rasa takut yang sama seperti saat ia melihat Bimo. Teman sebangku yang dulu menawarkan penghapus — sekarang memilih duduk sedikit lebih jauh setiap hari.', next: 'ch4_bad_4' }),
    N({ id: 'ch4_bad_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Malem ini ada urusan di gudang tua. Geng dari luar nyoba masuk wilayah kita. Lo ikut. Bukan permintaan.', effects: [{ k: 'quest', id: 'warehouse_call', state: 'active' }], next: 'ch4_bad_4b' }),
    N({ id: 'ch4_bad_4b', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: '"Ini yang terakhir." Kata yang sama, minggu lalu. Dan minggu sebelumnya.', next: 'ch4_bad_warehouse' }),

    N({ id: 'ch4_bad_warehouse', speaker: 'NARATOR', portrait: 'narrator', text: 'Gudang tua. Bau karat dan asap rokok. Penghuninya tidak datang untuk berbicara.', effects: [{ k: 'scene', id: 'warehouse', spawn: [0, 7] }, { k: 'visit-zone', zone: 'warehouse_in' }], next: '__combat__' }),

    N({ id: 'ch4_bad_after', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Bagus. Enggak nyampe sepuluh menit. Dari sekarang urusan gudang gue serahkan ke lo. Nilai lo aman — gue jaga, lo kerja.', next: 'ch4_bad_after_2' }),
    N({
      id: 'ch4_bad_after_2',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue menang terus. Tapi tiap kali nangkep bayangan gue di kaca jendela kelas, gue makin enggak kenal cowok yang berdiri di sana.',
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

    // ---- BAD ENDING 1: "TUNDUK PADA KEKUASAAN" (gerbang, hari kelulusan) ----
    N({ id: 'ch4_bad_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kelulusan tiba. Bimo lulus bulan itu — dan nama yang bikin anak-anak Yuson menunduk berganti: Ren.', next: 'ch4_bad_grad_2' }),
    N({ id: 'ch4_bad_grad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Nilai Ren tinggi. Rekamannya bersih — bersih karena tidak ada yang berani melapor. Ia resmi jadi pemimpin geng baru, terjebak dalam lingkaran yang dulu ia janjikan tidak akan ia masuki.', next: 'ch4_bad_grad_3' }),
    N({
      id: 'ch4_bad_grad_3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Nilai gue aman. Gue enggak pernah kalah dalam perkelahian. Tapi saat ngelihat bayangan gue di kaca... gue enggak lagi mengenali siapa cowok yang berdiri di sana. Gue selamat dari sistem Yuson, cuma buat jadi bagian dari sistem yang gue rusak.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),

    // ============================================================
    // BAB 4 — RUTE RESISTANCE (GARIS MERAH): klimaks gang belakang.
    // Penyanderaan Aris + taktik OSIS → FIGHT 3 FINAL BOSS (Ren vs
    // Bimo) → CHOICE 3 → GOOD "Lulus Bersama" / BAD 2 "Rantai Dendam".
    // ============================================================
    N({ id: 'ch3_reject_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Lo tahu, orang yang nolak gue jarang bisa bilang dua kali. Tapi baiklah. Gue kira lo beda. Salah, mungkin.', cam: 'close_speaker', next: 'ch3_reject_2' }),
    N({ id: 'ch3_reject_2', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Gue cuma mau lulus. Kalau itu jadi masalah buat lo — itu masalah lo.', cam: 'ren_ots', effects: [{ k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_res_search' }, { k: 'scene', id: 'campus' }, { k: 'time', minutes: 1500 }, { k: 'notify', text: 'Lo nolak Bimo. Dia enggak akan lupa.' }, { k: 'save' }], end: true }),

    N({ id: 'ch4_res_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Dua hari kemudian, hukuman mulai. Bukan untuk Ren — untuk orang-orang di sekitarnya. Anak-anak yang pernah bicara pada Ren dihadang satu per satu.', next: 'ch4_res_2' }),
    N({ id: 'ch4_res_2', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Ren... kalau mereka datang lagi ke aku, kamu enggak perlu ikut campur. Serius. Kamu udah kelewat terlihat.', cam: 'close_speaker', next: 'ch4_res_3' }),
    N({ id: 'ch4_res_3', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Bimo lagi nguji lu, Ren. Dia tahu cara menang dari orang yang enggak mau bertarung: dia nyerang apa yang enggak bisa bela diri. Kalau ada apa-apa di gang — gue akan catat semuanya. Semua.', cam: 'close_speaker', effects: [{ k: 'quest', id: 'find_aris', state: 'active' }, { k: 'notify', text: 'Quest baru: Aris Tidak Pulang' }, { k: 'save' }], next: 'ch4_res_4' }),
    N({ id: 'ch4_res_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Keesokan harinya, Aris tidak masuk. Pesan terakhirnya, jam tiga pagi: "maaf ya".', end: true }),

    // ---- Penyanderaan di gang (trigger StoryDirector: find_aris + back_alley) ----
    N({ id: 'ch4_res_alley', speaker: 'NARATOR', portrait: 'narrator', text: 'Gang belakang kantin. Dua anak buah Bimo membentuk lingkaran — di tengahnya Aris, tas robek, tangan gemetar melindungi kepala. Bimo berdiri sedikit di belakang, santai.', next: 'ch4_res_alley_2' }),
    N({ id: 'ch4_res_alley_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Lo terus sok pahlawan. Nah, sekarang tunjukin. Pahlawan biasanya datang tepat waktu.', next: 'ch4_res_alley_3' }),
    N({ id: 'ch4_res_alley_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Dari balik tembok, cahaya ponsel kecil menyala. Siti merekam — pemerasan, penyanderaan, nama-nama. Bukti hukum: senjata yang lebih tajam dari tinju.', next: 'ch4_res_alley_4' }),
    N({ id: 'ch4_res_alley_4', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Dari semua alasan untuk tidak ikut campur — tidak ada satu pun yang berdiri di sini.', next: '__combat__' }),

    // ---- anak buah tumbang → FINAL BOSS: Ren vs Bimo ----
    N({ id: 'ch4_res_goons_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Kedua anak buah itu bergelimbang di tanah. Bimo melepas jaketnya, melangkah maju — pelan, seperti orang yang belum pernah kalah di sekolahnya sendiri.', effects: [{ k: 'beat', id: 'ch4_res_bimo' }], next: 'ch4_res_goons_win_2' }),
    N({ id: 'ch4_res_goons_win_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Dua kali anak buah gue lo tumbangin. Gue pikir lo cuma beruntung. Sekarang giliran gue mastiin.', next: '__combat__' }),

    // ---- CHOICE 3 (GARIS MERAH) ----
    N({
      id: 'ch4_res_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: 'Bimo tergeletak tidak berdaya di tanah. Amarah Ren berada di puncaknya.',
      choices: [
        {
          id: 'restrain_bimo',
          text: '[A] Tahan emosi. Biarkan hukum yang bekerja.',
          next: 'ch4_good_1',
          effects: [
            { k: 'flag', id: 'restrained_bimo' },
            { k: 'rel', target: 'aris', delta: 8 },
            { k: 'rel', target: 'siti', delta: 8 },
            { k: 'stat', stat: 'diplomacy', delta: 3 },
          ],
        },
        {
          id: 'brutal_bimo',
          text: '[B] Hajar brutal. Jadilah monster yang sama.',
          next: 'ch4_bad2_1',
          effects: [
            { k: 'flag', id: 'brutal_bimo' },
            { k: 'stat', stat: 'violence', delta: 8 },
            { k: 'rel', target: 'aris', delta: -10 },
            { k: 'rel', target: 'siti', delta: -10 },
          ],
        },
      ],
    }),

    // ---- GOOD ENDING: "LULUS BERSAMA" ----
    N({ id: 'ch4_good_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren menarik napas panjang. Tangan yang terkepal perlahan dilonggarkan. Ia merapikan seragamnya — dan mundur selangkah dari garis yang tidak mau ia lewati.', next: 'ch4_good_2' }),
    N({ id: 'ch4_good_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Suara sirene. Siti keluar dari persembunyiannya bersama polisi dan Kepala Sekolah, membawa rekaman lengkap pemerasan dan penyanderaan. Bimo dan pengikutnya diborgol — ditangkap, lalu dikeluarkan dari SMA Yuson.', effects: [{ k: 'item', id: 'rekaman' }, { k: 'flag', id: 'gang_exposed' }], next: 'ch4_good_3' }),
    N({ id: 'ch4_good_3', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: 'Ren... aku enggak tahu harus bilang apa. Kamu... kamu datang beneran.', effects: [{ k: 'flag', id: 'aris_safe' }], next: 'ch4_good_4' }),
    N({
      id: 'ch4_good_4',
      speaker: 'NARATOR',
      portrait: 'narrator',
      text: 'Beberapa bulan berlalu. Senin terakhir Ren di Yuson: hari kelulusan.',
      effects: [
        { k: 'beat', id: 'ch4_good_grad' },
        { k: 'quest', id: 'graduation_day', state: 'active' },
        { k: 'time', minutes: 2880 },
        { k: 'notify', text: 'Tujuan: Pulang lewat gerbang utama' },
        { k: 'save' },
      ],
      end: true,
    }),

    // ---- Kelulusan (trigger StoryDirector: gate + restrained_bimo) ----
    N({ id: 'ch4_good_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Hari kelulusan berlangsung meriah. Ren berdiri di gerbang memegang ijazah — nilai tertinggi di angkatannya.', next: 'ch4_good_grad_2' }),
    N({ id: 'ch4_good_grad_2', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Dengan kacamata baru) Nih, teh kotakmu, Ren. Makasih... buat semuanya. Kalau bukan karena kamu di tangga waktu itu, aku pasti udah putus sekolah.', next: 'ch4_good_grad_3' }),
    N({ id: 'ch4_good_grad_3', speaker: 'SITI', portrait: 'siti', emotion: 'warm', text: 'Nilai lu tetap nomor satu, Ren. Dan yang paling penting... lu enggak lulus sendirian. Ayo foto bertiga.', next: 'ch4_good_grad_4' }),
    N({ id: 'ch4_good_grad_4', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: '(Menerima teh kotak, tersenyum tipis) Boleh.', next: 'ch4_good_grad_5' }),
    N({
      id: 'ch4_good_grad_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'calm',
      text: 'Surat pindah gue selesai. Nilai lulus gue sempurna. Ada memar yang sempat singgah di muka gue, tapi Bimo dan gengnya kini cuma sejarah kelam yang berhasil ditumbangkan. Target awal gue memang cuma mengejar nilai dan ijazah... tapi saat melangkah keluar melewati gerbang ini bareng teman-teman gue, gue tahu gue keluar dari sini tanpa kehilangan hati gue.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),

    // ---- BAD ENDING 2: "RANTAI DENDAM" / JADI MONSTER ----
    N({ id: 'ch4_bad2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gelap mata. Pukulan berikutnya turun lagi — dan lagi — sampai tangan yang tadi gemetar sekarang tidak mau berhenti.', next: 'ch4_bad2_2' }),
    N({ id: 'ch4_bad2_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Bimo dilarikan ke rumah sakit dalam kondisi kritis. Keluarganya melaporkan Ren atas penganiayaan berat. Rekaman OSIS cukup untuk menjatuhkan Bimo — tapi tidak cukup membebaskan Ren dari main hakim sendiri.', next: 'ch4_bad2_3' }),
    N({ id: 'ch4_bad2_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren ditangkap polisi di halaman sekolah dan resmi dikeluarkan dari SMA Yuson. Nilai akademisnya yang sempurna melayang — tertinggal di dalam berkas perkara.', effects: [{ k: 'flag', id: 'expelled' }], next: 'ch4_bad2_4' }),
    N({ id: 'ch4_bad2_4', speaker: 'NARATOR', portrait: 'narrator', text: 'Saat mobil polisi menutup pintunya, Ren melihat Aris dan Siti di balik pagar sekolah. Keduanya menatap tanpa bicara — kecewa yang jauh lebih berat daripada marah.', next: 'ch4_bad2_5' }),
    N({
      id: 'ch4_bad2_5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue memenangkan pertarungan di gang itu, tapi gue kehilangan masa depan gue. Dalam usaha gue melawan monster yang menguasai Yuson... gue enggak sadar bahwa amarah udah mengubah gue jadi monster yang sama mengerikannya.',
      effects: [{ k: 'ending' }],
      end: true,
    }),

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

    // ---- NEUTRAL ENDING: "LULUS TANPA NAMA" (gerbang, hari kelulusan) ----
    N({ id: 'ch4_neu_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gerbang utama SMA Yuson. Beberapa bulan kemudian — hari kelulusan.', next: 'ch4_neu_grad_2' }),
    N({ id: 'ch4_neu_grad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Nama Ren berada di urutan pertama dengan nilai rata-rata tertinggi di SMA Yuson. Di halaman, murid-murid lain saling corat-coret seragam, berfoto, dan berpelukan dengan teman geng mereka.', next: 'ch4_neu_grad_3' }),
    N({ id: 'ch4_neu_grad_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Siti lewat membawa berkas penutupan OSIS. Ia sempat melirik Ren yang berdiri sendirian di dekat gerbang.', next: 'ch4_neu_grad_4' }),
    N({ id: 'ch4_neu_grad_4', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Mengangguk dingin — tanpa satu kata pun tentang selamat — lalu berjalan pergi.)', next: 'ch4_neu_grad_5' }),
    N({ id: 'ch4_neu_grad_5', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Surat pindah gue selesai. Nilai lulus gue sempurna. Gak ada bekas luka, gak ada panggilan kepolisian, dan Bimo bahkan gak pernah ingat nama gue.', next: 'ch4_neu_grad_6' }),
    N({
      id: 'ch4_neu_grad_6',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Target awal gue tercapai seratus persen. Tapi saat melangkah keluar melewati gerbang ini sendirian... gue sadar. Gue memang selamat di SMA Yuson, tapi gue keluar dari sini sebagai orang yang kehilangan hatinya.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),

    // ============================================================
    // HIDDEN EVENT DIALOGUE (mentor feedback #5) — opened by
    // systems/hiddenEvents when discovery conditions are met.
    // Rewards ride on node effects; discovery persistence is the
    // `he_<id>` flag the runner sets BEFORE opening the node.
    // ============================================================
    N({ id: 'he_rooftop_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Di celah dinding atap tertancap potongan kayu. Tanda geng, ditulis cepat — dan ditinggalkan dengan sengaja. Seperti pesan untuk siapa yang rajin melihat.', effects: [{ k: 'item', id: 'coretan_atap' }, { k: 'notify', text: 'Item didapat: Coretan dari Atap' }], end: true }),
    N({ id: 'he_alley_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Tembok gang. Ukiran segitiga ganda, cat merah — masih menempel di kuku. Ini penanda ronda, bukan coretan iseng.', effects: [{ k: 'flag', id: 'alley_mark' }, { k: 'notify', text: 'Data penting: tanda ronda geng tercatat' }], end: true }),
    N({ id: 'he_canteen_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Ren... duduk di sudut aja. Anak-anak Bimo gak pernah makan di kantin. Mereka makan di tempat lain. Itu... itu justru masalahnya, kurasa.', effects: [{ k: 'rel', target: 'aris', delta: 1 }], end: true }),
    N({ id: 'he_field_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Rumput kekuningan. Dekat tiang gawang, sepasang sarung tinju tua tergeletak. Ditinggal — bukan hilang. Pemiliknya gak akan balik nyari.', effects: [{ k: 'item', id: 'sarung_tangan' }, { k: 'hp', delta: 5 }, { k: 'notify', text: 'Item didapat: Sarung Tinju Tua' }], end: true }),
    N({ id: 'he_parking_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Dua motor masuk, satu keluar. Tiap jam pelajaran kedua. Ren mencatatnya — jadwal ronda mereka lebih rapi daripada jadwal OSIS.', effects: [{ k: 'flag', id: 'gang_patrol_info' }, { k: 'stat', stat: 'diplomacy', delta: 1 }, { k: 'notify', text: 'Info: jadwal ronda geng tercatat' }], end: true }),
    N({ id: 'he_budi_1', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Masih di sekolah, Pak Budi? Ruang guru paling sepi jam segini. Murid-murid bilang begitu.', next: 'he_budi_2' }),
    N({ id: 'he_budi_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'warm', text: 'Sekolah terbaik untuk belajar tentang orang, Ren. Dulu ada murid yang diam, rapi, terlalu sabar. Saya menyesal tidak bertanya padanya lebih cepat.', effects: [{ k: 'rel', target: 'budi', delta: 2 }, { k: 'stat', stat: 'focus', delta: 5 }, { k: 'notify', text: 'Cerita Pak Budi membuat kepala tenang. (Fokus +5)' }], end: true }),
    N({ id: 'he_classroom_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Bangku ketiga dari jendela. Di balik meja, goresan pahat — satu kata, ditulis berulang. "tolong. tolong. tolong."', next: 'he_classroom_2' }),
    N({ id: 'he_classroom_2', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Tulisan itu lama. Lebih lama dari hari Ren datang. Aris pernah duduk di bangku ini.', effects: [{ k: 'rel', target: 'aris', delta: 2 }, { k: 'notify', text: 'Ren memahami Aris sedikit lebih dalam. (Rel Aris +2)' }], end: true }),
    N({ id: 'he_hall_1', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Papan OSIS. Di antara lomba dan jadwal, satu lembar polos: "Melihat sesuatu? Catat. Kami memproses tanpa nama." — tanda tangan: S.', effects: [{ k: 'flag', id: 'osis_notice' }, { k: 'notify', text: 'Info: kanal pelaporan anonim OSIS' }], end: true }),
    N({ id: 'he_bimo_alley_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Ren.', next: 'he_bimo_alley_2' }),
    N({ id: 'he_bimo_alley_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Anak-anak gue ronda malem. Kalau lo lewat, mereka akan ingat muka lo. Jangan kasih mereka alasan buat ingat lebih lama.', effects: [{ k: 'flag', id: 'bimo_warning' }, { k: 'notify', text: 'Info: peringatan langsung dari Bimo' }], end: true }),
    // v0.8.0: library + Gedung B exploration
    N({ id: 'he_library_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Rak tahunan, pojok perpustakaan. Foto angkatan lama terkelupas: satu anak kelas 10 berdiri paling pinggir, wajahnya sudah mulai tampak seperti Bimo. Namanya dicoret hitam.', next: 'he_library_2' }),
    N({ id: 'he_library_2', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Nama yang dicoret. Tahun itu, satu-satunya. Entah kenapa gue enggak pengen tahu ke mana dia pergi.', effects: [{ k: 'flag', id: 'library_yearbook' }, { k: 'stat', stat: 'diplomacy', delta: 1 }, { k: 'notify', text: 'Info: foto tahunan Bimo tercatat' }], end: true }),
    N({ id: 'he_osis_1', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Buku tamu Ruang OSIS, lantai satu Gedung B. Baris demi baris nama rapi. Di halaman terakhir, satu baris kosong — hanya coretan kecil: "menunggu yang berani".', effects: [{ k: 'flag', id: 'osis_guestbook' }, { k: 'stat', stat: 'focus', delta: 3 }, { k: 'notify', text: 'Info: buku tamu OSIS tercatat (Fokus +3)' }], end: true }),

    // ============================================================
    // Zone flavor (short one-shots when exploring, once per zone)
    // ============================================================
    N({ id: 'zone_field', speaker: 'REN', portrait: 'ren', text: 'Lapangan. Sunyi di jam pelajaran. Di sinilah masalah biasanya "diselesaikan" setelah pulang.', end: true }),
    N({ id: 'zone_canteen', speaker: 'REN', portrait: 'ren', text: 'Kantin. Menu: roti, teh, dan aturan tidak tertulis tentang siapa duduk di mana.', end: true }),
    N({ id: 'zone_alley', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gang belakang. Siti bilang jangan lewat sini sendirian. Dia benar, seperti biasa.', end: true }),
    N({ id: 'zone_parking', speaker: 'REN', portrait: 'ren', text: 'Parkir. Motor-motor geng selalu berderet di sudut yang sama.', end: true }),
    N({ id: 'zone_street', speaker: 'REN', portrait: 'ren', text: 'Jalan depan. Seharusnya tempat paling aman di Yuson. "Seharusnya" sedang melakukan kerja berat.', end: true }),
    N({ id: 'zone_classroom', speaker: 'REN', portrait: 'ren', text: 'Kelas 1-X. Bangku gue di dekat jendela. Dari sini, halaman terlihat damai — dari jarak yang tepat.', end: true }),
    N({ id: 'zone_warehouse', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gudang tua. Pintu besinya tertutup rapat. Suara di dalamnya tidak diundang.', end: true }),
    N({ id: 'zone_library', speaker: 'REN', portrait: 'ren', text: 'Perpustakaan. Sepi, dingin, rapi. Tempat paling aman di sekolah ini — dan paling gampang bikin gue merasa sedang diawasi.', end: true }),
    N({ id: 'zone_gedung_b', speaker: 'REN', portrait: 'ren', text: 'Gedung Kelas B. Tiga lantai, lorong terbuka, tangga beton. Dari lantai atas, seluruh sekolah terlihat lebih kecil dari yang dikatakan orang.', end: true }),
  ].map((n) => [n.id, n]),
);

// Special node ids consumed by the dialogue runner (not real nodes)
export const SPECIAL_NODES = { combat: '__combat__', study: '__study__' };

// Runtime wiring tables — single source of truth for how the story graph is
// entered from the world. StoryDirector consumes ZONE_FLAVOR; the montage
// roots + trigger nodes + checkpoints are asserted by test/storyFlow.test.ts
// so a broken link fails CI instead of dead-ending a playthrough.
export const MONTAGE_ROOTS = ['ch4_bad_1', 'ch4_res_1', 'n1_1'] as const;
export const STORY_TRIGGER_NODES = [
  'ch2_intro_1',
  'ch3_osis_1', // GARIS MERAH: pendekatan OSIS (montase)
  'ch3_f2_1', // GARIS MERAH: teror fisik parkiran [FIGHT 2]
  'ch3_intro_1', // rooftop
  'ch4_res_alley', // penyanderaan
  'ch4_bad_grad_1', // bad ending 1 (kelulusan)
  'ch4_good_grad_1', // good ending (kelulusan)
  'ch4_neu_grad_1', // neutral ending (kelulusan)
] as const;
export const ZONE_FLAVOR: Record<string, string> = {
  field: 'zone_field',
  canteen: 'zone_canteen',
  back_alley: 'zone_alley',
  parking: 'zone_parking',
  street: 'zone_street',
  classroom: 'zone_classroom',
  warehouse: 'zone_warehouse',
  // v0.8.0: new buildings
  library: 'zone_library',
  gedung_b: 'zone_gedung_b',
};
export const CHECKPOINT_NODES = [
  'ch2_close',
  'ch2_away_2',
  'ch3_osis_6', // GARIS MERAH: sebelum sergapan parkiran
  'ch3_f2_win_3', // GARIS MERAH: sebelum rooftop
  'ch3_accept_2',
  'ch3_reject_2',
  'ch4_res_3',
  'ch4_good_4', // GARIS MERAH: sebelum kelulusan (good)
  'ch4_bad_after_2', // GARIS MERAH: sebelum kelulusan (bad)
  'n4_4',
] as const;

export const getDialogue = (id: string): DialogueNode | undefined => DIALOGUE[id];
