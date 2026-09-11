// Study mini-game scoring (pure). Content lives in data/chapters.ts.
export type StudyResult = { correct: number; total: number; academicDelta: number; focusDelta: number };

const ACADEMIC_PER_CORRECT = 3;
const FOCUS_PER_CORRECT = 2;
const FOCUS_PER_MISS = -1;

export function scoreStudy(correct: number, total: number): StudyResult {
  const c = Math.max(0, Math.min(total, Math.round(correct)));
  return {
    correct: c,
    total,
    academicDelta: c * ACADEMIC_PER_CORRECT,
    focusDelta: c * FOCUS_PER_CORRECT + (total - c) * FOCUS_PER_MISS,
  };
}
