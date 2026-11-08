import type { Route, Stats } from '../../types';

export type EndingInput = {
  route: Route;
  flags: string[];
  stats: Stats;
  focus: number;
  relationships: Record<string, number>;
};

export type Ending = {
  // v0.15.0: + neutral_lost / neutral_won — dua SECRET BAD ENDING rute netral
  // (pertarungan rahasia di gang belakang pada hari kelulusan, laporan doc
  // "SUB-CABANG 1B: SECRET ENDING ROUTE").
  id: 'true' | 'bitter' | 'bad' | 'neutral' | 'neutral_lost' | 'neutral_won';
  title: string;
  summary: string;
  lesson: string;
};

// Canon GARIS MERAH (v0.11.0, diperluas v0.15.0 sesuai laporan): route +
// CHOICE 3 + SECRET CHOICE di gerbang menentukan ending.
//   neutral (keluar gerbang)          → "Lulus Tanpa Nama"
//   neutral + kalah secret battle     → "Bonyok Tanpa Nama"      (secret)
//   neutral + menang secret battle    → "Kemenangan Terlambat"   (secret)
//   bad                               → "Tunduk Pada Kekuasaan"  (Choice 2)
//   resistance + restrained_bimo      → "Lulus Bersama"          (Choice 3)
//   resistance + brutal_bimo          → "Rantai Dendam"          (Choice 3)
// Stats color nothing structurally — they are reported back to the player
// on the ending screen.
export function resolveEnding(input: EndingInput): Ending {
  if (input.route === 'bad') {
    return {
      id: 'bad',
      title: 'Tunduk Pada Kekuasaan',
      summary:
        'Ren menerima tawaran Bimo dan menjadi eksekutor geng — kekerasan dipakai untuk memalak murid lain demi mempertahankan posisi. Aris menatapnya dengan rasa takut yang sama seperti saat melihat Bimo. Kelulusan tiba dengan nilai tinggi, tetapi Ren lulus sebagai pemimpin geng baru pengganti Bimo: terjebak dalam lingkaran kriminalitas sekolah yang dulu ia janjikan tidak akan ia masuki.',
      lesson: 'Memilih jalan aman dengan menginjak orang lain bukan menyelamatkan diri — itu menyerahkan siapa dirimu pada sistem.',
    };
  }
  // Secret branch first: kedua flag ini hanya bisa ada di rute neutral
  // (secret battle hanya terpicu dari beat ch4_neu_secret), tapi cek flag
  // lebih dulu agar urutan resolusi tidak bergantung pada route.
  if (input.flags.includes('secret_fought_lost')) {
    return {
      id: 'neutral_lost',
      title: 'Bonyok Tanpa Nama',
      summary:
        'Ren mendatangi gang belakang pada hari kelulusan dan menantang seluruh geng Bimo sendirian. Kalah jumlah dan bertarung dengan amarah buta, ia tersungkur di tanah berdarah — map ijazahnya yang bersih robek dan terinjak-injak. Nilai sempurna tak berarti apa-apa di lumpur gang itu: Ren tetap bukan siapa-siapa di Yuson.',
      lesson: 'Menebus penyesalan dengan nekat bukanlah keberanian — itu amarah yang mencari panggung.',
    };
  }
  if (input.flags.includes('secret_fought_won')) {
    return {
      id: 'neutral_won',
      title: 'Kemenangan Terlambat',
      summary:
        'Ren menumbangkan seluruh geng Bimo di gang belakang — dan tepat saat ia berdiri menang, sirine polisi mengepung gang. Tidak ada rekaman OSIS yang mengiringinya; Siti hanya memanasi. Di hari kelulusan, Ren resmi jadi pemicu utama tawuran: borgol menggantikan ijazah, dan Aris tak akan pernah kembali ke sekolah ini.',
      lesson: 'Kebenaran yang datang terlambat dan dengan cara yang salah hanya merusak — dirimu dan orang yang ingin kamu tebus.',
    };
  }
  if (input.route === 'neutral') {
    return {
      id: 'neutral',
      title: 'Lulus Tanpa Nama',
      summary:
        'Ren menang sesuai rencana: nilai sempurna, tanpa bekas luka, tanpa panggilan kepolisian — bahkan Bimo tidak pernah mengingat namanya. Aris mengundurkan diri dan menghilang; Siti berlalu dengan anggukan dingin. Di gerbang saat kelulusan, Ren berdiri sendirian: selamat secara akademis, tetapi kehilangan sesuatu yang tidak bisa digantikan ijazah.',
      lesson: 'Melindungi diri sampai tidak menyisakan siapa pun di sampingmu adalah cara selamat yang paling sunyi.',
    };
  }
  if (input.flags.includes('restrained_bimo')) {
    return {
      id: 'true',
      title: 'Lulus Bersama',
      summary:
        'Ren menumbangkan seluruh geng Bimo di gang belakang — lalu, di puncak amarahnya, memilih menahan emosi dan membiarkan hukum bekerja. Siti keluar dari persembunyiannya membawa polisi dan rekaman lengkap pemerasan itu. Bimo dan pengikutnya ditangkap serta dikeluarkan dari SMA Yuson. Pada hari kelulusan, Ren keluar lewat gerbang bersama Aris dan Siti — tanpa kehilangan hatinya.',
      lesson: 'Kemenangan sejati bukan menghancurkan penindas, tapi berhenti menjadi seperti dia.',
    };
  }
  return {
    id: 'bitter',
    title: 'Rantai Dendam',
    summary:
      'Ren gelap mata: Bimo dipukuli brutal sampai kritis dan dilarikan ke rumah sakit. Keluarga Bimo melaporkan Ren atas penganiayaan berat, dan rekaman OSIS tidak bisa menyelamatkannya dari main hakim sendiri. Ren ditangkap di halaman sekolah, resmi dikeluarkan, dan nilai sempurnanya melayang — sementara Aris dan Siti menatap kecewa dari balik pagar.',
    lesson: 'Dalam melawan monster, amarah bisa mengubah seseorang menjadi monster yang sama mengerikannya.',
  };
}
