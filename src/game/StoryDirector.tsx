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
import { applyEffects } from './systems/effects';
import { pickZoneEvent, pickNpcEvent, discoverEvent } from './systems/hiddenEvents';
import { periodFor } from './systems/time';

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
          // hidden npc-moments take priority over the regular dialogue root —
          // talking to an NPC at the right time can reveal secret content
          const ev = pickNpcEvent(def.id);
          if (ev) {
            discoverEvent(ev);
            dialogue.open(ev.dialogue);
            return;
          }
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

    // ---------- neutral route: montage "Dinding Dingin" after ignoring Aris ----------
    if (montageReady && story.beat === 'ch3_neutral' && story.route === 'neutral' && !story.flags.includes('neu_montage_done')) {
      story.setFlag('neu_montage_done');
      dialogue.open('n1_1', true);
      return;
    }

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

    // ---------- neutral route: graduation day at the main gate ----------
    if (
      game.scene === 'campus' &&
      game.currentZone === 'gate' &&
      story.chapter === 4 &&
      story.route === 'neutral' &&
      story.beat === 'ch4_neutral_grad' &&
      !story.flags.includes('grad_scene_done')
    ) {
      story.setFlag('grad_scene_done');
      dialogue.open('ch4_neu_grad_1', true);
      return;
    }

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

    // ---------- hidden events (mentor #5) ----------
    // Zone-triggered discoveries. Evaluated every tick (not only on zone
    // change) because period/chapter requirements can become true while the
    // player stands still. One-time guard lives inside eventReady.
    const hidden = pickZoneEvent(game.currentZone);
    if (hidden) {
      discoverEvent(hidden);
      dialogue.open(hidden.dialogue);
      return;
    }

    if (game.scene !== 'campus') return;

    // ---------- side quest completions (mentor #6) ----------
    // Optional quests complete through existing world state (zone, period,
    // flags) — the same pattern as explore_school above.
    const q = quests.quests;
    if (q.aris_notes === 'active' && story.flags.includes('studied_once')) {
      applyEffects([
        { k: 'quest', id: 'aris_notes', state: 'completed' },
        { k: 'stat', stat: 'academic', delta: 3 },
        { k: 'rel', target: 'aris', delta: 2 },
        { k: 'notify', text: 'Quest selesai: Pinjaman Catatan (Akademik +3)' },
      ]);
      return;
    }
    if (q.canteen_teh === 'active' && game.currentZone === 'canteen' && periodFor(game.clock.minutes).id === 'lunch') {
      applyEffects([
        { k: 'quest', id: 'canteen_teh', state: 'completed' },
        { k: 'flag', id: 'canteen_teh_done' },
        { k: 'notify', text: 'Teh dibawa. Pulangkan ke Siti.' },
      ]);
      return;
    }
    if (q.field_training === 'active' && game.currentZone === 'field' && periodFor(game.clock.minutes).id === 'after') {
      applyEffects([
        { k: 'quest', id: 'field_training', state: 'completed' },
        { k: 'stat', stat: 'violence', delta: 2 },
        { k: 'hp', delta: 10 },
        { k: 'notify', text: 'Latihan senja selesai. (Instink +2, Tenaga +10)' },
      ]);
      return;
    }
    if (q.alley_check === 'active' && (game.currentZone === 'back_alley' || story.flags.includes('alley_mark'))) {
      applyEffects([
        { k: 'quest', id: 'alley_check', state: 'completed' },
        { k: 'flag', id: 'alley_checked' },
        { k: 'stat', stat: 'diplomacy', delta: 2 },
        { k: 'notify', text: 'Tanda geng tercatat. Laporkan ke Siti. (Diplomasi +2)' },
      ]);
      return;
    }

    // ---------- chapter 1: explore objective ----------
    if (quests.quests.explore_school === 'active' && story.beat === 'ch1_explore') {
      const done = EXPLORE_TARGETS.every((z) => game.visitedZones.includes(z));
      if (done) {
        quests.setState('explore_school', 'completed');
        // advance clock to break time (10:05)
        const delta = (10 * 60 + 5 - game.clock.minutes + 1440) % 1440;
        game.advanceTime(delta || 1440);
        // v0.7.0: bab 2 kini "Kesalahan Kecil Aris" — aktif lewat tangga belakang
        quests.setState('aris_incident', 'active');
        story.setBeat('ch1_break');
        game.notify('Quest selesai: Jelajahi SMA Yuson', 'quest');
        game.notify('Bel istirahat. Ren mencari tempat makan...', 'info');
        saveGame('auto');
        return;
      }
    }

    // ---------- chapter 2: Kesalahan Kecil Aris (tangga belakang, saat istirahat) ----------
    // Dua fase: (1) tampilkan kartu BAB II lalu (2) setelah kartu ditutup,
    // buka scene-nya. Kedua fase pakai flag guard agar tidak terpicu ulang.
    if (
      story.beat === 'ch1_break' &&
      quests.quests.aris_incident === 'active' &&
      game.currentZone === 'back_stairs' &&
      !story.flags.includes('ch2_scene_started')
    ) {
      story.setFlag('ch2_scene_started');
      applyEffects([{ k: 'chapter', id: 2 }]); // kartu BAB II + beat ch2_key_error
      return;
    }
    if (
      story.beat === 'ch2_key_error' &&
      quests.quests.aris_incident === 'active' &&
      game.currentZone === 'back_stairs' &&
      game.mode === 'GAMEPLAY' &&
      !dialogue.nodeId &&
      !story.flags.includes('ch2_scene_opened')
    ) {
      story.setFlag('ch2_scene_opened');
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
