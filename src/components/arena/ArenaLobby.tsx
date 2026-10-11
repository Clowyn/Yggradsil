import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Shield, Heart, Zap, UserPlus, Flame } from 'lucide-react';
import type { CombatArenaParticipant, Character } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';
import { ARCHETYPE_ROSTER } from './arenaData';

interface ArenaLobbyProps {
  participants: CombatArenaParticipant[];
  campaignCharacters: Character[];
  onUpdateParticipant: (index: number, team: 'team_a' | 'team_b', fighter: Partial<CombatArenaParticipant>) => void;
  onLaunchCombat: () => void;
  isGM: boolean;
}

export function ArenaLobby({
  participants,
  campaignCharacters,
  onUpdateParticipant,
  onLaunchCombat,
  isGM,
}: ArenaLobbyProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;

  const [activeSlotModal, setActiveSlotModal] = useState<{
    slotIndex: number;
    team: 'team_a' | 'team_b';
  } | null>(null);

  const teamAPlayers = participants.filter((p) => p.team === 'team_a').sort((a, b) => a.slot_index - b.slot_index);
  const teamBPlayers = participants.filter((p) => p.team === 'team_b').sort((a, b) => a.slot_index - b.slot_index);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 border border-amber-500/30 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-950/20 via-black to-red-950/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#ffd700] shadow-lg">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-cinzel font-black text-gold-gradient tracking-wide">
              {t.arena.lobbyTitle}
            </h2>
            <p className="text-xs text-stone-400 font-cinzel">
              {t.arena.subtitle}
            </p>
          </div>
        </div>

        {isGM && (
          <button
            type="button"
            data-testid="launch-combat-btn"
            onClick={onLaunchCombat}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:from-red-500 hover:to-amber-500 text-white font-cinzel font-black text-sm tracking-wider shadow-lg shadow-red-950/60 border border-amber-400/50 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
          >
            <Flame className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>{t.arena.launchCombat}</span>
          </button>
        )}
      </motion.div>

      {/* 4v4 Grid: Team Blue vs Team Red */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Blue (Party 1) */}
        <div className="glass rounded-2xl p-5 border border-blue-500/30 space-y-4 bg-blue-950/10 shadow-xl">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]" />
              <h3 className="font-cinzel text-base font-extrabold text-blue-300 tracking-wider">
                {t.arena.teamBlue}
              </h3>
            </div>
            <span className="text-[10px] font-cinzel text-blue-200/70 uppercase">
              4 {locale === 'tr' ? 'Savaşçı' : 'Combatants'}
            </span>
          </div>

          <div className="space-y-3">
            {[0, 1, 2, 3].map((slotIdx) => {
              const fighter = teamAPlayers.find((p) => p.slot_index === slotIdx);

              return (
                <div
                  key={`blue-slot-${slotIdx}`}
                  className="p-3 rounded-xl bg-black/50 border border-blue-500/20 hover:border-blue-400/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-900/40 border border-blue-500/40 overflow-hidden flex items-center justify-center shrink-0">
                      {fighter?.avatar_url ? (
                        <img
                          src={fighter.avatar_url}
                          alt={fighter.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Shield className="w-6 h-6 text-blue-400" />
                      )}
                    </div>

                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-stone-200">
                        {fighter?.name || `${t.arena.emptySlot} #${slotIdx + 1}`}
                      </h4>
                      {fighter && (
                        <div className="flex items-center gap-3 text-[10px] font-cinzel text-stone-400 mt-1">
                          <span className="text-red-400 flex items-center gap-0.5">
                            <Heart className="w-2.5 h-2.5" /> {fighter.current_hp}/{fighter.max_hp}
                          </span>
                          <span className="text-blue-400 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> {fighter.current_mana}/{fighter.max_mana}
                          </span>
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> AC {fighter.ac}
                          </span>
                          <span className="text-stone-300 font-bold">
                            INI: {fighter.initiative_score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isGM && (
                    <button
                      type="button"
                      onClick={() => setActiveSlotModal({ slotIndex: slotIdx, team: 'team_a' })}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-cinzel font-bold transition-all cursor-pointer shrink-0"
                    >
                      {t.arena.slotSelect}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Red (Party 2) */}
        <div className="glass rounded-2xl p-5 border border-red-500/30 space-y-4 bg-red-950/10 shadow-xl">
          <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400 shadow-[0_0_10px_#f87171]" />
              <h3 className="font-cinzel text-base font-extrabold text-red-300 tracking-wider">
                {t.arena.teamRed}
              </h3>
            </div>
            <span className="text-[10px] font-cinzel text-red-200/70 uppercase">
              4 {locale === 'tr' ? 'Savaşçı' : 'Combatants'}
            </span>
          </div>

          <div className="space-y-3">
            {[0, 1, 2, 3].map((slotIdx) => {
              const fighter = teamBPlayers.find((p) => p.slot_index === slotIdx);

              return (
                <div
                  key={`red-slot-${slotIdx}`}
                  className="p-3 rounded-xl bg-black/50 border border-red-500/20 hover:border-red-400/40 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-red-900/40 border border-red-500/40 overflow-hidden flex items-center justify-center shrink-0">
                      {fighter?.avatar_url ? (
                        <img
                          src={fighter.avatar_url}
                          alt={fighter.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Shield className="w-6 h-6 text-red-400" />
                      )}
                    </div>

                    <div>
                      <h4 className="font-cinzel text-sm font-bold text-stone-200">
                        {fighter?.name || `${t.arena.emptySlot} #${slotIdx + 1}`}
                      </h4>
                      {fighter && (
                        <div className="flex items-center gap-3 text-[10px] font-cinzel text-stone-400 mt-1">
                          <span className="text-red-400 flex items-center gap-0.5">
                            <Heart className="w-2.5 h-2.5" /> {fighter.current_hp}/{fighter.max_hp}
                          </span>
                          <span className="text-blue-400 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> {fighter.current_mana}/{fighter.max_mana}
                          </span>
                          <span className="text-amber-400 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> AC {fighter.ac}
                          </span>
                          <span className="text-stone-300 font-bold">
                            INI: {fighter.initiative_score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isGM && (
                    <button
                      type="button"
                      onClick={() => setActiveSlotModal({ slotIndex: slotIdx, team: 'team_b' })}
                      className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-cinzel font-bold transition-all cursor-pointer shrink-0"
                    >
                      {t.arena.slotSelect}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Select Fighter Modal */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl border border-white/10 w-full max-w-xl p-6 space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar bg-[#0d0f17]"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-cinzel font-bold text-gold-gradient">
                {t.arena.selectCharacter} (Slot #{activeSlotModal.slotIndex + 1})
              </h3>
              <button
                type="button"
                onClick={() => setActiveSlotModal(null)}
                className="p-1 rounded text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Presets & Campaign Characters */}
            <div className="space-y-4">
              {campaignCharacters.length > 0 && (
                <div>
                  <h4 className="text-xs font-cinzel font-bold text-amber-300 uppercase mb-2">
                    {locale === 'tr' ? 'Sefer Karakterleri' : 'Campaign Characters'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {campaignCharacters.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onUpdateParticipant(activeSlotModal.slotIndex, activeSlotModal.team, {
                            character_id: c.id,
                            name: c.name,
                            avatar_url: c.avatar_url,
                            current_hp: 35,
                            max_hp: 35,
                            current_mana: 30,
                            max_mana: 30,
                            ac: 14,
                            initiative_score: 10 + Math.floor(Math.random() * 10),
                            is_npc: false,
                          });
                          setActiveSlotModal(null);
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-2.5 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="font-cinzel text-xs font-bold text-stone-200 truncate">
                          {c.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-cinzel font-bold text-stone-400 uppercase mb-2">
                  {locale === 'tr' ? 'Savaş Arketip & Şampiyonları' : 'Battle Archetypes & Champions'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ARCHETYPE_ROSTER.map((arch) => (
                    <button
                      key={arch.name}
                      type="button"
                      onClick={() => {
                        onUpdateParticipant(activeSlotModal.slotIndex, activeSlotModal.team, {
                          character_id: null,
                          name: arch.name,
                          avatar_url: arch.avatar_url,
                          current_hp: arch.max_hp,
                          max_hp: arch.max_hp,
                          current_mana: arch.max_mana,
                          max_mana: arch.max_mana,
                          ac: arch.ac,
                          initiative_score: arch.initiative_score,
                          is_npc: true,
                        });
                        setActiveSlotModal(null);
                      }}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left flex items-center gap-3 transition-all cursor-pointer"
                    >
                      <img
                        src={arch.avatar_url}
                        alt={arch.name}
                        className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-cinzel text-xs font-bold text-stone-200 truncate">
                          {arch.name}
                        </div>
                        <div className="text-[10px] text-amber-400/90 font-cinzel">
                          {arch.role} • HP {arch.max_hp} • AC {arch.ac}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
