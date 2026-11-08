import { useCombat } from '../stores/combatStore';
import { useGame } from '../stores/gameStore';
import { applySave, parseSave, slotRaw, type SaveV2, type SlotId } from './save';
import { resetCombatRuntime } from './combat/combat';
import { enemyPos } from './runtime';

// v0.17.0 — load orchestration, extracted from save.ts.
//
// Why this file exists: loadGame must reset the combat RUNTIME (module state:
// playerAnim down-pose, enemyPos, FSM) before restoring a save. save.ts used
// to import combat.ts for that — closing the module cycle
//   save → combat/combat → stores/dialogueStore → systems/effects → save
// (madge found 2 cycles rooted here). save.ts is now pure storage
// (snapshot ↔ localStorage, parse/migrate); THIS module owns the
// orchestration. Nothing in src/game or src/stores imports loadFlow, so the
// dependency direction stays acyclic: UI/App → loadFlow → {save, combat}.
export function loadGame(slot: SlotId): string {
  try {
    const raw = slotRaw(slot);
    if (!raw) return 'Slot kosong.';
    const data = parseSave(JSON.parse(raw));
    if (!data) return 'Data save tidak valid.';
    // Reset combat visuals/state before restoring gameplay: after a KO the
    // player anim (down) and enemyPos.active persist in module state and would
    // otherwise render the character lying down + suppress NPC interaction.
    useCombat.getState().reset();
    resetCombatRuntime();
    enemyPos.active = false;
    applySave(data);
    useGame.getState().setMode('GAMEPLAY');
    return '';
  } catch {
    return 'Data save tidak valid.';
  }
}
