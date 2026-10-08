import { useEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals, type NodeProps } from '@xyflow/react';
import { CLICKS_PER_PR, game } from '../game/engine';
import { acceptsFlow, acceptsMods, emitsFlow, type NodeDef } from '../game/defs';
import { fmt, pct } from '../game/format';
import { Sprite, spriteFrame } from '../sprites/Sprite';
import { useTick } from './hooks';
import { HINT } from './Hints';

const FIRE = { g: '#ef4444', a: '#f97316', b: '#ef4444', R: '#7f1d1d' };

export function effectText(d: NodeDef) {
  const e = d.effect ?? {};
  const parts: string[] = [];
  if (e.speed) parts.push(`${e.speed}× speed`);
  if (e.bugs) parts.push(e.bugs < 1 ? `-${Math.round((1 - e.bugs) * 100)}% bugs` : `+${Math.round((e.bugs - 1) * 100)}% bugs`);
  if (e.catch) parts.push(`+${Math.round(e.catch * 100)}% catch`);
  if (e.value) parts.push(`${e.value}× value`);
  return parts.join(' · ');
}

export function targetText(d: NodeDef) {
  if (d.targetCats?.includes('sink')) return 'Production';
  const who = d.targetKinds?.includes('ai') ? 'AI' : 'human';
  const what = d.targetCats?.length === 2 ? 'producers & reviewers' : `${d.targetCats?.[0]}s`;
  return `${who} ${what}`;
}

function bubbleFor(id: string): string | null {
  const s = game.s;
  const n = s.nodes[id];
  const d = game.def(n);
  const hasOut = s.edges.some((e) => e.source === id);
  const hasIn = s.edges.some((e) => e.target === id && e.kind === 'flow');
  switch (d.category) {
    case 'producer':
      if (n.status === 'broke') return 'Out of tokens!';
      if (n.held) return hasOut ? 'Waiting on review…' : 'Plug me into something!';
      if (d.manual && s.totalLoc < 40 && n.status === 'idle') return 'Click me!';
      return null;
    case 'reviewer':
    case 'utility':
      if (n.held) return hasOut ? 'Downstream is full…' : 'Where does this go?';
      if (!hasIn) return 'zzz';
      return null;
    case 'booster':
      if (id === 'you' && n.status === 'off') return 'Plug me into some agents!';
      if (id === 'you' && s.focus < 0.15) return 'Mash keys to focus!';
      if (n.status === 'off') return 'Plug my ◆ in!';
      if (n.status === 'broke') return "Can't pay upkeep!";
      return null;
    case 'sink':
      if (s.time - s.lastIncident < 2) return 'INCIDENT!';
      return null;
  }
}

export function GameNode({ id, selected }: NodeProps) {
  useTick(100);
  const updateInternals = useUpdateNodeInternals();
  const n = game.s.nodes[id];
  const d = n ? game.def(n) : null;
  // You's jacks change when promoted
  useEffect(() => updateInternals(id), [d?.type, id, updateInternals]);
  if (!n || !d) return null;
  const isYouBoost = id === 'you' && d.category === 'booster';
  const st = game.stats(id);
  const onFire = d.category === 'sink' && game.s.time - game.s.lastIncident < 2;
  const animate = (isYouBoost ? game.s.focus > 0.05 : n.status === 'busy') || d.category === 'sink';
  const frame = spriteFrame(d.sprite, game.s.time + id.length * 0.37, animate);
  const bubble = bubbleFor(id);

  let progress = 0;
  if (d.manual) progress = n.held ? 1 : n.prog / CLICKS_PER_PR;
  else if (d.category === 'producer') progress = n.held ? 1 : Math.min(1, n.prog);
  else if (d.category === 'reviewer' && n.cur) progress = Math.min(1, n.curProg / Math.max(1, n.cur.loc));

  const modsUsed = game.s.edges.filter((e) => e.kind === 'mod' && e.source === id).length;
  const floaters = d.category === 'sink' ? game.floaters.filter((f) => f.node === id) : [];

  return (
    <div className={`gnode cat-${d.category} st-${n.status} ${selected ? 'sel' : ''} ${onFire ? 'on-fire' : ''}`}>
      <div className="gnode-title">
        <span>{d.name}</span>
        {game.canHire(id) && <span className="headcount">×{n.count}</span>}
      </div>
      <div
        className={`gnode-stage ${d.manual || isYouBoost ? 'clickable' : ''}`}
        onClick={d.manual || isYouBoost ? () => game.click(id) : undefined}
      >
        <Sprite id={d.sprite} scale={4} frame={frame} palette={onFire ? FIRE : undefined} className={d.sprite === 'ci' && animate ? 'spin' : ''} />
        {bubble && <div className={`bubble ${n.status === 'broke' || onFire ? 'bad' : ''}`}>{bubble}</div>}
        {floaters.map((f) => (
          <div key={f.id} className={`floater ${f.bad ? 'bad' : ''}`}>
            {f.text}
          </div>
        ))}
        {onFire && <div className="flames" />}
      </div>

      {(d.category === 'producer' || d.category === 'reviewer') && (
        <div className="bar">
          <div className="bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {isYouBoost && (
        <div className="bar focus" data-hint={HINT.focus}>
          <div className="bar-fill" style={{ width: `${game.s.focus * 100}%` }} />
          <span>FOCUS ×{(1 + 0.6 * game.s.focus).toFixed(1)}</span>
        </div>
      )}

      <div className="gnode-stats">
        {d.category === 'producer' && (
          <>
            <span data-hint={d.manual ? 'Click (or mash keys) to type. Every few clicks makes a PR.' : HINT.loc}>
              {d.manual ? `${d.loc} LOC / ${CLICKS_PER_PR} clicks` : `${fmt(st.locRate ?? 0)} LOC/s`}
            </span>
            <span data-hint={HINT.bugs}>🐞 {((st.density ?? 0) * 100).toFixed(1)}</span>
            {st.token ? <span data-hint={HINT.tokens}>💸 ${fmt(st.token)}</span> : null}
            {game.debtSlow > 0.05 && (
              <span className="debt-badge" data-hint={HINT.debt}>
                🐌 -{Math.round(game.debtSlow * 100)}%
              </span>
            )}
          </>
        )}
        {d.category === 'reviewer' && (
          <>
            <span data-hint="Lines of code this squad can review per second.">{fmt(st.locRate ?? 0)} LOC/s</span>
            <span data-hint={HINT.catch}>🔍 {pct(st.catchRate ?? 0)}</span>
            <span className="queue" data-hint={HINT.queue}>
              {Array.from({ length: d.queueCap ?? 3 }, (_, i) => (
                <i key={i} className={i < n.queue.length ? 'full' : ''} />
              ))}
            </span>
          </>
        )}
        {d.category === 'booster' && (
          <>
            <span>{effectText(d)}</span>
            <span data-hint={HINT.boost}>
              ◆ powering {modsUsed}/{d.fanout}
            </span>
            {d.upkeep ? <span data-hint="Upkeep: $ per second while plugged in.">💸 ${d.upkeep}/s</span> : null}
          </>
        )}
        {d.category === 'utility' && (
          <span data-hint={HINT.router}>
            risky = 🐞 &gt; {((d.threshold ?? 0) * 100).toFixed(0)}/100 LOC
          </span>
        )}
        {d.category === 'sink' && (
          <>
            <span data-hint={HINT.value}>${(st.value ?? 1).toFixed(2)}/LOC</span>
            <span data-hint={HINT.lurking}>🐞 {game.s.backlog.toFixed(1)} lurking</span>
          </>
        )}
      </div>

      {game.canHire(id) && <HireButtons id={id} />}

      {st.mod.sources.length > 0 && (
        <div className="gnode-mods">
          {st.mod.sources
            .filter((sid) => game.s.nodes[sid])
            .map((sid, i) => (
              <Sprite key={i} id={game.def(sid).sprite} scale={1.25} />
            ))}
        </div>
      )}

      {acceptsFlow(d) && <Handle type="target" position={Position.Left} id="in" className="jack jack-flow" />}
      {emitsFlow(d) && !d.outputs && <Handle type="source" position={Position.Right} id="out" className="jack jack-flow" />}
      {d.outputs && (
        <>
          <Handle type="source" position={Position.Right} id="risky" className="jack jack-flow jack-risky" style={{ top: '35%' }} />
          <span className="port-label" style={{ top: 'calc(35% - 22px)' }}>risky</span>
          <Handle type="source" position={Position.Right} id="safe" className="jack jack-flow jack-safe" style={{ top: '70%' }} />
          <span className="port-label" style={{ top: 'calc(70% - 22px)' }}>safe</span>
        </>
      )}
      {acceptsMods(d) && <Handle type="target" position={Position.Bottom} id="modin" className="jack jack-mod" />}
      {d.category === 'booster' && <Handle type="source" position={Position.Right} id="mod" className="jack jack-mod" />}
    </div>
  );
}

function HireButtons({ id }: { id: string }) {
  const n = game.s.nodes[id];
  const cost = game.cost(n.type);
  const can = game.affordable(id);
  const verb = game.def(n).kind === 'human' ? 'Hire' : 'Add';
  const cap = game.teamCap(id);
  if (n.count >= cap)
    return (
      <div className="hire nodrag">
        <div className="hire-full" title="Buy another squad from the shop to grow further">
          Squad full ({cap}/{cap}) · buy another squad
        </div>
      </div>
    );
  return (
    <div className="hire nodrag">
      <button className={`hire-btn ${can ? '' : 'poor'}`} onClick={() => game.hire(id)} title={`${verb} one more to this team`}>
        +1 {verb} <b>${fmt(cost)}</b>
      </button>
      <button className={`hire-btn max ${can > 1 ? '' : 'poor'}`} onClick={() => game.hire(id, true)} title="Hire as many as you can afford">
        +{can > 1 ? can : ''} Max
      </button>
    </div>
  );
}
