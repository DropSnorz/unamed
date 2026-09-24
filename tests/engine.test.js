import { describe, expect, it } from 'vitest';
import { createCluster } from '../src/engine';
import { bearing, distance } from '../src/engine/geometry';
import { romanize } from '../src/engine/names';

describe('cluster generation', () => {
  const cluster = createCluster({ seed: 'TEST', size: 60 });

  it('is deterministic for a given seed', () => {
    const again = createCluster({ seed: 'TEST', size: 60 });
    expect(JSON.stringify(again.data)).toBe(JSON.stringify(cluster.data));
    const other = createCluster({ seed: 'OTHER', size: 60 });
    expect(JSON.stringify(other.data)).not.toBe(JSON.stringify(cluster.data));
  });

  it('honors the requested size', () => {
    expect(cluster.data.constellations).toHaveLength(60);
  });

  it('produces serializable data without circular references', () => {
    expect(() => JSON.stringify(cluster.data)).not.toThrow();
    expect(cluster.byteSize()).toBeGreaterThan(0);
  });

  it('gives every constellation and system coordinates', () => {
    for (const c of cluster.data.constellations) {
      expect(Number.isFinite(c.x) && Number.isFinite(c.y)).toBe(true);
      for (const s of cluster.systemsOf(c.id)) {
        expect(distance(c, s)).toBeLessThanOrEqual(c.radius + 1e-9);
      }
    }
  });

  it('uses unique names', () => {
    const names = [...cluster.data.constellations, ...cluster.data.systems].map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('connects every constellation (fully reachable cluster)', () => {
    const seen = new Set(['C0']);
    const queue = ['C0'];
    while (queue.length) {
      for (const id of cluster.constellation(queue.shift()).links) {
        if (!seen.has(id)) {
          seen.add(id);
          queue.push(id);
        }
      }
    }
    expect(seen.size).toBe(cluster.data.constellations.length);
  });

  it('generates planets on growing orbits', () => {
    for (const system of cluster.data.systems) {
      expect(system.planets.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < system.planets.length; i++) {
        expect(system.planets[i].orbit).toBeGreaterThan(system.planets[i - 1].orbit);
      }
    }
  });
});

describe('signatures and jump targets', () => {
  const cluster = createCluster({ seed: 'NAV', size: 40 });
  const start = cluster.startingSystem();

  it('lists sibling stars and gates to linked constellations', () => {
    const { bodies, stars, gates } = cluster.signatures(start.id);
    const constellation = cluster.constellation(start.constellationId);
    expect(bodies).toBe(start.planets);
    expect(stars).toHaveLength(constellation.systemIds.length - 1);
    expect(gates.map((g) => g.id).sort()).toEqual([...constellation.links].sort());
    for (const gate of gates) {
      expect(cluster.system(gate.arrival).constellationId).toBe(gate.id);
    }
  });

  it('resolves jump targets case insensitively', () => {
    const [target] = cluster.jumpTargets(start.id);
    expect(cluster.resolveJumpTarget(start.id, target.name.toLowerCase())).toMatchObject({ id: target.id });
    expect(cluster.resolveJumpTarget(start.id, 'NOWHERE')).toBeNull();
    expect(cluster.resolveJumpTarget(start.id, start.name)).toBeNull();
  });
});

describe('geometry helpers', () => {
  it('computes compass bearings (0 = north, clockwise)', () => {
    const o = { x: 0, y: 0 };
    expect(bearing(o, { x: 0, y: -1 })).toBeCloseTo(0);
    expect(bearing(o, { x: 1, y: 0 })).toBeCloseTo(90);
    expect(bearing(o, { x: 0, y: 1 })).toBeCloseTo(180);
    expect(bearing(o, { x: -1, y: 0 })).toBeCloseTo(270);
  });

  it('romanizes planet indexes', () => {
    expect(romanize(4)).toBe('IV');
    expect(romanize(9)).toBe('IX');
    expect(romanize(14)).toBe('XIV');
  });
});
