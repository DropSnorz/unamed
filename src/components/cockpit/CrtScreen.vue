<template>
  <div class="crt" :class="[`crt--${tone}`, { 'is-on': on }]" :style="{ '--d': delay }">
    <Screws :size="5" :inset="3" />
    <div class="crt__glass">
      <div class="crt__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import Screws from './Screws.vue';

defineProps({
  tone: { type: String, default: 'green' },
  on: { type: Boolean, default: false },
  /** Power-up delay, used to stagger screens when the cockpit boots */
  delay: { type: String, default: '0s' }
});
</script>

<style lang="scss" scoped>
.crt {
  --fg: var(--crt-green);
  --fg-dim: var(--crt-green-dim);
  --screen: var(--crt-green-bg);
  position: relative;
  height: 100%;
  padding: 10px;
  border-radius: 16px;
  // Molded bakelite bezel
  background:
    var(--tex-grain-light),
    var(--tex-grain-dark),
    radial-gradient(ellipse 120% 60% at 30% 0%, rgba(255, 255, 255, 0.12), transparent 60%),
    linear-gradient(160deg, #3b403d, #1b1e1c 55%, #111312);
  box-shadow:
    0 0 0 1px #050606,
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 1px 0 0 rgba(255, 255, 255, 0.06),
    inset 0 -2px 0 rgba(0, 0, 0, 0.7),
    0 4px 10px rgba(0, 0, 0, 0.7);
}

.crt--amber {
  --fg: var(--amber);
  --fg-dim: var(--amber-dim);
  --screen: var(--amber-bg);
}

.crt__glass {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 12px / 16px;
  background: #070908;
  // Chamfered lip between bezel and tube, then the tube depth
  box-shadow:
    0 0 0 1px #000,
    0 0 0 3px #262a28,
    0 1px 0 3px rgba(255, 255, 255, 0.1),
    0 -1px 0 3px rgba(0, 0, 0, 0.6),
    inset 0 0 22px rgba(0, 0, 0, 0.95),
    inset 0 3px 6px rgba(0, 0, 0, 0.8);
  transition: background 0.4s var(--d);

  // Scanlines
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: repeating-linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0 1px, transparent 1px 3px);
  }

  // Curvature vignette and glass glare
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    background:
      linear-gradient(125deg, rgba(255, 255, 255, 0.07), transparent 28%),
      radial-gradient(ellipse at center, transparent 58%, rgba(0, 0, 0, 0.55) 100%);
  }
}

.crt__content {
  position: relative;
  z-index: 1;
  height: 100%;
  color: var(--fg);
  text-shadow: 0 0 4px var(--fg-dim), 0 0 1px var(--fg);
  opacity: 0;
  transition: opacity 0.3s;
}

.crt.is-on {
  .crt__glass {
    background: radial-gradient(ellipse at center, color-mix(in srgb, var(--screen), var(--fg) 5%), var(--screen) 75%);
  }

  .crt__content {
    opacity: 1;
    animation:
      crt-on 0.55s cubic-bezier(0.2, 0.8, 0.3, 1) var(--d) both,
      crt-flicker 6s linear calc(var(--d) + 0.6s) infinite;
  }
}

@keyframes crt-on {
  0% {
    transform: scale(1, 0.004);
    filter: brightness(4);
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  45% {
    transform: scale(1, 0.004);
    filter: brightness(4);
  }
  70% {
    transform: scale(1, 1.04);
    filter: brightness(1.6);
  }
  100% {
    transform: scale(1, 1);
    filter: brightness(1);
    opacity: 1;
  }
}

@keyframes crt-flicker {
  0%,
  96%,
  100% {
    opacity: 1;
  }
  97% {
    opacity: 0.86;
  }
  98% {
    opacity: 0.97;
  }
}
</style>
