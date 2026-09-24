<template>
  <div class="gauge" :class="{ 'is-on': on }">
    <svg viewBox="0 0 120 120" class="gauge__dial" role="meter" :aria-label="label" :aria-valuenow="Math.round(value * 100)" aria-valuemin="0" aria-valuemax="100">
      <defs>
        <radialGradient :id="`bezel-${uid}`" cx="40%" cy="30%">
          <stop offset="0%" stop-color="#f3d9a1" />
          <stop offset="55%" stop-color="#b08a4d" />
          <stop offset="100%" stop-color="#4f3a1b" />
        </radialGradient>
        <radialGradient :id="`face-${uid}`" cx="50%" cy="40%">
          <stop offset="0%" stop-color="#f4ecd6" />
          <stop offset="100%" stop-color="#cfc3a2" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="58" :fill="`url(#bezel-${uid})`" />
      <circle cx="60" cy="60" r="51" fill="#151412" />
      <circle cx="60" cy="60" r="49" :fill="`url(#face-${uid})`" class="gauge__face" />
      <path :d="arc(redFrom, redTo, 42)" class="gauge__zone" />
      <line v-for="tick in ticks" :key="tick.i" v-bind="tick.line" class="gauge__tick" :class="{ major: tick.major }" />
      <text x="60" y="44" class="gauge__label">{{ label }}</text>
      <text x="60" y="88" class="gauge__unit">{{ on ? readout : '---' }}</text>
      <g class="gauge__needle" :style="{ transform: `rotate(${angle}deg)` }">
        <path d="M58.6 62 L60 18 L61.4 62 Z" fill="#b3261e" />
        <path d="M59 62 L60 72 L61 62 Z" fill="#222" />
      </g>
      <circle cx="60" cy="60" r="6" fill="#2a2724" />
      <circle cx="60" cy="60" r="2.5" fill="#8b867c" />
      <!-- Glass glare -->
      <path d="M22 42 A42 42 0 0 1 88 20 A50 50 0 0 0 22 42 Z" fill="rgba(255,255,255,0.35)" />
    </svg>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';

const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, default: 0 },
  on: { type: Boolean, default: false },
  unit: { type: String, default: '%' },
  /** Red zone range, as ratios of the scale */
  red: { type: Array, default: () => [0, 0.15] },
  /** Needle vibration amplitude when powered */
  jitter: { type: Number, default: 0.006 },
  /** Delay before the needle wakes up when the cockpit powers on (ms) */
  delay: { type: Number, default: 0 }
});

const uid = useId();
const START = -120;
const SWEEP = 240;

const displayed = ref(0);
const wobble = ref(0);
let timers = [];
let wobbleTimer = null;

const angle = computed(() => START + SWEEP * Math.min(1, Math.max(0, displayed.value + wobble.value)));
const readout = computed(() => `${Math.round(props.value * 100)}${props.unit}`);
const [redFrom, redTo] = props.red;

const ticks = Array.from({ length: 21 }, (_, i) => {
  const a = ((START + (SWEEP * i) / 20 - 90) * Math.PI) / 180;
  const major = i % 5 === 0;
  const r1 = major ? 36 : 40;
  return {
    i,
    major,
    line: { x1: 60 + Math.cos(a) * r1, y1: 60 + Math.sin(a) * r1, x2: 60 + Math.cos(a) * 46, y2: 60 + Math.sin(a) * 46 }
  };
});

function arc(from, to, r) {
  const point = (ratio) => {
    const a = ((START + SWEEP * ratio - 90) * Math.PI) / 180;
    return `${60 + Math.cos(a) * r} ${60 + Math.sin(a) * r}`;
  };
  const large = (to - from) * SWEEP > 180 ? 1 : 0;
  return `M ${point(from)} A ${r} ${r} 0 ${large} 1 ${point(to)}`;
}

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
  clearInterval(wobbleTimer);
  wobble.value = 0;
}

// Power-on: needle sweeps to full scale then settles on the actual value
watch(
  () => props.on,
  (on) => {
    clearTimers();
    if (!on) {
      displayed.value = 0;
      return;
    }
    timers.push(setTimeout(() => (displayed.value = 1), props.delay));
    timers.push(
      setTimeout(() => {
        displayed.value = props.value;
        wobbleTimer = setInterval(() => (wobble.value = (Math.random() - 0.5) * 2 * props.jitter), 280);
      }, props.delay + 750)
    );
  },
  { immediate: true }
);

watch(
  () => props.value,
  (value) => {
    if (props.on && displayed.value !== 1) displayed.value = value;
  }
);

onBeforeUnmount(clearTimers);
</script>

<style lang="scss" scoped>
.gauge {
  width: 100%;
  max-width: 132px;
  aspect-ratio: 1;
  filter: drop-shadow(0 4px 5px rgba(0, 0, 0, 0.6));
}

.gauge__dial {
  display: block;
  width: 100%;
  height: 100%;
}

.gauge__face {
  transition: filter 0.6s;
  filter: brightness(0.45);
}

.gauge.is-on .gauge__face {
  filter: brightness(1) drop-shadow(0 0 6px rgba(255, 220, 150, 0.4));
}

.gauge__zone {
  fill: none;
  stroke: #b3261e;
  stroke-width: 5;
  opacity: 0.8;
}

.gauge__tick {
  stroke: #26221c;
  stroke-width: 1;

  &.major {
    stroke-width: 2.2;
  }
}

.gauge__label {
  font-family: var(--font-stencil);
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.12em;
  fill: #2c261d;
  text-anchor: middle;
}

.gauge__unit {
  font-family: var(--font-mono);
  font-size: 10px;
  fill: #3b3326;
  text-anchor: middle;
}

.gauge__needle {
  transform-origin: 60px 60px;
  transition: transform 0.7s cubic-bezier(0.34, 1.45, 0.64, 1);
}
</style>
