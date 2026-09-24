export const help = {
  name: 'help',
  summary: 'Display help text',
  usage: 'help',

  run({ print, available }) {
    print('Available commands:', 'head');
    for (const command of available) {
      print(`  ${command.name.padEnd(8)}${command.summary}`);
    }
    print("Use 'command --help' or 'command -h' for details", 'dim');
  }
};

export const clear = {
  name: 'clear',
  summary: 'Clear the terminal',
  usage: 'clear',

  run({ terminal }) {
    terminal.clear();
  }
};
