<template>
  <div class="viewport">
    <div class="viewport__window">
      <canvas ref="canvas" class="viewport__canvas" />
      <div class="viewport__glass" />

      <div class="viewport__hud" :class="{ 'is-on': game.online }">
        <div class="hud__corner hud__corner--tl">
          <div>SYS {{ system?.name }}</div>
          <div class="hud__dim">CONST {{ game.currentConstellation?.name }}</div>
        </div>
        <div class="hud__corner hud__corner--tr">
          <div>CLASS {{ system?.star.class }}{{ system?.star.subclass }} · {{ system?.star.temperature }} K</div>
          <div class="hud__dim">HDG {{ heading }}°</div>
        </div>
        <svg class="hud__reticle" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="18" />
          <path d="M50 22v12M50 66v12M22 50h12M66 50h12" />
          <path d="M8 20V8h12M92 20V8H80M8 80v12h12M92 80v12H80" />
        </svg>
        <div v-if="banner" class="hud__banner">{{ banner }}</div>
      </div>
    </div>
    <div class="viewport__strut" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useGameStore } from '../../stores/game';
import { useCanvas } from './useCanvas';

const game = useGameStore();
const canvas = ref(null);
const system = computed(() => game.currentSystem);

const lastHeading = ref(0);
watch(
  () => game.jump?.target,
  (target) => target && (lastHeading.value = target.bearing)
);
const heading = computed(() => String(Math.round(lastHeading.value) % 360).padStart(3, '0'));

const banner = computed(() => {
  const stage = game.jump?.stage;
  if (stage === 'align') return `ALIGNING ▸ ${game.jump.target.name}`;
  if (stage === 'warp') return 'JUMP DRIVE ENGAGED';
  if (game.scan.active) return 'SCANNING';
  return '';
});

// ---- Starfield simulation -------------------------------------------------
const STAR_COUNT = 650;
const stars = Array.from({ length: STAR_COUNT }, () => spawn(Math.random()));
let speed = 0.02;
let yaw = 0;
let yawVelocity = 0;
let starAlpha = 0;
let nebulaAlpha = 0;
let sunAlpha = 0;
let flash = 0;
let nebula = null;
let nebulaSeed = null;

function spawn(z = 1) {
  const tints = ['255,255,255', '200,215,255', '255,236,200', '255,210,170'];
  return {
    x: (Math.random() * 2 - 1) * 1.6,
    y: (Math.random() * 2 - 1) * 1.0,
    z: Math.max(0.02, z),
    size: Math.random() < 0.08 ? 1.6 : Math.random() * 0.9 + 0.3,
    tint: tints[Math.floor(Math.random() * tints.length)]
  };
}

watch(
  () => game.currentSystemId,
  (id, previous) => {
    if (previous && id !== previous) flash = 1;
  }
);

function buildNebula(w, h) {
  const seed = game.cluster?.seed || '';
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const ctx = off.getContext('2d');
  const hue = hash % 360;
  for (let i = 0; i < 5; i++) {
    const x = ((hash >> (i * 3)) % 100) / 100 * w;
    const y = ((hash >> (i * 5)) % 100) / 100 * h;
    const r = (0.25 + ((hash >> i) % 40) / 100) * Math.max(w, h);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${(hue + i * 35) % 360}, 70%, 45%, 0.16)`);
    g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  nebula = off;
  nebulaSeed = seed;
}

function approach(value, target, rate, dt) {
  return value + (target - value) * Math.min(1, rate * dt);
}

function draw(ctx, w, h, dt) {
  const stage = game.jump?.stage;
  const booted = game.phase !== 'offline';

  // Targets driven by the game state
  const targetSpeed = stage === 'warp' ? 2.4 : stage === 'align' ? 0.01 : 0.02;
  speed = approach(speed, targetSpeed, stage === 'warp' ? 0.9 : 1.6, dt);
  yawVelocity = approach(yawVelocity, stage === 'align' ? w * 0.18 : 0, 2.5, dt);
  yaw += yawVelocity * dt;
  starAlpha = approach(starAlpha, booted && game.bootStage >= 1 ? 1 : game.phase === 'online' ? 1 : 0, 0.6, dt);
  nebulaAlpha = approach(nebulaAlpha, booted && game.bootStage >= 2 ? 1 : game.phase === 'online' ? 1 : 0, 0.4, dt);
  sunAlpha = approach(sunAlpha, (game.bootStage >= 3 || game.online) && !stage ? 1 : 0, stage ? 3 : 0.8, dt);
  flash = Math.max(0, flash - dt * 1.4);
  // Once aligned, the course is dead ahead: recenter the view
  if (stage === 'warp') yaw = approach(yaw, 0, 3, dt);
  else if (!stage && yawVelocity < 1) yaw = approach(yaw, 0, 0.6, dt);

  ctx.fillStyle = '#010203';
  ctx.fillRect(0, 0, w, h);

  if (nebulaAlpha > 0.01) {
    if (!nebula || nebula.width !== w || nebula.height !== h || nebulaSeed !== (game.cluster?.seed || '')) buildNebula(w, h);
    ctx.globalAlpha = nebulaAlpha;
    ctx.drawImage(nebula, 0, 0);
    ctx.globalAlpha = 1;
  }

  const f = Math.max(w, h) * 0.5;
  const cx = w / 2;
  const cy = h / 2;
  const streak = speed > 0.25;

  for (const star of stars) {
    const previousZ = star.z;
    star.z -= speed * dt;
    if (star.z <= 0.02) {
      Object.assign(star, spawn(1));
      continue;
    }
    let sx = cx + (star.x / star.z) * f + yaw;
    const sy = cy + (star.y / star.z) * f;
    // Rotation (yaw) is uniform on screen: wrap stars horizontally
    sx = ((sx % (w + 40)) + (w + 40)) % (w + 40) - 20;
    if (sy < -20 || sy > h + 20) continue;
    const depth = 1 - star.z;
    const alpha = starAlpha * Math.min(1, 0.25 + depth * 1.1);
    if (alpha <= 0.01) continue;
    if (streak) {
      // Trail toward the previous position, clamped for stars grazing the camera
      let dx = (star.x / star.z - star.x / previousZ) * f * 6;
      let dy = (star.y / star.z - star.y / previousZ) * f * 6;
      const length = Math.hypot(dx, dy);
      const max = w * 0.18;
      if (length > max) {
        dx *= max / length;
        dy *= max / length;
      }
      const px = sx - dx;
      const py = sy - dy;
      ctx.strokeStyle = `rgba(${star.tint},${alpha})`;
      ctx.lineWidth = star.size * (0.6 + depth);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(${star.tint},${alpha})`;
      const size = star.size * (0.5 + depth * 1.3);
      ctx.fillRect(sx, sy, size, size);
    }
  }

  if (system.value && sunAlpha > 0.01) drawSun(ctx, w, h);

  if (flash > 0) {
    ctx.fillStyle = `rgba(230,240,255,${flash * 0.85})`;
    ctx.fillRect(0, 0, w, h);
  }
}

function drawSun(ctx, w, h) {
  const star = system.value.star;
  const x = w * 0.72 + yaw * 1.4;
  const y = h * 0.4;
  const r = 7 + Math.log2(1 + star.radius) * 9;
  ctx.globalAlpha = sunAlpha;
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
  glow.addColorStop(0, star.color);
  glow.addColorStop(0.15, hexToRgba(star.color, 0.45));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Lens flare streak
  ctx.fillStyle = hexToRgba(star.color, 0.25);
  ctx.fillRect(x - r * 9, y - 0.75, r * 18, 1.5);
  ctx.globalAlpha = 1;
}

function hexToRgba(hex, alpha) {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
}

useCanvas(canvas, draw);
</script>

<style lang="scss" scoped>
.viewport {
  position: relative;
  height: 100%;
  padding: 12px;
  border-radius: 22px 22px 12px 12px;
  background: linear-gradient(180deg, #2d3834, #1a211e);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.1),
    inset 0 0 0 1px #0a0d0c,
    0 8px 18px rgba(0, 0, 0, 0.7);

  // Bolts around the window frame
  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 20px 20px 10px 10px;
    pointer-events: none;
    background:
      radial-gradient(circle, #8f9894 0 1.5px, #1c211f 2px 3px, transparent 3.5px) 19px 0 / 38px 8px repeat-x,
      radial-gradient(circle, #8f9894 0 1.5px, #1c211f 2px 3px, transparent 3.5px) 19px 100% / 38px 8px repeat-x;
    opacity: 0.8;
  }
}

.viewport__window {
  position: relative;
  // A window on space: not dimmed by the cabin darkness overlay (z-index 50)
  z-index: 51;
  height: 100%;
  overflow: hidden;
  border-radius: 14px 14px 6px 6px;
  box-shadow:
    inset 0 0 0 3px #0b0e0d,
    inset 0 0 30px rgba(0, 0, 0, 0.9);
}

.viewport__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.viewport__glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(115deg, transparent 20%, rgba(255, 255, 255, 0.05) 28%, transparent 36%),
    linear-gradient(115deg, transparent 60%, rgba(255, 255, 255, 0.03) 64%, transparent 68%),
    radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55));
  box-shadow: inset 0 0 0 3px #0b0e0d;
}

// Canopy strut splitting the window in two panes
.viewport__strut {
  position: absolute;
  z-index: 52;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 18px;
  margin-left: -9px;
  background: linear-gradient(90deg, #111614, #3d4a45 35%, #56645e 50%, #2c3632 70%, #0f1312);
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.8);
  clip-path: polygon(0 0, 100% 0, 70% 100%, 30% 100%);
}

.viewport__hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: rgba(255, 190, 90, 0.85);
  font-family: var(--font-crt);
  font-size: 17px;
  text-shadow: 0 0 6px rgba(255, 150, 30, 0.7);
  opacity: 0;
  transition: opacity 0.8s 1.2s;

  &.is-on {
    opacity: 1;
  }
}

.hud__corner {
  position: absolute;
  top: 12px;
  line-height: 1.05;

  &--tl {
    left: 18px;
  }

  &--tr {
    right: 18px;
    text-align: right;
  }
}

.hud__dim {
  opacity: 0.6;
}

.hud__reticle {
  position: absolute;
  left: 25%;
  top: 50%;
  width: 90px;
  height: 90px;
  margin: -45px 0 0 -45px;
  fill: none;
  stroke: rgba(255, 190, 90, 0.45);
  stroke-width: 1.2;
}

.hud__banner {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  padding: 2px 14px;
  border: 1px solid rgba(255, 190, 90, 0.6);
  background: rgba(40, 20, 0, 0.45);
  letter-spacing: 0.2em;
  font-size: 20px;
  white-space: nowrap;
  animation: blink 0.9s steps(1) infinite;
}
</style>
