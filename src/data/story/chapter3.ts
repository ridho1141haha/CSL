import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAB 3 — doc Chapter 6 (Pendekatan OSIS), Chapter 7 (Parkiran FIGHT 2),
// Chapter 8 (Ultimatum Bimo di Rooftop + FLAVOR CHOICE 4 + CHOICE 2)
// ============================================================================

export const CHAPTER3_NODES: DialogueNode[] = [
    // ---- Chapter 6 (Aksi): Pendekatan OSIS (Siti) ----
    N({ id: 'ch3_osis_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Perpustakaan sekolah. Siti menghampiri Ren di dekat rak buku — langkah mantap, tanpa basa-basi.', next: 'ch3_osis_2' }),
    N({ id: 'ch3_osis_2', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Denger-denger lu beneran ngehajar anak buahnya Bimo di tangga kemarin?', next: 'ch3_osis_3' }),
    N({ id: 'ch3_osis_3', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Mereka duluan yang nyari ribut. Gue cuma belain buku catatan gue.', next: 'ch3_osis_4' }),
    N({ id: 'ch3_osis_4', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'Nekat juga lu. Satu tongkrongan Bimo udah mulai panas gara-gara itu. Tapi jujur… baru kali ini ada yang berani pasang badan di Yuson.', next: 'ch3_osis_5' }),
    N({ id: 'ch3_osis_5', speaker: 'SITI', portrait: 'siti', emotion: 'firm', text: 'OSIS sebenernya udah lama ngumpulin bukti kasus mereka. Kalau suatu saat lu butuh back-up data, bilang ke gue.', next: 'ch3_osis_6' }),
    N({
      id: 'ch3_osis_6',
      speaker: 'NARATOR',
      portrait: 'narrator',
      text: 'Anak geng Bimo mulai menteror aktivitas belajar Ren dan Aris — meja dicoret-coret, buku tugas disembunyikan, dan murid lain dilarang satu kelompok dengan mereka.',
      effects: [
        { k: 'quest', id: 'gang_ambush', state: 'active' },
        { k: 'beat', id: 'ch3_parking' },
        { k: 'notify', text: 'Tujuan: Lewati area parkir' },
        { k: 'save' },
      ],
      end: true,
    }),
    // ---- Chapter 7 (Aksi): Cegatan Parkiran Motor Tua [FIGHT 2] ----
    N({ id: 'ch3_f2_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Parkiran motor tua belakang sekolah, sore hari pas jam pulang. Letnan Geng Bimo bersama dua anak buahnya menghadang Ren dan Aris.', next: 'ch3_f2_2' }),
    N({ id: 'ch3_f2_2', speaker: 'LETNAN GENG', portrait: 'gang', emotion: 'tense', text: 'Oh, jadi ini anak baru yang belagu kemarin? Sikat, lah!', next: 'ch3_f2_3' }),
    N({ id: 'ch3_f2_3', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren menyuruh Aris mundur ke balik tembok, lalu bersiap menghadapi mereka di ruang parkiran yang sempit.', next: '__combat__' }),
    N({ id: 'ch3_f2_win', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren memanfaatkan ruang parkiran yang sempit untuk menjatuhkan mereka satu per satu secara tenang.', next: 'ch3_f2_win_2' }),
    N({ id: 'ch3_f2_win_2', speaker: 'LETNAN GENG', portrait: 'gang', emotion: 'tense', text: '(Tersungkur meringis) Gila, cara berantemnya… pantesan Bimo ngelirik lo terus.', next: 'ch3_f2_win_3' }),
    N({
      id: 'ch3_f2_win_3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '(Dua kali. Kata itu nempel di kepala gue. Bimo ngelirik terus — dan kalau dia udah turun tangan sendiri, urusannya gak bakal sepele.)',
      effects: [
        { k: 'quest', id: 'gang_ambush', state: 'completed' },
        { k: 'quest', id: 'rooftop_meeting', state: 'active' },
        { k: 'notify', text: 'Tujuan: Temui Bimo — lewat tangga belakang' },
        { k: 'save' },
      ],
      end: true,
    }),
    // ---- Chapter 8 (Aksi): Ultimatum Bimo di Rooftop (CHOICE 2) ----
    N({ id: 'ch3_intro_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Sepulang sekolah, Bimo memanggil Ren ke atap gedung.', next: 'ch3_intro_2' }),
    N({ id: 'ch3_intro_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Atap sekolah (Rooftop), sore hari berangin. Bimo berdiri bersandar di pagar pembatas atap, menatap Ren dengan santai.', next: 'ch3_intro_3' }),
    N({ id: 'ch3_intro_3', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Udah dua kali anak buah gue lo bikin keok. Gue juga udah denger cerita lo di sekolah lama. Cara lo berantem tenang... gak asal ngamuk kayak preman pasar. Gue kasih lo dua pilihan.', cam: 'medium_speaker', next: 'ch3_intro_4' }),
    N({ id: 'ch3_intro_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Pertama: gabung sama gue, pegang kendali bareng gue di Yuson, dan gue jamin gak ada yang bakal berani ngusik fokus belajar lo sampe lulus.', cam: 'close_speaker', next: 'ch3_intro_5' }),
    N({ id: 'ch3_intro_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kedua... lo tetep keras kepala pasang badan buat si kacamata itu, dan gue pastiin lo gak bakal pernah bisa napas tenang di sekolah ini.', cam: 'close_speaker', next: 'ch3_fc4' }),
    // FLAVOR CHOICE 4: Respons Atas Ultimatum Bimo
    N({
      id: 'ch3_fc4',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '(Dua penawaran. Nol pilihan yang enak.)',
      cam: 'ren_ots',
      choices: [
        {
          id: 'ultimatum_sinis',
          text: '[A] Sikap sinis.',
          next: 'ch3_fc4a',
        },
        {
          id: 'ultimatum_tenang',
          text: '[B] Tetap tenang & lugas.',
          next: 'ch3_fc4b',
          effects: [{ k: 'stat', stat: 'diplomacy', delta: 1 }],
        },
      ],
    }),
    N({ id: 'ch3_fc4a', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Segitu doang ternyata bos Yuson? Bisanya cuma ngancem?', cam: 'ren_ots', next: 'ch3_fc4a2' }),
    N({ id: 'ch3_fc4a2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Tertawa sinis) Gue gak ngancem, Ren. Gue cuma ngasih tau aturan main di sini. Tinggal lo pilih mau selamat apa enggak.', cam: 'close_speaker', next: 'ch3_choice' }),
    N({ id: 'ch3_fc4b', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Gue pindah ke sini cuma nyari ijazah, Bimo. Bukan nyari tongkrongan.', cam: 'ren_ots', next: 'ch3_fc4b2' }),
    N({ id: 'ch3_fc4b2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Mata menyempit, tersenyum dingin) Simpel. Gue suka gaya lo. Masalahnya, di Yuson lo gak bakal bisa lulus dengan tenang tanpa restu gue. Jadi mending pikirin baik-baik.', cam: 'close_speaker', next: 'ch3_choice' }),
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
    N({ id: 'ch3_accept_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Pilihan yang benar. Lo gak akan nyesal. Semua yang butuh dilindungi — bakal terlindungi.', cam: 'close_speaker', next: 'ch3_accept_2' }),
    N({ id: 'ch3_accept_2', speaker: 'REN', portrait: 'ren', emotion: 'dark', text: 'Hanya sampai lulus. Hanya sampai gue punya jalan keluar. Begitu kata gue, waktu itu.', cam: 'ren_ots', effects: [{ k: 'stat', stat: 'violence', delta: 5 }, { k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_bad_warehouse' }, { k: 'scene', id: 'campus' }, { k: 'save' }], end: true }),
    N({ id: 'ch3_reject_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Lo tahu, orang yang nolak gue jarang bisa bilang dua kali. Tapi baiklah. Gue kira lo beda. Salah, mungkin.', cam: 'close_speaker', next: 'ch3_reject_2' }),
    N({ id: 'ch3_reject_2', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Gue cuma mau lulus. Kalau itu jadi masalah buat lo — itu masalah lo.', cam: 'ren_ots', effects: [{ k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_res_search' }, { k: 'scene', id: 'campus' }, { k: 'time', minutes: 1500 }, { k: 'notify', text: 'Lo nolak Bimo. Dia enggak akan lupa.' }, { k: 'save' }], end: true }),
];
