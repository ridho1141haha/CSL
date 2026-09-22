// AUDIT v0.14.1 — cinematic camera wrong-location bug.
// Walks every CINEMATIC story node (opening / chapter2 / chapter3 / routes /
// endings) and checks the camera path CameraRig takes for it:
//   1. authored pose      — CAM_BY_NODE[node] -> CAMERA_POSES[key]
//   2. speaker-shot       — shotForNode: resolveCast -> entityPosition (LIVE
//                           registries actorPositions ?? npcPositions ?? player)
//   3. static fallback    — 'courtyard_view' (hardcoded guess)
// Flags:
//   A = node has NO CAM_BY_NODE entry (falls into shot/fallback guessing)
//   B = speaker resolves to an entity NOT staged by this node's cast
//       (OPENING_ACTORS/SCENE_ACTORS) nor Ren-with-REN_STAGING → the shot
//       would read a stale/npc-scheduled position (wrong location)
//   C = listener (Ren-speaking nodes) can resolve to an unrelated NPC
//   D = CAM_BY_NODE points at a pose key that does not exist in CAMERA_POSES
// Run: npx vite-node scripts/audit-camera.ts
import { DIALOGUE } from '../src/data/dialogue';
import { CAM_BY_NODE } from '../src/data/chapters';
import { CAMERA_POSES } from '../src/data/world';
import { OPENING_ACTORS, SCENE_ACTORS, REN_STAGING } from '../src/data/chapters';
import { NPC_NODES } from '../src/data/story/npc';
import { DISCOVERY_NODES } from '../src/data/story/discoveries';
import { AMBIENT_NODES } from '../src/data/story/ambient';

// node files that are opened DIALOGUE-mode (cinematic=false) — excluded
const DIALOGUE_MODE_IDS = new Set(
  [...NPC_NODES, ...DISCOVERY_NODES, ...AMBIENT_NODES].map((n) => n.id),
);

// expand a node's cast exactly like App.CinematicActors does
function stagedIds(nodeId: string): Map<string, { x: number; z: number }> {
  const cast = OPENING_ACTORS[nodeId] ?? SCENE_ACTORS[nodeId];
  const map = new Map<string, { x: number; z: number }>();
  if (!cast) return map;
  cast.bullies?.forEach((s, i) => map.set(i === 0 ? 'gang' : `gang${i}`, { x: s.pos[0], z: s.pos[1] }));
  if (cast.aris) map.set('aris', { x: cast.aris.pos[0], z: cast.aris.pos[1] });
  if (cast.siti) map.set('siti', { x: cast.siti.pos[0], z: cast.siti.pos[1] });
  if (cast.bimo) map.set('bimo', { x: cast.bimo.pos[0], z: cast.bimo.pos[1] });
  if (cast.budi) map.set('budi', { x: cast.budi.pos[0], z: cast.budi.pos[1] });
  cast.followers?.forEach((s, i) => map.set(i === 0 ? 'follower' : `follower${i}`, { x: s.pos[0], z: s.pos[1] }));
  return map;
}

// portrait → entity id (mirror of acting.speakerEntityId)
function speakerEntity(portrait: string | undefined, speaker: string): string | null {
  if (speaker === 'NARATOR') return null;
  if (!portrait || portrait === 'generic' || portrait === 'narrator') return null;
  if (portrait === 'ren') return 'ren';
  if (portrait === 'bully') return 'gang';
  if (portrait === 'gang') return 'gang';
  return ['aris', 'siti', 'bimo', 'budi'].includes(portrait) ? portrait : null;
}

const rows: string[] = [];
let a = 0, b = 0, d = 0;
for (const node of Object.values(DIALOGUE)) {
  if (DIALOGUE_MODE_IDS.has(node.id)) continue; // NPC talks / flavor: DIALOGUE mode
  const isStory = /^(o\d|ch2_|ch3_|ch4_|n\d)/.test(node.id);
  if (!isStory) continue;

  const staged = stagedIds(node.id);
  const hasPose = !!CAM_BY_NODE[node.id];
  const poseKey = CAM_BY_NODE[node.id];
  const poseExists = poseKey ? !!CAMERA_POSES[poseKey] : false;
  const renStaged = !!REN_STAGING[node.id];
  const spk = speakerEntity(node.portrait, node.speaker);

  const flags: string[] = [];
  if (!hasPose) { flags.push('A'); a++; }
  if (poseKey && !poseExists) { flags.push('D:pose-missing'); d++; }
  if (spk) {
    const spkOk = spk === 'ren' ? renStaged : staged.has(spk);
    if (!spkOk) { flags.push(`B:spk=${spk}${spk === 'ren' ? '(no-REN_STAGING)' : ' unstaged'}`); b++; }
  }
  rows.push(`${flags.length ? flags.join(' ') : 'ok'}  ${node.id.padEnd(20)} spk=${(spk ?? '-').padEnd(9)} cam=${poseKey ?? '-'}`);
}

console.log(rows.join('\n'));
console.log(`\n== SUMMARY ==\nnodes checked : ${rows.length}\nA no CAM_BY_NODE: ${a}\nB speaker unstaged: ${b}\nD pose missing  : ${d}`);
