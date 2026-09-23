import { describe, expect, it } from 'vitest';
import {
  CHECKPOINT_NODES,
  DIALOGUE,
  MONTAGE_ROOTS,
  SPECIAL_NODES,
  STORY_TRIGGER_NODES,
  ZONE_FLAVOR,
} from '../data/dialogue';
import { ENCOUNTERS } from '../data/quests';
import { HIDDEN_EVENTS } from '../data/hiddenEvents';
import { OPENING_ROOT } from '../data/chapters';
import { NPCS } from '../data/npcs';
import { BEAT_ENCOUNTER } from '../stores/dialogueStore';

// Story-flow regression tests. The dialogue graph is wired to the runtime from
// several directions (StoryDirector triggers, montage roots, combat onWin,
// NPC roots, hidden events, zone flavor). A broken link in any direction used
// to produce dead content or a permanent soft-lock (see CHANGELOG 0.2.1).

describe('story flow: node reachability', () => {
  // Entry points mirror the runtime wiring: StoryDirector.open(...) targets,
  // montage roots opened after the ch3 choice, finishCombatWin onWin nodes,
  // NPC interaction roots, hidden-event discovery nodes and per-zone flavor.
  const entryPoints = [
    OPENING_ROOT,
    ...MONTAGE_ROOTS,
    ...STORY_TRIGGER_NODES,
    // v0.15.0: onWin DAN onLose dua-duanya pintu masuk graph cerita
    ...Object.values(ENCOUNTERS).flatMap((e) => (e.onLose ? [e.onWin, e.onLose] : [e.onWin])),
    ...NPCS.map((n) => n.dialogueRoot),
    ...Object.values(ZONE_FLAVOR),
    ...HIDDEN_EVENTS.map((e) => e.dialogue),
  ];

  it('all entry points exist', () => {
    for (const id of entryPoints) {
      expect(DIALOGUE[id], `entry point ${id} missing from DIALOGUE`).toBeDefined();
    }
  });

  it('zone flavor map points at real nodes for every non-class zone', () => {
    // every mapped flavor node must exist (StoryDirector opens it on entry)
    for (const nodeId of Object.values(ZONE_FLAVOR)) {
      expect(DIALOGUE[nodeId], `zone flavor node ${nodeId} missing`).toBeDefined();
    }
  });

  it('every dialogue node is reachable from some entry point (no dead content)', () => {
    const seen = new Set<string>();
    const walk = (id: string) => {
      if (seen.has(id) || SPECIAL_NODES.combat === id || SPECIAL_NODES.study === id) return;
      const node = DIALOGUE[id];
      if (!node) return;
      seen.add(id);
      if (node.next) walk(node.next);
      for (const c of node.choices ?? []) if (c.next) walk(c.next);
    };
    for (const id of entryPoints) walk(id);
    const orphans = Object.keys(DIALOGUE).filter((id) => !seen.has(id));
    expect(orphans, `nodes unreachable from any runtime entry point: ${orphans.join(', ')}`).toEqual([]);
  });
});

describe('story flow: route + ending reachability (canon)', () => {
  const effectsOf = (id: string) => DIALOGUE[id]?.effects ?? [];
  const choice = (nodeId: string, choiceId: string) => {
    const c = DIALOGUE[nodeId]?.choices?.find((x) => x.id === choiceId);
    expect(c, `choice ${choiceId} on ${nodeId}`).toBeDefined();
    return c!;
  };
  const hasEffect = (effects: { k: string }[], k: string) => effects.some((e) => e.k === k);

  it('ch3 choice sets the two canon routes', () => {
    expect(choice('ch3_choice', 'accept_bimo').effects).toContainEqual({ k: 'route', id: 'bad' });
    expect(choice('ch3_choice', 'reject_bimo').effects).toContainEqual({ k: 'route', id: 'resistance' });
  });

  it('v0.7.0: ignoring Aris at the stairs locks the neutral route + montage beat', () => {
    const c = choice('ch2_choice', 'ignore_aris');
    expect(c.effects).toContainEqual({ k: 'route', id: 'neutral' });
    // ch2_away_1 (first node after the choice) flows into ch2_away_2 which
    // carries the montage beat + chapter 3 card
    expect(DIALOGUE[c.next!].next).toBe('ch2_away_2');
    expect(effectsOf('ch2_away_2')).toContainEqual({ k: 'beat', id: 'ch3_neutral' });
    expect(effectsOf('ch2_away_2')).toContainEqual({ k: 'chapter', id: 3 });
    // and the montage ends by handing the player the graduation trigger beat
    // (v0.15.0: penutup montase kini n5_2 — doc CH8/CH9 ditutup di situ)
    expect(effectsOf('n5_2')).toContainEqual({ k: 'beat', id: 'ch4_neutral_grad' });
    expect(effectsOf('n5_2')).toContainEqual({ k: 'chapter', id: 4 });
  });

  it('v0.15.0: montase netral mengikuti urutan dokumen (surat → Bimo → bulan sunyi)', () => {
    // doc CH6 scene 3 (surat Aris) datang SEBELUM doc CH7 (pengabaian Bimo)
    expect(DIALOGUE['n2_8'].next).toBe('n3_1');
    expect(DIALOGUE['n3_2'].speaker).toBe('PAK BUDI'); // surat pengunduran diri
    expect(DIALOGUE['n3_4'].next).toBe('n4_1');
    expect(DIALOGUE['n4_3'].speaker).toBe('BIMO'); // pengabaian
    expect(DIALOGUE['n4_6'].next).toBe('n5_1');
    expect(effectsOf('n5_2')).toContainEqual({ k: 'quest', id: 'graduation_day', state: 'active' });
  });

  it('v0.15.0: bonding arc (doc Ch3/Ch4) menyambung explore → tangga', () => {
    // perpustakaan: tukar catatan → beat PTS
    expect(effectsOf('ch1_lib_6')).toContainEqual({ k: 'beat', id: 'ch1_pts' });
    // PTS: nilai 98 → beat ch1_break + quest tangga aktif
    expect(DIALOGUE['ch1_pts_2'].speaker).toBe('PAK BUDI');
    expect(effectsOf('ch1_pts_5')).toContainEqual({ k: 'beat', id: 'ch1_break' });
    expect(effectsOf('ch1_pts_5')).toContainEqual({ k: 'quest', id: 'aris_incident', state: 'active' });
  });

  it('v0.15.0: semua FLAVOR CHOICE dokumen (5) tersedia dengan dua opsi', () => {
    const flavor = ['o2_c1', 'o3_c2', 'n2_c3', 'ch3_fc4', 'ch4_fc5'];
    for (const id of flavor) {
      expect(DIALOGUE[id]?.choices?.length, `${id} harus 2 opsi`).toBe(2);
    }
    // cabang flavor selalu menyatu kembali (tidak membuat rute baru)
    expect(DIALOGUE['o2_7a'].next).toBe('o2_8');
    expect(DIALOGUE['o2_7b'].next).toBe('o2_8');
    expect(DIALOGUE['o3_7a'].next).toBe('o4_1');
    expect(DIALOGUE['o3_7b'].next).toBe('o4_1');
    expect(DIALOGUE['n2_8'].next).toBe('n3_1');
    expect(DIALOGUE['n2_8b'].next).toBe('n3_1');
    expect(DIALOGUE['ch3_fc4a2'].next).toBe('ch3_choice');
    expect(DIALOGUE['ch3_fc4b2'].next).toBe('ch3_choice');
    expect(DIALOGUE['ch4_fc5a2'].next).toBe(SPECIAL_NODES.combat);
    expect(DIALOGUE['ch4_fc5b2'].next).toBe(SPECIAL_NODES.combat);
  });

  it('v0.7.0: defending Aris wires into the main route (fight → Bimo impressed)', () => {
    const c = choice('ch2_choice', 'defend_aris');
    expect(c.effects).toContainEqual({ k: 'flag', id: 'defended_aris' });
    // GARIS MERAH: dialog FIGHT 1 memanjang — rantai ch2_fight_1 → 1b → 1c → 2
    expect(DIALOGUE[c.next!].next).toBe('ch2_fight_1b');
    expect(DIALOGUE['ch2_fight_1b'].next).toBe('ch2_fight_1c');
    expect(DIALOGUE['ch2_fight_1c'].next).toBe('ch2_fight_2');
    expect(DIALOGUE['ch2_fight_2'].next).toBe(SPECIAL_NODES.combat);
    expect(DIALOGUE['ch2_win_6'].effects).toContainEqual({ k: 'flag', id: 'bimo_impressed' });
  });

  it('v0.11.0 GARIS MERAH: bab 3 dibuka montase OSIS → sergapan parkiran → rooftop', () => {
    // ch2_close menyerahkan kendali ke montase OSIS (bukan langsung rooftop)
    expect(effectsOf('ch2_close')).toContainEqual({ k: 'beat', id: 'ch3_osis' });
    // akhir montase OSIS mengaktifkan sergapan parkiran
    expect(effectsOf('ch3_osis_6')).toContainEqual({ k: 'beat', id: 'ch3_parking' });
    expect(effectsOf('ch3_osis_6')).toContainEqual({ k: 'quest', id: 'gang_ambush', state: 'active' });
    // setelah FIGHT 2, rooftop_meeting baru aktif
    expect(DIALOGUE['ch3_f2_3'].next).toBe(SPECIAL_NODES.combat);
    expect(effectsOf('ch3_f2_win_3')).toContainEqual({ k: 'quest', id: 'rooftop_meeting', state: 'active' });
  });

  it('v0.7.0: NEUTRAL ending fires from the graduation chain', () => {
    // v0.15.0: grad_8 kini SECRET CHOICE POINT — ending pindah ke tiga rantai
    expect(effectsOf('ch4_neu_grad_8')).toContainEqual({ k: 'beat', id: 'ch4_neu_secret' });
    // graduation quest gates the walk to the gate and completes on the ending node
    expect(effectsOf('n5_2')).toContainEqual({ k: 'quest', id: 'graduation_day', state: 'active' });
    expect(effectsOf('ch4_neu_out_2')).toContainEqual({ k: 'quest', id: 'graduation_day', state: 'completed' });
    expect(hasEffect(effectsOf('ch4_neu_out_2'), 'ending')).toBe(true);
  });

  it('v0.15.0 GARIS MERAH: SECRET BATTLE — kalah/menang dua-duanya ending', () => {
    // intro gang → combat (beat ch4_neu_secret → secret_fight)
    expect(DIALOGUE['ch4_neu_secret_4'].next).toBe(SPECIAL_NODES.combat);
    const enc = ENCOUNTERS.secret_fight;
    expect(enc).toBeDefined();
    expect(enc.onWin).toBe('ch4_neu_sbw_1');
    expect(enc.onLose).toBe('ch4_neu_sbl_1');
    // HASIL 1 kalah → SECRET BAD ENDING A
    expect(hasEffect(effectsOf('ch4_neu_sbl_3'), 'ending')).toBe(true);
    expect(effectsOf('ch4_neu_sbl_3')).toContainEqual({ k: 'flag', id: 'secret_fought_lost' });
    // HASIL 2 menang → SECRET BAD ENDING B
    expect(hasEffect(effectsOf('ch4_neu_sbw_4'), 'ending')).toBe(true);
    expect(effectsOf('ch4_neu_sbw_4')).toContainEqual({ k: 'flag', id: 'secret_fought_won' });
  });

  it('each route sets its montage beat so StoryDirector can open the montage', () => {
    // montage blocks fire on beat ch4_bad_warehouse / ch4_res_search
    expect(effectsOf('ch3_accept_2')).toContainEqual({ k: 'beat', id: 'ch4_bad_warehouse' });
    expect(effectsOf('ch3_reject_2')).toContainEqual({ k: 'beat', id: 'ch4_res_search' });
    for (const root of MONTAGE_ROOTS) expect(DIALOGUE[root]).toBeDefined();
  });

  it('encounter beats are wired: every StoryDirector combat trigger beat maps to an encounter', () => {
    // the REAL map used by dialogueStore.advance() when a node hits __combat__
    for (const [beat, encounterId] of Object.entries(BEAT_ENCOUNTER)) {
      expect(
        Object.values(ENCOUNTERS).some((e) => e.id === encounterId),
        `beat ${beat} maps to unknown encounter ${encounterId}`,
      ).toBe(true);
    }
    // and every combat-entry beat is covered by it (no accidental fallback)
    expect(Object.keys(BEAT_ENCOUNTER).sort()).toEqual([
      'ch2_key_error',
      'ch3_parking',
      'ch4_bad_warehouse',
      'ch4_neu_secret',
      'ch4_res_alley',
      'ch4_res_bimo',
    ]);
  });

  it('v0.11.0 GARIS MERAH: BAD ENDING 1 "Tunduk Pada Kekuasaan" fires from the graduation chain', () => {
    // rute bad: montase eksekutor → gudang → kelulusan (bukan razia polisi)
    expect(
      effectsOf('ch4_bad_warehouse').some((e) => e.k === 'scene' && (e as { id: string }).id === 'warehouse'),
    ).toBe(true);
    expect(effectsOf('ch4_bad_after_2')).toContainEqual({ k: 'beat', id: 'ch4_bad_grad' });
    expect(effectsOf('ch4_bad_grad_3')).toContainEqual({ k: 'quest', id: 'graduation_day', state: 'completed' });
    expect(hasEffect(effectsOf('ch4_bad_grad_3'), 'ending')).toBe(true);
  });

  it('v0.11.0 GARIS MERAH: CHOICE 3 — menahan emosi → GOOD "Lulus Bersama"', () => {
    // FINAL BOSS Bimo dulu: alley_fight → goons_win (set beat bimo) →
    // FLAVOR CHOICE 5 (gertakan) → bimo_fight → choice
    expect(DIALOGUE['ch4_res_goons_win'].effects).toContainEqual({ k: 'beat', id: 'ch4_res_bimo' });
    expect(DIALOGUE['ch4_res_goons_win_2'].next).toBe('ch4_fc5');
    expect(DIALOGUE['ch4_fc5a2'].next).toBe(SPECIAL_NODES.combat);
    expect(DIALOGUE['ch4_fc5b2'].next).toBe(SPECIAL_NODES.combat);
    const c = choice('ch4_res_choice', 'restrain_bimo');
    expect(c.effects).toContainEqual({ k: 'flag', id: 'restrained_bimo' });
    expect(effectsOf('ch4_good_4')).toContainEqual({ k: 'beat', id: 'ch4_good_grad' });
    expect(hasEffect(effectsOf('ch4_good_grad_5'), 'ending')).toBe(true);
  });

  it('v0.11.0 GARIS MERAH: CHOICE 3 — brutal → BAD 2 "Rantai Dendam"', () => {
    const c = choice('ch4_res_choice', 'brutal_bimo');
    expect(c.effects).toContainEqual({ k: 'flag', id: 'brutal_bimo' });
    expect(effectsOf('ch4_bad2_3')).toContainEqual({ k: 'flag', id: 'expelled' });
    expect(hasEffect(effectsOf('ch4_bad2_5'), 'ending')).toBe(true);
  });
});

describe('story flow: auto-save checkpoints', () => {
  it('chapter/route transitions persist a checkpoint', () => {
    for (const id of CHECKPOINT_NODES) {
      const effects = DIALOGUE[id]?.effects ?? [];
      expect(
        effects.some((e) => e.k === 'save'),
        `${id} must carry a { k: 'save' } checkpoint effect (death recovery)`,
      ).toBe(true);
    }
  });

  it('combat win nodes open a follow-up dialogue (no silent victory)', () => {
    for (const enc of Object.values(ENCOUNTERS)) {
      expect(DIALOGUE[enc.onWin], `${enc.id}.onWin`).toBeDefined();
      // v0.15.0: onLose opsional — tapi kalau ada, harus node nyata
      if (enc.onLose) expect(DIALOGUE[enc.onLose], `${enc.id}.onLose`).toBeDefined();
    }
  });
});
