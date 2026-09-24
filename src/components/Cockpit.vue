<template>
  <div ref="root" class="cockpit" :class="[`is-${game.phase}`, `is-stage-${game.bootStage}`]" :style="spotlight">
    <!-- Canopy: window on space, flanked by instrument pillars -->
    <section class="canopy">
      <div class="pillar panel" style="--d: 0.2s">
        <Gauge label="REACTOR" :value="game.ship.reactor" :on="game.online" :delay="200" :red="[0.85, 1]" :jitter="0.015" />
        <Gauge label="FUEL" :value="game.ship.fuel" :on="game.online" :delay="400" />
      </div>
      <Viewport />
      <div class="pillar panel" style="--d: 0.3s">
        <Gauge label="HULL" :value="game.ship.hull" :on="game.online" :delay="300" />
        <Gauge label="SHIELDS" :value="game.ship.systems.shields ? 1 : 0" :on="game.online" :delay="500" :red="[0, 0.1]" />
      </div>
    </section>

    <!-- Dashboard lip: caution lights and readouts -->
    <section class="dash panel">
      <div class="dash__annunciator" style="--d: 0.15s">
        <Annunciator :lights="annunciators" />
      </div>
      <div class="dash__readouts" style="--d: 0.5s">
        <Nixie label="SECTOR X" :value="coordinate('x')" :digits="4" :on="game.online" />
        <Nixie label="SECTOR Y" :value="coordinate('y')" :digits="4" :on="game.online" />
        <Nixie label="JUMPS" :value="game.stats.jumps" :digits="3" :on="game.online" />
        <Nixie label="CHARTED" :value="chartedSystems" :digits="3" :on="game.online" />
        <Nixie label="STARDATE" :value="game.stats.stardate.toFixed(1)" :digits="6" :on="game.online" />
      </div>
      <div class="dash__maker">
        <img class="dash__logo" src="../assets/space.png" alt="" />
        <div>
          <div class="stencil dash__brand">UNAMED</div>
          <div class="dash__model">MK-I DEEP SPACE SCOUT</div>
          <a class="dash__link" href="https://github.com/Dropsnorz/unamed" target="_blank" rel="noopener">github.com/Dropsnorz/unamed</a>
        </div>
      </div>
    </section>

    <!-- Main console -->
    <section class="console">
      <div ref="terminalBay" class="bay bay--terminal panel">
        <div class="bay__terminal">
          <Terminal />
        </div>
        <div class="bay__side well">
          <PushButton
            size="lg"
            :color="ignition.color"
            label="IGNITION"
            :sub="ignition.sub"
            :lit="ignition.lit"
            :active="terminal.activeCommand === 'init'"
            :disabled="game.phase !== 'offline' || terminal.busy"
            title="Power up the ship (init)"
            @press="run('init')"
          />
          <PushButton
            label="MANUAL"
            sub="HELP"
            :lit="terminal.activeCommand === 'help'"
            :disabled="!controlsLive"
            title="Display help (help)"
            @press="run('help')"
          />
          <PushButton
            size="sm"
            label="CLR"
            :disabled="!controlsLive"
            title="Clear the terminal (clear)"
            @press="run('clear')"
          />
          <ToggleSwitch label="AUDIO" :on="cockpit.audio" lamp-color="amber" @toggle="toggleAudio" />
        </div>
      </div>

      <div class="bay bay--nav panel" style="--d: 0.45s">
        <NavScreen />
      </div>

      <div class="bay bay--controls panel">
        <div class="controls__nav">
          <div class="controls__signatures">
            <SignaturePanel />
          </div>
          <div class="controls__knob" style="--d: 0.8s">
            <RotaryKnob label="SELECT" :disabled="!game.online || !!game.jump" @step="game.cycleTarget" />
            <div class="controls__lamps">
              <Lamp color="green" :on="game.online && !!game.selectedTarget" size="10px" />
              <span class="stencil controls__lamp-label">LOCK</span>
            </div>
          </div>
        </div>

        <div class="controls__flight well" style="--d: 0.9s">
          <PushButton
            color="amber"
            label="SCAN"
            caption="SCANNER"
            :lit="scanLit"
            :active="terminal.activeCommand === 'scan'"
            :disabled="!controlsLive"
            title="Scan surrounding area (scan)"
            @press="run('scan')"
          />
          <GuardedButton
            label="JUMP"
            caption="JUMP DRIVE"
            :lit="game.jump ? 'blink' : game.online && !!game.selectedTarget"
            :disabled="!controlsLive || !game.selectedTarget"
            @press="run(`jump ${game.selectedTarget.name}`)"
          />
        </div>

        <div class="controls__aux well" style="--d: 1.05s">
          <span class="plate controls__aux-plate">AUXILIARY</span>
          <ToggleSwitch
            v-for="system in auxiliary"
            :key="system.key"
            :label="system.label"
            :lamp-color="system.lamp"
            :on="game.ship.systems[system.key]"
            :disabled="!game.online"
            @toggle="game.toggleShipSystem(system.key)"
          />
        </div>
      </div>
    </section>

    <div class="cockpit__darkness" aria-hidden="true" />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Annunciator from './cockpit/Annunciator.vue';
import Gauge from './cockpit/Gauge.vue';
import GuardedButton from './cockpit/GuardedButton.vue';
import Lamp from './cockpit/Lamp.vue';
import NavScreen from './cockpit/NavScreen.vue';
import Nixie from './cockpit/Nixie.vue';
import PushButton from './cockpit/PushButton.vue';
import RotaryKnob from './cockpit/RotaryKnob.vue';
import SignaturePanel from './cockpit/SignaturePanel.vue';
import ToggleSwitch from './cockpit/ToggleSwitch.vue';
import Viewport from './cockpit/Viewport.vue';
import Terminal from './terminal/Terminal.vue';
import { useGameStore } from '../stores/game';
import { useTerminalStore } from '../stores/terminal';
import { useCockpitStore } from '../stores/cockpit';
import { setEnabled, sfx, unlock } from '../audio/sfx';

const game = useGameStore();
const terminal = useTerminalStore();
const cockpit = useCockpitStore();

const root = ref(null);
const terminalBay = ref(null);
const spotlight = ref({});

/** Controls only trigger commands when the ship is powered and the terminal idle */
const controlsLive = computed(() => game.online && !terminal.busy);

/** Future mechanics: switches are wired to the ship state but have no effect yet */
const auxiliary = [
  { key: 'shields', label: 'SHIELDS', lamp: 'blue' },
  { key: 'comms', label: 'COMMS', lamp: 'green' },
  { key: 'drones', label: 'DRONES', lamp: 'amber' },
  { key: 'mining', label: 'MINING', lamp: 'red' },
  { key: 'autopilot', label: 'AUTOPLT', lamp: 'blue' },
  { key: 'lifeSupport', label: 'LIFE SUP', lamp: 'green' }
];

const ignition = computed(() => {
  if (game.phase === 'online') return { color: 'green', sub: 'ONLINE', lit: true };
  if (game.phase === 'booting') return { color: 'amber', sub: 'STARTING', lit: 'blink' };
  return { color: 'red', sub: 'MASTER', lit: terminal.busy ? false : 'blink' };
});

const scanLit = computed(() => {
  if (!game.online) return false;
  if (game.scan.active) return true;
  return !game.currentScanned && !game.jump ? 'blink' : false;
});

const chartedSystems = computed(() => game.cluster?.data.systems.filter((s) => game.visited.has(s.id)).length ?? 0);

function coordinate(axis) {
  const value = game.currentSystem?.[axis] ?? 0;
  return (value < 0 ? '-' : '') + String(Math.abs(Math.round(value))).padStart(3, '0');
}

const annunciators = computed(() => {
  const on = game.online;
  const systems = game.ship.systems;
  const stage = game.jump?.stage;
  const starClass = game.currentSystem?.star.class;
  return [
    { label: 'MASTER CAUTION', color: 'red', on: false },
    { label: 'SCANNER', color: 'amber', on: on && game.scan.active, blink: 'fast' },
    { label: 'SCAN DATA', color: 'green', on: on && game.currentScanned },
    { label: 'UNCHARTED', color: 'blue', on: on && !game.currentScanned, blink: 'slow' },
    { label: 'NAV LOCK', color: 'green', on: on && !!(game.selectedTarget || game.jump) },
    { label: 'JUMP DRIVE', color: 'red', on: on && !!stage, blink: stage === 'warp' ? 'fast' : 'slow' },
    { label: 'CPU', color: 'green', on: on && terminal.busy, blink: 'fast' },
    { label: 'RADIATION', color: 'amber', on: on && (starClass === 'O' || starClass === 'B') },
    { label: 'FUEL LOW', color: 'amber', on: on && game.ship.fuel < 0.2 },
    { label: 'HULL BREACH', color: 'red', on: on && game.ship.hull < 0.3 },
    { label: 'SHIELDS', color: 'blue', on: on && systems.shields },
    { label: 'COMMS', color: 'green', on: on && systems.comms },
    { label: 'AUTOPILOT', color: 'blue', on: on && systems.autopilot },
    { label: 'LIFE SUPPORT', color: 'green', on: on && systems.lifeSupport }
  ];
});

async function run(query) {
  const accepted = await terminal.dispatch(query);
  if (accepted === false) sfx.error();
}

function toggleAudio() {
  cockpit.audio = !cockpit.audio;
  setEnabled(cockpit.audio);
}

// Before power-up only the terminal glows: keep the darkness spotlight centered on it
function updateSpotlight() {
  if (!root.value || !terminalBay.value) return;
  const r = root.value.getBoundingClientRect();
  const t = terminalBay.value.getBoundingClientRect();
  spotlight.value = {
    '--spot-x': `${t.left - r.left + t.width / 2}px`,
    '--spot-y': `${t.top - r.top + t.height / 2}px`,
    '--spot-w': `${t.width * 0.75}px`,
    '--spot-h': `${t.height * 0.8}px`
  };
}

watch(
  () => game.phase,
  (phase, previous) => {
    if (previous === 'online' && phase !== 'online') sfx.powerDown();
  }
);

let observer;
onMounted(() => {
  updateSpotlight();
  observer = new ResizeObserver(updateSpotlight);
  observer.observe(root.value);
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('keydown', unlock);
});
</script>

<style lang="scss" scoped>
.cockpit {
  position: relative;
  display: grid;
  grid-template-rows: minmax(170px, 36vh) auto minmax(0, 1fr);
  gap: 8px;
  height: 100%;
  padding: 8px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(80, 110, 100, 0.18), transparent 60%),
    linear-gradient(180deg, #0e1312, #070908);
}

// ---- Canopy ----
.canopy {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 150px;
  grid-template-rows: minmax(0, 1fr);
  gap: 8px;
  min-height: 0;
}

.pillar {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  gap: 8px;
  padding: 14px 10px;
  min-height: 0;

  :deep(.gauge) {
    max-width: min(128px, 16vh);
  }
}

// ---- Dashboard lip ----
.dash {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 8px 16px;
}

.dash__annunciator {
  flex: 1;
  min-width: 0;

  :deep(.annunciator) {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
}

.dash__readouts {
  display: flex;
  gap: 10px;
}

.dash__maker {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 4px;
  color: #2b2113;
  background: linear-gradient(160deg, #e3c68a, var(--brass) 45%, #8a6a36);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 2px 4px rgba(0, 0, 0, 0.6);
}

.dash__logo {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid #3a2c16;
  filter: sepia(0.8) contrast(1.1);
}

.dash__brand {
  font-size: 18px;
  line-height: 1;
}

.dash__model {
  font-size: 9px;
  letter-spacing: 0.14em;
}

.dash__link {
  font-size: 9px;
  color: #3a2c16;
}

// ---- Console ----
.console {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 0.95fr);
  gap: 8px;
  min-height: 0;
}

.bay {
  display: flex;
  min-height: 0;
  padding: 14px;
}

.bay--terminal {
  gap: 12px;
}

.bay__terminal {
  flex: 1;
  min-width: 0;
}

.bay__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  gap: 10px;
  width: 116px;
  padding: 12px 6px;
}

.bay--nav {
  flex-direction: column;
}

.bay--controls {
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.controls__nav {
  display: flex;
  flex: 1;
  gap: 14px;
  min-height: 90px;
}

.controls__signatures {
  flex: 1;
  min-width: 0;
}

.controls__knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 0 6px;
}

.controls__lamps {
  display: flex;
  align-items: center;
  gap: 6px;
}

.controls__lamp-label {
  font-size: 10px;
  color: rgba(228, 217, 188, 0.7);
}

.controls__flight {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px 10px 10px;
}

.controls__aux {
  position: relative;
  display: flex;
  justify-content: space-around;
  padding: 22px 6px 10px;
}

.controls__aux-plate {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
}

// ---- Cabin lighting ----
.cockpit__darkness {
  position: absolute;
  inset: 0;
  z-index: 50;
  pointer-events: none;
  background: radial-gradient(
    var(--spot-w, 30%) var(--spot-h, 30%) at var(--spot-x, 20%) var(--spot-y, 75%),
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0.78) 100%
  );
  transition: opacity 1.2s;
}

// The universe coming to life lights up the cabin a little more at each step
.cockpit.is-booting {
  &.is-stage-1 .cockpit__darkness {
    opacity: 0.8;
  }
  &.is-stage-2 .cockpit__darkness {
    opacity: 0.65;
  }
  &.is-stage-3 .cockpit__darkness {
    opacity: 0.5;
  }
}

.cockpit.is-online .cockpit__darkness {
  animation: lights-on 1.1s steps(1) forwards;
}

@keyframes lights-on {
  0% {
    opacity: 0.5;
  }
  15% {
    opacity: 0.2;
  }
  25% {
    opacity: 0.7;
  }
  40% {
    opacity: 0.1;
  }
  48% {
    opacity: 0.45;
  }
  60%,
  100% {
    opacity: 0;
  }
}

// ---- Short screens (laptops): smaller canopy and denser controls ----
@media (max-height: 820px) and (min-width: 1101px) {
  .cockpit {
    grid-template-rows: minmax(150px, 29vh) auto minmax(0, 1fr);
  }

  .pillar :deep(.gauge) {
    max-width: min(128px, 12.5vh);
  }

  .bay {
    padding: 10px;
  }

  .bay--controls {
    gap: 9px;
  }

  .controls__flight {
    padding: 10px 8px 6px;
  }

  .controls__aux {
    padding: 16px 4px 6px;
  }
}

// ---- Smaller screens: stack everything, keep the terminal reachable ----
@media (max-width: 1280px) {
  .dash__maker {
    display: none;
  }
}

@media (max-width: 1100px) {
  .cockpit {
    height: auto;
    min-height: 100%;
    grid-template-rows: 34vh auto auto;
  }

  .dash {
    flex-wrap: wrap;
  }

  .dash__annunciator :deep(.annunciator) {
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  }

  .console {
    grid-template-columns: 1fr 1fr;
  }

  .bay--terminal {
    grid-column: 1 / -1;
    order: 3;
    height: 60vh;
  }

  .bay--nav,
  .bay--controls {
    height: 480px;
  }
}

@media (max-width: 720px) {
  .canopy {
    grid-template-columns: 1fr;
  }

  .pillar {
    display: none;
  }

  .dash__readouts {
    flex-wrap: wrap;
  }

  .console {
    grid-template-columns: minmax(0, 1fr);
  }

  .bay--terminal {
    order: -1;
    flex-direction: column;
    height: auto;
  }

  .bay__terminal {
    flex: none;
    height: 55vh;
  }

  .bay__side {
    flex-direction: row;
    flex-wrap: wrap;
    width: auto;
  }

  .bay--nav {
    height: 380px;
  }

  .bay--controls {
    height: auto;
  }

  .controls__nav {
    min-height: 220px;
  }

  .controls__aux {
    flex-wrap: wrap;
    gap: 12px;
  }
}
</style>

<style lang="scss">
@media (max-width: 1100px) {
  body {
    overflow: auto;
  }
}
</style>
