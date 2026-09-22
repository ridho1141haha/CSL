import { describe, it, expect, beforeEach } from 'vitest';
import {
  REN_STAGING,
  OPENING_ACTORS,
  SCENE_ACTORS,
  CAM_BY_NODE,
  OPENING_ROOT,
} from '../data/chapters';
import {
  DIALOGUE,
  STORY_TRIGGER_NODES,
  MONTAGE_ROOTS,
} from '../data/dialogue';
import { ENCOUNTERS } from '../data/quests';
import { CAMERA_POSES } from '../data/world';
import { playerPos, actorPositions, npcPositions } from '../game/runtime';
import {
  storyCastSpots,
  stagedEntityPosition,
  resolveCinematicCamera,
} from '../game/story/staging';

// ============================================================================
// v0.14.1 — camera staging sinematik mengikuti STORY SCENE AKTIF.
//
// Regression untuk bug user: "story berlangsung di kelas/tangga, kamera
// malah menyorot kantin". Penyebabnya kamera sinematik membaca registry
// live global (actorPositions ?? npcPositions) sehingga posisi hantu dari
// scene lama (bullies kantin di opening o4, gang tangga di ch2, Bimo rooftop)
// dipakai scene lain. Kini kamera sinematik HANYA resolusi dari data staging.
// ============================================================================

// node cerita sinematik = bukan opening FP (o*), bukan dialog-mode NPC
// (npc/discovery/ambient — dibuka cinematic=false, memakai live shot yang
// sah karena NPC-nya memang berdiri di depan pemain).
const isCinematicStoryNode = (id: string) =>
  !id.startsWith('o') && /^(ch2_|ch3_|ch4_|n\d)/.test(id);

const CINEMATIC_STORY_NODES = Object.keys(DIALOGUE).filter(isCinematicStoryNode);

// posisi Ren saat node ini tampil: staging node itu sendiri, atau dibawa
// dari node sebelumnya di chain (posisi player persist antar node) —
// dihitung dengan graph walk dari semua pintu masuk story scene.
function renPosWalk(): Map<string, [number, number]> {
  const pos = new Map<string, [number, number]>();
  const queue: string[] = [];
  const roots = new Set<string>([
    OPENING_ROOT,
    ...STORY_TRIGGER_NODES,
    ...MONTAGE_ROOTS,
    // lanjutan pasca-kombat: chain dialog terputus di __combat__, node onWin
    // adalah pintu masuk scene tersendiri
    ...Object.values(ENCOUNTERS).map((e) => e.onWin),
  ]);
  for (const r of roots) {
    const st = REN_STAGING[r]?.pos;
    if (st) pos.set(r, st);
    queue.push(r);
  }
  while (queue.length) {
    const id = queue.shift()!;
    const node = DIALOGUE[id];
    if (!node) continue;
    const carried = pos.get(id);
    const nexts: string[] = [];
    if (node.next && node.next !== '__combat__' && node.next !== '__study__') nexts.push(node.next);
    for (const c of node.choices ?? []) if (c.next) nexts.push(c.next);
    for (const n of nexts) {
      if (!DIALOGUE[n]) continue;
      if (!pos.has(n)) pos.set(n, REN_STAGING[n]?.pos ?? carried!);
      queue.push(n);
    }
  }
  return pos;
}

beforeEach(() => {
  for (const k of Object.keys(actorPositions)) delete actorPositions[k];
  for (const k of Object.keys(npcPositions)) delete npcPositions[k];
  playerPos.x = 7;
  playerPos.z = 29;
});

describe('staged cast expansion (konvensi id = CinematicActors)', () => {
  it('bullies → gang/gang1/…, followers → follower/follower1/…', () => {
    const cast = storyCastSpots('o4_13'); // 2 pembisik + Bimo + 3 pengikut
    expect([...cast.keys()].sort()).toEqual(['gang', 'gang1', 'bimo', 'follower', 'follower1', 'follower2'].sort());
    expect(cast.get('gang')!.pos).toBeDefined();
  });

  it('node tanpa cast → map kosong (bukan error)', () => {
    expect(storyCastSpots('n1_1').size).toBe(0);
    expect(storyCastSpots('node_tak_ada').size).toBe(0);
  });
});

describe('stagedEntityPosition — sumber data staging, bukan registry live', () => {
  it('aktor yang distage mengembalikan spot DATA', () => {
    const p = stagedEntityPosition('n1_4', 'aris');
    expect(p).toEqual({ x: -4.0, z: 11.3 }); // kelas 11-B
  });

  it("'ren' mengikuti playerPos (sudah distage oleh applyPlayerStaging)", () => {
    playerPos.x = 5.9;
    playerPos.z = 0.7;
    expect(stagedEntityPosition('ch2_intro_1', 'ren')).toEqual({ x: 5.9, z: 0.7 });
  });

  it('REGRESI KANTIN: posisi hantu di registry TIDAK dipakai — yang distage dari DATA, yang tidak → null', () => {
    // hantu persis seperti bug: opening o4 men-stage 'gang' di meja bisik kantin,
    // o2 men-stage 'aris' di kelas — registry penuh posisi scene lama
    actorPositions['gang'] = { x: 24.65, z: 5.0 };
    actorPositions['aris'] = { x: -4.0, z: 11.3 };
    npcPositions['siti'] = { x: 28, z: 8 }; // jadwal makan siang di kantin
    // n3 (montase koridor) TIDAK men-stage gang → null, bukan hantu ch2 [6.3,1.6]
    expect(stagedEntityPosition('n3_2', 'gang')).toBeNull();
    // ch2 memang men-stage gang di tangga → spot DATA tangga, bukan hantu kantin
    expect(stagedEntityPosition('ch2_intro_4', 'gang')).toEqual({ x: 6.3, z: 1.6 });
    // n2 (perpustakaan) men-stage siti dari data — bukan jadwal kantin
    expect(stagedEntityPosition('n2_2', 'siti')).toEqual({ x: 30.0, z: 19.2 });
  });
});

describe('resolveCinematicCamera — kamera mengikuti scene aktif', () => {
  it('REGRESI: hantu kantin dari opening tidak menyeret kamera scene tangga (ch2)', () => {
    actorPositions['gang'] = { x: 24.65, z: 5.0 }; // ghost kantin
    actorPositions['aris'] = { x: -4.0, z: 11.3 }; // ghost kelas
    const cam = resolveCinematicCamera('ch2_win_2');
    // ch2_win_2 punya pose authoran stairs_close — bukan shot dari hantu
    expect(cam).toEqual({ kind: 'pose', key: 'stairs_close' });
  });

  it('REGRESI: hantu gang ch2 tidak menyeret kamera montase koridor (n3)', () => {
    actorPositions['gang'] = { x: 6.3, z: 1.6 }; // ghost jalur tangga/kantin belakang
    expect(resolveCinematicCamera('n3_2')).toEqual({ kind: 'pose', key: 'corridor_view' });
    expect(resolveCinematicCamera('n3_4')).toEqual({ kind: 'pose', key: 'corridor_view' });
  });

  it('REGRESI: hantu bimo rooftop tidak menyeret kamera konteks kelas (ch4_bad_4)', () => {
    actorPositions['bimo'] = { x: 0.3, z: -5.6 }; // ghost rooftop (scene lain)
    expect(resolveCinematicCamera('ch4_bad_4')).toEqual({ kind: 'pose', key: 'classroom_close' });
    expect(resolveCinematicCamera('ch4_bad_4b')).toEqual({ kind: 'pose', key: 'classroom_close' });
  });

  it('node.cam (pilihan shot dialogue) menghasilkan shot dari posisi STAGE', () => {
    playerPos.x = 1.3;
    playerPos.z = -4.3; // ROOFTOP_REN
    const cam = resolveCinematicCamera('ch3_intro_3'); // BIMO, cam medium_speaker
    expect(cam?.kind).toBe('shot');
    if (cam?.kind !== 'shot') return;
    const spk = stagedEntityPosition('ch3_intro_3', 'bimo')!; // [0.3,-5.6]
    const d = Math.hypot(cam.shot.pos.x - spk.x, cam.shot.pos.z - spk.z);
    expect(d).toBeGreaterThan(1.5);
    expect(d).toBeLessThan(3.5);
  });

  it('node.cam dengan speaker tak distage → jatuh ke pose authoran (bukan menebak)', () => {
    // hipotetis: node ini tidak distage bimo di cast — resolver wajib aman
    const cam = resolveCinematicCamera('ch2_win_6'); // bimo bicara, cam stairs_close (pose)
    expect(cam).toEqual({ kind: 'pose', key: 'stairs_close' });
  });

  it('node tanpa kamera apa pun → null (caller memframing Ren yang distage)', () => {
    expect(resolveCinematicCamera(null)).toBeNull();
    expect(resolveCinematicCamera('node_tak_ada')).toBeNull();
  });
});

describe('kelengkapan cameraStage story scene (acceptance criteria #1–#7)', () => {
  it('SETIAP node cerita sinematik punya keputusan kamera (pose/shot, bukan null)', () => {
    for (const id of CINEMATIC_STORY_NODES) {
      const cam = resolveCinematicCamera(id);
      expect(cam, `node ${id} tanpa cameraStage (CAM_BY_NODE / cam yang sah)`).not.toBeNull();
    }
  });

  it('semua pose kamera authoran ada di CAMERA_POSES', () => {
    for (const key of Object.values(CAM_BY_NODE)) {
      expect(CAMERA_POSES[key], `pose hilang: ${key}`).toBeDefined();
    }
  });

  it('INVARIANT LOKASI: look-target pose dekat entity scene yang distage', () => {
    // kamera scene kelas harus melihat kelas, koridor → koridor, dst. Pose
    // yang menunjuk area lain (mis. warehouse_close untuk node kelas) gagal di sini.
    const renPos = renPosWalk();
    const R = 18;
    for (const id of CINEMATIC_STORY_NODES) {
      const cam = resolveCinematicCamera(id);
      if (cam?.kind !== 'pose') continue;
      const look = CAMERA_POSES[cam.key]!.look;
      const anchors: { x: number; z: number }[] = [...storyCastSpots(id).values()]
        .map((s) => ({ x: s.pos[0], z: s.pos[1] }));
      const rp = renPos.get(id);
      if (rp) anchors.push({ x: rp[0], z: rp[1] });
      expect(anchors.length, `node ${id} tanpa anchor lokasi`).toBeGreaterThan(0);
      const best = Math.min(...anchors.map((a) => Math.hypot(a.x - look[0], a.z - look[2])));
      expect(best, `pose ${cam.key} (${id}) melihat ke lokasi lain (dist ${best.toFixed(1)}m)`).toBeLessThanOrEqual(R);
    }
  });

  it('pintu masuk story scene (trigger/montage/onWin) siap dibuka CINEMATIC', () => {
    // semua pintu masuk wajib punya cameraStage + staging Ren deterministik —
    // pemanggilnya kini CINEMATIC (StoryDirector ch2 + combat finishCombatWin)
    const entries = [
      ...STORY_TRIGGER_NODES,
      ...MONTAGE_ROOTS,
      ...Object.values(ENCOUNTERS).map((e) => e.onWin),
    ];
    for (const id of entries) {
      expect(CAM_BY_NODE[id], `pintu masuk scene tanpa cameraStage: ${id}`).toBeDefined();
      expect(REN_STAGING[id], `pintu masuk tanpa staging Ren: ${id}`).toBeDefined();
    }
  });
});
