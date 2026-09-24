<template>
  <CrtScreen tone="amber" :on="game.online" delay="0.7s">
    <div class="sig">
      <header class="sig__head">
        <span>SIGNATURES</span>
        <span>{{ targets.length ? `${targets.length} CONTACT${targets.length > 1 ? 'S' : ''}` : '' }}</span>
      </header>
      <ul v-if="targets.length" ref="list" class="sig__list" role="listbox" aria-label="Jump targets">
        <li
          v-for="target in targets"
          :key="target.id"
          role="option"
          class="sig__row"
          :class="{ 'is-selected': target.id === selectedId }"
          :aria-selected="target.id === selectedId"
          @click="select(target)"
        >
          <span class="sig__mark">{{ target.id === selectedId ? '▶' : '' }}</span>
          <span class="sig__name">{{ target.name }}</span>
          <span>{{ target.kind === 'gate' ? 'GATE' : `★ ${target.starClass}` }}</span>
          <span class="sig__num">{{ target.distance.toFixed(1) }}LY</span>
          <span class="sig__num sig__bearing">{{ String(Math.round(target.bearing) % 360).padStart(3, '0') }}°</span>
          <span class="sig__visited">{{ game.visited.has(target.id) ? '✓' : '' }}</span>
        </li>
      </ul>
      <p v-else class="sig__empty">
        NO SIGNATURES
        <br />
        <span class="sig__blink">RUN SCAN</span>
      </p>
      <footer class="sig__foot">
        <template v-if="game.jump">COURSE ▸ {{ game.jump.target.name }}</template>
        <template v-else-if="game.selectedTarget">LOCK ▸ {{ game.selectedTarget.name }}</template>
        <template v-else>NO TARGET LOCK</template>
      </footer>
    </div>
  </CrtScreen>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import CrtScreen from './CrtScreen.vue';
import { useGameStore } from '../../stores/game';
import { sfx } from '../../audio/sfx';

const game = useGameStore();
const list = ref(null);
const targets = computed(() => game.knownTargets);
const selectedId = computed(() => game.jump?.target.id || game.selectedTargetId);

function select(target) {
  if (game.jump) return;
  game.selectTarget(target.id);
  sfx.beep();
}

watch(selectedId, () =>
  nextTick(() => list.value?.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' }))
);
</script>

<style lang="scss" scoped>
.sig {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--font-crt);
  font-size: 17px;
  line-height: 1.1;
}

.sig__head,
.sig__foot {
  display: flex;
  justify-content: space-between;
  padding: 5px 12px 3px;
  letter-spacing: 0.08em;
}

.sig__head {
  border-bottom: 1px solid var(--amber-dim);
}

.sig__foot {
  border-top: 1px solid var(--amber-dim);
  opacity: 0.85;
}

.sig__list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 4px 6px;
  overflow-y: auto;
  list-style: none;
  scrollbar-width: thin;
  scrollbar-color: var(--amber-dim) transparent;
}

.sig__row {
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) 34px 48px 36px 10px;
  gap: 5px;
  padding: 0 4px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 176, 0, 0.12);
  }

  &.is-selected {
    background: var(--amber);
    color: var(--amber-bg);
    text-shadow: none;
  }
}

// Narrow panel: drop the bearing column so names stay readable
@container (max-width: 300px) {
  .sig__row {
    grid-template-columns: 10px minmax(0, 1fr) 34px 48px 10px;
  }

  .sig__bearing {
    display: none;
  }
}

.sig__name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.sig__num {
  text-align: right;
}

.sig__empty {
  flex: 1;
  display: grid;
  place-content: center;
  margin: 0;
  text-align: center;
  font-size: 20px;
  letter-spacing: 0.12em;
}

.sig__blink {
  animation: blink 1.2s steps(1) infinite;
}
</style>
