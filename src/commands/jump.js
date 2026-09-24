export default {
  name: 'jump',
  summary: 'Jump to a nearby signature',
  usage: 'jump TARGET',
  requiresOnline: true,

  async run({ args, print, sleep, game, sfx }) {
    const name = args._[0];
    if (!name) {
      print('jump: missing TARGET. Usage: jump TARGET', 'error');
      return;
    }
    const target = game.resolveJumpTarget(name);
    if (!target) {
      print(`Unknown jump target ${name}`, 'error');
      print("Run 'scan' to list reachable signatures.", 'dim');
      sfx.error();
      return;
    }

    game.beginJump(target);
    const check = print('Checking propulsion systems...');
    await sleep(500);
    check.update(['Checking propulsion systems... ', { text: 'OK', tone: 'ok' }]);

    game.setJumpStage('align');
    sfx.charge();
    const align = print(`Aligning to ${target.name}...`);
    await sleep(1200);
    align.update(`Successfully aligned with ${target.name}`);

    game.setJumpStage('warp');
    sfx.warp();
    print(`Jumping to ${target.name}...`);
    await sleep(2300);

    const arrival = game.completeJump();
    if (target.kind === 'gate') {
      print(`Jump complete! Welcome to constellation ${target.name}, system ${arrival.name}`, 'ok');
    } else {
      print(`Jump complete! Welcome to ${arrival.name}`, 'ok');
    }
  }
};
