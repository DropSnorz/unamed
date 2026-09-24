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
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 3px;
  padding: 6px;
  border-radius: 5px;
  // Black anodized grid holding the legend tiles
  background:
    var(--tex-grain-light),
    linear-gradient(180deg, #111312, #070808);
  box-shadow:
    0 0 0 1px #000,
    0 0 0 3px #3e4743,
    0 1px 0 3px rgba(255, 255, 255, 0.12),
    0 -1px 0 3px rgba(0, 0, 0, 0.5),
    inset 0 2px 4px rgba(0, 0, 0, 0.9);
}

.annunciator__cell {
  --c: var(--lamp-amber);
  position: relative;
  display: grid;
  place-items: center;
  height: 30px;
  padding: 0 4px;
  border-radius: 1px;
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.05;
  letter-spacing: 0.06em;
  text-align: center;
  // Frosted glass tile, legend faintly readable when unlit
  color: color-mix(in srgb, var(--c) 18%, #3a3d3b);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.8);
  background:
    var(--tex-glass-dust),
    linear-gradient(180deg, #232624 0%, #161817 45%, #101211 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.09),
    inset 0 0 0 1px rgba(0, 0, 0, 0.8),
    inset 0 -4px 6px rgba(0, 0, 0, 0.4);
  transition:
    background 0.15s var(--d, 0s),
    color 0.15s var(--d, 0s);

  // Glass sheen, always on top
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(170deg, rgba(255, 255, 255, 0.12), transparent 40%);
  }
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
  color: color-mix(in srgb, var(--c) 25%, #140c04);
  text-shadow: 0 0 1px rgba(255, 255, 255, 0.4);
  background:
    var(--tex-glass-dust),
    radial-gradient(ellipse 75% 90% at 50% 50%, color-mix(in srgb, var(--c) 45%, #fff), var(--c) 55%, color-mix(in srgb, var(--c) 70%, #000) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    inset 0 0 0 1px rgba(0, 0, 0, 0.5),
    inset 0 0 10px color-mix(in srgb, var(--c) 60%, #fff),
    0 0 10px 1px color-mix(in srgb, var(--c) 55%, transparent),
    0 0 22px 4px color-mix(in srgb, var(--c) 18%, transparent);
  z-index: 1;
}

.is-blink-slow {
  animation: blink 1.2s steps(1) infinite;
}
.is-blink-fast {
  animation: blink 0.35s steps(1) infinite;
}
</style>
