import { beforeEach, describe, expect, it } from 'vitest';
import {
  combatTick,
  playerCombat,
  enemyRuntime,
  enemyAnim,
  playerAnim,
  resetCombatRuntime,
  resetEnemyRuntime,
  angleDiff,
} from '../game/combat/combat';
import { useCombat } from '../stores/combatStore';
import { usePlayer } from '../stores/playerStore';
import { useGame } from '../stores/gameStore';
import { BEAT_ENCOUNTER } from '../stores/dialogueStore';
import { ENCOUNTERS } from '../data/quests';
import { playerPos, enemyPos, camState } from '../game/runtime';
import { input } from '../game/input';

// v0.15.1: test suite pertama untuk combat runtime. Sebelumnya 194 test
// tidak menyentuh combatTick sama sekali — bug multi-hit strike (satu
// ayunan musuh = 7x damage @60fps) lolos tanpa terdeteksi.

const DT = 1 / 60;

function tick(n: number) {
  for (let i = 0; i < n; i++) combatTick(DT, null);
}

/** musuh 1.5 m di depan pemain (arah +z), strike baru mulai */
function forceStrike(dist = 1.5) {
  enemyPos.x = 0;
  enemyPos.z = dist;
  enemyRuntime.state = { state: 'strike', t: 0, facing: 0, cooldown: 0, hitDone: false };
}

function resetWorld() {
  usePlayer.getState().resetAll();
  useCombat.getState().reset();
  resetCombatRuntime();
  playerPos.x = 0;
  playerPos.z = 0;
  playerPos.facing = 0;
  enemyPos.x = 0;
  enemyPos.z = 0;
  enemyPos.active = false;
  camState.yaw = 0;
  input.held.clear();
  input.pressed.clear();
  input.leftPressed = false;
  input.rightPressed = false;
  input.mouse.left = false;
  input.mouse.right = false;
  input.touch.axes.x = 0;
  input.touch.axes.y = 0;
  input.touch.run = false;
  input.touch.block = false;
}

describe('angleDiff', () => {
  it('selisih sudut sederhana', () => {
    expect(angleDiff(0.3, 0.1)).toBeCloseTo(0.2, 10);
    expect(angleDiff(-0.5, 0.5)).toBeCloseTo(-1, 10);
  });

  it('wrapping melewati ±π', () => {
    // -3.1 vs 3.1 → jalan terpendek lewat batas π (0.083… bukan -6.2)
    expect(angleDiff(-3.1, 3.1)).toBeCloseTo(2 * Math.PI - 6.2, 10);
  });
});

describe('enemy strike — satu ayunan satu hit (v0.15.1 regesi multi-hit)', () => {
  beforeEach(resetWorld);

  it('damage hanya tersettle SEKALI per ayunan walau tick 20 frame', () => {
    useCombat.getState().start('stair_fight'); // dmg 7
    forceStrike(1.5); // dalam jangkauan 2.1
    tick(20); // 0.333 dtk — jendela aktif 0.12 dtk dilewati berkali-kali
    expect(usePlayer.getState().hp).toBe(100 - 7);
    // transisi FSM tetap normal: strike → recover
    expect(enemyRuntime.state.state).toBe('recover');
  });

  it('block menangkis dengan chip damage sekali, block tetap aktif', () => {
    useCombat.getState().start('stair_fight');
    input.mouse.right = true;
    tick(1); // mulai block (biaya awal 1 fokus)
    forceStrike(1.5);
    playerPos.facing = 0; // menghadap musuh (atan2(0,1.5)=0)
    tick(20);
    expect(usePlayer.getState().hp).toBe(100 - Math.max(1, Math.round(7 * 0.3)));
    expect(playerCombat.block).toBe(true);
    // tanpa stagger karena berhasil menangkis
    expect(playerCombat.stagger).toBeLessThanOrEqual(0);
  });

  it('musuh di luar jangkauan tidak melukai', () => {
    useCombat.getState().start('stair_fight');
    forceStrike(3.0);
    tick(20);
    expect(usePlayer.getState().hp).toBe(100);
  });

  it('dodge (invuln) menghindarkan damage dan swing tidak "terbakar"', () => {
    useCombat.getState().start('stair_fight');
    playerCombat.dodge = { t: 0, dirX: 0, dirZ: -1 };
    playerCombat.invuln = 0.3;
    forceStrike(1.5);
    tick(10); // 0.166 dtk < 0.3 dtk invuln
    expect(usePlayer.getState().hp).toBe(100);
    expect(enemyRuntime.state.hitDone).toBe(false); // swing masih bisa connect setelah invuln
  });
});

describe('dodge — arah & biaya (v0.15.1 regesi menghempas ke arah musuh)', () => {
  beforeEach(resetWorld);

  it('mengikuti arah gerak yang ditahan (kanan relatif kamera yaw 0)', () => {
    useCombat.getState().start('stair_fight');
    enemyPos.z = 1.5;
    camState.yaw = 0;
    input.held.add('right');
    input.pressed.add('dodge');
    tick(1);
    expect(playerCombat.dodge).not.toBeNull();
    expect(playerCombat.dodge!.dirX).toBeCloseTo(1, 6);
    expect(playerCombat.dodge!.dirZ).toBeCloseTo(0, 6);
    expect(playerCombat.invuln).toBeGreaterThan(0.2);
    expect(usePlayer.getState().focus).toBeCloseTo(100 - 6, 6);
  });

  it('tanpa input → backstep menjauhi musuh', () => {
    useCombat.getState().start('stair_fight');
    enemyPos.z = 1.5; // musuh di +z → backstep ke -z
    input.pressed.add('dodge');
    tick(1);
    expect(playerCombat.dodge!.dirX).toBeCloseTo(0, 6);
    expect(playerCombat.dodge!.dirZ).toBeCloseTo(-1, 6);
  });

  it('fokus kurang dari 6 → dodge ditolak', () => {
    useCombat.getState().start('stair_fight');
    usePlayer.getState().setFocus(5);
    input.pressed.add('dodge');
    tick(1);
    expect(playerCombat.dodge).toBeNull();
  });
});

describe('ekonomi Fokus (v0.15.1: regen + hit reward)', () => {
  beforeEach(resetWorld);

  it('pulih +7/dtk saat bebas gerak', () => {
    useCombat.getState().start('stair_fight');
    usePlayer.getState().setFocus(40);
    tick(60); // 1 detik
    expect(usePlayer.getState().focus).toBeCloseTo(47, 3);
  });

  it('tidak pulih saat menangkis (malah terkuras)', () => {
    useCombat.getState().start('stair_fight');
    usePlayer.getState().setFocus(50);
    input.mouse.right = true;
    tick(60);
    expect(usePlayer.getState().focus).toBeLessThan(45);
    expect(playerCombat.block).toBe(true);
  });

  it('pukulan light yang menghubungkan memberi +4 fokus dan damage 9', () => {
    useCombat.getState().start('stair_fight');
    enemyPos.z = 1.5;
    playerPos.facing = 0; // menghadap musuh
    usePlayer.getState().setFocus(30); // < 60 → tanpa bonus
    input.leftPressed = true;
    tick(20); // windup 0.1 dtk terlampaui di ~tick 7
    expect(useCombat.getState().enemy()!.hp).toBe(62 - 9);
    // 34 = 30 + reward 4; +7/60 = regen 1 tick (frame penekanan attack masih
    // cabang bebas-gerak — attack baru aktif mulai frame berikutnya)
    expect(usePlayer.getState().focus).toBeCloseTo(34 + 7 / 60, 6);
  });

  it('heavy memotong 10 fokus di muka dan damage 19', () => {
    useCombat.getState().start('stair_fight');
    enemyPos.z = 1.5;
    playerPos.facing = 0;
    usePlayer.getState().setFocus(50);
    input.held.add('attack_heavy');
    tick(30); // windup 0.26 dtk terlampaui di ~tick 16
    expect(playerCombat.attack?.heavy ?? playerAnim.current.attackT).toBeDefined();
    expect(useCombat.getState().enemy()!.hp).toBe(62 - 19);
    expect(usePlayer.getState().focus).toBeCloseTo(44, 6);
  });
});

describe('reset runtime — pemisahan sisi pemain vs musuh (v0.15.1)', () => {
  beforeEach(resetWorld);

  it('resetEnemyRuntime hanya menyentuh musuh; combo pemain selamat', () => {
    playerCombat.attack = { t: 0.05, dur: 0, heavy: false, hitDone: true };
    playerCombat.invuln = 0.2;
    enemyAnim.current.down = true;
    resetEnemyRuntime();
    expect(enemyRuntime.state.state).toBe('spawn');
    expect(enemyAnim.current.down).toBe(false);
    expect(playerCombat.attack).not.toBeNull();
    expect(playerCombat.invuln).toBeCloseTo(0.2, 10);
  });

  it('resetCombatRuntime tetap membersihkan kedua sisi', () => {
    playerCombat.attack = { t: 0.05, dur: 0, heavy: false, hitDone: true };
    resetCombatRuntime();
    expect(playerCombat.attack).toBeNull();
    expect(enemyRuntime.state.state).toBe('spawn');
  });
});

describe('alur KO / kalah', () => {
  beforeEach(resetWorld);

  it('hp musuh habis → FSM ko + anim tergeletak', () => {
    useCombat.getState().start('bimo_fight'); // 1 musuh, hp 150
    useCombat.getState().hitEnemy(150);
    tick(1);
    expect(enemyRuntime.state.state).toBe('ko');
    expect(enemyAnim.current.down).toBe(true);
  });

  it('kalah di encounter DENGAN onLose → bukan GAME_OVER, combat di-reset (cabang cerita)', () => {
    useCombat.getState().start('secret_fight'); // onLose: ch4_neu_sbl_1
    usePlayer.getState().damage(95); // sisa 5 hp
    forceStrike(1.5); // dmg 9 → hp habis
    tick(1);
    expect(usePlayer.getState().hp).toBe(0);
    // onLose menyerahkan kendali ke graph cerita — store combat di-reset,
    // bukan layar GAME_OVER generik.
    expect(useCombat.getState().phase).toBeNull();
    expect(enemyPos.active).toBe(false);
    expect(useGame.getState().mode).not.toBe('GAME_OVER');
  });

  it('kalah di encounter TANPA onLose → GAME_OVER + Ren tergeletak', () => {
    useCombat.getState().start('stair_fight'); // tanpa onLose
    usePlayer.getState().damage(95);
    forceStrike(1.5);
    tick(1);
    expect(usePlayer.getState().hp).toBe(0);
    expect(useGame.getState().mode).toBe('GAME_OVER');
    expect(playerAnim.current.down).toBe(true);
  });
});

describe('enemy approach — arah & pengejaran (v0.15.2 regesi jalan menjauh)', () => {
  beforeEach(resetWorld);

  it('musuh MENDEKATI pemain lalu masuk windup (dulu: kabur terus)', () => {
    useCombat.getState().start('stair_fight');
    enemyPos.x = 0;
    enemyPos.z = 5; // dalam perception 6, di luar jangkauan serang
    enemyRuntime.state = { state: 'approach', t: 0, facing: 0, cooldown: 0, hitDone: false };
    tick(90); // 1.5 dtk — cukup untuk menyusul dari 5 m ke < 1.7 m
    const dist = Math.hypot(enemyPos.x - playerPos.x, enemyPos.z - playerPos.z);
    expect(dist).toBeLessThan(2.5);
    expect(['windup', 'strike']).toContain(enemyRuntime.state.state);
  });

  it('saat jauh (dist > 3.5) musuh mengejar ≥ 3.6 m/s (anti-kite)', () => {
    useCombat.getState().start('stair_fight'); // speed goon 2.1 < jalan pemain 3.4
    enemyPos.x = 0;
    enemyPos.z = 5.5;
    enemyRuntime.state = { state: 'approach', t: 0, facing: 0, cooldown: 0, hitDone: false };
    const before = enemyPos.z;
    tick(1);
    const closed = before - enemyPos.z;
    expect(closed).toBeCloseTo(3.6 / 60, 2);
  });

  it('dekat (dist < 3.5) musuh kembali ke speed data', () => {
    useCombat.getState().start('stair_fight');
    enemyPos.x = 0;
    enemyPos.z = 3;
    enemyRuntime.state = { state: 'approach', t: 0, facing: 0, cooldown: 0, hitDone: false };
    const before = enemyPos.z;
    tick(1);
    const closed = before - enemyPos.z;
    expect(closed).toBeCloseTo(2.1 / 60, 2);
  });
});

describe('BEAT_ENCOUNTER — guard regression (v0.15.2: fallback gate_fight sudah dihapus)', () => {
  it('semua encounter di BEAT_ENCOUNTER masih terdaftar di ENCOUNTERS', () => {
    expect(Object.keys(BEAT_ENCOUNTER).length).toBeGreaterThan(0);
    for (const [beat, id] of Object.entries(BEAT_ENCOUNTER)) {
      expect(ENCOUNTERS[id], `beat "${beat}" → "${id}"`).toBeDefined();
    }
  });
});
