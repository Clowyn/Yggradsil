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
    <div className="relative min-h-[85dvh] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 1. Continuous Ambient Coliseum Embers & Brazier Glow Behind Teams */}
      <FireParticleOverlay mode="ambient" />

      {/* 2. Roaring Volumetric Inferno Overlay on Match Start */}
      {!fireEnded && (
        <FireParticleOverlay
          mode="inferno"
          durationSeconds={2.8}
          onComplete={() => setFireEnded(true)}
        />
      )}

      {/* 3. Face-Off Avatar Stage */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="w-full max-w-5xl space-y-6 sm:space-y-8 z-10 text-center relative"
      >
        <div className="space-y-2">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="inline-flex items-center justify-center gap-2 px-4 py-1 rounded-full bg-orange-950/50 border border-orange-500/40 text-amber-300 font-cinzel font-black tracking-[0.25em] text-xs uppercase shadow-[0_0_25px_rgba(249,115,22,0.3)]"
          >
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>CLASH OF TITANS</span>
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          </motion.div>

          <h2 className="font-cinzel text-2xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-amber-200 to-red-400 tracking-wider drop-shadow-[0_4px_20px_rgba(245,158,11,0.35)]">
            {t.arena.teamBlue} <span className="text-yellow-400 text-xl sm:text-4xl">VS</span> {t.arena.teamRed}
          </h2>
        </div>

        {/* 4v4 Face-off Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Team Blue Roster */}
          <motion.div
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-blue-950/30 border-2 border-blue-500/45 shadow-[0_0_35px_rgba(59,130,246,0.25)] backdrop-blur-sm"
          >
            {teamA.map((p) => (
              <div
                key={p.id}
                className="relative rounded-2xl overflow-hidden border border-blue-400/50 bg-black/70 p-2.5 flex flex-col items-center shadow-lg group hover:scale-105 transition-all"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-blue-400/60 shadow-md mb-2">
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
            transition={{ delay: 1.2, duration: 0.6 }}
            className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-red-950/30 border-2 border-red-500/45 shadow-[0_0_35px_rgba(239,68,68,0.25)] backdrop-blur-sm"
          >
            {teamB.map((p) => (
              <div
                key={p.id}
                className="relative rounded-2xl overflow-hidden border border-red-400/50 bg-black/70 p-2.5 flex flex-col items-center shadow-lg group hover:scale-105 transition-all"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-red-400/60 shadow-md mb-2">
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
          transition={{ delay: 1.6 }}
          className="pt-2 sm:pt-4"
        >
          <button
            type="button"
            data-testid="enter-arena-btn"
            onClick={onIntroComplete}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-cinzel font-black text-sm tracking-widest uppercase shadow-[0_0_35px_rgba(245,158,11,0.5)] border border-amber-300 transition-all cursor-pointer transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <Swords className="w-5 h-5" />
            <span>{locale === 'tr' ? 'MÜCADELEYE GİR' : 'ENTER COMBAT'}</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
