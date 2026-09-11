import { useEffect } from 'react';
import { useGame } from '../stores/gameStore';
import { usePlayer } from '../stores/playerStore';
import { useCombat } from '../stores/combatStore';
import { useQuests } from '../stores/questStore';
import { QUESTS } from '../data/quests';
import { clockLabel } from '../game/systems/time';
import { ZONE_BY_ID } from '../data/world';
import { notifySound } from '../game/audio';

function Meter({ label, value, color, width }: { label: string; value: string; color: 'red' | 'cyan'; width: string }) {
  return (
    <div className="meter">
      <div><span>{label}</span><b>{value}</b></div>
      <i><b className={color} style={{ width }} /></i>
    </div>
  );
}

export function Hud() {
  const hp = usePlayer((s) => s.hp);
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => s.focus);
  const clock = useGame((s) => s.clock);
  const zone = useGame((s) => s.currentZone);
  const interactTarget = useGame((s) => s.interactTarget);
  const quests = useQuests((s) => s.quests);
  const activeQuest = QUESTS.find((q) => q.type === 'main' && quests[q.id] === 'active');
  const lastHit = useCombat((s) => s.lastPlayerHitAt);
  const hurtFlash = Date.now() - lastHit < 400;

  return (
    <div className={`minimal-hud ${hurtFlash ? 'hurt' : ''}`}>
      <div className="minimal-vitals">
        <b>REN</b>
        <Meter label="HP" value={`${Math.round(hp)} / ${maxHp}`} color="red" width={`${(hp / maxHp) * 100}%`} />
        <Meter label="FOCUS" value={`${Math.round(focus)} / 100`} color="cyan" width={`${focus}%`} />
      </div>
      <div className="objective">
        <b>{clockLabel(clock)}</b>
        {zone && <span>{ZONE_BY_ID[zone]?.label ?? ''}</span>}
        <span>CURRENT OBJECTIVE</span>
        <strong>{activeQuest ? activeQuest.objective : 'Ikuti cerita'}</strong>
      </div>
      {interactTarget && <div className="interact">[E] <span>BICARA DENGAN {interactTarget.toUpperCase()}</span></div>}
      <div className="controls">WASD MOVE · SHIFT RUN · SPACE JUMP · LMB ATTACK · Q HEAVY · RMB BLOCK · E INTERACT · ESC PAUSE</div>
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

export function CombatHud() {
  const enemies = useCombat((s) => s.enemies);
  const index = useCombat((s) => s.index);
  const cur = enemies[index];
  const hp = usePlayer((s) => s.hp);
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => s.focus);

  return (
    <div className="combat-ui">
      <div className="combat-title">DUEL{cur ? ` // ${cur.name.toUpperCase()}` : ''}{enemies.length > 1 ? ` (${index + 1}/${enemies.length})` : ''}</div>
      {cur && <Meter label={cur.name.toUpperCase()} value={`${cur.hp} / ${cur.maxHp}`} color="red" width={`${(cur.hp / cur.maxHp) * 100}%`} />}
      <Meter label="REN HP" value={`${Math.round(hp)} / ${maxHp}`} color="cyan" width={`${(hp / maxHp) * 100}%`} />
      <Meter label="FOCUS" value={`${Math.round(focus)} / 100`} color="cyan" width={`${focus}%`} />
      <div className="combat-actions">
        <span>LMB STRIKE</span><span>Q HEAVY (−10 FOCUS)</span><span>RMB BLOCK</span><span>SHIFT DODGE (−6 FOCUS)</span>
      </div>
    </div>
  );
}
