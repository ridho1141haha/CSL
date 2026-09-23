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
    // v0.15.0 — FLAVOR CHOICE 1 (doc: "Perkenalan dengan Aris"): dua opsi
    // perkenalan; tidak mengubah rute, hanya rasa relasi (+rel aris).
    N({ id: 'o2_5', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Berbisik ragu sambil menyodorkan penghapus) N-nih... barangkali lu butuh. Eh... kamu murid baru yang dari kota itu, kan?', next: 'o2_c1' }),
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
    N({ id: 'o2_6a', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Sip, makasih ya. Panggil aja Ren.', next: 'o2_7a' }),
    N({ id: 'o2_7a', speaker: 'ARIS', portrait: 'aris', emotion: 'neutral', text: 'Gue Aris. Santai aja, Bro. Kalau nanti catatan Pak Budi ada yang kelewat, contek gue aja, masih lengkap kok.', next: 'o2_8' }),
    N({ id: 'o2_6b', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Makasih, Ris. Pas banget, pensil gue gampang salah nulis dari tadi. Gue Ren.', next: 'o2_7b' }),
    N({ id: 'o2_7b', speaker: 'ARIS', portrait: 'aris', emotion: 'warm', text: '(Tersenyum tipis, agak lega) Sama-sama, Ren. Santai aja, kalau catatan Pak Budi ada yang kelewat, contek gue aja, masih lengkap kok.', next: 'o2_8' }),
    N({ id: 'o2_8', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Satu bangku di sudut, satu teman sebangku yang takut sama sekolahnya sendiri. Tahun ini gue cuma butuh dua hal itu.', next: 'o3_1' }),
    // ---- Scene 3: Peringatan Pertama di Lorong ----
    N({ id: 'o3_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Waktu istirahat. Ren menuju kantin. Di lorong, Siti — Ketua OSIS — sedang mencatat nama-nama murid yang membolos. Saat Ren melintas, Siti memperhatikannya.', next: 'o3_2' }),
    N({ id: 'o3_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Lu murid baru yang nilai transfernya tinggi itu, kan? Ren?', next: 'o3_3' }),
    N({ id: 'o3_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Iya.', next: 'o3_4' }),
    N({ id: 'o3_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Saran aja nih. Kalau habis jam sekolah, mending langsung pulang. Jangan pernah nongkrong di gang belakang kantin, terus kalau pas liat ada yang rusuh di halaman... langsung aja buruan balik kanan. Sekolah kita ini modelannya nggak bakal repot-repot belain anak baru kayak lu.', next: 'o3_c2' }),
    // v0.15.0 — FLAVOR CHOICE 2 (doc: "Respons Atas Peringatan Siti")
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
    N({ id: 'o3_7a', speaker: 'SITI', portrait: 'siti', emotion: 'neutral', text: 'Bagus kalau lu paham. Tapi masalahnya di Yuson, kadang bukan lu yang sengaja nyari gara-gara... tapi gara-gara-nya sendiri yang demen nempel ke lu.', next: 'o4_1' }),
    N({ id: 'o3_6b', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Emang se-parah itu ya aturan main di sini?', next: 'o3_7b' }),
    N({ id: 'o3_7b', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: '(Mengembuskan napas pelan) Parah banget. Makanya gue ingatin, jangan sok pahlawan. Di sini, gara-gara itu yang suka nempel sendiri ke anak-anak polos kayak lu.', next: 'o4_1' }),
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
