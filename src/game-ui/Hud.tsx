import { useEffect, useState } from 'react';
import { useGame } from '../stores/gameStore';
import { usePlayer } from '../stores/playerStore';
import { useCombat } from '../stores/combatStore';
import { useQuests } from '../stores/questStore';
import { useSettings } from '../stores/settingsStore';
import { useStory } from '../stores/storyStore';
import { QUESTS } from '../data/quests';
import { DAYS, formatHhmm, periodFor } from '../game/systems/time';
import { ZONE_BY_ID } from '../data/world';
import { notifySound } from '../game/audio';
import { pickActiveQuest, questTargetFor, distanceToTarget, type WaypointTarget } from '../game/waypoint';

// v0.10.0: live objective distance for the HUD mission card. Polls (400ms,
// getState-based) instead of per-frame store subscriptions — position changes
// every frame but the readout only needs meter-ish resolution.
export function useObjective(): { target: WaypointTarget | null; dist: number } {
  const [state, setState] = useState<{ target: WaypointTarget | null; dist: number }>({ target: null, dist: 0 });
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const quests = useQuests.getState().quests;
      const game = useGame.getState();
      const { x, z } = usePlayer.getState();
      const q = pickActiveQuest(quests);
      const target = q && game.scene === 'campus' ? questTargetFor(q, { visited: game.visitedZones, px: x, pz: z }) : null;
      setState((prev) => {
        const dist = Math.round(distanceToTarget(target, x, z));
        const sameTarget =
          prev.target === target ||
          (prev.target != null &&
            target != null &&
            prev.target.questId === target.questId &&
            prev.target.zoneId === target.zoneId);
        if (sameTarget && prev.dist === dist) return prev; // avoid churn
        return { target, dist };
      });
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);
  return state;
}

function Meter({ label, value, color, width }: { label: string; value: string; color: 'red' | 'amber' | 'cyan' | 'green'; width: string }) {
  return (
    <div className="meter">
      <div><span>{label}</span><b>{value}</b></div>
      <i><b className={color} style={{ width }} /></i>
    </div>
  );
}

// HUD eksplorasi — implementasi mockup Stitch "03-exploration":
// top bar (brand + jam), kartu vitals, kartu misi, tag zona,
// prompt interaksi ber-bracket, dan chip kontrol bawah.
export function Hud() {
  const hp = usePlayer((s) => s.hp);
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => s.focus);
  const clock = useGame((s) => s.clock);
  const zone = useGame((s) => s.currentZone);
  const interactTarget = useGame((s) => s.interactTarget);
  const chapter = useStory((s) => s.chapter);
  // v0.13.0: first-person crosshair + camera control chip
  const camMode = useSettings((s) => s.camMode);
  const gameMode = useGame((s) => s.mode);
  const lastHit = useCombat((s) => s.lastPlayerHitAt);
  const hurtFlash = Date.now() - lastHit < 400;
  // v0.10.0: waypoint-backed mission card — title, objective AND live distance
  const { target, dist } = useObjective();
  const activeQuest = target ? QUESTS.find((q) => q.id === target.questId) ?? null : null;

  return (
    <div className={`minimal-hud ${hurtFlash ? 'hurt' : ''}`}>
      <header className="hud-top">
        <span className="hud-brand">CHAOS <i>//</i> 01</span>
        <span className="hud-act">ACT I <i>//</i> {`BAB ${chapter}`}</span>
        <span className="spacer" />
        <div className="hud-clock">
          <b>{DAYS[clock.day]}</b> {formatHhmm(clock.minutes)} WIB
          <i>//</i>
          <span className="period">{periodFor(clock.minutes).label}</span>
        </div>
        <div className="hud-avatar">R</div>
      </header>

      <div className="vitals">
        <div className="vitals-head">
          <b>REN</b>
          <span>LVL 01 // KELAS X-C</span>
        </div>
        <Meter label="HP" value={`${Math.round(hp)} / ${maxHp}`} color="red" width={`${(hp / maxHp) * 100}%`} />
        <Meter label="FOKUS" value={`${Math.round(focus)} / 100`} color="amber" width={`${focus}%`} />
      </div>

      <div className="obj-card">
        <div className="obj-marker">M</div>
        <div className="obj-body">
          <b>{activeQuest?.type === 'side' ? 'MISI SAMPINGAN' : 'MISI UTAMA'}</b>
          <strong>{activeQuest ? activeQuest.objective : 'Ikuti alur cerita'}</strong>
          <span>
            {activeQuest ? activeQuest.title : 'PROLOG SMA YUSON'}
            {target && <i className="obj-dist">{dist > 4 ? ` // ${dist}m` : ' // DI SINI'}</i>}
          </span>
        </div>
      </div>

      {zone && (
        <div className="zone-tag">
          LOKASI <b>//</b> {ZONE_BY_ID[zone]?.label ?? ''}
        </div>
      )}

      {(camMode === 'first' && (gameMode === 'GAMEPLAY' || gameMode === 'COMBAT')) && (
        <div className="fp-crosshair" />
      )}

      {interactTarget && (
        <div className="interact brackets">
          <kbd>E</kbd> BICARA <i>//</i> <span>{interactTarget.toUpperCase()}</span>
        </div>
      )}

      <footer className="hud-controls">
        <span><kbd>WASD</kbd> GERAK</span>
        <span><kbd>SHIFT</kbd> LARI</span>
        <span><kbd>SPACE</kbd> LOMPAT</span>
        <span><kbd>LMB</kbd> SERANG</span>
        <span><kbd>E</kbd> INTERAKSI</span>
        <span><kbd>V</kbd> KAMERA</span>
        <span><kbd>ESC</kbd> JEDA</span>
      </footer>
    </div>
  );
}

export function Notifications() {
  const notifications = useGame((s) => s.notifications);
  const dismiss = useGame((s) => s.dismissNotification);

  useEffect(() => {
    const latest = notifications[notifications.length - 1];
    if (!latest) return;
    notifySound(latest.kind);
    const t = setTimeout(() => dismiss(latest.id), 3600);
    return () => clearTimeout(t);
  }, [notifications, dismiss]);

  return (
    <div className="notifications">
      {notifications.map((n) => (
        <div key={n.id} className={`notif kind-${n.kind}`} onClick={() => dismiss(n.id)}>{n.text}</div>
      ))}
    </div>
  );
}

// Combat HUD — implementasi mockup Stitch "08-combat":
// panel pemain kiri-atas, panel musuh kanan-atas, chip mode tengah,
// bar aksi kanan-bawah.
export function CombatHud() {
  const enemies = useCombat((s) => s.enemies);
  const index = useCombat((s) => s.index);
  const cur = enemies[index];
  const hp = usePlayer((s) => s.hp);
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => s.focus);

  return (
    <div className="combat-ui">
      <div className="cb-top">
        <div className="cb-panel player">
          <div className="cb-head"><b>REN PRATAMA</b><span>X-C</span></div>
          <Meter label="HP" value={`${Math.round(hp)} / ${maxHp}`} color="red" width={`${(hp / maxHp) * 100}%`} />
          <Meter label="FOKUS" value={`${Math.round(focus)} / 100`} color="amber" width={`${focus}%`} />
          <span className="chip chip-amber">STREET BRAWLER</span>
        </div>
        <div className="cb-mid">
          <span className="cb-mode">MODE SKIRMISH <i>//</i> DUEL</span>
          <span className="cb-round">REN {Math.round(hp)} HP <i>·</i> {enemies.length} LAWAN</span>
        </div>
        {cur && (
          <div className="cb-panel enemy">
            <div className="cb-head"><span>{enemies.length > 1 ? `TARGET ${index + 1}/${enemies.length}` : 'TARGET'}</span><b>{cur.name.toUpperCase()}</b></div>
            <Meter label={cur.name.toUpperCase()} value={`${cur.hp} / ${cur.maxHp}`} color="red" width={`${(cur.hp / cur.maxHp) * 100}%`} />
          </div>
        )}
      </div>
      <div className="cb-actions">
        <span><kbd>LMB</kbd> PUKUL</span>
        <span><kbd>Q</kbd> HEAVY <i>−10</i></span>
        <span><kbd>RMB</kbd> TANGKIS</span>
        <span><kbd>SHIFT</kbd> MENGELAK <i>−6</i></span>
      </div>
    </div>
  );
}
