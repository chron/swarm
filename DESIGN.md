# Swarm — design notes (prototype)

An incremental game about the adoption and acceleration of AI-driven development.
You start by typing code by hand and end up commanding a swarm of autonomous cloud agents.
A playthrough takes about 15 minutes: see the whole arc, laugh at the premise, enjoy some optimising, then you're done.

## Core fantasy & tension

**Generating code is cheap; trusting it is expensive.** Producers get faster and sloppier as the eras go by.
Reviewers are the bottleneck. Most of the play is routing and balancing that flow.

## The board

A node graph, presented like a video game rather than a workflow tool: pixel-art devs at desks, robot faces on
agents, servers that blink and catch fire.

- **Code cables** (● jacks) carry **PRs**: packets of code with `loc`, `bugs` and `reviewed`.
- **Booster cables** (◆ jacks) work like modular-synth CV. A booster modifies the nodes it's plugged into.
  Each booster has a limited **fanout**, and each node has a limited number of mod jacks.
- **Squads**: producers and reviewers are squads with a headcount. The shop buys a new squad, and **+1 Hire** grows one.
  Human squads cap at 8 (the two-pizza rule) and others at 10. Orchestration raises AI squads to 25. This keeps
  some wiring without turning it into a chore.
- Each code output jack holds **one cable**. Plugging it somewhere new moves the cable. Inputs accept many.
  Boosters fan out to several nodes.
- PRs start as discrete visible packets. As throughput grows, cables turn into glowing **streams**.

### Node categories
| Category | Examples | Role |
|---|---|---|
| Producer | You, Junior Dev, 10x Engineer, Chat Assistant, Coding Agent, Cloud Agent Fleet, The Swarm | Emit PRs. Faster tiers are buggier and cost tokens ($ per PR). |
| Reviewer | Senior Engineer, Linter, Test Suite, CI Pipeline, AI Reviewer, Review Swarm | Process LOC/s and catch a % of bugs. Limited queue; back-pressure blocks upstream. |
| Booster | Coffee, Stack Overflow, Autocomplete, Product Manager, Context Docs, GPU Rack, Orchestrator | Modulate speed, bugs, catch rate or value of the nodes they're plugged into. |
| Utility | Triage Bot | Routes risky PRs and safe PRs to different outputs. |
| Sink | Production | Ships PRs and turns them into $. |

## Economy
- **$ Cash**: earned per LOC shipped. Spent on nodes, tokens and upkeep.
- **💡 Insight**: earned by catching bugs and from incident postmortems. Spent on the skill tree.
- **Bugs that reach production** pile up and trigger **incidents**, which cost cash, give a little insight and
  come with a funny postmortem.
- **Tech debt**: the share of recently shipped code that was never reviewed. It slows every producer (up to -70%)
  and makes new code buggier (up to +60%). Producers show a 🐌 badge, and the screen edge glows red when it bites.
- **Hand-written %**: how much of everything shipped was written by humans. It's the quiet punchline.

## Eras (unlocked through the skill tree)
1. Artisanal Code: every line lovingly hand-typed
2. Autocomplete: tab, tab, tab
3. Chat: copy, paste, pray
4. Agents: it's working on it
5. Cloud Agents: they work while you sleep
6. The Swarm: you are now the bottleneck

## Skill tree
A classic sprawling web with four branches leading out from "Hello, World":
**Velocity** (up), **Rigor** (right), **Product** (down), **Infra** (left).
The final skill, *Recursive Self-Improvement*, makes the swarm accelerate exponentially.

## You, later
Typing matters for the first couple of minutes. After that, the **You** skill branch promotes you to Tech Lead,
then Staff Engineer, then Distinguished Engineer. You become a booster for 2, 4, then 8 AI nodes. Mashing the keyboard
now charges **Focus**, which amplifies your boost and decays over time.

## Win & endings
Ship **1,000,000,000 LOC**. The ending depends on how you got there, judged at the moment of winning:
- **YOLO Merge**: tech debt ≥ 50% (you ripped the reviewers out and shipped straight to prod)
- **This Is Fine**: 120+ incidents, or more bugs shipped than caught
- **LGTM (Actually)**: tech debt under 15% and at least 4× more bugs caught than shipped
- **Business As Usual**: everything else
Bonus lines mention your final title and how much you typed by hand.

## Screens
Title screen (continue / new game), and Esc to pause (controls, restart, back to title).

## Tech
Vite + React + TypeScript + @xyflow/react. The simulation is a plain TS engine with no React in it. React Flow only
renders and edits the graph. Saves go to localStorage. Add `?speed=10` to the URL for faster playtesting.
