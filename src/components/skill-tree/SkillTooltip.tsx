import { motion } from 'framer-motion';
import type { SkillDef, SkillStatus } from '../../hooks/useSkillTree';

interface SkillTooltipProps {
  skill: SkillDef;
  status: SkillStatus;
  statColor: string;
}

export function SkillTooltip({ skill, status, statColor }: SkillTooltipProps) {
  const statusLabels: Record<SkillStatus, { text: string; color: string }> = {
    unlocked: { text: '✓ Unlocked', color: '#ffd700' },
    unlockable: { text: '⚡ Ready to Unlock', color: '#4ade80' },
    locked: { text: '🔒 Locked', color: '#666' },
  };

  const statusInfo = statusLabels[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.9 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-4 z-50 pointer-events-none"
    >
      <div
        className="glass rounded-xl p-4 min-w-[240px] max-w-[280px]"
        style={{
          borderColor: `${statColor}44`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${statColor}22`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{skill.icon}</span>
          <h3
            className="font-cinzel font-bold text-sm leading-tight"
            style={{ color: statColor }}
          >
            {skill.name}
          </h3>
        </div>

        {/* Tier indicator */}
        {skill.tier > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: skill.tier }).map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: statColor, opacity: 0.8 }}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">Tier {skill.tier}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-gray-300 leading-relaxed mb-3 italic">
          {skill.description}
        </p>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />

        {/* Effects */}
        <div className="flex items-start gap-1.5 mb-3">
          <span className="text-[10px] text-amber-400">⚡</span>
          <p className="text-[11px] text-amber-200/90">{skill.effects.description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {skill.xpCost > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px]">✦</span>
              <span className="text-xs font-bold text-gold-gradient">
                {skill.xpCost} XP
              </span>
            </div>
          )}
          <span
            className="text-[10px] font-bold tracking-wide uppercase"
            style={{ color: statusInfo.color }}
          >
            {statusInfo.text}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
