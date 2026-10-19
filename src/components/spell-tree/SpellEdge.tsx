import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';

interface SpellEdgeData {
  status: 'unlocked' | 'partial' | 'locked';
  color: string;
  isDimmed?: boolean;
}

function SpellEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const edgeData = data as unknown as SpellEdgeData | undefined;
  const status = edgeData?.status ?? 'locked';
  const color = edgeData?.color ?? '#3b82f6';
  const isDimmed = Boolean(edgeData?.isDimmed) || (typeof style?.opacity === 'number' && style.opacity < 0.5);

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

  const strokeColor = isUnlocked ? color : isPartial ? color : '#334155';
  const strokeWidth = isUnlocked ? 2.5 : isPartial ? 2 : 1.25;
  const strokeDasharray = isUnlocked ? 'none' : isPartial ? '8 4' : '4 4';
  const strokeOpacity = isUnlocked ? 0.95 : isPartial ? 0.7 : 0.3;

  return (
    <>
      {/* High-performance glow layer for unlocked edges without expensive feGaussianBlur filter */}
      {(isUnlocked || isPartial) && !isDimmed && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={isUnlocked ? 6 : 4}
          strokeOpacity={isUnlocked ? 0.25 : 0.14}
          strokeLinecap="round"
        />
      )}

      {/* Main edge path — inline style overrides .react-flow__edge-path CSS defaults */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeOpacity={strokeOpacity}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          strokeOpacity,
          transition: 'opacity 0.25s ease, stroke 0.25s ease',
        }}
      />

      {/* Animated energy particles on active unlocked edges only */}
      {isUnlocked && !isDimmed && (
        <g>
          <circle r="4.5" fill={color} opacity={0.35}>
            <animateMotion dur="3.2s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="2.2" fill="#ffd700" opacity={0.95}>
            <animateMotion dur="3.2s" repeatCount="indefinite" path={edgePath} />
          </circle>
        </g>
      )}

      {/* Subtle energy pulse on unlockable (partial) edges */}
      {isPartial && !isDimmed && (
        <circle r="2.2" fill="#4ade80" opacity={0.85}>
          <animateMotion dur="4.2s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

function areSpellEdgePropsEqual(prev: EdgeProps, next: EdgeProps): boolean {
  const prevData = prev.data as unknown as SpellEdgeData | undefined;
  const nextData = next.data as unknown as SpellEdgeData | undefined;

  return (
    prev.id === next.id &&
    prev.sourceX === next.sourceX &&
    prev.sourceY === next.sourceY &&
    prev.targetX === next.targetX &&
    prev.targetY === next.targetY &&
    prevData?.status === nextData?.status &&
    prevData?.color === nextData?.color &&
    prevData?.isDimmed === nextData?.isDimmed &&
    prev.style?.opacity === next.style?.opacity
  );
}

export const SpellEdge = memo(SpellEdgeComponent, areSpellEdgePropsEqual);
