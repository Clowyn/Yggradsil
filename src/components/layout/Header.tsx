import { useState, useEffect } from 'react';
import { Menu, LogOut, Globe, Users, Flame, VolumeX, Shield, Dices, MessageSquare, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';
import {
  playSound,
  isAudioMuted,
  setAudioMuted,
  getAmbientEngineState,
  subscribeToAmbientEngine,
  startAmbientSoundscape,
  stopAmbientSoundscape,
} from '../../lib/audio';
import { toggleDiceTray } from '../../lib/diceRoller';
import { toggleTableChat, subscribeToTableChannel } from '../../lib/tableChannel';
import { supabase } from '../../lib/supabase';
import type { CampaignEnvironment } from '../../lib/types';

const PRESET_DISPLAY_LABELS: Record<string, { en: string; tr: string }> = {
  abyss_winds: { en: 'ABYSS WINDS', tr: 'HİÇLİK RÜZGARLARI' },
  mystic_forest: { en: 'MYSTIC FOREST', tr: 'MİSTİK ORMAN' },
  tavern_bustle: { en: 'TAVERN HEARTH', tr: 'TAVERNA OCAĞI' },
  combat_tension: { en: 'COMBAT DRUMS', tr: 'SAVAŞ DAVULLARI' },
  crypt_silence: { en: 'CRYPT SILENCE', tr: 'MAHZEN SESSİZLİĞİ' },
  storm_ruins: { en: 'STORM THUNDER', tr: 'FIRTINA GÜRÜLTÜSÜ' },
  arcane_sanctum: { en: 'ARCANE SANCTUM', tr: 'ARKANİK TAPINAK' },
  dragon_lair: { en: 'DRAGON LAIR', tr: 'EJDERHA İNİ' },
  tavern_hearth: { en: 'TAVERN HEARTH', tr: 'TAVERNA OCAĞI' },
  dungeon_drip: { en: 'DUNGEON DRIP', tr: 'ZİNDAN DAMLASI' },
  forest_wind: { en: 'FOREST WIND', tr: 'ORMAN RÜZGARI' },
  combat_drums: { en: 'COMBAT DRUMS', tr: 'SAVAŞ DAVULLARI' },
  arcane_hum: { en: 'ARCANE HUM', tr: 'KADİM UĞULTU' },
  storm_thunder: { en: 'STORM THUNDER', tr: 'FIRTINA GÜRÜLTÜSÜ' },
};

export interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { locale, setLocale, signOut, profile, isGM } = useAuth();
  const { campaign, characters, activeCharacterId, setActiveCharacterId } = useCampaign();
  const [muted, setMuted] = useState(isAudioMuted);
  const [unreadChat, setUnreadChat] = useState(0);
  const [ambientState, setAmbientState] = useState(getAmbientEngineState);
  const [activePreset, setActivePreset] = useState<string>('tavern_hearth');

  useEffect(() => {
    return subscribeToTableChannel((s) => setUnreadChat(s.unreadCount));
  }, []);

  useEffect(() => {
    return subscribeToAmbientEngine((st) => {
      setAmbientState(st);
      if (st.activePreset) {
        setActivePreset(st.activePreset);
      }
    });
  }, []);

  // Sync campaign_environments across all pages & player clients
  useEffect(() => {
    const campaignId = campaign?.id || 'local';

    const applyEnv = (env: Partial<CampaignEnvironment> | null | undefined) => {
      if (!env?.ambient_preset) return;
      setActivePreset(env.ambient_preset);
      const currentEngine = getAmbientEngineState();
      if (currentEngine.isPlaying && currentEngine.activePreset !== env.ambient_preset) {
        startAmbientSoundscape(env.ambient_preset, currentEngine.volume);
      }
    };

    try {
      const raw = localStorage.getItem(`dnd_campaign_env_${campaignId}`);
      if (raw) {
        applyEnv(JSON.parse(raw) as CampaignEnvironment);
      }
    } catch {
      // ignore
    }

    const handleLocalEnvUpdate = (e: Event) => {
      const custom = e as CustomEvent<CampaignEnvironment>;
      if (custom.detail) {
        applyEnv(custom.detail);
      }
    };
    window.addEventListener('dnd-environment-updated', handleLocalEnvUpdate);

    if (!campaign?.id || campaign.id === 'local' || campaign.id.startsWith('demo-')) {
      return () => window.removeEventListener('dnd-environment-updated', handleLocalEnvUpdate);
    }

    let active = true;
    supabase
      .from('campaign_environments')
      .select('*')
      .eq('campaign_id', campaign.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) {
          applyEnv(data as CampaignEnvironment);
        }
      });

    const channel = supabase
      .channel(`header-env-sync-${campaign.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_environments',
          filter: `campaign_id=eq.${campaign.id}`,
        },
        (payload) => {
          if (payload.new) {
            applyEnv(payload.new as CampaignEnvironment);
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener('dnd-environment-updated', handleLocalEnvUpdate);
      supabase.removeChannel(channel);
    };
  }, [campaign?.id]);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) {
      playSound('lock_click');
    }
  };

  const toggleHeaderSoundscape = () => {
    if (ambientState.isPlaying) {
      stopAmbientSoundscape();
    } else {
      startAmbientSoundscape(activePreset);
    }
  };

  const toggleLocale = () => {
    playSound('paper_flip');
    setLocale(locale === 'en' ? 'tr' : 'en');
  };

  const presetLabel =
    PRESET_DISPLAY_LABELS[activePreset]?.[locale === 'tr' ? 'tr' : 'en'] || 'HEARTH WARMTH';

  return (
    <header className="h-[58px] z-30 glass border-b border-amber-900/30 flex items-center justify-between px-3 sm:px-6 shrink-0 relative overflow-hidden bg-[#08090c]/85 backdrop-blur-xl">
      {/* 1px Hairline light reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />

      {/* Left side: Mobile hamburger toggle & Brand crest */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            playSound('lock_click');
            onToggleSidebar?.();
          }}
          className="block md:hidden p-2 rounded-xl border border-amber-900/40 bg-[#0e1017]/90 hover:bg-amber-500/10 text-amber-400 hover:border-amber-500/50 shadow-md active:scale-95 transition-all cursor-pointer"
          title="Open navigation menu"
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <span className="font-cinzel text-xs sm:text-sm text-amber-200 tracking-widest font-extrabold select-none drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]">
            YGGDRASIL
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-900/40 text-[10px] font-cinzel text-amber-300 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {campaign?.name ? campaign.name : 'ARCANE REALM'}
          </span>
        </div>
      </div>

      {/* Center Ambient Chronicle & Live Procedural Soundscape Pill (Desktop) */}
      <button
        type="button"
        data-testid="header-ambient-pill"
        onClick={toggleHeaderSoundscape}
        title={
          ambientState.isPlaying
            ? locale === 'tr'
              ? 'Ortam sesini durdur'
              : 'Stop ambient soundscape'
            : locale === 'tr'
              ? 'Ortam sesini başlat'
              : 'Start ambient soundscape'
        }
        className={`hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full border shadow-inner transition-all cursor-pointer ${
          ambientState.isPlaying
            ? 'bg-amber-500/15 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'bg-black/40 border-amber-900/25 hover:border-amber-700/40'
        }`}
      >
        <div className="flex items-center gap-2 text-[11px] font-cinzel text-amber-200/80">
          {ambientState.isPlaying ? (
            <Radio size={13} className="text-emerald-400 animate-pulse shrink-0" />
          ) : (
            <Flame size={13} className="text-amber-400 animate-candle-flicker shrink-0" />
          )}
          <span>{presetLabel}</span>
          <span className="text-amber-900">•</span>
          <span className={ambientState.isPlaying ? 'text-emerald-300 font-bold' : 'text-amber-100/90 font-medium'}>
            {ambientState.isPlaying
              ? locale === 'tr'
                ? 'SES AKTİF'
                : 'SYNTH LIVE'
              : locale === 'tr'
                ? 'OTURUM AKTİF'
                : 'SESSION ACTIVE'}
          </span>
        </div>
      </button>

      {/* Right side controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* GM Character Selector */}
        {isGM && characters && characters.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 mr-1">
            <Users size={13} className="text-amber-400/80 shrink-0" />
            <select
              value={activeCharacterId || ''}
              onChange={(e) => {
                playSound('lock_click');
                setActiveCharacterId(e.target.value);
              }}
              className="bg-[#0e1017]/90 border border-amber-900/40 text-amber-100 text-xs rounded-lg px-2.5 py-1 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 max-w-[130px] sm:max-w-xs font-inter truncate cursor-pointer shadow-sm"
            >
              {characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} (Lv. {char.level}) #{char.id.slice(0, 4)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Table Chat & Dice Stream Drawer Button */}
        <button
          type="button"
          data-testid="header-table-chat-btn"
          onClick={() => {
            playSound('lock_click');
            toggleTableChat();
          }}
          className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-900/50 bg-black/50 hover:bg-amber-500/15 text-amber-200 text-xs font-cinzel font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          title={locale === 'tr' ? 'Masa Sohbeti & Zar Günlüğü' : 'Table Chat & Dice Log'}
          aria-label="Open Table Chat"
        >
          <MessageSquare size={14} className="text-amber-400" />
          <span className="hidden sm:inline">{locale === 'tr' ? 'SOHBET' : 'CHAT'}</span>
          {unreadChat > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-black flex items-center justify-center">
              {unreadChat > 9 ? '9+' : unreadChat}
            </span>
          )}
        </button>

        {/* Universal Dice Tray Button */}
        <button
          type="button"
          data-testid="header-dice-tray-btn"
          onClick={() => {
            playSound('lock_click');
            toggleDiceTray();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs font-cinzel font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          title={locale === 'tr' ? 'Kadim Zar Tepsisi' : 'Universal Dice Tray'}
          aria-label="Open Dice Tray"
        >
          <Dices size={14} className="text-amber-400" />
          <span className="hidden sm:inline">{locale === 'tr' ? 'ZAR AT' : 'DICE'}</span>
        </button>

        {/* Audio FX Mute/Unmute Toggle */}
        <button
          onClick={toggleSound}
          className={`p-1.5 rounded-lg border transition-all duration-200 cursor-pointer shadow-sm ${
            muted
              ? 'border-white/10 bg-black/40 text-stone-400 hover:text-stone-200'
              : 'border-amber-900/50 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
          }`}
          title={muted ? 'Ignite audio ambiance' : 'Mute audio ambiance'}
          aria-label={muted ? 'Enable sound' : 'Mute sound'}
        >
          {muted ? <VolumeX size={15} /> : <Flame size={15} className="animate-candle-flicker" />}
        </button>

        {/* Adventurer / Lorekeeper badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-amber-900/30">
          <Shield size={12} className="text-amber-400/70" />
          <span className="text-[11px] font-cinzel text-amber-100/80 tracking-wide">
            {isGM ? 'LOREMASTER:' : 'ADVENTURER:'}{' '}
            <span className="text-amber-300 font-bold">{profile?.username || 'WANDERER'}</span>
          </span>
        </div>

        <div className="h-4 w-px bg-amber-900/30 hidden sm:block" />

        {/* Language toggle */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-900/40 bg-amber-500/5 hover:bg-amber-500/15 active:scale-95 transition-all text-xs font-cinzel text-amber-200 shrink-0 cursor-pointer shadow-sm"
          title="Toggle language"
        >
          <Globe size={13} className="text-amber-400" />
          <span className="font-bold tracking-wider">{locale === 'en' ? 'EN' : 'TR'}</span>
        </button>

        {/* Sign out button */}
        <button
          onClick={() => {
            playSound('stone_tap');
            signOut();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-rose-900/50 bg-rose-950/30 hover:bg-rose-900/40 active:scale-95 transition-all text-rose-300 text-xs font-cinzel tracking-wider shrink-0 cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(225,29,72,0.2)]"
          title="Depart from session"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline font-bold">DEPART</span>
        </button>
      </div>
    </header>
  );
}
