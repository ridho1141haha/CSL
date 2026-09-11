import { useEffect, useRef } from 'react';
import { useGame } from '../stores/gameStore';
import { hasSave, slotInfo } from '../game/save';
import { audio } from '../game/audio';

export function MainMenu({ onStart, onLoad }: { onStart: () => void; onLoad: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const auto = hasSave('auto');
  const info = slotInfo('auto');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const btns = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
        const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
        if (idx >= 0) {
          e.preventDefault();
          const nextIdx = e.key === 'ArrowDown' ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
          btns[nextIdx]?.focus();
        }
      }
      if (e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') {
        onStart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div className="menu" ref={ref}>
      <div className="menu-main">
        <div className="menu-kicker">SMA YUSON CHRONICLES <span>ACT I // SEMESTER GANJIL</span></div>
        <h1>CHAOS SCHOOL <em>LIFE</em></h1>
        <p>A story of survival, academics, and choices at SMA Yuson.</p>
        <nav className="menu-nav">
          <button className="active" onClick={() => { audio.click(); onStart(); }}><b>01</b><strong>NEW GAME</strong><kbd>[ENTER]</kbd></button>
          <button disabled={!auto} onClick={() => { audio.click(); onLoad(); }}><b>02</b><strong>CONTINUE</strong><small>{auto ? `SLOT AUTO // BAB ${info.chapter}` : 'TIDAK ADA SAVE'}</small></button>
          <button onClick={() => { audio.click(); useGame.getState().setMode('SAVELOAD_MENU'); }}><b>03</b><strong>LOAD GAME</strong><small>3 SLOTS</small></button>
          <button onClick={() => { audio.click(); useGame.getState().setMode('SETTINGS'); }}><b>04</b><strong>SETTINGS</strong><small>GRAPHICS / AUDIO / KEYS</small></button>
        </nav>
        <div className="menu-footer">
          <button onClick={() => { audio.click(); useGame.getState().notify('CHAOS SCHOOL LIFE — dibuat sebagai proyek PKL. Cerita & karakter orisinal.', 'info'); }}>CREDITS</button>
        </div>
      </div>
      <aside className="timeline-card panel-cut">
        <div className="eyebrow">CURRENT TIMELINE OVERVIEW <span>SLOT_01.SAV</span></div>
        <div className="timeline-label">PROLOGUE TO CHAPTER 01</div>
        <h2>MURID PINDAHAN</h2>
        <p>Hari pertama di SMA Yuson. Jaga nilai akademik, hindari mata para geng lorong kantin belakang, dan ambil ijazah hidup-hidup.</p>
        <div className="telemetry"><span>ACADEMIC<b>B</b></span><span>REPUTATION<b>UNKNOWN</b></span><span>RELATION<b>—</b></span></div>
        <div className="sync">CANON: REN · ARIS · SITI · BIMO <i>SMA YUSON</i></div>
      </aside>
      <div className="menu-version">BUILD 0.3.1 <span>KEYBOARD + MOUSE · DESKTOP</span></div>
    </div>
  );
}
