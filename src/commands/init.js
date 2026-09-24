import { randomSeed } from '../engine';

export default {
  name: 'init',
  summary: 'Create a new cluster',
  usage: 'init [--seed SEED] [--size SIZE]',
  options: [
    ['--seed SEED', 'Create a unique and predictable cluster using a seed'],
    ['--size SIZE', 'Force cluster size (number of constellations)']
  ],
  parse: { string: ['seed', 'size'] },

  async run({ args, print, sleep, game, sfx }) {
    if (args.seed === '' || args.size === '') {
      print('init: option requires a value. See init --help', 'error');
      return;
    }
    const size = args.size === undefined ? undefined : Number(args.size);
    if (size !== undefined && !(Number.isInteger(size) && size >= 1 && size <= 3000)) {
      print('init: --size must be an integer between 1 and 3000', 'error');
      return;
    }
    const seed = args.seed ?? randomSeed();

    if (game.phase !== 'offline') {
      print('Shutting down ship systems...', 'dim');
      await sleep(900);
    }

    print(['Something is about to happen... ', { text: `(Procedurally generating the universe using seed ${seed})`, tone: 'dim' }]);
    await sleep(60);

    const start = performance.now();
    const cluster = game.generate({ seed, size });
    const duration = ((performance.now() - start) / 1000).toFixed(2);
    const constellations = cluster.data.constellations.length;
    const systems = cluster.data.systems.length;

    await sleep(2200);
    game.setBootStage(1);
    print(['An intense light springs from the void. ', { text: `(${systems} stars generated over ${constellations} constellations)`, tone: 'dim' }]);

    await sleep(2200);
    game.setBootStage(2);
    print(['Time is completely distorted. ', { text: `(${humanFileSize(cluster.byteSize())} cluster generated in ${duration} s)`, tone: 'dim' }]);

    await sleep(2000);
    game.setBootStage(3);
    print('In an instant, everything seems to stabilize. Everything is calm again.');
    print('This is where you wake up. You are confused, with memories of past lives.');
    print('This terminal stands in front of you. Around it, a cockpit flickers to life.');

    await sleep(600);
    game.completeBoot();
    sfx.powerUp();
    await sleep(1800);
    print(`Location: ${game.currentSystem.name}, constellation ${game.currentConstellation.name}.`, 'accent');
    print("Type 'help' or use the cockpit controls. Start with a 'scan'.", 'dim');
  }
};

function humanFileSize(bytes) {
  const units = ['B', 'KiB', 'MiB', 'GiB'];
  let unit = 0;
  while (bytes >= 1024 && unit < units.length - 1) {
    bytes /= 1024;
    unit++;
  }
  return `${bytes.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}
