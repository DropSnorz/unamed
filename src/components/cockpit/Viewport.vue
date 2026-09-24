<template>
  <div class="viewport" :class="{ 'is-lit': game.online }">
    <div class="viewport__rivets viewport__rivets--top rivets" aria-hidden="true" />
    <div class="viewport__rivets viewport__rivets--bottom rivets" aria-hidden="true" />
    <span class="viewport__stamp decal" aria-hidden="true">VIEWPORT A · TRANSPARENT ALUMINIUM 42MM · DO NOT LEAN</span>

    <div class="viewport__bezel">
      <div class="viewport__window">
        <canvas ref="canvas" class="viewport__canvas" />
        <div class="viewport__glass" />
        <div class="viewport__dust" />
        <div class="viewport__reflection" />
        <span v-for="corner in ['tl', 'tr', 'bl', 'br']" :key="corner" class="viewport__gusset" :class="`viewport__gusset--${corner}`" aria-hidden="true">
          <span class="viewport__bolt" />
        </span>

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
    </div>

    <div class="viewport__strut" aria-hidden="true">
      <span v-for="n in 4" :key="n" class="viewport__bolt" />
    </div>
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
    const x = ((hash >>> (i * 3)) % 100) / 100 * w;
    const y = ((hash >>> (i * 5)) % 100) / 100 * h;
    const r = (0.25 + ((hash >>> i) % 40) / 100) * Math.max(w, h);
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
// Riveted steel frame around the canopy glass
.viewport {
  position: relative;
  height: 100%;
  padding: 18px 14px;
  border-radius: 24px 24px 12px 12px;
  background:
    var(--tex-scratches),
    var(--tex-grain-light),
    var(--tex-grain-dark),
    var(--tex-grime),
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255, 255, 240, 0.1), transparent 60%),
    linear-gradient(180deg, #3d4c46, #29332f 50%, #1b2320);
  background-size: 400px 400px, 256px 256px, 256px 256px, 512px 512px, auto, auto;
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.16),
    inset -1px -1px 0 rgba(0, 0, 0, 0.6),
    inset 0 0 20px rgba(0, 0, 0, 0.4),
    0 0 0 1px #040505,
    0 0 0 3px #111614,
    0 12px 24px rgba(0, 0, 0, 0.7);
}

.viewport__rivets {
  position: absolute;
  height: 10px;
  --rivet-gap: 36px;

  &--top {
    top: 4px;
    left: 34px;
    right: 34px;
  }

  &--bottom {
    bottom: 4px;
    left: 34px;
    right: calc(50% + 150px);
  }

  // No room beside the stamp on narrow screens
  @media (max-width: 900px) {
    &--bottom {
      display: none;
    }
  }
}

.viewport__stamp {
  position: absolute;
  bottom: 5px;
  right: 40px;
  font-size: 7px;
}

// Chamfered inner frame sloping toward the glass
.viewport__bezel {
  height: 100%;
  padding: 6px;
  border-radius: 16px 16px 8px 8px;
  background: linear-gradient(180deg, #1a211e, #4d5d56 12%, #34413c 50%, #56665f 92%, #1e2522);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, 0.14),
    inset 0 -2px 0 rgba(0, 0, 0, 0.6),
    inset 2px 0 3px rgba(0, 0, 0, 0.35),
    inset -2px 0 3px rgba(0, 0, 0, 0.35),
    0 0 0 1px #070908;
}

.viewport__window {
  position: relative;
  // A window on space: not dimmed by the cabin darkness overlay (z-index 50)
  z-index: 51;
  height: 100%;
  overflow: hidden;
  border-radius: 12px 12px 5px 5px;
  // Black rubber gasket
  box-shadow:
    0 0 0 3px #050505,
    0 0 0 4px rgba(255, 255, 255, 0.07);
}

.viewport__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.viewport__glass,
.viewport__dust,
.viewport__reflection {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

// Reflections on the thick glass and depth shadow from the gasket
.viewport__glass {
  background:
    linear-gradient(112deg, transparent 18%, rgba(255, 255, 255, 0.055) 26%, rgba(255, 255, 255, 0.02) 30%, transparent 36%),
    linear-gradient(112deg, transparent 58%, rgba(255, 255, 255, 0.035) 62%, transparent 67%),
    radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55));
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.9),
    inset 0 6px 14px rgba(0, 0, 0, 0.7),
    inset 0 0 40px rgba(0, 0, 0, 0.6);
}

// Dust, micro scratches and a fingerprint smudge
.viewport__dust {
  background:
    radial-gradient(ellipse 12% 9% at 71% 64%, rgba(255, 255, 255, 0.05), transparent 70%),
    radial-gradient(ellipse 8% 12% at 23% 30%, rgba(255, 255, 255, 0.035), transparent 70%),
    var(--tex-glass-dust);
  background-size: auto, auto, 256px 256px;
  opacity: 0.22;
  mix-blend-mode: screen;
}

// Dashboard lights reflected at the bottom of the glass once powered
.viewport__reflection {
  background:
    radial-gradient(ellipse 30% 22% at 18% 104%, rgba(131, 255, 166, 0.1), transparent 70%),
    radial-gradient(ellipse 34% 20% at 62% 104%, rgba(255, 176, 0, 0.08), transparent 70%),
    radial-gradient(ellipse 40% 12% at 50% 104%, rgba(255, 255, 255, 0.04), transparent 70%);
  opacity: 0;
  transition: opacity 1.5s 0.8s;
}

.viewport.is-lit .viewport__reflection {
  opacity: 1;
}

// Canopy strut splitting the window in two panes
.viewport__strut {
  position: absolute;
  z-index: 52;
  top: 16px;
  bottom: 16px;
  left: 50%;
  width: 10px;
  margin-left: -5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: 28px 0;
  background:
    var(--tex-scratches),
    linear-gradient(90deg, #0c100e, #34403b 18%, #5c6b64 42%, #46534d 58%, #26302c 82%, #0c100e);
  background-size: 400px 400px, auto;
  box-shadow:
    -3px 0 6px rgba(0, 0, 0, 0.7),
    3px 0 6px rgba(0, 0, 0, 0.7);
  clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);

  .viewport__bolt {
    width: 6px;
    height: 6px;
  }
}

// Hex head bolt
.viewport__bolt {
  width: 9px;
  height: 9px;
  clip-path: polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%);
  background: conic-gradient(from -30deg, #eef2f0 0 60deg, #a3aba7 60deg 120deg, #4a514e 120deg 180deg, #2a2f2d 180deg 240deg, #666e6a 240deg 300deg, #cfd5d2 300deg 360deg);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.7));
}

// Triangular brackets bolted in the glass corners, flush with the gasket
.viewport__gusset {
  position: absolute;
  z-index: 2;
  width: 26px;
  height: 26px;
  pointer-events: none;
  background:
    var(--tex-grain-dark),
    linear-gradient(135deg, #56655f, #3a4843 55%, #2a3531);
  clip-path: polygon(0 0, 100% 0, 0 100%);
  filter: drop-shadow(1px 1px 1.5px rgba(0, 0, 0, 0.9));

  // Light catching the bevelled hypotenuse
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 47%, rgba(255, 255, 255, 0.22) 49%, transparent 53%);
  }

  .viewport__bolt {
    position: absolute;
    top: 5px;
    left: 5px;
    width: 6px;
    height: 6px;
  }

  &--tl {
    top: 0;
    left: 0;
  }
  &--tr {
    top: 0;
    right: 0;
    transform: scaleX(-1);
  }
  &--bl {
    bottom: 0;
    left: 0;
    transform: scaleY(-1);
  }
  &--br {
    bottom: 0;
    right: 0;
    transform: scale(-1, -1);
  }
}

// Frame parts drawn above the window are dimmed with the cabin until power-up
.viewport__strut,
.viewport__gusset {
  transition: filter 1.2s;
}

.viewport:not(.is-lit) {
  .viewport__strut {
    filter: brightness(0.3);
  }

  .viewport__gusset {
    filter: brightness(0.3) drop-shadow(1px 1px 1.5px rgba(0, 0, 0, 0.9));
  }
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
