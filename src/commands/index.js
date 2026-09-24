import getopts from 'getopts';
import init from './init';
import scan from './scan';
import jump from './jump';
import { clear, help } from './misc';

/**
 * Command registry. A command is a plain object:
 *
 *   name, summary, usage   documentation (also used to generate `--help`)
 *   options                [[flag, description], ...]
 *   parse                  extra getopts options
 *   requiresOnline         only available once the ship is powered
 *   run(context)           may be async; prints through `context.print`
 */
export const commands = [init, scan, jump, help, clear];

export function findCommand(name) {
  return commands.find((command) => command.name === name);
}

export function availableCommands(online) {
  return commands.filter((command) => online || !command.requiresOnline);
}

/** Split a raw query into a command name and parsed arguments */
export function parseQuery(query) {
  const [name = '', ...tokens] = query.trim().split(/\s+/).filter(Boolean);
  const command = findCommand(name.toLowerCase());
  const args = getopts(tokens, { alias: { h: 'help' }, ...(command?.parse || {}) });
  // getopts defaults declared string options to '': keep only the flags actually given
  for (const key of command?.parse?.string || []) {
    if (!tokens.some((t) => t === `--${key}` || t.startsWith(`--${key}=`))) delete args[key];
  }
  return { name, command, args };
}

export function helpText(command) {
  const options = [...(command.options || []), ['-h, --help', 'Display help text']];
  return [
    `${command.name} - ${command.summary}`,
    `Usage: ${command.usage}`,
    ...options.map(([flag, description]) => `  ${flag.padEnd(14)}${description}`)
  ];
}
