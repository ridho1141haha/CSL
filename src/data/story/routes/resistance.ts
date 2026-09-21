import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// RUTE RESISTANCE — montase, penyanderaan gang, goons fight, FINAL BOSS, CHOICE 3
// ch4_res_1..4 montase, ch4_res_alley penyanderaan, ch4_res_goons_win, ch4_res_choice.
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const RESISTANCE_NODES: DialogueNode[] = [
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
];
