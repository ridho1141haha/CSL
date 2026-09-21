import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAB 1 — "Minggu Pertama: Pria Tanpa Wajah" (opening sinematik FP, GARIS MERAH)
// Scene 1 gerbang (map merah) → kelas (pensil jatuh) → lorong (Siti) → kantin (Bimo).
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const OPENING_NODES: DialogueNode[] = [
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
    N({ id: 'o2_5', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Berbisik ragu sambil menyodorkan penghapus) N-nih... kalau butuh. Kamu murid baru yang dari kota itu, kan?', next: 'o2_6' }),
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
];
