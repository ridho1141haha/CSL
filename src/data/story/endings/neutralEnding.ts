import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// NEUTRAL ENDING (v0.15.0 — mengikuti doc CH10 & EPILOG, termasuk SECRET
// CHOICE POINT): kelulusan di gerbang → konfrontasi Siti (dialog penuh) →
// TIDAK ada popup: pemain mengontrol Ren dengan KAKI (beat ch4_neu_secret):
//   keluar lewat gerbang (zona street) → ch4_neu_out_*  → NEUTRAL ENDING
//     "LULUS TANPA NAMA" (standard)
//   balik ke gang belakang (zona back_alley) → ch4_neu_secret_* →
//     [PERTARUNGAN RAHASIA: Ren vs seluruh geng Bimo] (encounter secret_fight)
//     kalah → ch4_neu_sbl_* → SECRET BAD ENDING A "Bonyok Tanpa Nama"
//     menang → ch4_neu_sbw_* → SECRET BAD ENDING B "Kemenangan Terlambat"
// Tiga rantai TERPISAH (test/storyStructure: endgame isolation per rantai).
// ============================================================================

export const NEUTRAL_ENDING_NODES: DialogueNode[] = [
    // ---- Konfrontasi kelulusan (gerbang utama, hari kelulusan) ----
    N({ id: 'ch4_neu_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gerbang utama SMA Yuson. Hari kelulusan. Pengumuman dipajang — nama Ren berada di urutan pertama dengan nilai tertinggi se-Yuson.', next: 'ch4_neu_grad_2' }),
    N({ id: 'ch4_neu_grad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Saat murid lain bersuka cita, Ren berjalan menuju gerbang sendirian, memegang ijazah. Tiba-tiba Siti melangkah mendekat, memotong jalan Ren.', next: 'ch4_neu_grad_4' }),
    N({ id: 'ch4_neu_grad_4', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: 'Selamat ya, Ren. Nilai teratas se-Yuson. Hebat lu.', next: 'ch4_neu_grad_5' }),
    N({ id: 'ch4_neu_grad_5', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Makasih, Siti.', next: 'ch4_neu_grad_6' }),
    N({ id: 'ch4_neu_grad_6', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: 'Oiya, lu tahu enggak? Di gang belakang kantin, Bimo sama segerombolan gengnya masih nongkrong di sana. Lagi malakin anak-anak kelas 10 buat "pesta kelulusan" mereka.', next: 'ch4_neu_grad_7' }),
    N({ id: 'ch4_neu_grad_7', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: 'Tapi yah... ngapain juga gue ngomong gini ke lu, kan? Dari dulu lu kan emang cowok penakut yang cuma bisa merem dan ngibrit pura-pura enggak lihat. Mending lu buru-buru keluar gerbang sana, simpan nilai sempurna lu itu baik-baik.', next: 'ch4_neu_grad_8' }),
    N({
      id: 'ch4_neu_grad_8',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '...',
      effects: [
        { k: 'beat', id: 'ch4_neu_secret' },
        { k: 'notify', text: 'Pilihan ada di kaki lo: keluar gerbang... atau balik ke gang belakang kantin.' },
        { k: 'save' },
      ],
      end: true,
    }),
    // ---- SUB-CABANG 1A: STANDARD NEUTRAL ENDING — "LULUS TANPA NAMA" ----
    N({ id: 'ch4_neu_out_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren memilih mengabaikan sindiran Siti. Ia mempererat pegangan pada map ijazahnya dan terus berjalan melewati gerbang utama SMA Yuson — tanpa menoleh belakang.', next: 'ch4_neu_out_2' }),
    N({
      id: 'ch4_neu_out_2',
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
    // ---- SUB-CABANG 1B: SECRET BATTLE — gang belakang kantin ----
    N({ id: 'ch4_neu_secret_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gang belakang kantin. Bimo berdiri bersama enam sampai delapan anggota gengnya — anak-anak kelas 10 yang tadi jadi korban sudah kabur. Ren datang sendirian, tanpa OSIS, tanpa guru, tanpa polisi.', next: 'ch4_neu_secret_2' }),
    N({ id: 'ch4_neu_secret_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Woy, si anak pinter. Ngapain lu ke sini? Mau bagi-bagi ijazah?', next: 'ch4_neu_secret_3' }),
    N({ id: 'ch4_neu_secret_3', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Melempar tasnya ke tanah, menggulung lengan kemeja) Gue cuma mau selesaikan yang tertunda.', next: 'ch4_neu_secret_4' }),
    N({ id: 'ch4_neu_secret_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Kekeh) Sok jagoan lu! Hajar!', next: '__combat__' }),
    // ---- HASIL 2 (menang): SECRET BAD ENDING B — "Kemenangan Terlambat" ----
    N({ id: 'ch4_neu_sbw_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Yang terakhir dari geng itu tumbang. Bimo tersungkur babak belur di depan kaki Ren — tepat saat sirine polisi dan langkah guru-guru mengepung ujung gang.', next: 'ch4_neu_sbw_2' }),
    N({ id: 'ch4_neu_sbw_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Tidak ada rekaman OSIS yang mengiringi malam ini. Siti tidak melapor — dia hanya memanasi. Yang polisi lihat sederhana: murid baru memulai tawuran di hari kelulusan.', next: 'ch4_neu_sbw_3' }),
    N({ id: 'ch4_neu_sbw_3', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Menatap Ren dari jauh, di balik garis polisi — berbisik) Terlambat, Ren. Lu meluapkan ego lu di waktu yang salah.', next: 'ch4_neu_sbw_4' }),
    N({
      id: 'ch4_neu_sbw_4',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue menang perkelahian ini. Bimo tumbang di kaki gue. Tapi saat borgol besi melingkar di tangan gue tepat di hari kelulusan... gue sadar. Amarah yang terlambat ini cuma ngerusak masa depan gue tanpa bisa mengembalikan Aris ke sekolah ini lagi.',
      effects: [
        { k: 'flag', id: 'secret_fought_won' },
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
    // ---- HASIL 1 (kalah): SECRET BAD ENDING A — "Bonyok Tanpa Nama" ----
    N({ id: 'ch4_neu_sbl_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Kalah jumlah dan bertarung dengan amarah buta — Ren dikeroyok habis-habisan dan tersungkur di tanah berdarah. Map ijazahnya yang bersih robek dan kotor terinjak-injak di tanah.', next: 'ch4_neu_sbl_2' }),
    N({ id: 'ch4_neu_sbl_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Meludah ke tanah) Pinter doang, tapi gokil lu nekat. Dah, cabut guys!', next: 'ch4_neu_sbl_3' }),
    N({
      id: 'ch4_neu_sbl_3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue kehilangan segalanya dalam hitungan menit. Nilai sempurna gue terinjak di lumpur, tubuh gue babak belur, dan rasa hormat yang mau gue tebus... melayang gitu aja. Gue tetap bukan siapa-siapa di Yuson.',
      effects: [
        { k: 'flag', id: 'secret_fought_lost' },
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
];
