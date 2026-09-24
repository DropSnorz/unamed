import { computed, markRaw, reactive, ref, shallowRef } from 'vue';
import { defineStore } from 'pinia';
import { createCluster } from '../engine';

/**
 * Game state shared by the terminal commands and the cockpit.
 *
 * Commands mutate the state through actions, the cockpit only reacts to it:
 * whatever the source of a command (typed or triggered from a control), every
 * screen, lamp and gauge stays in sync.
 */
export const useGameStore = defineStore('game', () => {
  /** offline -> booting -> online */
  const phase = ref('offline');
  /** Progress of the init sequence (0-3), drives the universe "appearing" */
  const bootStage = ref(0);

  // The cluster is large and immutable: keep it out of Vue's deep reactivity
  const cluster = shallowRef(null);
  const currentSystemId = ref(null);

  const visited = reactive(new Set());
  /** Signatures (system and constellation ids) revealed by scans */
  const known = reactive(new Set());
  /** Systems whose orbital bodies were scanned */
  const scanned = reactive(new Set());

  const scan = reactive({ active: false, progress: 0 });
  /** Current jump: { target, stage: 'check' | 'align' | 'warp' } */
  const jump = ref(null);
  const selectedTargetId = ref(null);
  const stats = reactive({ jumps: 0, scans: 0, stardate: 0 });

  /**
   * Ship systems for upcoming mechanics. They are wired to cockpit controls
   * but have no gameplay effect yet.
   */
  const ship = reactive({
    fuel: 0.82,
    hull: 0.96,
    reactor: 0.68,
    shields: 0,
    systems: {
      shields: false,
      comms: true,
      drones: false,
      mining: false,
      autopilot: false,
      lifeSupport: true
    }
  });

  const online = computed(() => phase.value === 'online');
  const currentSystem = computed(() => cluster.value?.system(currentSystemId.value) || null);
  const currentConstellation = computed(() =>
    currentSystem.value ? cluster.value.constellation(currentSystem.value.constellationId) : null
  );
  const signatures = computed(() =>
    currentSystem.value ? cluster.value.signatures(currentSystem.value.id) : null
  );
  const currentScanned = computed(() => scanned.has(currentSystemId.value));
  /** Reachable targets already revealed by a scan, as listed by the navigation panel */
  const knownTargets = computed(() => {
    if (!signatures.value) return [];
    return [...signatures.value.stars, ...signatures.value.gates].filter((t) => known.has(t.id));
  });
  const selectedTarget = computed(
    () => knownTargets.value.find((t) => t.id === selectedTargetId.value) || null
  );

  function generate({ seed, size }) {
    const map = markRaw(createCluster({ seed, size }));
    cluster.value = map;
    phase.value = 'booting';
    bootStage.value = 0;
    visited.clear();
    known.clear();
    scanned.clear();
    jump.value = null;
    selectedTargetId.value = null;
    Object.assign(stats, { jumps: 0, scans: 0, stardate: 3000 + (hash(map.seed) % 900) });
    arrive(map.startingSystem());
    return map;
  }

  function setBootStage(stage) {
    bootStage.value = stage;
  }

  function completeBoot() {
    phase.value = 'online';
  }

  function arrive(system) {
    currentSystemId.value = system.id;
    visited.add(system.id);
    visited.add(system.constellationId);
    known.add(system.id);
    known.add(system.constellationId);
  }

  function beginScan() {
    Object.assign(scan, { active: true, progress: 0 });
  }

  function setScanProgress(progress) {
    scan.progress = progress;
  }

  function completeScan() {
    const { stars, gates } = signatures.value;
    for (const target of [...stars, ...gates]) known.add(target.id);
    scanned.add(currentSystemId.value);
    Object.assign(scan, { active: false, progress: 1 });
    stats.scans++;
  }

  function resolveJumpTarget(name) {
    return cluster.value.resolveJumpTarget(currentSystemId.value, name);
  }

  function beginJump(target) {
    selectedTargetId.value = target.id;
    jump.value = { target, stage: 'check' };
  }

  function setJumpStage(stage) {
    jump.value = { ...jump.value, stage };
  }

  function completeJump() {
    const { target } = jump.value;
    known.add(target.id);
    arrive(cluster.value.system(target.arrival));
    jump.value = null;
    selectedTargetId.value = null;
    stats.jumps++;
    stats.stardate += target.kind === 'gate' ? 1.4 : 0.3;
    return cluster.value.system(target.arrival);
  }

  function selectTarget(id) {
    selectedTargetId.value = id;
  }

  function cycleTarget(step) {
    const targets = knownTargets.value;
    if (!targets.length) return;
    const index = targets.findIndex((t) => t.id === selectedTargetId.value);
    const next = index === -1 ? (step > 0 ? 0 : targets.length - 1) : (index + step + targets.length) % targets.length;
    selectedTargetId.value = targets[next].id;
  }

  function toggleShipSystem(key) {
    ship.systems[key] = !ship.systems[key];
  }

  return {
    phase,
    bootStage,
    cluster,
    currentSystemId,
    visited,
    known,
    scanned,
    scan,
    jump,
    selectedTargetId,
    stats,
    ship,
    online,
    currentSystem,
    currentConstellation,
    signatures,
    currentScanned,
    knownTargets,
    selectedTarget,
    generate,
    setBootStage,
    completeBoot,
    beginScan,
    setScanProgress,
    completeScan,
    resolveJumpTarget,
    beginJump,
    setJumpStage,
    completeJump,
    selectTarget,
    cycleTarget,
    toggleShipSystem
  };
});

function hash(text) {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}
