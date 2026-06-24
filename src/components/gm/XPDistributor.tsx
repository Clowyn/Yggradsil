import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Zap, Send, Sparkles } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────

interface PlayerXP {
  id: string;
  name: string;
  currentXP: number;
  level: number;
  color: string;
  xpToGive: number;
}

// ─── XPDistributor ─────────────────────────────────────────────

export function XPDistributor() {
  const [players, setPlayers] = useState<PlayerXP[]>([
    { id: 'p1', name: 'Kael the Bold', currentXP: 3400, level: 8, color: '#dc2626', xpToGive: 0 },
    { id: 'p2', name: 'Lyria Moonweaver', currentXP: 2800, level: 7, color: '#2563eb', xpToGive: 0 },
    { id: 'p3', name: 'Thorne Ironbark', currentXP: 4100, level: 9, color: '#16a34a', xpToGive: 0 },
    { id: 'p4', name: 'Mora Shadowveil', currentXP: 2100, level: 6, color: '#9333ea', xpToGive: 0 },
  ]);

  const [bulkXP, setBulkXP] = useState('');
  const [distributed, setDistributed] = useState(false);

  const handleIndividualXP = useCallback((id: string, value: number) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, xpToGive: value } : p)),
    );
  }, []);

  const handleGiveToAll = useCallback(() => {
    const amount = parseInt(bulkXP, 10);
    if (isNaN(amount) || amount <= 0) return;
    setPlayers((prev) => prev.map((p) => ({ ...p, xpToGive: amount })));
  }, [bulkXP]);

  const handleDistribute = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        currentXP: p.currentXP + p.xpToGive,
        xpToGive: 0,
      })),
    );
    setBulkXP('');
    setDistributed(true);
    setTimeout(() => setDistributed(false), 2000);
  }, []);

  const totalToDistribute = players.reduce((s, p) => s + p.xpToGive, 0);

  return (
    <motion.div
      className="w-full max-w-[600px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-[#ffd700]" />
        <h2 className="text-lg font-cinzel font-bold text-gold-gradient">
          XP Distributor
        </h2>
      </div>

      {/* Bulk XP field */}
      <div className="glass rounded-xl p-4 mb-4">
        <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">
          Give to All Players
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            placeholder="Enter XP amount..."
            value={bulkXP}
            onChange={(e) => setBulkXP(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40 transition-colors"
          />
          <motion.button
            onClick={handleGiveToAll}
            className="px-4 py-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all duration-200"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </div>

      {/* Player list */}
      <div className="space-y-3 mb-6">
        {players.map((player, i) => (
          <motion.div
            key={player.id}
            className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
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
                  <span>{player.currentXP.toLocaleString()} XP</span>
                </div>
              </div>

              {/* XP input */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-500">+</span>
                <input
                  type="number"
                  min={0}
                  value={player.xpToGive || ''}
                  placeholder="0"
                  onChange={(e) => handleIndividualXP(player.id, parseInt(e.target.value, 10) || 0)}
                  className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center text-[#ffd700] font-bold placeholder-gray-700 focus:outline-none focus:border-[#ffd700]/40 transition-colors"
                />
                <span className="text-[10px] text-gray-500">XP</span>
              </div>
            </div>

            {/* Preview bar */}
            {player.xpToGive > 0 && (
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
                        width: `${(player.currentXP / (player.currentXP + player.xpToGive)) * 100}%`,
                        backgroundColor: player.color,
                      }}
                    />
                    <motion.div
                      className="h-full rounded-r-full bg-[#ffd700]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(player.xpToGive / (player.currentXP + player.xpToGive)) * 100}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-[#ffd700] font-bold whitespace-nowrap">
                  → {(player.currentXP + player.xpToGive).toLocaleString()}
                </span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Distribute button */}
      <motion.button
        onClick={handleDistribute}
        disabled={totalToDistribute === 0}
        className={`
          w-full py-3 rounded-xl font-cinzel font-bold text-sm tracking-widest uppercase
          transition-all duration-300 relative overflow-hidden
          ${totalToDistribute > 0
            ? 'bg-gradient-to-r from-[#ffd700]/20 via-[#ffa500]/20 to-[#ffd700]/20 border border-[#ffd700]/40 text-[#ffd700] hover:from-[#ffd700]/30 hover:via-[#ffa500]/30 hover:to-[#ffd700]/30'
            : 'bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed'
          }
        `}
        whileHover={totalToDistribute > 0 ? { scale: 1.02 } : undefined}
        whileTap={totalToDistribute > 0 ? { scale: 0.98 } : undefined}
      >
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>
            {distributed
              ? '✓ XP Distributed!'
              : totalToDistribute > 0
                ? `Distribute ${totalToDistribute.toLocaleString()} XP`
                : 'Enter XP to Distribute'}
          </span>
        </div>

        {/* Animated golden shimmer on the button */}
        {totalToDistribute > 0 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/10 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </motion.button>
    </motion.div>
  );
}
