import { bearing, distance } from './geometry.js';

/**
 * Read-only query layer on top of generated cluster data.
 * Keeps the data itself plain (serializable) and builds lookup indexes.
 */
export default class ClusterMap {
  constructor(data) {
    this.data = data;
    this.constellations = new Map(data.constellations.map((c) => [c.id, c]));
    this.systems = new Map(data.systems.map((s) => [s.id, s]));
  }

  get seed() {
    return this.data.seed;
  }

  constellation(id) {
    return this.constellations.get(id);
  }

  system(id) {
    return this.systems.get(id);
  }

  systemsOf(constellationId) {
    return this.constellation(constellationId).systemIds.map((id) => this.system(id));
  }

  /** Starting point of a new game: a system of the constellation closest to the cluster core */
  startingSystem() {
    let start = this.data.constellations[0];
    for (const c of this.data.constellations) {
      if (Math.hypot(c.x, c.y) < Math.hypot(start.x, start.y)) start = c;
    }
    return this.system(start.systemIds[0]);
  }

  /** Arrival system when jumping to another constellation: the closest one from `from` */
  entrySystem(constellationId, from) {
    const systems = this.systemsOf(constellationId);
    return systems.reduce((best, s) => (distance(from, s) < distance(from, best) ? s : best));
  }

  /**
   * Everything a scan can detect from a system:
   *  - bodies: planets orbiting the current star
   *  - stars: other systems of the same constellation
   *  - gates: hyperlanes toward linked constellations
   */
  signatures(systemId) {
    const origin = this.system(systemId);
    const constellation = this.constellation(origin.constellationId);
    const describe = (kind, entity, position) => ({
      kind,
      id: entity.id,
      name: entity.name,
      x: position.x,
      y: position.y,
      distance: distance(origin, position),
      bearing: bearing(origin, position)
    });

    const stars = this.systemsOf(constellation.id)
      .filter((s) => s.id !== origin.id)
      .map((s) => ({ ...describe('star', s, s), starClass: s.star.class, arrival: s.id }))
      .sort((a, b) => a.distance - b.distance);

    const gates = constellation.links
      .map((id) => this.constellation(id))
      .map((c) => ({ ...describe('gate', c, c), arrival: this.entrySystem(c.id, constellation).id }))
      .sort((a, b) => a.distance - b.distance);

    return { bodies: origin.planets, stars, gates };
  }

  /** Jump targets reachable from a system (stars first, then gates) */
  jumpTargets(systemId) {
    const { stars, gates } = this.signatures(systemId);
    return [...stars, ...gates];
  }

  /** Resolve a player typed target name (case insensitive) among reachable targets */
  resolveJumpTarget(systemId, name) {
    const wanted = String(name).trim().toUpperCase();
    return this.jumpTargets(systemId).find((t) => t.name === wanted) || null;
  }

  /** Approximate memory footprint of the raw data, for flavor text */
  byteSize() {
    return JSON.stringify(this.data).length;
  }
}
