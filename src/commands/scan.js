export const SCAN_DURATION = 2000;

export default {
  name: 'scan',
  summary: 'Scan surrounding area',
  usage: 'scan',
  requiresOnline: true,

  async run({ print, sleep, game, sfx }) {
    const system = game.currentSystem;
    const ready = print('Initializing scanner...');
    await sleep(350);
    ready.update('Initializing scanner... ready');

    const { bodies, stars, gates } = game.signatures;
    // The sweep rotates once over the scan: ping when it passes over a signature
    const pending = [...stars, ...gates].map((t) => t.bearing / 360).sort((a, b) => a - b);

    const progress = print('Scanning area... 0%');
    game.beginScan();
    sfx.sweep();
    const start = performance.now();
    let elapsed = 0;
    while (elapsed < SCAN_DURATION) {
      await sleep(40);
      elapsed = Math.min(SCAN_DURATION, performance.now() - start);
      const ratio = elapsed / SCAN_DURATION;
      game.setScanProgress(ratio);
      progress.update(`Scanning area... ${Math.round(ratio * 100)}% ${bar(ratio)}`);
      if (pending.length && pending[0] <= ratio) {
        while (pending.length && pending[0] <= ratio) pending.shift();
        sfx.ping();
      }
    }
    game.completeScan();

    print(`Scan results for ${system.name} (class ${system.star.class}${system.star.subclass} star, ${system.star.temperature} K)`, 'accent');

    print('Orbital bodies', 'head');
    for (const planet of bodies) {
      print(row([
        planet.name.split(' ').pop(),
        planet.type,
        `${planet.orbit.toFixed(2)} AU`,
        `${planet.temperature} K`,
        planet.moons ? `${planet.moons} moon${planet.moons > 1 ? 's' : ''}` : ''
      ], [5, 10, 11, 8, 8]));
    }

    print('Reachable stars', 'head');
    if (!stars.length) print('  none', 'dim');
    for (const star of stars) print(targetRow(star, `star ${star.starClass}`, game));

    print('Constellation signatures', 'head');
    for (const gate of gates) print(targetRow(gate, 'gate', game));

    print("Use 'jump TARGET' or the navigation panel to travel.", 'dim');
  }
};

function bar(ratio) {
  const filled = Math.round(ratio * 20);
  return '[' + '#'.repeat(filled) + '.'.repeat(20 - filled) + ']';
}

function row(cells, widths) {
  return '  ' + cells.map((cell, i) => String(cell).padEnd(widths[i])).join('');
}

function targetRow(target, detail, game) {
  const segments = [
    row([target.name, detail, `${target.distance.toFixed(1)}ly`, `${String(Math.round(target.bearing) % 360).padStart(3, '0')}°`], [13, 7, 7, 6])
  ];
  if (game.visited.has(target.id)) segments.push({ text: '[visited]', tone: 'dim' });
  return segments;
}
