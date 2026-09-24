<template>
  <div class="guarded" :class="{ 'is-open': open, 'is-disabled': disabled }">
    <div class="guarded__base hazard">
      <button
        type="button"
        class="guarded__button"
        :class="{ 'is-lit': lit, 'is-blink': lit === 'blink' }"
        :disabled="disabled || !open"
        :tabindex="open ? 0 : -1"
        @click="press"
      >
        {{ label }}
      </button>
      <button
        type="button"
        class="guarded__cover"
        :disabled="disabled"
        :aria-label="open ? `Close ${label} safety cover` : `Open ${label} safety cover`"
        :aria-expanded="open"
        @click="toggle"
      >
        <span class="guarded__cover-text">{{ open ? '' : 'LIFT' }}</span>
      </button>
    </div>
    <span class="plate guarded__caption">{{ caption }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { sfx } from '../../audio/sfx';

const props = defineProps({
  label: { type: String, required: true },
  caption: { type: String, default: '' },
  lit: { type: [Boolean, String], default: false },
  disabled: { type: Boolean, default: false }
});
const emit = defineEmits(['press']);

const open = ref(false);

function toggle() {
  open.value = !open.value;
  sfx.toggle();
}

function press() {
  sfx.button();
  emit('press');
  // The spring loaded cover snaps back shortly after the button is pressed
  setTimeout(() => {
    if (open.value) {
      open.value = false;
      sfx.toggle();
    }
  }, 700);
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) open.value = false;
  }
);
</script>

<style lang="scss" scoped>
.guarded {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  perspective: 420px;
}

.guarded__base {
  position: relative;
  display: grid;
  place-items: center;
  width: 104px;
  height: 78px;
  border-radius: 8px;
  box-shadow:
    inset 0 0 0 4px #1b1b19,
    0 3px 6px rgba(0, 0, 0, 0.6);
}

.guarded__button {
  width: 72px;
  height: 50px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-family: var(--font-stencil);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.12em;
  color: #2a0906;
  background: linear-gradient(180deg, #8e2419, #5a130c);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 0 3px #111,
    0 4px 0 3px #0a0a0a;
  transition:
    transform 0.06s,
    background 0.2s;

  &:active:not(:disabled) {
    transform: translateY(3px);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &.is-lit {
    color: #3a0904;
    background: radial-gradient(ellipse at 50% 40%, #fff, var(--lamp-red) 40%, #8e2419);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      0 0 0 3px #111,
      0 4px 0 3px #0a0a0a,
      0 0 24px 6px rgba(255, 59, 47, 0.5);
  }

  &.is-blink {
    animation: blink 0.4s steps(1) infinite;
  }
}

// Translucent red flip cover, hinged on its top edge
.guarded__cover {
  position: absolute;
  inset: 6px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.35), transparent 40%),
    repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.12) 0 2px, transparent 2px 8px),
    rgba(200, 40, 30, 0.72);
  box-shadow:
    inset 0 0 0 2px rgba(255, 160, 140, 0.35),
    0 6px 10px rgba(0, 0, 0, 0.5);
  transform-origin: 50% 0;
  transition: transform 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);

  &:disabled {
    cursor: not-allowed;
    filter: brightness(0.5);
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 6px;
  }
}

.guarded__cover-text {
  font-family: var(--font-stencil);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.3em;
  color: rgba(255, 230, 220, 0.85);
}

.guarded.is-open .guarded__cover {
  transform: rotateX(-110deg) translateY(-6px);
  background:
    linear-gradient(0deg, rgba(255, 255, 255, 0.25), transparent 50%),
    rgba(200, 40, 30, 0.45);
}

.guarded__caption {
  margin-top: 4px;
  font-size: 10px;
}
</style>
