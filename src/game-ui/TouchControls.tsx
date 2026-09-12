import { useEffect, useRef, useState } from 'react';
import { useGame } from '../stores/gameStore';
import { input } from '../game/input';
import { mobile } from '../game/mobile';

// ============================================================================
// TouchControls (v0.5.0) — on-screen controls for touch devices.
//
// Layout (landscape):
//   ┌──────────────────────────────────────────────┐
//   │  ◉ joystick                        [ ⤒ ]     │  ← jump
//   │  (left thumb)              [E] [⚡] [✦] [🛡] │  ← interact/attack/dodge/block
//   │                                  (right thumb)│
//   └──────────────────────────────────────────────┘
//   Right half of the screen (not covered by buttons) = camera drag pad.
//
// Notes:
// - Only mounted when mobile.touch && phase === 'play'.
// - Uses pointer events with setPointerCapture, multi-touch safe (joystick and
//   buttons can be held simultaneously).
// - PAUSE button top-right; dialogue advance taps are handled by DialogueUI.
// ============================================================================

const STICK_R = 46; // px — joystick travel radius

export function TouchControls() {
  const phase = useGame((s) => s.phase);
  const mode = useGame((s) => s.mode);
  const setMode = useGame((s) => s.setMode);
  const show = mobile.touch && phase === 'play';
  const [stick, setStick] = useState<{ active: boolean; ox: number; oy: number; kx: number; ky: number }>({ active: false, ox: 0, oy: 0, kx: 0, ky: 0 });
  const stickId = useRef<number | null>(null);
  const lookId = useRef<number | null>(null);
  const lookLast = useRef({ x: 0, y: 0 });

  // release everything if the game leaves play (mode switches to menus etc.)
  useEffect(() => {
    if (!show) {
      input.setAxes(0, 0);
      input.touch.run = false;
      input.touch.block = false;
      stickId.current = null;
      lookId.current = null;
    }
  }, [show]);

  if (!show) return null;

  const inCombat = mode === 'COMBAT';
  const inGameplay = mode === 'GAMEPLAY' || inCombat;

  // ---- joystick handlers ----
  const onStickDown = (e: React.PointerEvent) => {
    if (stickId.current !== null) return;
    stickId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ox = rect.left + rect.width / 2;
    const oy = rect.top + rect.height / 2;
    setStick({ active: true, ox, oy, kx: 0, ky: 0 });
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
    setStick((s) => ({ ...s, kx: dx, ky: dy }));
    // axes: screen y-down → game y-up forward
    input.setAxes(dx / max, -dy / max);
    input.touch.run = len > max * 0.92;
  };
  const onStickUp = (e: React.PointerEvent) => {
    if (stickId.current !== e.pointerId) return;
    stickId.current = null;
    setStick((s) => ({ ...s, active: false, kx: 0, ky: 0 }));
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
          <div className="tc-stick-ring" />
          <div className="tc-stick-nub" style={{ transform: `translate(${stick.kx}px, ${stick.ky}px)` }} />
        </div>
      )}

      {/* action cluster — bottom right */}
      {inGameplay && (
        <div className="tc-actions">
          {inCombat ? (
            <>
              <button className="tc-btn amber" onPointerDown={() => input.injectLeftTap()}>ATK</button>
              <button className="tc-btn red" onPointerDown={() => input.injectPress('attack_heavy')}>HEV</button>
              <button
                className="tc-btn cyan"
                onPointerDown={() => { input.touch.block = true; }}
                onPointerUp={() => { input.touch.block = false; }}
                onPointerCancel={() => { input.touch.block = false; }}
              >BLK</button>
              <button className="tc-btn" onPointerDown={() => input.injectPress('dodge')}>DGE</button>
            </>
          ) : (
            <>
              <button className="tc-btn amber" onPointerDown={() => input.injectPress('interact')}>E</button>
              <button className="tc-btn" onPointerDown={() => input.injectPress('jump')}>↑</button>
            </>
          )}
        </div>
      )}

      {/* pause — always available during play */}
      <button className="tc-pause" onPointerDown={() => setMode('PAUSE')}>II</button>

      <PortraitHint />
    </div>
  );
}

// Gentle rotate-your-phone suggestion in portrait (game is tuned for landscape).
function PortraitHint() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const check = () => setPortrait(window.innerHeight > window.innerWidth);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!portrait) return null;
  return (
    <div className="tc-rotate">
      <span className="chip chip-amber">MODE POTRET</span>
      <p>Putar HP ke <b>mode lanskap</b> untuk pengalaman terbaik</p>
    </div>
  );
}
