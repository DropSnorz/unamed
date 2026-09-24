# unamed

A procedural space exploration game played from the cockpit of a retro-futuristic
scout ship. Every universe is generated from a seed: hundreds of constellations
linked by hyperlanes, thousands of star systems, and planets on real orbits.

## Playing

The ship boots dark. Only the terminal (bottom left) and the **IGNITION** button
are powered. Type `init` or press IGNITION to generate a universe. The cockpit
then comes to life.

Everything you can do in the terminal, you can also do with the cockpit controls,
and the other way around. A control types its command into the terminal (you
see it and hear it), and a typed command drives the cockpit (lamps, screens,
viewport).

| Command | Cockpit control | Effect |
| --- | --- | --- |
| `init [--seed SEED] [--size N]` | IGNITION | Generate a new cluster |
| `scan` | SCAN | Reveal orbital bodies, nearby stars and hyperlane gates |
| `jump TARGET` | SELECT knob / signature list / sector map, then lift the cover and press JUMP | Travel to a revealed signature |
| `help` | MANUAL | List commands (`command --help` for details) |
| `clear` | CLR | Clear the terminal |

Terminal niceties: command history (↑/↓), Tab completion for commands and jump
targets, `Ctrl+L` to clear. Typing anywhere sends keys to the terminal.

The NAV display has three modes. SYS is an orrery of the current system (it
needs a scan). SEC is the sector map, with the scan sweep and the target lock.
CLU is the cluster chart of everything you have charted.

Gauges, auxiliary switches (shields, comms, drones...) and some caution lights
already work, but they are only wired to placeholder ship state
(`useGameStore().ship`). They are there for upcoming mechanics.

## Project layout

```
src/
  engine/        Pure JS game engine (no Vue): seeded generators, cluster queries
    generators/  cluster -> constellation -> system (star, planets)
  commands/      Terminal commands: metadata (usage, options) + async run()
  stores/        Pinia: game state, terminal (execution/history), cockpit UI
  audio/         Procedural WebAudio sound effects (no assets)
  components/
    Cockpit.vue  Layout and control wiring
    cockpit/     Instruments: CRT screens, gauges, lamps, buttons, maps, viewport
    terminal/    CRT terminal
tests/           Vitest: engine determinism/connectivity, command pipeline
```

Data flows one way. Commands mutate the game store, and every instrument renders
from the store. To add a command, create a module in `src/commands/` and
register it in `src/commands/index.js`. Its `--help` is generated from the
module's metadata. To add an instrument, read from `useGameStore()`. A control
triggers a command with `useTerminalStore().dispatch('command args')`.

The generated cluster is plain serializable data (IDs, no circular references),
wrapped by `ClusterMap` for lookups. The same seed always produces the same
universe.

## Development

```
npm install
npm run dev       # dev server with hot reload
npm test          # unit tests (Vitest)
npm run lint      # ESLint
npm run build     # production build (deployed to GitHub Pages on master)
npm run preview   # serve the production build locally
```
