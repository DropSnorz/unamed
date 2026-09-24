<template>
  <div class="knob">
    <button
      type="button"
      class="knob__cap"
      :disabled="disabled"
      :aria-label="`${label}: turn left or right`"
      :style="{ transform: `rotate(${rotation}deg)` }"
      @click="onClick"
      @wheel.prevent="onWheel"
      @keydown.left.prevent="step(-1)"
      @keydown.right.prevent="step(1)"
      @keydown.up.prevent="step(-1)"
      @keydown.down.prevent="step(1)"
    >
      <span class="knob__pointer" />
    </button>
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

function step(direction) {
  rotation.value += direction * 30;
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
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.knob__cap {
  position: relative;
  width: 58px;
  height: 58px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: ew-resize;
  // Knurled bakelite knob
  background:
    radial-gradient(circle at 50% 50%, #2b2a27 0 44%, transparent 45%),
    repeating-conic-gradient(#1b1a18 0 6deg, #3b3934 6deg 12deg);
  box-shadow:
    0 0 0 3px #0f0f0e,
    0 0 0 6px #6b716e,
    0 4px 8px 5px rgba(0, 0, 0, 0.6),
    inset 0 2px 2px rgba(255, 255, 255, 0.15);
  transition: transform 0.15s cubic-bezier(0.4, 1.6, 0.6, 1);

  &:disabled {
    cursor: not-allowed;
    filter: brightness(0.6);
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 8px;
  }
}

.knob__pointer {
  position: absolute;
  left: 50%;
  top: 7px;
  width: 4px;
  height: 14px;
  margin-left: -2px;
  border-radius: 2px;
  background: var(--plate);
  box-shadow: 0 0 3px rgba(255, 240, 200, 0.5);
}

.knob__label {
  font-size: 10px;
}
</style>
