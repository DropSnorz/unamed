<template>
  <div class="guarded" :class="{ 'is-open': open, 'is-disabled': disabled, 'is-lit': lit, 'is-blink': lit === 'blink' }">
    <div class="guarded__base hazard">
      <Screws :size="6" :inset="4" />
      <div class="guarded__collar">
        <button
          type="button"
          class="guarded__button"
          :disabled="disabled || !open"
          :tabindex="open ? 0 : -1"
          @click="press"
        >
          <span class="guarded__glow" aria-hidden="true" />
          <span class="guarded__label">{{ label }}</span>
        </button>
      </div>
      <button
        type="button"
        class="guarded__cover"
        :disabled="disabled"
        :aria-label="open ? `Close ${label} safety cover` : `Open ${label} safety cover`"
        :aria-expanded="open"
        @click="toggle"
      >
        <span class="guarded__cover-text">▲ LIFT</span>
      </button>
      <span class="guarded__hinge" aria-hidden="true" />
    </div>
    <span class="plate guarded__caption">{{ caption }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import Screws from './Screws.vue';
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
  gap: 7px;
  perspective: 380px;
}

// Hazard striped mounting plate
.guarded__base {
  position: relative;
  display: grid;
  place-items: center;
  width: 108px;
  height: 84px;
  border-radius: 7px;
  transform-style: preserve-3d;
  box-shadow:
    0 0 0 1px #050505,
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -2px 0 rgba(0, 0, 0, 0.5),
    0 4px 8px rgba(0, 0, 0, 0.6);
}

.guarded__collar {
  position: relative;
  padding: 6px;
  border-radius: 9px;
  background:
    var(--tex-brushed),
    linear-gradient(150deg, #9aa4a0, #4c5652 30%, #1e2422 70%, #121614);
  box-shadow:
    0 0 0 1px #040505,
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 2px 4px rgba(0, 0, 0, 0.7);

  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 6px;
    background: #030404;
    box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.95);
  }
}

.guarded__button {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 64px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  color: #2a0804;
  background:
    radial-gradient(ellipse 85% 40% at 50% 6%, rgba(255, 255, 255, 0.4), transparent 70%),
    linear-gradient(180deg, #b43527, #7e1c12 55%, #4a0d07);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -3px 5px rgba(0, 0, 0, 0.4),
    0 4px 0 #3a0905,
    0 5px 0 #020303,
    0 6px 5px rgba(0, 0, 0, 0.8);
  transform: translateY(-4px);
  transition:
    transform 0.05s,
    box-shadow 0.05s;

  &:active:not(:disabled) {
    transform: translateY(-1px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      0 1px 0 #3a0905,
      0 2px 0 #020303,
      0 2px 3px rgba(0, 0, 0, 0.8);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 8px;
  }
}

.guarded__glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(ellipse 85% 40% at 50% 6%, rgba(255, 255, 255, 0.55), transparent 70%),
    radial-gradient(ellipse 70% 80% at 50% 52%, #fff, #ff8d7a 22%, var(--lamp-red) 55%, #7a130a 100%);
  box-shadow:
    0 0 16px 4px rgba(255, 59, 47, 0.55),
    0 0 40px 12px rgba(255, 59, 47, 0.18);
  opacity: 0;
  transition: opacity 0.18s;
}

.guarded.is-lit .guarded__glow {
  opacity: 1;
}

.guarded.is-blink .guarded__glow {
  animation: glow-blink 0.4s steps(1) infinite;
}

@keyframes glow-blink {
  50% {
    opacity: 0;
  }
}

.guarded__label {
  position: relative;
  font-family: var(--font-stencil);
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 0.12em;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

// Thick translucent red cover, hinged on the barrel at the top
.guarded__cover {
  position: absolute;
  left: 13px;
  right: 13px;
  top: 9px;
  bottom: 11px;
  z-index: 2;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 5px 5px 8px 8px;
  cursor: pointer;
  background:
    linear-gradient(165deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.05) 35%, transparent 55%),
    radial-gradient(ellipse at 50% 120%, rgba(255, 120, 90, 0.35), transparent 60%),
    linear-gradient(180deg, rgba(214, 48, 34, 0.78), rgba(150, 22, 14, 0.82));
  box-shadow:
    // Molded rim and thickness of the cover
    inset 0 0 0 2px rgba(255, 170, 150, 0.35),
    inset 0 0 0 4px rgba(120, 10, 5, 0.3),
    inset 0 -6px 8px rgba(80, 5, 2, 0.35),
    0 5px 0 rgba(110, 14, 8, 0.92),
    0 6px 0 rgba(30, 4, 2, 0.9),
    0 8px 10px rgba(0, 0, 0, 0.55);
  transform-origin: 50% 0;
  transition: transform 0.38s cubic-bezier(0.3, 1.45, 0.5, 1);

  &:disabled {
    cursor: not-allowed;
    filter: brightness(0.55) saturate(0.7);
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 8px;
  }
}

.guarded__cover-text {
  font-family: var(--font-stencil);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.24em;
  color: rgba(255, 228, 218, 0.9);
  text-shadow: 0 1px 0 rgba(90, 5, 0, 0.7);
}

.guarded.is-open .guarded__cover {
  transform: rotateX(-116deg);
  // Seen from below once lifted: darker underside
  background:
    linear-gradient(0deg, rgba(255, 255, 255, 0.2), transparent 50%),
    rgba(120, 18, 12, 0.7);

  .guarded__cover-text {
    opacity: 0;
  }
}

// Hinge barrel with knuckles
.guarded__hinge {
  position: absolute;
  z-index: 3;
  left: 10px;
  right: 10px;
  top: 4px;
  height: 8px;
  border-radius: 4px;
  background:
    repeating-linear-gradient(90deg, transparent 0 13px, rgba(0, 0, 0, 0.55) 13px 14px, transparent 14px 15px),
    linear-gradient(180deg, #e8ecea, #8d9591 45%, #454c49 80%, #2a2f2d);
  box-shadow:
    0 2px 2px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(0, 0, 0, 0.5);
}

.guarded__caption {
  margin-top: 3px;
  font-size: 10px;
}
</style>
