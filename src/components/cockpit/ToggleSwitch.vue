<template>
  <div class="toggle" :class="{ 'is-on': on, 'is-disabled': disabled }">
    <span class="plate toggle__label">{{ label }}</span>
    <div class="toggle__plate">
      <span class="toggle__legend stencil">ON</span>
      <button
        type="button"
        class="toggle__switch"
        role="switch"
        :aria-checked="on"
        :aria-label="label"
        :disabled="disabled"
        @click="flip"
      >
        <span class="toggle__nut" />
        <span class="toggle__bushing" />
        <span class="toggle__shadow" />
        <span class="toggle__lever" />
      </button>
      <span class="toggle__legend stencil">OFF</span>
    </div>
    <Lamp :color="lampColor" :on="on && !disabled" size="8px" />
  </div>
</template>

<script setup>
import Lamp from './Lamp.vue';
import { sfx } from '../../audio/sfx';

defineProps({
  label: { type: String, required: true },
  on: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  lampColor: { type: String, default: 'green' }
});
const emit = defineEmits(['toggle']);

function flip() {
  sfx.toggle();
  emit('toggle');
}
</script>

<style lang="scss" scoped>
.toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.toggle__label {
  font-size: 9px;
  padding: 1px 9px 0;
}

// Small steel mounting plate with engraved legends
.toggle__plate {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  width: 40px;
  padding: 4px 0;
  border-radius: 4px;
  background:
    var(--tex-brushed),
    linear-gradient(160deg, #6a7470, #3a423e 60%, #2a302d);
  box-shadow:
    0 0 0 1px #070908,
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.55);
}

.toggle__legend {
  font-size: 8px;
  color: rgba(240, 232, 210, 0.75);
  text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.6);
}

.toggle__switch {
  position: relative;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 4px;
  }
}

// Hex nut with lit facets
.toggle__nut {
  position: absolute;
  inset: 5px;
  clip-path: polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%);
  background:
    conic-gradient(from -30deg, #f2f5f3 0 60deg, #aab2ae 60deg 120deg, #4d5451 120deg 180deg, #2c312f 180deg 240deg, #6c7470 240deg 300deg, #d5dbd8 300deg 360deg);
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.6));
}

// Threaded bushing the lever pivots in
.toggle__bushing {
  position: absolute;
  inset: 11px;
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle, #3d4441 0 1px, #9ba39f 1px 2px),
    #555;
  box-shadow:
    inset 0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(0, 0, 0, 0.5);
}

// Chrome bat-handle lever: tapered shaft and ball tip, pivoting on the bushing
.toggle__lever {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: 50%;
  width: 10px;
  height: 25px;
  margin-left: -5px;
  transform-origin: 50% 100%;
  transform: rotate(180deg) scaleY(0.82);
  transition: transform 0.11s cubic-bezier(0.5, 1.9, 0.6, 1);

  &::before {
    content: '';
    position: absolute;
    left: 2px;
    right: 2px;
    top: 3px;
    bottom: 0;
    clip-path: polygon(22% 0, 78% 0, 100% 100%, 0 100%);
    background: linear-gradient(90deg, #3f4643, #f7faf8 38%, #b9c1bd 55%, #5a625e 85%, #2f3431);
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: -3px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff 0 12%, #c9d0cc 35%, #5f6763 80%, #2c312e);
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
  }
}

// Cast shadow of the lever on the plate
.toggle__shadow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 20px;
  margin-left: -1px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.45);
  filter: blur(2px);
  transform-origin: 50% 0;
  transform: translate(2px, 1px) rotate(-8deg);
  transition: transform 0.11s;
  z-index: 1;
}

.toggle.is-on {
  .toggle__lever {
    transform: rotate(0deg) scaleY(0.82);
  }

  .toggle__shadow {
    transform: translate(3px, -1px) rotate(172deg);
  }
}

.toggle.is-disabled .toggle__switch {
  filter: brightness(0.7);
}
</style>
