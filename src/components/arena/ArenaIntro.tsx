import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Flame } from 'lucide-react';
import { FireParticleOverlay } from './FireParticleOverlay';
import type { CombatArenaParticipant } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

interface ArenaIntroProps {
  participants: CombatArenaParticipant[];
  onIntroComplete: () => void;
}

export function ArenaIntro({ participants, onIntroComplete }: ArenaIntroProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;

  const [fireEnded, setFireEnded] = useState(false);

  const teamA = participants.filter((p) => p.team === 'team_a').sort((a, b) => a.slot_index - b.slot_index);
  const teamB = participants.filter((p) => p.team === 'team_b').sort((a, b) => a.slot_index - b.slot_index);

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 1. Roaring Fire Overlay on Top */}
      {!fireEnded && (
        <FireParticleOverlay
          durationSeconds={2.6}
          onComplete={() => setFireEnded(true)}
        />
      )}

      {/* 2. Face-Off Avatar Stage */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="w-full max-w-5xl space-y-8 z-10 text-center"
      >
        <div className="space-y-2">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 text-amber-400 font-cinzel font-black tracking-widest text-xs uppercase"
          >
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>CLASH OF TITANS</span>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          </motion.div>

          <h2 className="font-cinzel text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-amber-200 to-red-400 tracking-wider">
            {t.arena.teamBlue} <span className="text-yellow-400 text-2xl sm:text-4xl">VS</span> {t.arena.teamRed}
          </h2>
        </div>

        {/* 4v4 Face-off Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Team Blue Roster */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-blue-950/20 border-2 border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
          >
            {teamA.map((p) => (
              <div
                key={p.id}
                className="relative rounded-2xl overflow-hidden border border-blue-400/50 bg-black/60 p-2.5 flex flex-col items-center shadow-lg group hover:scale-105 transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-400/60 shadow-md mb-2">
                  <img
                    src={p.avatar_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-cinzel text-xs font-black text-blue-200 truncate w-full text-center">
                  {p.name}
                </h4>
                <span className="text-[10px] font-cinzel text-blue-300/80 font-bold">
                  INI: {p.initiative_score} • AC {p.ac}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Team Red Roster */}
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-red-950/20 border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          >
            {teamB.map((p) => (
              <div
                key={p.id}
                className="relative rounded-2xl overflow-hidden border border-red-400/50 bg-black/60 p-2.5 flex flex-col items-center shadow-lg group hover:scale-105 transition-all"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-red-400/60 shadow-md mb-2">
                  <img
                    src={p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="font-cinzel text-xs font-black text-red-200 truncate w-full text-center">
                  {p.name}
                </h4>
                <span className="text-[10px] font-cinzel text-red-300/80 font-bold">
                  INI: {p.initiative_score} • AC {p.ac}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Enter Arena Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 2.0 }}
          className="pt-4"
        >
          <button
            type="button"
            data-testid="enter-arena-btn"
            onClick={onIntroComplete}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-cinzel font-black text-sm tracking-widest uppercase shadow-2xl shadow-amber-900/50 border border-amber-300 transition-all cursor-pointer transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <Swords className="w-5 h-5" />
            <span>{locale === 'tr' ? 'MÜCADELEYE GİR' : 'ENTER COMBAT'}</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
