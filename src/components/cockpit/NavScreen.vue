<template>
  <div class="nav">
    <div class="nav__screen">
      <CrtScreen tone="amber" :on="game.online" delay="0.45s">
        <canvas ref="canvas" class="nav__canvas" :class="{ 'is-pickable': cockpit.navMode === 'sector' }" @click="onClick" />
      </CrtScreen>
    </div>
    <div class="nav__modes">
      <PushButton
        v-for="mode in modes"
        :key="mode.id"
        size="sm"
        color="amber"
        :label="mode.label"
        :title="mode.title"
        :lit="game.online && cockpit.navMode === mode.id"
        :disabled="!game.online"
        @press="cockpit.setNavMode(mode.id)"
      />
      <span class="plate nav__plate">NAV DISPLAY</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import CrtScreen from './CrtScreen.vue';
import PushButton from './PushButton.vue';
import { useCanvas } from './useCanvas';
import { useGameStore } from '../../stores/game';
import { useCockpitStore } from '../../stores/cockpit';
import { sfx } from '../../audio/sfx';

const game = useGameStore();
const cockpit = useCockpitStore();
const canvas = ref(null);

const modes = [
  { id: 'system', label: 'SYS', title: 'Solar system map' },
  { id: 'sector', label: 'SEC', title: 'Sector map: nearby signatures' },
  { id: 'cluster', label: 'CLU', title: 'Cluster chart' }
];

// The display follows what the ship is doing, whoever triggered it
watch(() => game.scan.active, (active) => active && cockpit.setNavMode('sector'));
watch(() => game.jump?.stage, (stage) => stage === 'align' && cockpit.setNavMode('sector'));
watch(() => game.currentSystemId, () => cockpit.setNavMode('system'));

// Screen positions of selectable signatures (sector mode), refreshed every frame
let pickables = [];

function onClick(event) {
  if (cockpit.navMode !== 'sector' || game.jump || !game.online) return;
  const rect = canvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let best = null;
  for (const p of pickables) {
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < 16 && (!best || d < best.d)) best = { ...p, d };
  }
  if (best) {
    game.selectTarget(best.id);
    sfx.beep();
  }
}

// ---- Drawing ---------------------------------------------------------------
const amber = (alpha = 1) => `rgba(255,176,0,${alpha})`;
const FONT = '"VT323", monospace';

function draw(ctx, w, h, dt, t) {
  ctx.clearRect(0, 0, w, h);
  pickables = [];
  if (!game.online || !game.currentSystem) return;
  ctx.lineCap = 'round';
  ctx.textBaseline = 'middle';
  if (cockpit.navMode === 'system') drawSystem(ctx, w, h, t);
  else if (cockpit.navMode === 'sector') drawSector(ctx, w, h, t);
  else drawCluster(ctx, w, h, t);
  drawFrame(ctx, w);
}

function text(ctx, value, x, y, { size = 16, align = 'left', alpha = 1 } = {}) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillStyle = amber(alpha);
  ctx.fillText(value, x, y);
}

function circle(ctx, x, y, r, { fill = false, alpha = 1, dash = null, width = 1 } = {}) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.setLineDash(dash || []);
  if (fill) {
    ctx.fillStyle = amber(alpha);
    ctx.fill();
  } else {
    ctx.strokeStyle = amber(alpha);
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function line(ctx, x1, y1, x2, y2, { alpha = 1, dash = null, width = 1 } = {}) {
  ctx.beginPath();
  ctx.setLineDash(dash || []);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = amber(alpha);
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.setLineDash([]);
}

function reticle(ctx, x, y, t, size = 8) {
  const pulse = 0.55 + 0.45 * Math.abs(Math.sin(t * 3));
  circle(ctx, x, y, size, { alpha: pulse, width: 1.5 });
  line(ctx, x - size - 6, y, x - size + 2, y, { alpha: pulse });
  line(ctx, x + size - 2, y, x + size + 6, y, { alpha: pulse });
  line(ctx, x, y - size - 6, x, y - size + 2, { alpha: pulse });
  line(ctx, x, y + size - 2, x, y + size + 6, { alpha: pulse });
}

function brackets(ctx, x, y, s) {
  const k = s * 0.45;
  ctx.strokeStyle = amber(1);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    ctx.moveTo(x + dx * s, y + dy * (s - k));
    ctx.lineTo(x + dx * s, y + dy * s);
    ctx.lineTo(x + dx * (s - k), y + dy * s);
  }
  ctx.stroke();
}

function drawFrame(ctx, w) {
  const titles = {
    system: `SYSTEM // ${game.currentSystem.name}`,
    sector: `SECTOR // ${game.currentConstellation.name}`,
    cluster: `CLUSTER // SEED ${game.cluster.seed}`
  };
  text(ctx, titles[cockpit.navMode], 14, 16, { size: 18 });
  line(ctx, 12, 28, w - 12, 28, { alpha: 0.25 });
}

function drawSystem(ctx, w, h, t) {
  const system = game.currentSystem;
  const star = system.star;
  const cx = w / 2;
  const cy = h / 2 + 12;
  const maxR = Math.min(w - 40, h - 70) / 2;
  const starR = 5 + Math.min(10, Math.log2(1 + star.radius) * 3.2);

  // Star with slowly rotating corona
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR * 3.2);
  glow.addColorStop(0, amber(0.9));
  glow.addColorStop(0.35, amber(0.35));
  glow.addColorStop(1, amber(0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx - starR * 4, cy - starR * 4, starR * 8, starR * 8);
  circle(ctx, cx, cy, starR, { fill: true });
  for (let i = 0; i < 8; i++) {
    const a = t * 0.2 + (i * Math.PI) / 4;
    line(ctx, cx + Math.cos(a) * (starR + 3), cy + Math.sin(a) * (starR + 3), cx + Math.cos(a) * (starR + 8), cy + Math.sin(a) * (starR + 8), { alpha: 0.6 });
  }

  text(ctx, `CLASS ${star.class}${star.subclass}  ${star.temperature} K  ${star.radius.toFixed(2)} R☉`, 14, h - 16, { size: 16, alpha: 0.8 });

  if (!game.scanned.has(system.id)) {
    for (const ratio of [0.45, 0.72, 1]) circle(ctx, cx, cy, maxR * ratio, { alpha: 0.18, dash: [3, 7] });
    if (Math.sin(t * 4) > -0.3) {
      text(ctx, 'ORBITAL DATA UNAVAILABLE', cx, cy - maxR * 0.45 - 18, { size: 18, align: 'center' });
      text(ctx, '> RUN SCAN <', cx, cy + maxR * 0.45 + 18, { size: 18, align: 'center' });
    }
    return;
  }

  const planets = system.planets;
  const minOrbit = Math.log(planets[0].orbit);
  const maxOrbit = Math.log(planets[planets.length - 1].orbit);
  const minPeriod = planets[0].period;
  const r0 = starR + 18;
  text(ctx, `${planets.length} BODIES`, w - 14, h - 16, { size: 16, align: 'right', alpha: 0.8 });

  for (const planet of planets) {
    const ratio = planets.length > 1 ? (Math.log(planet.orbit) - minOrbit) / (maxOrbit - minOrbit) : 0.6;
    const r = r0 + ratio * (maxR - r0);
    circle(ctx, cx, cy, r, { alpha: 0.22, dash: [2, 5] });
    // Inner planet does a revolution in ~20s, outer ones follow Kepler's pace
    const angle = planet.phase + (t * Math.PI * 2) / (20 * Math.sqrt(planet.period / minPeriod));
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const gas = planet.type === 'Gas';
    const size = gas ? 4 + planet.radius / 4 : 2 + planet.radius * 1.2;
    circle(ctx, x, y, size, { fill: true, alpha: planet.type === 'Plasma' ? 0.6 + 0.4 * Math.sin(t * 8) : 1 });
    if (gas) {
      ctx.beginPath();
      ctx.ellipse(x, y, size * 1.9, size * 0.55, -0.4, 0, Math.PI * 2);
      ctx.strokeStyle = amber(0.8);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    text(ctx, planet.name.split(' ').pop(), x + size + 5, y - size - 3, { size: 14, alpha: 0.85 });
  }
}

function drawSector(ctx, w, h, t) {
  const system = game.currentSystem;
  const constellation = game.currentConstellation;
  const cx = w / 2;
  const cy = h / 2 + 14;
  const boundary = constellation.radius + 0.9;
  // Keep room on the sides for gate labels
  const scale = Math.min(w - 170, h - 80) / 2 / boundary;
  const project = (p) => ({ x: cx + (p.x - constellation.x) * scale, y: cy + (p.y - constellation.y) * scale });
  const origin = project(system);
  const { stars, gates } = game.signatures;
  const sweeping = game.scan.active;
  const sweep = game.scan.progress * 360;
  const revealed = (target) => game.known.has(target.id) || (sweeping && target.bearing <= sweep);

  circle(ctx, cx, cy, boundary * scale, { alpha: 0.35, dash: [6, 6] });
  for (let r = 2; r < boundary * 2; r += 2) circle(ctx, origin.x, origin.y, r * scale, { alpha: 0.07 });

  // Scanner sweep with its fading trail
  if (sweeping) {
    const length = Math.max(w, h);
    for (let i = 0; i < 24; i++) {
      const a = ((sweep - i * 1.5 - 90) * Math.PI) / 180;
      line(ctx, origin.x, origin.y, origin.x + Math.cos(a) * length, origin.y + Math.sin(a) * length, { alpha: (1 - i / 24) * (i ? 0.18 : 0.9), width: i ? 3 : 1.5 });
    }
  }

  // Gates: arrows on the boundary pointing toward linked constellations
  const gatePosition = (gate) => {
    const a = Math.atan2(gate.y - constellation.y, gate.x - constellation.x);
    return { a, x: cx + Math.cos(a) * boundary * scale, y: cy + Math.sin(a) * boundary * scale };
  };
  for (const gate of gates) {
    if (!revealed(gate)) continue;
    const { a, x, y } = gatePosition(gate);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
    ctx.lineTo(x + Math.cos(a + 2.4) * 8, y + Math.sin(a + 2.4) * 8);
    ctx.lineTo(x + Math.cos(a - 2.4) * 8, y + Math.sin(a - 2.4) * 8);
    ctx.closePath();
    ctx.fillStyle = amber(game.visited.has(gate.id) ? 0.5 : 1);
    ctx.fill();
    const lx = x + Math.cos(a) * 24;
    const ly = y + Math.sin(a) * 24;
    const align = Math.cos(a) > 0.3 ? 'left' : Math.cos(a) < -0.3 ? 'right' : 'center';
    text(ctx, gate.name, lx, ly, { size: 15, align });
    text(ctx, `${gate.distance.toFixed(1)}LY`, lx, ly + 13, { size: 13, align, alpha: 0.6 });
    pickables.push({ id: gate.id, x, y });
  }

  for (const star of stars) {
    if (!revealed(star)) continue;
    const p = project(star);
    const visited = game.visited.has(star.id);
    circle(ctx, p.x, p.y, 4, { fill: visited, alpha: visited ? 0.8 : 1, width: 1.5 });
    text(ctx, star.name.split('-').pop(), p.x + 8, p.y - 8, { size: 15 });
    pickables.push({ id: star.id, x: p.x, y: p.y });
  }

  reticle(ctx, origin.x, origin.y, t);
  circle(ctx, origin.x, origin.y, 3, { fill: true });

  // Target lock: dashed course line, brackets, and the ship moving during a jump
  const target = game.jump?.target || game.selectedTarget;
  if (target) {
    const p = target.kind === 'gate' ? gatePosition(target) : project(target);
    line(ctx, origin.x, origin.y, p.x, p.y, { alpha: 0.9, dash: game.jump ? null : [4, 5] });
    brackets(ctx, p.x, p.y, 10);
    if (game.jump?.stage === 'warp') {
      const k = (t * 1.2) % 1;
      circle(ctx, origin.x + (p.x - origin.x) * k, origin.y + (p.y - origin.y) * k, 3.5, { fill: true });
    }
  }

  const known = [...stars, ...gates].filter((s) => game.known.has(s.id)).length;
  text(ctx, `SIGNATURES ${known}/${stars.length + gates.length}`, 14, h - 16, { size: 16, alpha: 0.8 });
  if (!sweeping && !game.currentScanned && Math.sin(t * 4) > -0.3) {
    text(ctx, 'SCAN REQUIRED', w - 14, h - 16, { size: 16, align: 'right' });
  } else if (target) {
    text(ctx, `LOCK ${target.name} BRG ${String(Math.round(target.bearing) % 360).padStart(3, '0')}`, w - 14, h - 16, { size: 16, align: 'right' });
  }
}

function drawCluster(ctx, w, h, t) {
  const cluster = game.cluster;
  const current = game.currentConstellation;
  const all = cluster.data.constellations;
  const charted = all.filter((c) => game.known.has(c.id));
  let extent = 20;
  for (const c of charted) extent = Math.max(extent, Math.abs(c.x - current.x) + 12, Math.abs(c.y - current.y) + 12);
  const scale = Math.min((w - 40) / 2, (h - 80) / 2) / extent;
  const cx = w / 2;
  const cy = h / 2 + 10;
  const project = (c) => ({ x: cx + (c.x - current.x) * scale, y: cy + (c.y - current.y) * scale });
  const inside = (p) => p.x > 6 && p.x < w - 6 && p.y > 32 && p.y < h - 30;

  // Uncharted background: every constellation as a faint speck
  ctx.fillStyle = amber(0.16);
  for (const c of all) {
    const p = project(c);
    if (inside(p)) ctx.fillRect(p.x, p.y, 1.2, 1.2);
  }

  for (const c of charted) {
    const a = project(c);
    for (const id of c.links) {
      if (id < c.id || !game.known.has(id)) continue;
      const b = project(cluster.constellation(id));
      const travelled = game.visited.has(c.id) && game.visited.has(id);
      line(ctx, a.x, a.y, b.x, b.y, { alpha: travelled ? 0.7 : 0.25, dash: travelled ? null : [3, 4] });
    }
  }

  const labels = charted.length <= 40;
  for (const c of charted) {
    const p = project(c);
    if (!inside(p)) continue;
    const visited = game.visited.has(c.id);
    circle(ctx, p.x, p.y, 3, { fill: visited, alpha: visited ? 0.9 : 0.7 });
    if (labels && c.id !== current.id) text(ctx, c.name, p.x + 6, p.y - 7, { size: 13, alpha: visited ? 0.85 : 0.5 });
  }

  const here = project(current);
  reticle(ctx, here.x, here.y, t, 7);
  text(ctx, current.name, here.x + 12, here.y - 12, { size: 15 });

  const visitedCount = all.filter((c) => game.visited.has(c.id)).length;
  text(ctx, `CHARTED ${visitedCount}/${all.length}`, 14, h - 16, { size: 16, alpha: 0.8 });
  text(ctx, `${Math.round(extent * 2)} LY`, w - 14, h - 16, { size: 16, align: 'right', alpha: 0.8 });
}

useCanvas(canvas, draw);
</script>

<style lang="scss" scoped>
.nav {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.nav__screen {
  flex: 1;
  min-height: 0;
}

.nav__canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;

  &.is-pickable {
    cursor: crosshair;
  }
}

.nav__modes {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 0 8px 6px;
}

.nav__plate {
  margin-left: auto;
}
</style>
