import { motion } from 'framer-motion';
import { CharacterCreation } from '../components/character/CharacterCreation';
import { useCampaign } from '../contexts/CampaignContext';
import { Users } from 'lucide-react';

export function CharacterPage() {
  const { activeCharacterId, characters } = useCampaign();
  const activeCharacter = characters?.find(c => c.id === activeCharacterId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      {activeCharacter && (
        <div className="mb-6 text-xs font-inter bg-black/40 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 border border-glass-border">
          <Users size={12} className="text-gold/70" />
          <span className="text-parchment/70">Viewing Character:</span>
          <span className="text-gold font-semibold">{activeCharacter.name}</span>
        </div>
      )}
      <CharacterCreation />
    </motion.div>
  );
}
