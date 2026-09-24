import { describe, expect, it } from 'vitest';
import { resolveOverlaps, stripIntoVelocity, nearbyBodies, CHAR_RADIUS } from '../game/systems/collision';

// v0.16.0 — karakter tidak boleh saling menembus / menumpuk. Semua figur
// kecuali pemain adalah body visual tanpa collider fisik; sistem ini menjaga
// personal space lewat matematika murni (XZ plane).

describe('resolveOverlaps — dorong keluar dari personal space', () => {
  it('tidak mengubah posisi saat tidak ada tumpang tindih', () => {
    const r = resolveOverlaps({ x: 0, z: 0 }, [{ x: 3, z: 0 }]);
    expect(r.hit).toBe(false);
    expect(r.x).toBe(0);
    expect(r.z).toBe(0);
  });

  it('mendorong keluar sepanjang sumbu tumpang tindih', () => {
    // pemain di (0.5,0), badan lain di (0,0) → dist 0.5 < 0.84 → didorong ke 0.84
    const r = resolveOverlaps({ x: 0.5, z: 0 }, [{ x: 0, z: 0 }]);
    expect(r.hit).toBe(true);
    expect(r.x).toBeCloseTo(CHAR_RADIUS * 2, 5);
    expect(r.z).toBeCloseTo(0, 5);
  });

  it('mendorong keluar sepanjang diagonal', () => {
    const r = resolveOverlaps({ x: 0.2, z: 0.2 }, [{ x: 0, z: 0 }]);
    expect(r.hit).toBe(true);
    const d = Math.hypot(r.x, r.z);
    expect(d).toBeCloseTo(CHAR_RADIUS * 2, 5);
  });

  it('menangani dua badan sekaligus (relaksasi)', () => {
    // badan kiri overlap, badan kanan cukup jauh → didorong keluar dari kiri
    // tanpa didorong masuk ke kanan (satu pass konvergen)
    const r = resolveOverlaps({ x: 0.4, z: 0 }, [{ x: 0, z: 0 }, { x: 2.0, z: 0 }]);
    expect(r.hit).toBe(true);
    expect(r.x).toBeCloseTo(CHAR_RADIUS * 2, 5);
  });

  it('badan tepat di titik yang sama tidak menghasilkan NaN', () => {
    const r = resolveOverlaps({ x: 0, z: 0 }, [{ x: 0, z: 0 }]);
    expect(Number.isFinite(r.x)).toBe(true);
    expect(Number.isFinite(r.z)).toBe(true);
  });
});

describe('stripIntoVelocity — sliding mengelilingi badan', () => {
  it('menghapus komponen kecepatan yang menuju badan', () => {
    // bergerak +x menuju badan di (2,0) → komponen into dihilangkan
    const r = stripIntoVelocity(3, 1, 0, 0, 2, 0);
    expect(r.vx).toBeCloseTo(0, 5);
    expect(r.vz).toBeCloseTo(1, 5); // komponen samping selamat (slide)
  });

  it('kecepatan menjauh tidak diubah', () => {
    const r = stripIntoVelocity(-3, 0, 0, 0, 2, 0);
    expect(r.vx).toBeCloseTo(-3, 5);
    expect(r.vz).toBeCloseTo(0, 5);
  });

  it('kecepatan tegak lurus tidak diubah', () => {
    const r = stripIntoVelocity(0, 2, 0, 0, 2, 0);
    expect(r.vx).toBeCloseTo(0, 5);
    expect(r.vz).toBeCloseTo(2, 5);
  });

  it('badan tepat di titik pemain → berhenti total (bukan pilih arah acak)', () => {
    const r = stripIntoVelocity(3, 3, 0, 0, 0, 0);
    expect(r.vx).toBe(0);
    expect(r.vz).toBe(0);
  });
});

describe('nearbyBodies — shortlist tetangga dalam radius', () => {
  it('hanya mengambil badan dalam kotak radius r', () => {
    const a = { s1: { x: 0, z: 0 }, s2: { x: 5, z: 5 } };
    const b = { n1: { x: 1, z: 0 } };
    const out = nearbyBodies([a, b], 0.2, 0.2, 1.4);
    expect(out).toHaveLength(2); // s1 + n1 (s2 jauh)
  });

  it('registri kosong → array kosong', () => {
    expect(nearbyBodies([{}, {}], 0, 0)).toHaveLength(0);
  });
});
