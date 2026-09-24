<template>
  <div class="push" :class="[`push--${color}`, `push--${size}`, { 'is-lit': lit, 'is-blink': lit === 'blink', 'is-disabled': disabled }]">
    <div class="push__housing">
      <button
        type="button"
        class="push__cap"
        :class="{ 'is-active': active }"
        :disabled="disabled"
        :aria-pressed="active"
        :title="title"
        @click="press"
      >
        <span class="push__glow" aria-hidden="true" />
        <span class="push__lens" aria-hidden="true" />
        <span class="push__label">{{ label }}</span>
        <span v-if="sub" class="push__sub">{{ sub }}</span>
      </button>
    </div>
    <span v-if="caption" class="plate push__caption">{{ caption }}</span>
  </div>
</template>

<script setup>
import { sfx } from '../../audio/sfx';

defineProps({
  label: { type: String, required: true },
  sub: { type: String, default: '' },
  caption: { type: String, default: '' },
  title: { type: String, default: '' },
  color: { type: String, default: 'cream' },
  size: { type: String, default: 'md' },
  /** true | false | 'blink' */
  lit: { type: [Boolean, String], default: false },
  /** Held down (a command it triggers is running) */
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(['press']);

function press() {
  sfx.button();
  emit('press');
}
</script>

<style lang="scss" scoped>
.push {
  --c: #e6dcc0;
  --glow: #fff1cf;
  --w: 70px;
  --h: 50px;
  --travel: 4px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
}

.push--sm {
  --w: 46px;
  --h: 34px;
  --travel: 3px;
}
.push--lg {
  --w: 92px;
  --h: 62px;
  --travel: 5px;
}

.push--red {
  --c: #c63a2b;
  --glow: #ff4a36;
}
.push--amber {
  --c: #e29a25;
  --glow: #ffb12e;
}
.push--green {
  --c: #3aa656;
  --glow: #4dff82;
}
.push--blue {
  --c: #3b8fc2;
  --glow: #5fd0ff;
}

// Machined collar around the cap
.push__housing {
  position: relative;
  padding: 7px;
  border-radius: 10px;
  background:
    var(--tex-brushed),
    linear-gradient(150deg, #9aa4a0 0%, #56605b 22%, #2b322f 55%, #161a18 100%);
  box-shadow:
    0 0 0 1px #040505,
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 1px 0 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.7),
    0 3px 4px rgba(0, 0, 0, 0.65),
    0 6px 12px rgba(0, 0, 0, 0.35);

  // The dark hole the cap sits in
  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 7px;
    background: #030404;
    box-shadow:
      inset 0 2px 3px rgba(0, 0, 0, 0.95),
      0 1px 0 rgba(255, 255, 255, 0.18);
  }

  // Backlight spilling on the collar
  &::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 14px;
    pointer-events: none;
    background: radial-gradient(closest-side, color-mix(in srgb, var(--glow) 35%, transparent), transparent);
    opacity: 0;
    transition: opacity 0.2s var(--d, 0s);
    mix-blend-mode: screen;
  }
}

.push__cap {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: var(--w);
  height: var(--h);
  padding: 0;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  color: #17130f;
  overflow: visible;
  // Translucent plastic cap, unlit
  background:
    radial-gradient(ellipse 85% 40% at 50% 6%, rgba(255, 255, 255, 0.42), transparent 70%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--c) 72%, #fff 8%),
      color-mix(in srgb, var(--c) 58%, #1b1b1b) 55%,
      color-mix(in srgb, var(--c) 32%, #000)
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 1px 0 0 rgba(255, 255, 255, 0.15),
    inset -1px 0 0 rgba(0, 0, 0, 0.25),
    inset 0 -3px 5px rgba(0, 0, 0, 0.35),
    // Cap side wall: the cap stands proud of the collar
    0 var(--travel) 0 color-mix(in srgb, var(--c) 30%, #000),
    0 calc(var(--travel) + 1px) 0 #020303,
    0 calc(var(--travel) + 2px) 5px rgba(0, 0, 0, 0.8);
  transform: translateY(calc(var(--travel) * -1));
  transition:
    transform 0.05s ease-out,
    box-shadow 0.05s ease-out,
    filter 0.3s;

  &:active:not(:disabled),
  &.is-active {
    transform: translateY(-1px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.45),
      inset 0 -2px 3px rgba(0, 0, 0, 0.35),
      0 1px 0 color-mix(in srgb, var(--c) 30%, #000),
      0 2px 0 #020303,
      0 2px 3px rgba(0, 0, 0, 0.8);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 10px;
  }
}

.push.is-disabled:not(.is-lit) .push__cap {
  filter: saturate(0.55) brightness(0.62);
}

// Backlight behind the diffuser: hot center, falloff to the edges, bloom around
.push__glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background:
    radial-gradient(ellipse 85% 40% at 50% 6%, rgba(255, 255, 255, 0.55), transparent 70%),
    radial-gradient(
      ellipse 70% 80% at 50% 52%,
      #fff 0%,
      color-mix(in srgb, var(--glow) 55%, #fff) 22%,
      var(--glow) 55%,
      color-mix(in srgb, var(--glow) 55%, #000) 100%
    );
  box-shadow:
    0 0 14px 3px color-mix(in srgb, var(--glow) 55%, transparent),
    0 0 36px 10px color-mix(in srgb, var(--glow) 18%, transparent);
  opacity: 0;
  transition: opacity 0.18s var(--d, 0s);
}

// Fresnel diffuser ribs molded in the cap
.push__lens {
  position: absolute;
  inset: 3px;
  border-radius: 4px;
  pointer-events: none;
  background:
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.1) 0 1px, transparent 1px 4px),
    repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.06) 0 1px, transparent 1px 4px);
  mix-blend-mode: overlay;
}

.push.is-lit {
  .push__glow,
  .push__housing::after {
    opacity: 1;
  }
}

.push.is-blink {
  .push__glow,
  .push__housing::after {
    animation: glow-blink 1.1s steps(1) infinite;
  }
}

@keyframes glow-blink {
  50% {
    opacity: 0;
  }
}

.push__label {
  position: relative;
  font-family: var(--font-stencil);
  font-weight: 700;
  font-size: calc(var(--h) * 0.32);
  letter-spacing: 0.1em;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
}

.push__sub {
  position: relative;
  margin-top: 3px;
  font-size: 8px;
  letter-spacing: 0.16em;
  opacity: 0.75;
}

.push__caption {
  margin-top: 5px;
  font-size: 10px;
}
</style>
