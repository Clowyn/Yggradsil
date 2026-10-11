import { useState } from 'react';
import { Menu, LogOut, Globe, Users, Cpu, Activity, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { playSound, isAudioMuted, setAudioMuted } from '../../lib/audio';

export interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { locale, setLocale, signOut, profile, isGM } = useAuth();
  const { characters, activeCharacterId, setActiveCharacterId } = useCampaign();
  const [muted, setMuted] = useState(isAudioMuted);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) {
      playSound('blip');
    }
  };

  const toggleLocale = () => {
    playSound('click');
    setLocale(locale === 'en' ? 'tr' : 'en');
  };

  return (
    <header className="h-[64px] z-30 glass border-b border-glass-border flex items-center justify-between px-3 sm:px-6 shrink-0 relative overflow-hidden">
      {/* Top micro-line gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Left side: Mobile hamburger menu toggle & Brand telemetry */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            playSound('click');
            onToggleSidebar?.();
          }}
          className="block md:hidden p-2 rounded border border-gold/40 bg-obsidian/90 hover:bg-gold/15 text-gold hover:border-gold shadow-[0_0_12px_rgba(0,240,255,0.2)] active:scale-95 transition-all duration-200 focus:outline-none shrink-0 cursor-pointer"
          title="Open navigation menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-orbitron text-xs sm:text-sm text-gold tracking-widest font-bold select-none drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            YGGDRASIL
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-gold/10 border border-gold/30 text-[10px] font-mono text-gold-bright uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            NEXUS OS
          </span>
        </div>
      </div>

      {/* Center Telemetry & Equalizer Stream (Desktop) */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-black/40 border border-gold/15 shadow-inner">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-parchment-dim">
          <Activity size={12} className="text-gold animate-pulse" />
          <span className="text-gold/80">CORE: STABLE</span>
          <span className="text-white/20">|</span>
          <span className="text-emerald">PING: 14MS</span>
          <span className="text-white/20">|</span>
          <span className="text-gold/80">LINK: 99.8%</span>
        </div>

        {/* Dynamic Telemetry Equalizer Bars */}
        <div className="flex items-end gap-0.5 h-3">
          <div className="w-0.5 bg-gold/80 rounded-full eq-bar-1" />
          <div className="w-0.5 bg-arcane rounded-full eq-bar-2" />
          <div className="w-0.5 bg-emerald rounded-full eq-bar-3" />
          <div className="w-0.5 bg-gold/80 rounded-full eq-bar-4" />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* GM Character Selector */}
        {isGM && characters && characters.length > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 mr-1">
            <Users size={13} className="text-gold/70 shrink-0" />
            <select
              value={activeCharacterId || ''}
              onChange={(e) => {
                playSound('blip');
                setActiveCharacterId(e.target.value);
              }}
              className="bg-obsidian/90 border border-gold/30 text-parchment text-xs rounded px-2.5 py-1 outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 max-w-[130px] sm:max-w-xs font-mono truncate cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.08)]"
            >
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} (LVL {char.level})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Audio FX Mute/Unmute Toggle */}
        <button
          onClick={toggleSound}
          className={`p-1.5 rounded border transition-all duration-200 cursor-pointer shadow-sm ${
            muted
              ? 'border-white/10 bg-black/40 text-parchment-dim hover:text-parchment'
              : 'border-gold/40 bg-gold/10 text-gold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
          }`}
          title={muted ? 'Enable Sci-Fi Audio FX' : 'Mute Audio FX'}
          aria-label={muted ? 'Enable sound' : 'Mute sound'}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>

        {/* Operator info badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/40 border border-glass-border">
          <Cpu size={12} className="text-gold/60" />
          <span className="text-[11px] font-mono text-parchment-dim tracking-wide">
            OPERATOR: <span className="text-gold font-semibold">{profile?.username || 'AGENT'}</span>
          </span>
        </div>

        <div className="h-4 w-px bg-glass-border hidden sm:block" />

        {/* Language toggle */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-gold/30 bg-gold/5 hover:bg-gold/15 active:scale-95 transition-all duration-200 font-mono text-xs text-parchment shrink-0 cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.06)]"
          title="Toggle language"
        >
          <Globe size={13} className="text-gold" />
          <span className="text-gold font-bold tracking-wider">
            {locale === 'en' ? 'EN' : 'TR'}
          </span>
        </button>

        {/* Logout button */}
        <button
          onClick={() => {
            playSound('alert');
            signOut();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded border border-crimson/40 bg-crimson/10 hover:bg-crimson/25 active:scale-95 transition-all duration-200 text-crimson text-xs font-mono tracking-wider shrink-0 cursor-pointer shadow-[0_0_12px_rgba(255,0,85,0.15)] hover:shadow-[0_0_16px_rgba(255,0,85,0.35)]"
          title="Disconnect from session"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline font-semibold">
            DISCONNECT
          </span>
        </button>
      </div>
    </header>
  );
}
