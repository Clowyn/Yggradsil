import { motion } from 'framer-motion';
import { Shield, Heart, Zap, Crosshair, Skull, Flame } from 'lucide-react';
import type { CombatArenaParticipant } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

interface ArenaFieldProps {
  participants: CombatArenaParticipant[];
  activeCombatantId: string | null;
  selectedTargetId: string | null;
  onSelectTarget: (id: string) => void;
}

export function ArenaField({
  participants,
  activeCombatantId,
  selectedTargetId,
  onSelectTarget,
}: ArenaFieldProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;

  const teamA = participants.filter((p) => p.team === 'team_a').sort((a, b) => a.slot_index - b.slot_index);
  const teamB = participants.filter((p) => p.team === 'team_b').sort((a, b) => a.slot_index - b.slot_index);

  const renderFighterCard = (p: CombatArenaParticipant, isTeamA: boolean) => {
    const isActive = p.id === activeCombatantId;
    const isTarget = p.id === selectedTargetId;
    const isDead = !p.is_alive || p.current_hp <= 0;

    const hpPercent = Math.max(0, Math.min(100, Math.round((p.current_hp / (p.max_hp || 1)) * 100)));
    const mpPercent = Math.max(0, Math.min(100, Math.round((p.current_mana / (p.max_mana || 1)) * 100)));

    const hpColor =
      isDead
        ? 'bg-stone-600'
        : hpPercent > 50
        ? 'bg-emerald-500'
        : hpPercent > 20
        ? 'bg-amber-500'
        : 'bg-red-500';

    return (
      <motion.div
        key={p.id}
        data-testid={`arena-fighter-${p.team}-${p.slot_index}`}
        onClick={() => !isDead && onSelectTarget(p.id)}
        whileHover={!isDead ? { scale: 1.02 } : {}}
        className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
          isDead
            ? 'opacity-40 grayscale border-stone-800 bg-black/40 cursor-not-allowed'
            : isTarget
            ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_25px_rgba(251,191,36,0.35)] ring-2 ring-amber-400'
            : isActive
            ? 'border-red-500 bg-red-950/20 shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-1 ring-red-500'
            : isTeamA
            ? 'border-blue-500/30 bg-blue-950/15 hover:border-blue-400/50'
            : 'border-red-500/30 bg-red-950/15 hover:border-red-400/50'
        }`}
      >
        {/* Active Combatant or Target Reticle Tag */}
        {isActive && !isDead && (
          <span className="absolute -top-2.5 left-3 text-[9px] font-cinzel font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white shadow-lg flex items-center gap-1 animate-pulse">
            <Flame className="w-2.5 h-2.5 text-yellow-300" />
            {t.arena.activeTurn}
          </span>
        )}

        {isTarget && !isDead && (
          <span className="absolute -top-2.5 right-3 text-[9px] font-cinzel font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-lg flex items-center gap-1">
            <Crosshair className="w-2.5 h-2.5" />
            {t.arena.targetLabel.toUpperCase()}
          </span>
        )}

        <div className="flex items-center gap-3">
          {/* Avatar with status border */}
          <div
            className={`w-14 h-14 rounded-2xl overflow-hidden border-2 shrink-0 relative shadow-md ${
              isDead
                ? 'border-stone-700'
                : isTeamA
                ? 'border-blue-400/80 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                : 'border-red-400/80 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
            }`}
          >
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <Shield className="w-8 h-8 text-stone-500 m-auto mt-3" />
            )}
            {isDead && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Skull className="w-7 h-7 text-red-500" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <h4 className="font-cinzel text-xs sm:text-sm font-bold text-stone-200 truncate">
                {p.name}
              </h4>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[10px] font-cinzel text-amber-300 shrink-0">
                <Shield className="w-3 h-3 text-amber-400" />
                <span>AC {p.ac}</span>
              </div>
            </div>

            {/* Health Bar */}
            <div>
              <div className="flex justify-between text-[10px] font-cinzel text-stone-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Heart className="w-2.5 h-2.5 text-red-400" /> {t.arena.hp}
                </span>
                <span className="font-bold tabular-nums">
                  {p.current_hp} / {p.max_hp}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 border border-white/5 overflow-hidden">
                <motion.div
                  className={`h-full transition-all duration-300 ${hpColor}`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* Mana Bar */}
            <div>
              <div className="flex justify-between text-[10px] font-cinzel text-stone-400 mb-0.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-blue-400" /> {t.arena.mp}
                </span>
                <span className="font-bold tabular-nums">
                  {p.current_mana} / {p.max_mana}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/60 border border-white/5 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${mpPercent}%` }}
                />
              </div>
            </div>

            {/* Status Effects badges */}
            {p.status_effects && p.status_effects.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {p.status_effects.map((st, sIdx) => {
                  const icon =
                    st.type === 'poison' ? '🤢' : st.type === 'burn' ? '🔥' : st.type === 'shield' ? '🛡️' : '⚡';
                  const label =
                    st.type === 'poison'
                      ? (locale === 'tr' ? `Zehir (-${st.value}/tur, ${st.remaining_turns} tur)` : `Poison (-${st.value}/rnd, ${st.remaining_turns} rnd)`)
                      : (locale === 'tr' ? `${st.type} (${st.remaining_turns} tur)` : `${st.type} (${st.remaining_turns} rnd)`);

                  return (
                    <span
                      key={`${p.id}-status-${sIdx}`}
                      className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[9px] font-cinzel font-bold text-emerald-300 flex items-center gap-1"
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Team Blue (Party 1) */}
      <div className="glass rounded-3xl p-4 sm:p-5 border border-blue-500/30 bg-blue-950/10 space-y-3.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
            <h3 className="font-cinzel text-sm sm:text-base font-extrabold text-blue-300 tracking-wider">
              {t.arena.teamBlue}
            </h3>
          </div>
          <span className="text-[10px] font-cinzel text-blue-200/60 uppercase">
            {teamA.filter((p) => p.is_alive && p.current_hp > 0).length} {t.arena.aliveLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teamA.map((p) => renderFighterCard(p, true))}
        </div>
      </div>

      {/* Team Red (Party 2) */}
      <div className="glass rounded-3xl p-4 sm:p-5 border border-red-500/30 bg-red-950/10 space-y-3.5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-red-500/20 pb-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_10px_#f87171]" />
            <h3 className="font-cinzel text-sm sm:text-base font-extrabold text-red-300 tracking-wider">
              {t.arena.teamRed}
            </h3>
          </div>
          <span className="text-[10px] font-cinzel text-red-200/60 uppercase">
            {teamB.filter((p) => p.is_alive && p.current_hp > 0).length} {t.arena.aliveLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teamB.map((p) => renderFighterCard(p, false))}
        </div>
      </div>
    </div>
  );
}
