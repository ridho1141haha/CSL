import { useState } from 'react';
import { STUDY_QUESTIONS } from '../data/chapters';
import { scoreStudy } from '../game/systems/study';
import { completeExam } from '../game/systems/exam';
import { audio } from '../game/audio';

// ============================================================================
// v0.18.0 — StudyQuiz: UI mini-game UJIAN/PTS (mode EXAM).
//
// Shell quiz GENERIK: merender bank soal bersama (STUDY_QUESTIONS, isi soal
// existing) dan menyerahkan hasilnya ke systems/exam.ts lewat SATU panggilan
// completeExam(correct, total). Tidak ada logika cerita di sini — node resume,
// flag penanda selesai, dan hasil kanon (Ren 98 / Aris 90) adalah milik data +
// sistem, bukan UI. Pola interaksi & styling identik dengan StudyPanel (sesi
// belajar sukarela): pilih satu jawaban → highlight benar/salah → lanjut,
// tombol besar 14px padding, grid satu kolom di layar sempit — touch friendly
// tanpa hover/keyboard.
// ============================================================================
export function StudyQuiz() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const questions = STUDY_QUESTIONS;

  // Layar hasil: progres gameplay ditampilkan TERPISAH dari hasil kanon —
  // "Jawaban benar: 4/5 · Akademik +12 · Fokus +7", BUKAN "nilai PTS kamu 80"
  // (canon menetapkan nilai Ren 98 via dialog Pak Budi setelah ini).
  if (done) {
    const r = scoreStudy(correct, questions.length);
    return (
      <div className="study-panel panel-cut">
        <div className="eyebrow">PTS // SELESAI</div>
        <h2>Jawaban benar: {r.correct} / {r.total}</h2>
        <p>
          Akademik +{r.academicDelta} · Fokus {r.focusDelta >= 0 ? '+' : ''}{r.focusDelta}
        </p>
        <p>Ren menyerahkan lembar jawabannya. Hasil akan diumumkan Pak Budi.</p>
        <button onClick={() => { audio.click(); completeExam(r.correct, r.total); }}>LANJUTKAN</button>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="study-panel panel-cut">
      <div className="eyebrow">PTS // SOAL {idx + 1}/{questions.length}</div>
      <h2>{q.question}</h2>
      <div className="study-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={picked === i ? (i === q.correctIndex ? 'good' : 'bad') : picked != null && i === q.correctIndex ? 'good' : ''}
            disabled={picked != null}
            onClick={() => {
              setPicked(i);
              audio.click();
              if (i === q.correctIndex) setCorrect((c) => c + 1);
              setTimeout(() => {
                if (idx + 1 >= questions.length) {
                  setDone(true);
                } else {
                  setIdx(idx + 1);
                  setPicked(null);
                }
              }, 900);
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
