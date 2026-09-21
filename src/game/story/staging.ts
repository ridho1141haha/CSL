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

import { REN_STAGING } from '../../data/chapters';
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
