import type { MapToken } from '../../lib/types';

interface MapTokenProps {
  token: MapToken;
}

/**
 * DOM-based map token component.
 * Can be used as an overlay on top of the canvas map if needed.
 */
export function MapTokenComponent({ token }: MapTokenProps) {
  const initials = token.label
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="absolute flex items-center justify-center rounded-full cursor-move select-none transition-transform duration-150"
      style={{
        width: 32,
        height: 32,
        left: token.x_position - 16,
        top: token.y_position - 16,
        backgroundColor: token.color,
        boxShadow: `0 0 12px ${token.color}88, 0 2px 8px rgba(0,0,0,0.6)`,
        border: '2px solid rgba(255,255,255,0.3)',
      }}
    >
      <span className="text-[10px] font-bold text-white tracking-wide">
        {initials}
      </span>
    </div>
  );
}
