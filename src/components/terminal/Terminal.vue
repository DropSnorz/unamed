<template>
  <CrtScreen tone="green" on class="terminal">
    <div class="terminal__body" @click="focus">
      <header class="terminal__bar">
        <span class="terminal__led" :class="{ 'is-busy': terminal.busy }" />
        <span class="terminal__bar-title">UNAMED OS v2.0 · TTY1</span>
        <span class="terminal__bar-prompt">{{ terminal.prompt }}</span>
      </header>

      <div ref="screen" class="terminal__screen" role="log" aria-live="polite">
        <div v-for="line in terminal.lines" :key="line.id" class="terminal__line">
          <span v-if="line.prompt" class="t-prompt">{{ `${line.prompt} ` }}</span>
          <span v-for="(segment, i) in line.segments" :key="i" :class="segment.tone && `t-${segment.tone}`">{{ segment.text }}</span>
        </div>

        <div v-show="!terminal.busy || terminal.typing" class="terminal__line terminal__input" :class="{ 'is-hit': hitFlash }">
          <span class="t-prompt">{{ `${terminal.prompt} ` }}</span>
          <span>{{ before }}</span><span class="terminal__cursor" :class="{ 'is-idle': !terminal.typing && focused }">{{ at || ' ' }}</span><span>{{ after }}</span>
          <input
            ref="field"
            v-model="terminal.input"
            class="terminal__field"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            aria-label="Terminal input"
            :readonly="terminal.typing"
            @keydown="onKeydown"
            @input="syncCaret"
            @keyup="syncCaret"
            @click="syncCaret"
            @select="syncCaret"
            @focus="focused = true"
            @blur="focused = false"
          />
        </div>
      </div>
    </div>
  </CrtScreen>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CrtScreen from '../cockpit/CrtScreen.vue';
import { useTerminalStore } from '../../stores/terminal';
import { sfx } from '../../audio/sfx';

const terminal = useTerminalStore();
const screen = ref(null);
const field = ref(null);
const caret = ref(0);
const focused = ref(false);
const hitFlash = ref(false);

const position = computed(() => (terminal.typing ? terminal.input.length : Math.min(caret.value, terminal.input.length)));
const before = computed(() => terminal.input.slice(0, position.value));
const at = computed(() => terminal.input.charAt(position.value));
const after = computed(() => terminal.input.slice(position.value + 1));

function syncCaret() {
  caret.value = field.value?.selectionStart ?? terminal.input.length;
}

function focus() {
  // Do not steal the focus when the player selects text to copy it
  if (window.getSelection()?.toString()) return;
  field.value?.focus({ preventScroll: true });
}

function onKeydown(event) {
  if (terminal.typing) {
    event.preventDefault();
    return;
  }
  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      terminal.submit();
      break;
    case 'Tab':
      event.preventDefault();
      terminal.complete();
      moveCaretToEnd();
      break;
    case 'ArrowUp':
    case 'ArrowDown':
      event.preventDefault();
      terminal.historyStep(event.key === 'ArrowUp' ? -1 : 1);
      moveCaretToEnd();
      break;
    default:
      if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        terminal.clear();
      } else if (event.key.length === 1 || event.key === 'Backspace') {
        sfx.key();
      }
  }
}

function moveCaretToEnd() {
  nextTick(() => {
    const end = terminal.input.length;
    field.value?.setSelectionRange(end, end);
    caret.value = end;
  });
}

// Typing anywhere in the cockpit goes to the terminal
function onWindowKeydown(event) {
  const target = event.target;
  if (target === field.value || event.ctrlKey || event.metaKey || event.altKey) return;
  if (target instanceof HTMLElement && target.closest('input, textarea, [contenteditable]')) return;
  if (event.key.length === 1 && !(event.key === ' ' && target instanceof HTMLButtonElement)) {
    field.value?.focus({ preventScroll: true });
  }
}

watch(
  () => terminal.hits,
  () => {
    hitFlash.value = true;
    setTimeout(() => (hitFlash.value = false), 140);
  }
);

watch(
  () => terminal.busy,
  (busy) => {
    if (!busy) nextTick(() => document.activeElement === document.body && focus());
  }
);

// Lines are rendered inside the CrtScreen slot (the child re-renders, not this
// component), so watch the DOM itself. Follow the output unless the player
// scrolled up to read something.
let stickToBottom = true;
let observer = null;

function onScroll() {
  const el = screen.value;
  stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
}

function followOutput() {
  if (stickToBottom && screen.value) screen.value.scrollTop = screen.value.scrollHeight;
}

watch(
  () => terminal.hits,
  () => (stickToBottom = true)
);

onMounted(() => {
  if (!terminal.lines.length) {
    terminal.print('Everything seems so empty...');
    terminal.print("Type 'init' to start playing or 'help' for details.", 'dim');
  }
  observer = new MutationObserver(followOutput);
  observer.observe(screen.value, { childList: true, subtree: true, characterData: true });
  screen.value.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('keydown', onWindowKeydown);
  focus();
});

onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('keydown', onWindowKeydown);
});
</script>

<style lang="scss" scoped>
.terminal__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--font-crt);
  font-size: 19px;
  line-height: 1.12;
  cursor: text;
}

.terminal__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 4px;
  border-bottom: 1px solid var(--crt-green-dim);
  font-size: 16px;
  letter-spacing: 0.08em;
  opacity: 0.85;
}

.terminal__bar-title {
  flex: none;
  white-space: nowrap;
}

.terminal__bar-prompt {
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.terminal__led {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--crt-green);
  box-shadow: 0 0 6px var(--crt-green);

  &.is-busy {
    animation: blink 0.3s steps(1) infinite;
  }
}

.terminal__screen {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 14px 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--crt-green-dim) transparent;
}

.terminal__line {
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 1.12em;
}

.terminal__input {
  position: relative;
  transition: filter 0.1s;

  &.is-hit {
    filter: brightness(2.2);
  }
}

.terminal__cursor {
  background: var(--crt-green);
  color: var(--crt-green-bg);
  text-shadow: none;
  box-shadow: 0 0 6px var(--crt-green);

  &.is-idle {
    animation: blink-hard 1s infinite;
  }
}

// Real input kept invisible: it only captures keyboard, IME and mobile input
.terminal__field {
  position: absolute;
  inset: 0;
  width: 100%;
  opacity: 0;
  pointer-events: none;
  border: 0;
  padding: 0;
  font: inherit;
  caret-color: transparent;
  color: transparent;
  background: transparent;
  outline: none;
}

.t-prompt {
  color: #d4ffe0;
}
.t-dim {
  opacity: 0.55;
}
.t-head {
  color: #d4ffe0;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.t-accent {
  color: #eaffef;
  text-shadow: 0 0 8px var(--crt-green);
}
.t-ok {
  color: #b9ffcf;
  text-shadow: 0 0 8px var(--crt-green);
}
.t-error {
  color: #ff8a70;
  text-shadow: 0 0 6px rgba(255, 90, 60, 0.7);
}
</style>
