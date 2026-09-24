import Random from '../random.js';
import { scatter } from '../geometry.js';
import { systemName } from '../names.js';
import { generateSystem } from './system.js';

/**
 * A constellation is a small group of star systems sharing the same area.
 * System coordinates are absolute (cluster space) so distances can be computed
 * across constellations.
 */
export function generateConstellation({ id, seed, name, x, y, ruleset }) {
  const random = new Random(seed);
  const rules = ruleset.constellation;
  const count = random.gaussianInt(rules.size.min, rules.size.max);
  const positions = scatter(random, count, rules.radius, rules.spacing);

  const taken = new Set();
  const systems = positions.map((p, index) => {
    const designation = systemName(random, name, taken);
    taken.add(designation);
    return generateSystem({
      id: `${id}-S${index}`,
      seed: `${seed}:s${index}`,
      name: designation,
      constellationId: id,
      x: x + p.x,
      y: y + p.y,
      ruleset
    });
  });

  return {
    constellation: { id, name, x, y, radius: rules.radius, systemIds: systems.map((s) => s.id), links: [] },
    systems
  };
}
