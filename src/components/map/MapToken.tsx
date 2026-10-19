import type { MapToken } from '../../lib/types';

interface MapTokenProps {
  token: MapToken;
  isSelected?: boolean;
  isOccluded?: boolean;
  compact?: boolean;
  onClick?: (token: MapToken) => void;
}

/**
 * Interactive map token badge & overlay component.
 * Used in the tactical battle map token roster and inspector bar.
 */
export function MapTokenComponent({
  token,
  isSelected = false,
  isOccluded = false,
  compact = false,
  onClick,
}: MapTokenProps) {
  const initials = (token.label || 'T')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick?.(token)}
        title={`${token.label} (${Math.round(token.x_position)}, ${Math.round(token.y_position)})`}
        className={`relative flex items-center justify-center rounded-full select-none transition-all cursor-pointer ${
          isSelected ? 'ring-2 ring-amber-400 scale-110' : 'hover:scale-105'
        } ${isOccluded ? 'opacity-40' : 'opacity-100'}`}
        style={{
          width: 24,
          height: 24,
          backgroundColor: token.color,
          boxShadow: `0 0 8px ${token.color}88`,
          border: '1.5px solid rgba(255,255,255,0.45)',
        }}
      >
        <span className="text-[9px] font-bold text-white tracking-tight">
          {initials}
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={() => onClick?.(token)}
      className={`absolute flex items-center justify-center rounded-full cursor-move select-none transition-opacity duration-150 ${
        isOccluded ? 'opacity-30' : 'opacity-100'
      }`}
      style={{
        width: 32,
        height: 32,
        left: token.x_position - 16,
        top: token.y_position - 16,
        backgroundColor: token.color,
        boxShadow: `0 0 12px ${token.color}88, 0 2px 8px rgba(0,0,0,0.6)`,
        border: isSelected ? '2px solid #fbbf24' : '2px solid rgba(255,255,255,0.3)',
      }}
    >
      <span className="text-[10px] font-bold text-white tracking-wide">
        {initials}
      </span>
    </div>
  );
}
