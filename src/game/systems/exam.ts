// ============================================================================
// v0.18.0 — PTS mini-game completion (systems layer).
//
// Satu pintu dari quiz UI ke cerita: hitung skor dengan scoreStudy() yang
// SUDAH ADA (bukan formula kedua), terapkan Academic/Focus lewat pipeline
// applyEffects() yang SUDAH ADA (mekanisme statsStore/playerStore standar,
// lengkap dengan toast HUD), tandai selesai (flag storyStore — tersimpan di
// csl-save-v2), lalu buka montase hasil KANON.
//
// TIDAK ada id cerita yang hardcode di file ini: node resume, nama flag, dan
// template toast hidup di data (PTS_EXAM, data/story/bonding.ts). Nilai 98 /
// 90 milik kanon tetap lahir dari dialog ch1_pts_2/ch1_pts_4 — skor quiz
// membentuk progres stat, BUKAN cabang cerita.
// ============================================================================
import { scoreStudy } from './study';
import { applyEffects } from './effects';
import { useDialogue } from '../../stores/dialogueStore';
import { PTS_EXAM } from '../../data/story/bonding';

export function completeExam(correct: number, total: number) {
  const r = scoreStudy(correct, total);
  applyEffects([
    { k: 'stat', stat: 'academic', delta: r.academicDelta },
    { k: 'stat', stat: 'focus', delta: r.focusDelta },
    { k: 'flag', id: PTS_EXAM.doneFlag },
    {
      k: 'notify',
      text: PTS_EXAM.resultNote
        .replace('{correct}', String(r.correct))
        .replace('{total}', String(r.total))
        .replace('{academic}', String(r.academicDelta))
        .replace('{focus}', `${r.focusDelta >= 0 ? '+' : ''}${r.focusDelta}`),
    },
  ]);
  // Kembali ke StoryDirector: montase hasil kanon (Pak Budi mengumumkan
  // nilai 98 / lima besar Aris), lalu cerita lanjut persis seperti sebelumnya.
  useDialogue.getState().open(PTS_EXAM.resume, true);
}
