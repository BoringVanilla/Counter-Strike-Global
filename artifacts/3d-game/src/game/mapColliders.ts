export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function box(cx: number, cz: number, sx: number, sz: number): AABB {
  return { minX: cx - sx / 2, maxX: cx + sx / 2, minZ: cz - sz / 2, maxZ: cz + sz / 2 };
}

export const WALL_COLLIDERS: AABB[] = [
  // Outer boundary walls
  box(0, -22.5, 45, 1),
  box(0, 22.5, 45, 1),
  box(-22.5, 0, 1, 45),
  box(22.5, 0, 1, 45),

  // Interior angled walls
  box(8, -5, 5, 0.6),
  box(-8, 5, 5, 0.6),
  box(5, 8, 0.6, 5),
  box(-5, -8, 0.6, 5),

  // Long corridor center wall
  box(0, 0, 0.6, 12),

  // Side corridor walls
  box(15, 0, 0.6, 8),
  box(-15, 0, 0.6, 8),

  // Pillars
  box(10, -10, 0.8, 0.8),
  box(-10, 10, 0.8, 0.8),
  box(10, 10, 0.8, 0.8),
  box(-10, -10, 0.8, 0.8),

  // Sandbag covers
  box(3, 3, 2.5, 1),
  box(-3, -3, 2.5, 1),
  box(3, -3, 1, 2.5),
  box(-3, 3, 1, 2.5),

  // Decoration crates
  box(6, 6, 1.2, 1.2),
  box(-6, 6, 1.2, 1.2),
  box(6, -6, 1.2, 1.2),
  box(-6, -6, 1.2, 1.2),
  box(10, 0, 1.2, 1.2),
  box(-10, 0, 1.2, 1.2),
  box(0, 10, 1.2, 1.2),
  box(0, -10, 1.2, 1.2),
  box(4, 12, 1.2, 1.2),
  box(-4, -12, 1.2, 1.2),
  box(12, 4, 1.2, 1.2),
  box(-12, -4, 1.2, 1.2),
];

const MAP_LIMIT = 22;

/**
 * Push a circle (x, z, radius) out of all wall AABBs.
 * Runs multiple iterations to handle corner cases.
 */
export function resolveCollisions(x: number, z: number, radius: number): [number, number] {
  // Clamp to map bounds first
  x = Math.max(-MAP_LIMIT + radius, Math.min(MAP_LIMIT - radius, x));
  z = Math.max(-MAP_LIMIT + radius, Math.min(MAP_LIMIT - radius, z));

  for (let iter = 0; iter < 3; iter++) {
    for (const w of WALL_COLLIDERS) {
      // Find closest point on AABB to circle center
      const nearX = Math.max(w.minX, Math.min(w.maxX, x));
      const nearZ = Math.max(w.minZ, Math.min(w.maxZ, z));
      const dx = x - nearX;
      const dz = z - nearZ;
      const distSq = dx * dx + dz * dz;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist < 0.0001) {
          // Center is inside wall — push on shortest axis
          const ox = Math.min(x - w.minX, w.maxX - x);
          const oz = Math.min(z - w.minZ, w.maxZ - z);
          if (ox < oz) {
            x += (x < (w.minX + w.maxX) * 0.5) ? -(ox + radius) : (ox + radius);
          } else {
            z += (z < (w.minZ + w.maxZ) * 0.5) ? -(oz + radius) : (oz + radius);
          }
        } else {
          // Normal push-out
          const push = radius - dist;
          x += (dx / dist) * push;
          z += (dz / dist) * push;
        }
      }
    }
  }

  return [x, z];
}

/** Simple check: is a point inside any wall? */
export function isInsideWall(x: number, z: number, radius: number): boolean {
  for (const w of WALL_COLLIDERS) {
    const nearX = Math.max(w.minX, Math.min(w.maxX, x));
    const nearZ = Math.max(w.minZ, Math.min(w.maxZ, z));
    const dx = x - nearX;
    const dz = z - nearZ;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}
