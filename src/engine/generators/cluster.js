import Random from '../random.js';
import { distance, scatter, segmentsIntersect } from '../geometry.js';
import { constellationName } from '../names.js';
import { generateConstellation } from './constellation.js';

/**
 * Generates a cluster as plain, serializable data (no circular references):
 *
 *   { seed, name, radius, constellations: [...], systems: [...] }
 *
 * Constellations are scattered in a disc and connected by hyperlanes. Lanes are
 * built from a minimum spanning tree (the cluster is always fully reachable)
 * plus a few extra short, non crossing lanes to create loops.
 */
export function generateCluster({ seed, ruleset }) {
  const random = new Random(seed);
  const rules = ruleset.cluster;
  const count = random.gaussianInt(rules.size.min, rules.size.max);
  // Radius giving a comfortable density for the requested spacing
  const radius = rules.spacing * 0.8 * Math.sqrt(count);
  const positions = scatter(random, count, radius, rules.spacing);

  const names = new Set();
  const constellations = [];
  const systems = [];
  positions.forEach((p, index) => {
    const name = constellationName(random, names);
    names.add(name);
    const generated = generateConstellation({
      id: `C${index}`,
      seed: `${seed}:c${index}`,
      name,
      x: p.x,
      y: p.y,
      ruleset
    });
    constellations.push(generated.constellation);
    systems.push(...generated.systems);
  });

  linkConstellations(random, constellations, rules);

  return { seed: String(seed), name: 'Main Cluster', radius, constellations, systems };
}

function linkConstellations(random, constellations, rules) {
  const edges = [];
  const connect = (a, b) => {
    a.links.push(b.id);
    b.links.push(a.id);
    edges.push([a, b]);
  };

  // Prim's minimum spanning tree, O(n²) which is fine for a few thousand nodes
  const n = constellations.length;
  const inTree = new Array(n).fill(false);
  const best = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  best[0] = 0;
  for (let step = 0; step < n; step++) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!inTree[i] && (u === -1 || best[i] < best[u])) u = i;
    }
    inTree[u] = true;
    if (parent[u] !== -1) connect(constellations[parent[u]], constellations[u]);
    for (let v = 0; v < n; v++) {
      if (inTree[v]) continue;
      const d = distance(constellations[u], constellations[v]);
      if (d < best[v]) {
        best[v] = d;
        parent[v] = u;
      }
    }
  }

  // Extra lanes toward close neighbours, skipping lanes crossing existing ones
  const maxLength = rules.spacing * 2;
  for (const a of constellations) {
    if (!random.chance(rules.extraLinkChance) || a.links.length >= rules.maxLinks) continue;
    const candidates = constellations
      .filter((b) => b !== a && !a.links.includes(b.id) && b.links.length < rules.maxLinks)
      .map((b) => ({ b, d: distance(a, b) }))
      .filter(({ d }) => d <= maxLength)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3);
    if (!candidates.length) continue;
    const { b } = random.pick(candidates);
    if (!edges.some(([c, d]) => segmentsIntersect(a, b, c, d))) connect(a, b);
  }
}
