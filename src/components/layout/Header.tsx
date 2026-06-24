import { motion } from 'framer-motion';
import { LogOut, Globe, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';

export function Header() {
  const { locale, setLocale, signOut, profile, isGM } = useAuth();
  const { characters, activeCharacterId, setActiveCharacterId } = useCampaign();

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'tr' : 'en');
  };



  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
      className="h-[60px] z-30 glass border-b border-glass-border flex items-center justify-end px-6 shrink-0"
    >
      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* GM Character Selector */}
        {isGM && characters && characters.length > 0 && (
          <div className="flex items-center gap-2 mr-2">
            <Users size={14} className="text-gold/70" />
            <select
              value={activeCharacterId || ''}
              onChange={(e) => setActiveCharacterId(e.target.value)}
              className="bg-obsidian border border-glass-border text-parchment text-xs rounded px-2 py-1 outline-none focus:border-gold/50"
            >
              {characters.map(char => (
                <option key={char.id} value={char.id}>
                  {char.name} (Lvl {char.level})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Welcome text */}
        <span className="text-xs text-parchment/60 font-inter hidden sm:inline">
          Welcome, <span className="text-gold/80">{profile?.username}</span>
        </span>

        <div className="h-5 w-px bg-glass-border" />

        {/* Language toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-glass-border bg-white/5 hover:bg-white/10 transition-all duration-200 text-sm font-inter"
          title="Toggle language"
        >
          <Globe size={14} className="text-gold/70" />
          <span className="text-parchment font-semibold text-xs tracking-wider">
            {locale === 'en' ? 'EN' : 'TR'}
          </span>
        </motion.button>

        {/* Logout button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={signOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-crimson/30 bg-crimson/10 hover:bg-crimson/20 transition-all duration-200 text-crimson text-sm"
          title="Sign out"
        >
          <LogOut size={14} />
          <span className="text-xs font-inter font-medium hidden sm:inline">
            Logout
          </span>
        </motion.button>
      </div>
    </motion.header>
  );
}
