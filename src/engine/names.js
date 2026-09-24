const SYLLABLES = [
  'ka', 've', 'lo', 'tar', 'rin', 'sol', 'mi', 'dra', 'cor', 'zen',
  'tha', 'qua', 'xi', 'ul', 'bor', 'nys', 'pha', 'ter', 'vox', 'lem',
  'ari', 'oth', 'cen', 'dal', 'eon', 'fir', 'gal', 'hex', 'ior', 'jun',
  'kel', 'mor', 'nov', 'pry', 'rho', 'sar', 'tuv', 'ven', 'wyr', 'yal'
];

const LETTERS = 'ABCDEFGHJKLMNPRSTVXZ';

const ROMAN = [
  ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90],
  ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
];

/** Pronounceable constellation name, unique within `taken` */
export function constellationName(random, taken) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const count = random.chance(0.6) ? 2 : 3;
    let name = '';
    for (let i = 0; i < count; i++) name += random.pick(SYLLABLES);
    name = name.toUpperCase();
    if (!taken.has(name)) return name;
  }
  // Extremely crowded clusters: fall back to a numbered name
  let index = 2;
  const base = random.pick(SYLLABLES).toUpperCase() + random.pick(SYLLABLES).toUpperCase();
  while (taken.has(base + index)) index++;
  return base + index;
}

/** System designation such as `TARVOLO-K4`, unique within `taken` */
export function systemName(random, constellation, taken) {
  let name;
  do {
    name = `${constellation}-${random.pick(LETTERS)}${random.int(1, 9)}`;
  } while (taken.has(name));
  return name;
}

export function romanize(value) {
  let result = '';
  for (const [symbol, amount] of ROMAN) {
    while (value >= amount) {
      result += symbol;
      value -= amount;
    }
  }
  return result;
}
