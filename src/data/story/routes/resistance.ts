import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// RUTE RESISTANCE — doc Chapter 9 (Taktik OSIS & Penyanderaan) &
// Chapter 10 (Duel Final Gang Belakang + FLAVOR CHOICE 5 + CHOICE 3)
// ============================================================================

export const RESISTANCE_NODES: DialogueNode[] = [
    N({ id: 'ch4_res_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ruang Kelas 12-B menuju Ruang OSIS. Menjelang Ujian Akhir, bangku Aris kosong. Di laci mejanya tertinggal kacamata Aris bersama kertas kusut: "Temen belajar lo nunggu di gang belakang kantin — Bimo."', next: 'ch4_res_2' }),
    N({ id: 'ch4_res_2', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Menunjukkan kertas ancaman kepada Siti) Bimo nyekap Aris di gang belakang. Dia sengaja mancing gue ke sana.', cam: 'close_speaker', next: 'ch4_res_3' }),
    N({ id: 'ch4_res_3', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Dia pasti kalap gara-gara lo tolak di rooftop kemarin. Tapi ini celah buat kita, Ren. Biar gue ngumpet di balkon atas bawa kamera OSIS — gue rekam semua kelakuan mereka biar polisi punya bukti kuat.', cam: 'close_speaker', effects: [{ k: 'quest', id: 'find_aris', state: 'active' }, { k: 'notify', text: 'Quest baru: Aris Tidak Pulang' }, { k: 'save' }], next: 'ch4_res_4' }),
    N({ id: 'ch4_res_4', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Oke. Tapi tahan dulu polisinya sampai gue beresin kroco-kroconya dan narik Aris keluar. Kalau polisi keburu masuk, takutnya Aris yang diapa-apain.', end: true }),
    // ---- Penyanderaan di gang belakang kantin (hujan gerimis) ----
    N({ id: 'ch4_res_alley', speaker: 'NARATOR', portrait: 'narrator', text: 'Gang sempit belakang kantin, hujan gerimis. Anak buah Bimo mengepung Aris di tengah gang. Bimo berdiri di belakang, santai.', next: 'ch4_res_alley_2' }),
    N({ id: 'ch4_res_alley_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Lo terus sok pahlawan. Nah, sekarang tunjukin. Pahlawan biasanya datang tepat waktu.', next: 'ch4_res_alley_3' }),
    N({ id: 'ch4_res_alley_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Dari balkon atas, kamera OSIS di tangan Siti mulai merekam seluruh kejadian sebagai bukti hukum.', next: 'ch4_res_alley_4' }),
    N({ id: 'ch4_res_alley_4', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Dari semua alasan untuk tidak ikut campur — tidak ada satu pun yang berdiri di sini.', next: '__combat__' }),
    // ---- Anak buah tumbang → FINAL BOSS: Ren vs Bimo ----
    N({ id: 'ch4_res_goons_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren berhasil menumbangkan seluruh sisa anak buah Bimo hingga Aris bisa menepi ke tempat aman. Kini tersisa duel sengit satu lawan satu antara Ren melawan Bimo.', effects: [{ k: 'beat', id: 'ch4_res_bimo' }], next: 'ch4_res_goons_win_2' }),
    N({ id: 'ch4_res_goons_win_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Dua kali anak buah gue lo tumbangin. Gue pikir lo cuma beruntung. Sekarang giliran gue mastiin.', next: 'ch4_fc5' }),
    // FLAVOR CHOICE 5: Gertakan Sebelum Duel Final
    N({
      id: 'ch4_fc5',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '(Hujan gerimis membasahi gang belakang. Bimo berdiri di hadapan Ren.)',
      choices: [
        {
          id: 'duel_langsung',
          text: '[A] Langsung menantang.',
          next: 'ch4_fc5a',
        },
        {
          id: 'duel_aris_dulu',
          text: '[B] Utamakan keselamatan Aris.',
          next: 'ch4_fc5b',
        },
      ],
    }),
    N({ id: 'ch4_fc5a', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Udah abis kan anak buah lo? Sekarang giliran lo, Bimo.', next: 'ch4_fc5a2' }),
    N({ id: 'ch4_fc5a2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Meringis, mengepalkan tangan) Belagu banget lo! Sini maju kalau udah bosen hidup!', next: '__combat__' }),
    N({ id: 'ch4_fc5b', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Urusan lo sama gue. Suruh Aris cabut dulu, baru kita beresin.', next: 'ch4_fc5b2' }),
    N({ id: 'ch4_fc5b2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Tertawa mengejek) Enak aja! Justru dia gue simpen buat penutup abis gue bikin lo rata sama tanah!', next: '__combat__' }),
    // ---- CHOICE 3 (PENENTU GOOD / BAD ENDING 2) ----
    N({
      id: 'ch4_res_choice',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: 'Pukulan telak Ren mengenai rahang Bimo, membuatnya tergeletak tidak berdaya di tanah. Amarah Ren berada di puncak.',
      choices: [
        {
          id: 'restrain_bimo',
          text: '[A] Tahan emosi & biarkan hukum bekerja.',
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
          text: '[B] Kehilangan kendali / balas dendam.',
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
