import { Menu, LogOut, Globe, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';

export interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { locale, setLocale, signOut, profile, isGM } = useAuth();
  const { characters, activeCharacterId, setActiveCharacterId } = useCampaign();

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'tr' : 'en');
  };

  return (
    <header className="h-[60px] z-30 glass border-b border-glass-border flex items-center justify-between px-3 sm:px-6 shrink-0">
      {/* Left side: Mobile hamburger menu toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="block md:hidden p-2 rounded-lg border border-gold/40 bg-obsidian/90 hover:bg-gold/10 text-gold hover:border-gold shadow-[0_0_12px_rgba(255,215,0,0.15)] active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 shrink-0 cursor-pointer"
          title="Open navigation menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>

        <span className="font-cinzel text-sm text-gold tracking-wider md:hidden font-semibold truncate select-none">
          Yggdrasil
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* GM Character Selector */}
        {isGM && characters && characters.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 mr-1 sm:mr-2">
            <Users size={14} className="text-gold/70 shrink-0" />
            <select
              value={activeCharacterId || ''}
              onChange={(e) => setActiveCharacterId(e.target.value)}
              className="bg-obsidian border border-glass-border text-parchment text-xs rounded px-2 py-1 outline-none focus:border-gold/50 max-w-[120px] sm:max-w-xs truncate cursor-pointer"
            >
              {characters.map((char) => (
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

        <div className="h-5 w-px bg-glass-border hidden sm:block" />

        {/* Language toggle */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-glass-border bg-white/5 hover:bg-white/10 active:scale-95 transition-all duration-200 text-xs sm:text-sm font-inter shrink-0 cursor-pointer"
          title="Toggle language"
        >
          <Globe size={14} className="text-gold/70" />
          <span className="text-parchment font-semibold text-xs tracking-wider">
            {locale === 'en' ? 'EN' : 'TR'}
          </span>
        </button>

        {/* Logout button */}
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-crimson/30 bg-crimson/10 hover:bg-crimson/20 active:scale-95 transition-all duration-200 text-crimson text-xs sm:text-sm shrink-0 cursor-pointer"
          title="Sign out"
        >
          <LogOut size={14} />
          <span className="text-xs font-inter font-medium hidden sm:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}
