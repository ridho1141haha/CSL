import type { ItemDef } from '../types';

export const ITEMS: ItemDef[] = [
  { id: 'student_card', name: 'Kartu Pelajar', category: 'key', desc: 'Identitas murid SMA Yuson. Nama: Ren.' },
  { id: 'notebook', name: 'Buku Catatan', category: 'misc', desc: 'Catatan pelajaran rapi. Nilai lebih penting dari apapun.' },
  { id: 'phone', name: 'Ponsel', category: 'key', desc: 'Untuk pesan, jadwal, dan catatan.' },
  { id: 'water', name: 'Air Minum', category: 'consumable', desc: 'Menyegarkan kepala.', use: { focus: 15 } },
  { id: 'snack', name: 'Roti Kantin', category: 'consumable', desc: 'Cepat, murah, mengenyangkan.', use: { hp: 10 } },
  { id: 'medicine', name: 'Obat Luka', category: 'consumable', desc: 'Plester dan antiseptik dari UKS.', use: { hp: 35 } },
  { id: 'osis_form', name: 'Formulir OSIS', category: 'quest', desc: 'Surat edaran OSIS untuk Pak Budi.' },
  { id: 'rekaman', name: 'Rekaman Bukti', category: 'quest', desc: 'Rekaman aktivitas geng Bimo. Disimpan Siti.' },
];

export const ITEM_BY_ID: Record<string, ItemDef> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export const STARTING_INVENTORY = ['student_card', 'notebook', 'phone', 'water', 'snack'];
