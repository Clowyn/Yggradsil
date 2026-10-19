import { useState, useRef, useCallback, memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AnimatePresence } from 'framer-motion';
import type { SkillNodeData } from '../../hooks/useSkillTree';
import { SkillTooltip } from './SkillTooltip';

// ─── SkillNode ─────────────────────────────────────────────────

function SkillNodeComponent({ data }: NodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const nodeData = data as unknown as SkillNodeData;
  const { skill, status, statColor, nodeKind } = nodeData;
  const isCore = nodeKind === 'root';
  const isBranchRoot = nodeKind === 'branch';

  const elevateParentNode = useCallback((elevate: boolean) => {
    if (!nodeRef.current) return;
    const parent = nodeRef.current.closest('.react-flow__node') as HTMLElement | null;
    if (!parent) return;
    if (elevate) {
      parent.style.zIndex = '1000';
      parent.classList.add('rf-tooltip-active');
    } else {
      parent.style.zIndex = '';
      parent.classList.remove('rf-tooltip-active');
    }
  }, []);

  // ── Size classes ──
  const sizeClass = isCore
    ? 'w-[100px] h-[100px]'
    : isBranchRoot
      ? 'w-[90px] h-[90px]'
      : 'w-[80px] h-[80px]';

  // ── Status-based styles ──
  const getNodeStyles = (): string => {
    const base = `
      relative flex flex-col items-center justify-center rounded-full
      cursor-pointer select-none transition-shadow duration-200
      border-2 ${sizeClass}
    `;

    if (isCore) {
      return `${base} border-[#ffd700] bg-gradient-to-b from-[#2a1f0e] to-[#1a0f05]
        shadow-[0_0_24px_rgba(255,215,0,0.35)]`;
    }

    if (isBranchRoot) {
      return `${base} bg-gradient-to-b from-[#1a0a2e] to-[#0a0a0f]
        shadow-[0_0_16px_rgba(255,215,0,0.2)]`;
    }

    switch (status) {
      case 'unlocked':
        return `${base} border-[#ffd700] bg-gradient-to-b from-[#2a1f0e] to-[#15100a]
          shadow-[0_0_16px_rgba(255,215,0,0.3)]`;
      case 'unlockable':
        return `${base} border-[#4ade80] bg-gradient-to-b from-[#0a2e1a] to-[#0a0a0f]
          skill-unlockable`;
      case 'locked':
      default:
        return `${base} border-[#333] bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]
          opacity-50`;
    }
  };

  // ── Icon size ──
  const iconSize = isCore ? 'text-3xl' : isBranchRoot ? 'text-2xl' : 'text-xl';

  return (
    <>
      {/* Incoming handle */}
      {!isCore && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-transparent !border-0 !w-1.5 !h-1.5 !min-w-0 !min-h-0 !top-0"
        />
      )}

      {/* Node body */}
      <div
        ref={nodeRef}
        className={getNodeStyles()}
        onMouseEnter={() => {
          setShowTooltip(true);
          elevateParentNode(true);
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          if (isCore) elevateParentNode(false);
        }}
        style={{
          ...(isBranchRoot
            ? {
                borderColor: statColor,
                boxShadow: showTooltip
                  ? `0 0 24px ${statColor}66, 0 0 36px ${statColor}33`
                  : `0 0 16px ${statColor}33`,
              }
            : {}),
          ...(status === 'unlocked' && !isCore && !isBranchRoot
            ? {
                boxShadow: showTooltip
                  ? `0 0 22px ${statColor}66, 0 0 34px ${statColor}33`
                  : `0 0 16px ${statColor}44, 0 0 28px ${statColor}22`,
              }
            : {}),
        }}
      >
        {/* Runic dashed golden ring for unlocked */}
        {status === 'unlocked' && !isCore && !isBranchRoot && (
          <div
            className="absolute inset-[-5px] rounded-full border-2 border-dashed border-[#ffd700] opacity-65 pointer-events-none animate-spin"
            style={{ animationDuration: '22s', willChange: 'transform' }}
          />
        )}

        {/* Glowing pulse ring for unlockable */}
        {status === 'unlockable' && (
          <div className="absolute inset-[-6px] rounded-full border-2 border-[#4ade80] pointer-events-none animate-unlockable-ring" />
        )}

        {/* Icon */}
        <span className={`${iconSize} leading-none z-10`} role="img">
          {skill.icon}
        </span>

        {/* Lock icon overlay */}
        {status === 'locked' && !isBranchRoot && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 z-10">
            <span className="text-sm opacity-70">🔒</span>
          </div>
        )}

        {/* Checkmark for unlocked */}
        {status === 'unlocked' && !isCore && !isBranchRoot && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffd700] flex items-center justify-center shadow-lg z-20">
            <span className="text-[10px] text-black font-bold">✓</span>
          </div>
        )}

        {/* XP cost badge for unlockable */}
        {status === 'unlockable' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0a2e1a] border border-[#4ade80] text-[9px] text-[#4ade80] font-bold whitespace-nowrap shadow-lg z-20">
            {skill.xpCost} XP
          </div>
        )}
      </div>

      {/* Skill name label (hidden while tooltip is open so it never clips under the tooltip header) */}
      <div
        className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap tracking-wide text-center max-w-[120px] truncate pointer-events-none transition-opacity duration-150 ${
          showTooltip && !isCore ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          color: status === 'locked' ? '#555' : isCore ? '#ffd700' : statColor,
          fontFamily: "'Cinzel', serif",
          textShadow: status !== 'locked' ? `0 0 10px ${isCore ? '#ffd700' : statColor}44` : 'none',
        }}
      >
        {skill.name}
      </div>

      {/* Tooltip */}
      <AnimatePresence onExitComplete={() => elevateParentNode(false)}>
        {showTooltip && !isCore && (
          <SkillTooltip skill={skill} status={status} statColor={statColor} />
        )}
      </AnimatePresence>

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-1.5 !h-1.5 !min-w-0 !min-h-0 !bottom-0"
      />
    </>
  );
}

function areSkillNodePropsEqual(prev: NodeProps, next: NodeProps): boolean {
  const prevData = prev.data as unknown as SkillNodeData | undefined;
  const nextData = next.data as unknown as SkillNodeData | undefined;
  if (!prevData || !nextData) return false;

  return (
    prev.id === next.id &&
    prevData.status === nextData.status &&
    prevData.statColor === nextData.statColor &&
    prevData.nodeKind === nextData.nodeKind &&
    prev.selected === next.selected &&
    prevData.skill?.id === nextData.skill?.id
  );
}

export const SkillNode = memo(SkillNodeComponent, areSkillNodePropsEqual);
