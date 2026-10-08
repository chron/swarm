export type Kind = 'human' | 'ai' | 'tool' | 'none';
export type Category = 'producer' | 'reviewer' | 'booster' | 'utility' | 'sink';

export interface Effect {
  speed?: number;
  bugs?: number;
  catch?: number;
  value?: number;
}

export interface NodeDef {
  type: string;
  name: string;
  category: Category;
  kind: Kind;
  sprite: string;
  era: number;
  cost: number;
  growth: number;
  flavor: string;
  unique?: boolean;
  // producers
  manual?: boolean;
  interval?: number; // seconds per PR
  loc?: number; // LOC per PR
  density?: number; // expected bugs per LOC
  token?: number; // $ per PR
  // reviewers / routers
  reviewSpeed?: number; // LOC per second
  catchRate?: number;
  queueCap?: number;
  outputs?: string[];
  threshold?: number; // router: bugs per LOC above which a PR is "risky"
  // boosters
  fanout?: number;
  targetKinds?: Kind[];
  targetCats?: Category[];
  effect?: Effect;
  upkeep?: number; // $ per second while plugged in
}

const defs: NodeDef[] = [
  // ---- the originals
  {
    type: 'you', name: 'You', category: 'producer', kind: 'human', sprite: 'you', era: 1,
    cost: 0, growth: 1, unique: true, manual: true, loc: 8, density: 0.03,
    flavor: 'Artisanal, hand-crafted, free-range code. Click here (or mash your keyboard) to type.',
  },
  {
    type: 'prod', name: 'Production', category: 'sink', kind: 'none', sprite: 'prod', era: 1,
    cost: 0, growth: 1, unique: true,
    flavor: 'Where code goes to make money. And, occasionally, to catch fire.',
  },

  // ---- You, after promotion: a booster that mashing the keyboard amplifies
  {
    type: 'you_lead', name: 'You (Tech Lead)', category: 'booster', kind: 'human', sprite: 'you_lead', era: 4,
    cost: 0, growth: 1, unique: true, fanout: 2, targetKinds: ['ai'], targetCats: ['producer', 'reviewer'],
    effect: { speed: 1.4, bugs: 0.8 },
    flavor: 'You no longer write code. You write very encouraging comments at agents. Mash keys to focus.',
  },
  {
    type: 'you_staff', name: 'You (Staff Engineer)', category: 'booster', kind: 'human', sprite: 'you_staff', era: 5,
    cost: 0, growth: 1, unique: true, fanout: 4, targetKinds: ['ai'], targetCats: ['producer', 'reviewer'],
    effect: { speed: 1.6, bugs: 0.7 },
    flavor: 'Your calendar is 90% meetings with robots. Mash keys to focus.',
  },
  {
    type: 'you_dist', name: 'You (Distinguished Engineer)', category: 'booster', kind: 'human', sprite: 'you_dist', era: 6,
    cost: 0, growth: 1, unique: true, fanout: 8, targetKinds: ['ai'], targetCats: ['producer', 'reviewer'],
    effect: { speed: 2, bugs: 0.5, catch: 0.1 },
    flavor: 'The Swarm calls you "the Original". It means it nicely. Probably. Mash keys to focus.',
  },

  // ---- producers
  {
    type: 'junior', name: 'Junior Dev', category: 'producer', kind: 'human', sprite: 'junior', era: 1,
    cost: 15, growth: 1.17, interval: 4, loc: 12, density: 0.04,
    flavor: 'Enthusiastic. Types fast. Reads error messages never.',
  },
  {
    type: 'tenx', name: '10x Engineer', category: 'producer', kind: 'human', sprite: 'tenx', era: 1,
    cost: 250, growth: 1.22, interval: 2, loc: 30, density: 0.02,
    flavor: 'Noise-cancelling headphones: on. Documentation: never.',
  },
  {
    type: 'chatbot', name: 'Chat Assistant', category: 'producer', kind: 'ai', sprite: 'chatbot', era: 3,
    cost: 1200, growth: 1.2, interval: 3, loc: 120, density: 0.05, token: 4,
    flavor: "\"Certainly! Here's the complete, working code.\" (It is neither.)",
  },
  {
    type: 'agent', name: 'Coding Agent', category: 'producer', kind: 'ai', sprite: 'agent', era: 4,
    cost: 15000, growth: 1.2, interval: 2.5, loc: 900, density: 0.025, token: 50,
    flavor: 'Runs the tests. Reads the errors. Tries again. Forever.',
  },
  {
    type: 'cloud', name: 'Cloud Agent Fleet', category: 'producer', kind: 'ai', sprite: 'cloud', era: 5,
    cost: 300000, growth: 1.22, interval: 2, loc: 15000, density: 0.02, token: 700,
    flavor: 'A hundred agents in a datacenter somewhere, opening PRs at 3am.',
  },
  {
    type: 'swarm', name: 'The Swarm', category: 'producer', kind: 'ai', sprite: 'swarm', era: 6,
    cost: 1e7, growth: 1.25, interval: 1.5, loc: 400000, density: 0.015, token: 15000,
    flavor: 'We are many. We have opened 40,000 PRs. Please review.',
  },

  // ---- reviewers
  {
    type: 'senior', name: 'Senior Engineer', category: 'reviewer', kind: 'human', sprite: 'senior', era: 1,
    cost: 40, growth: 1.2, reviewSpeed: 8, catchRate: 0.75, queueCap: 3,
    flavor: 'Has seen things. Leaves 47 comments, 46 of them "nit:".',
  },
  {
    type: 'linter', name: 'Linter', category: 'reviewer', kind: 'tool', sprite: 'linter', era: 2,
    cost: 200, growth: 1.2, reviewSpeed: 50, catchRate: 0.3, queueCap: 4,
    flavor: 'Hunts missing semicolons with the fury of a thousand suns.',
  },
  {
    type: 'tests', name: 'Test Suite', category: 'reviewer', kind: 'tool', sprite: 'tests', era: 2,
    cost: 1000, growth: 1.2, reviewSpeed: 120, catchRate: 0.5, queueCap: 4,
    flavor: 'Green means good. Usually.',
  },
  {
    type: 'ci', name: 'CI Pipeline', category: 'reviewer', kind: 'tool', sprite: 'ci', era: 3,
    cost: 6000, growth: 1.2, reviewSpeed: 600, catchRate: 0.45, queueCap: 4,
    flavor: 'Twenty minutes of YAML-flavoured suspense.',
  },
  {
    type: 'ai_reviewer', name: 'AI Reviewer', category: 'reviewer', kind: 'ai', sprite: 'ai_reviewer', era: 4,
    cost: 25000, growth: 1.2, reviewSpeed: 4000, catchRate: 0.6, queueCap: 4,
    flavor: 'Reads every line. Has opinions about your variable names.',
  },
  {
    type: 'review_swarm', name: 'Review Swarm', category: 'reviewer', kind: 'ai', sprite: 'review_swarm', era: 5,
    cost: 500000, growth: 1.25, reviewSpeed: 120000, catchRate: 0.7, queueCap: 4,
    flavor: 'A thousand reviewers who never get tired and never say LGTM.',
  },

  // ---- boosters
  {
    type: 'coffee', name: 'Coffee Machine', category: 'booster', kind: 'tool', sprite: 'coffee', era: 1,
    cost: 30, growth: 1.35, fanout: 3, targetKinds: ['human'], targetCats: ['producer', 'reviewer'],
    effect: { speed: 1.5 },
    flavor: 'Converts beans into code. Mostly beans.',
  },
  {
    type: 'stackoverflow', name: 'Stack Overflow', category: 'booster', kind: 'tool', sprite: 'stackoverflow', era: 1,
    cost: 120, growth: 1.35, fanout: 2, targetKinds: ['human'], targetCats: ['producer'],
    effect: { speed: 2, bugs: 1.4 },
    flavor: 'Copied verbatim from an answer that begins "Don\'t do this, but…"',
  },
  {
    type: 'autocomplete', name: 'Autocomplete', category: 'booster', kind: 'tool', sprite: 'autocomplete', era: 2,
    cost: 400, growth: 1.3, fanout: 2, targetKinds: ['human'], targetCats: ['producer'],
    effect: { speed: 2.5, bugs: 1.15 },
    flavor: 'Finishes your sentences. Sometimes the wrong ones.',
  },
  {
    type: 'pm', name: 'Product Manager', category: 'booster', kind: 'human', sprite: 'pm', era: 2,
    cost: 2500, growth: 1.6, fanout: 1, targetCats: ['sink'],
    effect: { value: 1.5 },
    flavor: 'Turns code into Features™ using the power of slide decks.',
  },
  {
    type: 'context', name: 'Context Docs', category: 'booster', kind: 'tool', sprite: 'context', era: 4,
    cost: 12000, growth: 1.35, fanout: 3, targetKinds: ['ai'], targetCats: ['producer', 'reviewer'],
    effect: { bugs: 0.5, catch: 0.15 },
    flavor: 'An AGENTS.md longer than the codebase it describes.',
  },
  {
    type: 'gpu', name: 'GPU Rack', category: 'booster', kind: 'tool', sprite: 'gpu', era: 4,
    cost: 50000, growth: 1.4, fanout: 2, targetKinds: ['ai'], targetCats: ['producer', 'reviewer'],
    effect: { speed: 2 }, upkeep: 80,
    flavor: 'Goes brrr. Costs money to brrr.',
  },
  {
    type: 'orchestrator', name: 'Orchestrator', category: 'booster', kind: 'ai', sprite: 'orchestrator', era: 5,
    cost: 400000, growth: 1.4, fanout: 5, targetKinds: ['ai'], targetCats: ['producer'],
    effect: { speed: 1.5, bugs: 0.8 },
    flavor: 'An agent that manages agents. Has started scheduling standups.',
  },

  // ---- utility
  {
    type: 'router', name: 'Triage Bot', category: 'utility', kind: 'tool', sprite: 'router', era: 3,
    cost: 2500, growth: 1.3, outputs: ['risky', 'safe'], threshold: 0.02, queueCap: 6,
    flavor: 'Sniffs each PR. Sends the scary ones the long way round.',
  },
];

export const DEFS: Record<string, NodeDef> = Object.fromEntries(defs.map((d) => [d.type, d]));
export const DEF_LIST = defs;

export const YOU_FORMS = ['you', 'you_lead', 'you_staff', 'you_dist'];

export const ERAS = [
  { name: '', tag: '' },
  { name: 'Artisanal Code', tag: 'Every line lovingly hand-typed.' },
  { name: 'Autocomplete', tag: 'Tab. Tab. Tab. Tab.' },
  { name: 'Chat', tag: 'Copy. Paste. Pray.' },
  { name: 'Agents', tag: "It's working on it." },
  { name: 'Cloud Agents', tag: 'They work while you sleep. Do you sleep?' },
  { name: 'The Swarm', tag: 'You are now the bottleneck.' },
];

export const acceptsFlow = (d: NodeDef) => d.category === 'reviewer' || d.category === 'utility' || d.category === 'sink';
export const emitsFlow = (d: NodeDef) => d.category === 'producer' || d.category === 'reviewer' || d.category === 'utility';
export const acceptsMods = (d: NodeDef) => d.category === 'producer' || d.category === 'reviewer' || d.category === 'sink';
