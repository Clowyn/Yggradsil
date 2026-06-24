import { useState } from 'react';
import { type StatKey, STAT_INFO } from '../../lib/types';

interface RaceClassCardProps {
  title: string;
  subtitle?: string;
  description: string;
  selected: boolean;
  dimmed: boolean;
  onSelect: () => void;
  glowColor?: string;
  badge?: string;
  stats?: Partial<Record<StatKey, number>>;
  image?: string;
}

export function RaceClassCard({
  title,
  subtitle,
  description,
  selected,
  dimmed,
  onSelect,
  glowColor = '#ffd700',
  badge,
  stats,
  image,
}: RaceClassCardProps) {
  const initial = title.charAt(0).toUpperCase();
  const [imageError, setImageError] = useState(false);

  const baseStyle: React.CSSProperties = {
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const selectedStyle: React.CSSProperties = selected
    ? {
        animation: 'holy-glow 2s ease-in-out infinite',
        filter: 'brightness(1.3)',
        transform: 'scale(1.05)',
        borderColor: glowColor,
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}80, 0 0 60px ${glowColor}40, inset 0 0 20px ${glowColor}30`,
      }
    : {};

  const dimmedStyle: React.CSSProperties = dimmed
    ? {
        opacity: 0.3,
        filter: 'brightness(0.4) grayscale(0.8)',
        transform: 'scale(0.97)',
      }
    : {};

  return (
    <button
      onClick={onSelect}
      className="relative rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 text-left cursor-pointer group overflow-hidden w-full"
      style={{ ...baseStyle, ...selectedStyle, ...dimmedStyle }}
    >
      {/* Glow background effect when selected */}
      {selected && (
        <div
          className="absolute inset-0 opacity-20 rounded-xl"
          style={{
            background: `radial-gradient(ellipse at center, ${glowColor}40 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Watermark avatar background */}
      {image && !imageError && (
        <div
          className="absolute right-[-10px] bottom-[-10px] w-28 h-28 opacity-10 group-hover:opacity-20 transition-all duration-500 pointer-events-none rounded-br-xl"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'radial-gradient(circle, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 75%)',
          }}
        />
      )}

      {/* Badge */}
      {badge && (
        <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 z-10">
          {badge}
        </span>
      )}

      <div className="relative z-10 flex gap-4 items-start">
        {/* Avatar/Initial Circle */}
        {image && !imageError ? (
          <img
            src={image}
            alt={title}
            onError={() => setImageError(true)}
            className="w-12 h-12 rounded-full object-cover shrink-0 border-2"
            style={{
              borderColor: selected ? glowColor : 'rgba(255,255,255,0.2)',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-[Cinzel] shrink-0 border-2"
            style={{
              borderColor: selected ? glowColor : 'rgba(255,255,255,0.2)',
              backgroundColor: selected ? `${glowColor}20` : 'rgba(255,255,255,0.05)',
              color: selected ? glowColor : '#94a3b8',
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className="text-base font-semibold font-[Cinzel] mb-0.5 truncate"
            style={{ color: selected ? glowColor : '#e2e8f0' }}
          >
            {title}
          </h3>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-slate-400 mb-1.5">{subtitle}</p>
          )}

          {/* Description */}
          <p className="text-sm text-slate-300/80 line-clamp-2 leading-relaxed">
            {description}
          </p>

          {/* Stat Badges */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {(Object.entries(stats) as [StatKey, number][]).map(([key, val]) => (
                <span
                  key={key}
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                  style={{
                    color: STAT_INFO[key]?.color ?? '#94a3b8',
                    borderColor: `${STAT_INFO[key]?.color ?? '#94a3b8'}40`,
                    backgroundColor: `${STAT_INFO[key]?.color ?? '#94a3b8'}15`,
                  }}
                >
                  {STAT_INFO[key]?.icon} {key} {val > 0 ? `+${val}` : val}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover glow (only when not selected and not dimmed) */}
      {!selected && !dimmed && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            boxShadow: `inset 0 0 30px ${glowColor}10, 0 0 15px ${glowColor}10`,
          }}
        />
      )}
    </button>
  );
}
