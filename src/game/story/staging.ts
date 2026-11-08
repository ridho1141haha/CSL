// ============================================================================
// staging.ts — Story staging runner (v0.14.0, Task 2/3/7).
//
// Story scene kini menentukan WHERE / WHO / POSE / CAMERA / DIALOGUE — bukan
// cuma DIALOGUE. Semua data penempatan hidup di data/chapters.ts mengikuti
// schema yang sudah ada (per-node tables):
//   NPC    → OPENING_ACTORS / SCENE_ACTORS (Spot { pos, face, sit, crouch, hold })
//   Kamera → CAM_BY_NODE (+ CAMERA_POSES)
//   Prop   → STORY_PROPS
//   REN    → REN_STAGING (v0.14.0 — potongan yang sebelumnya hilang)
//
// applyPlayerStaging() dipanggil setiap kali node dialogue berubah (komponen
// <StoryPlayerStaging/> di App). Karena input player terkunci saat
// DIALOGUE/CINEMATIC, transisi sinematiknya aman:
//   node terbuka → (fade NODE_FX) → Ren dipindah ke titik cerita →
//   Ren menghadap lawan bicara → dialogue tampil.
// Free roam otomatis kembali saat scene selesai (mode kembali GAMEPLAY) —
// staging tidak pernah mengunci kontrol lebih dari durasi scene (Task 11).
// ============================================================================

import { REN_STAGING, OPENING_ACTORS, SCENE_ACTORS, CAM_BY_NODE, type StorySpot } from '../../data/chapters';
import { CAMERA_POSES } from '../../data/world';
import { getDialogue } from '../../data/dialogue';
import { computeShot, type ShotResult } from '../systems/shot';
import { SHOT_PRESETS } from '../../data/shots';
import { usePlayer } from '../../stores/playerStore';
import { useGame } from '../../stores/gameStore';
import { useDialogue } from '../../stores/dialogueStore';
import { playerPos } from '../runtime';

/**
 * Deterministic scene placement (Task 3): pindahkan Ren ke titik cerita node
 * ini (jika didefinisikan) + hadapkan ke arah yang diminta.
 *
 * Return true kalau staging diterapkan. Node tanpa data (NPC talk, zone
 * flavor, hidden events, opening FP) tidak pernah disentuh — free roam
 * sepenuhnya utuh.
 */
export function applyPlayerStaging(nodeId: string): boolean {
  const st = REN_STAGING[nodeId];
  if (!st) return false;

  const game = useGame.getState();
  // Scene guard: staging rooftop/warehouse memakai koordinat lokal scene —
  // jangan pernah diterapkan ketika player berada di scene lain (mis. save
  // dimuat tepat sebelum requestScene selesai).
  const expectedScene = st.scene ?? 'campus';
  if (game.scene !== expectedScene) return false;

  const [x, z] = st.pos;
  // setPos → Player.tsx men teleport rigid body (delta > 1 m) via effect
  // existing — tidak ada sistem paralel untuk posisi player.
  usePlayer.getState().setPos(x, z);
  if (st.face) {
    playerPos.facing = Math.atan2(st.face[0] - x, st.face[1] - z);
  }
  return true;
}

/**
 * Entry point deterministik untuk story scene (Task 3): scene selalu sama
 * regardless posisi player sebelumnya. `cinematic` meneruskan ke
 * dialogueStore.open (CINEMATIC memakai CAM_BY_NODE; DIALOGUE memakai
 * speaker-shot). Staging player diterapkan oleh <StoryPlayerStaging/> saat
 * node terbuka, jadi helper ini tetap satu pintu dengan path lain (trigger
 * zona, montase, kelulusan) — tidak ada jalur khusus yang bisa lupa staging.
 */
export function startStoryScene(nodeId: string, cinematic = true): void {
  useDialogue.getState().open(nodeId, cinematic);
}

// ============================================================================
// v0.14.1 — CAMERA STAGING RESOLVER (story scene owns the camera).
//
// Bug yang diperbaiki: kamera sinematik dulu memotret posisi LIVE dari
// registry global (actorPositions ?? npcPositions) tanpa memvalidasi bahwa
// entity itu benar-benar bagian dari scene aktif — posisi hantu dari scene
// LAMA (mis. gang di kantin dari opening o4) menyeret kamera menjauh dari
// scene yang sedang berjalan.
//
// Aturan sekarang: kamera sinematik HANYA membaca data staging scene aktif.
// Urutan resolusi per node (semua murni, testable):
//   1. node.cam   — pilihan shot eksplisit dari data dialogue (rooftop),
//                   divalidasi: speaker/listener wajib distage di cast node.
//   2. CAM_BY_NODE — pose authoran {pos, look} (cameraStage per node).
//   3. null       — penelepon (CameraRig) memframing Ren yang distage;
//                   TIDAK ADA lagi tebakan posisi konstanta.
// ============================================================================

/**
 * Ekspansi cast node cerita ke entity-id → Spot. Konvensi id HARUS sama
 * dengan <CinematicActors/> (App.tsx): bullies → 'gang','gang1',…;
 * followers → 'follower','follower1',…; plus aris/siti/bimo/budi.
 * OPENING_ACTORS menang kalau node ada di dua tabel (sama seperti App).
 */
export function storyCastSpots(nodeId: string): Map<string, StorySpot> {
  const cast = OPENING_ACTORS[nodeId] ?? SCENE_ACTORS[nodeId];
  const map = new Map<string, StorySpot>();
  if (!cast) return map;
  cast.bullies?.forEach((s, i) => map.set(i === 0 ? 'gang' : `gang${i}`, s));
  if (cast.aris) map.set('aris', cast.aris);
  if (cast.siti) map.set('siti', cast.siti);
  if (cast.bimo) map.set('bimo', cast.bimo);
  if (cast.budi) map.set('budi', cast.budi);
  cast.followers?.forEach((s, i) => map.set(i === 0 ? 'follower' : `follower${i}`, s));
  return map;
}

/**
 * Posisi entity UNTUK KAMERA SINEMATIK — sumbernya data staging scene
 * aktif, bukan registry live:
 *   'ren' → playerPos (Ren distage deterministik oleh applyPlayerStaging
 *           sebelum dialogue tampil; posisi player = konstanta scene).
 *   lain  → spot cast node ini dari OPENING/SCENE_ACTORS, atau null kalau
 *           entity TIDAK distage di scene aktif (jangan pernah menebak).
 */
export function stagedEntityPosition(nodeId: string, entityId: string): { x: number; z: number } | null {
  if (entityId === 'ren') return { x: playerPos.x, z: playerPos.z };
  const spot = storyCastSpots(nodeId).get(entityId);
  return spot ? { x: spot.pos[0], z: spot.pos[1] } : null;
}

export type CinematicCamera =
  | { kind: 'shot'; shot: ShotResult } // framing dinamis dari staging (node.cam)
  | { kind: 'pose'; key: string } // pose authoran CAM_BY_NODE
  | null; // tidak ada staging kamera → caller frame Ren yang distage

/**
 * Resolusi kamera untuk node story scene aktif (dipakai CameraRig CINEMATIC).
 * Murni fungsi data → hasil identik di scene mana pun, bebas state lama.
 */
export function resolveCinematicCamera(nodeId: string | null): CinematicCamera {
  if (!nodeId) return null;
  const node = getDialogue(nodeId);

  // 1. pilihan shot eksplisit dari dialogue (node.cam) — hanya sah jika
  //    speaker/listener-nya benar-benar distage di cast node INI.
  if (node?.cam) {
    const preset = SHOT_PRESETS[node.cam];
    if (preset) {
      const cast = storyCastSpots(nodeId);
      // mirror acting.speakerEntityId, tapi divalidasi ke cast node aktif
      const portrait = node.portrait === 'bully' ? 'gang' : node.portrait;
      const spkId =
        node.speaker !== 'NARATOR' && portrait && portrait !== 'generic' && portrait !== 'narrator'
          ? portrait === 'ren'
            ? 'ren'
            : cast.has(portrait)
              ? portrait
              : null
          : null;
      if (spkId) {
        const spk = stagedEntityPosition(nodeId, spkId)!;
        // listener: lawan bicara — NPC bicara → Ren; Ren bicara → anggota
        // cast distage terdekat dengan Ren (cermin nearestNpcToPlayer)
        let lisPos: { x: number; z: number } | null = null;
        if (spkId !== 'ren') {
          lisPos = stagedEntityPosition(nodeId, 'ren');
        } else if (cast.size) {
          let best: { d: number; pos: { x: number; z: number } } | null = null;
          for (const spot of cast.values()) {
            const pos = { x: spot.pos[0], z: spot.pos[1] };
            const d = Math.hypot(pos.x - spk.x, pos.z - spk.z);
            if (!best || d < best.d) best = { d, pos };
          }
          lisPos = best?.pos ?? null;
        }
        return { kind: 'shot', shot: computeShot(preset, spk, lisPos) };
      }
    }
  }

  // 2. pose authoran per node (cameraStage) — sumber utama framing scene.
  const poseKey = CAM_BY_NODE[nodeId];
  if (poseKey && CAMERA_POSES[poseKey]) return { kind: 'pose', key: poseKey };

  // 3. tanpa staging kamera — null, caller frame Ren yang distage.
  return null;
}
