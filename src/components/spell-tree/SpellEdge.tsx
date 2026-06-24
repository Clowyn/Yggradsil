import { getBezierPath, type EdgeProps } from '@xyflow/react';

interface SpellEdgeData {
  status: 'unlocked' | 'partial' | 'locked';
  color: string;
}

export function SpellEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const edgeData = data as unknown as SpellEdgeData | undefined;
  const status = edgeData?.status ?? 'locked';
  const color = edgeData?.color ?? '#3b82f6';

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const isUnlocked = status === 'unlocked';
  const isPartial = status === 'partial';

  return (
    <>
      <defs>
        <filter id={`spell-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`spell-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={isUnlocked ? 0.9 : 0.4} />
          <stop offset="100%" stopColor={isUnlocked ? '#ffd700' : color} stopOpacity={isUnlocked ? 0.7 : 0.2} />
        </linearGradient>
      </defs>

      {/* Glow layer for unlocked edges */}
      {isUnlocked && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeOpacity={0.2}
          filter={`url(#spell-glow-${id})`}
        />
      )}

      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={
          isUnlocked
            ? `url(#spell-gradient-${id})`
            : isPartial
              ? color
              : '#333'
        }
        strokeWidth={isUnlocked ? 3 : isPartial ? 2 : 1}
        strokeDasharray={isUnlocked ? 'none' : isPartial ? '8 4' : '4 4'}
        strokeOpacity={isUnlocked ? 1 : isPartial ? 0.6 : 0.25}
        style={{
          transition: 'all 0.5s ease',
        }}
      />

      {/* Animated energy particles on unlocked edges */}
      {isUnlocked && (
        <circle r="2.5" fill={color} opacity={0.8}>
          <animateMotion
            dur="3s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </>
  );
}
