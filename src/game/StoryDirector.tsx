import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '../stores/gameStore';
import { useStory } from '../stores/storyStore';
import { useQuests } from '../stores/questStore';
import { useSocial } from '../stores/socialStore';
import { useDialogue } from '../stores/dialogueStore';
import { input } from './input';
import { playerPos, npcPositions, enemyPos } from './runtime';
import { zoneAt } from '../data/world';
import { NPC_BY_ID } from '../data/npcs';
import { ZONE_FLAVOR } from '../data/dialogue';
import { saveGame } from './save';

const EXPLORE_TARGETS = ['courtyard', 'canteen', 'field', 'back_alley'] as const;

// Per-frame world↔story glue: zone discovery, quest progression triggers,
// NPC interaction. All state changes go through stores/effects.
export function StoryDirector() {
  const zoneTimer = useRef(0);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const game = useGame.getState();
    const story = useStory.getState();
    const quests = useQuests.getState();
    const dialogue = useDialogue.getState();

    // ---------- interaction (E) ----------
    // BUG-3.5: skip NPC interaction while combat encounter is active
    if (input.justPressed('interact') && game.mode === 'GAMEPLAY' && !enemyPos.active) {
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

    // prompt: nearest NPC (BUG-3.5: hide prompt during combat)
    let near: string | null = null;
    if (!enemyPos.active) {
      for (const [id, p] of Object.entries(npcPositions)) {
        const d = Math.hypot(playerPos.x - p.x, playerPos.z - p.z);
        if (d < 2.3) {
          const def = NPC_BY_ID[id];
          if (def) near = def.name;
        }
      }
    }
    game.setInteractTarget(near);

    // ---------- route montages (may start while still in CINEMATIC) ----------
    const montageReady = (game.mode === 'GAMEPLAY' || game.mode === 'CINEMATIC') && !dialogue.nodeId;

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
    const zone = zoneAt(playerPos.x, playerPos.z);
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

    // ---------- chapter 3: rooftop meeting ----------
    if (quests.quests.rooftop_meeting === 'active' && game.currentZone === 'back_stairs' && story.chapter === 3) {
      quests.setState('rooftop_meeting', 'completed');
      story.setBeat('ch3_rooftop');
      dialogue.open('ch3_intro_1', true);
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
