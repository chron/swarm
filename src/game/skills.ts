export type Branch = 'root' | 'velocity' | 'rigor' | 'infra' | 'product';
type K = 'human' | 'ai' | 'tool';

export interface Globals {
  speed: Record<K, number>;
  bugs: Record<K, number>;
  reviewSpeed: Record<K, number>;
  catchAdd: Record<K, number>;
  value: number;
  incidentCost: number;
  incidentInsight: number;
  insight: number;
  token: number;
  debtImpact: number;
  clickPower: number;
  teamCap: Record<K, number>;
  unlocks: Set<string>;
  rsi: boolean;
}

export interface Skill {
  id: string;
  name: string;
  branch: Branch;
  cost: number;
  requires: string[];
  x: number;
  y: number;
  desc: string;
  unlock?: string;
  apply?: (g: Globals) => void;
}

const all = (g: Globals, f: (k: K) => void) => (['human', 'ai', 'tool'] as K[]).forEach(f);

export const SKILLS: Skill[] = [
  { id: 'root', name: 'Hello, World', branch: 'root', cost: 0, requires: [], x: 0, y: 0, desc: 'printf("hello, world\\n"); — where it all began.' },

  // ---- Velocity (up)
  { id: 'v1', name: 'Mechanical Keyboard', branch: 'velocity', cost: 8, requires: ['root'], x: 0, y: -1,
    desc: 'Clicky. Humans code +25% faster; your clicks count double.',
    apply: (g) => { g.speed.human *= 1.25; g.clickPower *= 2; } },
  { id: 'v2', name: '10x Engineer', branch: 'velocity', cost: 32, requires: ['v1'], x: -0.9, y: -1.8,
    desc: 'Unlocks the 10x Engineer. Fast, clean, impossible to talk to.', unlock: 'tenx' },
  { id: 'v3', name: 'Tab Tab Tab', branch: 'velocity', cost: 40, requires: ['v1'], x: 0.9, y: -1.8,
    desc: 'Unlocks Autocomplete — a booster that makes humans type 2.5× faster.', unlock: 'autocomplete' },
  { id: 'v4', name: 'Prompt Engineering', branch: 'velocity', cost: 120, requires: ['v3'], x: 0.9, y: -2.9,
    desc: 'Unlocks the Chat Assistant. Your first producer that isn\'t a person.', unlock: 'chatbot' },
  { id: 'v5', name: 'Vibe Coding', branch: 'velocity', cost: 280, requires: ['v4'], x: 2, y: -3.4,
    desc: 'Stop reading the code. AI producers +60% speed, +30% bugs.',
    apply: (g) => { g.speed.ai *= 1.6; g.bugs.ai *= 1.3; } },
  { id: 'v6', name: 'Agent Mode', branch: 'velocity', cost: 800, requires: ['v4'], x: 0.5, y: -4,
    desc: 'Unlocks the Coding Agent. It runs the tests itself. Mostly.', unlock: 'agent' },
  { id: 'v7', name: 'Background Agents', branch: 'velocity', cost: 5000, requires: ['v6'], x: 0.5, y: -5.1,
    desc: 'Unlocks the Cloud Agent Fleet. Agents that work while you sleep.', unlock: 'cloud' },
  { id: 'v8', name: 'Swarm Intelligence', branch: 'velocity', cost: 40000, requires: ['v7'], x: 0, y: -6.2,
    desc: 'Unlocks The Swarm.', unlock: 'swarm' },
  { id: 'v9', name: 'Recursive Self-Improvement', branch: 'velocity', cost: 200000, requires: ['v8'], x: 0, y: -7.4,
    desc: 'The Swarm and Cloud Fleets start improving themselves. Exponentially. What could go wrong?',
    apply: (g) => { g.rsi = true; } },

  // ---- Rigor (right)
  { id: 'r1', name: 'Linting', branch: 'rigor', cost: 11, requires: ['root'], x: 1, y: 0,
    desc: 'Unlocks the Linter: a fast, shallow reviewer.', unlock: 'linter' },
  { id: 'r2', name: 'Pair Review', branch: 'rigor', cost: 32, requires: ['r1'], x: 1.8, y: -0.8,
    desc: 'Human reviewers +60% speed.', apply: (g) => { g.reviewSpeed.human *= 1.6; } },
  { id: 'r3', name: 'Unit Tests', branch: 'rigor', cost: 71, requires: ['r1'], x: 2, y: 0.3,
    desc: 'Unlocks the Test Suite.', unlock: 'tests' },
  { id: 'r4', name: 'TDD', branch: 'rigor', cost: 160, requires: ['r3'], x: 2.9, y: -0.6,
    desc: 'Tool reviewers catch +10% more bugs. Humans write 20% fewer.',
    apply: (g) => { g.catchAdd.tool += 0.1; g.bugs.human *= 0.8; } },
  { id: 'r5', name: 'CI/CD', branch: 'rigor', cost: 300, requires: ['r3'], x: 3.1, y: 0.5,
    desc: 'Unlocks the CI Pipeline.', unlock: 'ci' },
  { id: 'r6', name: 'AI Code Review', branch: 'rigor', cost: 1200, requires: ['r5'], x: 4.2, y: 0.2,
    desc: 'Unlocks the AI Reviewer.', unlock: 'ai_reviewer' },
  { id: 'r7', name: 'Agents Reviewing Agents', branch: 'rigor', cost: 4000, requires: ['r6'], x: 5.2, y: -0.5,
    desc: 'AI reviewers +100% speed. It\'s turtles all the way down.', apply: (g) => { g.reviewSpeed.ai *= 2; } },
  { id: 'r8', name: 'Review Swarm', branch: 'rigor', cost: 14000, requires: ['r6'], x: 5.4, y: 0.8,
    desc: 'Unlocks the Review Swarm.', unlock: 'review_swarm' },
  { id: 'r9', name: 'Formal Verification', branch: 'rigor', cost: 65000, requires: ['r8'], x: 6.5, y: 0.4,
    desc: 'All reviewers catch +10% more bugs (in the parts we could prove), and you gain +50% insight.',
    apply: (g) => { all(g, (k) => (g.catchAdd[k] += 0.1)); g.insight *= 1.5; } },

  // ---- Infra (left)
  { id: 'i1', name: 'Stack Overflow', branch: 'infra', cost: 8, requires: ['root'], x: -1, y: 0,
    desc: 'Unlocks Stack Overflow: humans code 2× faster, with 40% more bugs.', unlock: 'stackoverflow' },
  { id: 'i2', name: 'Refactor Fridays', branch: 'infra', cost: 25, requires: ['i1'], x: -1.8, y: -0.8,
    desc: 'Tech debt slows you down half as much.', apply: (g) => { g.debtImpact = 0.25; } },
  { id: 'i3', name: 'Feature Flags', branch: 'infra', cost: 92, requires: ['i1'], x: -2, y: 0.3,
    desc: 'Incidents cost 50% less. Just flip it off!', apply: (g) => { g.incidentCost *= 0.5; } },
  { id: 'i4', name: 'Cloud Credits', branch: 'infra', cost: 280, requires: ['i3'], x: -3.1, y: 0.1,
    desc: 'Tokens cost 40% less. (The startup credits will last forever, right?)', apply: (g) => { g.token *= 0.6; } },
  { id: 'i5', name: 'Context Engineering', branch: 'infra', cost: 1000, requires: ['i4'], x: -4.1, y: -0.5,
    desc: 'Unlocks Context Docs: AI writes half as many bugs and reviews better.', unlock: 'context' },
  { id: 'i6', name: 'GPU Cluster', branch: 'infra', cost: 1800, requires: ['i4'], x: -4.2, y: 0.8,
    desc: 'Unlocks the GPU Rack: 2× speed for plugged-in AI.', unlock: 'gpu' },
  { id: 'i7', name: 'Orchestration', branch: 'infra', cost: 8000, requires: ['i5'], x: -5.3, y: 0.1,
    desc: 'Unlocks the Orchestrator: one booster to rule many agents. AI squads can grow to 25.', unlock: 'orchestrator',
    apply: (g) => { g.teamCap.ai = 25; } },
  { id: 'i8', name: 'Infinite Context', branch: 'infra', cost: 35000, requires: ['i7'], x: -6.4, y: 0.1,
    desc: 'AI writes 40% fewer bugs. It finally read the whole codebase.', apply: (g) => { g.bugs.ai *= 0.6; } },

  // ---- Product (down)
  { id: 'p1', name: 'Ship It', branch: 'product', cost: 8, requires: ['root'], x: 0, y: 1,
    desc: 'Shipped code is worth +25%.', apply: (g) => { g.value *= 1.25; } },
  { id: 'p2', name: 'Blameless Postmortems', branch: 'product', cost: 18, requires: ['p1'], x: -0.9, y: 1.8,
    desc: 'Incidents give 2× insight. Every outage is a learning opportunity!', apply: (g) => { g.incidentInsight *= 2; } },
  { id: 'p3', name: 'Product Manager', branch: 'product', cost: 51, requires: ['p1'], x: 0.9, y: 1.8,
    desc: 'Unlocks the Product Manager booster for Production.', unlock: 'pm' },
  { id: 'p4', name: 'Growth Hacking', branch: 'product', cost: 150, requires: ['p3'], x: 0.9, y: 2.9,
    desc: 'Shipped code is worth +50%.', apply: (g) => { g.value *= 1.5; } },
  { id: 'p5', name: 'Triage', branch: 'product', cost: 160, requires: ['p3'], x: 2, y: 2.4,
    desc: 'Unlocks the Triage Bot, which routes risky PRs and safe PRs to different outputs.', unlock: 'router' },
  { id: 'p6', name: 'Enterprise Sales', branch: 'product', cost: 1400, requires: ['p4'], x: 0.5, y: 4,
    desc: 'Shipped code is worth 2×. Now with SSO.', apply: (g) => { g.value *= 2; } },
  { id: 'p7', name: 'Series B', branch: 'product', cost: 9000, requires: ['p6'], x: 0.5, y: 5.1,
    desc: 'Shipped code is worth 2.5×, and tokens cost 20% less.', apply: (g) => { g.value *= 2.5; g.token *= 0.8; } },
  { id: 'p8', name: 'IPO', branch: 'product', cost: 45000, requires: ['p7'], x: 0, y: 6.2,
    desc: 'Shipped code is worth 3×. Ring the bell!', apply: (g) => { g.value *= 3; } },
];

export const SKILL_MAP: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export const BASE_UNLOCKS = ['you', 'prod', 'junior', 'senior', 'coffee'];

export function computeGlobals(owned: string[]): Globals {
  const g: Globals = {
    speed: { human: 1, ai: 1, tool: 1 },
    bugs: { human: 1, ai: 1, tool: 1 },
    reviewSpeed: { human: 1, ai: 1, tool: 1 },
    catchAdd: { human: 0, ai: 0, tool: 0 },
    value: 1,
    incidentCost: 1,
    incidentInsight: 1,
    insight: 1,
    token: 1,
    debtImpact: 0.5,
    clickPower: 1,
    teamCap: { human: 8, ai: 10, tool: 10 },
    unlocks: new Set(BASE_UNLOCKS),
    rsi: false,
  };
  for (const id of owned) {
    const s = SKILL_MAP[id];
    if (!s) continue;
    if (s.unlock) g.unlocks.add(s.unlock);
    s.apply?.(g);
  }
  return g;
}
