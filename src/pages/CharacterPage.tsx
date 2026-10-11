import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterCreation } from '../components/character/CharacterCreation';
import { CharacterSheet } from '../components/character/CharacterSheet';
import { useCampaign } from '../contexts/CampaignContext';
import { useAuth } from '../contexts/AuthContext';
import { Shield, UserPlus } from 'lucide-react';

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
      className={`p-3 sm:p-6 w-full mx-auto space-y-6 ${showSheet ? 'max-w-7xl' : 'max-w-[1700px]'}`}
    >
      {/* Tab Switcher if an active character exists */}
      {activeCharacter && (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-900/25">
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-black/50 border border-amber-900/30">
            <button
              type="button"
              onClick={() => setActiveTab('sheet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-cinzel font-bold transition-all cursor-pointer ${
                activeTab === 'sheet'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-amber-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Shield size={14} />
              <span>{isTr ? 'KARAKTER FÖYÜ' : 'HERO FOLIO'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-cinzel font-bold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-amber-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <UserPlus size={14} />
              <span>{isTr ? 'YENİ MACERACI' : 'CREATE ADVENTURER'}</span>
            </button>
          </div>

          <div className="text-xs font-cinzel bg-black/50 px-3.5 py-1.5 rounded-xl inline-flex items-center gap-2 border border-amber-900/30 shadow-md">
            <Shield size={13} className="text-amber-400" />
            <span className="text-amber-200/70">{isTr ? 'AKTİF KAHRAMAN:' : 'ACTIVE HERO:'}</span>
            <span className="text-amber-300 font-bold">{activeCharacter.name}</span>
            <span className="text-emerald-400 font-semibold">(LVL {activeCharacter.level})</span>
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
