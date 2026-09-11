import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../stores/gameStore';
import { useStory } from '../stores/storyStore';
import { useQuests } from '../stores/questStore';
import { useSocial } from '../stores/socialStore';
import { useDialogue } from '../stores/dialogueStore';
import { input } from './input';
import { playerPos, npcPositions, enemyPos } from './runtime';
import { zoneAt, SCENES } from '../data/world';
import { NPC_BY_ID } from '../data/npcs';
import { ZONE_FLAVOR } from '../data/dialogue';
import { saveGame } from './save';

const EXPLORE_TARGETS = ['courtyard', 'canteen', 'field', 'back_alley'] as const;

// Per-frame world↔story glue: zone discovery, quest progression triggers,
// NPC interaction, multi-scene transitions (rooftop / warehouse). All state
// changes go through stores/effects.
export function StoryDirector() {
  const zoneTimer = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const game = useGame.getState();
    const story = useStory.getState();
    const quests = useQuests.getState();
    const dialogue = useDialogue.getState();

    // ---------- interaction (E) — campus NPCs only ----------
    if (
      input.justPressed('interact') &&
      game.mode === 'GAMEPLAY' &&
      !enemyPos.active &&
      game.scene === 'campus'
    ) {
      let best: { id: string; d: number } | null = null;
      for (const [id, p] of Object.entries(npcPositions)) {
        const d = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
        if (d < 2.3 && (!best || d < best.d)) best = { id, d };
      }
      if (best) {
        const def = NPC_BY_ID[best.id];
        if (def) {
          useSocial.getState().visit(def.id as never);
          dialogue.open(def.dialogueRoot);
          return;
        }
      }
    }

    // interact prompt (throttled with zone check)
    zoneTimer.current += dt;
    if (zoneTimer.current < 0.2) return;
    zoneTimer.current = 0;

    // prompt: nearest NPC (campus only; hidden during combat)
    let near: string | null = null;
    if (!enemyPos.active && game.scene === 'campus') {
      for (const [id, p] of Object.entries(npcPositions)) {
        const d = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
        if (d < 2.3) {
          const def = NPC_BY_ID[id];
          if (def) near = def.name;
        }
      }
    }
    game.setInteractTarget(near);

    // ---------- route montages (campus only, may start during CINEMATIC) ----------
    // Scene guard matters right after chapter 3: the accept/reject nodes send
    // the player back from the rooftop via requestScene (async swap) — the
    // montage must not open while still standing on the old scene.
    const montageReady =
      game.scene === 'campus' &&
      (game.mode === 'GAMEPLAY' || game.mode === 'CINEMATIC') &&
      !dialogue.nodeId;

    // ---------- bad route: montage after accepting ----------
    if (montageReady && story.beat === 'ch4_bad_warehouse' && story.route === 'bad' && !story.flags.includes('bad_montage_done')) {
      story.setFlag('bad_montage_done');
      dialogue.open('ch4_bad_1', true);
      return;
    }

    // ---------- resistance route: montage after rejecting ----------
    if (montageReady && story.beat === 'ch4_res_search' && story.route === 'resistance' && !story.flags.includes('res_montage_done')) {
      story.setFlag('res_montage_done');
      dialogue.open('ch4_res_1', true);
      return;
    }

    if (game.mode !== 'GAMEPLAY') return;

    // ---------- rooftop: start the chapter 3 proposition ----------
    if (game.scene === 'rooftop' && story.chapter === 3 && story.beat === 'ch3_rooftop' && !story.flags.includes('ch3_rooftop_started')) {
      story.setFlag('ch3_rooftop_started');
      dialogue.open('ch3_intro_1', true);
      return;
    }

    // ---------- rooftop: exit back to campus ----------
    if (game.scene === 'rooftop' && game.currentZone === 'rooftop_door' && story.chapter >= 3) {
      game.requestScene('campus', [0, -5]);
      return;
    }

    // ---------- warehouse: exit back to campus ----------
    if (game.scene === 'warehouse' && game.currentZone === 'warehouse_door') {
      game.requestScene('campus', [-23.5, -26]);
      return;
    }

    // ---------- zone discovery + flavor (scene-aware) ----------
    const zone = zoneAt(playerPos.x, playerPos.z, game.scene);
    if (zone) {
      if (game.currentZone !== zone.id) {
        game.setCurrentZone(zone.id);
        game.visitZone(zone.id);
      }
      const flavor = ZONE_FLAVOR[zone.id];
      if (flavor && !story.flags.includes(`zone_seen_${zone.id}`)) {
        story.setFlag(`zone_seen_${zone.id}`);
        dialogue.open(flavor);
        return;
      }
    }

    if (game.scene !== 'campus') return;

    // ---------- chapter 1: explore objective ----------
    if (quests.quests.explore_school === 'active' && story.beat === 'ch1_explore') {
      const done = EXPLORE_TARGETS.every((z) => game.visitedZones.includes(z));
      if (done) {
        quests.setState('explore_school', 'completed');
        // advance clock to break time (10:05)
        const delta = (10 * 60 + 5 - game.clock.minutes + 1440) % 1440;
        game.advanceTime(delta || 1440);
        quests.setState('gate_trouble', 'active');
        story.setBeat('ch1_break');
        game.notify('Quest selesai: Jelajahi SMA Yuson', 'quest');
        game.notify('Bel istirahat. Sesuatu terlihat di gerbang...', 'info');
        saveGame('auto');
        return;
      }
    }

    // ---------- chapter 2: gate trouble ----------
    if (story.beat === 'ch1_break' && quests.quests.gate_trouble === 'active' && game.currentZone === 'gate') {
      story.setBeat('ch2_gate');
      quests.setState('gate_trouble', 'completed');
      dialogue.open('ch2_intro_1');
      return;
    }

    // ---------- chapter 3: climb the back stairs → rooftop scene ----------
    if (quests.quests.rooftop_meeting === 'active' && game.currentZone === 'back_stairs' && story.chapter === 3) {
      quests.setState('rooftop_meeting', 'completed');
      story.setBeat('ch3_rooftop');
      story.setFlag('rooftop_arrived');
      game.notify('Tujuan: Naik ke atap', 'quest');
      game.requestScene('rooftop');
      return;
    }

    // ---------- chapter 4 resistance: find Aris ----------
    if (quests.quests.find_aris === 'active' && (game.currentZone === 'back_alley' || game.currentZone === 'street') && story.chapter === 4) {
      quests.setState('find_aris', 'completed');
      story.setBeat('ch4_res_alley');
      dialogue.open('ch4_res_alley', true);
      return;
    }
  });

  return null;
}

// SCENES import is used implicitly through requestScene defaults; keep a
// type-level reference so bundlers don't tree-shake scene definitions that
// tests and the map panel rely on.
void SCENES;
