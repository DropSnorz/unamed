<template>
  <span class="lamp" :class="[`lamp--${color}`, { 'is-on': on, [`is-blink-${blink}`]: on && blink }]" :style="{ '--size': size }" />
</template>

<script setup>
defineProps({
  color: { type: String, default: 'green' },
  on: { type: Boolean, default: false },
  /** false | 'slow' | 'fast' */
  blink: { type: [String, Boolean], default: false },
  size: { type: String, default: '12px' }
});
</script>

<style lang="scss" scoped>
.lamp {
  --c: var(--lamp-green);
  display: inline-block;
  flex: none;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  // Dark jewel glass with chrome ring
  background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35), transparent 35%),
    radial-gradient(circle, color-mix(in srgb, var(--c) 22%, #000), #050505 80%);
  box-shadow:
    0 0 0 2px #1a1d1c,
    0 0 0 3px #7c8480,
    0 1px 2px 3px rgba(0, 0, 0, 0.6);
  transition:
    background 0.2s var(--d, 0s),
    box-shadow 0.2s var(--d, 0s);
}

.lamp--red {
  --c: var(--lamp-red);
}
.lamp--amber {
  --c: var(--lamp-amber);
}
.lamp--blue {
  --c: var(--lamp-blue);
}
.lamp--white {
  --c: var(--lamp-white);
}

.lamp.is-on {
  background: radial-gradient(circle at 35% 30%, #fff, transparent 40%), radial-gradient(circle, var(--c), color-mix(in srgb, var(--c) 45%, #000) 85%);
  box-shadow:
    0 0 0 2px #1a1d1c,
    0 0 0 3px #7c8480,
    0 0 10px 3px color-mix(in srgb, var(--c) 70%, transparent),
    0 0 22px 6px color-mix(in srgb, var(--c) 25%, transparent);
}

.is-blink-slow {
  animation: blink 1.2s steps(1) infinite;
}
.is-blink-fast {
  animation: blink 0.35s steps(1) infinite;
}
</style>
