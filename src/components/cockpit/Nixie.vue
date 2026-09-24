<template>
  <div class="nixie" :class="{ 'is-on': on }">
    <div class="nixie__tubes">
      <span v-for="(char, i) in chars" :key="i" class="nixie__tube" :style="{ '--d': `${i * 60}ms` }">
        <span class="nixie__ghost">8</span>
        <span class="nixie__digit">{{ char }}</span>
      </span>
    </div>
    <span class="plate plate--dark nixie__label">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  digits: { type: Number, default: 4 },
  on: { type: Boolean, default: false }
});

const chars = computed(() => {
  const text = props.on ? String(props.value) : '';
  return text.padStart(props.digits, ' ').slice(-props.digits).split('');
});
</script>

<style lang="scss" scoped>
.nixie {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nixie__tubes {
  display: flex;
  gap: 2px;
  padding: 3px;
  border-radius: 4px;
  background: #0d0b09;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.9),
    0 0 0 1px #3a3a36;
}

.nixie__tube {
  position: relative;
  display: grid;
  place-items: center;
  width: 17px;
  height: 26px;
  border-radius: 8px 8px 3px 3px;
  font-family: var(--font-mono);
  font-size: 19px;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 30%, transparent 70%, rgba(255, 255, 255, 0.05)),
    radial-gradient(ellipse at 50% 60%, #2a1a0d, #120c08);
  box-shadow: inset 0 0 0 1px rgba(255, 200, 150, 0.12);
  // Honeycomb mesh in front of the cathodes
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(circle, rgba(0, 0, 0, 0.35) 0.6px, transparent 1px) 0 0 / 3px 3px;
    pointer-events: none;
  }
}

.nixie__ghost,
.nixie__digit {
  grid-area: 1 / 1;
}

.nixie__ghost {
  color: rgba(120, 90, 60, 0.18);
}

.nixie__digit {
  color: #ffb36b;
  opacity: 0;
  text-shadow:
    0 0 4px #ff7a1a,
    0 0 10px rgba(255, 110, 20, 0.8);
  transition: opacity 0.3s var(--d);
}

.nixie.is-on .nixie__digit {
  opacity: 1;
}

.nixie__label {
  font-size: 9px;
}
</style>
