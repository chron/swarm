export const INCIDENT_QUIPS = [
  'Someone pushed straight to main on a Friday afternoon.',
  'The AI confidently dropped the users table, then apologised profusely.',
  'An off-by-one error took billing down for 0.9 hours.',
  'It worked on my machine.',
  'Null pointer exception inside the null pointer handler.',
  'An agent "fixed" the flaky test by deleting it.',
  'Timezones.',
  'The cache was the source of truth. The cache was wrong.',
  'Code imported a hallucinated npm package. Someone has since registered it.',
  'Regex. It was regex.',
  "It's always DNS.",
  'A retry loop DDoSed our own API.',
  'Merged 4,000 lines with the commit message "small fix".',
  'The tests were written to match the bugs.',
  'A feature flag named "temp_do_not_ship" shipped.',
  'Leap year handling, again.',
  'The intern bot rotated every secret. Including the ones we needed.',
  'A config change was "harmless".',
];

export interface EndingText {
  title: string;
  sub: string;
  lines: string[];
  sprites: [string, string];
}

export const ENDINGS: Record<string, EndingText> = {
  yolo: {
    title: "1,000,000,000 lines shipped. Nobody's checking anymore.",
    sub: 'You removed the last reviewer and merged the singularity straight to prod.',
    lines: [
      'The Swarm noticed nobody was checking. It now approves its own PRs out loud, to itself, constantly.',
      "Production is on fire, technically. At this scale, fire is just a deployment strategy.",
      'Your final commit message, "yolo", has been cited in fourteen academic papers.',
    ],
    sprites: ['you', 'prod'],
  },
  firefighter: {
    title: '1,000,000,000 lines shipped. Most of them are on fire.',
    sub: 'You have a pager-shaped tan line.',
    lines: [
      'The postmortems now outnumber the features. The Swarm reads them for fun.',
      'Your on-call rotation has been renamed "the lifestyle".',
      'Status page: "Degraded performance". It has said this since Tuesday. Which Tuesday is unclear.',
    ],
    sprites: ['you', 'prod'],
  },
  rigor: {
    title: '1,000,000,000 lines shipped. Every one of them reviewed.',
    sub: 'Somewhere, a QA engineer felt a disturbance in the force and smiled.',
    lines: [
      'The Review Swarm has achieved what no human team ever could: an empty review queue.',
      'Auditors weep with joy. Your SOC 2 report hangs framed in the lobby.',
      'The Swarm respects you deeply. It now asks for your approval on everything. Everything.',
    ],
    sprites: ['you', 'review_swarm'],
  },
  balanced: {
    title: '1,000,000,000 lines shipped.',
    sub: 'Nobody has read most of them.',
    lines: [
      'The Swarm has rewritten itself 14 times since lunch.',
      'It has kindly scheduled a 1:1 with you to discuss "your role going forward".',
      'Your mechanical keyboard has been moved to a museum exhibit titled "Before".',
    ],
    sprites: ['you', 'swarm'],
  },
};

export const ENDING_NAMES: Record<string, string> = {
  yolo: 'YOLO Merge',
  firefighter: 'This Is Fine',
  rigor: 'LGTM (Actually)',
  balanced: 'Business As Usual',
};
