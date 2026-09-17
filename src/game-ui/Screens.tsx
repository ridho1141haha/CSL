import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { useGame } from '../stores/gameStore';
import { useStory } from '../stores/storyStore';
import { usePlayer } from '../stores/playerStore';
import { useStats } from '../stores/statsStore';
import { useSocial } from '../stores/socialStore';
import { chapterCardText } from '../game/systems/effects';
import { CHAPTERS } from '../data/chapters';
import { audio } from '../game/audio';
import { loadGame, hasSave } from '../game/save';
import { perfState, PREWARM } from '../game/runtime';
import { mobile } from '../game/mobile';

// v0.9.0: loading screen with REAL progress — weighted blend of async asset
// progress (drei useProgress), world-first-frame readiness (perfState) and
// the minimum branding window. The indeterminate CSS slide remains as the
// fallback underlay while pct is still 0.
export function LoadingScreen() {
  const { active, progress } = useProgress();
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - t0;
      const timePct = Math.min(20, (elapsed / 1600) * 20);
      const assetPct = active || progress < 100 ? Math.max(2, (progress / 100) * 30) : 30;
      // same fail-open as BootGate: a dead render loop skips the world wait
      const loopDead = mobile.lastFrameAt === 0 || Date.now() - mobile.lastFrameAt > 1200;
      const worldPct = perfState.worldReady || !PREWARM || loopDead ? 50 : 0;
      setPct(Math.min(99, Math.round(timePct + assetPct + worldPct)));
    }, 120);
    return () => clearInterval(iv);
  }, [active, progress]);

  const ready = perfState.worldReady || !PREWARM || mobile.lastFrameAt === 0;
  const stage = ready ? 'MENYIAPKAN DUNIA SEKOLAH…' : 'MEMUAT ASET SEKOLAH…';
  return (
    <div className="loading-screen">
      <div className="boot-logo brackets">
        <h1>CHAOS SCHOOL <em>LIFE</em></h1>
        <p>{stage}</p>
        <div className="boot-bar boot-bar-real"><i style={{ width: `${pct}%` }} /></div>
        <div className="boot-meta">
          <span className="chip">{pct}%</span>
          <span className="chip">BUILD 0.10.0</span>
          <span className="chip">TEAM CHAOS</span>
          <span className="chip chip-amber">SMA YUSON</span>
        </div>
      </div>
    </div>
  );
}

export function ChapterTransition() {
  const pending = useGame((s) => s.pendingChapter);
  const clear = useGame((s) => s.clearChapterCard);
  useEffect(() => {
    if (pending == null) return;
    audio.sting(pending >= 4);
    const onKey = () => closeCard();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending]);

  const closeCard = () => {
    const g = useGame.getState();
    clear();
    if (g.mode === 'TRANSITION') g.setMode('GAMEPLAY');
  };

  if (pending == null) return null;
  // v0.7.0: kartu bab route-aware (rute netral punya judul bab sendiri)
  const { title, subtitle } = chapterCardText(pending, useStory.getState().route);
  return (
    <div className="chapter-transition" onClick={closeCard}>
      <div>
        <span className="chapter-kicker">{title}</span>
        <h1>{subtitle}</h1>
        <div className="chapter-rule" />
        <p>— KLIK UNTUK LANJUT —</p>
      </div>
    </div>
  );
}

export function GameOverScreen({ onRestart }: { onRestart: () => void }) {
  // BUG-FIX: dying used to force a full restart (COBA LAGI = new game), wiping
  // hours of story progress even though auto-save checkpoints exist. Offer the
  // last auto-save first; restart stays as the fallback.
  const canLoad = hasSave('auto');
  const [loadError, setLoadError] = useState('');
  const onLoad = () => {
    const err = loadGame('auto');
    if (err) setLoadError(err);
  };
  return (
    <div className="ending-screen dark">
      <span className="chip chip-red">YUSON // SIGNAL LOST</span>
      <h1>GAME OVER</h1>
      <p>Ren jatuh. Lorong itu gelap, dan tidak ada yang datang.</p>
      <div className="ending-actions">
        {canLoad && <button onClick={onLoad}>MUAT SAVE TERAKHIR</button>}
        <button onClick={onRestart}>COBA LAGI</button>
      </div>
      {loadError && <p className="load-error">{loadError}</p>}
    </div>
  );
}

export function EndingScreen({ onRestart, onMenu }: { onRestart: () => void; onMenu: () => void }) {
  const ending = useGame((s) => s.ending);
  const stats = useStats();
  const rel = useSocial((s) => s.relationships);
  const focus = usePlayer((s) => s.focus);
  if (!ending) return null;
  const chapter = CHAPTERS[4];
  return (
    <div className={`ending-screen ending-${ending.id}`}>
      <span className="chip chip-amber">ENDING UNLOCKED // {chapter.title}</span>
      <h1>{ending.title.toUpperCase()}</h1>
      <p className="ending-summary">{ending.summary}</p>
      <div className="ending-lesson">“{ending.lesson}”</div>
      <div className="ending-stats">
        <span>AKADEMIK<b>{stats.academic}</b></span>
        <span>FOKUS<b>{Math.round(focus)}</b></span>
        <span>KEKERASAN<b>{stats.violence}</b></span>
        <span>DIPLOMASI<b>{stats.diplomacy}</b></span>
        <span>ARIS<b>{rel.aris}</b></span>
        <span>SITI<b>{rel.siti}</b></span>
        <span>BIMO<b>{rel.bimo}</b></span>
      </div>
      <div className="ending-actions">
        <button onClick={onRestart}>MULAI ULANG</button>
        <button onClick={onMenu}>MENU UTAMA</button>
      </div>
    </div>
  );
}
