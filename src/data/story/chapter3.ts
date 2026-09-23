import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// BAB 3 — montase OSIS, sergapan parkiran [FIGHT 2], penawaran rooftop (CHOICE 2)
// ch3_osis (Siti koridor), ch3_f2 (parkiran), ch3_intro (rooftop).
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const CHAPTER3_NODES: DialogueNode[] = [
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
    N({ id: 'ch3_intro_5', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Kedua... lo terus sok pahlawan, dan hidup lo di sini bakal gue bikin kayak neraka.', cam: 'close_speaker', next: 'ch3_fc4' }),
    // v0.15.0 — FLAVOR CHOICE 4 (doc: "Respons Atas Ultimatum Bimo", rute aksi)
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
    N({ id: 'ch3_fc4a', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Ternyata penguasa Yuson cuma bisa ngancam anak baru.', cam: 'ren_ots', next: 'ch3_fc4a2' }),
    N({ id: 'ch3_fc4a2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Tertawa sinis) Bukan ngancam, Ren. Gue cuma ngasih tahu realita sekolah ini. Dan pilihan lo bakal nentuin nasib lo di sini.', cam: 'close_speaker', next: 'ch3_choice' }),
    N({ id: 'ch3_fc4b', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Gue ke sini cuma butuh ijazah, bukan tahta sekolah.', cam: 'ren_ots', next: 'ch3_fc4b2' }),
    N({ id: 'ch3_fc4b2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Mata menyempit, tersenyum dingin) Niat yang bagus. Tapi di Yuson, lo enggak bisa dapat ijazah tanpa izin dari gue. Makanya dengerin baik-baik pilihan lo.', cam: 'close_speaker', next: 'ch3_choice' }),
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
    // ============================================================
    // BAB 4 — RUTE RESISTANCE (GARIS MERAH): klimaks gang belakang.
    // Penyanderaan Aris + taktik OSIS → FIGHT 3 FINAL BOSS (Ren vs
    // Bimo) → CHOICE 3 → GOOD "Lulus Bersama" / BAD 2 "Rantai Dendam".
    // ============================================================
    N({ id: 'ch3_reject_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '...Lo tahu, orang yang nolak gue jarang bisa bilang dua kali. Tapi baiklah. Gue kira lo beda. Salah, mungkin.', cam: 'close_speaker', next: 'ch3_reject_2' }),
    N({ id: 'ch3_reject_2', speaker: 'REN', portrait: 'ren', emotion: 'calm', text: 'Gue cuma mau lulus. Kalau itu jadi masalah buat lo — itu masalah lo.', cam: 'ren_ots', effects: [{ k: 'chapter', id: 4 }, { k: 'beat', id: 'ch4_res_search' }, { k: 'scene', id: 'campus' }, { k: 'time', minutes: 1500 }, { k: 'notify', text: 'Lo nolak Bimo. Dia enggak akan lupa.' }, { k: 'save' }], end: true }),
];
