import { useEffect, useState } from 'react';
import { useGame } from '../stores/gameStore';
import { usePlayer } from '../stores/playerStore';
import { useCombat } from '../stores/combatStore';
import { useQuests } from '../stores/questStore';
import { useStory } from '../stores/storyStore';
import { QUESTS } from '../data/quests';
import { DAYS, formatHhmm, periodFor } from '../game/systems/time';
import { ZONE_BY_ID } from '../data/world';
import { audio, notifySound } from '../game/audio';
import { input } from '../game/input';
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
        if (
          prev.target?.questId === target?.questId &&
          prev.target?.zoneId === target?.zoneId &&
          prev.dist === dist
        ) {
          return prev; // avoid churn
        }
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
// v0.14.0: kartu misi punya pilihan navigasi [TELEPORT] / [JALAN].
export function Hud() {
  // Bolt optimization: Math.round() prevents 60fps re-renders during fractional regen
  const hp = usePlayer((s) => Math.round(s.hp));
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => Math.round(s.focus));
  const clock = useGame((s) => s.clock);
  const zone = useGame((s) => s.currentZone);
  const interactTarget = useGame((s) => s.interactTarget);
  const chapter = useStory((s) => s.chapter);
  const gameMode = useGame((s) => s.mode);
  const lastHit = useCombat((s) => s.lastPlayerHitAt);
  const hurtFlash = Date.now() - lastHit < 400;
  // v0.10.0: waypoint-backed mission card — title, objective AND live distance
  const { target, dist } = useObjective();
  const activeQuest = target ? QUESTS.find((q) => q.id === target.questId) ?? null : null;
  // v0.14.0: mission navigation (Task 1). Teleport memindahkan Ren ke target
  // via requestScene (fade out → place → fade in) — objective TIDAK otomatis
  // selesai; kondisi objective tetap dievaluasi sistem yang ada (zona/flag/
  // periode). Walk tidak mengambil alih kontrol — waypoint ◆ + jarak di HUD
  // sudah aktif, jadi cukup menegaskan arah ke pemain.
  const [walkHint, setWalkHint] = useState(false);
  const sceneLoading = useGame((s) => s.sceneLoading);
  const teleportToMission = () => {
    const g = useGame.getState();
    if (!target || g.sceneLoading) return;
    audio.click();
    g.requestScene('campus', [target.pos[0], target.pos[1] + 1.4]);
    g.notify(`Menuju misi: ${target.label}`, 'info');
  };
  const walkToMission = () => {
    if (!target) return;
    audio.click();
    setWalkHint(true);
    window.setTimeout(() => setWalkHint(false), 3200);
    useGame.getState().notify(`Ikuti penanda ◆ ke ${target.label} (${dist}m)`, 'info');
  };

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

      <div className={`obj-card ${walkHint ? 'walk-hint' : ''}`}>
        <div className="obj-marker">M</div>
        <div className="obj-body">
          <b>{activeQuest?.type === 'side' ? 'MISI SAMPINGAN' : 'MISI UTAMA'}</b>
          <strong>{activeQuest ? activeQuest.objective : 'Ikuti alur cerita'}</strong>
          <span>
            {activeQuest ? activeQuest.title : 'PROLOG SMA YUSON'}
            {target && <i className="obj-dist">{dist > 4 ? ` // ${dist}m` : ' // DI SINI'}</i>}
          </span>
          {target && (
            <span className="obj-actions">
              <button onClick={teleportToMission} disabled={sceneLoading} title="Pindah langsung ke lokasi misi">
                TELEPORT
              </button>
              <button onClick={walkToMission} title="Tandai arah — jalan sendiri via waypoint">
                JALAN
              </button>
            </span>
          )}
        </div>
      </div>

      {zone && (
        <div className="zone-tag">
          LOKASI <b>//</b> {ZONE_BY_ID[zone]?.label ?? ''}
        </div>
      )}

      {(gameMode === 'GAMEPLAY' || gameMode === 'COMBAT') && (
        <div className="fp-crosshair" />
      )}

      {interactTarget && (
        <button
          type="button"
          className="interact brackets"
          onClick={() => { audio.click(); input.injectPress('interact'); }}
        >
          <kbd>E</kbd> BICARA <i>//</i> <span>{interactTarget.toUpperCase()}</span>
        </button>
      )}

      <footer className="hud-controls">
        <span><kbd>WASD</kbd> GERAK</span>
        <span><kbd>SHIFT</kbd> LARI</span>
        <span><kbd>SPACE</kbd> LOMPAT</span>
        <span><kbd>LMB</kbd> SERANG</span>
        <span><kbd>E</kbd> INTERAKSI</span>
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
  // Bolt optimization: Math.round() prevents 60fps re-renders during fractional regen
  const hp = usePlayer((s) => Math.round(s.hp));
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => Math.round(s.focus));

  // v0.15.2: tandai body saat combat — notifikasi digeser turun supaya tidak
  // menumpuk panel darah musuh (anti-bertumpuk; CSS body.in-combat).
  useEffect(() => {
    document.body.classList.add('in-combat');
    return () => document.body.classList.remove('in-combat');
  }, []);

  const lowHp = hp / Math.max(1, maxHp) <= 0.3;
  const enemyLowHp = cur ? cur.hp / Math.max(1, cur.maxHp) <= 0.3 : false;

  return (
    <div className={`combat-ui ${lowHp ? 'low-hp' : ''}`}>
      <div className="cb-top">
        <div className={`cb-panel player ${lowHp ? 'danger' : ''}`}>
          <div className="cb-head">
            <span className="cb-avatar player-av">R</span>
            <div className="cb-id">
              <b>REN PRATAMA</b>
              <span>X-C // STREET BRAWLER</span>
            </div>
          </div>
          <div className="cb-meters">
            <Meter label="HP" value={`${Math.round(hp)} / ${maxHp}`} color="red" width={`${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%`} />
            <Meter label="FOKUS" value={`${Math.round(focus)} / 100`} color="amber" width={`${Math.max(0, Math.min(100, focus))}%`} />
          </div>
        </div>
        <div className="cb-mid">
          <span className="cb-mode">SKIRMISH <i>//</i> DUEL</span>
          <span className="cb-round">{enemies.length > 1 ? `LAWAN ${index + 1}/${enemies.length}` : '1 VS 1'}</span>
        </div>
        {cur && (
          <div className={`cb-panel enemy ${enemyLowHp ? 'danger' : ''}`}>
            <div className="cb-head">
              <div className="cb-id">
                <b>{cur.name.toUpperCase()}</b>
                <span>{enemies.length > 1 ? `TARGET ${index + 1}/${enemies.length}` : 'TARGET AKTIF'}</span>
              </div>
              <span className="cb-avatar enemy-av">{cur.name[0]?.toUpperCase() ?? '!'}</span>
            </div>
            <div className="cb-meters">
              <Meter label="HP LAWAN" value={`${Math.max(0, Math.round(cur.hp))} / ${cur.maxHp}`} color="red" width={`${Math.max(0, Math.min(100, (cur.hp / cur.maxHp) * 100))}%`} />
            </div>
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
