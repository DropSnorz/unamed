import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameStore } from '../src/stores/game';
import { useTerminalStore } from '../src/stores/terminal';

const text = (terminal) => terminal.lines.map((l) => l.segments.map((s) => s.text).join('')).join('\n');

async function run(terminal, query, via = 'submit') {
  const done = terminal[via](query);
  await vi.runAllTimersAsync();
  return done;
}

describe('terminal commands', () => {
  let game;
  let terminal;

  beforeEach(() => {
    vi.useFakeTimers();
    setActivePinia(createPinia());
    game = useGameStore();
    terminal = useTerminalStore();
  });

  afterEach(() => vi.useRealTimers());

  it('only exposes init/help/clear before the ship is online', async () => {
    await run(terminal, 'scan');
    expect(text(terminal)).toContain("ship systems offline. Run 'init' first.");
    await run(terminal, 'help');
    expect(text(terminal)).toContain('init');
    expect(text(terminal)).not.toMatch(/jump\s+Jump/);
    expect(terminal.prompt).toBe('root@world');
  });

  it('reports unknown commands', async () => {
    await run(terminal, 'dance');
    expect(text(terminal)).toContain('Command not found: dance');
  });

  it('generates --help from command metadata', async () => {
    await run(terminal, 'init --help');
    expect(text(terminal)).toContain('Usage: init [--seed SEED] [--size SIZE]');
    expect(game.phase).toBe('offline');
  });

  it('validates init options', async () => {
    await run(terminal, 'init --size lots');
    expect(text(terminal)).toContain('--size must be an integer');
    expect(game.phase).toBe('offline');
  });

  it('boots, scans and jumps', async () => {
    await run(terminal, 'init --seed ABC --size 20');
    expect(game.phase).toBe('online');
    expect(game.cluster.seed).toBe('ABC');
    expect(terminal.prompt).toBe(`u@${game.currentSystem.name}:#`);
    expect(game.knownTargets).toHaveLength(0);

    await run(terminal, 'scan');
    expect(game.currentScanned).toBe(true);
    expect(game.knownTargets.length).toBeGreaterThan(0);
    expect(text(terminal)).toContain('Constellation signatures');

    const target = game.knownTargets[game.knownTargets.length - 1];
    await run(terminal, `jump ${target.name.toLowerCase()}`);
    expect(game.currentSystemId).toBe(target.arrival);
    expect(game.visited.has(target.id)).toBe(true);
    expect(game.stats.jumps).toBe(1);
    expect(text(terminal)).toContain('Jump complete!');
  });

  it('refuses unknown jump targets', async () => {
    await run(terminal, 'init --size 5');
    const before = game.currentSystemId;
    await run(terminal, 'jump NOWHERE');
    expect(text(terminal)).toContain('Unknown jump target NOWHERE');
    expect(game.currentSystemId).toBe(before);
  });

  it('types cockpit dispatched commands before running them', async () => {
    const done = terminal.dispatch('help');
    await vi.advanceTimersByTimeAsync(250);
    expect(terminal.typing).toBe(true);
    expect(terminal.input.length).toBeGreaterThan(0);
    await vi.runAllTimersAsync();
    expect(await done).toBe(true);
    expect(terminal.lines[0].prompt).toBe('root@world');
    expect(text(terminal)).toContain('Available commands:');
  });

  it('ignores cockpit commands while busy', async () => {
    terminal.dispatch('help');
    expect(await terminal.dispatch('help')).toBe(false);
    await vi.runAllTimersAsync();
  });

  it('completes commands and known jump targets', async () => {
    terminal.input = 'he';
    terminal.complete();
    expect(terminal.input).toBe('help ');

    await run(terminal, 'init --size 10');
    await run(terminal, 'scan');
    const target = game.knownTargets[0];
    terminal.input = `jump ${target.name.slice(0, target.name.length - 1).toLowerCase()}`;
    const matches = terminal.complete();
    expect(matches).toContain(target.name);
  });
});
