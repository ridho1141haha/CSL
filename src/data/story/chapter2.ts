import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAB 2 — "Kesalahan Kecil Aris" (doc CHAPTER 5, CHOICE 1 & FIGHT 1 — versi terbaru)
// ============================================================================

export const CHAPTER2_NODES: DialogueNode[] = [
    N({ id: 'ch2_intro_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Lorong tangga menuju kantin belakang, siang hari saat jam istirahat. Dari arah berlawanan, dua anak geng kepercayaan Bimo berjalan santai.', next: 'ch2_intro_2' }),
    N({ id: 'ch2_intro_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Aris berjalan terburu-buru membawa tumpukan buku dan botol minuman.', next: 'ch2_intro_3' }),
    N({ id: 'ch2_intro_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Aris tersandung, botol minumnya terlepas dan menumpahkan air tepat ke sepatu salah satu anak geng Bimo. Buku-buku catatan Aris berserakan di tangga yang basah.', next: 'ch2_intro_4' }),
    N({ id: 'ch2_intro_4', speaker: 'ANAK GENG A', portrait: 'gang', emotion: 'tense', text: 'Woy! Jalan pake mata dong, buta lo?! (Menendang tumpukan buku Aris sampai kotor)', next: 'ch2_intro_5' }),
    N({ id: 'ch2_intro_5', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Pucat pasi, berlutut gemetaran) M-maaf… sumpah aku gak sengaja!', next: 'ch2_intro_6' }),
    N({ id: 'ch2_intro_6', speaker: 'ANAK GENG B', portrait: 'gang', emotion: 'tense', text: '(Mencengkeram kerah baju Aris hingga terangkat) Sepatu baru nih! Lo kira minta maaf doang bikin kering?! Tarik ke belakang kantin sekarang!', next: 'ch2_choice' }),
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
    // ---- [A] mengabaikan → RUTE NEUTRAL ----
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
    // ---- [B] menolong → FIGHT 1 (tangga samping) → RUTE AKSI ----
    N({ id: 'ch2_fight_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Ren menghela napas panjang. Janji dirinya untuk "tidak ikut campur" runtuh saat melihat catatan Aris diinjak. Ren melangkah keluar dari balik pilar dengan raut wajah datar. "Lepasin kerahnya."', next: 'ch2_fight_1b' }),
    N({ id: 'ch2_fight_1b', speaker: 'ANAK GENG B', portrait: 'gang', emotion: 'tense', text: '(Menoleh kaget, lalu tertawa mengejek) Lah, siapa nih? Anak baru mau sok jadi pahlawan?', next: 'ch2_fight_1c' }),
    N({ id: 'ch2_fight_1c', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Cuma kecipratan air doang. Gak usah lebay pake nyeret orang segala.', next: 'ch2_fight_2' }),
    N({ id: 'ch2_fight_2', speaker: 'ANAK GENG A', portrait: 'gang', emotion: 'tense', text: 'Banyak bacot lo! (Melayangkan pukulan mentah ke arah wajah Ren)', next: '__combat__' }),
    N({ id: 'ch2_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren tidak panik. Insting bertarung dari sekolah lamanya kembali bekerja. Dengan gerakan efisien, Ren menepis pukulan, menangkap pergelangan tangan Anak Geng A, memutarnya pelan hingga meringis, lalu menghempaskannya ke dinding.', next: 'ch2_win_2' }),
    N({ id: 'ch2_win_2', speaker: 'ANAK GENG B', portrait: 'gang', emotion: 'tense', text: '(Mundur ketakutan, melepaskan kerah baju Aris) Tunggu pembalasan kita! Gue aduin ke Bimo habis lo! (Kedua anak geng ngacir pergi)', next: 'ch2_win_3' }),
    N({ id: 'ch2_win_3', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: '(Gemetaran sambil memungut catatannya) R-Ren… kok kamu nekat banget nolongin aku? Mereka itu anak buahnya Bimo…', next: 'ch2_win_4' }),
    N({ id: 'ch2_win_4', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: '(Membantu merapikan buku Aris) Kalau lo kenapa-kenapa, siapa yang minjemin gue catatan Fisika? Udah, beresin bukunya. Balik ke kelas.', next: 'ch2_win_5' }),
    N({ id: 'ch2_win_5', speaker: 'NARATOR', portrait: 'narrator', text: 'Tapi ada satu pasang mata yang tidak pura-pura sibuk. Dari ujung lorong, Bimo melipat tangannya — mencatat setiap gerakan Ren tadi.', next: 'ch2_win_6' }),
    N({ id: 'ch2_win_6', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Tidak buruk.', effects: [{ k: 'flag', id: 'bimo_impressed' }], next: 'ch2_close' }),
    N({ id: 'ch2_close', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gue gak nyari ini. Masalah yang nyari gue. Sejak kapan insting lama gue balik lagi...?', effects: [{ k: 'stat', stat: 'violence', delta: 3 }, { k: 'stat', stat: 'reputation', delta: 6 }, { k: 'chapter', id: 3 }, { k: 'beat', id: 'ch3_osis' }, { k: 'time', minutes: 245 }, { k: 'notify', text: 'Kabar menyebar cepat. (Reputasi meningkat)' }, { k: 'save' }], end: true }),
];
