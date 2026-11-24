import type { DialogueNode } from '../../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// NEUTRAL ENDING — doc Chapter 10 & Epilog (Neutral + Secret Battle — versi terbaru)
// ============================================================================

export const NEUTRAL_ENDING_NODES: DialogueNode[] = [
    // ---- Konfrontasi Siti di Hari Kelulusan (Gerbang Utama) ----
    N({ id: 'ch4_neu_grad_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gerbang utama SMA Yuson, Hari Kelulusan. Pengumuman kelulusan dipajang. Ren memegang ijazah dengan nilai tertinggi se-Yuson.', next: 'ch4_neu_grad_2' }),
    N({ id: 'ch4_neu_grad_2', speaker: 'NARATOR', portrait: 'narrator', text: 'Saat murid lain bersuka cita, Ren berjalan menuju gerbang sendirian. Tiba-tiba Siti melangkah mendekat, memotong jalan Ren.', next: 'ch4_neu_grad_4' }),
    N({ id: 'ch4_neu_grad_4', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: 'Selamat ya, Ren. Lulusan terbaik se-Yuson. Hebat lu.', next: 'ch4_neu_grad_5' }),
    N({ id: 'ch4_neu_grad_5', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Makasih, Siti.', next: 'ch4_neu_grad_6' }),
    N({ id: 'ch4_neu_grad_6', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Menatap Ren dingin, tersenyum sinis) Oiya, sekadar info aja. Di gang belakang kantin, Bimo sama anak-anaknya masih nongkrong tuh. Lagi malakin anak kelas 10 buat ongkos \'pesta kelulusan\' mereka. Tadinya OSIS mau jebak mereka pake laporan polisi, tapi gagal... soalnya Aris udah cabut, dan gak ada korban lain yang berani jadi saksi.', next: 'ch4_neu_grad_7' }),
    N({ id: 'ch4_neu_grad_7', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: 'Tapi yah... ngapain juga gue curhat ke lu, kan? Dari awal lu kan cuma peduli sama map ijazah di tangan lu itu. Udah sana buruan keluar gerbang, simpen nilai sempurna lu baik-baik.', next: 'ch4_neu_grad_8' }),
    N({
      id: 'ch4_neu_grad_8',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'tense',
      text: '...',
      effects: [
        { k: 'beat', id: 'ch4_neu_secret' },
        { k: 'notify', text: 'Pilihan ada di kaki lo: keluar gerbang... atau putar balik ke gang belakang kantin.' },
        { k: 'save' },
      ],
      end: true,
    }),
    // ---- SUB-CABANG 1A: STANDARD NEUTRAL ENDING — "LULUS TANPA NAMA" ----
    N({ id: 'ch4_neu_out_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren memilih mengabaikan sindiran Siti. Ia mempererat pegangan pada map ijazahnya dan terus berjalan melewati gerbang utama SMA Yuson tanpa menoleh belakang.', next: 'ch4_neu_out_2' }),
    N({
      id: 'ch4_neu_out_2',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Target awal gue tercapai seratus persen. Tapi pas ngelangkah keluar gerbang ini sendirian… gue sadar. Gue emang selamat di SMA Yuson, tapi gue keluar dari tempat ini tanpa punya hati lagi.',
      effects: [
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
    // ---- SUB-CABANG 1B: SECRET ENDING ROUTE (Gang Belakang Kantin) ----
    N({ id: 'ch4_neu_secret_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Gang belakang kantin. Ren datang sendirian tanpa membawa bantuan OSIS, guru, atau polisi. Bimo berdiri bersama enam sampai delapan anggota gengnya yang sedang berkumpul.', next: 'ch4_neu_secret_2' }),
    N({ id: 'ch4_neu_secret_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Wih, si juara umum. Nyasar lo ke sini? Mau pamer ijazah?', next: 'ch4_neu_secret_3' }),
    N({ id: 'ch4_neu_secret_3', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: '(Melempar tasnya ke tanah, menggulung lengan kemeja) Gue ke sini mau bayar utang yang belum lunas.', next: 'ch4_neu_secret_4' }),
    N({ id: 'ch4_neu_secret_4', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Kekeh) Banyak gaya lo! Sikat, guys!', next: '__combat__' }),
    // ---- HASIL 2 (Menang): SECRET BAD ENDING B — "Kemenangan Terlambat" ----
    N({ id: 'ch4_neu_sbw_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren berhasil menumbangkan seluruh anggota geng Bimo termasuk Bimo sendiri. Bimo tersungkur tak berdaya. Tepat saat Ren berdiri mengatur napas, sirine polisi dan guru-guru datang mengepung gang.', next: 'ch4_neu_sbw_2' }),
    N({ id: 'ch4_neu_sbw_2', speaker: 'POLISI', portrait: 'generic', emotion: 'tense', text: 'Jangan bergerak! Angkat tangan kalian semua! (Karena Ren bertindak gegabah sendirian tanpa bukti rekaman OSIS dan saksi korban, Ren dianggap sebagai pemicu utama tawuran di hari kelulusan.)', next: 'ch4_neu_sbw_3' }),
    N({ id: 'ch4_neu_sbw_3', speaker: 'SITI', portrait: 'siti', emotion: 'dark', text: '(Menatap Ren dari jauh di balik garis polisi, berbisik) Telat, Ren. Kemarin waktu Aris butuh, lu diem aja. Sekarang giliran udah gak ada gunanya, lu baru ngamuk.', next: 'ch4_neu_sbw_4' }),
    N({
      id: 'ch4_neu_sbw_4',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue menang berantem hari ini. Bimo tumbang di depan kaki gue. Tapi pas borgol besi ngunci tangan gue tepat di hari kelulusan... gue sadar. Ngamuk belakangan kayak gini cuma ngancurin masa depan gue, dan tetep gak bakal bisa bikin Aris balik ke sekolah ini lagi.',
      effects: [
        { k: 'flag', id: 'secret_fought_won' },
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
    // ---- HASIL 1 (Kalah): SECRET BAD ENDING A — "Bonyok Tanpa Nama" ----
    N({ id: 'ch4_neu_sbl_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Ren dikeroyok habis-habisan oleh seluruh geng Bimo. Karena kalah jumlah dan bertarung dengan amarah buta, Ren tersungkur di tanah babak belur. Map ijazahnya yang bersih robek dan kotor terinjak-injak di tanah.', next: 'ch4_neu_sbl_2' }),
    N({ id: 'ch4_neu_sbl_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: '(Meludah ke tanah) Pinter doang di kelas, taunya nekat bodoh. Dah, cabut guys!', next: 'ch4_neu_sbl_3' }),
    N({
      id: 'ch4_neu_sbl_3',
      speaker: 'REN',
      portrait: 'ren',
      emotion: 'dark',
      text: 'Gue kehilangan semuanya dalam hitungan menit. Nilai sempurna gue keinjek-injek di tanah, badan gue remuk, dan rasa bersalah yang mau gue tebus... nguap gitu aja. Gue tetep bukan siapa-siapa di Yuson.',
      effects: [
        { k: 'flag', id: 'secret_fought_lost' },
        { k: 'quest', id: 'graduation_day', state: 'completed' },
        { k: 'ending' },
      ],
      end: true,
    }),
];
