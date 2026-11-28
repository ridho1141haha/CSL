import { useMemo, useState } from 'react';
import { useGame } from '../../stores/gameStore';
import { usePlayer } from '../../stores/playerStore';
import { useStats } from '../../stores/statsStore';
import { useStory } from '../../stores/storyStore';
import { useSocial } from '../../stores/socialStore';
import { useQuests } from '../../stores/questStore';
import { NPCS } from '../../data/npcs';
import { ZONE_BY_ID } from '../../data/world';
import { HIDDEN_EVENTS } from '../../data/hiddenEvents';
import { isDiscovered, HIDDEN_EVENT_COUNT } from '../../game/systems/hiddenEvents';
import { relLabel } from '../../game/systems/relationship';
import { clockLabel, DAYS, formatHhmm, periodFor } from '../../game/systems/time';
import { pickActiveQuest } from '../../game/waypoint';
import { audio } from '../../game/audio';

type PhoneApp = 'home' | 'messages' | 'contacts' | 'schedule' | 'notes';

type PhoneThread = {
  id: string;
  from: string;
  role: string;
  color: string;
  time: string;
  unread: boolean;
  unknown?: boolean;
  preview: string;
  bubbles: { sender: 'them' | 'me'; text: string; time: string }[];
};

const SCHOOL_TIMETABLE = [
  { time: '07:00', min: 420, end: 480, title: 'Kedatangan & Apel Pagi', loc: 'Gerbang / Halaman Utama' },
  { time: '08:00', min: 480, end: 600, title: 'Jam Pelajaran I', loc: 'Kelas X-C · Gedung Utama' },
  { time: '10:00', min: 600, end: 720, title: 'Istirahat Pertama', loc: 'Kantin / Perpustakaan' },
  { time: '12:00', min: 720, end: 840, title: 'Istirahat Makan Siang', loc: 'Kantin & Koridor Tengah' },
  { time: '14:00', min: 840, end: 960, title: 'Bel Pulang & Ekskul', loc: 'Area Kampus SMA Yuson' },
];

function buildStoryThreads(chapter: number, route: string | null, flags: string[]): PhoneThread[] {
  const sitiBubbles: PhoneThread['bubbles'] = [
    { sender: 'them', text: 'Pagi Ren, sudah sampai sekolah?', time: '07:10' },
    { sender: 'me', text: 'Baru masuk gerbang. Ada apa?', time: '07:11' },
    { sender: 'them', text: 'Jangan lupa formulir OSIS kalau kamu yang bawa.', time: '07:12' },
  ];
  if (chapter >= 2) {
    sitiBubbles.push({
      sender: 'them',
      text: 'Ren, anak-anak Bimo lagi sering nongkrong dekat tangga belakang. Hati-hati ya.',
      time: '10:15',
    });
  }
  if (chapter >= 3 && route === 'resistance') {
    sitiBubbles.push({
      sender: 'them',
      text: 'Aku sudah siapin rekaman & saksi OSIS. Kalau jadi naik ke atap, kabari aku.',
      time: '13:40',
    });
  }

  const arisBubbles: PhoneThread['bubbles'] = [
    { sender: 'them', text: 'Ren, buku catatan aku titipin ya kalau ada kuis.', time: '06:58' },
    { sender: 'me', text: 'Aman, nanti aku bawa ke kelas.', time: '06:59' },
  ];
  if (flags.includes('pts_quiz_done')) {
    arisBubbles.push({
      sender: 'them',
      text: 'Gila sih PTS tadi. Makasih ya udah bantu belajar bareng!',
      time: '11:20',
    });
  }
  if (chapter >= 2) {
    arisBubbles.push({
      sender: 'them',
      text: 'Ren… kalau aku nggak balas di jam istirahat, cek koridor tangga belakang.',
      time: '12:08',
    });
  }

  const unknownBubbles: PhoneThread['bubbles'] = [
    { sender: 'them', text: 'Kami melihatmu di gerbang. Hati-hati di jalan pulang.', time: '06:46' },
  ];
  if (chapter >= 2) {
    unknownBubbles.push({
      sender: 'them',
      text: 'Anak baru seharusnya tahu batas. Jangan ikut campur urusan kelas X-C.',
      time: '12:45',
    });
  }
  if (chapter >= 3) {
    unknownBubbles.push({
      sender: 'them',
      text: route === 'bad'
        ? 'Pilihan bagus. Temui kami di belakang sekolah nanti.'
        : 'Atap sekolah. Pulang sekolah nanti. Sendirian.',
      time: '14:02',
    });
  }

  const threads: PhoneThread[] = [
    {
      id: 'siti',
      from: 'Siti',
      role: 'Sekretaris OSIS',
      color: '#10b981',
      time: sitiBubbles[sitiBubbles.length - 1].time,
      unread: true,
      preview: sitiBubbles[sitiBubbles.length - 1].text,
      bubbles: sitiBubbles,
    },
    {
      id: 'aris',
      from: 'Aris',
      role: 'Teman Sekelas X-C',
      color: '#3b82f6',
      time: arisBubbles[arisBubbles.length - 1].time,
      unread: true,
      preview: arisBubbles[arisBubbles.length - 1].text,
      bubbles: arisBubbles,
    },
    {
      id: 'unknown',
      from: 'UNKNOWN',
      role: 'Nomor Tidak Dikenal',
      color: '#ef4444',
      time: unknownBubbles[unknownBubbles.length - 1].time,
      unread: true,
      unknown: true,
      preview: unknownBubbles[unknownBubbles.length - 1].text,
      bubbles: unknownBubbles,
    },
  ];

  if (chapter >= 2) {
    threads.push({
      id: 'budi',
      from: 'Pak Budi',
      role: 'Wali Kelas X-C',
      color: '#0ea5e9',
      time: '09:30',
      unread: chapter >= 2 && !flags.includes('pts_quiz_done'),
      preview: 'Ren, pastikan persiapan PTS aman. Kalau ada kendala di sekolah, lapor ke Bapak.',
      bubbles: [
        {
          sender: 'them',
          text: 'Ren, pastikan persiapan PTS aman. Kalau ada kendala di sekolah, lapor ke Bapak.',
          time: '09:30',
        },
      ],
    });
  }

  return threads;
}

export function PhonePanel() {
  const [app, setApp] = useState<PhoneApp>('home');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const clock = useGame((s) => s.clock);
  const zone = useGame((s) => s.currentZone);
  const hp = usePlayer((s) => Math.round(s.hp));
  const maxHp = usePlayer((s) => s.maxHp);
  const focus = usePlayer((s) => Math.round(s.focus));
  const academic = useStats((s) => s.academic);
  const chapter = useStory((s) => s.chapter);
  const route = useStory((s) => s.route);
  const flags = useStory((s) => s.flags);
  const relationships = useSocial((s) => s.relationships);
  const quests = useQuests((s) => s.quests);

  const threads = useMemo(
    () => buildStoryThreads(chapter, route, flags),
    [chapter, route, flags],
  );

  const periodInfo = periodFor(clock.minutes);
  const periodText = clockLabel(clock);
  const activeQuest = pickActiveQuest(quests);
  const discoveredCount = HIDDEN_EVENTS.filter((e) => isDiscovered(e)).length;
  const unreadCount = threads.filter((t) => t.unread && !readIds[t.id]).length;
  const activeThread = threadId ? threads.find((t) => t.id === threadId) ?? null : null;

  const openApp = (next: PhoneApp) => {
    audio.click();
    setApp(next);
    if (next !== 'messages') setThreadId(null);
  };

  const openThread = (id: string) => {
    audio.click();
    setThreadId(id);
    setReadIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="phone-stage">
      <div className="phone-device">
        <span className="ph-hw-btn ph-vol-up" aria-hidden="true" />
        <span className="ph-hw-btn ph-vol-dn" aria-hidden="true" />
        <span className="ph-hw-btn ph-power" aria-hidden="true" />

        <div className="phone-screen">
          <div className="ph-statusbar">
            <span className="ph-sb-time">{formatHhmm(clock.minutes)}</span>
            <div className="ph-island" aria-hidden="true">
              <span className="ph-speaker" />
              <span className="ph-cam" />
            </div>
            <div className="ph-sb-icons">
              <span className="ph-sig" aria-hidden="true"><i /><i /><i /><i /></span>
              <span className="ph-net">5G</span>
              <span className="ph-bat" aria-label="Baterai 84%"><b><i>84</i></b></span>
            </div>
          </div>

          <div className="ph-viewport">
            {app === 'home' && (
              <div className="ph-home">
                <div className="ph-hero-clock">
                  <span className="ph-date-pill">{DAYS[clock.day].toUpperCase()} · {periodInfo.label.toUpperCase()}</span>
                  <div className="ph-big-time">{formatHhmm(clock.minutes)}</div>
                  <div className="ph-loc-line">
                    <span className="ph-dot" />
                    {zone ? (ZONE_BY_ID[zone]?.label ?? 'SMA Yuson') : 'SMA Yuson'}
                  </div>
                </div>

                <div className="ph-widget">
                  <div className="ph-widget-head">
                    <span>YUSON ID // REN · BAB {chapter}</span>
                    <b>X-C</b>
                  </div>
                  <div className="ph-widget-stats">
                    <div><span>HP</span><b className="c-red">{hp}/{maxHp}</b></div>
                    <div><span>FOKUS</span><b className="c-amber">{focus}</b></div>
                    <div><span>AKADEMIK</span><b className="c-cyan">{academic}</b></div>
                  </div>
                  {activeQuest && (
                    <div className="ph-widget-quest">
                      <span>AGENDA:</span> {activeQuest.title}
                    </div>
                  )}
                </div>

                <div className="ph-app-grid">
                  <button type="button" className="ph-app-tile" onClick={() => openApp('messages')}>
                    <span className="ph-app-ico ico-msg">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      {unreadCount > 0 && <em className="ph-badge">{unreadCount}</em>}
                    </span>
                    <small>Pesan</small>
                  </button>
                  <button type="button" className="ph-app-tile" onClick={() => openApp('contacts')}>
                    <span className="ph-app-ico ico-cnt">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </span>
                    <small>Kontak</small>
                  </button>
                  <button type="button" className="ph-app-tile" onClick={() => openApp('schedule')}>
                    <span className="ph-app-ico ico-sch">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </span>
                    <small>Jadwal</small>
                  </button>
                  <button type="button" className="ph-app-tile" onClick={() => openApp('notes')}>
                    <span className="ph-app-ico ico-not">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>
                    </span>
                    <small>Catatan</small>
                  </button>
                </div>
              </div>
            )}

            {app === 'messages' && !activeThread && (
              <div className="ph-app-view">
                <div className="ph-app-bar">
                  <button type="button" className="ph-back" onClick={() => openApp('home')}>‹</button>
                  <strong>Pesan</strong>
                  <span className="ph-bar-meta">{unreadCount} BARU</span>
                </div>
                <div className="ph-list">
                  {threads.map((t) => {
                    const isUnread = t.unread && !readIds[t.id];
                    return (
                      <button
                        type="button"
                        key={t.id}
                        className={`ph-chat-item ${t.unknown ? 'is-unknown' : ''}`}
                        onClick={() => openThread(t.id)}
                      >
                        <span className="ph-av" style={{ background: t.color }}>
                          {t.unknown ? '?' : t.from[0]}
                        </span>
                        <div className="ph-chat-meta">
                          <div className="ph-chat-top">
                            <b>{t.from}</b>
                            <small>{t.time}</small>
                          </div>
                          <p>{t.preview}</p>
                        </div>
                        {isUnread && <span className="ph-unread-dot" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {app === 'messages' && activeThread && (
              <div className="ph-app-view ph-thread-view">
                <div className="ph-app-bar">
                  <button type="button" className="ph-back" onClick={() => { audio.click(); setThreadId(null); }}>‹</button>
                  <span className="ph-av sm" style={{ background: activeThread.color }}>
                    {activeThread.unknown ? '?' : activeThread.from[0]}
                  </span>
                  <div className="ph-thread-head">
                    <strong>{activeThread.from}</strong>
                    <small>{activeThread.role}</small>
                  </div>
                </div>
                {activeThread.unknown && (
                  <div className="ph-warn-strip">NOMOR TIDAK DIKENAL · HATI-HATI</div>
                )}
                <div className="ph-bubbles">
                  {activeThread.bubbles.map((b, idx) => (
                    <div key={idx} className={`ph-bubble ${b.sender === 'me' ? 'out' : 'in'}`}>
                      <p>{b.text}</p>
                      <time>{b.time}</time>
                    </div>
                  ))}
                </div>
                <div className="ph-composer" aria-hidden="true">
                  <span>Tidak dapat membalas sekarang…</span>
                </div>
              </div>
            )}

            {app === 'contacts' && (
              <div className="ph-app-view">
                <div className="ph-app-bar">
                  <button type="button" className="ph-back" onClick={() => openApp('home')}>‹</button>
                  <strong>Kontak</strong>
                  <span className="ph-bar-meta">{NPCS.length} ORANG</span>
                </div>
                <div className="ph-list">
                  {NPCS.map((n) => {
                    const rel = relationships[n.id] ?? 0;
                    const hasChat = threads.some((t) => t.id === n.id);
                    return (
                      <div className="ph-contact-row" key={n.id}>
                        <span className="ph-av" style={{ background: n.color }}>{n.name[0]}</span>
                        <div className="ph-contact-info">
                          <b>{n.name}</b>
                          <small>{n.role}</small>
                        </div>
                        <span className={`ph-rel-pill ${rel < -10 ? 'hostile' : rel >= 40 ? 'warm' : ''}`}>
                          {relLabel(rel)}
                        </span>
                        {hasChat && (
                          <button
                            type="button"
                            className="ph-mini-chat"
                            onClick={() => { setApp('messages'); openThread(n.id); }}
                            title="Buka pesan"
                          >
                            MSG
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {app === 'schedule' && (
              <div className="ph-app-view">
                <div className="ph-app-bar">
                  <button type="button" className="ph-back" onClick={() => openApp('home')}>‹</button>
                  <strong>Jadwal</strong>
                  <span className="ph-bar-meta">{DAYS[clock.day].toUpperCase()}</span>
                </div>
                <div className="ph-sch-now">
                  <span>SEKARANG</span>
                  <b>{periodText}</b>
                </div>
                <div className="ph-timeline">
                  {SCHOOL_TIMETABLE.map((slot) => {
                    const active = clock.minutes >= slot.min && clock.minutes < slot.end;
                    return (
                      <div key={slot.time} className={`ph-tl-row ${active ? 'active' : ''}`}>
                        <span className="ph-tl-time">{slot.time}</span>
                        <div className="ph-tl-card">
                          <b>{slot.title}</b>
                          <small>{slot.loc}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {app === 'notes' && (
              <div className="ph-app-view">
                <div className="ph-app-bar">
                  <button type="button" className="ph-back" onClick={() => openApp('home')}>‹</button>
                  <strong>Catatan</strong>
                  <span className="ph-bar-meta">2 ARSIP</span>
                </div>
                <div className="ph-notes-wrap">
                  <article className="ph-note-card pinned">
                    <div className="ph-note-head">
                      <b>ATURAN BERTAHAN</b>
                      <span>DISEMATKAN</span>
                    </div>
                    <ul>
                      <li>Jaga nilai akademik tetap aman.</li>
                      <li>Jangan lewat gang belakang sendirian.</li>
                      <li className="ph-note-warn">Jangan ikut campur. <em>(garis bawah dua kali)</em></li>
                    </ul>
                  </article>
                  <article className="ph-note-card">
                    <div className="ph-note-head">
                      <b>ARSIP TEMUAN</b>
                      <span>{discoveredCount}/{HIDDEN_EVENT_COUNT}</span>
                    </div>
                    <p>
                      {discoveredCount > 0
                        ? `Ren mencatat ${discoveredCount} kejadian janggal di sekitar SMA Yuson.`
                        : 'Belum ada catatan temuan baru. Perhatikan sekitar sekolah.'}
                    </p>
                  </article>
                </div>
              </div>
            )}
          </div>

          <nav className="ph-dock" aria-label="Navigasi Ponsel">
            <button type="button" className={app === 'home' ? 'active' : ''} onClick={() => openApp('home')}>HOME</button>
            <button type="button" className={app === 'messages' ? 'active' : ''} onClick={() => openApp('messages')}>
              PESAN{unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
            <button type="button" className={app === 'contacts' ? 'active' : ''} onClick={() => openApp('contacts')}>KONTAK</button>
            <button type="button" className={app === 'schedule' ? 'active' : ''} onClick={() => openApp('schedule')}>JADWAL</button>
            <button type="button" className={app === 'notes' ? 'active' : ''} onClick={() => openApp('notes')}>CATATAN</button>
          </nav>

          <button
            type="button"
            className="ph-homebar"
            onClick={() => openApp('home')}
            aria-label="Kembali ke Layar Utama Ponsel"
          >
            <span />
          </button>
        </div>
      </div>
    </div>
  );
}
