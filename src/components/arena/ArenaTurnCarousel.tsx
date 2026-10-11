import { motion } from 'framer-motion';
import { Flame, Skull, Shield } from 'lucide-react';
import type { CombatArenaParticipant } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

interface ArenaTurnCarouselProps {
  participants: CombatArenaParticipant[];
  activeCombatantId: string | null;
  roundNumber: number;
}

export function ArenaTurnCarousel({
  participants,
  activeCombatantId,
  roundNumber,
}: ArenaTurnCarouselProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;

  // Sorted by initiative score descending
  const sorted = [...participants].sort((a, b) => b.initiative_score - a.initiative_score);

  return (
    <div className="w-full arcane-glass rounded-2xl p-3 border border-amber-900/40 bg-[#0a0c13]/90 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <h3 className="font-cinzel text-xs font-bold text-amber-200 uppercase tracking-widest">
            {t.arena.initiativeOrder}
          </h3>
        </div>

        <div className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-cinzel text-[11px] font-bold">
          {t.arena.round} {roundNumber}
        </div>
      </div>

      {/* Carousel Track */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
        {sorted.map((p, idx) => {
          const isActive = p.id === activeCombatantId;
          const isDead = !p.is_alive;
          const isTeamA = p.team === 'team_a';

          return (
            <motion.div
              key={p.id}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className={`relative flex items-center gap-2 p-2 rounded-xl border transition-all shrink-0 min-w-[150px] ${
                isDead
                  ? 'opacity-40 grayscale border-stone-800 bg-stone-900/30'
                  : isActive
                  ? 'border-[#ffd700] bg-gradient-to-r from-amber-950/40 via-[#ffd700]/10 to-amber-950/40 shadow-[0_0_20px_rgba(255,215,0,0.35)] ring-1 ring-[#ffd700]'
                  : isTeamA
                  ? 'border-blue-500/30 bg-blue-950/20 hover:border-blue-400/50'
                  : 'border-red-500/30 bg-red-950/20 hover:border-red-400/50'
              }`}
            >
              {/* Order number badge */}
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center font-cinzel text-[10px] font-black shrink-0 ${
                  isActive
                    ? 'bg-[#ffd700] text-black shadow-md'
                    : 'bg-black/60 text-stone-400 border border-white/5'
                }`}
              >
                #{idx + 1}
              </div>

              {/* Avatar thumbnail */}
              <div
                className={`w-8 h-8 rounded-lg overflow-hidden border shrink-0 ${
                  isActive
                    ? 'border-[#ffd700] shadow-[0_0_8px_#ffd700]'
                    : isTeamA
                    ? 'border-blue-400/50'
                    : 'border-red-400/50'
                }`}
              >
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-4 h-4 text-stone-400 m-auto mt-2" />
                )}
              </div>

              {/* Info */}
              <div className="truncate flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-cinzel text-xs font-bold text-stone-200 truncate">
                    {p.name}
                  </span>
                  {isDead && <Skull className="w-3 h-3 text-red-500 shrink-0" />}
                </div>

                <div className="flex items-center justify-between text-[9px] font-cinzel text-stone-400">
                  <span className={isTeamA ? 'text-blue-400' : 'text-red-400'}>
                    INI: {p.initiative_score}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {p.current_hp}/{p.max_hp}
                  </span>
                </div>
              </div>

              {/* Active Pulse Tag */}
              {isActive && (
                <span className="absolute -top-2 right-2 text-[8px] font-cinzel font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-red-600 text-white shadow-md flex items-center gap-0.5 animate-pulse">
                  <Flame className="w-2 h-2 text-yellow-300" />
                  {t.arena.activeTurn}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
