import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterCreation } from '../components/character/CharacterCreation';
import { CharacterSheet } from '../components/character/CharacterSheet';
import { useCampaign } from '../contexts/CampaignContext';
import { useAuth } from '../contexts/AuthContext';
import { Shield, UserPlus, Cpu } from 'lucide-react';

export function CharacterPage() {
  const { activeCharacterId, characters } = useCampaign();
  const { locale } = useAuth();
  const isTr = locale === 'tr';

  const activeCharacter = characters?.find((c) => c.id === activeCharacterId);
  const [activeTab, setActiveTab] = useState<'sheet' | 'create'>('sheet');

  // If there is no active character, default to creation wizard
  const showSheet = activeCharacter && activeTab === 'sheet';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Tab Switcher if an active character exists */}
      {activeCharacter && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-glass-border">
          <div className="flex items-center gap-2 p-1 rounded bg-black/60 border border-gold/30">
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-orbitron font-bold transition-all cursor-pointer ${
                activeTab === 'sheet'
                  ? 'bg-gold/20 text-gold border border-gold/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'text-parchment-dim hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Shield size={14} />
              <span>{isTr ? 'BİYOMETRİK DOSYA' : 'HERO BIOMETRICS'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-orbitron font-bold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-gold/20 text-gold border border-gold/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'text-parchment-dim hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <UserPlus size={14} />
              <span>{isTr ? 'YENİ OPERATÖR ENROLL' : 'CREATE OPERATOR'}</span>
            </button>
          </div>

          <div className="text-xs font-mono bg-black/60 px-3.5 py-1.5 rounded inline-flex items-center gap-2 border border-gold/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
            <Cpu size={13} className="text-gold" />
            <span className="text-parchment-dim">{isTr ? 'AKTİF AJAN:' : 'ACTIVE HERO:'}</span>
            <span className="text-gold font-bold">{activeCharacter.name}</span>
            <span className="text-emerald font-semibold">(LVL {activeCharacter.level})</span>
          </div>
        </div>
      )}

      {/* Main View Area */}
      <AnimatePresence mode="wait">
        {showSheet ? (
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CharacterSheet
              character={activeCharacter}
              onOpenCreation={() => setActiveTab('create')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <CharacterCreation />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
