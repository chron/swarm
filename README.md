# Swarm

A prototype incremental game about AI-driven development. You start by typing code by hand and end up running a swarm of autonomous cloud agents.
Wire producers, reviewers and boosters into pipelines, and climb the skill tree. Ship a billion lines.

```sh
npm install
npm run dev          # http://localhost:5173
```

- `?speed=10` in the URL runs the simulation faster, for playtesting.
- `npx tsx scripts/bot.ts` runs a headless bot through a full game and prints the pacing timeline.
- See [DESIGN.md](DESIGN.md) for the design notes.

Controls: click **You** (or mash your keyboard) to write code. Drag between jacks to connect nodes: ● carries code, ◆ carries booster effects.
Select a node or cable and press Backspace to sell or unplug it. Double-click a cable to unplug it.
