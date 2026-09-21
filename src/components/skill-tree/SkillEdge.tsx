import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';
import type { SkillEdgeData } from '../../hooks/useSkillTree';

function SkillEdgeComponent({
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
  const edgeData = data as unknown as SkillEdgeData | undefined;
  const status = edgeData?.status ?? 'locked';
  const color = edgeData?.color ?? '#ffd700';
  const isDimmed = typeof style?.opacity === 'number' && style.opacity < 0.5;

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
      {/* High-performance glow layer without heavy SVG filters */}
      {isUnlocked && !isDimmed && (
        <path
          d={edgePath}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeOpacity={0.25}
          strokeLinecap="round"
        />
      )}

      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={isUnlocked ? color : isPartial ? color : '#333'}
        strokeWidth={isUnlocked ? 2.5 : isPartial ? 2 : 1}
        strokeDasharray={isUnlocked ? 'none' : isPartial ? '8 4' : '4 4'}
        strokeOpacity={isUnlocked ? 1 : isPartial ? 0.6 : 0.25}
        style={{
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Animated energy particles on active unlocked edges */}
      {isUnlocked && !isDimmed && (
        <circle r="2" fill={color} opacity={0.85}>
          <animateMotion
            dur="3.5s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
    </>
  );
}

function areSkillEdgePropsEqual(prev: EdgeProps, next: EdgeProps): boolean {
  const prevData = prev.data as unknown as SkillEdgeData | undefined;
  const nextData = next.data as unknown as SkillEdgeData | undefined;

  return (
    prev.id === next.id &&
    prev.sourceX === next.sourceX &&
    prev.sourceY === next.sourceY &&
    prev.targetX === next.targetX &&
    prev.targetY === next.targetY &&
    prevData?.status === nextData?.status &&
    prevData?.color === nextData?.color &&
    prev.style?.opacity === next.style?.opacity
  );
}

export const SkillEdge = memo(SkillEdgeComponent, areSkillEdgePropsEqual);
