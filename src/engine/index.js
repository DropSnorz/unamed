import ClusterMap from './cluster.js';
import createRuleset from './ruleset.js';
import { generateCluster } from './generators/cluster.js';

export { default as ClusterMap } from './cluster.js';
export { default as createRuleset } from './ruleset.js';
export { randomSeed } from './random.js';
export { STAR_CLASSES, PLANET_TYPES } from './generators/system.js';

/** Generate a whole new universe and wrap it in a query-able ClusterMap */
export function createCluster({ seed, size } = {}) {
  return new ClusterMap(generateCluster({ seed, ruleset: createRuleset({ size }) }));
}
