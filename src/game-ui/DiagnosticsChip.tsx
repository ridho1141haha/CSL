import { useEffect, useState } from 'react';
import { mobile } from '../game/mobile';


// ============================================================================
// DiagnosticsChip (v0.5.0) — surfaces silent failures on-screen.
//
// The v0.4.x "blank world on phone" report came with zero information: the
// canvas cleared to the sky color and nobody could tell why. This chip prints
// the LAST captured diagnostic (JS error / unhandled rejection / WebGL context
// loss / render-loop watchdog) as a small mono line, so any future breakage is
// user-screenshotable and fixable instead of a mystery.
//
// It also offers a one-tap "MUAT ULANG" recovery when the render loop stalls.
// ============================================================================

export function DiagnosticsChip() {
  const [text, setText] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [stalled, setStalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const iv = window.setInterval(() => {
      const last = mobile.diag[mobile.diag.length - 1];
      if (last) {
        setText(last.message);
        setKind(last.kind);
      }
      setStalled(mobile.stalled());
    }, 1000);

    // pet the watchdog detector from outside the canvas too — if the tab is
    // backgrounded mobile.stalled() already returns false via document.hidden
    return () => window.clearInterval(iv);
  }, []);

  // mark frames from the DOM side as "alive" while the canvas may be dead:
  // we only stall when the CANVAS hasn't reported; the canvas pets
  // mobile.markFrame() from its render loop (see App <Watchdog/>).
  if (!text && !stalled) return null;
  if (dismissed && !stalled) return null;

  const isFatal = stalled || kind === 'webgl';

  return (
    <div className={`diag-chip ${isFatal ? 'fatal' : ''}`} role="status">
      <span className="diag-dot" />
      <span className="diag-text">
        {stalled ? 'RENDER TERHENTI — grafis berhenti merespons' : `[${kind?.toUpperCase()}] ${text}`}
      </span>
      {isFatal ? (
        <button className="diag-reload" onClick={() => window.location.reload()}>MUAT ULANG</button>
      ) : (
        <button className="diag-close" onClick={() => setDismissed(true)} aria-label="tutup">×</button>
      )}
    </div>
  );
}

// The render-loop heartbeat is petted by CameraRig (inside the Canvas render
// loop) via mobile.markFrame() every rendered frame. No DOM-side rAF here —
// a side rAF loop would keep beating even when the WebGL loop is dead, which
// would defeat the stall detection.
