import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { useStats } from '../../stores/statsStore';
import { useStory } from '../../stores/storyStore';
import { useSocial } from '../../stores/socialStore';
import { useQuests } from '../../stores/questStore';
import { useInventory } from '../../stores/inventoryStore';
import { useSettings } from '../../stores/settingsStore';
import { QUESTS } from '../../data/quests';
import { ITEM_BY_ID } from '../../data/items';
import { NPCS } from '../../data/npcs';
import { STUDY_QUESTIONS } from '../../data/chapters';
import { relLabel } from '../../game/systems/relationship';
import { repLabel } from '../../game/systems/reputation';
import { clockLabel, DAYS } from '../../game/systems/time';
import { saveGame, loadGame, deleteSave, hasSave, slotInfo, SAVE_SLOTS, type SlotId } from '../../game/save';
import { applyEffects } from '../../game/systems/effects';
import { audio } from '../../game/audio';

// Shared full-screen menu shell with keyboard navigation (arrows/WASD, Esc).
export function FullMenu({ title, onClose, children, eyebrow = 'DOSSIER // YUSON_SYS_V1.04' }: { title: string; onClose: () => void; children: ReactNode; eyebrow?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const first = el.querySelector('button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const btns = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[];
        const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
        if (idx >= 0) {
          e.preventDefault();
          const next = e.key === 'ArrowDown' ? (idx + 1) % btns.length : btns[(idx - 1 + btns.length) % btns.length];
          next.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="full-menu" ref={ref}>
      <header>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <button onClick={() => { audio.click(); onClose(); }}>CLOSE [ESC]</button>
      </header>
      <main>{children}</main>
    </div>
  );
}

export function StatusPanel() {
  const { hp, maxHp, focus } = usePlayer();
  const { academic, violence, diplomacy, reputation } = useStats();
  const flags = useStory((s) => s.flags.length);
  return (
    <section className="status-panel panel-cut">
      <h2>REN</h2>
      <div className="stat-grid">
        <span>HEALTH<b>{Math.round(hp)} / {maxHp}</b></span>
        <span>FOCUS<b>{Math.round(focus)} / 100</b></span>
        <span>ACADEMIC<b>{academic}</b></span>
        <span>VIOLENCE<b>{violence}</b></span>
        <span>DIPLOMACY<b>{diplomacy}</b></span>
        <span>REPUTATION<b>{repLabel(reputation, { violence, diplomacy })}</b></span>
        <span>STORY FLAGS<b>{flags}</b></span>
        <span>CLASS<b>Siswa Pindahan</b></span>
      </div>
    </section>
  );
}

export function RelationshipsPanel() {
  const relationships = useSocial((s) => s.relationships);
  return (
    <div className="relationship-list">
      <div className="eyebrow">SOCIAL NETWORK // PERSISTENT DATA</div>
      {NPCS.map((n) => (
        <div className="relationship-row" key={n.id}>
          <span className="portrait" style={{ background: n.color }}>{n.name[0]}</span>
          <div className="rel-info">
            <strong>{n.name}</strong>
            <span>{n.role}</span>
          </div>
          <b>{relLabel(relationships[n.id] ?? 0)}</b>
          <span className="rel-val">{(relationships[n.id] ?? 0) > 0 ? '+' : ''}{relationships[n.id] ?? 0}</span>
        </div>
      ))}
    </div>
  );
}

export function QuestsPanel() {
  const quests = useQuests((s) => s.quests);
  const groups: [string, string][] = [['main', 'MAIN QUEST'], ['side', 'SIDE QUEST']];
  return (
    <div className="quest-list">
      {groups.map(([type, label]) => (
        <div key={type}>
          <div className="eyebrow">{label}</div>
          {QUESTS.filter((q) => q.type === type).map((q) => {
            const st = quests[q.id] ?? 'locked';
            if (st === 'locked') return null;
            return (
              <div className={`quest-row st-${st}`} key={q.id}>
                <strong>{q.title}</strong>
                <span>{st === 'completed' ? '✔ SELESAI' : st === 'failed' ? '✖ GAGAL' : q.objective}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function InventoryPanel() {
  const items = useInventory((s) => s.items);
  const [filter, setFilter] = useState<'all' | 'consumable' | 'quest' | 'key' | 'misc'>('all');
  const shown = items.map((id) => ITEM_BY_ID[id]).filter(Boolean).filter((i) => filter === 'all' || i.category === filter);
  const useItem = (id: string) => {
    const item = ITEM_BY_ID[id];
    if (!item?.use) return;
    applyEffects([{ k: 'hp', delta: item.use.hp ?? 0 }, { k: 'stat', stat: 'focus', delta: item.use.focus ?? 0 }, { k: 'item', id, remove: true }]);
    audio.click();
  };
  return (
    <div className="inventory-panel">
      <div className="inv-filters">
        {(['all', 'consumable', 'quest', 'key', 'misc'] as const).map((f) => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => { setFilter(f); audio.click(); }}>{f.toUpperCase()}</button>
        ))}
      </div>
      <div className="inv-grid">
        {shown.map((item) => (
          <div className="inv-item" key={item.id}>
            <strong>{item.name}</strong>
            <span className={`cat cat-${item.category}`}>{item.category}</span>
            <p>{item.desc}</p>
            {item.use && <button onClick={() => useItem(item.id)}>GUNAKAN</button>}
          </div>
        ))}
        {!shown.length && <p className="empty">Tidak ada item pada kategori ini.</p>}
      </div>
    </div>
  );
}

export function MapPanel() {
  const player = usePlayer((s) => ({ x: s.x, z: s.z }));
  const visited = useGame((s) => s.visitedZones);
  const quests = useQuests((s) => s.quests);
  const activeQuest = QUESTS.find((q) => quests[q.id] === 'active');
  // world → map coords
  const toMap = (x: number, z: number): [string, string] => [`${50 + (x / 42) * 46}%`, `${50 + ((z - 6) / 40) * 44}%`];
  return (
    <section className="map-panel panel-cut">
      <div className="eyebrow">SCHEMATIC NODE MAP // SMA YUSON</div>
      <h2>BLUEPRINT LINGKUNGAN SEKOLAH</h2>
      <div className="map-grid">
        {activeQuest && <div className="map-objective">OBJEKTIF: {activeQuest.objective}</div>}
        {Object.entries(ZONE_COORDS).map(([id, zone]) => {
          const [left, top] = toMap(zone[0], zone[1]);
          return <span key={id} className={`node ${visited.includes(id as never) ? '' : 'unvisited'}`} style={{ left, top }}>{id.replace('_', ' ').toUpperCase()}</span>;
        })}
        <div className="map-player" style={{ left: toMap(player.x, player.z)[0], top: toMap(player.x, player.z)[1] }} />
      </div>
    </section>
  );
}

const ZONE_COORDS: Record<string, [number, number]> = {
  street: [7, 42.5],
  gate: [7, 38],
  courtyard: [7, 28.5],
  class_door: [16.5, 24.5],
  parking: [30, 31],
  canteen: [27, 8],
  field: [-24, 8],
  back_stairs: [1.5, -12],
  back_alley: [7, -24],
  warehouse: [-32, -27],
};

export function PhonePanel() {
  const [tab, setTab] = useState<'messages' | 'contacts' | 'schedule' | 'notes'>('messages');
  const clock = useGame((s) => s.clock);
  const period = clockLabel(clock);
  const messages = [
    { from: 'SITI', text: 'Jangan lupa formulir OSIS kalau kamu yang bawa.' },
    { from: 'ARIS', text: 'Ren, buku catatan aku titipin ya kalau ada kuis.' },
    { from: 'UNKNOWN', text: 'Kami melihatmu di gerbang. Hati-hati di jalan pulang.' },
  ];
  return (
    <div className="phone-panel">
      <div className="phone-tabs">
        {(['messages', 'contacts', 'schedule', 'notes'] as const).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); audio.click(); }}>{t.toUpperCase()}</button>
        ))}
      </div>
      <div className="phone-body">
        {tab === 'messages' && messages.map((m, i) => (
          <div className="phone-msg" key={i}><strong>{m.from}</strong><p>{m.text}</p></div>
        ))}
        {tab === 'contacts' && NPCS.map((n) => (
          <div className="phone-msg" key={n.id}><span className="portrait" style={{ background: n.color }}>{n.name[0]}</span><p>{n.name} — {n.role}</p></div>
        ))}
        {tab === 'schedule' && (
          <div className="phone-msg"><p>{period}</p>
            <p>07:00 Datang — 08:00 Kelas — 10:00 Istirahat — 12:00 Makan siang — 14:00 Pulang</p>
            <p>Hari: {DAYS[clock.day]}</p>
          </div>
        )}
        {tab === 'notes' && (
          <div className="phone-msg"><p>— Jaga nilai.</p><p>— Jangan lewat gang belakang sendirian.</p><p>— Jangan ikut campur. (Catatan lama: garis bawah dua kali)</p></div>
        )}
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const s = useSettings();
  const rows: [keyof typeof s, string, number, number, number][] = [
    ['camDistance', 'CAMERA DISTANCE', 2.6, 8, 0.1],
    ['master', 'MASTER VOLUME', 0, 1, 0.05],
    ['music', 'MUSIC', 0, 1, 0.05],
    ['sfx', 'SFX', 0, 1, 0.05],
    ['ui', 'UI', 0, 1, 0.05],
    ['ambient', 'AMBIENT', 0, 1, 0.05],
  ];
  return (
    <div className="settings-panel">
      {rows.map(([key, label, min, max, step]) => (
        <label key={String(key)}>
          <span>{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={s[key] as number}
            onChange={(e) => {
              s.set(key as never, Number(e.target.value) as never);
              if (key === 'master' || key === 'sfx') audio.applyVolumes();
              if (key === 'sfx') audio.hover();
            }}
          />
        </label>
      ))}
      <label><span>REDUCED MOTION</span><input type="checkbox" checked={s.reducedMotion} onChange={(e) => s.set('reducedMotion', e.target.checked)} /></label>
      <label><span>SCREEN SHAKE</span><input type="checkbox" checked={s.screenShake} onChange={(e) => s.set('screenShake', e.target.checked)} /></label>
      <p>CONTROLS: WASD MOVE · SHIFT RUN · SPACE JUMP · MOUSE CAMERA · WHEEL ZOOM · LMB ATTACK · Q HEAVY · RMB BLOCK · E INTERACT</p>
    </div>
  );
}

export function SaveLoadPanel() {
  const [tick, setTick] = useState(0);
  void tick;
  return (
    <div className="saveload-panel">
      {SAVE_SLOTS.map((slot: SlotId) => {
        const info = slotInfo(slot);
        return (
          <div className="save-slot" key={slot}>
            <strong>SLOT {slot.toUpperCase()}</strong>
            <span>{info.savedAt ? `BAB ${info.chapter} · ${new Date(info.savedAt).toLocaleString()}` : '— kosong —'}</span>
            <div className="slot-actions">
              <button onClick={() => { saveGame(slot); setTick((t) => t + 1); }}>SIMPAN</button>
              <button disabled={!hasSave(slot)} onClick={() => { const err = loadGame(slot); if (err) useGame.getState().notify(err, 'warn'); setTick((t) => t + 1); }}>MUAT</button>
              <button disabled={!hasSave(slot)} onClick={() => { deleteSave(slot); setTick((t) => t + 1); }}>HAPUS</button>
            </div>
          </div>
        );
      })}
      <p className="hint">Slot "AUTO" diperbarui otomatis di momen cerita penting.</p>
    </div>
  );
}

export function StudyPanel() {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const questions = STUDY_QUESTIONS;

  if (done) {
    return (
      <div className="study-panel panel-cut">
        <div className="eyebrow">BELAJAR // SESI SELESAI</div>
        <h2>{correct} / {questions.length} BENAR</h2>
        <p>Ren menutup bukunya. Kepalanya lebih jernih dari sebelumnya.</p>
        <button onClick={() => { useGame.getState().setMode('GAMEPLAY'); }}>KEMBALI</button>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div className="study-panel panel-cut">
      <div className="eyebrow">BELAJAR // PERTANYAAN {idx + 1}/{questions.length}</div>
      <h2>{q.q}</h2>
      <div className="study-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            className={picked === i ? (i === q.answer ? 'good' : 'bad') : picked != null && i === q.answer ? 'good' : ''}
            disabled={picked != null}
            onClick={() => {
              setPicked(i);
              audio.click();
              if (i === q.answer) setCorrect((c) => c + 1);
              setTimeout(() => {
                if (idx + 1 >= questions.length) {
                  const c = correct + (i === q.answer ? 1 : 0);
                  applyEffects([
                    { k: 'stat', stat: 'academic', delta: c * 3 },
                    { k: 'stat', stat: 'focus', delta: c * 2 - (questions.length - c) },
                    { k: 'flag', id: 'studied_once' },
                    { k: 'quest', id: 'study_habit', state: 'completed' },
                    { k: 'time', minutes: 25 },
                    { k: 'notify', text: `Sesi belajar selesai: ${c}/${questions.length} benar. (Akademik +${c * 3})` },
                  ]);
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
