import type { MapToken, MapWallSegment, RevealedArea } from '../../lib/types';

export const DEFAULT_DUNGEON_WALLS: MapWallSegment[] = [
  { id: 'wall-preset-1', x1: 420, y1: 120, x2: 420, y2: 340, type: 'wall' },
  { id: 'wall-preset-2', x1: 420, y1: 440, x2: 420, y2: 680, type: 'wall' },
  { id: 'wall-preset-3', x1: 420, y1: 340, x2: 660, y2: 340, type: 'wall' },
  { id: 'wall-preset-4', x1: 740, y1: 160, x2: 740, y2: 480, type: 'wall' },
  { id: 'wall-preset-5', x1: 580, y1: 520, x2: 920, y2: 520, type: 'wall' },
];

/**
 * Computes the intersection between a ray starting at (ox, oy) with unit direction (dx, dy)
 * and a line segment (x1, y1) -> (x2, y2).
 * Returns the intersection coordinates and distance t along the ray, or null if no hit.
 */
export function raySegmentIntersection(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number; dist: number } | null {
  const sx = x2 - x1;
  const sy = y2 - y1;

  // Cross product of ray direction (dx, dy) and segment vector (sx, sy)
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-8) {
    return null; // Parallel or collinear
  }

  const qpx = x1 - ox;
  const qpy = y1 - oy;

  // t is distance along ray (must be >= 0)
  const t = (qpx * sy - qpy * sx) / denom;
  if (t < 0) return null;

  // u is parameter along segment (must be in [0, 1])
  const u = (qpx * dy - qpy * dx) / denom;
  if (u < -1e-6 || u > 1 + 1e-6) return null;

  return {
    x: ox + t * dx,
    y: oy + t * dy,
    dist: t,
  };
}

/**
 * Checks whether point B (bx, by) is visible from point A (ax, ay) without being blocked by any wall segment.
 */
export function hasLineOfSight(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  walls: MapWallSegment[],
  maxDistance?: number
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);

  if (maxDistance !== undefined && dist > maxDistance) {
    return false;
  }
  if (dist < 1e-4 || walls.length === 0) {
    return true;
  }

  const ux = dx / dist;
  const uy = dy / dist;

  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    const hit = raySegmentIntersection(ax, ay, ux, uy, w.x1, w.y1, w.x2, w.y2);
    if (hit && hit.dist > 0.5 && hit.dist < dist - 0.5) {
      return false;
    }
  }

  return true;
}

/**
 * Computes a 2D visibility polygon from (originX, originY) up to `radius`,
 * casting rays toward wall endpoints (+/- epsilon) and uniform perimeter angles.
 */
export function computeVisibilityPolygon(
  originX: number,
  originY: number,
  radius: number,
  walls: MapWallSegment[],
  numBoundaryRays = 72
): Array<{ x: number; y: number }> {
  if (radius <= 0) return [];

  const angles: number[] = [];
  const step = (Math.PI * 2) / numBoundaryRays;
  for (let i = 0; i < numBoundaryRays; i++) {
    angles.push(-Math.PI + i * step);
  }

  // Filter walls roughly within range to avoid unnecessary ray casts
  const relevantWalls = walls.filter((w) => {
    const minX = Math.min(w.x1, w.x2) - radius;
    const maxX = Math.max(w.x1, w.x2) + radius;
    const minY = Math.min(w.y1, w.y2) - radius;
    const maxY = Math.max(w.y1, w.y2) + radius;
    return originX >= minX && originX <= maxX && originY >= minY && originY <= maxY;
  });

  const normalizeAngle = (a: number): number => {
    let norm = a;
    while (norm < -Math.PI) norm += Math.PI * 2;
    while (norm >= Math.PI) norm -= Math.PI * 2;
    return norm;
  };

  const eps = 0.0004;
  for (let i = 0; i < relevantWalls.length; i++) {
    const w = relevantWalls[i];
    const a1 = Math.atan2(w.y1 - originY, w.x1 - originX);
    const a2 = Math.atan2(w.y2 - originY, w.x2 - originX);
    angles.push(
      normalizeAngle(a1 - eps),
      normalizeAngle(a1),
      normalizeAngle(a1 + eps),
      normalizeAngle(a2 - eps),
      normalizeAngle(a2),
      normalizeAngle(a2 + eps)
    );
  }

  angles.sort((a, b) => a - b);

  const polygon: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < angles.length; i++) {
    const angle = angles[i];
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let minDist = radius;
    let bestX = originX + dx * radius;
    let bestY = originY + dy * radius;

    for (let j = 0; j < relevantWalls.length; j++) {
      const w = relevantWalls[j];
      const hit = raySegmentIntersection(originX, originY, dx, dy, w.x1, w.y1, w.x2, w.y2);
      if (hit && hit.dist < minDist) {
        minDist = hit.dist;
        bestX = hit.x;
        bestY = hit.y;
      }
    }

    polygon.push({ x: bestX, y: bestY });
  }

  return polygon;
}

/**
 * Renders dynamic persistent fog of war over the given canvas context.
 * 1. Fills entire canvas with grimdark shroud of war fog.
 * 2. Uses destination-out to carve out permanently revealed areas explored by tokens.
 * 3. Carves out active vision polygons (2D raycasted against walls when losEnabled) or circles around current token positions.
 */
export function renderFog(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tokens: MapToken[],
  fogRadius: number,
  revealedAreas: RevealedArea[] = [],
  walls: MapWallSegment[] = [],
  losEnabled = true
) {
  ctx.save();

  // Fill the entire canvas with semi-transparent arcane fog
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(5, 5, 12, 0.94)';
  ctx.fillRect(0, 0, width, height);

  // Cut out visibility shapes
  ctx.globalCompositeOperation = 'destination-out';

  // 1. Carve out persistent historical revealed areas (dimmer memory shroud when LoS is active)
  revealedAreas.forEach((area) => {
    const r = area.r || fogRadius;
    const gradient = ctx.createRadialGradient(area.x, area.y, 0, area.x, area.y, r);

    const coreAlpha = losEnabled && walls.length > 0 ? 0.55 : 1;
    gradient.addColorStop(0, `rgba(0, 0, 0, ${coreAlpha})`);
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${coreAlpha * 0.85})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    if (losEnabled && walls.length > 0) {
      const poly = computeVisibilityPolygon(area.x, area.y, r, walls, 48);
      if (poly.length > 2) {
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
      } else {
        ctx.arc(area.x, area.y, r, 0, Math.PI * 2);
      }
    } else {
      ctx.arc(area.x, area.y, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = gradient;
    ctx.fill();
  });

  // 2. Carve out dynamic active vision polygons around tokens
  tokens.forEach((token) => {
    const tx = token.x_position;
    const ty = token.y_position;

    const gradient = ctx.createRadialGradient(tx, ty, 0, tx, ty, fogRadius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.96)');
    gradient.addColorStop(0.88, 'rgba(0, 0, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    if (losEnabled && walls.length > 0) {
      const poly = computeVisibilityPolygon(tx, ty, fogRadius, walls, 72);
      if (poly.length > 2) {
        ctx.moveTo(poly[0].x, poly[0].y);
        for (let i = 1; i < poly.length; i++) {
          ctx.lineTo(poly[i].x, poly[i].y);
        }
        ctx.closePath();
      } else {
        ctx.arc(tx, ty, fogRadius, 0, Math.PI * 2);
      }
    } else {
      ctx.arc(tx, ty, fogRadius, 0, Math.PI * 2);
    }

    ctx.fillStyle = gradient;
    ctx.fill();
  });

  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
