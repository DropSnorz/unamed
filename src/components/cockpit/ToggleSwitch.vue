<template>
  <div class="toggle">
    <span class="plate toggle__label">{{ label }}</span>
    <span class="toggle__state stencil">ON</span>
    <button
      type="button"
      class="toggle__switch"
      role="switch"
      :class="{ 'is-on': on }"
      :aria-checked="on"
      :aria-label="label"
      :disabled="disabled"
      @click="flip"
    >
      <span class="toggle__nut" />
      <span class="toggle__lever" />
    </button>
    <span class="toggle__state stencil">OFF</span>
    <Lamp :color="lampColor" :on="on && !disabled" size="9px" />
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
  gap: 3px;
}

.toggle__label {
  margin-bottom: 3px;
  font-size: 10px;
  padding: 1px 5px 0;
}

.toggle__state {
  font-size: 9px;
  color: rgba(228, 217, 188, 0.6);
}

.toggle__switch {
  position: relative;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: radial-gradient(circle at 40% 35%, #b7bfbb, #59605c 60%, #2c302e);
  box-shadow:
    0 0 0 2px #121513,
    0 2px 4px rgba(0, 0, 0, 0.7);

  &:disabled {
    cursor: not-allowed;
    filter: brightness(0.6);
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 4px;
  }
}

// Hexagonal nut around the lever
.toggle__nut {
  position: absolute;
  inset: 8px;
  clip-path: polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0 50%);
  background: linear-gradient(160deg, #e2e7e4, #7d8581 55%, #3f4542);
}

// Chrome bat-handle lever
.toggle__lever {
  position: absolute;
  left: 50%;
  bottom: 50%;
  width: 9px;
  height: 24px;
  margin-left: -4.5px;
  border-radius: 5px 5px 3px 3px;
  background: linear-gradient(90deg, #6c7470, #f4f7f5 45%, #8a928e 70%, #4c5350);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.6);
  // Pivot on the nut: pointing down = OFF, up = ON
  transform-origin: 50% 100%;
  transform: rotate(180deg) scaleY(0.85);
  transition: transform 0.12s cubic-bezier(0.5, 1.8, 0.6, 1);
}

.toggle__switch.is-on .toggle__lever {
  transform: rotate(0deg) scaleY(0.85);
}
</style>
