import { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { ERAS, GOAL_LOC, game, type GameEvent } from '../game/engine';
import { DEF_LIST, DEFS, type Category } from '../game/defs';
import { SKILLS } from '../game/skills';
import { fmt, money, pct } from '../game/format';
import { Sprite } from '../sprites/Sprite';
import { effectText, targetText } from './GameNode';
import { useTick } from './hooks';
import { HINT } from './Hints';

// ------------------------------------------------------------------ HUD

export function Hud({ onTree }: { onTree: () => void }) {
  useTick(100);
  const s = game.s;
  const affordable = SKILLS.filter((k) => game.canBuySkill(k.id) && s.insight >= k.cost).length;
  // log-ish, but offset so the first few hundred lines don't fill a third of the bar
  const progress = Math.log10(1 + s.totalLoc / 1e4) / Math.log10(1 + GOAL_LOC / 1e4);
  const human = s.totalLoc > 0 ? s.humanLoc / s.totalLoc : 1;
  const debt = game.debt;
  if (!s.flags.uiHud)
    return s.flags.uiShop ? (
      <div className="hud mini" data-hint={HINT.cash}>
        <Stat icon="$" label="Cash" value={money(s.cash)} rate={`${money(s.cashRate)}/s`} cls="cash" />
      </div>
    ) : null;
  // pulse hard until the player has opened the tree a couple of times
  const pulse = affordable > 0 && s.skills.length <= 3;
  return (
    <div className={`hud ${s.flags.hudSeen ? '' : 'reveal'}`} onAnimationEnd={() => (s.flags.hudSeen = true)}>
      <div className="hud-era">
        <div className="era-label">ERA {s.era}</div>
        <div className="era-name">{ERAS[s.era].name}</div>
      </div>
      <Stat icon="$" label="Cash" value={money(s.cash)} rate={`${money(s.cashRate)}/s`} cls="cash" hint={HINT.cash} />
      <Stat icon="💡" label="Insight" value={fmt(s.insight)} rate={`${fmt(s.insightRate)}/s`} cls="insight" hint={HINT.insight} />
      <div className="hud-goal" data-hint={HINT.shipped}>
        <div className="hud-goal-top">
          <span>Shipped {fmt(s.totalLoc)} LOC</span>
          <span className="dim">{fmt(s.locRate)} LOC/s</span>
        </div>
        <div className="goal-bar">
          <div className="goal-fill" style={{ width: `${progress * 100}%` }} />
          <span className="goal-text">goal: 1B LOC</span>
        </div>
      </div>
      <Meter
        label="Tech debt"
        value={debt}
        title={`${pct(debt)} of recent code shipped unreviewed → producers ${pct(game.debtSlow)} slower and buggier. Route more code through review.`}
        text={game.debtSlow > 0.01 ? `🐌 producers -${pct(game.debtSlow)}` : 'all clear'}
        warn={game.debtSlow > 0.15}
        bad
      />
      <Meter label="Hand-written" value={human} title={HINT.human} />
      <button className={`btn tree-btn ${affordable ? 'glow' : ''} ${pulse ? 'pulse' : ''}`} onClick={onTree}>
        Skill Tree{affordable ? <span className="badge">{affordable}</span> : null}
      </button>
    </div>
  );
}

function Stat({ icon, label, value, rate, cls, hint }: { icon: string; label: string; value: string; rate: string; cls: string; hint?: string }) {
  return (
    <div className={`hud-stat ${cls}`} data-hint={hint}>
      <div className="hud-stat-label">
        {icon} {label}
      </div>
      <div className="hud-stat-value">{value}</div>
      <div className="hud-stat-rate">{rate}</div>
    </div>
  );
}

function Meter({ label, value, title, bad, text, warn }: { label: string; value: number; title: string; bad?: boolean; text?: string; warn?: boolean }) {
  if (text)
    return (
      <div className={`hud-meter ${warn ? 'warn' : ''}`} data-hint={title}>
        <div className="hud-stat-label">{label}</div>
        <div className={`meter ${bad ? 'bad' : ''}`}>
          <div className="meter-fill" style={{ width: `${Math.min(1, value) * 100}%` }} />
        </div>
        <div className="hud-stat-rate">{text}</div>
      </div>
    );
  return (
    <div className="hud-meter" data-hint={title}>
      <div className="hud-stat-label">{label}</div>
      <div className={`meter ${bad ? 'bad' : ''}`}>
        <div className="meter-fill" style={{ width: `${Math.min(1, value) * 100}%` }} />
      </div>
      <div className="hud-stat-rate">{value < 0.0001 && value > 0 ? '<0.01%' : value < 0.1 && value > 0 && !bad ? `${(value * 100).toFixed(2)}%` : pct(value)}</div>
    </div>
  );
}

// ------------------------------------------------------------------ Toolbox

const GROUPS: { cat: Category[]; label: string }[] = [
  { cat: ['producer'], label: 'Producers' },
  { cat: ['reviewer'], label: 'Reviewers' },
  { cat: ['booster', 'utility'], label: 'Boosters & Utility' },
];

export function Toolbox() {
  useTick(200);
  const rf = useReactFlow();
  const [open, setOpen] = useState(true);
  if (!game.s.flags.uiShop) return null;
  const buy = (type: string) => {
    const pos = rf.screenToFlowPosition({ x: window.innerWidth / 2 + 80, y: window.innerHeight / 2 });
    const jitter = () => (Math.random() - 0.5) * 120;
    game.buy(type, pos.x - 90 + jitter(), pos.y - 100 + jitter());
  };
  return (
    <div className={`toolbox ${open ? '' : 'closed'} ${game.s.flags.shopSeen ? '' : 'reveal'}`} onAnimationEnd={() => (game.s.flags.shopSeen = true)}>
      <button className="toolbox-toggle" onClick={() => setOpen(!open)}>
        {open ? '◀' : '▶ Shop'}
      </button>
      {open && (
        <div className="toolbox-scroll">
          {GROUPS.map((g) => {
            const all = DEF_LIST.filter((d) => g.cat.includes(d.category) && !d.unique);
            // show everything unlocked plus a single mystery teaser
            const firstLocked = all.find((d) => !game.isUnlocked(d.type));
            const items = all.filter((d) => game.isUnlocked(d.type) || d === firstLocked);
            return (
              <div key={g.label} className="tool-group">
                <div className="tool-group-label">{g.label}</div>
                {items.map((d) => {
                  if (!game.isUnlocked(d.type)) {
                    const sk = SKILLS.find((k) => k.unlock === d.type);
                    return (
                      <div key={d.type} className="tool locked" data-hint={sk ? `Unlock with the "${sk.name}" skill` : undefined}>
                        <div className="tool-sprite silhouette">
                          <Sprite id={d.sprite} scale={2.5} />
                        </div>
                        <div className="tool-body">
                          <div className="tool-name">???</div>
                          <div className="tool-meta">Skill: {sk?.name}</div>
                        </div>
                      </div>
                    );
                  }
                  const cost = game.cost(d.type);
                  const can = game.s.cash >= cost;
                  return (
                    <button key={d.type} className={`tool ${can ? '' : 'poor'}`} onClick={() => buy(d.type)} data-hint={d.flavor}>
                      <div className="tool-sprite">
                        <Sprite id={d.sprite} scale={2.5} />
                      </div>
                      <div className="tool-body">
                        <div className="tool-name">
                          {d.name} <span className="owned">×{game.count(d.type)}</span>
                        </div>
                        <div className="tool-meta">{blurb(d.type)}</div>
                        <div className="tool-cost">{money(cost)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      {open && (
        <div className="toolbox-help">
          Shop buys a new squad · <b>+1 Hire</b> on a card grows it
          <br />
          Click a cable → <b>✂</b> to unplug · drag a cable end to re-plug
        </div>
      )}
    </div>
  );
}

function blurb(type: string) {
  const d = DEFS[type];
  switch (d.category) {
    case 'producer':
      return (
        <>
          <span data-hint={HINT.loc}>{fmt((d.loc ?? 0) / (d.interval ?? 1))} LOC/s</span> ·{' '}
          <span data-hint={HINT.bugs}>🐞{((d.density ?? 0) * 100).toFixed(1)}</span>
          {d.token ? (
            <>
              {' '}· <span data-hint={HINT.tokens}>💸${fmt(d.token * game.g.token)}/PR</span>
            </>
          ) : null}
        </>
      );
    case 'reviewer':
      return (
        <>
          <span data-hint="Lines of code one reviewer can check per second.">{fmt(d.reviewSpeed ?? 0)} LOC/s</span> ·{' '}
          <span data-hint={HINT.catch}>🔍{pct(d.catchRate ?? 0)}</span>
        </>
      );
    case 'booster':
      return `${effectText(d)} → up to ${d.fanout} ${targetText(d)}${d.upkeep ? ` · $${d.upkeep}/s` : ''}`;
    case 'utility':
      return 'Splits risky / safe PRs';
    default:
      return '';
  }
}

// ------------------------------------------------------------------ Inspector

export function Inspector({ id }: { id: string | null }) {
  useTick(150);
  const n = id ? game.s.nodes[id] : null;
  if (!n) return null;
  const d = game.def(n);
  const st = game.stats(n.id);
  const refund = game.refund(n.id);
  return (
    <div className="inspector">
      <div className="insp-head">
        <Sprite id={d.sprite} scale={3} />
        <div>
          <div className="insp-name">{d.name}</div>
          <div className="insp-cat">
            {d.kind !== 'none' ? `${d.kind} ` : ''}
            {d.category}
          </div>
        </div>
      </div>
      <div className="insp-flavor">“{d.flavor}”</div>
      <div className="insp-rows">
        {st.locRate !== undefined && <Row k={d.category === 'reviewer' ? 'Review speed' : 'Output'} v={`${fmt(st.locRate)} LOC/s`} />}
        {st.density !== undefined && <Row k="Bugs" v={`${(st.density * 100).toFixed(2)} per 100 LOC`} />}
        {st.catchRate !== undefined && <Row k="Catches" v={pct(st.catchRate)} />}
        {st.token !== undefined && <Row k="Tokens" v={`$${fmt(st.token)} per PR`} />}
        {d.category === 'booster' && <Row k="Effect" v={`${effectText(d)} → ${targetText(d)}`} />}
        {d.category === 'booster' && <Row k="Powers" v={`up to ${d.fanout} node${d.fanout === 1 ? '' : 's'} (◆ cables)`} />}
        {d.upkeep && <Row k="Upkeep" v={`$${d.upkeep}/s while plugged in`} />}
        {st.value !== undefined && <Row k="Value" v={`$${st.value.toFixed(2)} per LOC`} />}
        {game.canHire(id!) && <Row k="Squad size" v={`${n.count} / ${game.teamCap(n.id)}`} />}
        {st.mod.sources.length > 0 && (
          <Row k="Boosted by" v={st.mod.sources.filter((s) => game.s.nodes[s]).map((s) => game.def(s).name).join(', ')} />
        )}
        {d.category === 'producer' && game.debtSlow > 0.01 && <Row k="Tech debt" v={`-${pct(game.debtSlow)} speed`} bad />}
      </div>
      {!d.unique && (
        <button className="btn sell" onClick={() => game.sell(n.id)}>
          {n.count > 1 ? 'Disband squad' : 'Sell'} for {money(refund)}
        </button>
      )}
    </div>
  );
}

function Row({ k, v, bad }: { k: string; v: string; bad?: boolean }) {
  return (
    <div className={`insp-row ${bad ? 'bad' : ''}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

// ------------------------------------------------------------------ Tips

function currentTip(): string | null {
  const s = game.s;
  const nodes = Object.values(s.nodes);
  const has = (t: string) => nodes.some((n) => n.type === t);
  const unplugged = nodes.find((n) => {
    const d = game.def(n);
    return d.category !== 'sink' && !s.edges.some((e) => e.source === n.id);
  });
  const producers = nodes.filter((n) => game.def(n).category === 'producer' && n.type !== 'you').length;
  if (game.g.youLevel > 0 && !s.edges.some((e) => e.source === 'you'))
    return "You've been promoted! Plug your ◆ jack into some AI nodes, then mash your keyboard to focus.";
  if (game.g.youLevel > 0 && s.focus < 0.1 && s.time % 60 < 8) return 'Mash your keyboard: Focus amplifies your boost on the agents you lead.';
  if (s.totalLoc === 0) return 'Click on You (or just mash your keyboard) to write some code.';
  if (!producers && s.cash < 15) return 'Every PR that reaches Production earns cash. Keep typing!';
  if (!producers) return 'Buy a Junior Dev from the shop on the left. They write code on their own.';
  if (unplugged) return `Drag from ${game.def(unplugged).name}'s right-hand jack to plug it into something.`;
  if (game.g.rsi && game.debt < 0.5)
    return 'The Swarm is improving faster than anything can review it. You could… just plug it straight into Production?';
  if (s.incidents > 0 && s.era === 1 && !has('senior')) return 'Bugs that reach Production cause incidents. Put a Senior Engineer between your devs and Production.';
  if (game.debt > 0.3 && s.era === 1 && has('senior'))
    return '🐌 Tech debt is rising: code that skips review slows everyone down. Route your devs through the Senior Engineer.';
  if (s.skills.length === 1 && s.insight >= 3) return '💡 Insight comes from catching bugs (and from incidents). Spend it in the Skill Tree (top right)!';
  if (s.skills.length === 1 && s.era === 1) return 'Reviewers turn caught bugs into 💡 Insight, which you spend in the Skill Tree.';
  if (game.debt > 0.4) return 'Lots of unreviewed code means tech debt, which slows every producer. Route more through review.';
  if (s.era === 3 && !has('chatbot')) return 'Chat Assistants cost tokens per PR. Keep some cash in the bank, or they stall.';
  const router = nodes.find((n) => n.type === 'router');
  if (router && new Set(s.edges.filter((e) => e.source === router.id).map((e) => e.sourceHandle)).size < 2) return 'Triage Bot: send risky PRs through heavy review and let safe ones take the fast lane.';
  return null;
}

export function Tip() {
  useTick(500);
  const tip = currentTip();
  if (!tip) return null;
  return <div className="tip">{tip}</div>;
}

// ------------------------------------------------------------------ Toasts & banners

interface Toast {
  id: number;
  e: GameEvent;
}

let toastId = 0;

export function Toasts({ extra }: { extra: Toast[] }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [era, setEra] = useState<number | null>(null);
  const [promo, setPromo] = useState<number | null>(null);
  useEffect(
    () =>
      game.onEvent((e) => {
        if (e.kind === 'era') {
          setEra(e.era);
          setTimeout(() => setEra(null), 3500);
          return;
        }
        if (e.kind === 'promo') {
          setPromo(e.level);
          setTimeout(() => setPromo(null), 3500);
          return;
        }
        if (e.kind === 'win') return;
        const t = { id: toastId++, e };
        setToasts((ts) => [...ts.slice(-3), t]);
        setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), e.kind === 'incident' ? 6000 : 3000);
      }),
    [],
  );
  const all = [...toasts, ...extra];
  return (
    <>
      <div className="toasts">
        {all.map(({ id, e }) =>
          e.kind === 'incident' ? (
            <div key={id} className="toast incident">
              <div className="toast-title">🔥 INCIDENT #{game.s.incidents}</div>
              <div className="toast-body">{e.text}</div>
              <div className="toast-foot">
                {fmt(e.bugs)} bugs · -{money(e.cost)} · +{fmt(e.insight)} 💡 postmortem
              </div>
            </div>
          ) : e.kind === 'toast' ? (
            <div key={id} className={`toast ${e.text.startsWith('🐌') ? 'debt' : ''}`}>
              {e.text}
            </div>
          ) : null,
        )}
      </div>
      {era !== null && (
        <div className="era-banner" key={era}>
          <div className="era-banner-small">ERA {era}</div>
          <div className="era-banner-name">{ERAS[era].name}</div>
          <div className="era-banner-tag">{ERAS[era].tag}</div>
        </div>
      )}
      {promo !== null && (
        <div className="era-banner promo" key={`p${promo}`}>
          <div className="era-banner-small">PROMOTED</div>
          <div className="era-banner-name">{PROMOS[promo][0]}</div>
          <div className="era-banner-tag">{PROMOS[promo][1]}</div>
        </div>
      )}
    </>
  );
}

const PROMOS = [
  ['', ''],
  ['Tech Lead', 'You no longer write code. Plug yourself into some agents, then mash keys to focus.'],
  ['Staff Engineer', 'You can now boost 4 AI nodes. Your calendar weeps.'],
  ['Distinguished Engineer', 'You can now boost 8 AI nodes. Nobody knows what you do. It works.'],
];

export function newToast(text: string): Toast {
  return { id: toastId++, e: { kind: 'toast', text } };
}
