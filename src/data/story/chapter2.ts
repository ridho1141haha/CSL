import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAB 2 — "Kesalahan Kecil Aris" (jalur tangga belakang → kantin, CHOICE 1)
// Aris tersandung, air tumpah, CHOICE 1: bantu (ACTION) / diam (NEUTRAL).
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const CHAPTER2_NODES: DialogueNode[] = [
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
];
