import type { Route, Stats } from '../../types';

export type EndingInput = {
  route: Route;
  flags: string[];
  stats: Stats;
  focus: number;
  relationships: Record<string, number>;
};

export type Ending = {
  id: 'true' | 'bitter' | 'bad' | 'neutral';
  title: string;
  summary: string;
  lesson: string;
};

// Canon GARIS MERAH (v0.11.0): route + CHOICE 3 menentukan ending.
//   neutral    → "Lulus Tanpa Nama"          (Choice 1: abaikan Aris)
//   bad        → "Tunduk Pada Kekuasaan"     (Choice 2: terima tawaran Bimo)
//   resistance + restrained_bimo → "Lulus Bersama"   (Choice 3: tahan emosi)
//   resistance + brutal_bimo     → "Rantai Dendam"   (Choice 3: hajar brutal)
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
