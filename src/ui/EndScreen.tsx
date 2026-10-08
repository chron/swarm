import { game, type FinalStats } from '../game/engine';
import { ENDINGS, ENDING_NAMES } from '../game/flavor';
import { duration, fmt } from '../game/format';
import { Sprite } from '../sprites/Sprite';

const FIRE = { g: '#ef4444', a: '#f97316', b: '#ef4444', R: '#7f1d1d' };
const YOU_SPRITES = ['you', 'you_lead', 'you_staff', 'you_dist'];
const YOU_TITLES = ['Developer', 'Tech Lead', 'Staff Engineer', 'Distinguished Engineer'];

export function EndScreen({ onContinue }: { onContinue: () => void }) {
  const live = game.s;
  const s: FinalStats = live.final ?? {
    ending: 'balanced',
    debt: game.debt,
    youLevel: game.g.youLevel,
    time: live.wonTime,
    totalLoc: live.totalLoc,
    humanLoc: live.humanLoc,
    bugsCaught: live.bugsCaught,
    bugsShipped: live.bugsShipped,
    incidents: live.incidents,
  };
  const end = ENDINGS[s.ending];
  const human = s.humanLoc / Math.max(1, s.totalLoc);
  const extra = bonusLines(s);
  return (
    <div className="end-overlay">
      <div className={`end-card ending-${s.ending}`}>
        <div className="end-badge">ENDING: {ENDING_NAMES[s.ending]}</div>
        <div className="end-sprites">
          <Sprite id={YOU_SPRITES[s.youLevel] ?? 'you'} scale={5} />
          <Sprite id={end.sprites[1]} scale={5} frame={1} palette={end.sprites[1] === 'prod' ? FIRE : undefined} />
        </div>
        <div className="end-title">{end.title}</div>
        <div className="end-sub">{end.sub}</div>
        <div className="end-stats">
          <div><span>Time</span><b>{duration(s.time)}</b></div>
          <div><span>Your final title</span><b>{YOU_TITLES[s.youLevel]}</b></div>
          <div><span>Lines you wrote by hand</span><b>{fmt(s.humanLoc)}</b></div>
          <div><span>Hand-written share</span><b>{sharePct(human)}</b></div>
          <div><span>Bugs caught in review</span><b>{fmt(s.bugsCaught)}</b></div>
          <div><span>Bugs shipped to prod</span><b>{fmt(s.bugsShipped)}</b></div>
          <div><span>Incidents</span><b>{s.incidents}</b></div>
          <div><span>Tech debt at the end</span><b>{Math.round(s.debt * 100)}%</b></div>
        </div>
        <div className="end-lines">
          {[...end.lines, ...extra].map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <div className="end-buttons">
          <button className="btn" onClick={onContinue}>
            Keep watching the swarm
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              game.reset();
              onContinue();
            }}
          >
            Start over (by hand)
          </button>
        </div>
      </div>
    </div>
  );
}

function bonusLines(s: FinalStats) {
  const out: string[] = [];
  if (s.youLevel >= 3) out.push('As Distinguished Engineer, your job is mashing the keyboard encouragingly at agents. You have never been happier.');
  else if (s.youLevel === 0) out.push('You never got promoted. The Swarm assumes you prefer it that way. HR has questions.');
  if (s.humanLoc >= 100_000) out.push(`You personally typed ${fmt(s.humanLoc)} lines. The Swarm has framed one of them.`);
  return out;
}

/** Readable tiny percentages: 0.013%, not 1.3e-2%. */
function sharePct(x: number) {
  const p = x * 100;
  if (p === 0) return '0%';
  if (p < 0.0001) return '<0.0001%';
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(Math.min(6, 1 - Math.floor(Math.log10(p))))}%`;
}
