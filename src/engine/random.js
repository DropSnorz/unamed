import seedrandom from 'seedrandom';

/**
 * Seeded pseudo random generator.
 * Every generator of the engine owns its own instance, seeded hierarchically
 * (cluster seed -> constellation seed -> system seed) so any part of the
 * universe can be regenerated independently and deterministically.
 */
export default class Random {
  constructor(seed) {
    this.seed = String(seed);
    this.next = seedrandom(this.seed);
  }

  /** Float in [min, max) */
  float(min = 0, max = 1) {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] (inclusive, uniform) */
  int(min, max) {
    return Math.floor(this.float(min, max + 1));
  }

  /** Float in [min, max), bell shaped around the middle of the range */
  gaussian(min = 0, max = 1) {
    let sum = 0;
    for (let i = 0; i < 6; i++) sum += this.next();
    return min + (sum / 6) * (max - min);
  }

  /** Integer in [min, max], bell shaped around the middle of the range */
  gaussianInt(min, max) {
    return Math.min(max, Math.floor(this.gaussian(min, max + 1)));
  }

  chance(probability) {
    return this.next() < probability;
  }

  pick(items) {
    return items[Math.floor(this.next() * items.length)];
  }

  /** Pick a value from `[[value, weight], ...]` */
  weighted(entries) {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = this.next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return entries[entries.length - 1][0];
  }

  /** Random point in a disc of the given radius, uniformly distributed */
  pointInDisc(radius) {
    const r = radius * Math.sqrt(this.next());
    const a = this.float(0, Math.PI * 2);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
}

/** Short, human friendly seed used when the player does not provide one */
export function randomSeed() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
