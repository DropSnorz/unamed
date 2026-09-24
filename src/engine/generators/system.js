import Random from '../random.js';
import { romanize } from '../names.js';

/**
 * Star classes (Morgan–Keenan). Ranges: temperature (K), radius and mass (solar units).
 * Weights roughly follow the real stellar population, slightly biased toward
 * brighter stars to keep the universe interesting.
 */
export const STAR_CLASSES = {
  O: { weight: 0.3, temperature: [30000, 50000], radius: [6.6, 12], mass: [16, 40], color: '#9bb0ff' },
  B: { weight: 1.5, temperature: [10000, 30000], radius: [1.8, 6.6], mass: [2.1, 16], color: '#aabfff' },
  A: { weight: 4, temperature: [7500, 10000], radius: [1.4, 1.8], mass: [1.4, 2.1], color: '#cad7ff' },
  F: { weight: 9, temperature: [6000, 7500], radius: [1.15, 1.4], mass: [1.04, 1.4], color: '#f8f7ff' },
  G: { weight: 15, temperature: [5200, 6000], radius: [0.96, 1.15], mass: [0.8, 1.04], color: '#fff4ea' },
  K: { weight: 25, temperature: [3700, 5200], radius: [0.7, 0.96], mass: [0.45, 0.8], color: '#ffd2a1' },
  M: { weight: 45, temperature: [2400, 3700], radius: [0.1, 0.7], mass: [0.08, 0.45], color: '#ffb56c' }
};

export const PLANET_TYPES = ['Barren', 'Ice', 'Lava', 'Oceanic', 'Plasma', 'Temperate', 'Gas'];

const SUN_TEMPERATURE = 5778;
const SOLAR_RADII_PER_AU = 215;

export function generateSystem({ id, seed, name, constellationId, x, y, ruleset }) {
  const random = new Random(seed);
  const star = generateStar(random);

  const planets = [];
  const count = random.gaussianInt(ruleset.system.planets.min, ruleset.system.planets.max);
  // Orbits scale with the square root of the luminosity so the habitable zone
  // lands in the same orbit range whatever the star class.
  let orbit = random.float(0.15, 0.45) * Math.sqrt(star.luminosity);
  for (let i = 0; i < count; i++) {
    planets.push(generatePlanet(random, star, name, i + 1, orbit));
    orbit *= random.float(1.4, 2.0);
  }

  return { id, name, constellationId, x, y, star, planets };
}

function generateStar(random) {
  const spectralClass = random.weighted(
    Object.entries(STAR_CLASSES).map(([key, value]) => [key, value.weight])
  );
  const spec = STAR_CLASSES[spectralClass];
  const t = random.next();
  const lerp = ([min, max]) => min + (max - min) * t;
  const temperature = Math.round(lerp(spec.temperature));
  const radius = lerp(spec.radius);
  return {
    class: spectralClass,
    subclass: 9 - Math.floor(t * 10),
    temperature,
    radius,
    mass: lerp(spec.mass),
    luminosity: radius * radius * Math.pow(temperature / SUN_TEMPERATURE, 4),
    color: spec.color
  };
}

function generatePlanet(random, star, systemName, index, orbit) {
  const temperature = Math.round(
    star.temperature * Math.sqrt(star.radius / (2 * orbit * SOLAR_RADII_PER_AU))
  );
  const type = planetType(random, temperature);
  const gas = type === 'Gas';
  return {
    id: `${systemName}-${index}`,
    index,
    name: `${systemName} ${romanize(index)}`,
    type,
    orbit,
    // Position on the orbit at t=0 (radians) and orbital period (days, Kepler's third law)
    phase: random.float(0, Math.PI * 2),
    period: 365.25 * Math.sqrt(Math.pow(orbit, 3) / star.mass),
    radius: gas ? random.float(3, 12) : random.float(0.3, 1.8),
    temperature,
    moons: gas ? random.int(0, 12) : random.int(0, 2)
  };
}

function planetType(random, temperature) {
  if (random.chance(0.03)) return 'Plasma';
  const frozen = temperature < 170;
  if (random.chance(frozen ? 0.55 : 0.08)) return 'Gas';
  if (temperature > 1000) return 'Lava';
  if (temperature > 400) return 'Barren';
  if (temperature >= 250 && temperature <= 330) {
    return random.weighted([['Temperate', 4], ['Oceanic', 3], ['Barren', 2]]);
  }
  if (frozen) return random.chance(0.8) ? 'Ice' : 'Barren';
  return random.chance(0.6) ? 'Barren' : 'Oceanic';
}
