<template>
  <span
    class="lamp"
    :class="[`lamp--${color}`, { 'is-on': on, [`is-blink-${blink}`]: on && blink }]"
    :style="{ '--size': size }"
    aria-hidden="true"
  >
    <span class="lamp__lens" />
    <span class="lamp__light" />
  </span>
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
// Jewel indicator: knurled chrome bezel, faceted glass lens, filament behind it
.lamp {
  --c: var(--lamp-green);
  position: relative;
  display: inline-block;
  flex: none;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  box-shadow:
    0 0 0 1.5px #0b0d0c,
    0 0 0 3px #aab3ae,
    0 0 0 3.5px #3e4542,
    0 0 0 4.5px #121514,
    0 2px 3px 4px rgba(0, 0, 0, 0.55);
  background: repeating-conic-gradient(#6f7773 0 10deg, #c5ccc8 10deg 20deg);
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

.lamp__lens,
.lamp__light {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

// Unlit colored glass: dark, with facets and a specular spot catching the cabin light
.lamp__lens {
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.75) 0 8%, rgba(255, 255, 255, 0.12) 18%, transparent 30%),
    repeating-conic-gradient(from 15deg, rgba(255, 255, 255, 0.1) 0 30deg, rgba(0, 0, 0, 0.18) 30deg 60deg),
    radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--c) 35%, #000), color-mix(in srgb, var(--c) 12%, #000) 70%);
  box-shadow: inset 0 -1px 2px rgba(0, 0, 0, 0.6);
}

// Lit filament: white-hot core, saturated body, bloom on the panel
.lamp__light {
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.9) 0 8%, transparent 26%),
    repeating-conic-gradient(from 15deg, rgba(255, 255, 255, 0.22) 0 30deg, rgba(0, 0, 0, 0.1) 30deg 60deg),
    radial-gradient(circle at 50% 55%, #fff 0 12%, color-mix(in srgb, var(--c) 60%, #fff) 26%, var(--c) 55%, color-mix(in srgb, var(--c) 55%, #000) 100%);
  box-shadow:
    0 0 6px 2px color-mix(in srgb, var(--c) 80%, transparent),
    0 0 16px 6px color-mix(in srgb, var(--c) 35%, transparent),
    0 0 34px 12px color-mix(in srgb, var(--c) 12%, transparent);
  opacity: 0;
  transition: opacity 0.12s var(--d, 0s);
}

.lamp.is-on .lamp__light {
  opacity: 1;
}

.is-blink-slow .lamp__light {
  animation: lamp-blink 1.2s steps(1) infinite;
}
.is-blink-fast .lamp__light {
  animation: lamp-blink 0.35s steps(1) infinite;
}

@keyframes lamp-blink {
  50% {
    opacity: 0.08;
  }
}
</style>
