import { useEffect, useMemo, useRef, useState } from 'react';
import { useDialogue } from '../stores/dialogueStore';
import { useGame } from '../stores/gameStore';
import { useSettings } from '../stores/settingsStore';
import { useStory } from '../stores/storyStore';
import { useSocial } from '../stores/socialStore';
import { useQuests } from '../stores/questStore';
import { useStats } from '../stores/statsStore';
import { usePlayer } from '../stores/playerStore';
import { getDialogue } from '../data/dialogue';
import { NPC_BY_ID } from '../data/npcs';
import { ZONE_BY_ID } from '../data/world';
import { evalCondition, type ConditionContext } from '../game/systems/conditions';
import { NODE_FX } from '../data/chapters';
import { requestShake } from '../game/runtime';
import { audio } from '../game/audio';

const PORTRAIT_COLORS: Record<string, string> = {
  ren: '#38bdf8',
  narrator: '#64748b',
  bully: '#78716c',
  gang: '#b45309',
  generic: '#94a3b8',
};

export function DialogueUI({ cinematic }: { cinematic: boolean }) {
  const nodeId = useDialogue((s) => s.nodeId);
  const awaitingChoice = useDialogue((s) => s.awaitingChoice);
  const advance = useDialogue((s) => s.advance);
  const choose = useDialogue((s) => s.choose);
  const zone = useGame((s) => s.currentZone);
  const hp = usePlayer((s) => s.hp);
  const maxHp = usePlayer((s) => s.maxHp);
  const node = nodeId ? getDialogue(nodeId) : undefined;
  const [shown, setShown] = useState(0);
  const cps = useSettings((s) => s.typewriterCps);
  const typing = useRef<number | null>(null);

  const text = node?.text ?? '';
  useEffect(() => {
    setShown(0);
    if (!text) return;
    let raf = 0;
    const start = performance.now();
    const step = () => {
      const n = Math.floor(((performance.now() - start) / 1000) * cps);
      setShown(Math.min(text.length, n));
      if (n % 3 === 0) audio.blip();
      if (n < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, cps]);

  // BUG-FIX: NODE_FX — fire fade/shake transitions when entering specific nodes.
  // Previously NODE_FX data in chapters.ts was dead (nothing read it). Now we
  // trigger camera shake + fade overlay when the dialogue node matches.
  useEffect(() => {
    if (!nodeId) return;
    const fx = NODE_FX[nodeId];
    if (!fx) return;
    const game = useGame.getState();
    if (fx.fx === 'shake') {
      requestShake(0.5);
    } else if (fx.fx === 'fade-out') {
      game.setFade('out');
      setTimeout(() => game.setFade('none'), 600);
    } else if (fx.fx === 'fade-in') {
      game.setFade('in');
      setTimeout(() => game.setFade('none'), 600);
    }
    // 'fp-to-tp' is handled by CameraRig via opening_complete flag, skip here
  }, [nodeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (shown < text.length) setShown(text.length);
        else if (!awaitingChoice) advance();
      }
      if (awaitingChoice && /^Digit[12]$/.test(e.code)) {
        const c = visibleChoices[Number(e.code.slice(5)) - 1];
        if (c) { audio.click(); choose(c); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // choice visibility conditions evaluated against live state
  const visibleChoices = useMemo(() => {
    if (!node?.choices) return [];
    const story = useStory.getState();
    const ctx: ConditionContext = {
      flags: story.flags,
      chapter: story.chapter,
      route: story.route,
      quests: useQuests.getState().quests,
      relationships: useSocial.getState().relationships,
      stats: useStats.getState(),
      focus: usePlayer.getState().focus,
    };
    return node.choices.filter((c) => evalCondition(c.condition, ctx));
  }, [node, awaitingChoice]);

  if (!node) return null;
  const speaker = node.speaker;
  const portraitKey = node.portrait ?? 'generic';
  const color = PORTRAIT_COLORS[portraitKey] ?? NPC_BY_ID[portraitKey]?.color ?? '#94a3b8';
  const role = NPC_BY_ID[portraitKey]?.role ?? (speaker === 'NARATOR' ? 'NARASI' : 'SMA YUSON');
  const initial = speaker === 'NARATOR' ? '◆' : speaker[0];

  return (
    <div className={`cinematic ${cinematic ? 'is-cinematic' : ''}`} onClick={() => (shown < text.length ? setShown(text.length) : !awaitingChoice && advance())}>
      {!cinematic && <div className="camera-tag">REN</div>}
      {!cinematic && (
        <div className="dlg-vitals">
          <div className="vitals-head"><b>REN</b><span>KELAS X-C</span></div>
          <div className="meter">
            <div><span>HP</span><b>{Math.round(hp)} / {maxHp}</b></div>
            <i><b className="red" style={{ width: `${(hp / maxHp) * 100}%` }} /></i>
          </div>
        </div>
      )}
      {zone && <div className="dlg-loc">{ZONE_BY_ID[zone]?.label ?? ''}</div>}
      <div className="dialogue-box brackets">
        <div className="dlg-head">
          <span className="portrait" style={{ background: color }}>{initial}</span>
          <span className="speaker">{speaker}</span>
          <span className="chip dlg-tag">{role.toUpperCase()}</span>
        </div>
        <p>{text.slice(0, shown)}{shown < text.length ? '▌' : ''}</p>
        {!awaitingChoice ? (
          shown >= text.length && <button className="dlg-next">LANJUT ▸</button>
        ) : (
          <div className="choices">
            {visibleChoices.map((c, i) => (
              <button key={c.id} onClick={(e) => { e.stopPropagation(); audio.click(); choose(c); }}>
                <kbd>[{i + 1}]</kbd> {c.text.replace(/^\[[AB]\]\s*/, '')}
              </button>
            ))}
          </div>
        )}
        <div className="dlg-hints">
          <span><kbd>SPASI</kbd> LANJUT</span>
          {awaitingChoice && <span><kbd>1-{visibleChoices.length}</kbd> PILIH JAWABAN</span>}
        </div>
      </div>
      {cinematic && <div className="skip-hint">KLIK / SPASI UNTUK LANJUT</div>}
    </div>
  );
}
