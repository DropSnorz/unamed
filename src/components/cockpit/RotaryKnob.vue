<template>
  <div class="knob" :class="{ 'is-disabled': disabled }">
    <div class="knob__dial">
      <!-- Scale printed on the panel around the knob -->
      <svg class="knob__scale" viewBox="0 0 100 100" aria-hidden="true">
        <line v-for="tick in ticks" :key="tick.i" v-bind="tick.line" :class="{ major: tick.major }" />
        <text x="12" y="92">PREV</text>
        <text x="88" y="92" text-anchor="end">NEXT</text>
      </svg>
      <button
        type="button"
        class="knob__body"
        :disabled="disabled"
        :aria-label="`${label}: turn left or right`"
        :style="{ '--r': `${rotation}deg` }"
        @click="onClick"
        @wheel.prevent="onWheel"
        @keydown.left.prevent="step(-1)"
        @keydown.right.prevent="step(1)"
        @keydown.up.prevent="step(-1)"
        @keydown.down.prevent="step(1)"
      >
        <span class="knob__skirt" />
        <span class="knob__cap" />
        <span class="knob__pointer" />
      </button>
    </div>
    <span class="plate knob__label">{{ label }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { sfx } from '../../audio/sfx';

defineProps({
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false }
});
const emit = defineEmits(['step']);

const rotation = ref(0);
let lastWheel = 0;

// 11 ticks over a 270° sweep, like a potentiometer scale
const ticks = Array.from({ length: 11 }, (_, i) => {
  const a = ((-135 + i * 27 - 90) * Math.PI) / 180;
  const major = i % 5 === 0;
  const r1 = major ? 40 : 42;
  return { i, major, line: { x1: 50 + Math.cos(a) * r1, y1: 50 + Math.sin(a) * r1, x2: 50 + Math.cos(a) * 47, y2: 50 + Math.sin(a) * 47 } };
});

function step(direction) {
  rotation.value += direction * 27;
  sfx.toggle();
  emit('step', direction);
}

// Click on the left half turns counter clockwise, right half clockwise
function onClick(event) {
  if (event.detail === 0) return step(1); // keyboard activation
  const rect = event.currentTarget.getBoundingClientRect();
  step(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
}

function onWheel(event) {
  const now = performance.now();
  if (now - lastWheel < 90) return;
  lastWheel = now;
  step(event.deltaY > 0 ? 1 : -1);
}
</script>

<style lang="scss" scoped>
.knob {
  --knob: 86px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.knob__dial {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--knob);
  height: var(--knob);
}

.knob__scale {
  position: absolute;
  inset: 0;
  overflow: visible;

  line {
    stroke: rgba(236, 226, 200, 0.55);
    stroke-width: 1.2;

    &.major {
      stroke: rgba(236, 226, 200, 0.85);
      stroke-width: 2;
    }
  }

  text {
    font-family: var(--font-mono);
    font-size: 7px;
    letter-spacing: 0.1em;
    fill: rgba(236, 226, 200, 0.6);
  }
}

.knob__body {
  position: relative;
  width: calc(var(--knob) * 0.7);
  height: calc(var(--knob) * 0.7);
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  cursor: ew-resize;
  // Contact shadow on the panel, light coming from the top left
  box-shadow:
    3px 6px 8px rgba(0, 0, 0, 0.65),
    1px 2px 2px rgba(0, 0, 0, 0.6),
    0 0 0 2px rgba(0, 0, 0, 0.35);

  &:disabled {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 10px;
  }
}

// Knurled black skirt (rotates)
.knob__skirt {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: repeating-conic-gradient(#0d0d0c 0 5deg, #3a3935 5deg 7deg, #16161a 7deg 10deg);
  transform: rotate(var(--r));
  transition: transform 0.14s cubic-bezier(0.4, 1.6, 0.6, 1);

  // Fixed lighting over the knurl: top-left light, bottom-right shade
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background:
      radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.28), transparent 45%),
      radial-gradient(circle at 70% 85%, rgba(0, 0, 0, 0.55), transparent 55%);
    transform: rotate(calc(var(--r) * -1));
    transition: transform 0.14s cubic-bezier(0.4, 1.6, 0.6, 1);
  }
}

// Spun aluminium cap: concentric brushed reflections that do not turn with the knob
.knob__cap {
  position: absolute;
  inset: 15%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, transparent 0 20%, rgba(0, 0, 0, 0.08) 21% 22%, transparent 23%),
    repeating-radial-gradient(circle, rgba(255, 255, 255, 0.05) 0 1px, rgba(0, 0, 0, 0.05) 1px 2px),
    conic-gradient(
      from 20deg,
      #eef1ef,
      #8c9490 45deg,
      #d9dedb 95deg,
      #6f7773 150deg,
      #f4f6f5 200deg,
      #858d89 255deg,
      #cfd5d2 310deg,
      #eef1ef
    );
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.8),
    inset 0 -2px 3px rgba(0, 0, 0, 0.45),
    0 0 0 1px #1a1b1a,
    0 2px 3px rgba(0, 0, 0, 0.6);
}

// Engraved index line (rotates)
.knob__pointer {
  position: absolute;
  inset: 0;
  transform: rotate(var(--r));
  transition: transform 0.14s cubic-bezier(0.4, 1.6, 0.6, 1);

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 3px;
    width: 3px;
    height: 17px;
    margin-left: -1.5px;
    border-radius: 2px;
    background: linear-gradient(180deg, #f2e9cf, #cbbf9c);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.55),
      0 0 4px rgba(255, 240, 200, 0.35);
  }
}

.knob.is-disabled .knob__body {
  filter: brightness(0.7);
}

.knob__label {
  font-size: 10px;
}
</style>
