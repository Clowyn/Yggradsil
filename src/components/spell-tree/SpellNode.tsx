import { useState, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { t, tDesc, type SpellNode as SpellNodeType } from '../../lib/types';

interface SpellNodeData {
  spell: SpellNodeType;
  status: 'locked' | 'unlockable' | 'unlocked';
  nodeColor: string;
  isDimmed?: boolean;
  isActiveSubclassTree?: boolean;
}

export function SpellNode({ data }: NodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const { locale } = useAuth();

  const nodeData = data as unknown as SpellNodeData;
  const { spell, status, nodeColor, isDimmed = false, isActiveSubclassTree = false } = nodeData;

  if (!spell) return null;

  const name = t(spell, locale);
  const description = tDesc(spell, locale);
  const isSubclassRoot = spell.spell_key.startsWith('subclass_');

  const getNodeStyles = (): string => {
    const base = `
      relative flex flex-col items-center justify-center rounded-full
      select-none transition-all duration-300
      border-2 w-[110px] h-[110px]
    `;

    if (isDimmed) {
      return `${base} border-gray-800 bg-gray-950/80 cursor-not-allowed opacity-30 grayscale`;
    }

    const cursorClass = 'cursor-pointer';

    switch (status) {
      case 'unlocked':
        return `${base} ${cursorClass} border-[#ffd700] bg-gradient-to-b from-[#2a1f0e] to-[#15100a]`;
      case 'unlockable':
        return `${base} ${cursorClass} border-[#4ade80] bg-gradient-to-b from-[#0a2e1a] to-[#0a0a0f]`;
      case 'locked':
      default:
        return `${base} ${cursorClass} border-[#333] bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] opacity-50 grayscale`;
    }
  };

  const statusLabels: Record<string, { text: string; color: string }> = {
    unlocked: { text: locale === 'tr' ? '✓ Açık' : '✓ Unlocked', color: '#ffd700' },
    unlockable: { text: locale === 'tr' ? '⚡ Açılabilir' : '⚡ Ready to Unlock', color: '#4ade80' },
    locked: { text: locale === 'tr' ? '🔒 Kilitli' : '🔒 Locked', color: '#666' },
  };

  const statusInfo = statusLabels[status] || { text: '', color: '#666' };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-2 !h-2"
      />

      <motion.div
        ref={nodeRef}
        className={getNodeStyles()}
        whileHover={isDimmed ? undefined : { scale: 1.12 }}
        whileTap={isDimmed ? undefined : { scale: 0.95 }}
        onMouseEnter={() => {
          if (!isDimmed) {
            setShowTooltip(true);
            if (nodeRef.current) {
              const parent = nodeRef.current.closest('.react-flow__node') as HTMLElement;
              if (parent) parent.style.zIndex = '1000';
            }
          }
        }}
        onMouseLeave={() => {
          setShowTooltip(false);
          if (nodeRef.current) {
            const parent = nodeRef.current.closest('.react-flow__node') as HTMLElement;
            if (parent) parent.style.zIndex = '';
          }
        }}
        style={{
          ...(!isDimmed && status === 'unlocked'
            ? { boxShadow: `0 0 20px ${nodeColor}44, 0 0 40px ${nodeColor}22, inset 0 0 15px ${nodeColor}11` }
            : {}),
        }}
      >
        {/* R3. Divine Light Effect (Active Subclass Tree Root Node) */}
        {isSubclassRoot && isActiveSubclassTree && (
          <>
            {/* Outer soft light beam */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[3000px] pointer-events-none -z-20"
              style={{
                background: 'linear-gradient(to bottom, rgba(251, 191, 36, 0.0) 0%, rgba(251, 191, 36, 0.12) 30%, rgba(251, 191, 36, 0.18) 50%, rgba(251, 191, 36, 0.08) 70%, rgba(251, 191, 36, 0.0) 100%)',
                filter: 'blur(45px)',
                borderRadius: '50%',
              }}
            />
            {/* Pulsing inner glow column */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[3000px] pointer-events-none -z-10 animate-pulse"
              style={{
                background: 'linear-gradient(to bottom, rgba(251, 191, 36, 0.0) 0%, rgba(251, 191, 36, 0.25) 45%, rgba(255, 223, 100, 0.3) 50%, rgba(251, 191, 36, 0.25) 55%, rgba(251, 191, 36, 0.0) 100%)',
                filter: 'blur(10px)',
                animationDuration: '4s',
              }}
            />
            {/* Core high-intensity light shaft above the node */}
            <div 
              className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-[16px] h-[1500px] pointer-events-none -z-10"
              style={{
                background: 'linear-gradient(to top, rgba(251, 191, 36, 0.5) 0%, rgba(255, 255, 255, 0.7) 100%)',
                filter: 'blur(3px)',
                opacity: 0.8,
              }}
            />
            {/* Ethereal burst radiating at the node center */}
            <motion.div
              className="absolute w-[180px] h-[180px] rounded-full pointer-events-none -z-10"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.45) 0%, rgba(251, 191, 36, 0.15) 55%, transparent 70%)',
                filter: 'blur(6px)',
              }}
              animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.7, 1.0, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </>
        )}

        {/* R4. Dark Mist Effect (Inactive/Sibling Subclass Tree Root Node) */}
        {isSubclassRoot && isDimmed && (
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] pointer-events-none -z-20 animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(88, 28, 135, 0.15) 0%, rgba(15, 23, 42, 0.3) 50%, transparent 70%)',
              filter: 'blur(25px)',
              animationDuration: '6s',
            }}
          />
        )}

        {/* Runic spin ring for unlocked */}
        {!isDimmed && status === 'unlocked' && (
          <div
            className="absolute inset-[-5px] rounded-full border-2 border-dashed opacity-60 animate-spin"
            style={{ borderColor: nodeColor, animationDuration: '25s' }}
          />
        )}

        {/* Pulsing green ring for unlockable */}
        {!isDimmed && status === 'unlockable' && (
          <motion.div
            className="absolute inset-[-6px] rounded-full border-2 border-[#4ade80]"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Icon */}
        <span className="text-xl md:text-2xl leading-none mb-1 animate-none" role="img">
          {spell.icon || '🔮'}
        </span>

        {/* Spell name label inside */}
        <div
          className="mt-1 text-[9px] md:text-[10px] font-bold tracking-wide text-center px-2.5 font-cinzel line-clamp-2 max-w-full leading-tight select-none"
          style={{
            color: isDimmed || status === 'locked' ? '#555' : nodeColor,
            textShadow: !isDimmed && status !== 'locked' ? `0 0 8px ${nodeColor}44` : 'none',
          }}
        >
          {name}
        </div>

        {/* Lock icon overlay */}
        {(status === 'locked' || isDimmed) && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <span className="text-sm opacity-70">🔒</span>
          </div>
        )}

        {/* Checkmark badge for unlocked */}
        {!isDimmed && status === 'unlocked' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ffd700] flex items-center justify-center shadow-lg border border-black/20">
            <span className="text-[10px] text-black font-bold">✓</span>
          </div>
        )}

        {/* XP cost badge for unlockable */}
        {!isDimmed && status === 'unlockable' && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0a2e1a] border border-[#4ade80] text-[9px] text-[#4ade80] font-bold whitespace-nowrap shadow-lg">
            {spell.xp_cost} XP
          </div>
        )}
      </motion.div>



      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
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
                borderColor: `${nodeColor}44`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${nodeColor}22`,
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{spell.icon || '🔮'}</span>
                <h3 className="font-cinzel font-bold text-sm leading-tight" style={{ color: nodeColor }}>
                  {name}
                </h3>
              </div>

              {/* Branch and Level */}
              <div className="text-[10px] text-gray-400 mb-2 uppercase tracking-wide">
                {spell.branch || 'Base'} • {locale === 'tr' ? `Aşama ${spell.tier}` : `Tier ${spell.tier}`}
              </div>

              {/* Description */}
              {description && (
                <p className="text-xs text-gray-300 leading-relaxed mb-3 italic">
                  {description}
                </p>
              )}

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />

              {/* Effects */}
              {spell.effects && Object.keys(spell.effects).length > 0 && (
                <div className="mb-3">
                  <div className="text-[10px] text-amber-400 font-bold mb-1">
                    {locale === 'tr' ? 'Etkiler:' : 'Effects:'}
                  </div>
                  {Object.entries(spell.effects).map(([key, val]) => (
                    <div key={key} className="text-[10px] text-amber-200/80 pl-2">
                      <span className="capitalize font-semibold">{key.replace(/_/g, ' ')}:</span> {String(val)}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                {spell.xp_cost > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gold">✦</span>
                    <span className="text-xs font-bold text-gold-gradient">
                      {spell.xp_cost} XP
                    </span>
                  </div>
                )}
                <span className="text-[10px] font-bold tracking-wide uppercase" style={{ color: statusInfo.color }}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-2 !h-2"
      />
    </>
  );
}
