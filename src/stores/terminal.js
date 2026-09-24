import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { availableCommands, helpText, parseQuery } from '../commands';
import { useGameStore } from './game';
import { sfx } from '../audio/sfx';

const MAX_LINES = 400;
let lineId = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Terminal: output buffer, input line, history and command execution.
 *
 * Two ways to run a command:
 *  - submit(query): the player typed it and pressed return
 *  - dispatch(query): a cockpit control asked for it, the command is typed
 *    character by character (with key noise) then submitted, so the terminal
 *    stays the single place where commands are executed and logged.
 */
export const useTerminalStore = defineStore('terminal', () => {
  const lines = ref([]);
  const input = ref('');
  const busy = ref(false);
  const typing = ref(false);
  /** Name of the running command, lets cockpit controls light up */
  const activeCommand = ref(null);
  /** Incremented on every return key hit (typed or simulated) */
  const hits = ref(0);
  const history = [];
  let historyIndex = 0;

  const game = useGameStore();

  const prompt = computed(() =>
    game.currentSystem && game.phase !== 'offline' ? `u@${game.currentSystem.name}:#` : 'root@world'
  );

  function normalize(content, tone) {
    const parts = Array.isArray(content) ? content : [content];
    return parts.map((part) => (typeof part === 'string' ? { text: part, tone } : part));
  }

  /** Append a line, returns a handle to update it in place (progress bars...) */
  function print(content, tone) {
    const line = { id: ++lineId, segments: normalize(content, tone) };
    lines.value.push(line);
    if (lines.value.length > MAX_LINES) lines.value.splice(0, lines.value.length - MAX_LINES);
    const stored = lines.value[lines.value.length - 1];
    return {
      update(next, nextTone) {
        stored.segments = normalize(next, nextTone);
      }
    };
  }

  function clear() {
    lines.value = [];
  }

  async function submit(raw = input.value) {
    if (busy.value) return false;
    const query = raw.trim();
    input.value = '';
    hits.value++;
    sfx.enter();
    lines.value.push({ id: ++lineId, prompt: prompt.value, segments: [{ text: query }] });
    if (!query) return true;

    history.push(query);
    historyIndex = history.length;

    const { name, command, args } = parseQuery(query);
    const available = availableCommands(game.online);
    if (!command) {
      print(`Command not found: ${name}. Type 'help' for a list of commands.`, 'error');
      sfx.error();
      return true;
    }
    if (!available.includes(command)) {
      print(`${command.name}: ship systems offline. Run 'init' first.`, 'error');
      sfx.error();
      return true;
    }
    if (args.help) {
      helpText(command).forEach((line, i) => print(line, i ? undefined : 'head'));
      return true;
    }

    busy.value = true;
    activeCommand.value = command.name;
    try {
      await command.run({ args, print, sleep, game, terminal: api, sfx, available });
    } catch (error) {
      console.error(error);
      print(`${command.name}: unexpected failure (${error.message})`, 'error');
    } finally {
      busy.value = false;
      activeCommand.value = null;
    }
    return true;
  }

  /** Type a command as if a ghost operator was at the keyboard, then run it */
  async function dispatch(query) {
    if (busy.value) return false;
    busy.value = true;
    typing.value = true;
    input.value = '';
    await sleep(120);
    for (const char of query) {
      input.value += char;
      if (char !== ' ') sfx.key();
      await sleep(35 + Math.random() * 45);
    }
    await sleep(180);
    typing.value = false;
    busy.value = false;
    return submit(query);
  }

  function historyStep(step) {
    if (!history.length) return;
    historyIndex = Math.max(0, Math.min(history.length, historyIndex + step));
    input.value = history[historyIndex] ?? '';
  }

  /** Tab completion on command names and on known jump targets */
  function complete() {
    const value = input.value;
    const parts = value.split(/\s+/);
    let candidates;
    if (parts.length <= 1) {
      candidates = availableCommands(game.online).map((c) => c.name);
    } else if (parts[0].toLowerCase() === 'jump' && parts.length === 2) {
      candidates = game.knownTargets.map((t) => t.name);
    } else {
      return [];
    }
    const current = parts[parts.length - 1].toUpperCase();
    const matches = candidates.filter((c) => c.toUpperCase().startsWith(current));
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0];
      input.value = parts.join(' ') + ' ';
    } else if (matches.length > 1) {
      const prefix = commonPrefix(matches);
      if (prefix.length > current.length) {
        parts[parts.length - 1] = prefix;
        input.value = parts.join(' ');
      } else {
        print(matches.join('   '), 'dim');
      }
    }
    return matches;
  }

  const api = { lines, input, busy, typing, activeCommand, hits, prompt, print, clear, submit, dispatch, historyStep, complete };
  return api;
});

function commonPrefix(words) {
  let prefix = words[0];
  for (const word of words) {
    while (!word.toUpperCase().startsWith(prefix.toUpperCase())) prefix = prefix.slice(0, -1);
  }
  return prefix;
}
