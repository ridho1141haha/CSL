import type { DialogueNode } from '../../types';

const N = (n: DialogueNode) => n;

// ============================================================================
// Zone flavor one-shot (zone_*, dibuka StoryDirector lewat ZONE_FLAVOR)
// Node zone_* — muncul sekali per zona saat eksplorasi.
// Dipindah apa adanya dari data/dialogue.ts (v0.14.0 modularisasi cerita) —
// isi node TIDAK diubah. Graph integrity dijaga test/dialogue.test.ts +
// test/storyStructure.test.ts.
// ============================================================================

export const AMBIENT_NODES: DialogueNode[] = [
    // ============================================================
    // Zone flavor (short one-shots when exploring, once per zone)
    // ============================================================
    N({ id: 'zone_field', speaker: 'REN', portrait: 'ren', text: 'Lapangan. Sunyi di jam pelajaran. Di sinilah masalah biasanya "diselesaikan" setelah pulang.', end: true }),
    N({ id: 'zone_canteen', speaker: 'REN', portrait: 'ren', text: 'Kantin. Menu: roti, teh, dan aturan tidak tertulis tentang siapa duduk di mana.', end: true }),
    N({ id: 'zone_alley', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gang belakang. Siti bilang jangan lewat sini sendirian. Dia benar, seperti biasa.', end: true }),
    N({ id: 'zone_parking', speaker: 'REN', portrait: 'ren', text: 'Parkir. Motor-motor geng selalu berderet di sudut yang sama.', end: true }),
    N({ id: 'zone_street', speaker: 'REN', portrait: 'ren', text: 'Jalan depan. Seharusnya tempat paling aman di Yuson. "Seharusnya" sedang melakukan kerja berat.', end: true }),
    N({ id: 'zone_classroom', speaker: 'REN', portrait: 'ren', text: 'Kelas 1-X. Bangku gue di dekat jendela. Dari sini, halaman terlihat damai — dari jarak yang tepat.', end: true }),
    N({ id: 'zone_warehouse', speaker: 'REN', portrait: 'ren', emotion: 'tense', text: 'Gudang tua. Pintu besinya tertutup rapat. Suara di dalamnya tidak diundang.', end: true }),
    N({ id: 'zone_library', speaker: 'REN', portrait: 'ren', text: 'Perpustakaan. Sepi, dingin, rapi. Tempat paling aman di sekolah ini — dan paling gampang bikin gue merasa sedang diawasi.', end: true }),
    N({ id: 'zone_gedung_b', speaker: 'REN', portrait: 'ren', text: 'Gedung Kelas B. Tiga lantai, lorong terbuka, tangga beton. Dari lantai atas, seluruh sekolah terlihat lebih kecil dari yang dikatakan orang.', end: true }),
];
