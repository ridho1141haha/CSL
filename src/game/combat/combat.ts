import * as THREE from 'three';
import { input } from '../input';
import { usePlayer } from '../../stores/playerStore';
import { useCombat } from '../../stores/combatStore';
import { useGame } from '../../stores/gameStore';
import { useStory } from '../../stores/storyStore';
import { useDialogue } from '../../stores/dialogueStore';
import { useStats } from '../../stores/statsStore';
import { audio } from '../audio';
import { playerPos, enemyPos, requestShake, camState } from '../runtime';
import { approachFacing, COMBAT_TURN_RATE } from '../systems/facing';
import { makeAnim, type FigureAnim } from '../npc/Character';
import { ENCOUNTERS } from '../../data/quests';

// Real-time combat runtime (GDD §5.2). Physics handles locomotion only;
// hit detection is gameplay-level (range + facing cone).

export type PlayerCombatState = {
  attack: { t: number; dur: number; heavy: boolean; hitDone: boolean } | null;
  block: boolean;
  dodge: { t: number; dirX: number; dirZ: number } | null;
  invuln: number;
  stagger: number;
  hitPause: number;
  stepTimer: number;
};

export const playerCombat: PlayerCombatState = {
  attack: null,
  block: false,
  dodge: null,
  invuln: 0,
  stagger: 0,
  hitPause: 0,
  stepTimer: 0,
};

export const playerAnim = { current: makeAnim() };
export const enemyAnim = { current: makeAnim() };

type EnemyState = {
  state: 'idle' | 'approach' | 'windup' | 'strike' | 'recover' | 'hurt' | 'stagger' | 'ko' | 'spawn';
  t: number;
  facing: number;
  cooldown: number;
  // v0.15.1: satu pukulan = satu hit. Tanpa flag ini, damage tersettle SETIAP
  // frame selama jendela aktif strike (st.t < 0.12 ≈ 7 frame @60fps) — satu
  // ayunan Anak Bimo (dmg 9) bisa membawa ±63 damage dan secret_fight 4
  // lawan jadi mustahil. Guard ini membuat strike hanya menghubungkan sekali.
  hitDone: boolean;
};

// BUG-8.3: idle state is now actually entered. After spawn, enemy briefly
// idles (perception check) before approaching — gives player a moment to
// orient. Perception radius 6.0; if player is further, enemy stays idle.
const ENEMY_PERCEPTION = 6.0;
const ENEMY_IDLE_TURN_RATE = 1.2; // radians/sec slow turn toward player

export const enemyRuntime: { state: EnemyState } = {
  state: { state: 'spawn', t: 0, facing: 0, cooldown: 1.2, hitDone: false },
};

// v0.15.1: reset sisi musuh SAJA — dipakai CombatScene saat lawan berikutnya
// maju (enemy #1 KO, enemy #2 masuk). State pertarungan pemain (attack/
// dodge/invuln/block) HARUS tetap jalan supaya pukulan pembunuh tidak
// terbatalkan di tengah combo.
export function resetEnemyRuntime() {
  enemyAnim.current = makeAnim();
  enemyRuntime.state = { state: 'spawn', t: 0, facing: 0, cooldown: 1.2, hitDone: false };
}

export function resetCombatRuntime() {
  playerCombat.attack = null;
  playerCombat.block = false;
  playerCombat.dodge = null;
  playerCombat.invuln = 0;
  playerCombat.stagger = 0;
  playerCombat.hitPause = 0;
  // BUG-FIX: must replace .current, not assign makeAnim() fields onto the wrapper.
  // Object.assign(playerAnim, makeAnim()) was adding fields to the wrapper object
  // { current: ... } instead of resetting the inner anim state. This caused
  // down=true to persist across game sessions, making the character appear
  // crouched/lying down on new games after a previous KO.
  playerAnim.current = makeAnim();
  resetEnemyRuntime();
}

const LIGHT = { windup: 0.1, active: 0.12, recover: 0.22, dmg: 9, range: 2.0, arc: 1.15 };
const HEAVY = { windup: 0.26, active: 0.14, recover: 0.42, dmg: 19, range: 2.2, arc: 1.3, focusCost: 10 };
const DODGE = { dur: 0.34, speed: 7.2, invuln: 0.3, focusCost: 6 };
// BUG-8.1: blocking drains Focus over time. Without this, players could hold
// block infinitely with no consequence. 12/sec means 100 Focus lasts ~8s.
const BLOCK_FOCUS_DRAIN = 12;
// v0.15.1: ekonomi Fokus. Sebelumnya Fokus TIDAK PERNAH pulih selama duel —
// heavy (−10), dodge (−6) dan block (−12/dtk) menguras total, lalu pemain
// terkunci dari semua aksi utilitas untuk sisa pertarungan. Sekarang Fokus
// pulih pelan saat bergerak bebas (tidak menangkis), dan setiap pukulan yang
// menghubungkan memberi bonus — bermain agresif mendanai utilitas.
const FOCUS_REGEN = 7;       // per detik, saat bebas gerak & tidak menangkis
const HIT_FOCUS_REWARD = 4;  // per pukulan yang menghubungkan (light/heavy)

// Called per frame while mode === COMBAT. dt is unclamped frame delta.
export function combatTick(
  dt: number,
  body: {
    setLinvel: (v: { x: number; y: number; z: number }, wake?: boolean) => void;
    linvel: () => { x: number; y: number; z: number };
    setTranslation: (t: { x: number; y: number; z: number }, wake?: boolean) => void;
    translation: () => { x: number; y: number; z: number };
  } | null,
) {
  const combat = useCombat.getState();
  const enemy = combat.enemy();
  if (!enemy) return;

  if (playerCombat.hitPause > 0) {
    playerCombat.hitPause -= dt;
    return; // world holds still for a beat
  }

  const px = playerPos.x;
  const pz = playerPos.z;
  const dx = enemyPos.x - px;
  const dz = enemyPos.z - pz;
  const dist = Math.hypot(dx, dz);
  const nx = dist > 0.001 ? dx / dist : 0;
  const nz = dist > 0.001 ? dz / dist : 0;

  const player = usePlayer.getState();
  const game = useGame.getState();

  // ---------------- player ----------------
  let moveX = 0;
  let moveZ = 0;
  playerAnim.current.speed = playerPos.speed;

  if (playerCombat.stagger > 0) {
    playerCombat.stagger -= dt;
    playerAnim.current.speed = 0;
  } else if (playerCombat.dodge) {
    playerCombat.dodge.t += dt;
    moveX = playerCombat.dodge.dirX * DODGE.speed;
    moveZ = playerCombat.dodge.dirZ * DODGE.speed;
    if (playerCombat.dodge.t >= DODGE.dur) playerCombat.dodge = null;
    playerAnim.current.speed = DODGE.speed * 0.9;
  } else if (playerCombat.attack) {
    const a = playerCombat.attack;
    a.t += dt;
    const total = a.heavy ? HEAVY.windup + HEAVY.active + HEAVY.recover : LIGHT.windup + LIGHT.active + LIGHT.recover;
    playerAnim.current.attackT = a.t / total;
    if (!a.hitDone && a.t >= (a.heavy ? HEAVY.windup : LIGHT.windup)) {
      a.hitDone = true;
      const cfg = a.heavy ? HEAVY : LIGHT;
      // BUG-FIX: use playerPos.facing (live runtime value) not player.facing (stale store)
      // player.facing is never updated after mount; playerPos.facing is updated every frame
      // by Player.tsx locomotion and combat movement below.
      if (dist < cfg.range && Math.abs(angleDiff(Math.atan2(dx, dz), playerPos.facing)) < cfg.arc) {
        const bonus = player.focus >= 60 ? 3 : 0;
        const dmg = cfg.dmg + bonus;
        combat.hitEnemy(dmg);
        audio.hit();
        requestShake(a.heavy ? 0.3 : 0.16);
        playerCombat.hitPause = a.heavy ? 0.08 : 0.05;
        enemyAnim.current.hurtT = 0;
        // v0.15.1: pukulan yang menghubungkan mengembalikan sedikit Fokus.
        usePlayer.getState().addFocus(HIT_FOCUS_REWARD);
        onEnemyHit(enemy.hp - dmg, a.heavy);
      } else {
        audio.attack();
      }
    }
    if (a.t >= total) {
      playerCombat.attack = null;
      playerAnim.current.attackT = -1;
    }
  } else {
    // free movement + actions
    // BUG-8.1: blocking drains Focus at BLOCK_FOCUS_DRAIN per second. Once
    // Focus hits 0, block auto-releases.
    const wantBlock = (input.mouse.right || input.touch.block) && player.focus > 0;
    if (wantBlock && playerCombat.block) {
      // already blocking — drain Focus (v0.15.1: baca state fresh, snapshot
      // `player` di atas usang setelah setFocus → release telat 1 frame)
      const fresh = usePlayer.getState();
      const nextFocus = Math.max(0, fresh.focus - BLOCK_FOCUS_DRAIN * dt);
      fresh.setFocus(nextFocus);
      if (nextFocus <= 0) {
        playerCombat.block = false;
        playerAnim.current.block = false;
      }
    } else if (wantBlock && !playerCombat.block) {
      // start blocking (small initial cost to prevent spam: 1 Focus)
      if (player.focus > 1) {
        playerCombat.block = true;
        playerAnim.current.block = true;
        player.setFocus(player.focus - 1);
      } else {
        playerCombat.block = false;
        playerAnim.current.block = false;
      }
    } else {
      playerCombat.block = false;
      playerAnim.current.block = false;
    }
    if (!playerCombat.block) {
      // v0.15.1: Fokus pulih selama bebas gerak (tidak menangkis, tidak
      // sedang attack/dodge/stagger — cabang ini hanya dijalankan saat itu).
      const fresh = usePlayer.getState();
      if (fresh.focus < 100) fresh.setFocus(Math.min(100, fresh.focus + FOCUS_REGEN * dt));
      // reuse locomotion: read held keys relative to camera handled by caller? No —
      // combatTick also reads input directly (camera-relative using camState.yaw)
      const speed = input.isDown('run') ? 5.0 : 3.4;
      let ix = 0;
      let iz = 0;
      if (input.isDown('forward')) iz += 1;
      if (input.isDown('back')) iz -= 1;
      if (input.isDown('left')) ix -= 1;
      if (input.isDown('right')) ix += 1;
      if (ix || iz) {
        const yaw = camYaw();
        const fX = -Math.sin(yaw);
        const fZ = -Math.cos(yaw);
        const rX = -fZ;
        const rZ = fX;
        moveX = (fX * iz + rX * ix) * speed;
        moveZ = (fZ * iz + rZ * ix) * speed;
        playerAnim.current.speed = speed;
        // BUG-FIX: update playerPos.facing during combat movement so attacks/blocks
        // connect in the direction the player is visually moving.
        playerPos.facing = Math.atan2(moveX, moveZ);
      } else {
        playerAnim.current.speed = 0;
        // v0.16.1: combat IDLE squares up to the ENEMY, not the camera. First
        // attempt made idle follow the camera and qa-walk's standing light
        // attack started whiffing: the hit cone below reads playerPos.facing,
        // so a body turned toward the camera-forward while the enemy stood
        // elsewhere = swing through air. Brawler rule instead: stand still →
        // face the threat (the orbit rig keeps the enemy on screen anyway, so
        // this matches the camera ~always in practice). Safe branch — no
        // active attack/dodge/stagger here.
        playerPos.facing = approachFacing(playerPos.facing, Math.atan2(dx, dz), dt, COMBAT_TURN_RATE);
      }
      if (input.leftPressed && player.focus >= 0) {
        playerCombat.attack = { t: 0, dur: 0, heavy: false, hitDone: false };
        audio.attack();
      } else if (input.isDown('attack_heavy') && player.focus >= HEAVY.focusCost) {
        playerCombat.attack = { t: 0, dur: 0, heavy: true, hitDone: false };
        player.setFocus(player.focus - HEAVY.focusCost);
        audio.attack();
      } else if (input.justPressed('dodge') && player.focus >= DODGE.focusCost) {
        // v0.15.1: arah dodge mengikuti arah gerak yang ditahan (relatif
        // kamera, konvensi sama dgn lokomosi combat); tanpa input → backstep
        // MENJAUHI musuh. Sebelumnya dir = normalize(musuh − pemain) →
        // menghempas LANGSUNG KE ARAH MUSUH dan mendarat pas di jangkauan
        // pukulan berikutnya begitu invuln habis.
        let ddx = -nx;
        let ddz = -nz;
        const dIx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
        const dIz = (input.isDown('forward') ? 1 : 0) - (input.isDown('back') ? 1 : 0);
        if (dIx || dIz) {
          const yaw = camYaw();
          const fX = -Math.sin(yaw);
          const fZ = -Math.cos(yaw);
          const rX = -fZ;
          const rZ = fX;
          const mx = fX * dIz + rX * dIx;
          const mz = fZ * dIz + rZ * dIx;
          const mlen = Math.hypot(mx, mz) || 1;
          ddx = mx / mlen;
          ddz = mz / mlen;
        }
        playerCombat.dodge = { t: 0, dirX: ddx, dirZ: ddz };
        player.setFocus(player.focus - DODGE.focusCost);
        playerCombat.invuln = DODGE.invuln;
        audio.dodge();
      }
    } else {
      playerAnim.current.speed = 0;
      // v0.16.1: while blocking, square up to the enemy too — the block cone
      // needs playerPos.facing toward the threat; camera-follow here would
      // drop the guard the moment the player looks away.
      playerPos.facing = approachFacing(playerPos.facing, Math.atan2(dx, dz), dt, COMBAT_TURN_RATE);
    }
  }

  if (playerCombat.invuln > 0) playerCombat.invuln -= dt;
  if (enemyAnim.current.hurtT >= 0) {
    enemyAnim.current.hurtT += dt * 4;
    if (enemyAnim.current.hurtT > 1) enemyAnim.current.hurtT = -1;
  }

  // movement application (simple, kinematic; y handled by gravity tick)
  // v0.16.0: player↔enemy personal space — figures are visual bodies without
  // physics colliders, so the player could walk (or dodge) straight through
  // the enemy. Inside the 0.95 m ring the into-enemy velocity component is
  // stripped (slide around), and any existing overlap is pushed out hard.
  if (dist < 0.95 && dist > 1e-4) {
    const into = moveX * nx + moveZ * nz;
    if (into > 0) {
      moveX -= nx * into;
      moveZ -= nz * into;
    }
    if (dist < 0.8) {
      const push = 0.8 - dist;
      playerPos.x -= nx * push;
      playerPos.z -= nz * push;
      if (body) {
        const tr = body.translation();
        body.setTranslation({ x: playerPos.x, y: tr.y, z: playerPos.z }, true);
      }
    }
  }
  if (body) {
    const lv = body.linvel();
    // v0.16.0: wake=true WAJIB — tanpa ini badan rapier yang tertidur saat
    // pemain diam di COMBAT mengabaikan SEMUA setLinvel (walau FSM musuh
    // tetap jalan, karena enemyPos digerakkan langsung). Inilah akar "pemain
    // belum bisa bergerak (wasd, spasi)" selama pertarungan: jalan di
    // GAMEPLAY normal (branch sana selalu wake), begitu masuk duel dan badan
    // sempat sleep → kontrol mati total sampai keluar duel.
    body.setLinvel({ x: moveX, y: lv.y, z: moveZ }, true);
  }

  // ---------------- enemy FSM ----------------
  const st = enemyRuntime.state;
  st.t += dt;
  enemyAnim.current.speed = 0;

  if (enemy.hp <= 0) {
    st.state = 'ko';
    enemyAnim.current.down = true;
    return;
  }

  switch (st.state) {
    case 'spawn':
      if (st.t > 0.6) {
        // BUG-8.3: enter idle first instead of immediately approaching.
        // Gives the player a brief moment to read the encounter.
        st.state = 'idle';
        st.t = 0;
      }
      break;
    case 'idle': {
      // face player slowly; approach only when within perception radius
      const targetFacing = Math.atan2(dx, dz);
      const dFacing = angleDiff(targetFacing, st.facing);
      st.facing += Math.sign(dFacing) * Math.min(Math.abs(dFacing), ENEMY_IDLE_TURN_RATE * dt);
      enemyAnim.current.speed = 0;
      if (dist < ENEMY_PERCEPTION) {
        st.state = 'approach';
        st.t = 0;
      }
      break;
    }
    case 'approach': {
      // v0.15.2: regesi ARAH gerak — dulu `+= n` (vektor pemain→musuh) yang
      // membuat musuh berjalan lurus MENJAUH dari pemain dan tidak pernah
      // sampai menyerang. `-= n` = mendekat. Saat jauh (dist > 3.5 m) musuh
      // mengejar sedikit di atas kecepatan jalan pemain (3.4 m/s) supaya duel
      // tidak bisa dimanipulasi dengan jalan mundur terus; pemain yang lari
      // (5.6 m/s) tetap bisa kabur untuk memesan jarak.
      const sp = dist > 3.5 ? Math.max(enemy.speed, 3.6) : enemy.speed;
      enemyPos.x -= nx * sp * dt;
      enemyPos.z -= nz * sp * dt;
      enemyAnim.current.speed = sp;
      st.facing = Math.atan2(dx, dz);
      if (dist < 1.7 && st.cooldown <= 0) {
        st.state = 'windup';
        st.t = 0;
      }
      break;
    }
    case 'windup':
      st.facing = Math.atan2(dx, dz);
      if (st.t > 0.42) {
        st.state = 'strike';
        st.t = 0;
      }
      break;
    case 'strike': {
      // v0.15.1: hitDone guard — satu ayunan hanya menghubungkan SEKALI.
      if (!st.hitDone && st.t < 0.12 && dist < 2.1) {
        if (playerCombat.invuln <= 0) {
          st.hitDone = true;
          // BUG-8.2 fix: block cone angle. Player faces `player.facing` (radians
          // where atan2(vx, vz) = direction of movement/looking). Enemy is at
          // offset (dx, dz) from player. For player to block, player.facing
          // must point toward enemy → angle = atan2(dx, dz). Previously used
          // atan2(-dx, -dz) which is reversed (player facing AWAY from enemy).
          // BUG-FIX: use playerPos.facing (live) not player.facing (stale store)
          const blocked = playerCombat.block && Math.abs(angleDiff(Math.atan2(dx, dz), playerPos.facing)) < 1.4;
          const dmg = blocked ? Math.max(1, Math.round(enemy.dmg * 0.3)) : enemy.dmg;
          usePlayer.getState().damage(dmg);
          useCombat.getState().hitPlayer(dmg);
          audio.hurt();
          requestShake(0.22);
          if (!blocked) {
            playerCombat.stagger = 0.28;
            playerCombat.block = false;
            playerAnim.current.block = false;
          }
          const hp = usePlayer.getState().hp;
          if (hp <= 0) {
            // v0.15.0: beberapa pertarungan adalah KEPUTUSAN CERITA — kalah
            // bukan game over generik, tapi cabang ending (secret battle rute
            // netral → "Bonyok Tanpa Nama"). Encounter dengan onLose
            // menyerahkan kendali ke graph cerita, bukan layar game over.
            const encId = useCombat.getState().encounterId;
            const onLose = encId ? ENCOUNTERS[encId]?.onLose : undefined;
            useCombat.getState().finish('lost');
            audio.defeat();
            if (onLose) {
              useCombat.getState().reset();
              resetCombatRuntime();
              enemyPos.active = false;
              useDialogue.getState().open(onLose, true);
              return;
            }
            playerAnim.current.down = true;
            useGame.getState().setMode('GAME_OVER');
            return;
          }
        }
      }
      if (st.t > 0.16) {
        st.state = 'recover';
        st.t = 0;
      }
      break;
    }
    case 'recover':
      if (st.t > 0.5) {
        st.state = 'approach';
        st.t = 0;
        st.cooldown = 0.9 + Math.random() * 1.1;
      }
      break;
    case 'hurt':
    case 'stagger':
      if (st.t > 0.32) {
        // BUG-8.3: if player ran away during stagger, return to idle to
        // re-evaluate perception instead of auto-resuming chase.
        st.state = dist < ENEMY_PERCEPTION ? 'approach' : 'idle';
        st.t = 0;
      }
      break;
    case 'ko':
      break;
  }
  if (st.cooldown > 0) st.cooldown -= dt;
  enemyAnim.current.attackT = st.state === 'windup' ? st.t / 0.42 * 0.4 : st.state === 'strike' ? 0.4 + st.t / 0.16 * 0.6 : -1;

  // v0.16.0: keep the enemy out of the player's personal space. Dulu blok ini
  // SAMA ARAHNYA TERBALIK (`-= n`) — malah menyeret musuh LEBIH DEKAT saat
  // dist < 0.9 (bug "menumpuk"). Kini koreksi posisi keras ke ring 0.8 m,
  // dihitung dari posisi TERKINI (dist/n di atas usang setelah approach
  // menggerakkan musuh di tick ini).
  {
    const rdx = enemyPos.x - playerPos.x;
    const rdz = enemyPos.z - playerPos.z;
    const rdist = Math.hypot(rdx, rdz);
    if (rdist < 0.8 && rdist > 1e-4) {
      const push = 0.8 - rdist;
      enemyPos.x += (rdx / rdist) * push;
      enemyPos.z += (rdz / rdist) * push;
    }
  }
}

function onEnemyHit(hpAfter: number, heavy: boolean) {
  const combat = useCombat.getState();
  const enemy = combat.enemy();
  if (!enemy) return;
  const st = enemyRuntime.state;
  if (hpAfter <= 0) {
    // handled by store advancing to next enemy or victory
  } else {
    st.state = 'hurt';
    st.t = 0;
    if (heavy && Math.random() < 0.35) {
      st.state = 'stagger';
    }
  }
}

export function angleDiff(a: number, b: number) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function camYaw() {
  return camState.yaw;
}

// Victory/defeat flow is driven by CombatScene watching the store.
export function finishCombatWin() {
  const combat = useCombat.getState();
  const game = useGame.getState();
  const onWin = combat.encounterId ? ENCOUNTERS[combat.encounterId]?.onWin : undefined;
  audio.victory();
  useStats.getState().addStat('violence', 1);
  combat.reset();
  resetCombatRuntime();
  enemyPos.active = false;
  game.setMode('GAMEPLAY');
  // v0.14.1: lanjutan cerita pasca-kombat adalah STORY SCENE — selalu
  // CINEMATIC, sama seperti scene cerita lain, supaya staging Ren + aktor
  // SCENE_ACTORS terpasang dan kamera memakai cameraStage authoran (bukan
  // speaker-shot dari registry live yang bisa memuat posisi hantu scene lain).
  if (onWin) useDialogue.getState().open(onWin, true);
}
