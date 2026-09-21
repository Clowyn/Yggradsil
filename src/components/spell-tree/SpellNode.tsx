import { useState, useRef, memo } from 'react';
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

function SpellNodeComponent({ data }: NodeProps) {
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
      select-none transition-all duration-200
      border-2 w-[110px] h-[110px]
    `;

    if (isDimmed) {
      return `${base} border-gray-800 bg-gray-950/80 cursor-not-allowed opacity-30 grayscale`;
    }

    const cursorClass = 'cursor-pointer hover:scale-110 active:scale-95 transition-transform duration-200';

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

      <div
        ref={nodeRef}
        className={getNodeStyles()}
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
            ? { boxShadow: `0 0 16px ${nodeColor}44, 0 0 28px ${nodeColor}22, inset 0 0 10px ${nodeColor}11` }
            : {}),
        }}
      >
        {/* R3. Optimized Divine Light Effect (Active Subclass Tree Root Node) */}
        {isSubclassRoot && isActiveSubclassTree && (
          <>
            {/* Outer soft light beam - uses gradient feathering instead of heavy blur */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[700px] pointer-events-none -z-20 rounded-full"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.16) 0%, rgba(251, 191, 36, 0.05) 50%, transparent 75%)',
                willChange: 'opacity',
              }}
            />
            {/* Pulsing inner glow column */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70px] h-[600px] pointer-events-none -z-10 animate-pulse"
              style={{
                background: 'linear-gradient(to bottom, transparent 0%, rgba(251, 191, 36, 0.22) 30%, rgba(255, 223, 100, 0.28) 50%, rgba(251, 191, 36, 0.22) 70%, transparent 100%)',
                animationDuration: '3.5s',
              }}
            />
            {/* Ethereal burst radiating at the node center */}
            <div
              className="absolute w-[160px] h-[160px] rounded-full pointer-events-none -z-10 animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(251, 191, 36, 0.35) 0%, rgba(251, 191, 36, 0.1) 50%, transparent 70%)',
                animationDuration: '3s',
              }}
            />
          </>
        )}

        {/* R4. Dark Mist Effect (Inactive/Sibling Subclass Tree Root Node) */}
        {isSubclassRoot && isDimmed && (
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] pointer-events-none -z-20 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(88, 28, 135, 0.2) 0%, rgba(15, 23, 42, 0.3) 50%, transparent 75%)',
              animationDuration: '5s',
            }}
          />
        )}

        {/* Runic spin ring for unlocked (GPU off-thread quad rotation) */}
        {!isDimmed && status === 'unlocked' && (
          <div
            className="absolute inset-[-5px] rounded-full border-2 border-dashed opacity-60 animate-spin pointer-events-none"
            style={{ borderColor: nodeColor, animationDuration: '25s', willChange: 'transform' }}
          />
        )}

        {/* Pulsing green ring for unlockable (Off-thread GPU CSS animation) */}
        {!isDimmed && status === 'unlockable' && (
          <div className="absolute inset-[-6px] rounded-full border-2 border-[#4ade80] pointer-events-none animate-unlockable-ring" />
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
      </div>

      {/* Tooltip (optimized background without expensive backdrop-filter) */}
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
              className="bg-[#0e0e18]/95 border border-white/10 rounded-xl p-4 min-w-[240px] max-w-[280px] shadow-2xl"
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

function areSpellNodePropsEqual(prev: NodeProps, next: NodeProps): boolean {
  const prevData = prev.data as unknown as SpellNodeData | undefined;
  const nextData = next.data as unknown as SpellNodeData | undefined;
  if (!prevData || !nextData) return false;

  return (
    prev.id === next.id &&
    prevData.status === nextData.status &&
    prevData.isDimmed === nextData.isDimmed &&
    prevData.isActiveSubclassTree === nextData.isActiveSubclassTree &&
    prevData.nodeColor === nextData.nodeColor &&
    prev.selected === next.selected &&
    prevData.spell?.id === nextData.spell?.id
  );
}

export const SpellNode = memo(SpellNodeComponent, areSpellNodePropsEqual);
