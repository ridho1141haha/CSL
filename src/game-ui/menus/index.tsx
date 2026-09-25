import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { useStats } from '../../stores/statsStore';
import { useStory } from '../../stores/storyStore';
import { useSocial } from '../../stores/socialStore';
import { useQuests } from '../../stores/questStore';
import { useInventory } from '../../stores/inventoryStore';
import { useSettings } from '../../stores/settingsStore';
import { QUALITY_LABELS } from '../../game/quality';
import { QUESTS } from '../../data/quests';
import { ITEM_BY_ID } from '../../data/items';
import { NPCS } from '../../data/npcs';
import { SCENES, ZONE_BY_ID } from '../../data/world';
import { STUDY_QUESTIONS } from '../../data/chapters';
import { HIDDEN_EVENTS } from '../../data/hiddenEvents';
import { isDiscovered, HIDDEN_EVENT_COUNT } from '../../game/systems/hiddenEvents';
import { relLabel } from '../../game/systems/relationship';
import { repLabel } from '../../game/systems/reputation';
import { clockLabel, DAYS, formatHhmm } from '../../game/systems/time';
import { pickActiveQuest, questTargetFor, distanceToTarget } from '../../game/waypoint';
import { saveGame, deleteSave, hasSave, slotInfo, SAVE_SLOTS, type SlotId } from '../../game/save';
import { loadGame } from '../../game/loadFlow';
import { applyEffects } from '../../game/systems/effects';
import { audio } from '../../game/audio';

// Shared full-screen menu shell with keyboard navigation (arrows/WASD, Esc).
// Shell mengikuti bahas desain Stitch: eyebrow mono + judul display + footer hint.
export function FullMenu({ title, onClose, children, eyebrow = 'DOSSIER // YUSON_SYS_V1.04' }: { title: ReactNode; onClose: () => void; children: ReactNode; eyebrow?: string }) {
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
          const nextIdx = e.key === 'ArrowDown' ? (idx + 1) % btns.length : (idx - 1 + btns.length) % btns.length;
          btns[nextIdx]?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="full-menu" ref={ref}>
      <header>
        <span className="fm-eyebrow">
          <span className="eyebrow">CHAOS // 01</span>
          <span className="eyebrow" style={{ color: 'var(--faint)' }}>{eyebrow}</span>
        </span>
        <h1>{title}</h1>
        <button onClick={() => { audio.click(); onClose(); }}>TUTUP [ESC]</button>
      </header>
      <main>{children}</main>
      <footer className="fm-foot">
        <span><kbd>ESC</kbd> KEMBALI</span>
        <span><kbd>↑↓←→</kbd> NAVIGASI</span>
        <span className="right">CHAOS SCHOOL LIFE // UI STITCH</span>
      </footer>
    </div>
  );
}

// Status — implementasi mockup Stitch "04-status" (TACTICAL DOSSIER):
// kartu identitas kiri, deretan vitals 3 kolom kanan, chip metrik, catatan.
export function StatusPanel() {
  // v0.17.0 (audit L1): field selectors — the whole-store subscriptions here
  // re-rendered on EVERY playerStore write (incl. throttled position updates).
  const hp = usePlayer((s) => s.hp);
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => s.focus);
  const academic = useStats((s) => s.academic);
  const violence = useStats((s) => s.violence);
  const diplomacy = useStats((s) => s.diplomacy);
  const reputation = useStats((s) => s.reputation);
  const flags = useStory((s) => s.flags.length);
  const clock = useGame((s) => s.clock);
  const rel = useSocial((s) => s.relationships);
  // v0.17.0: story average derives from the NPC registry (storyCast flag,
  // Pak Budi excluded — preserved behavior). Was hardcoded aris+siti+bimo/3.
  const cast = NPCS.filter((n) => n.storyCast);
  const relAvg = Math.round(cast.reduce((a, n) => a + (rel[n.id] ?? 0), 0) / Math.max(1, cast.length));
  const violenceTag = violence < 30 ? 'TERKENDALI' : violence < 60 ? 'MEMPRIHATINKAN' : 'TIDAK STABIL';
  const meter = (v: number, max: number, color: string) => (
    <div className="meter">
      <i><b className={color} style={{ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%` }} /></i>
    </div>
  );
  return (
    <section className="dossier">
      <div className="sec-head">PERSONNEL ACADEMIC RECORD <span className="right">DIPERBARUI // {DAYS[clock.day]} {formatHhmm(clock.minutes)} WIB</span></div>
      <div className="dossier-grid">
        <aside className="dossier-aside panel-cut">
          <div className="dossier-frame"><span className="dossier-initial">R</span></div>
          <div className="dossier-id">
            <h3>REN PRATAMA</h3>
            <span className="sub">NIS 23090188 // KELAS X-C</span>
            <div className="tag-row">
              <span className="chip chip-amber">MURID PINDAHAN</span>
              <span className="chip">KELAS X-C</span>
              <span className="chip chip-cyan">{repLabel(reputation, { violence, diplomacy })}</span>
            </div>
            <div className="dossier-mini">
              <span>HARI SEKOLAH <b>{clock.day + 1} / {DAYS.length}</b></span>
              <span>STORY FLAGS <b>{flags}</b></span>
              <span>REPUTASI <b>{repLabel(reputation, { violence, diplomacy })}</b></span>
              <span>SINERGI SOSIAL <b>{relAvg >= 0 ? `+${relAvg}` : relAvg}</b></span>
            </div>
          </div>
        </aside>
        <div className="dossier-main">
          <div className="vitals3">
            <div className="v3-card c-red">
              <div className="v3-head"><span>VITALITY // HP</span><b>{Math.round(hp)}<em> / {maxHp}</em></b></div>
              {meter(hp, maxHp, 'red')}
              <span className="v3-sub">COMBAT ENDURANCE // DAYA TAHAN FISIK</span>
            </div>
            <div className="v3-card c-amber">
              <div className="v3-head"><span>MENTAL // FOKUS</span><b>{Math.round(focus)}<em> / 100</em></b></div>
              {meter(focus, 100, 'amber')}
              <span className="v3-sub">DECISION INTUITION // KEJERNIHAN KEPUTUSAN</span>
            </div>
            <div className="v3-card c-cyan">
              <div className="v3-head"><span>AKADEMIK // GPA</span><b>{academic}<em> / 100</em></b></div>
              {meter(academic, 100, 'cyan')}
              <span className="v3-sub">SCHOLASTIC STATUS // STATUS KELULUSAN</span>
            </div>
          </div>
          <div className="vitals3">
            <div className="v3-card c-red">
              <div className="v3-head"><span>KEKERASAN // VIOLENCE</span><b>{violence}<em>%</em></b></div>
              {meter(violence, 100, 'red')}
              <span className="v3-sub">INSTINK BERTAHAN // {violenceTag}</span>
            </div>
            <div className="v3-card c-green">
              <div className="v3-head"><span>DIPLOMASI // DIPL</span><b>{diplomacy}<em> / 100</em></b></div>
              {meter(diplomacy, 100, 'green')}
              <span className="v3-sub">NEGOSIASI & BICARA // JALAN DAMAI</span>
            </div>
            <div className="v3-card">
              <div className="v3-head"><span>PROFIL SIKAP</span></div>
              <div className="metric-row">
                <span className="chip">SIKAP: <b>AKTIF</b></span>
                <span className="chip">AMBISI: <b>{academic >= 70 ? 'TINGGI' : academic >= 40 ? 'SEDANG' : 'RENDAH'}</b></span>
                <span className="chip">TAHAP: <b>LEVEL 01</b></span>
              </div>
              <span className="v3-sub">KESIMPULAN WALI KELAS // OBSERVASI</span>
            </div>
          </div>
          <div className="dossier-note">
            <b>Catatan observasi:</b> murid pindahan dengan profil psikologis stabil —
            terpantau mampu menjaga ketenangan di bawah tekanan sosial sekolah baru.
            Perkembangan relasi dengan elemen kelas X-C perlu dipantau pekan ini.
          </div>
        </div>
      </div>
    </section>
  );
}

// Relationships — implementasi bagian "CAMPUS SYNDICATE & RELATIONSHIP LOG"
// dari mockup Stitch "04-status": kartu per karakter + kutipan + meter relasi.
// v0.17.0: per-NPC quote/chip live on NpcDef (relQuote/relTag) — the local
// REL_QUOTES/REL_TAGS literal tables are gone; a new cast member needs no UI
// edit (missing relQuote falls back to '…….' exactly as before).

export function RelationshipsPanel() {
  const relationships = useSocial((s) => s.relationships);
  return (
    <div className="relationship-list">
      <div className="sec-head">CAMPUS SYNDICATE & RELATIONSHIP LOG <span className="right">DATA RELASI // PERSISTEN</span></div>
      {NPCS.map((n) => {
        const v = relationships[n.id] ?? 0;
        const pct = Math.max(0, Math.min(100, ((v + 100) / 200) * 100));
        const tone = v < -10 ? 'hostile' : v >= 40 ? 'warm' : '';
        const tag = n.relTag ?? { text: 'SISWA', cls: '' };
        return (
          <div className="relationship-row" key={n.id}>
            <div className="rel-top">
              <span className="portrait" style={{ background: n.color }}>{n.name[0]}</span>
              <div className="rel-info">
                <strong>{n.name}</strong>
                <span>{n.role} // SMA YUSON</span>
              </div>
            </div>
            <p className="rel-quote">{n.relQuote ?? '“…….”'}</p>
            <div className="rel-meter">
              <div className="track"><b className={tone} style={{ width: `${pct}%` }} /></div>
              <span className="rel-val">{v > 0 ? '+' : ''}{v}</span>
            </div>
            <div className="rel-tag">
              <span className={`chip ${tag.cls}`}>{tag.text}</span>
              <span className="chip">{relLabel(v)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function QuestsPanel() {
  const quests = useQuests((s) => s.quests);
  const discovered = HIDDEN_EVENTS.filter((e) => isDiscovered(e));
  const groups: [string, string][] = [['main', 'MAIN QUEST // MISI UTAMA'], ['side', 'SIDE QUEST // MISI SAMPINGAN']];
  const statusChip = (st: string) =>
    st === 'completed' ? <span className="chip chip-green q-status">SELESAI</span>
    : st === 'failed' ? <span className="chip chip-red q-status">GAGAL</span>
    : <span className="chip chip-amber q-status">AKTIF</span>;
  return (
    <div className="quest-list">
      {groups.map(([type, label]) => (
        <div key={type}>
          <div className="sec-head" style={{ marginBottom: 10 }}>{label}</div>
          {QUESTS.filter((q) => q.type === type).map((q) => {
            const st = quests[q.id] ?? 'locked';
            if (st === 'locked') return null;
            return (
              <div className={`quest-row st-${st}`} key={q.id}>
                <div className="q-top">
                  <strong>{q.title}</strong>
                  {statusChip(st)}
                </div>
                <span>{st === 'completed' ? 'Tujuan tercapai. Catatan arsip ditutup.' : st === 'failed' ? 'Peluang hilang. Arsip ditandai merah.' : q.objective}</span>
              </div>
            );
          })}
        </div>
      ))}
      {/* hidden events journal (mentor feedback #5) — rewards exploration */}
      <div>
        <div className="sec-head" style={{ marginBottom: 10 }}>
          TEMUAN TERSEMBUNYI <span className="right">{discovered.length} / {HIDDEN_EVENT_COUNT} DITEMUKAN</span>
        </div>
        {discovered.map((e) => (
          <div className="quest-row st-completed" key={e.id}>
            <div className="q-top">
              <strong>{e.title}</strong>
              <span className="chip chip-cyan q-status">TERCATAT</span>
            </div>
            <span>Temuan opsional. Detailnya tersimpan di arsip pribadi Ren.</span>
          </div>
        ))}
        {!discovered.length && (
          <p className="empty">Belum ada. Bicara dengan orang. Menyimpang dari jalur. Yuson menyimpan lebih banyak daripada yang terlihat.</p>
        )}
      </div>
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

// Map — implementasi mockup Stitch "07-map" (SCHEMATIC CAMPUS OVERVIEW):
// header dengan tag scene, grid node, panel samping target & statistik.
// v0.10.0 fixes (feedback "fix fitur map"):
//   - hitungan zona dikunjungi kini PER-SCENE (dulu global — di atap bisa
//     muncul "20 / 2" karena visitedZones mencampur zona lintas scene)
//   - node zona yang berbagi titik pusat (Kelas 10-A / 12-A / 12-B Gedung B)
//     ditumpuk rapi dengan chip lantai, bukan menimpa satu sama lain
//   - marker TUJUAN mision aktif (sejalan dengan waypoint dunia) + sorotan
//     zona yang sedang diinjak + panah arah hadap Ren
//   - tag header mengikuti scene (GND / ROOF / GUDANG), bukan statis GND
const SCENE_TAG: Record<string, string> = { campus: 'GND', rooftop: 'ROOF', warehouse: 'GUDANG' };
const MAP_FLOOR_RX = /\s*\(Lantai (\d+)\)$/;

type MapFootprint = { x0: number; z0: number; x1: number; z1: number; kind: 'bldg' | 'road' | 'ring' | 'path' };
// Footprint dalam koordinat dunia kampus (lihat game/world/CampusWorld.tsx).
const MAP_FOOTPRINTS: MapFootprint[] = [
  { x0: -16, z0: 4, x1: 16, z1: 28, kind: 'bldg' },      // gedung utama
  { x0: -4, z0: -2, x1: 4, z1: 4, kind: 'bldg' },        // tangga belakang
  { x0: 22, z0: 2, x1: 34, z1: 14, kind: 'bldg' },       // kantin
  { x0: 23, z0: 16, x1: 39, z1: 24, kind: 'bldg' },      // perpustakaan
  { x0: 24, z0: -16, x1: 44, z1: -2, kind: 'bldg' },     // gedung B
  { x0: -46, z0: -36, x1: -26, z1: -18, kind: 'bldg' },  // gudang tua
  { x0: 26, z0: 26, x1: 42, z1: 42, kind: 'bldg' },      // parkir
  { x0: -6, z0: -30, x1: 18, z1: -12, kind: 'bldg' },    // gang belakang
  { x0: -43, z0: 5, x1: -23, z1: 25, kind: 'ring' },     // lapangan
  { x0: -48, z0: 46, x1: 48, z1: 54, kind: 'road' },     // jalan depan
  { x0: -10, z0: 28, x1: 24, z1: 44, kind: 'path' },     // halaman utama
  { x0: 10.75, z0: 0.75, x1: 21.25, z1: 5.35, kind: 'path' }, // lorong kantin (v0.12.0)
];

export function MapPanel() {
  // zustand v5: object-literal selectors create a new snapshot every poll and
  // crash React with "Maximum update depth exceeded" — select primitives.
  const px = usePlayer((s) => s.x);
  const pz = usePlayer((s) => s.z);
  const facing = usePlayer((s) => s.facing);
  const sceneId = useGame((s) => s.scene);
  const visited = useGame((s) => s.visitedZones);
  const currentZone = useGame((s) => s.currentZone);
  const quests = useQuests((s) => s.quests);
  const def = SCENES[sceneId] ?? SCENES.campus;
  const b = def.bounds;

  const activeQuest = pickActiveQuest(quests);
  const target = activeQuest && sceneId === 'campus'
    ? questTargetFor(activeQuest, { visited, px, pz })
    : null;
  const targetDist = target ? Math.round(distanceToTarget(target, px, pz)) : 0;

  // scene-local coords → map panel coords (top = minZ / north)
  const toMap = (x: number, z: number): [string, string] => [
    `${50 + ((x - (b.minX + b.maxX) / 2) / (b.maxX - b.minX)) * 46}%`,
    `${50 + ((z - (b.minZ + b.maxZ) / 2) / (b.maxZ - b.minZ)) * 44}%`,
  ];

  // v0.12.0: blueprint layer — footprint gedung/jalan/jalur (kampus) supaya
  // overlay peta terbaca sebagai DENAH sekolah, bukan kumpulan titik lepas.
  // (feedback user: "ui/overlay map")
  const toRect = (f: MapFootprint) => {
    const [l, t] = toMap(f.x0, f.z0);
    const [r, bm] = toMap(f.x1, f.z1);
    return { left: l, top: t, width: `calc(${r} - ${l})`, height: `calc(${bm} - ${t})` };
  };

  // group zones that share a center so stacked floors don't overlap:
  // each extra member is offset vertically around the shared point
  const zoneGroups: { zone: (typeof def.zones)[number]; offset: number }[][] = [];
  const groupIndex = new Map<string, number>();
  def.zones.forEach((zone) => {
    const key = `${zone.center[0]}|${zone.center[1]}`;
    let gi = groupIndex.get(key);
    if (gi === undefined) {
      gi = zoneGroups.length;
      groupIndex.set(key, gi);
      zoneGroups.push([]);
    }
    zoneGroups[gi].push({ zone, offset: 0 });
  });
  zoneGroups.forEach((members) => {
    members.forEach((m, idx) => {
      m.offset = (idx - (members.length - 1) / 2) * 19; // px, ± around center
    });
  });

  const visitedInScene = def.zones.filter((z) => visited.includes(z.id)).length;
  // facing = atan2(dx, dz) (model forward +z) → compass clockwise from north(-z)
  const headingDeg = (Math.atan2(Math.sin(facing), -Math.cos(facing)) * 180) / Math.PI;

  return (
    <div className="map-wrap">
      <section className="map-panel panel-cut">
        <div className="map-head">
          <span className="mh-tag">MAP // {SCENE_TAG[sceneId] ?? 'GND'}</span>
          <b>{sceneId === 'campus' ? 'BLUEPRINT LINGKUNGAN SEKOLAH' : def.label.toUpperCase()}</b>
          <span className="right">
            <span className="chip">ZONA: {def.zones.length}</span>
            <span className="chip chip-cyan">DIKUNJUNGI: {visitedInScene}</span>
          </span>
        </div>
        <div className="map-grid">
          {activeQuest && <div className="map-objective">OBJEKTIF: {activeQuest.objective}</div>}
          {sceneId === 'campus' && MAP_FOOTPRINTS.map((f, i) => (
            <i key={`bp${i}`} className={`map-bp map-bp-${f.kind}`} style={toRect(f)} />
          ))}
          {zoneGroups.flat().map(({ zone, offset }) => {
            const [left, top] = toMap(zone.center[0], zone.center[1]);
            const fl = zone.label.match(MAP_FLOOR_RX);
            const name = zone.label.replace(MAP_FLOOR_RX, '');
            const isCurrent = zone.id === currentZone;
            const isTarget = target?.zoneId === zone.id;
            return (
              <span
                key={zone.id}
                className={`node ${visited.includes(zone.id) ? '' : 'unvisited'} ${isCurrent ? 'current' : ''} ${isTarget ? 'target' : ''}`}
                style={{ left, top, transform: `translate(-50%, calc(-50% + ${offset}px))` }}
              >
                {name.toUpperCase()}
                {fl && <em className="fl">L{fl[1]}</em>}
              </span>
            );
          })}
          {target && (
            <div className="map-target" style={{ left: toMap(target.pos[0], target.pos[1])[0], top: toMap(target.pos[0], target.pos[1])[1] }}>
              ◆ TUJUAN
            </div>
          )}
          <div className="map-player" style={{ left: toMap(px, pz)[0], top: toMap(px, pz)[1] }}>
            <i className="map-heading" style={{ transform: `rotate(${headingDeg}deg)` }} />
          </div>
        </div>
      </section>
      <aside className="map-side">
        <div className="panel-cut">
          <span className="ms-title">// TARGET AKTIF</span>
          <div className="ms-target">{activeQuest ? activeQuest.title : 'JELAJAHI SEKOLAH'}</div>
          {target && (
            <div className="ms-target-loc">{target.label.toUpperCase()} · {targetDist} M</div>
          )}
        </div>
        <div className="panel-cut">
          <span className="ms-title">// VEKTOR NAVIGASI</span>
          <div className="ms-row"><span>SCENE</span><b>{def.label.toUpperCase()}</b></div>
          <div className="ms-row"><span>POSISI REN</span><b>X {Math.round(px)} · Z {Math.round(pz)}</b></div>
          <div className="ms-row"><span>ZONA DIKUNJUNGI</span><b>{visitedInScene} / {def.zones.length}</b></div>
          {currentZone && <div className="ms-row"><span>SEDANG DI</span><b>{ZONE_BY_ID[currentZone]?.label.toUpperCase() ?? '—'}</b></div>}
        </div>
        <div className="panel-cut">
          <span className="ms-title">// LEGENDA</span>
          <div className="map-legend">
            <span className="chip chip-amber">POSISI REN</span>
            <span className="chip chip-amber">◆ TUJUAN MISI</span>
            <span className="chip chip-cyan">ZONA DIKUNJUNGI</span>
            <span className="chip">BELUM DIJELAJAH</span>
          </div>
        </div>
        {sceneId !== 'campus' && <p className="hint">Kembali ke kampus lewat pintu bertanda di scene ini.</p>}
      </aside>
    </div>
  );
}

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
    ['sensitivity', 'SENSITIVITAS KAMERA', 0.4, 2, 0.05],
    ['master', 'MASTER VOLUME', 0, 1, 0.05],
    ['music', 'MUSIC', 0, 1, 0.05],
    ['sfx', 'SFX', 0, 1, 0.05],
    ['ui', 'UI', 0, 1, 0.05],
    ['ambient', 'AMBIENT', 0, 1, 0.05],
    ['typewriterCps', 'KECEPATAN TEKS DIALOG', 10, 80, 2],
    ['subtitleScale', 'UKURAN SUBTITLE', 0.85, 1.5, 0.05],
  ];
  return (
    <div className="settings-panel">
      {/* v0.13.0: first-person / third-person camera mode */}
      <label>
        <span>MODE KAMERA</span>
        <select
          className="settings-select"
          value={s.camMode}
          onChange={(e) => s.set('camMode', e.target.value as typeof s.camMode)}
        >
          <option value="third">ORANG KETIGA (TPS)</option>
          <option value="first">ORANG PERTAMA (FPS)</option>
        </select>
      </label>
      {/* v0.9.0: graphics quality preset — applied live by GraphicsManager */}
      <label>
        <span>KUALITAS GRAFIK</span>
        <select
          className="settings-select"
          value={s.quality}
          onChange={(e) => s.set('quality', e.target.value as typeof s.quality)}
        >
          {(Object.keys(QUALITY_LABELS) as (keyof typeof QUALITY_LABELS)[]).map((q) => (
            <option key={q} value={q}>{QUALITY_LABELS[q]}</option>
          ))}
        </select>
      </label>
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
      <label><span>INVERT Y</span><input type="checkbox" checked={s.invertY} onChange={(e) => s.set('invertY', e.target.checked)} /></label>
      <label><span>REDUCED MOTION</span><input type="checkbox" checked={s.reducedMotion} onChange={(e) => s.set('reducedMotion', e.target.checked)} /></label>
      <label><span>SCREEN SHAKE</span><input type="checkbox" checked={s.screenShake} onChange={(e) => s.set('screenShake', e.target.checked)} /></label>
      <p>CONTROLS: WASD MOVE · SHIFT RUN · SPACE JUMP · MOUSE CAMERA · V FIRST/THIRD · WHEEL ZOOM · LMB ATTACK · Q HEAVY · RMB BLOCK · E INTERACT</p>
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
