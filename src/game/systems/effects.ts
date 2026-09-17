import type { Effect } from '../../types';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { useStats } from '../../stores/statsStore';
import { useStory } from '../../stores/storyStore';
import { useSocial } from '../../stores/socialStore';
import { useQuests } from '../../stores/questStore';
import { useInventory } from '../../stores/inventoryStore';
import { useCombat } from '../../stores/combatStore';
import { useDialogue } from '../../stores/dialogueStore';
import { CHAPTERS } from '../../data/chapters';
import { resolveEnding } from './endingResolver';
import type { StoryBeat } from '../../types';

// Central effect pipeline: dialogue nodes/choices and quest rewards mutate
// game state only through here, so notifications and side-effects stay coherent.
export function applyEffects(effects: Effect[]) {
  for (const e of effects) applyEffect(e);
}

export function applyEffect(e: Effect) {
  const game = useGame.getState();
  switch (e.k) {
    case 'flag':
      useStory.getState().setFlag(e.id);
      break;
    case 'rel': {
      const before = useSocial.getState().relationships[e.target] ?? 0;
      useSocial.getState().addRel(e.target, e.delta);
      const after = useSocial.getState().relationships[e.target] ?? 0;
      if (after > before) game.notify(`${cap(e.target)}: hubungan menguat (+${after - before})`, 'social');
      else if (after < before) game.notify(`${cap(e.target)}: hubungan menurun (${after - before})`, 'warn');
      break;
    }
    case 'stat':
      if (e.stat === 'focus') usePlayer.getState().addFocus(e.delta);
      else useStats.getState().addStat(e.stat, e.delta);
      break;
    case 'hp':
      if (e.delta >= 0) usePlayer.getState().heal(e.delta);
      else usePlayer.getState().damage(-e.delta);
      break;
    case 'quest':
      useQuests.getState().setState(e.id, e.state);
      if (e.state === 'active') game.notify('Quest diperbarui', 'quest');
      if (e.state === 'completed') game.notify('Quest selesai', 'quest');
      break;
    case 'item':
      if (e.remove) useInventory.getState().remove(e.id);
      else useInventory.getState().add(e.id);
      break;
    case 'time':
      game.advanceTime(e.minutes);
      break;
    case 'chapter':
      if (useStory.getState().chapter !== e.id) {
        useStory.getState().setChapter(e.id);
        // default beat per chapter (can be overridden by an explicit beat effect)
        // v0.7.0: chapter 2 → ch2_key_error ("Kesalahan Kecil Aris")
        const beat: Record<number, StoryBeat> = { 1: 'ch1_explore', 2: 'ch2_key_error', 3: 'ch3_rooftop', 4: 'ch4_res_search' };
        useStory.getState().setBeat(beat[e.id] ?? 'ch1_explore');
        game.requestChapterCard(e.id);
      }
      break;
    case 'beat':
      useStory.getState().setBeat(e.id);
      break;
    case 'route':
      useStory.getState().setRoute(e.id);
      break;
    case 'ending': {
      const s = useStory.getState();
      const ending = resolveEnding({
        route: s.route,
        flags: s.flags,
        stats: useStats.getState(),
        focus: usePlayer.getState().focus,
        relationships: useSocial.getState().relationships,
      });
      game.setEnding(ending);
      useCombat.getState().reset();
      useDialogue.getState().reset();
      game.setMode('ENDING');
      break;
    }
    case 'combat':
      useCombat.getState().start(e.encounter);
      game.setMode('COMBAT');
      break;
    case 'notify':
      game.notify(e.text);
      break;
    case 'visit-zone':
      game.visitZone(e.zone);
      break;
    case 'scene':
      // Multi-scene transition (rooftop / warehouse / back to campus).
      game.requestScene(e.id, e.spawn);
      break;
    case 'teleport':
      usePlayer.getState().setPos(e.x, e.z);
      break;
    case 'study':
      game.setMode('STUDY');
      break;
    case 'save':
      // Story checkpoint: persist to the auto slot (see dialogue.ts usages).
      // Dynamic import on purpose: save.ts pulls in combat/combat.ts which
      // imports dialogueStore → this module; a static edge would be circular.
      void import('../save').then(({ saveGame }) => saveGame('auto'));
      break;
  }
}

// v0.7.0: kartu bab kini route-aware — rute netral punya judul bab sendiri
// (GDD §Bab 3/4 Rute Netral). v0.11.0 GARIS MERAH: rute bad juga.
export function chapterCardText(id: number, route?: string) {
  const c = CHAPTERS[id as 1 | 2 | 3 | 4];
  if (!c) return { title: `BAB ${id}`, subtitle: '' };
  if (route === 'neutral' && id === 3) return { title: c.title, subtitle: 'Dinding Dingin & Keheningan Kelas' };
  if (route === 'neutral' && id === 4) return { title: c.title, subtitle: 'Netral Ending — Lulus Tanpa Nama' };
  if (route === 'bad' && id === 4) return { title: c.title, subtitle: 'Tunduk Pada Kekuasaan' };
  return { title: c.title, subtitle: c.subtitle };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
