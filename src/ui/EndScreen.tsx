import { game } from '../game/engine';
import { ENDING_LINES } from '../game/flavor';
import { duration, fmt } from '../game/format';
import { Sprite } from '../sprites/Sprite';

export function EndScreen({ onContinue }: { onContinue: () => void }) {
  const s = game.s;
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
          <div><span>Time</span><b>{duration(s.wonTime)}</b></div>
          <div><span>Lines you wrote by hand</span><b>{fmt(s.humanLoc)}</b></div>
          <div><span>Hand-written share</span><b>{(human * 100).toPrecision(2)}%</b></div>
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
