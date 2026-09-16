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

// Canon: route decides the ending family; the final choice decides TRUE vs
// BITTER within the resistance route. The neutral route (v0.7.0) has its own
// single ending — "Lulus Tanpa Nama". Stats color nothing structurally —
// they are reported back to the player on the ending screen.
export function resolveEnding(input: EndingInput): Ending {
  if (input.route === 'bad') {
    return {
      id: 'bad',
      title: 'Rantai Dendam',
      summary:
        'Ren ditangkap dalam razia gudang dan dikeluarkan dari SMA Yuson. Bimo hilang — dan menyeret nama Ren ke dalam berkas perkara. Kekuasaan yang ia bangun berbalik menjadi rantai yang mengikat dirinya sendiri.',
      lesson: 'Kekerasan yang dijadikan identitas pada akhirnya mengubah seseorang menjadi hal yang dahulu ia lawan.',
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
  if (input.flags.includes('helped_aris_final')) {
    return {
      id: 'true',
      title: 'Kebenaran & Solidaritas',
      summary:
        'Ren memilih membantu Aris. Siti merekam kejahatan geng Bimo dari jarak aman, dan bukti itu menutup babak kekerasan di SMA Yuson. Aris selamat, persahabatan mereka bertahan, dan masa depan akademik Ren tetap utuh.',
      lesson: 'Kekuatan fisik mungkin memenangkan pertarungan; tetapi kecerdasan, integritas, dan solidaritas yang mengubah masa depan.',
    };
  }
  return {
    id: 'bitter',
    title: 'Lulus Tapi Sendirian',
    summary:
      'Ren memilih berlalu. Aris mengalami trauma berat dan meninggalkan sekolah. Siti menjarakkan diri. Ren tetap lulus dan masuk universitas seperti rencananya — tetapi pada hari kelulusan, ia berdiri sendirian.',
    lesson: 'Seseorang bisa melindungi masa depannya dan tetap kehilangan sesuatu yang penting di dalam dirinya.',
  };
}
