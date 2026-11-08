import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// Hidden event dialogue (he_*, dibuka systems/hiddenEvents)
// Node he_* — reward lewat node effects, guard flag he_<id> oleh runner.
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const DISCOVERY_NODES: DialogueNode[] = [
    // ============================================================
    // HIDDEN EVENT DIALOGUE (mentor feedback #5) — opened by
    // systems/hiddenEvents when discovery conditions are met.
    // Rewards ride on node effects; discovery persistence is the
    // `he_<id>` flag the runner sets BEFORE opening the node.
    // ============================================================
    N({ id: 'he_rooftop_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Di celah dinding atap tertancap potongan kayu. Tanda geng, ditulis cepat — dan ditinggalkan dengan sengaja. Seperti pesan untuk siapa yang rajin melihat.', effects: [{ k: 'item', id: 'coretan_atap' }, { k: 'notify', text: 'Item didapat: Coretan dari Atap' }], end: true }),
    N({ id: 'he_alley_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Tembok gang. Ukiran segitiga ganda, cat merah — masih menempel di kuku. Ini penanda ronda, bukan coretan iseng.', effects: [{ k: 'flag', id: 'alley_mark' }, { k: 'notify', text: 'Data penting: tanda ronda geng tercatat' }], end: true }),
    N({ id: 'he_canteen_1', speaker: 'ARIS', portrait: 'aris', emotion: 'worried', text: 'Ren... duduk di sudut aja. Anak-anak Bimo gak pernah makan di kantin. Mereka makan di tempat lain. Itu... itu justru masalahnya, kurasa.', effects: [{ k: 'rel', target: 'aris', delta: 1 }], end: true }),
    N({ id: 'he_field_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Rumput kekuningan. Dekat tiang gawang, sepasang sarung tinju tua tergeletak. Ditinggal — bukan hilang. Pemiliknya gak akan balik nyari.', effects: [{ k: 'item', id: 'sarung_tangan' }, { k: 'hp', delta: 5 }, { k: 'notify', text: 'Item didapat: Sarung Tinju Tua' }], end: true }),
    N({ id: 'he_parking_1', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Dua motor masuk, satu keluar. Tiap jam pelajaran kedua. Ren mencatatnya — jadwal ronda mereka lebih rapi daripada jadwal OSIS.', effects: [{ k: 'flag', id: 'gang_patrol_info' }, { k: 'stat', stat: 'diplomacy', delta: 1 }, { k: 'notify', text: 'Info: jadwal ronda geng tercatat' }], end: true }),
    N({ id: 'he_budi_1', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'neutral', text: 'Masih di sekolah, Pak Budi? Ruang guru paling sepi jam segini. Murid-murid bilang begitu.', next: 'he_budi_2' }),
    N({ id: 'he_budi_2', speaker: 'PAK BUDI', portrait: 'budi', emotion: 'warm', text: 'Sekolah terbaik untuk belajar tentang orang, Ren. Dulu ada murid yang diam, rapi, terlalu sabar. Saya menyesal tidak bertanya padanya lebih cepat.', effects: [{ k: 'rel', target: 'budi', delta: 2 }, { k: 'stat', stat: 'focus', delta: 5 }, { k: 'notify', text: 'Cerita Pak Budi membuat kepala tenang. (Fokus +5)' }], end: true }),
    N({ id: 'he_classroom_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Bangku ketiga dari jendela. Di balik meja, goresan pahat — satu kata, ditulis berulang. "tolong. tolong. tolong."', next: 'he_classroom_2' }),
    N({ id: 'he_classroom_2', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Tulisan itu lama. Lebih lama dari hari Ren datang. Aris pernah duduk di bangku ini.', effects: [{ k: 'rel', target: 'aris', delta: 2 }, { k: 'notify', text: 'Ren memahami Aris sedikit lebih dalam. (Rel Aris +2)' }], end: true }),
    N({ id: 'he_hall_1', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Papan OSIS. Di antara lomba dan jadwal, satu lembar polos: "Melihat sesuatu? Catat. Kami memproses tanpa nama." — tanda tangan: S.', effects: [{ k: 'flag', id: 'osis_notice' }, { k: 'notify', text: 'Info: kanal pelaporan anonim OSIS' }], end: true }),
    N({ id: 'he_bimo_alley_1', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Ren.', next: 'he_bimo_alley_2' }),
    N({ id: 'he_bimo_alley_2', speaker: 'BIMO', portrait: 'bimo', emotion: 'dark', text: 'Anak-anak gue ronda malem. Kalau lo lewat, mereka akan ingat muka lo. Jangan kasih mereka alasan buat ingat lebih lama.', effects: [{ k: 'flag', id: 'bimo_warning' }, { k: 'notify', text: 'Info: peringatan langsung dari Bimo' }], end: true }),
    // v0.8.0: library + Gedung B exploration
    N({ id: 'he_library_1', speaker: 'NARATOR', portrait: 'narrator', text: 'Rak tahunan, pojok perpustakaan. Foto angkatan lama terkelupas: satu anak kelas 10 berdiri paling pinggir, wajahnya sudah mulai tampak seperti Bimo. Namanya dicoret hitam.', next: 'he_library_2' }),
    N({ id: 'he_library_2', speaker: 'REN', portrait: 'ren', emotion: 'worried', text: 'Nama yang dicoret. Tahun itu, satu-satunya. Entah kenapa gue enggak pengen tahu ke mana dia pergi.', effects: [{ k: 'flag', id: 'library_yearbook' }, { k: 'stat', stat: 'diplomacy', delta: 1 }, { k: 'notify', text: 'Info: foto tahunan Bimo tercatat' }], end: true }),
    N({ id: 'he_osis_1', speaker: 'REN', portrait: 'ren', emotion: 'neutral', text: 'Buku tamu Ruang OSIS, lantai satu Gedung B. Baris demi baris nama rapi. Di halaman terakhir, satu baris kosong — hanya coretan kecil: "menunggu yang berani".', effects: [{ k: 'flag', id: 'osis_guestbook' }, { k: 'stat', stat: 'focus', delta: 3 }, { k: 'notify', text: 'Info: buku tamu OSIS tercatat (Fokus +3)' }], end: true }),
];
