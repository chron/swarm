import { useEffect, useState } from 'react';

/** Short reminders shown when hovering stat icons. Anything with a data-hint attribute gets one. */
export const HINT = {
  loc: 'Lines of code per second. Every line that reaches Production earns $.',
  bugs: '🐞 Bugs per 100 lines written. Bugs that reach Production pile up and cause incidents. Reviewers catch them.',
  tokens: '💸 Token cost: $ spent on every PR. If you run out of cash, AI producers stall.',
  catch: '🔍 Catch rate: the share of bugs this reviewer finds. Every caught bug earns 💡 Insight.',
  queue: 'Review queue. When it fills up, producers upstream have to wait.',
  debt: '🐌 Tech debt: unreviewed code slows every producer and makes their code buggier. Route more code through review.',
  lurking: 'Bugs that slipped into Production. Enough of them cause an incident: costly, but you learn a little 💡.',
  value: '$ earned for every line shipped. Product Managers raise it.',
  focus: 'Focus: mash your keyboard to amplify your boost. It drains over time.',
  cash: '$ Cash: earned for every line shipped to Production. Spend it in the shop and on hires.',
  insight: '💡 Insight: earned by catching bugs (and from incident postmortems). Spend it in the Skill Tree.',
  shipped: 'Your goal: ship one billion lines of code.',
  human: 'How much of everything shipped was written by humans.',
  boost: '◆ How many nodes this booster is plugged into, out of how many it can power.',
  router: 'PRs with more bugs than this go out the risky jack. The rest take the safe jack.',
} as const;

export function HintLayer() {
  const [hint, setHint] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null);
  useEffect(() => {
    let el: Element | null = null;
    const over = (e: MouseEvent) => {
      const t = (e.target as Element | null)?.closest?.('[data-hint]') ?? null;
      if (t === el) return;
      el = t;
      if (!t) return setHint(null);
      const r = t.getBoundingClientRect();
      const below = r.top < 120;
      setHint({ text: t.getAttribute('data-hint') ?? '', x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below });
    };
    const hide = () => {
      el = null;
      setHint(null);
    };
    document.addEventListener('mouseover', over);
    document.addEventListener('mousedown', hide);
    window.addEventListener('wheel', hide);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('mousedown', hide);
      window.removeEventListener('wheel', hide);
    };
  }, []);
  if (!hint) return null;
  const x = Math.max(140, Math.min(window.innerWidth - 140, hint.x));
  return (
    <div className={`hint ${hint.below ? 'below' : ''}`} style={{ left: x, top: hint.y }}>
      {hint.text}
    </div>
  );
}
