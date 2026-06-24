import { useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SkillNodeData } from '../../hooks/useSkillTree';
import { SkillTooltip } from './SkillTooltip';

// ─── SkillNode ─────────────────────────────────────────────────

export function SkillNode({ data }: NodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeData = data as unknown as SkillNodeData;
  const { skill, status, statColor, nodeKind } = nodeData;
  const isCore = nodeKind === 'root';
  const isBranchRoot = nodeKind === 'branch';

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
      cursor-pointer select-none transition-all duration-300
      border-2 ${sizeClass}
    `;

    if (isCore) {
      return `${base} border-[#ffd700] bg-gradient-to-b from-[#2a1f0e] to-[#1a0f05]
        shadow-[0_0_30px_rgba(255,215,0,0.4),0_0_60px_rgba(255,215,0,0.15)]`;
    }

    if (isBranchRoot) {
      return `${base} bg-gradient-to-b from-[#1a0a2e] to-[#0a0a0f]
        shadow-[0_0_20px_rgba(255,215,0,0.2)]`;
    }

    switch (status) {
      case 'unlocked':
        return `${base} border-[#ffd700] bg-gradient-to-b from-[#2a1f0e] to-[#15100a]
          shadow-[0_0_20px_rgba(255,215,0,0.35),inset_0_0_15px_rgba(255,215,0,0.1)]`;
      case 'unlockable':
        return `${base} border-[#4ade80] bg-gradient-to-b from-[#0a2e1a] to-[#0a0a0f]
          skill-unlockable`;
      case 'locked':
      default:
        return `${base} border-[#333] bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d]
          opacity-50 grayscale`;
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
          className="!bg-transparent !border-0 !w-2 !h-2"
        />
      )}

      {/* Node body */}
      <motion.div
        className={getNodeStyles()}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          ...(isBranchRoot ? { borderColor: statColor } : {}),
          ...(status === 'unlocked' && !isCore && !isBranchRoot
            ? { boxShadow: `0 0 20px ${statColor}44, 0 0 40px ${statColor}22, inset 0 0 15px ${statColor}11` }
            : {}),
        }}
      >
        {/* Golden ring for unlocked */}
        {status === 'unlocked' && !isCore && !isBranchRoot && (
          <div
            className="absolute inset-[-4px] rounded-full border-2 border-[#ffd700] opacity-60 animate-spin"
            style={{ animationDuration: '20s' }}
          />
        )}

        {/* Glowing pulse ring for unlockable */}
        {status === 'unlockable' && (
          <motion.div
            className="absolute inset-[-6px] rounded-full border-2 border-[#4ade80]"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Icon */}
        <span className={`${iconSize} leading-none`} role="img">
          {skill.icon}
        </span>

        {/* Lock icon overlay */}
        {status === 'locked' && !isBranchRoot && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <span className="text-sm opacity-70">🔒</span>
          </div>
        )}

        {/* Checkmark for unlocked */}
        {status === 'unlocked' && !isCore && !isBranchRoot && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffd700] flex items-center justify-center shadow-lg">
            <span className="text-[10px] text-black font-bold">✓</span>
          </div>
        )}

        {/* XP cost badge for unlockable */}
        {status === 'unlockable' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0a2e1a] border border-[#4ade80] text-[9px] text-[#4ade80] font-bold whitespace-nowrap shadow-lg">
            {skill.xpCost} XP
          </div>
        )}
      </motion.div>

      {/* Skill name label */}
      <div
        className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap tracking-wide text-center max-w-[120px] truncate"
        style={{
          color: status === 'locked' ? '#555' : isCore ? '#ffd700' : statColor,
          fontFamily: "'Cinzel', serif",
          textShadow: status !== 'locked' ? `0 0 10px ${isCore ? '#ffd700' : statColor}44` : 'none',
        }}
      >
        {skill.name}
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isCore && (
          <SkillTooltip skill={skill} status={status} statColor={statColor} />
        )}
      </AnimatePresence>

      {/* Outgoing handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-2 !h-2"
      />
    </>
  );
}
