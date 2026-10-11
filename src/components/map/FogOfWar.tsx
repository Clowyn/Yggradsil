import type { MapToken, RevealedArea } from '../../lib/types';

/**
 * Renders dynamic persistent fog of war over the given canvas context.
 * 1. Fills entire canvas with grimdark shroud of war fog.
 * 2. Uses destination-out to carve out permanently revealed areas explored by tokens.
 * 3. Carves out active vision circles around current token positions.
 */
export function renderFog(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tokens: MapToken[],
  fogRadius: number,
  revealedAreas: RevealedArea[] = []
) {
  // Save current state
  ctx.save();

  // Fill the entire canvas with semi-transparent arcane fog
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(5, 5, 12, 0.94)';
  ctx.fillRect(0, 0, width, height);

  // Cut out visibility circles
  ctx.globalCompositeOperation = 'destination-out';

  // 1. Carve out persistent historical revealed areas
  revealedAreas.forEach((area) => {
    const r = area.r || fogRadius;
    const gradient = ctx.createRadialGradient(
      area.x,
      area.y,
      0,
      area.x,
      area.y,
      r
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(area.x, area.y, r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  });

  // 2. Carve out dynamic active vision circles around tokens
  tokens.forEach((token) => {
    const gradient = ctx.createRadialGradient(
      token.x_position,
      token.y_position,
      0,
      token.x_position,
      token.y_position,
      fogRadius
    );

    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.95)');
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.beginPath();
    ctx.arc(token.x_position, token.y_position, fogRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  });

  // Reset composite operation
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
