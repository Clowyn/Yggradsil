import type { MapToken } from '../../lib/types';

/**
 * Renders fog of war over the given canvas context.
 * Clears a radial gradient around each token position.
 */
export function renderFog(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tokens: MapToken[],
  fogRadius: number,
) {
  // Save current state
  ctx.save();

  // Fill the entire canvas with semi-transparent black fog
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(5, 5, 12, 0.92)';
  ctx.fillRect(0, 0, width, height);

  // Cut out visibility circles around each token
  ctx.globalCompositeOperation = 'destination-out';

  tokens.forEach((token) => {
    const gradient = ctx.createRadialGradient(
      token.x_position,
      token.y_position,
      0,
      token.x_position,
      token.y_position,
      fogRadius,
    );

    // Clear center, fade to edge
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.4)');
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
