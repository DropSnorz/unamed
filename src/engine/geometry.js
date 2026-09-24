export function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Bearing from `a` to `b` in degrees, 0 = north (up on maps), clockwise */
export function bearing(a, b) {
  const degrees = (Math.atan2(b.x - a.x, -(b.y - a.y)) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

/** True when segments [a, b] and [c, d] cross (shared end points do not count) */
export function segmentsIntersect(a, b, c, d) {
  const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

/**
 * Scatter `count` points in a disc, keeping `spacing` between them (dart throwing
 * with a grid acceleration structure). Spacing is progressively relaxed when the
 * disc gets too crowded so the requested amount of points is always produced.
 */
export function scatter(random, count, radius, spacing) {
  const points = [];
  const cell = spacing;
  const grid = new Map();
  const key = (x, y) => `${Math.floor(x / cell)}:${Math.floor(y / cell)}`;

  const isFree = (p, minDistance) => {
    const cx = Math.floor(p.x / cell);
    const cy = Math.floor(p.y / cell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const q of grid.get(`${cx + dx}:${cy + dy}`) || []) {
          if (distance(p, q) < minDistance) return false;
        }
      }
    }
    return true;
  };

  let minDistance = spacing;
  while (points.length < count) {
    let placed = false;
    for (let attempt = 0; attempt < 40 && !placed; attempt++) {
      const p = random.pointInDisc(radius);
      if (isFree(p, minDistance)) {
        points.push(p);
        const k = key(p.x, p.y);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(p);
        placed = true;
      }
    }
    if (!placed) minDistance *= 0.95;
  }
  return points;
}
