import { useEffect, useRef, useState } from 'react';
import { useGame } from '../stores/gameStore';
import { audio } from '../game/audio';
import { input } from '../game/input';
import { mobile } from '../game/mobile';

// ============================================================================
// TouchControls (v0.19.0) — ergonomic on-screen controls for mobile devices.
//
// Layout (landscape):
//   ┌────────────────────────────────────────────────────────────┐
//   │  [vitals]                               [MAP][HP][CAM][II] │
//   │                                                 [obj-card] │
//   │  ◉ joystick                                   [HEV]  [BLK] │
//   │  (left thumb)                                 [ATK]  [DGE] │
//   └────────────────────────────────────────────────────────────┘
//   Right half of the screen (not covered by buttons) = camera drag pad.
// ============================================================================

const STICK_R = 42; // px — joystick travel radius

export function TouchControls() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const setMode = useGame((s) => s.setMode);
  const show = mobile.touch && phase === 'play';
  const [stick, setStick] = useState<{ active: boolean; ox: number; oy: number }>({ active: false, ox: 0, oy: 0 });
  const stickId = useRef<number | null>(null);
  const nubRef = useRef<HTMLDivElement>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  // release everything if the game leaves play or gameplay/combat
  const inCombat = mode === 'COMBAT';
  const inGameplay = mode === 'GAMEPLAY' || inCombat;

  useEffect(() => {
    if (!show || !inGameplay) {
      input.setAxes(0, 0);
      input.touch.run = false;
      input.touch.block = false;
      stickId.current = null;
      lookId.current = null;
      setStick({ active: false, ox: 0, oy: 0 });
      if (nubRef.current) {
        nubRef.current.style.transform = 'translate(0px, 0px)';
      }
    }
  }, [show, inGameplay]);

  if (!show) return null;

  // ---- joystick handlers ----
  const onStickDown = (e: React.PointerEvent) => {
    if (stickId.current !== null) return;
    stickId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    setStick({ active: true, ox, oy });
    if (nubRef.current) {
      nubRef.current.style.transform = 'translate(0px, 0px)';
    }
  };
  const onStickMove = (e: React.PointerEvent) => {
    if (stickId.current !== e.pointerId || !stick.active) return;
    let dx = e.clientX - stick.ox;
    let dy = e.clientY - stick.oy;
    const len = Math.hypot(dx, dy);
    const max = STICK_R;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    if (nubRef.current) {
      nubRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    // axes: screen y-down → game y-up forward
    input.setAxes(dx / max, -dy / max);
    input.touch.run = len > max * 0.9;
  };
  const onStickUp = (e: React.PointerEvent) => {
    if (stickId.current !== e.pointerId) return;
    stickId.current = null;
    setStick((s) => ({ ...s, active: false }));
    if (nubRef.current) {
      nubRef.current.style.transform = 'translate(0px, 0px)';
    }
    input.setAxes(0, 0);
    input.touch.run = false;
  };

  // ---- camera drag pad (right half, behind buttons) ----
  const onLookDown = (e: React.PointerEvent) => {
    if (lookId.current !== null) return;
    lookId.current = e.pointerId;
    lookLast.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onLookMove = (e: React.PointerEvent) => {
    if (lookId.current !== e.pointerId) return;
    input.touch.look.dx += e.clientX - lookLast.current.x;
    input.touch.look.dy += e.clientY - lookLast.current.y;
    lookLast.current = { x: e.clientX, y: e.clientY };
  };
  const onLookUp = (e: React.PointerEvent) => {
    if (lookId.current !== e.pointerId) return;
    lookId.current = null;
  };

  return (
    <div className="touch-ui" data-combat={inCombat ? '1' : undefined}>
      {/* camera drag pad — right half, under the buttons (z-order) */}
      {inGameplay && (
        <div
          className="tc-look"
          onPointerDown={onLookDown}
          onPointerMove={onLookMove}
          onPointerUp={onLookUp}
          onPointerCancel={onLookUp}
        />
      )}

      {/* joystick — bottom left */}
      {inGameplay && (
        <div
          className={`tc-stick ${stick.active ? 'on' : ''}`}
          onPointerDown={onStickDown}
          onPointerMove={onStickMove}
          onPointerUp={onStickUp}
          onPointerCancel={onStickUp}
        >
          <div className="tc-stick-ring">
            <span className="tc-tick t-n" />
            <span className="tc-tick t-s" />
            <span className="tc-tick t-e" />
            <span className="tc-tick t-w" />
          </div>
          <div className="tc-stick-nub" ref={nubRef} style={{ transform: 'translate(0px, 0px)' }} />
        </div>
      )}

      {/* action cluster — bottom right */}
      {inGameplay && (
        <div className={`tc-actions ${inCombat ? 'tc-combat-grid' : 'tc-explore-grid'}`}>
          {inCombat ? (
            <>
              <button type="button" className="tc-btn red tc-heavy" onPointerDown={() => input.injectPress('attack_heavy')}>
                <span>HEV</span>
                <small>-10</small>
              </button>
              <button
                type="button"
                className="tc-btn cyan tc-block"
                onPointerDown={() => { input.touch.block = true; }}
                onPointerUp={() => { input.touch.block = false; }}
                onPointerCancel={() => { input.touch.block = false; }}
              >
                <span>BLK</span>
                <small>TAHAN</small>
              </button>
              <button type="button" className="tc-btn amber tc-atk" onPointerDown={() => input.injectLeftTap()}>
                <span>ATK</span>
                <small>PUKUL</small>
              </button>
              <button type="button" className="tc-btn tc-dodge" onPointerDown={() => input.injectPress('dodge')}>
                <span>DGE</span>
                <small>-6</small>
              </button>
            </>
          ) : (
            <>
              <button type="button" className="tc-btn amber" onPointerDown={() => input.injectPress('interact')}>
                <span>E</span>
                <small>AKSI</small>
              </button>
              <button type="button" className="tc-btn" onPointerDown={() => input.injectPress('jump')}>
                <span>↑</span>
                <small>LOMPAT</small>
              </button>
            </>
          )}
        </div>
      )}

      {/* top-right utility strip: quick map/phone/camera in gameplay + pause */}
      <div className="tc-top-bar">
        {mode === 'GAMEPLAY' && (
          <>
            <button type="button" className="tc-util" onPointerDown={() => { audio.click(); setMode('MAP_MENU'); }} aria-label="Peta">
              PETA
            </button>
            <button type="button" className="tc-util tc-util-phone" onPointerDown={() => { audio.click(); setMode('PHONE_MENU'); }} aria-label="Ponsel">
              HP
            </button>
          </>
        )}
        <button type="button" className="tc-pause" onPointerDown={() => { audio.click(); setMode('PAUSE'); }} aria-label="Jeda">
          II
        </button>
      </div>

      <PortraitHint />
    </div>
  );
}

// Gentle dismissible rotate-your-phone suggestion in portrait.
function PortraitHint() {
  const [portrait, setPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!portrait || dismissed) return null;
  return (
    <div className="tc-rotate">
      <span className="chip chip-amber">POTRET</span>
      <p>Putar ke <b>lanskap</b> agar layar lebih lega</p>
      <button type="button" className="tc-rotate-close" onPointerDown={() => setDismissed(true)} aria-label="Tutup">×</button>
    </div>
  );
}
