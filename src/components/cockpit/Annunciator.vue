<template>
  <div class="annunciator" role="status">
    <span
      v-for="light in lights"
      :key="light.label"
      class="annunciator__cell"
      :class="[`is-${light.color}`, { 'is-on': light.on, [`is-blink-${light.blink}`]: light.on && light.blink }]"
    >
      {{ light.label }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  /** [{ label, color: red|amber|green|blue|white, on, blink: false|'slow'|'fast' }] */
  lights: { type: Array, required: true }
});
</script>

<style lang="scss" scoped>
.annunciator {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 4px;
  padding: 5px;
  border-radius: 6px;
  background: #0b0c0b;
  box-shadow:
    inset 0 2px 4px rgba(0, 0, 0, 0.9),
    0 0 0 2px #3c4440;
}

.annunciator__cell {
  --c: var(--lamp-amber);
  display: grid;
  place-items: center;
  height: 30px;
  padding: 0 4px;
  border-radius: 2px;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.05;
  letter-spacing: 0.06em;
  text-align: center;
  color: rgba(255, 255, 255, 0.14);
  background: linear-gradient(180deg, #1a1c1b, #121312);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  transition:
    background 0.15s var(--d, 0s),
    color 0.15s var(--d, 0s);
}

.is-red {
  --c: var(--lamp-red);
}
.is-green {
  --c: var(--lamp-green);
}
.is-blue {
  --c: var(--lamp-blue);
}
.is-white {
  --c: var(--lamp-white);
}

.annunciator__cell.is-on {
  color: #120c05;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--c) 80%, #fff), var(--c) 70%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.3),
    0 0 12px 1px color-mix(in srgb, var(--c) 55%, transparent);
}

.is-blink-slow {
  animation: blink 1.2s steps(1) infinite;
}
.is-blink-fast {
  animation: blink 0.35s steps(1) infinite;
}
</style>
