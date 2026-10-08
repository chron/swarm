import { game } from '../game/engine';
import { ENDING_LINES } from '../game/flavor';
import { duration, fmt } from '../game/format';
import { Sprite } from '../sprites/Sprite';

export function EndScreen({ onContinue }: { onContinue: () => void }) {
  const live = game.s;
  const s = live.final ?? { ...live, time: live.wonTime };
  const human = s.humanLoc / Math.max(1, s.totalLoc);
  return (
    <div className="end-overlay">
      <div className="end-card">
        <div className="end-sprites">
          <Sprite id="you" scale={5} />
          <Sprite id="swarm" scale={5} frame={1} />
        </div>
        <div className="end-title">1,000,000,000 lines shipped.</div>
        <div className="end-sub">Nobody has read most of them.</div>
        <div className="end-stats">
          <div><span>Time</span><b>{duration(s.time)}</b></div>
          <div><span>Lines you wrote by hand</span><b>{fmt(s.humanLoc)}</b></div>
          <div><span>Hand-written share</span><b>{sharePct(human)}</b></div>
          <div><span>Bugs caught in review</span><b>{fmt(s.bugsCaught)}</b></div>
          <div><span>Bugs shipped to prod</span><b>{fmt(s.bugsShipped)}</b></div>
          <div><span>Incidents</span><b>{s.incidents}</b></div>
        </div>
        <div className="end-lines">
          {ENDING_LINES.map((l) => (
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

/** Readable tiny percentages: 0.013%, not 1.3e-2%. */
function sharePct(x: number) {
  const p = x * 100;
  if (p === 0) return '0%';
  if (p < 0.0001) return '<0.0001%';
  if (p >= 1) return `${p.toFixed(1)}%`;
  return `${p.toFixed(Math.min(6, 1 - Math.floor(Math.log10(p))))}%`;
}
