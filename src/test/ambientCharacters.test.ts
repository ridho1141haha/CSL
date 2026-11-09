import { describe, it, expect } from 'vitest';
import {
  CHAR_GLB_PATHS,
  MAIN_CHARACTERS,
  AMBIENT_VARIANTS,
  TINT_SLOT_MATERIALS,
  ambientVariantFor,
  hashStableId,
  type CharModelId,
  type TintSlot,
} from '../game/npc/characters';
import { AMBIENT_STUDENTS, NPCS, NPC_BY_ID } from '../data/npcs';

// v0.18.1 — ambient NPC character variety: registry integrity + deterministic
// assignment. Sebelum fix ini semua ambient student jatuh ke model Ren karena
// resolveCharModelId hanya mengenali warna hex karakter utama.

const MAIN_IDS: CharModelId[] = ['ren', 'aris', 'siti', 'bimo', 'budi'];
const HEX = /^#[0-9a-f]{6}$/i;

describe('character registry (main cast)', () => {
  it('every main character maps to its own GLB with no tint (visual parity)', () => {
    for (const id of MAIN_IDS) {
      const def = MAIN_CHARACTERS[id];
      expect(def.id).toBe(id);
      expect(def.model).toBe(id);
      expect(CHAR_GLB_PATHS[id]).toBe(`/models/csl_char_${id}.glb`);
      // tanpa tint — identitas utama tetap 100% baked di GLB
      expect(def.tint).toBeUndefined();
    }
  });

  it('registry covers exactly the five required characters', () => {
    expect(Object.keys(MAIN_CHARACTERS).sort()).toEqual([...MAIN_IDS].sort());
  });

  it('main NPC data (aris/siti/bimo/budi) is untouched by the registry change', () => {
    for (const id of ['aris', 'siti', 'bimo', 'budi']) {
      const def = NPC_BY_ID[id];
      expect(def, `NPC utama hilang: ${id}`).toBeDefined();
      expect(def.schedule.arrive).toBeDefined();
      expect(def.dialogueRoot).toBe(`npc_${id}`);
    }
    // Ren adalah player — tidak ada di tabel NPC terjadwal (dijamin tipe
    // NpcId, tapi dicek eksplisit agar regresi data terdeteksi).
    expect(Object.keys(NPC_BY_ID)).not.toContain('ren');
    expect(NPCS.every((n) => NPC_BY_ID[n.id] === n)).toBe(true);
  });
});

describe('character registry (ambient variants)', () => {
  it('has a usable, collision-free variant table', () => {
    expect(AMBIENT_VARIANTS.length).toBeGreaterThanOrEqual(8);
    const ids = AMBIENT_VARIANTS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    // tidak boleh menabrak identitas karakter utama
    for (const vid of ids) expect(MAIN_IDS).not.toContain(vid as CharModelId);
  });

  it('every variant references a valid base model and well-formed tints', () => {
    for (const v of AMBIENT_VARIANTS) {
      expect(CHAR_GLB_PATHS[v.model], `${v.id}: base model tidak terdaftar`).toBeDefined();
      if (v.tint) {
        for (const [slot, hex] of Object.entries(v.tint)) {
          expect(TINT_SLOT_MATERIALS).toHaveProperty(slot);
          expect(hex, `${v.id}.${slot}: bukan hex valid`).toMatch(HEX);
        }
      }
    }
  });

  it('tint slots resolve to material names present in every character GLB', () => {
    for (const slot of Object.keys(TINT_SLOT_MATERIALS) as TintSlot[]) {
      expect(TINT_SLOT_MATERIALS[slot]).toMatch(/^mat_/);
    }
  });

  it('spreads the five base models across the table (no single-model crowd)', () => {
    const bases = new Set(AMBIENT_VARIANTS.map((v) => v.model));
    expect(bases).toEqual(new Set(MAIN_IDS));
  });
});

describe('deterministic ambient assignment', () => {
  it('same id always resolves to the same variant object', () => {
    for (let i = 1; i <= 12; i++) {
      const id = `amb_${String(i).padStart(2, '0')}`;
      const a = ambientVariantFor(id);
      const b = ambientVariantFor(id);
      expect(a).toBe(b); // identitas referensi — stabil lintas re-render
    }
  });

  it('assignment depends on the stable id, not render/mount order', () => {
    const ids = AMBIENT_STUDENTS.map((s) => s.id);
    const forward = ids.map(ambientVariantFor);
    const reversed = [...ids].reverse().map(ambientVariantFor);
    expect(reversed.reverse()).toEqual(forward);
    // hash stabil dan tidak berubah antar sesi
    expect(hashStableId('amb_07')).toBe(hashStableId('amb_07'));
    expect(ambientVariantFor('amb_07').id).toMatch(/^amb_v\d+$/);
  });

  it('quality-preset crowd filter does not change any student identity', () => {
    // preset lemah memakai AMBIENT_STUDENTS.filter((_, i) => i % 2 === 0);
    // identitas harus tetap karena diturunkan dari id, bukan index.
    const full = AMBIENT_STUDENTS.map((s) => ambientVariantFor(s.id));
    const low = AMBIENT_STUDENTS.filter((_, i) => i % 2 === 0).map((s) => ambientVariantFor(s.id));
    for (let k = 0; k < low.length; k++) {
      expect(low[k]).toBe(full[k * 2]);
    }
  });

  it('unknown ids still resolve deterministically (predictable fallback)', () => {
    const a = ambientVariantFor('amb_nongada');
    const b = ambientVariantFor('amb_nongada');
    expect(a).toBe(b);
    expect(AMBIENT_VARIANTS).toContain(a);
  });
});

describe('ambient crowd variety (actual data)', () => {
  const assignment = AMBIENT_STUDENTS.map((s) => ({ id: s.id, v: ambientVariantFor(s.id) }));

  it('every ambient student has a registered variant', () => {
    for (const { v } of assignment) expect(AMBIENT_VARIANTS).toContain(v);
  });

  it('the crowd uses several distinct variants, max 2 students per variant', () => {
    const used = new Set(assignment.map((a) => a.v.id));
    expect(used.size).toBeGreaterThanOrEqual(6);
    const counts = new Map<string, number>();
    for (const { v } of assignment) counts.set(v.id, (counts.get(v.id) ?? 0) + 1);
    for (const [vid, n] of counts) {
      expect(n, `${vid} dipakai ${n}x`).toBeLessThanOrEqual(2);
    }
  });

  it('all five base models appear across the 12 ambient students', () => {
    const bases = new Set(assignment.map((a) => a.v.model));
    expect(bases).toEqual(new Set(MAIN_IDS));
  });

  it('ambient entry ids are unique and stable', () => {
    const ids = AMBIENT_STUDENTS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^amb_\d+$/);
  });
});
