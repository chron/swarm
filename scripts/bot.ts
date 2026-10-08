// Headless "reasonable player" bot for pacing checks: npx tsx scripts/bot.ts
import { game, GOAL_LOC } from '../src/game/engine';
import { DEFS } from '../src/game/defs';
import { SKILLS } from '../src/game/skills';
import { ERAS } from '../src/game/defs';

const PRODUCERS = ['swarm', 'cloud', 'agent', 'chatbot', 'tenx', 'junior'];
const REVIEWERS = ['review_swarm', 'ai_reviewer', 'ci', 'tests', 'linter', 'senior'];
const BOOSTERS = ['orchestrator', 'gpu', 'context', 'autocomplete', 'stackoverflow', 'coffee'];
const SKILL_ORDER = ['v1', 'r1', 'p1', 'i1', 'p2', 'v3', 'v2', 'r2', 'p3', 'r3', 'i2', 'v4', 'i3', 'p4', 'r4', 'r5', 'v5', 'i4', 'v6', 'r6', 'i5', 'p6', 'i6', 'v7', 'r7', 'i7', 'p7', 'r8', 'v8', 'i8', 'p8', 'r9', 'v9'];

const s = () => game.s;
const nodesOf = (types: string[]) => Object.values(s().nodes).filter((n) => types.includes(n.type));
const log: string[] = [];
let lastEra = 1;

function locRate(types: string[], producer: boolean) {
  return nodesOf(types).reduce((a, n) => a + (game.stats(n.id).locRate ?? 0), 0) * (producer ? 1 : 1);
}

function wire(id: string) {
  const d = DEFS[s().nodes[id].type];
  if (d.category === 'producer') for (const r of nodesOf(REVIEWERS)) game.connect({ source: id, sourceHandle: 'out', target: r.id, targetHandle: 'in' });
  if (d.category === 'reviewer') {
    game.connect({ source: id, sourceHandle: 'out', target: 'prod', targetHandle: 'in' });
    for (const p of nodesOf(PRODUCERS)) game.connect({ source: p.id, sourceHandle: 'out', target: id, targetHandle: 'in' });
    // first reviewer: unplug producers going direct to prod
    s().edges = s().edges.filter((e) => !(e.target === 'prod' && DEFS[s().nodes[e.source].type].category === 'producer' && e.source !== 'you'));
  }
  if (d.category === 'booster') {
    const cands = Object.values(s().nodes).sort((a, b) => (game.stats(b.id).locRate ?? 0) - (game.stats(a.id).locRate ?? 0));
    for (const t of cands) game.connect({ source: id, sourceHandle: 'mod', target: t.id, targetHandle: 'modin' });
  }
}

function tryBuy(type: string) {
  if (!game.isUnlocked(type)) return false;
  const id = game.buy(type, 0, 0);
  if (id) wire(id);
  return !!id;
}

let t = 0;
const DT = 0.1;
while (t < 40 * 60 && !s().won) {
  // click for the first two minutes
  if (t < 120 && Math.round(t * 10) % 2 === 0) game.click('you');
  game.tick(DT);
  t += DT;
  if (Math.round(t * 10) % 5 !== 0) continue;

  for (const id of SKILL_ORDER) if (game.canBuySkill(id) && s().insight >= SKILLS.find((k) => k.id === id)!.cost && game.buySkill(id)) log.push(`${fmtT(t)}    skill ${id} (${SKILLS.find((k) => k.id === id)!.name})  $/s=${s().cashRate.toFixed(0)} 💡/s=${s().insightRate.toFixed(1)}`);
  if (s().era !== lastEra) {
    log.push(`${fmtT(t)}  ERA ${s().era} ${ERAS[s().era].name}`);
    lastEra = s().era;
  }

  const prodRate = locRate(PRODUCERS, true);
  const revRate = locRate(REVIEWERS, false);
  const bestP = PRODUCERS.find((p) => game.isUnlocked(p))!;
  const bestR = REVIEWERS.find((r) => game.isUnlocked(r))!;
  const bestB = BOOSTERS.find((b) => game.isUnlocked(b) && nodesOf([b]).length < 3);
  // keep ~20% of cash as token buffer once tokens matter
  const reserve = s().era >= 3 ? s().cashRate * 5 : 0;
  const spend = (type: string) => s().cash - game.cost(type) > reserve && tryBuy(type);
  if (revRate < prodRate * 0.9) spend(bestR);
  else spend(bestP);
  if (bestB) spend(bestB);
  if (game.isUnlocked('pm') && nodesOf(['pm']).length < 1) spend('pm');
}

function fmtT(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}
console.log(log.join('\n'));
console.log(`${s().won ? 'WON' : 'not won'} at ${fmtT(t)}  loc=${s().totalLoc.toExponential(2)} / ${GOAL_LOC.toExponential(0)}`);
console.log(`skills=${s().skills.length}/${SKILLS.length} incidents=${s().incidents} debt=${game.debt.toFixed(2)} cash=${s().cash.toFixed(0)} insight=${s().insight.toFixed(0)}`);
const counts: Record<string, number> = {};
Object.values(s().nodes).forEach((n) => (counts[n.type] = (counts[n.type] ?? 0) + 1));
console.log(counts);
