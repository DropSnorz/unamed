/**
 * Default ruleset for cluster generation.
 * Distances are expressed in light years (ly), orbits in astronomical units (AU).
 */
export default function createRuleset({ size } = {}) {
  const ruleset = {
    cluster: {
      size: { min: 200, max: 800 },
      // Minimal distance between two constellation centers
      spacing: 10,
      // Probability for a constellation to get an extra hyperlane (loops in the graph)
      extraLinkChance: 0.35,
      maxLinks: 5
    },
    constellation: {
      size: { min: 2, max: 10 },
      radius: 3.6,
      spacing: 0.9
    },
    system: {
      planets: { min: 2, max: 10 }
    }
  };
  if (size) {
    ruleset.cluster.size.min = size;
    ruleset.cluster.size.max = size;
  }
  return ruleset;
}
