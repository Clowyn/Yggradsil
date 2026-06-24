import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────

interface PlayerInfo {
  id: string;
  name: string;
  race: string;
  className: string;
  level: number;
  xp: number;
  color: string;
  hp: { current: number; max: number };
  ac: number;
  stats: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number };
}

// ─── Demo Data ─────────────────────────────────────────────────

const DEMO_PLAYERS: PlayerInfo[] = [
  {
    id: 'p1', name: 'Kael the Bold', race: 'Human', className: 'Warrior',
    level: 8, xp: 3400, color: '#dc2626',
    hp: { current: 72, max: 85 }, ac: 18,
    stats: { STR: 18, DEX: 12, CON: 16, INT: 10, WIS: 13, CHA: 14 },
  },
  {
    id: 'p2', name: 'Lyria Moonweaver', race: 'Elf', className: 'Mage',
    level: 7, xp: 2800, color: '#2563eb',
    hp: { current: 38, max: 42 }, ac: 12,
    stats: { STR: 8, DEX: 14, CON: 12, INT: 20, WIS: 15, CHA: 13 },
  },
  {
    id: 'p3', name: 'Thorne Ironbark', race: 'Dwarf', className: 'Paladin',
    level: 9, xp: 4100, color: '#16a34a',
    hp: { current: 95, max: 98 }, ac: 20,
    stats: { STR: 16, DEX: 10, CON: 18, INT: 11, WIS: 16, CHA: 14 },
  },
  {
    id: 'p4', name: 'Mora Shadowveil', race: 'Tiefling', className: 'Rogue',
    level: 6, xp: 2100, color: '#9333ea',
    hp: { current: 44, max: 52 }, ac: 15,
    stats: { STR: 10, DEX: 20, CON: 13, INT: 14, WIS: 11, CHA: 16 },
  },
];

const STAT_KEYS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
const STAT_COLORS: Record<string, string> = {
  STR: '#dc2626', DEX: '#16a34a', CON: '#d97706',
  INT: '#2563eb', WIS: '#9333ea', CHA: '#ec4899',
};

// ─── PlayerManager ─────────────────────────────────────────────

export function PlayerManager() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <motion.div
      className="w-full max-w-[800px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-[#ffd700]" />
        <h2 className="text-lg font-cinzel font-bold text-gold-gradient">
          Player Manager
        </h2>
        <span className="ml-auto text-xs text-gray-500">
          {DEMO_PLAYERS.length} players
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-2 px-4 py-2 text-[9px] text-gray-500 uppercase tracking-widest font-bold">
        <span>Name</span>
        <span>Race</span>
        <span>Class</span>
        <span>Level</span>
        <span>XP</span>
        <span />
      </div>

      {/* Player rows */}
      <div className="space-y-1.5">
        {DEMO_PLAYERS.map((player, i) => {
          const isExpanded = expandedId === player.id;
          const hpPercent = (player.hp.current / player.hp.max) * 100;

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {/* Main row */}
              <button
                onClick={() => toggleExpanded(player.id)}
                className={`
                  w-full glass rounded-xl p-3 border transition-all duration-300 text-left
                  ${isExpanded ? 'border-white/15 rounded-b-none' : 'border-white/5 hover:border-white/10'}
                `}
              >
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-2 items-center">
                  {/* Name */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs text-white border-2"
                      style={{
                        backgroundColor: `${player.color}22`,
                        borderColor: `${player.color}66`,
                      }}
                    >
                      {player.name[0]}
                    </div>
                    <span className="text-sm font-bold text-gray-200 truncate">
                      {player.name}
                    </span>
                  </div>

                  {/* Race */}
                  <span className="text-xs text-gray-400">{player.race}</span>

                  {/* Class */}
                  <span className="text-xs text-gray-400">{player.className}</span>

                  {/* Level */}
                  <span className="text-sm font-bold" style={{ color: player.color }}>
                    {player.level}
                  </span>

                  {/* XP */}
                  <span className="text-xs text-gray-300 tabular-nums">
                    {player.xp.toLocaleString()}
                  </span>

                  {/* Expand */}
                  <div className="flex justify-center">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    className="glass rounded-b-xl p-4 border border-t-0 border-white/15 space-y-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {/* HP & AC */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                          Hit Points
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-200">
                            {player.hp.current}
                          </span>
                          <span className="text-xs text-gray-600">/ {player.hp.max}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mt-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${hpPercent}%`,
                              backgroundColor:
                                hpPercent > 50 ? '#16a34a' : hpPercent > 25 ? '#d97706' : '#dc2626',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                          Armor Class
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-gray-200">{player.ac}</span>
                          <span className="text-xl">🛡️</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-2">
                        Ability Scores
                      </label>
                      <div className="grid grid-cols-6 gap-2">
                        {STAT_KEYS.map((stat) => {
                          const value = player.stats[stat];
                          const modifier = Math.floor((value - 10) / 2);
                          return (
                            <div
                              key={stat}
                              className="rounded-lg p-2 text-center border"
                              style={{
                                backgroundColor: `${STAT_COLORS[stat]}08`,
                                borderColor: `${STAT_COLORS[stat]}22`,
                              }}
                            >
                              <div
                                className="text-[9px] font-bold uppercase tracking-wider mb-1"
                                style={{ color: STAT_COLORS[stat] }}
                              >
                                {stat}
                              </div>
                              <div className="text-lg font-bold text-gray-200">{value}</div>
                              <div className="text-[10px] text-gray-500">
                                {modifier >= 0 ? `+${modifier}` : modifier}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* XP progress */}
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase tracking-widest block mb-1">
                        Experience Progress
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(player.xp % 1000) / 10}%`,
                              backgroundColor: player.color,
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 tabular-nums">
                          {player.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
