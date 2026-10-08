import { DEFS, ERAS, YOU_FORMS, NodeDef, acceptsFlow, acceptsMods, emitsFlow } from './defs';
import { SKILL_MAP, computeGlobals, Globals } from './skills';
import { INCIDENT_QUIPS } from './flavor';

export const GOAL_LOC = 1e9;
export const CLICKS_PER_PR = 4;
export const MOD_JACKS = 3;
const TRAVEL = 0.9; // seconds for a PR to cross a cable
const MIN_INTERVAL = 0.35;
const EDGE_CAP = 6; // max PRs in transit on one cable // faster producers emit bigger PRs instead of more PRs
const BUG_COST = 10; // an escaped bug costs this many LOC worth of value
const INCIDENT_THRESHOLD = 3;
const INCIDENT_COOLDOWN = 6;
const SAVE_KEY = 'swarm-save-v1';
const SAVE_VERSION = 1;

export interface PR {
  loc: number;
  bugs: number;
  reviewed: boolean;
  human: boolean;
}

export type Status = 'idle' | 'busy' | 'blocked' | 'broke' | 'off';

export interface GNode {
  id: string;
  type: string;
  x: number;
  y: number;
  prog: number;
  held: PR | null;
  queue: PR[];
  cur: PR | null;
  curProg: number;
  rr: number;
  status: Status;
  lastActive: number;
  count: number; // team headcount
}

export interface GEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
  kind: 'flow' | 'mod';
  packets: { p: PR; t: number }[];
  rate: number; // PRs / s
  locRate: number; // LOC / s
  acc: number;
  accLoc: number;
}

export interface State {
  v: number;
  nodes: Record<string, GNode>;
  edges: GEdge[];
  cash: number;
  insight: number;
  totalLoc: number;
  humanLoc: number;
  bugsCaught: number;
  bugsShipped: number;
  incidents: number;
  backlog: number;
  incidentCd: number;
  lastIncident: number;
  debtU: number;
  debtT: number;
  skills: string[];
  time: number;
  rsiTime: number;
  cashRate: number;
  locRate: number;
  insightRate: number;
  era: number;
  won: boolean;
  wonTime: number;
  final: FinalStats | null; // frozen at the moment of winning
  focus: number; // 0..1, charged by mashing once You are promoted
  nextId: number;
  flags: Record<string, boolean>;
}

export type Ending = 'yolo' | 'firefighter' | 'rigor' | 'balanced';

export interface FinalStats {
  ending: Ending;
  debt: number;
  youLevel: number;
  time: number;
  totalLoc: number;
  humanLoc: number;
  bugsCaught: number;
  bugsShipped: number;
  incidents: number;
}

export interface Mod {
  speed: number;
  bugs: number;
  catch: number;
  value: number;
  sources: string[];
}

export interface Floater {
  id: number;
  node: string;
  text: string;
  t: number;
  bad?: boolean;
}

export type GameEvent =
  | { kind: 'incident'; bugs: number; cost: number; insight: number; text: string }
  | { kind: 'era'; era: number }
  | { kind: 'promo'; level: number }
  | { kind: 'toast'; text: string }
  | { kind: 'win' };

export interface Connection {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

function newNode(id: string, type: string, x: number, y: number): GNode {
  return { id, type, x, y, prog: 0, held: null, queue: [], cur: null, curProg: 0, rr: 0, status: 'idle', lastActive: -99, count: 1 };
}

function freshState(): State {
  return {
    v: SAVE_VERSION,
    nodes: {
      you: newNode('you', 'you', 0, 0),
      prod: newNode('prod', 'prod', 420, -10),
    },
    edges: [mkEdge('e0', 'you', 'out', 'prod', 'in', 'flow')],
    cash: 0,
    insight: 0,
    totalLoc: 0,
    humanLoc: 0,
    bugsCaught: 0,
    bugsShipped: 0,
    incidents: 0,
    backlog: 0,
    incidentCd: 0,
    lastIncident: -99,
    debtU: 0,
    debtT: 0,
    skills: ['root'],
    time: 0,
    rsiTime: 0,
    cashRate: 0,
    locRate: 0,
    insightRate: 0,
    era: 1,
    won: false,
    wonTime: 0,
    final: null,
    focus: 0,
    nextId: 1,
    flags: {},
  };
}

function mkEdge(id: string, source: string, sourceHandle: string, target: string, targetHandle: string, kind: 'flow' | 'mod'): GEdge {
  return { id, source, sourceHandle, target, targetHandle, kind, packets: [], rate: 0, locRate: 0, acc: 0, accLoc: 0 };
}

const emptyMod = (): Mod => ({ speed: 1, bugs: 1, catch: 0, value: 1, sources: [] });

class Game {
  s: State = freshState();
  g: Globals = computeGlobals(this.s.skills);
  mods: Record<string, Mod> = {};
  timeScale = 1;
  paused = false;
  events: GameEvent[] = [];
  floaters: Floater[] = [];
  private floaterId = 0;
  private pendingGain: Record<string, { amount: number; t: number }> = {};
  private structureListeners = new Set<() => void>();
  private eventListeners = new Set<(e: GameEvent) => void>();
  private gainedCash = 0;
  private gainedLoc = 0;
  private gainedInsight = 0;

  // ---------- lifecycle

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as State;
        if (s.v === SAVE_VERSION) {
          this.s = { ...freshState(), ...s };
          for (const n of Object.values(this.s.nodes)) n.count ??= 1;
        }
      }
    } catch {
      /* ignore broken saves */
    }
    this.g = computeGlobals(this.s.skills);
    this.mods = this.computeMods(0);
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.s));
    } catch {
      /* storage unavailable */
    }
  }

  reset() {
    this.s = freshState();
    this.g = computeGlobals(this.s.skills);
    this.floaters = [];
    this.save();
    this.bump();
  }

  onStructure(f: () => void) {
    this.structureListeners.add(f);
    return () => void this.structureListeners.delete(f);
  }

  onEvent(f: (e: GameEvent) => void) {
    this.eventListeners.add(f);
    return () => void this.eventListeners.delete(f);
  }

  private bump() {
    this.structureListeners.forEach((f) => f());
  }

  private emit(e: GameEvent) {
    this.eventListeners.forEach((f) => f(e));
  }

  // ---------- queries

  def(n: GNode | string): NodeDef {
    const type = typeof n === 'string' ? this.s.nodes[n]?.type ?? n : n.type;
    if (type === 'you') return DEFS[YOU_FORMS[this.g.youLevel]];
    return DEFS[type];
  }

  count(type: string) {
    let c = 0;
    for (const id in this.s.nodes) if (this.s.nodes[id].type === type) c += this.s.nodes[id].count;
    return c;
  }

  cost(type: string, offset = 0) {
    const d = DEFS[type];
    return Math.ceil(d.cost * Math.pow(d.growth, this.count(type) + offset));
  }

  isUnlocked(type: string) {
    return this.g.unlocks.has(type);
  }

  edge(id: string) {
    return this.s.edges.find((e) => e.id === id);
  }

  get debt() {
    return this.s.debtT > 1e-9 ? Math.min(1, this.s.debtU / this.s.debtT) : 0;
  }

  get debtSlow() {
    return this.g.debtImpact * this.debt;
  }

  rsiMult() {
    return this.g.rsi ? Math.min(1e7, Math.pow(2, this.s.rsiTime / 6)) : 1;
  }

  /** Effective numbers for a node, used by the UI. */
  stats(id: string) {
    const n = this.s.nodes[id];
    const d = this.def(n);
    const m = this.mods[id] ?? emptyMod();
    const out: { speed?: number; locRate?: number; density?: number; catchRate?: number; token?: number; value?: number; mod: Mod } = { mod: m };
    if (d.category === 'producer') {
      const speed = this.producerSpeed(n, d, m);
      out.speed = speed;
      out.locRate = d.manual ? undefined : ((d.loc ?? 0) / (d.interval ?? 1)) * speed;
      out.density = this.density(d, m);
      if (d.token) out.token = d.token * this.g.token;
    }
    if (d.category === 'reviewer') {
      out.locRate = this.reviewSpeed(n, d, m);
      out.catchRate = this.catchRate(d, m);
    }
    if (d.category === 'sink') out.value = this.g.value * m.value;
    return out;
  }

  private producerSpeed(n: GNode, d: NodeDef, m: Mod) {
    const k = d.kind === 'none' ? 'tool' : d.kind;
    let speed = this.g.speed[k] * m.speed * n.count * (1 - this.debtSlow);
    if (n.type === 'swarm' || n.type === 'cloud') speed *= this.rsiMult();
    return speed;
  }

  private reviewSpeed(n: GNode, d: NodeDef, m: Mod) {
    const k = d.kind === 'none' ? 'tool' : d.kind;
    return (d.reviewSpeed ?? 1) * this.g.reviewSpeed[k] * m.speed * n.count;
  }

  private density(d: NodeDef, m: Mod) {
    const k = d.kind === 'none' ? 'tool' : d.kind;
    // rushing on top of unreviewed code makes new code buggier too
    return (d.density ?? 0) * this.g.bugs[k] * m.bugs * (1 + 0.6 * this.debt);
  }

  private catchRate(d: NodeDef, m: Mod) {
    const k = d.kind === 'none' ? 'tool' : d.kind;
    return Math.min(0.98, Math.max(0, (d.catchRate ?? 0) + this.g.catchAdd[k] + m.catch));
  }

  // ---------- player actions

  click(id = 'you') {
    const n = this.s.nodes[id];
    if (!n) return;
    const d = this.def(n);
    if (id === 'you' && d.category === 'booster') {
      this.s.focus = Math.min(1, this.s.focus + 0.05 * this.g.clickPower);
      n.lastActive = this.s.time;
      return;
    }
    if (!d.manual || n.held) return;
    const m = this.mods[id] ?? emptyMod();
    n.prog += this.g.clickPower * m.speed;
    n.lastActive = this.s.time;
    if (n.prog >= CLICKS_PER_PR) {
      n.prog = Math.min(n.prog - CLICKS_PER_PR, CLICKS_PER_PR - 1);
      n.held = this.makePR(d, m, d.loc ?? 0);
    }
  }

  buy(type: string, x: number, y: number): string | null {
    const d = DEFS[type];
    if (!d || d.unique || !this.isUnlocked(type)) return null;
    const c = this.cost(type);
    if (this.s.cash < c) return null;
    this.s.cash -= c;
    const id = `n${this.s.nextId++}`;
    this.s.nodes[id] = newNode(id, type, x, y);
    this.bump();
    return id;
  }

  sell(id: string) {
    const n = this.s.nodes[id];
    if (!n || this.def(n).unique) return;
    const refund = this.refund(id);
    delete this.s.nodes[id];
    this.s.edges = this.s.edges.filter((e) => e.source !== id && e.target !== id);
    this.s.cash += refund;
    this.mods = this.computeMods(0);
    this.bump();
  }

  /** Half of what the whole team cost. */
  refund(id: string) {
    const n = this.s.nodes[id];
    if (!n || this.def(n).unique) return 0;
    let total = 0;
    for (let i = 1; i <= n.count; i++) total += this.cost(n.type, -i);
    return Math.floor(total * 0.5);
  }

  canHire(id: string) {
    const n = this.s.nodes[id];
    if (!n) return false;
    const d = this.def(n);
    return !d.unique && (d.category === 'producer' || d.category === 'reviewer');
  }

  teamCap(id: string) {
    const d = this.def(id);
    return this.g.teamCap[d.kind === 'none' ? 'tool' : d.kind];
  }

  /** Grow a team by one (or as many as affordable). Returns how many were hired. */
  hire(id: string, max = false) {
    if (!this.canHire(id)) return 0;
    const n = this.s.nodes[id];
    let hired = 0;
    do {
      if (n.count >= this.teamCap(id)) break;
      const c = this.cost(n.type);
      if (this.s.cash < c) break;
      this.s.cash -= c;
      n.count++;
      hired++;
    } while (max && hired < 1000);
    return hired;
  }

  /** How many more this team could hire right now. */
  affordable(id: string) {
    const n = this.s.nodes[id];
    if (!n) return 0;
    const d = this.def(n);
    let cash = this.s.cash;
    let k = 0;
    const room = this.teamCap(id) - n.count;
    while (k < room) {
      const c = Math.ceil(d.cost * Math.pow(d.growth, this.count(n.type) + k));
      if (cash < c) break;
      cash -= c;
      k++;
    }
    return k;
  }

  move(id: string, x: number, y: number) {
    const n = this.s.nodes[id];
    if (n) {
      n.x = x;
      n.y = y;
    }
  }

  validate(c: Connection): string | null {
    if (!c.source || !c.target) return 'Missing node';
    const a = this.s.nodes[c.source];
    const b = this.s.nodes[c.target];
    if (!a || !b) return 'Missing node';
    if (a === b) return "A node can't plug into itself.";
    const da = this.def(a);
    const db = this.def(b);
    const sh = c.sourceHandle ?? 'out';
    const th = c.targetHandle ?? 'in';
    const dup = this.s.edges.some((e) => e.source === a.id && e.target === b.id && e.sourceHandle === sh);
    if (sh === 'mod') {
      if (th !== 'modin' || !acceptsMods(db)) return 'Booster cables plug into ◆ mod jacks.';
      const kinds = da.targetKinds;
      if (!da.targetCats?.includes(db.category) || (kinds && !kinds.includes(db.kind)))
        return `${da.name} can't boost ${db.name}.`;
      if (dup) return 'Already plugged in.';
      const used = this.s.edges.filter((e) => e.kind === 'mod' && e.source === a.id).length;
      if (used >= (da.fanout ?? 1)) return `${da.name} can only power ${da.fanout} node${da.fanout === 1 ? '' : 's'}.`;
      const jacks = this.s.edges.filter((e) => e.kind === 'mod' && e.target === b.id).length;
      if (jacks >= MOD_JACKS) return `${db.name} has no free mod jacks.`;
      return null;
    }
    if (!emitsFlow(da)) return `${da.name} doesn't output code.`;
    if (th !== 'in' || !acceptsFlow(db)) return 'Code cables plug into ● input jacks.';
    if (dup) return 'Already connected.';
    return null;
  }

  connect(c: Connection): string | null {
    const err = this.validate(c);
    if (err) return err;
    const sh = c.sourceHandle ?? 'out';
    const kind = sh === 'mod' ? 'mod' : 'flow';
    // one cable per code output jack: plugging it somewhere new moves the cable
    if (kind === 'flow') this.s.edges = this.s.edges.filter((e) => !(e.source === c.source && e.sourceHandle === sh));
    this.s.edges.push(mkEdge(`e${this.s.nextId++}`, c.source!, sh, c.target!, c.targetHandle ?? 'in', kind));
    this.mods = this.computeMods(0);
    this.bump();
    return null;
  }

  disconnect(id: string) {
    const before = this.s.edges.length;
    this.s.edges = this.s.edges.filter((e) => e.id !== id);
    if (this.s.edges.length !== before) {
      this.mods = this.computeMods(0);
      this.bump();
    }
  }

  canBuySkill(id: string) {
    const sk = SKILL_MAP[id];
    if (!sk || this.s.skills.includes(id)) return false;
    return sk.requires.every((r) => this.s.skills.includes(r));
  }

  buySkill(id: string) {
    const sk = SKILL_MAP[id];
    if (!this.canBuySkill(id) || this.s.insight < sk.cost) return false;
    this.s.insight -= sk.cost;
    this.s.skills.push(id);
    const level = this.g.youLevel;
    this.g = computeGlobals(this.s.skills);
    if (this.g.youLevel > level) {
      // promoted: You stop shipping code and plug into agents instead
      if (level === 0) this.s.edges = this.s.edges.filter((e) => e.source !== 'you');
      const you = this.s.nodes.you;
      if (you) you.held = null;
      this.emit({ kind: 'promo', level: this.g.youLevel });
    }
    let era = this.s.era;
    this.g.unlocks.forEach((t) => (era = Math.max(era, DEFS[t]?.era ?? 1)));
    if (era > this.s.era) {
      this.s.era = era;
      this.emit({ kind: 'era', era });
    }
    this.bump();
    return true;
  }

  // ---------- simulation

  tick(realDt: number) {
    let dt = Math.min(realDt, 0.1) * this.timeScale;
    while (dt > 0) {
      const step = Math.min(dt, 0.05);
      this.step(step);
      dt -= step;
    }
    const now = this.s.time;
    this.floaters = this.floaters.filter((f) => now - f.t < 1.4);
  }

  private computeMods(dt: number) {
    const s = this.s;
    const res: Record<string, Mod> = {};
    const powered: Record<string, boolean> = {};
    for (const id in s.nodes) {
      const n = s.nodes[id];
      const d = this.def(n);
      if (d.category !== 'booster') continue;
      const connected = s.edges.some((e) => e.kind === 'mod' && e.source === id);
      if (!connected) {
        n.status = 'off';
        continue;
      }
      const upkeep = (d.upkeep ?? 0) * dt;
      if (upkeep > 0 && s.cash < upkeep) {
        n.status = 'broke';
        continue;
      }
      s.cash -= upkeep;
      n.status = 'busy';
      powered[id] = true;
    }
    for (const e of s.edges) {
      if (e.kind !== 'mod' || !powered[e.source]) continue;
      const eff = this.def(e.source).effect ?? {};
      const m = (res[e.target] ??= emptyMod());
      const focus = e.source === 'you' ? this.s.focus : 0; // mashing amplifies your boost
      m.speed *= (eff.speed ?? 1) * (1 + 0.6 * focus);
      m.bugs *= (eff.bugs ?? 1) * (1 - 0.3 * focus);
      m.catch += eff.catch ?? 0;
      m.value *= eff.value ?? 1;
      m.sources.push(e.source);
    }
    return res;
  }

  private makePR(d: NodeDef, m: Mod, loc: number): PR {
    return { loc, bugs: loc * this.density(d, m), reviewed: false, human: d.kind === 'human' };
  }

  private step(dt: number) {
    const s = this.s;
    s.time += dt;
    this.mods = this.computeMods(dt);

    // outgoing flow edges per node+handle, and PRs already heading to each node
    const outs: Record<string, GEdge[]> = {};
    const inbound: Record<string, number> = {};
    for (const e of s.edges) {
      if (e.kind !== 'flow') continue;
      (outs[`${e.source}:${e.sourceHandle}`] ??= []).push(e);
      inbound[e.target] = (inbound[e.target] ?? 0) + e.packets.length;
    }

    const canAccept = (id: string) => {
      const n = s.nodes[id];
      const d = this.def(n);
      if (d.category === 'sink') return true;
      // PRs already on a cable don't count: they'll just queue a little past the cap
      return n.queue.length < (d.queueCap ?? 3);
    };

    const trySend = (n: GNode, handle: string) => {
      if (!n.held) return;
      const list = outs[`${n.id}:${handle}`];
      if (!list?.length) return;
      for (let i = 0; i < list.length; i++) {
        const e = list[(n.rr + i) % list.length];
        if (e.packets.length >= EDGE_CAP || !canAccept(e.target)) continue;
        e.packets.push({ p: n.held, t: 0 });
        e.acc++;
        e.accLoc += n.held.loc;
        inbound[e.target] = (inbound[e.target] ?? 0) + 1;
        n.held = null;
        n.rr = (n.rr + i + 1) % list.length;
        n.lastActive = s.time;
        return;
      }
    };

    for (const id in s.nodes) {
      const n = s.nodes[id];
      const d = this.def(n);
      const m = this.mods[id] ?? emptyMod();

      if (d.category === 'producer') {
        if (!d.manual && !n.held) {
          const speed = this.producerSpeed(n, d, m);
          const eff = (d.interval ?? 1) / Math.max(speed, 1e-9);
          const interval = Math.max(eff, MIN_INTERVAL);
          const batch = interval / eff;
          n.prog += dt / interval;
          if (n.prog >= 1) {
            const tokenCost = (d.token ?? 0) * batch * this.g.token;
            if (s.cash >= tokenCost) {
              s.cash -= tokenCost;
              n.held = this.makePR(d, m, (d.loc ?? 0) * batch);
              n.prog = Math.min(n.prog - 1, 0.99);
            } else {
              n.prog = 1;
              n.status = 'broke';
            }
          }
        }
        trySend(n, 'out');
        if (n.held) n.status = 'blocked';
        else if (d.manual) n.status = s.time - n.lastActive < 0.6 ? 'busy' : 'idle';
        else if (n.status !== 'broke' || n.prog < 1) n.status = 'busy';
      } else if (d.category === 'reviewer') {
        // a big team can get through several PRs per tick
        let budget = dt * this.reviewSpeed(n, d, m);
        for (let guard = 0; guard < 8; guard++) {
          trySend(n, 'out');
          if (n.held) break;
          if (!n.cur) {
            if (!n.queue.length) break;
            n.cur = n.queue.shift()!;
            n.curProg = 0;
          }
          const need = n.cur.loc - n.curProg;
          if (budget < need) {
            n.curProg += budget;
            break;
          }
          budget -= need;
          const caught = n.cur.bugs * this.catchRate(d, m);
          n.cur.bugs -= caught;
          n.cur.reviewed = true;
          const gained = caught * this.g.insight;
          s.insight += gained;
          this.gainedInsight += gained;
          s.bugsCaught += caught;
          n.held = n.cur;
          n.cur = null;
        }
        n.status = n.held ? 'blocked' : n.cur ? 'busy' : 'idle';
      } else if (d.category === 'utility') {
        if (!n.held && n.queue.length) n.held = n.queue.shift()!;
        if (n.held) {
          const risky = n.held.bugs / Math.max(1, n.held.loc) > (d.threshold ?? 0.02);
          trySend(n, risky ? 'risky' : 'safe');
        }
        n.status = n.held ? 'blocked' : n.queue.length ? 'busy' : 'idle';
      }
    }

    // move PRs along cables
    const alpha = 1 - Math.exp(-dt / 2);
    for (const e of s.edges) {
      if (e.kind !== 'flow') continue;
      for (const pk of e.packets) pk.t += dt / TRAVEL;
      while (e.packets.length && e.packets[0].t >= 1) {
        const { p } = e.packets.shift()!;
        const target = s.nodes[e.target];
        if (!target) continue;
        if (this.def(target).category === 'sink') this.ship(p, target);
        else target.queue.push(p);
      }
      e.rate += (e.acc / dt - e.rate) * alpha;
      e.locRate += (e.accLoc / dt - e.locRate) * alpha;
      e.acc = 0;
      e.accLoc = 0;
    }

    // tech debt is the share of recently shipped LOC that skipped review
    const decay = Math.exp(-dt / 20);
    s.debtU *= decay;
    s.debtT *= decay;

    // incidents
    s.focus = Math.max(0, s.focus - dt * 0.1);
    if (!s.flags.debtWarned && this.debtSlow > 0.2) {
      s.flags.debtWarned = true;
      this.emit({
        kind: 'toast',
        text: `🐌 Tech debt! ${Math.round(this.debt * 100)}% of recent code skipped review, so every producer is ${Math.round(this.debtSlow * 100)}% slower and writes buggier code.`,
      });
    }

    s.incidentCd -= dt;
    if (s.backlog >= INCIDENT_THRESHOLD && s.incidentCd <= 0) this.incident();

    // flush coalesced cash floaters
    for (const id in this.pendingGain) {
      const pg = this.pendingGain[id];
      if (s.time - pg.t > 0.35) {
        this.floaters.push({ id: this.floaterId++, node: id, text: `+$${fmtShort(pg.amount)}`, t: s.time });
        delete this.pendingGain[id];
      }
    }

    // rates
    const ra = 1 - Math.exp(-dt / 3);
    s.cashRate += (this.gainedCash / dt - s.cashRate) * ra;
    s.locRate += (this.gainedLoc / dt - s.locRate) * ra;
    s.insightRate += (this.gainedInsight / dt - s.insightRate) * ra;
    this.gainedCash = this.gainedLoc = this.gainedInsight = 0;

    if (this.g.rsi) s.rsiTime += dt;

    if (!s.won && s.totalLoc >= GOAL_LOC) {
      s.won = true;
      s.wonTime = s.time;
      // count bugs still lurking in prod as shipped, too
      const debt = this.debt;
      const shipped = s.bugsShipped + s.backlog;
      const ending: Ending =
        debt >= 0.5 ? 'yolo'
        : s.incidents >= 120 || shipped > s.bugsCaught ? 'firefighter'
        : debt < 0.15 && s.bugsCaught >= 4 * shipped ? 'rigor'
        : 'balanced';
      s.final = {
        ending,
        debt,
        youLevel: this.g.youLevel,
        time: s.time,
        totalLoc: s.totalLoc,
        humanLoc: s.humanLoc,
        bugsCaught: s.bugsCaught,
        bugsShipped: s.bugsShipped + s.backlog,
        incidents: s.incidents,
      };
      this.emit({ kind: 'win' });
    }
  }

  private ship(p: PR, sink: GNode) {
    const s = this.s;
    const m = this.mods[sink.id] ?? emptyMod();
    const value = p.loc * this.g.value * m.value;
    s.cash += value;
    this.gainedCash += value;
    this.gainedLoc += p.loc;
    s.totalLoc += p.loc;
    if (p.human) s.humanLoc += p.loc;
    s.backlog += p.bugs;
    s.debtT += p.loc;
    if (!p.reviewed) s.debtU += p.loc;
    sink.lastActive = s.time;
    const pg = (this.pendingGain[sink.id] ??= { amount: 0, t: s.time });
    pg.amount += value;
  }

  private incident() {
    const s = this.s;
    const bugs = s.backlog;
    const cost = Math.min(s.cash, bugs * BUG_COST * this.g.value * this.g.incidentCost);
    const insight = (1 + bugs * 0.4) * this.g.incidentInsight;
    s.cash -= cost;
    s.insight += insight;
    this.gainedInsight += insight;
    s.bugsShipped += bugs;
    s.incidents++;
    s.backlog = 0;
    s.incidentCd = INCIDENT_COOLDOWN;
    s.lastIncident = s.time;
    const text = INCIDENT_QUIPS[(s.incidents * 7) % INCIDENT_QUIPS.length];
    this.floaters.push({ id: this.floaterId++, node: 'prod', text: `🔥 -$${fmtShort(cost)}`, t: s.time, bad: true });
    this.emit({ kind: 'incident', bugs, cost, insight, text });
  }
}

function fmtShort(n: number) {
  if (n < 1000) return n < 10 ? n.toFixed(1) : Math.round(n).toString();
  const units = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return `${n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0)}${units[i]}`;
}

export { fmtShort, ERAS };
export const game = new Game();
if (typeof window !== "undefined") (window as unknown as { game: Game }).game = game;
