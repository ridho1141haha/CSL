import { useEffect, useRef } from 'react';
import { useGame } from '../stores/gameStore';
import { hasSave, slotInfo } from '../game/save';
import { audio } from '../game/audio';

// Main menu — implementasi mockup Stitch "01-main-menu":
// judul gradient amber, daftar menu Indonesia dengan sub-label mono,
// kartu profil kanan-bawah, chip status di atas, hint tombol di bawah.
export function MainMenu({ onStart, onLoad }: { onStart: () => void; onLoad: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const auto = hasSave('auto');
  const info = slotInfo('auto');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const btns = Array.from(el.querySelectorAll('.menu-nav button')) as HTMLButtonElement[];
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
      <div className="menu-top">
        <span className="chip chip-amber">CHAOS SCHOOL LIFE</span>
        <span className="chip">BUILD 0.8.0 <i>//</i> TEAM CHAOS</span>
        <span className="spacer" />
        <span className="chip">SLOT STATUS <i>//</i> {auto ? `BAB ${info.chapter}` : 'KOSONG'}</span>
        <span className="chip chip-green">{auto ? 'TERSINKRON' : 'MULAI BARU'}</span>
      </div>

      <div className="menu-body">
        <div className="menu-main">
          <div className="menu-kicker">PROLOG // SMA YUSON <span>SEMESTER GANJIL</span></div>
          <h1>CHAOS SCHOOL <em>LIFE</em></h1>
          <div className="menu-sub">A NARRATIVE ACTION GAME <b>BY TEAM CHAOS</b></div>
          <nav className="menu-nav">
            <button className="active" onClick={() => { audio.click(); onStart(); }}>
              <strong>MULAI BARU</strong>
              <small>PROLOG // GERBANG SMA YUSON 06:45</small>
            </button>
            <button disabled={!auto} onClick={() => { audio.click(); onLoad(); }}>
              <strong>LANJUTKAN</strong>
              <small>{auto ? `BAB ${info.chapter} // ${info.savedAt ? new Date(info.savedAt).toLocaleDateString('id-ID') : '—'}` : 'TIDAK ADA DATA SIMPANAN'}</small>
            </button>
            <button onClick={() => { audio.click(); useGame.getState().setMode('SAVELOAD_MENU'); }}>
              <strong>MUAT PERMAINAN</strong>
              <small>3 SLOT</small>
            </button>
            <button onClick={() => { audio.click(); useGame.getState().setMode('SETTINGS'); }}>
              <strong>PENGATURAN</strong>
              <small>GRAFIS · AUDIO · KONTROL</small>
            </button>
            <button onClick={() => { audio.click(); useGame.getState().notify('CHAOS SCHOOL LIFE — dibuat sebagai proyek PKL. Cerita & karakter orisinal.', 'info'); }}>
              <strong>KREDIT</strong>
              <small>TIM CHAOS STUDIO</small>
            </button>
          </nav>
        </div>
      </div>

      <aside className="profile-card panel-cut brackets">
        <div className="pc-head">PROFIL AKTIF <span className="right">{auto ? `BAB ${info.chapter}` : 'PROLOG'}</span></div>
        <div className="pc-body">
          <span className="pc-num">01</span>
          <div className="pc-name">
            REN PRATAMA
            <small>Murid Pindahan — Kelas X-C</small>
          </div>
          <div className="tag-row">
            <span className="chip chip-amber">MURID PINDAHAN</span>
            <span className="chip">KELAS X-C</span>
            <span className="chip chip-red">DIPANTAU</span>
          </div>
        </div>
      </aside>

      <div className="menu-hints">
        <span className="key">[↑↓]</span> NAVIGASI
        <span className="key">[ENTER]</span> PILIH
      </div>
      <div className="menu-version">BUILD 0.8.0 <span className="menu-input-note">KEYBOARD + MOUSE / SENTUH</span> <span>CHAOS SCHOOL LIFE © 2025</span></div>
    </div>
  );
}
