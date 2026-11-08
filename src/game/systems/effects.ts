import type { Effect } from '../../types';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { useStats } from '../../stores/statsStore';
import { useStory } from '../../stores/storyStore';
import { useSocial } from '../../stores/socialStore';
import { useQuests } from '../../stores/questStore';
import { useInventory } from '../../stores/inventoryStore';
import { useCombat } from '../../stores/combatStore';
// v0.17.0: useDialogue import REMOVED — it closed a real module cycle
// (dialogueStore ⇄ effects). The 'ending' cleanup now lives in the dialogue
// store itself (see dialogueStore.advance/choose ENDING guard).
import { CHAPTERS } from '../../data/chapters';
import { resolveEnding } from './endingResolver';
import type { Route } from '../../types';

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
      // v0.17.1: silent — story data that completes a quest mid-trigger keeps
      // its original notification UX instead of the standard toast.
      if (e.silent) break;
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
    case 'time-to': {
      // v0.17.1: advance to the next occurrence of a wall-clock time (minutes
      // of day). Was inline math in StoryDirector's explore_school block —
      // identical formula, including the full-day wrap when the target equals
      // the current minute.
      const delta = (e.minutes - game.clock.minutes + 1440) % 1440;
      game.advanceTime(delta || 1440);
      break;
    }
    case 'chapter':
      if (useStory.getState().chapter !== e.id) {
        useStory.getState().setChapter(e.id);
        // v0.17.0: default beat lives on ChapterDef (data) — was a hardcoded
        // Record<number, StoryBeat> here that silently capped at chapter 4.
        useStory.getState().setBeat(CHAPTERS[e.id]?.defaultBeat ?? 'ch1_explore');
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
      // dialogue cleanup: owned by dialogueStore (ENDING guard after
      // applyEffects) — importing useDialogue here closed a module cycle.
      game.setMode('ENDING');
      break;
    }
    case 'combat':
      useCombat.getState().start(e.encounter);
      game.setMode('COMBAT');
      break;
    case 'notify':
      // v0.17.1: optional color kind (data decides the chip color; default info).
      game.notify(e.text, e.kind);
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
// v0.17.0: route subtitles are DATA (ChapterDef.subtitleByRoute) — was three
// hardcoded Indonesian literals in this engine file (audit P1).
export function chapterCardText(id: number, route?: string) {
  const c = CHAPTERS[id as 1 | 2 | 3 | 4];
  if (!c) return { title: `BAB ${id}`, subtitle: '' };
  const byRoute = route ? c.subtitleByRoute?.[route as Route] : undefined;
  return { title: c.title, subtitle: byRoute ?? c.subtitle };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
