// 16x16 pixel sprites. Each frame is 16 rows of 16 chars; '.' is transparent.
export interface SpriteDef {
  palette: Record<string, string>;
  frames: string[][];
  fps: number;
}

const BASE: Record<string, string> = {
  k: '#14141f',
  S: '#f1c27d',
  E: '#1d1d2b',
  M: '#a8434b',
  W: '#f4f4f8',
  L: '#c8ccd6',
  l: '#7c8597',
  G: '#101018',
};

type Rows = string[];
const patch = (rows: Rows, over: Record<number, string>): Rows => rows.map((r, i) => over[i] ?? r);

// ---------------------------------------------------------------- humans
const HUMAN: Rows = [
  '................',
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '....HSSSSSSH....',
  '....SSSSSSSS....',
  '....SEESSEES....',
  '....SSSSSSSS....',
  '.....SSMMSS.....',
  '......SSSS......',
  '....TTTTTTTT....',
  '...TTTTTTTTTT...',
  '..TTTTTTTTTTTT..',
  '..TTLLLLLLLLTT..',
  '..SSLLLWWLLLSS..',
  '....LLLLLLLL....',
  '..llllllllllll..',
];
const LEFT_UP = { 12: '..SSLLLLLLLLTT..', 13: '..TTLLLWWLLLSS..' };
const RIGHT_UP = { 12: '..TTLLLLLLLLSS..', 13: '..SSLLLWWLLLTT..' };

function typing(rows: Rows): string[][] {
  return [rows, patch(rows, LEFT_UP), rows, patch(rows, RIGHT_UP)];
}

const you = HUMAN;
const junior = patch(HUMAN, {
  0: '................',
  1: '.....CCCCCC.....',
  2: '....CCCCCCCCCC..',
});
const tenx = patch(HUMAN, {
  1: '....PHHHHHHP....',
  2: '...PHHHHHHHHP...',
  3: '...PHSSSSSSHP...',
  4: '...PSSSSSSSSP...',
  5: '....GGGSSGGG....',
});
const senior = patch(HUMAN, {
  1: '.....SSSSSS.....',
  2: '....HSSSSSSH....',
  5: '...GGGGGGGGGG...',
  6: '....SBBBBBBS....',
  7: '.....BBMMBB.....',
  8: '......BBBB......',
});
const pm = patch(HUMAN, {
  3: '...HHSSSSSSHH...',
  4: '...HSSSSSSSSH...',
  5: '...HSEESSEESH...',
  6: '...HSSSSSSSSH...',
  7: '...HHSSMMSSHH...',
  8: '...HH.SSSS.HH...',
  12: '..TTkkkkkkkkTT..',
  13: '..SSkWWWWWWkSS..',
  14: '....kWgWgWWk....',
  15: '....kkkkkkkk....',
});

// ---------------------------------------------------------------- robots
const ROBOT: Rows = [
  '.......rr.......',
  '.......AA.......',
  '...MMMMMMMMMM...',
  '...MBBBBBBBBM...',
  '...MBEEBBEEBM...',
  '...MBEEBBEEBM...',
  '...MBBBBBBBBM...',
  '...MBBGGGGBBM...',
  '...MMMMMMMMMM...',
  '......NNNN......',
  '....DDDDDDDD....',
  '...DDDDDDDDDD...',
  '..DDLLLLLLLLDD..',
  '..ddLLLWWLLLdd..',
  '....LLLLLLLL....',
  '..llllllllllll..',
];
const BLINK = { 4: '...MBBBBBBBBM...', 5: '...MBEEBBEEBM...' };
const R_LEFT = { 12: '..ddLLLLLLLLDD..', 13: '..DDLLLWWLLLdd..' };
const R_RIGHT = { 12: '..DDLLLLLLLLdd..', 13: '..ddLLLWWLLLDD..' };
const robotTyping = (rows: Rows) => [rows, patch(rows, R_LEFT), patch(rows, BLINK), patch(rows, R_RIGHT)];

const chatbot = patch(ROBOT, {
  0: '...........kkkk.',
  1: '.......AA.kWkWkk',
  2: '....MMMMMMMMkkk.',
  8: '....MMMMMMMM....',
});
const agent = ROBOT;
const VISOR = (row5: string) => patch(ROBOT, { 4: '...MBBBBBBBBM...', 5: row5, 6: '...MBBBBBBBBM...' });
const reviewerFrames = [
  VISOR('...MWEEEEEEEM...'),
  VISOR('...MEEEWEEEEM...'),
  VISOR('...MEEEEEEWEM...'),
  VISOR('...MEEEWEEEEM...'),
];
const orchestrator = patch(ROBOT, {
  0: '.....hhhhhh.....',
  1: '.....hrrrrh.....',
  2: '...hhhhhhhhhh...',
  12: '..DDLLLLLLLLDDw.',
  13: '..ddLLLWWLLLddw.',
});
const orchestratorAlt = patch(orchestrator, { 11: '...DDDDDDDDDDw..', 12: '..DDLLLLLLLLdd..', 13: '..ddLLLWWLLLDD..' });

const cloud: Rows = [
  '................',
  '...r....r....r..',
  '..MMM..MMM..MMM.',
  '..MEM..MEM..MEM.',
  '..MMM..MMM..MMM.',
  '................',
  '.....WWW........',
  '...WWWWWWW.WW...',
  '..WWWWWWWWWWWW..',
  '.WWWWWWWWWWWWWW.',
  '.WWWWWWWWWWWWWW.',
  '.wWWWWWWWWWWWWw.',
  '..wwwwwwwwwwww..',
  '....z...z...z...',
  '..z...z...z.....',
  '................',
];
const cloudAlt = patch(cloud, {
  3: '..MMM..MEM..MMM.',
  13: '..z...z...z.....',
  14: '....z...z...z...',
});

const SW_A = '.MMM.MMM.MMM.MMM';
const SW_B = '.MEM.MEM.MEM.MEM';
const SW_C = 'MMM.MMM.MMM.MMM.';
const SW_D = 'MEM.MEM.MEM.MEM.';
const blank = '................';
const swarm: Rows = [blank, SW_A, SW_B, SW_A, blank, SW_C, SW_D, SW_C, blank, SW_A, SW_B, SW_A, blank, SW_C, SW_D, SW_C];
const swarmAlt: Rows = [blank, SW_C, SW_D, SW_C, blank, SW_A, SW_B, SW_A, blank, SW_C, SW_D, SW_C, blank, SW_A, SW_B, SW_A];

// ---------------------------------------------------------------- things
const prod: Rows = [
  '..kkkkkkkkkkkk..',
  '..kRRRRRRRRRRk..',
  '..kRgaRrrrrrRk..',
  '..kRRRRRRRRRRk..',
  '..kRbgRrrrrrRk..',
  '..kRRRRRRRRRRk..',
  '..kRgaRrrrrrRk..',
  '..kRRRRRRRRRRk..',
  '..kRagRrrrrrRk..',
  '..kRRRRRRRRRRk..',
  '..kRgbRrrrrrRk..',
  '..kRRRRRRRRRRk..',
  '..kRgaRrrrrrRk..',
  '..kRRRRRRRRRRk..',
  '..kkkkkkkkkkkk..',
  '...kk......kk...',
];
const prodAlt = prod.map((r) => r.replace(/g/g, '#').replace(/a/g, 'g').replace(/#/g, 'a'));

const coffee: Rows = [
  '................',
  '.....v...v......',
  '......v...v.....',
  '.....v...v......',
  '................',
  '..kkkkkkkkkkk...',
  '..kccccccccckkk.',
  '..kWWWWWWWWWk.k.',
  '..kWWWWWWWWWk.k.',
  '..kWWWRRRWWWk.k.',
  '..kWWWWRWWWWkkk.',
  '..kWWWWWWWWWk...',
  '...kWWWWWWWk....',
  '....kkkkkkk.....',
  '................',
  '................',
];
const coffeeAlt = patch(coffee, { 1: '......v...v.....', 2: '.....v...v......', 3: '......v...v.....' });

const stackoverflow: Rows = [
  '................',
  '................',
  '..........OO....',
  '........OO......',
  '................',
  '......OOOOO.....',
  '....OOOO........',
  '................',
  '..g.OOOOOOOO.g..',
  '..g..........g..',
  '..g.OOOOOOOO.g..',
  '..g..........g..',
  '..gggggggggggg..',
  '................',
  '................',
  '................',
];

const autocomplete: Rows = [
  '................',
  '................',
  '.kkkkkkkkkkkkkk.',
  '.kWWWWWWWWWWWWk.',
  '.kWaaaWWaWWaaWk.',
  '.kWWaWWaWaWaWak.',
  '.kWWaWWaaaWaaWk.',
  '.kWWaWWaWaWaWak.',
  '.kWWaWWaWaWaaWk.',
  '.kWWWWWWWWWWWWk.',
  '.kLLLLLLLLLLLLk.',
  '.kkkkkkkkkkkkkk.',
  '................',
  '................',
  '................',
  '................',
];
const autocompletePressed = [blank, ...autocomplete.slice(0, 15)];

const context: Rows = [
  '................',
  '................',
  '..kkkkkkkkkkkk..',
  '..kBBBBBBBBBBk..',
  '..kBYYYYYYYYBk..',
  '..kBBBBBBBBBBk..',
  '..kBBYYYYYYBBk..',
  '..kBBBBBBBBBBk..',
  '..kBBBBBBBBBBk..',
  '..kBBBBBBBBBBk..',
  '..kBBBBBBBBBBk..',
  '..kkkkkkkkkkkk..',
  '..kWWWWWWWWWWk..',
  '..kWlWlWlWlWlk..',
  '..kkkkkkkkkkkk..',
  '................',
];

const gpu: Rows = [
  '................',
  '................',
  '................',
  '.kkkkkkkkkkkkkk.',
  '.kGGGGGGGGGGGGk.',
  '.kGkkkkGGkkkkGk.',
  '.kGkFfkGGkFfkGk.',
  '.kGkfFkGGkfFkGk.',
  '.kGkkkkGGkkkkGk.',
  '.kGGGGRRRRGGGGk.',
  '.kkkkkkkkkkkkkk.',
  '..y.y.y.y.y.y...',
  '................',
  '................',
  '................',
  '................',
];
const gpuAlt = patch(gpu, { 6: '.kGkfFkGGkfFkGk.', 7: '.kGkFfkGGkFfkGk.' });

const linter: Rows = [
  '................',
  '...kkkkkkkk.....',
  '...kWWWWWWkk....',
  '...kWllllWWkk...',
  '...kWWWWWWWWk...',
  '...kWllllllWk...',
  '...kWrWrWrWWk...',
  '...kWWrWrWrWk...',
  '...kWllllWWWk...',
  '...kWWWWWWWWk...',
  '...kWlllllWWk...',
  '...kWrWrWrWWk...',
  '...kWWrWrWrWk...',
  '...kWWWWWWWWk...',
  '...kkkkkkkkkk...',
  '................',
];
const linterAlt = patch(linter, { 6: '...kWWrWrWrWk...', 7: '...kWrWrWrWWk...', 11: '...kWWrWrWrWk...', 12: '...kWrWrWrWWk...' });

const tests: Rows = [
  '................',
  '.....kkkkkk.....',
  '......kWWk......',
  '......kWWk......',
  '......kWWk......',
  '.....kWWWWk.....',
  '....kWWWWWWk....',
  '...kWWWWWWWWk...',
  '...kggggggggk...',
  '..kggbgggggggk..',
  '..kgggggggbggk..',
  '..kggggbgggggk..',
  '..kggggggggggk..',
  '...kkkkkkkkkk...',
  '................',
  '................',
];
const testsAlt = patch(tests, {
  7: '...kWWbWWWWWk...',
  8: '...kgggggbggk...',
  9: '..kggggggggggk..',
  10: '..kgggbgggggk..'.padEnd(16, '.'),
  11: '..kggggggggbgk..',
});

const ci: Rows = [
  '................',
  '.......kk.......',
  '...k..kGGk..k...',
  '..kGk.kGGk.kGk..',
  '...kGkGGGGkGk...',
  '....kGGGGGGk....',
  '.kkkGGGkkGGGkkk.',
  '.kGGGGk..kGGGGk.',
  '.kGGGGk..kGGGGk.',
  '.kkkGGGkkGGGkkk.',
  '....kGGGGGGk....',
  '...kGkGGGGkGk...',
  '..kGk.kGGk.kGk..',
  '...k..kGGk..k...',
  '.......kk.......',
  '................',
];

const router: Rows = [
  '................',
  '.......kk.......',
  '...RRRRRRRRRR...',
  '...RWRRRRRRRRR..',
  '...RRRRRRRRRR...',
  '.......kk.......',
  '.......kk.......',
  '...GGGGGGGGGG...',
  '...GWGGGGGGGGG..',
  '...GGGGGGGGGG...',
  '.......kk.......',
  '.......kk.......',
  '.......kk.......',
  '.....kkkkkk.....',
  '................',
  '................',
];

// ---------------------------------------------------------------- registry
const human = (hair: string, shirt: string, extra: Record<string, string> = {}) => ({ ...BASE, H: hair, T: shirt, ...extra });
const robot = (metal: string, screen: string, eye: string, extra: Record<string, string> = {}) => ({
  ...BASE,
  M: metal,
  B: screen,
  E: eye,
  G: eye,
  A: '#9ca3af',
  r: '#ef4444',
  N: '#475569',
  D: metal,
  d: '#334155',
  ...extra,
});

export const SPRITES: Record<string, SpriteDef> = {
  you: { palette: human('#6b4226', '#3b82f6'), frames: typing(you), fps: 10 },
  junior: { palette: human('#f2d04b', '#22c55e', { C: '#ef4444' }), frames: typing(junior), fps: 8 },
  tenx: { palette: human('#1f1f1f', '#111827', { P: '#e11d48' }), frames: typing(tenx), fps: 14 },
  senior: {
    palette: human('#b8bcc4', '#8b5cf6', { B: '#cfd3da' }),
    frames: [senior, patch(senior, { 5: '...GGGGGGGGGG...' }), patch(senior, { 13: '..SSLLLWWLLLTT..' }), senior],
    fps: 3,
  },
  pm: { palette: human('#d97706', '#f43f5e', { g: '#22c55e' }), frames: [pm, patch(pm, { 14: '....kWWgWgWk....' })], fps: 2 },
  chatbot: { palette: robot('#60a5fa', '#0b1a33', '#7dd3fc'), frames: robotTyping(chatbot), fps: 8 },
  agent: { palette: robot('#94a3b8', '#1e293b', '#22d3ee'), frames: robotTyping(agent), fps: 12 },
  ai_reviewer: { palette: robot('#a78bfa', '#1e1b4b', '#c084fc', { W: '#fdf4ff' }), frames: reviewerFrames, fps: 8 },
  orchestrator: { palette: robot('#f59e0b', '#1c1917', '#fde047', { h: '#111111', w: '#f4f4f8' }), frames: [orchestrator, orchestratorAlt], fps: 4 },
  cloud: { palette: { M: '#94a3b8', E: '#22d3ee', r: '#ef4444', W: '#e2e8f0', w: '#94a3b8', z: '#38bdf8' }, frames: [cloud, cloudAlt], fps: 4 },
  swarm: { palette: { M: '#64748b', E: '#f43f5e' }, frames: [swarm, swarmAlt], fps: 6 },
  review_swarm: { palette: { M: '#7c3aed', E: '#4ade80' }, frames: [swarm, swarmAlt], fps: 6 },
  prod: { palette: { ...BASE, R: '#334155', r: '#0f172a', g: '#4ade80', a: '#facc15', b: '#38bdf8' }, frames: [prod, prodAlt], fps: 4 },
  coffee: { palette: { ...BASE, c: '#6b3e26', v: '#cbd5e1', R: '#ef4444' }, frames: [coffee, coffeeAlt], fps: 3 },
  stackoverflow: { palette: { O: '#f48024', g: '#bcbbbb' }, frames: [stackoverflow], fps: 1 },
  autocomplete: { palette: { ...BASE, a: '#1d4ed8' }, frames: [autocomplete, autocompletePressed], fps: 3 },
  context: { palette: { ...BASE, B: '#2563eb', Y: '#facc15' }, frames: [context], fps: 1 },
  gpu: { palette: { ...BASE, G: '#166534', F: '#e5e7eb', f: '#6b7280', R: '#4ade80', y: '#facc15' }, frames: [gpu, gpuAlt], fps: 12 },
  linter: { palette: { ...BASE, r: '#ef4444' }, frames: [linter, linterAlt], fps: 3 },
  tests: { palette: { ...BASE, g: '#4ade80', b: '#bbf7d0' }, frames: [tests, testsAlt], fps: 3 },
  ci: { palette: { ...BASE, G: '#94a3b8' }, frames: [ci], fps: 1 },
  router: { palette: { ...BASE, R: '#ef4444', G: '#22c55e' }, frames: [router], fps: 1 },
};
