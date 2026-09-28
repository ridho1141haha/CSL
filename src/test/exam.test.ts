import { beforeEach, describe, expect, it } from 'vitest';
import { STUDY_QUESTIONS, CAM_BY_NODE, REN_STAGING, SCENE_ACTORS } from '../data/chapters';
import { DIALOGUE, SPECIAL_NODES, MONTAGE_ROOTS } from '../data/dialogue';
import { PTS_EXAM } from '../data/story/bonding';
import { STORY_TRIGGERS } from '../data/story/triggers';
import { scoreStudy } from '../game/systems/study';
import { completeExam } from '../game/systems/exam';
import { firstTrigger, type TriggerEngineState } from '../game/systems/storyTriggers';
import type { ConditionContext } from '../game/systems/conditions';
import { useGame } from '../stores/gameStore';
import { useStory } from '../stores/storyStore';
import { useStats } from '../stores/statsStore';
import { usePlayer } from '../stores/playerStore';
import { useQuests } from '../stores/questStore';
import { useSocial } from '../stores/socialStore';
import { useDialogue } from '../stores/dialogueStore';

// ============================================================================
// v0.18.0 — PTS mini-game tests.
//
// Yang dikunci di sini:
//   • bank soal existing tetap utuh (isi soal PERSIS, hanya bentuk data yang
//     direfactor ke StudyQuestion) — 5 soal,
//   • scoreStudy() adalah SATU rumus skoring (kasus acceptance: 5/5, 4/5, 0/5),
//   • wiring cerita: montase PTS masuk ke node ujian → __exam__ → quiz →
//     montase hasil kanon (Pak Budi, Ren 98 / Aris 90) → beat ch1_break —
//     cabang cerita SETELAH PTS tidak berubah,
//   • PTS tidak pernah dimainkan dua kali (flag pts_quiz_done),
//   • flag selesai selamat save→load (csl-save-v2, tanpa perubahan schema),
//   • integration penuh: bonding perpustakaan → quiz → hasil → cerita
//     lanjut ke Bab II persis seperti sebelumnya.
//
// vitest berjalan di node — stub localStorage minimal untuk roundtrip save
// (pola yang sama dengan save.test.ts).
// ============================================================================
const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => void mem.set(k, String(v)),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => void mem.clear(),
};

const resetStores = () => {
  useGame.getState().resetAll();
  useStory.getState().resetAll();
  useStats.getState().resetAll();
  usePlayer.getState().resetAll();
  useQuests.getState().resetAll();
  useSocial.getState().resetAll();
  useDialogue.getState().reset();
};

const storyCtx = (): ConditionContext => {
  const s = useStory.getState();
  return {
    flags: s.flags,
    chapter: s.chapter,
    route: s.route,
    beat: s.beat,
    quests: useQuests.getState().quests,
    relationships: useSocial.getState().relationships,
    stats: useStats.getState(),
    focus: usePlayer.getState().focus,
  };
};

// ---------------------------------------------------------------------------
// 1) BANK SOAL — existing content, refactored shape
// ---------------------------------------------------------------------------
describe('PTS question bank (existing soal, shape StudyQuestion)', () => {
  it('menyediakan 5 soal dengan shape valid dan id unik', () => {
    expect(STUDY_QUESTIONS).toHaveLength(5);
    const ids = new Set<string>();
    for (const q of STUDY_QUESTIONS) {
      expect(q.id, 'setiap soal butuh id').toBeTruthy();
      expect(q.question, 'setiap soal butuh pertanyaan').toBeTruthy();
      expect(q.options).toHaveLength(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
      ids.add(q.id);
    }
    expect(ids.size).toBe(5);
  });

  it('isi soal PERSIS sama dengan daftar asli (teks + kunci jawaban terkunci)', () => {
    const byId = Object.fromEntries(STUDY_QUESTIONS.map((q) => [q.id, q]));
    const lock = (id: string, question: string, correctOption: string) => {
      expect(byId[id].question).toBe(question);
      expect(byId[id].options[byId[id].correctIndex]).toBe(correctOption);
    };
    lock('pts_math_1', 'Hasil dari 12 × 8 − 6 adalah...', '90');
    lock('pts_ind_1', 'Kalimat "Kami pergi ke perpustakaan setelah bel." termasuk jenis kalimat...', 'Nominal');
    lock('pts_eng_1', 'Choose the correct sentence:', "He doesn't like school.");
    lock('pts_geo_1', 'Ibu kota Provinsi Jawa Barat adalah...', 'Bandung');
    lock('pts_bio_1', 'Pada ekosistem, organisme yang menguraikan bahan organik disebut...', 'Detritivor/Decomposer');
  });
});

// ---------------------------------------------------------------------------
// 2) SKORING — scoreStudy adalah SATU rumus (kasus acceptance)
// ---------------------------------------------------------------------------
describe('scoreStudy (formula existing, tanpa rumus kedua)', () => {
  it('5/5 benar → Akademik +15, Fokus +10', () => {
    const r = scoreStudy(5, 5);
    expect(r.correct).toBe(5);
    expect(r.academicDelta).toBe(15);
    expect(r.focusDelta).toBe(10);
  });

  it('4/5 benar → Akademik +12, Fokus +7', () => {
    const r = scoreStudy(4, 5);
    expect(r.correct).toBe(4);
    expect(r.academicDelta).toBe(12);
    expect(r.focusDelta).toBe(7);
  });

  it('0/5 benar → Akademik +0, Fokus −5', () => {
    const r = scoreStudy(0, 5);
    expect(r.correct).toBe(0);
    expect(r.academicDelta).toBe(0);
    expect(r.focusDelta).toBe(-5);
  });
});

// ---------------------------------------------------------------------------
// 3) WIRING CERITA — montase → ujian → hasil kanon
// ---------------------------------------------------------------------------
describe('PTS story wiring', () => {
  it('montage_pts membuka node ujian ch1_pts_exam (once-flag historis utuh)', () => {
    const t = STORY_TRIGGERS.find((x) => x.id === 'montage_pts')!;
    expect(t.open).toBe('ch1_pts_exam');
    expect(t.once).toBe('bond_pts_done');
    expect(t.when).toEqual({ k: 'beat', id: 'ch1_pts' });
    expect(MONTAGE_ROOTS).toContain('ch1_pts_exam');
  });

  it('node ujian ada dan bermuara ke __exam__; montase hasil kanon ada di PTS_EXAM.resume', () => {
    expect(SPECIAL_NODES.exam).toBe('__exam__');
    expect(DIALOGUE['ch1_pts_exam']).toBeDefined();
    expect(DIALOGUE['ch1_pts_exam'].next).toBe(SPECIAL_NODES.exam);
    expect(DIALOGUE[PTS_EXAM.resume]).toBeDefined();
    expect(PTS_EXAM.resume).toBe('ch1_pts_1');
  });

  it('node ujian punya staging Ren + kamera + aktor deterministik (aturan montase)', () => {
    expect(CAM_BY_NODE['ch1_pts_exam']).toBeDefined();
    expect(REN_STAGING['ch1_pts_exam']).toBeDefined();
    expect(SCENE_ACTORS['ch1_pts_exam']).toBeDefined();
  });

  it('KANON UTUH: Pak Budi tetap mengumumkan Ren 98 dan Aris 90', () => {
    expect(DIALOGUE['ch1_pts_2'].speaker).toBe('PAK BUDI');
    expect(DIALOGUE['ch1_pts_2'].text).toContain('sembilan puluh delapan');
    expect(DIALOGUE['ch1_pts_4'].text).toContain('sembilan puluh');
  });

  it('CABANG SETELAH PTS TIDAK BERUBAH: ch1_pts_5 tetap menutup arc (beat ch1_break + aris_incident)', () => {
    const fx = DIALOGUE['ch1_pts_5'].effects ?? [];
    expect(fx).toContainEqual({ k: 'beat', id: 'ch1_break' });
    expect(fx).toContainEqual({ k: 'stat', stat: 'academic', delta: 3 });
    expect(fx).toContainEqual({ k: 'quest', id: 'aris_incident', state: 'active' });
    // pintu masuk juga tak tersentuh: ch1_lib_6 tetap men-set beat ch1_pts
    expect(DIALOGUE['ch1_lib_6'].effects).toContainEqual({ k: 'beat', id: 'ch1_pts' });
  });
});

// ---------------------------------------------------------------------------
// 4) completeExam — skoring masuk statsStore, flag selesai, kembali ke cerita
// ---------------------------------------------------------------------------
describe('completeExam integration', () => {
  beforeEach(resetStores);

  it('5/5: Academic +15, Fokus +10, flag pts_quiz_done, montase hasil kanon terbuka', () => {
    const academicBefore = useStats.getState().academic; // 68 (START)
    usePlayer.getState().setFocus(10); // fokus rendah supaya +10 terlihat
    completeExam(5, 5);
    expect(useStats.getState().academic).toBe(academicBefore + 15);
    expect(usePlayer.getState().focus).toBe(20);
    expect(useStory.getState().hasFlag('pts_quiz_done')).toBe(true);
    expect(useDialogue.getState().nodeId).toBe('ch1_pts_1');
    expect(useGame.getState().mode).toBe('CINEMATIC');
  });

  it('0/5: tanpa gain Akademik, Fokus −5 — cerita TETAP sampai hasil kanon', () => {
    const academicBefore = useStats.getState().academic;
    usePlayer.getState().setFocus(20);
    completeExam(0, 5);
    expect(useStats.getState().academic).toBe(academicBefore);
    expect(usePlayer.getState().focus).toBe(15);
    expect(useDialogue.getState().nodeId).toBe('ch1_pts_1');
  });
});

// ---------------------------------------------------------------------------
// 5) TIDAK PERNAH DIULANG — guard flag pada re-entry __exam__
// ---------------------------------------------------------------------------
describe('PTS tidak dimainkan dua kali', () => {
  beforeEach(resetStores);

  it('re-entry __exam__ TANPA flag → mode EXAM (quiz dimainkan)', () => {
    useDialogue.getState().open('ch1_pts_exam', true);
    useDialogue.getState().advance();
    expect(useGame.getState().mode).toBe('EXAM');
    expect(useDialogue.getState().nodeId).toBeNull();
  });

  it('re-entry __exam__ DENGAN flag pts_quiz_done → LANGSUNG montase hasil, bukan EXAM', () => {
    useStory.getState().setFlag(PTS_EXAM.doneFlag);
    useDialogue.getState().open('ch1_pts_exam', true);
    useDialogue.getState().advance();
    expect(useGame.getState().mode).not.toBe('EXAM');
    expect(useDialogue.getState().nodeId).toBe('ch1_pts_1');
  });
});

// ---------------------------------------------------------------------------
// 6) SAVE/LOAD — flag selesai selamat roundtrip (schema v2 tak berubah)
// ---------------------------------------------------------------------------
describe('PTS save/load', () => {
  beforeEach(resetStores);

  it('flag pts_quiz_done tersimpan dan kembali setelah load (PTS tak diulang setelah load)', async () => {
    const { saveGame } = await import('../game/save');
    const { loadGame } = await import('../game/loadFlow');
    // posisi cerita: selesai PTS (hasil kanon ditonton, autosave menyusul)
    useStory.setState({ beat: 'ch1_break', flags: ['bond_lib_done', 'bond_pts_done', 'pts_quiz_done'] });
    useGame.setState({ visitedZones: ['courtyard'] });
    saveGame('auto');
    resetStores();
    const err = loadGame('auto');
    expect(err ?? '').toBe('');
    expect(useStory.getState().hasFlag('pts_quiz_done')).toBe(true);
    // trigger montase tidak menyala ulang setelah load (once-flag utuh)
    const t = firstTrigger(
      STORY_TRIGGERS,
      storyCtx(),
      { mode: useGame.getState().mode, scene: useGame.getState().scene, dialogueOpen: false } as TriggerEngineState,
    );
    expect(t?.id).not.toBe('montage_pts');
  });
});

// ---------------------------------------------------------------------------
// 7) FLOW LENGKAP — bonding perpustakaan → quiz → hasil → Bab II
// ---------------------------------------------------------------------------
describe('alur PTS ujung-ke-ujung (cerita tidak rusak)', () => {
  beforeEach(resetStores);

  it('lib bonding → beat ch1_pts → trigger → node ujian → EXAM → completeExam(4/5) → hasil kanon → beat ch1_break → cerita lanjut ke ch2_card', () => {
    // 0) beat ch1_friendship = hasil onComplete quest explore_school (game
    //    nyata: selesai jelajah → beat pindah → montase lib menyala)
    useStory.getState().setBeat('ch1_friendship');

    // 1) montase bonding perpustakaan dibuka trigger (emulasi StoryDirector)
    const lib = firstTrigger(STORY_TRIGGERS, storyCtx(), { mode: 'CINEMATIC', scene: 'campus', dialogueOpen: false } as TriggerEngineState);
    expect(lib?.id).toBe('montage_lib');
    useStory.getState().setFlag(lib!.once!);
    useDialogue.getState().open(lib!.open!, true);

    // 2) putar seluruh rantai ch1_lib_1..6 (advance sampai tertutup)
    for (let i = 0; i < 6; i++) useDialogue.getState().advance();
    expect(useDialogue.getState().nodeId).toBeNull();
    expect(useStory.getState().beat).toBe('ch1_pts'); // diletakkan ch1_lib_6

    // 3) trigger montase PTS menyala → node ujian → advance → mode EXAM
    const pts = firstTrigger(STORY_TRIGGERS, storyCtx(), { mode: 'CINEMATIC', scene: 'campus', dialogueOpen: false } as TriggerEngineState);
    expect(pts?.id).toBe('montage_pts');
    useStory.getState().setFlag(pts!.once!);
    useDialogue.getState().open(pts!.open!, true);
    expect(useDialogue.getState().nodeId).toBe('ch1_pts_exam');
    useDialogue.getState().advance();
    expect(useGame.getState().mode).toBe('EXAM');

    // 4) player menjawab 4/5 → completeExam → hasil kanon terbuka
    const academicBefore = useStats.getState().academic;
    usePlayer.getState().setFocus(30);
    completeExam(4, 5);
    expect(useStats.getState().academic).toBe(academicBefore + 12);
    expect(usePlayer.getState().focus).toBe(37);
    expect(useDialogue.getState().nodeId).toBe('ch1_pts_1');

    // 5) putar seluruh montase hasil ch1_pts_1..5 → beat ch1_break + aris_incident
    for (let i = 0; i < 5; i++) useDialogue.getState().advance();
    expect(useDialogue.getState().nodeId).toBeNull();
    expect(useStory.getState().beat).toBe('ch1_break');
    expect(useStory.getState().hasFlag('pts_quiz_done')).toBe(true);
    expect(useQuests.getState().quests['aris_incident']).toBe('active');

    // 6) cerita LANJUT persis seperti sebelumnya: tangga belakang → kartu BAB II
    useGame.setState({ currentZone: 'back_stairs' });
    const next = firstTrigger(STORY_TRIGGERS, storyCtx(), { mode: 'GAMEPLAY', scene: 'campus', dialogueOpen: false } as TriggerEngineState);
    expect(next?.id).toBe('ch2_card');
  });
});
