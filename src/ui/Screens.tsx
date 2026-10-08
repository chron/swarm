import { ERAS, game } from '../game/engine';
import { duration, fmt } from '../game/format';
import { Sprite, spriteFrame } from '../sprites/Sprite';
import { useTick } from './hooks';

const PARADE = ['you', 'junior', 'tenx', 'chatbot', 'agent', 'cloud', 'swarm'];

export function TitleScreen({ onStart }: { onStart: () => void }) {
  useTick(120);
  const t = performance.now() / 1000;
  const hasSave = game.s.totalLoc > 0;
  return (
    <div className="title-screen">
      <div className="title-logo">SWARM</div>
      <div className="title-tag">An incremental game about writing code by hand. And then not.</div>
      <div className="parade">
        {PARADE.map((id, i) => (
          <div key={id} className="parade-step" style={{ animationDelay: `${i * 0.12}s` }}>
            <Sprite id={id} scale={4} frame={spriteFrame(id, t + i * 0.3, true)} />
            {i < PARADE.length - 1 && <span className="parade-arrow">→</span>}
          </div>
        ))}
      </div>
      <div className="title-buttons">
        {hasSave && (
          <button className="btn big" onClick={onStart}>
            Continue
            <small>
              Era {game.s.era} · {fmt(game.s.totalLoc)} LOC shipped
            </small>
          </button>
        )}
        <button
          className={`btn big ${hasSave ? 'ghost' : ''}`}
          onClick={() => {
            if (hasSave && !confirm('Start a new game? This wipes your current save.')) return;
            if (hasSave) game.reset();
            onStart();
          }}
        >
          New game
        </button>
      </div>
      <div className="title-foot">Mash any key to type · Esc to pause · about 15 minutes to ship a billion lines</div>
    </div>
  );
}

export function PauseScreen({ onResume, onTitle }: { onResume: () => void; onTitle: () => void }) {
  const s = game.s;
  return (
    <div className="pause-overlay" onClick={onResume}>
      <div className="pause-card" onClick={(e) => e.stopPropagation()}>
        <div className="pause-title">PAUSED</div>
        <div className="pause-sub">
          Era {s.era}: {ERAS[s.era].name} · {duration(s.time)} played · {fmt(s.totalLoc)} LOC shipped
        </div>
        <div className="controls">
          <div><b>Click You / mash keys</b><span>write code (or focus, once promoted)</span></div>
          <div><b>Drag jack → jack</b><span>plug in: ● code, ◆ boosters</span></div>
          <div><b>Click a cable → ✂</b><span>unplug (or drag its end away)</span></div>
          <div><b>+1 Hire</b><span>grow a squad; the shop buys a new one</span></div>
          <div><b>Select + Backspace</b><span>sell a node</span></div>
          <div><b>Esc</b><span>pause / close the skill tree</span></div>
        </div>
        <div className="end-buttons">
          <button className="btn" onClick={onResume}>
            Resume
          </button>
          <button className="btn ghost" onClick={onTitle}>
            Title screen
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              if (!confirm('Wipe your save and start over?')) return;
              game.reset();
              onResume();
            }}
          >
            Restart
          </button>
        </div>
      </div>
    </div>
  );
}

export function DebtVignette() {
  useTick(400);
  const slow = game.debtSlow;
  if (slow < 0.15) return null;
  return <div className="debt-vignette" style={{ ['--debt-glow' as string]: Math.min(0.7, slow * 1.2) }} />;
}
