<template>
  <div class="push" :class="[`push--${color}`, `push--${size}`]">
    <button
      type="button"
      class="push__cap"
      :class="{ 'is-lit': lit, 'is-blink': lit === 'blink', 'is-active': active }"
      :disabled="disabled"
      :aria-pressed="active"
      :title="title"
      @click="press"
    >
      <span class="push__label">{{ label }}</span>
      <span v-if="sub" class="push__sub">{{ sub }}</span>
    </button>
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
  --c: #e9dfc4;
  --glow: var(--lamp-white);
  --w: 78px;
  --h: 58px;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.push--sm {
  --w: 52px;
  --h: 40px;
}
.push--lg {
  --w: 104px;
  --h: 72px;
}

.push--red {
  --c: #c8372a;
  --glow: var(--lamp-red);
}
.push--amber {
  --c: #e39a22;
  --glow: var(--lamp-amber);
}
.push--green {
  --c: #3fae5c;
  --glow: var(--lamp-green);
}
.push--blue {
  --c: #3a8fc0;
  --glow: var(--lamp-blue);
}

.push__cap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: var(--w);
  height: var(--h);
  padding: 0;
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  color: #1a1612;
  // Unlit translucent plastic cap
  background: linear-gradient(180deg, color-mix(in srgb, var(--c) 55%, #222), color-mix(in srgb, var(--c) 35%, #111));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 -3px 0 rgba(0, 0, 0, 0.35),
    0 0 0 3px #151816,
    0 0 0 5px #5d6561,
    0 5px 0 3px #0c0e0d,
    0 8px 10px 3px rgba(0, 0, 0, 0.55);
  transform: translateY(0);
  transition:
    transform 0.06s,
    box-shadow 0.06s,
    background 0.25s var(--d, 0s),
    filter 0.25s;

  &:active:not(:disabled),
  &.is-active {
    transform: translateY(4px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      inset 0 -1px 0 rgba(0, 0, 0, 0.35),
      0 0 0 3px #151816,
      0 0 0 5px #5d6561,
      0 1px 0 3px #0c0e0d,
      0 2px 4px 3px rgba(0, 0, 0, 0.55);
  }

  &:disabled {
    cursor: not-allowed;
    filter: saturate(0.4) brightness(0.55);
  }

  &:focus-visible {
    outline: 2px dashed var(--lamp-amber);
    outline-offset: 8px;
  }

  // Backlit cap
  &.is-lit {
    background: radial-gradient(ellipse at 50% 40%, #fff 0%, var(--glow) 35%, color-mix(in srgb, var(--c) 80%, #000) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      inset 0 -3px 0 rgba(0, 0, 0, 0.25),
      0 0 0 3px #151816,
      0 0 0 5px #5d6561,
      0 5px 0 3px #0c0e0d,
      0 0 22px 6px color-mix(in srgb, var(--glow) 45%, transparent);

    &:disabled {
      filter: none;
    }
  }

  &.is-blink {
    animation: cap-blink 1.1s steps(1) infinite;
  }
}

@keyframes cap-blink {
  50% {
    background: linear-gradient(180deg, color-mix(in srgb, var(--c) 55%, #222), color-mix(in srgb, var(--c) 35%, #111));
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      inset 0 -3px 0 rgba(0, 0, 0, 0.35),
      0 0 0 3px #151816,
      0 0 0 5px #5d6561,
      0 5px 0 3px #0c0e0d,
      0 8px 10px 3px rgba(0, 0, 0, 0.55);
  }
}

.push__label {
  font-family: var(--font-stencil);
  font-weight: 700;
  font-size: calc(var(--h) * 0.3);
  letter-spacing: 0.1em;
  line-height: 1;
}

.push__sub {
  margin-top: 3px;
  font-size: 9px;
  letter-spacing: 0.12em;
  opacity: 0.75;
}

.push__caption {
  margin-top: 6px;
  font-size: 10px;
}
</style>
