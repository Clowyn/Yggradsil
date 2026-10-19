import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Send, Sparkles } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────

export interface XPDistributorPlayer {
  id: string;
  name: string;
  xp: number;
  level: number;
  color: string;
}

interface XPDistributorProps {
  players?: XPDistributorPlayer[];
  onGiveXP?: (playerId: string, amount: number, reason: string) => void;
}

const DEFAULT_PLAYERS: XPDistributorPlayer[] = [
  { id: 'p1', name: 'Kael the Bold', xp: 3400, level: 8, color: '#dc2626' },
  { id: 'p2', name: 'Lyria Moonweaver', xp: 2800, level: 7, color: '#2563eb' },
  { id: 'p3', name: 'Thorne Ironbark', xp: 4100, level: 9, color: '#16a34a' },
  { id: 'p4', name: 'Mora Shadowveil', xp: 2100, level: 6, color: '#9333ea' },
];

// ─── XPDistributor ─────────────────────────────────────────────

export function XPDistributor({ players: externalPlayers, onGiveXP }: XPDistributorProps) {
  const [localFallback, setLocalFallback] = useState<XPDistributorPlayer[]>(DEFAULT_PLAYERS);
  const [pendingMap, setPendingMap] = useState<Record<string, number>>({});
  const [bulkXP, setBulkXP] = useState('');
  const [reason, setReason] = useState('');
  const [distributed, setDistributed] = useState(false);

  const activePlayers = useMemo(
    () => (externalPlayers && externalPlayers.length > 0 ? externalPlayers : localFallback),
    [externalPlayers, localFallback]
  );

  const handleIndividualXP = useCallback((id: string, value: number) => {
    setPendingMap((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  }, []);

  const handleGiveToAll = useCallback(() => {
    const amount = parseInt(bulkXP, 10);
    if (isNaN(amount) || amount <= 0) return;
    const next: Record<string, number> = {};
    activePlayers.forEach((p) => {
      next[p.id] = amount;
    });
    setPendingMap(next);
  }, [bulkXP, activePlayers]);

  const totalToDistribute = useMemo(
    () => activePlayers.reduce((sum, p) => sum + (pendingMap[p.id] || 0), 0),
    [activePlayers, pendingMap]
  );

  const handleDistribute = useCallback(() => {
    if (totalToDistribute <= 0) return;

    if (onGiveXP) {
      activePlayers.forEach((p) => {
        const amt = pendingMap[p.id] || 0;
        if (amt > 0) {
          onGiveXP(p.id, amt, reason.trim() || 'Milestone XP');
        }
      });
    } else {
      setLocalFallback((prev) =>
        prev.map((p) => ({
          ...p,
          xp: p.xp + (pendingMap[p.id] || 0),
        }))
      );
    }

    setPendingMap({});
    setBulkXP('');
    setReason('');
    setDistributed(true);
    setTimeout(() => setDistributed(false), 2000);
  }, [totalToDistribute, onGiveXP, activePlayers, pendingMap, reason]);

  return (
    <motion.div
      data-testid="xp-distributor-widget"
      className="w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-[#ffd700]" />
        <h2 className="text-base font-cinzel font-bold text-gold-gradient">
          Interactive XP Allocation Matrix
        </h2>
      </div>

      {/* Bulk XP field */}
      <div className="glass rounded-xl p-4 mb-4 space-y-2.5">
        <label className="text-[10px] text-gray-500 uppercase tracking-widest block">
          Stage Bulk XP for All Party Members
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            type="number"
            min={0}
            placeholder="Enter XP amount..."
            value={bulkXP}
            onChange={(e) => setBulkXP(e.target.value)}
            className="flex-1 min-w-[140px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40 transition-colors"
          />
          <input
            type="text"
            placeholder="Award reason (e.g. Boss Defeated)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 min-w-[160px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40 transition-colors"
          />
          <motion.button
            type="button"
            onClick={handleGiveToAll}
            className="px-4 py-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Stage All</span>
          </motion.button>
        </div>
      </div>

      {/* Player list */}
      <div className="space-y-3 mb-4">
        {activePlayers.map((player, i) => {
          const xpToGive = pendingMap[player.id] || 0;
          return (
            <motion.div
              key={player.id}
              className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white border-2"
                  style={{
                    backgroundColor: `${player.color}22`,
                    borderColor: `${player.color}66`,
                  }}
                >
                  {player.name[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-200">{player.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>Level {player.level}</span>
                    <span className="text-gray-700">•</span>
                    <span>{player.xp.toLocaleString()} XP</span>
                  </div>
                </div>

                {/* XP input */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-500">+</span>
                  <input
                    type="number"
                    min={0}
                    value={xpToGive || ''}
                    placeholder="0"
                    onChange={(e) =>
                      handleIndividualXP(player.id, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center text-[#ffd700] font-bold placeholder-gray-700 focus:outline-none focus:border-[#ffd700]/40 transition-colors"
                  />
                  <span className="text-[10px] text-gray-500">XP</span>
                </div>
              </div>

              {/* Preview bar */}
              {xpToGive > 0 && (
                <motion.div
                  className="mt-2 flex items-center gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="h-full rounded-l-full"
                        style={{
                          width: `${(player.xp / Math.max(1, player.xp + xpToGive)) * 100}%`,
                          backgroundColor: player.color,
                        }}
                      />
                      <motion.div
                        className="h-full rounded-r-full bg-[#ffd700]"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(xpToGive / Math.max(1, player.xp + xpToGive)) * 100}%`,
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#ffd700] font-bold whitespace-nowrap">
                    → {(player.xp + xpToGive).toLocaleString()} XP
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Distribute button */}
      <motion.button
        type="button"
        onClick={handleDistribute}
        disabled={totalToDistribute === 0}
        className={`
          w-full py-3 rounded-xl font-cinzel font-bold text-sm tracking-widest uppercase
          transition-all duration-300 relative overflow-hidden cursor-pointer
          ${
            totalToDistribute > 0
              ? 'bg-gradient-to-r from-[#ffd700]/20 via-[#ffa500]/20 to-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] hover:from-[#ffd700]/30 hover:via-[#ffa500]/30 hover:to-[#ffd700]/30'
              : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
          }
        `}
        whileHover={totalToDistribute > 0 ? { scale: 1.01 } : undefined}
        whileTap={totalToDistribute > 0 ? { scale: 0.99 } : undefined}
      >
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>
            {distributed
              ? '✓ XP Distributed!'
              : totalToDistribute > 0
              ? `Distribute ${totalToDistribute.toLocaleString()} XP`
              : 'Stage XP to Distribute'}
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
}
