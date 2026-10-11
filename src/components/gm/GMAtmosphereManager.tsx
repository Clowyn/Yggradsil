import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudFog, CloudRain, CloudLightning, Flame, Sun, Moon,
  Sunrise, Sunset, Volume2, VolumeX,
  BookOpen, Plus, Trash2, Edit3, Eye, EyeOff, Sparkles, Check,
  Clock, Calendar, Compass, ShieldAlert
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCampaign } from '../../contexts/CampaignContext';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';
import { GMTableNotice } from './GMTableNotice';
import type {
  CampaignEnvironment,
  SessionChronicle,
  EnvironmentWeather,
  EnvironmentTimeOfDay,
  EnvironmentDangerLevel,
} from '../../lib/types';

const WEATHER_BASE: {
  key: EnvironmentWeather;
  icon: typeof CloudFog;
  color: string;
  bgGrad: string;
}[] = [
  { key: 'fog', icon: CloudFog, color: '#94a3b8', bgGrad: 'from-slate-900/40 to-slate-800/20' },
  { key: 'rain', icon: CloudRain, color: '#38bdf8', bgGrad: 'from-cyan-950/40 to-blue-900/20' },
  { key: 'storm', icon: CloudLightning, color: '#a855f7', bgGrad: 'from-purple-950/40 to-indigo-900/20' },
  { key: 'ash', icon: Flame, color: '#f97316', bgGrad: 'from-orange-950/40 to-red-950/20' },
  { key: 'sunny', icon: Sun, color: '#eab308', bgGrad: 'from-amber-950/30 to-yellow-900/10' },
  { key: 'clear', icon: Moon, color: '#818cf8', bgGrad: 'from-indigo-950/40 to-slate-900/20' },
];

const TIME_OF_DAY_BASE: {
  key: EnvironmentTimeOfDay;
  icon: typeof Sunrise;
  color: string;
}[] = [
  { key: 'dawn', icon: Sunrise, color: '#f59e0b' },
  { key: 'noon', icon: Sun, color: '#fbbf24' },
  { key: 'dusk', icon: Sunset, color: '#f97316' },
  { key: 'midnight', icon: Moon, color: '#6366f1' },
];

const AMBIENT_PRESET_KEYS = [
  'abyss_winds',
  'dungeon_drip',
  'tavern_bustle',
  'storm_ruins',
  'celestial_choir',
  'crypt_silence',
];

const DANGER_LEVEL_BASE: {
  key: EnvironmentDangerLevel;
  color: string;
  badgeBg: string;
}[] = [
  { key: 'safe', color: '#22c55e', badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { key: 'low', color: '#38bdf8', badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  { key: 'normal', color: '#eab308', badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { key: 'high', color: '#f97316', badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { key: 'deadly', color: '#ef4444', badgeBg: 'bg-red-500/20 text-red-300 border-red-500/30' },
];

export function GMAtmosphereManager() {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;
  const { campaign } = useCampaign();
  const campaignId = campaign?.id;

  const weatherOptions = WEATHER_BASE.map((w) => ({
    ...w,
    label: t.atmosphere.weatherOptions?.[w.key]?.label || w.key,
    desc: t.atmosphere.weatherOptions?.[w.key]?.desc || '',
  }));

  const timeOfDayOptions = TIME_OF_DAY_BASE.map((tod) => ({
    ...tod,
    label: t.atmosphere.timeOptions?.[tod.key]?.label || tod.key,
  }));

  const dangerLevels = DANGER_LEVEL_BASE.map((dl) => ({
    ...dl,
    label: t.atmosphere.dangerOptions?.[dl.key]?.label || dl.key,
  }));

  const ambientPresets = AMBIENT_PRESET_KEYS.map((k) => ({
    key: k,
    label: t.atmosphere.ambientPresets?.[k]?.label || k,
    desc: t.atmosphere.ambientPresets?.[k]?.desc || '',
    category: t.atmosphere.ambientPresets?.[k]?.category || '',
  }));

  const [tableMissing, setTableMissing] = useState(false);

  // Environment State
  const [environment, setEnvironment] = useState<CampaignEnvironment>({
    id: 'local-env',
    campaign_id: campaignId || '00000000-0000-0000-0000-000000000001',
    weather: 'fog',
    time_of_day: 'dusk',
    ambient_preset: 'abyss_winds',
    danger_level: 'normal',
    updated_at: new Date().toISOString(),
  });

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(70);

  // Session Chronicles State
  const [chronicles, setChronicles] = useState<SessionChronicle[]>([]);
  const [showChronicleModal, setShowChronicleModal] = useState(false);
  const [editingChronicle, setEditingChronicle] = useState<SessionChronicle | null>(null);

  // Chronicle Form
  const [formSessionNum, setFormSessionNum] = useState<number>(1);
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formInGameDate, setFormInGameDate] = useState('1492 DR, 12 Mirtul');
  const [formIsPublished, setFormIsPublished] = useState(true);
  const [formGmSecrets, setFormGmSecrets] = useState('');

  // Fetch Environment & Chronicles
  const fetchData = useCallback(async () => {
    if (!campaignId) return;

    // 1. Fetch Environment
    try {
      const { data: envData, error: envErr } = await supabase
        .from('campaign_environments')
        .select('*')
        .eq('campaign_id', campaignId)
        .maybeSingle();

      if (envErr) {
        if (
          envErr.code === '42P01' ||
          envErr.message?.includes('Could not find the table') ||
          envErr.message?.includes('does not exist')
        ) {
          setTableMissing(true);
        } else {
          console.error('Error fetching environment:', envErr);
        }
      } else if (envData) {
        setTableMissing(false);
        setEnvironment(envData as CampaignEnvironment);
      }
    } catch {
      setTableMissing(true);
    }

    // 2. Fetch Chronicles
    try {
      const { data: chronData, error: chronErr } = await supabase
        .from('session_chronicles')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('session_number', { ascending: false });

      if (chronErr) {
        if (
          chronErr.code === '42P01' ||
          chronErr.message?.includes('Could not find the table') ||
          chronErr.message?.includes('does not exist')
        ) {
          setTableMissing(true);
        } else {
          console.error('Error fetching chronicles:', chronErr);
        }
      } else if (chronData) {
        setChronicles(chronData as SessionChronicle[]);
        setFormSessionNum((chronData.length || 0) + 1);
      }
    } catch {
      setTableMissing(true);
    }
  }, [campaignId, setFormSessionNum]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    if (tableMissing || !campaignId) return;

    const channel = supabase
      .channel('atmosphere-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_environments' },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_chronicles' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableMissing, campaignId, fetchData]);

  // Update Environment
  const updateEnvironment = async (updates: Partial<CampaignEnvironment>) => {
    const next = { ...environment, ...updates, updated_at: new Date().toISOString() };
    setEnvironment(next);

    if (!tableMissing && campaignId) {
      try {
        const { error } = await supabase
          .from('campaign_environments')
          .upsert(
            {
              campaign_id: campaignId,
              weather: next.weather,
              time_of_day: next.time_of_day,
              ambient_preset: next.ambient_preset,
              danger_level: next.danger_level,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'campaign_id' }
          );

        if (error) {
          console.warn('Upsert environment failed, keeping local:', error);
        }
      } catch (err) {
        console.error('Environment update error:', err);
      }
    }
  };

  // Save Chronicle (Create or Update)
  const handleSaveChronicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSummary.trim()) return;

    const chronPayload: Partial<SessionChronicle> = {
      campaign_id: campaignId || '00000000-0000-0000-0000-000000000001',
      session_number: formSessionNum,
      title: formTitle.trim(),
      summary: formSummary.trim(),
      in_game_date: formInGameDate.trim() || null,
      is_published: formIsPublished,
      gm_secrets: formGmSecrets.trim() || null,
    };

    if (editingChronicle) {
      // Update
      setChronicles((prev) =>
        prev.map((c) => (c.id === editingChronicle.id ? { ...c, ...chronPayload } : c))
      );

      if (!tableMissing) {
        try {
          await supabase
            .from('session_chronicles')
            .update(chronPayload)
            .eq('id', editingChronicle.id);
        } catch (err) {
          console.error('Failed to update chronicle:', err);
        }
      }
    } else {
      // Create
      if (!tableMissing) {
        try {
          const { data, error } = await supabase
            .from('session_chronicles')
            .insert(chronPayload)
            .select()
            .single();

          if (error) throw error;
          if (data) {
            setChronicles((prev) => [data as SessionChronicle, ...prev]);
          }
        } catch (err) {
          console.warn('Insert chronicle DB error, using local fallback:', err);
          const localItem: SessionChronicle = {
            ...(chronPayload as SessionChronicle),
            id: `chron-${Date.now()}`,
            created_at: new Date().toISOString(),
          };
          setChronicles((prev) => [localItem, ...prev]);
        }
      } else {
        const localItem: SessionChronicle = {
          ...(chronPayload as SessionChronicle),
          id: `chron-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setChronicles((prev) => [localItem, ...prev]);
      }
    }

    // Reset Form
    setEditingChronicle(null);
    setFormTitle('');
    setFormSummary('');
    setFormGmSecrets('');
    setFormSessionNum(chronicles.length + 2);
    setShowChronicleModal(false);
  };

  // Delete Chronicle
  const handleDeleteChronicle = async (id: string) => {
    setChronicles((prev) => prev.filter((c) => c.id !== id));

    if (!tableMissing) {
      try {
        await supabase.from('session_chronicles').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete chronicle:', err);
      }
    }
  };

  // Open Edit Modal
  const openEditChronicle = (chron: SessionChronicle) => {
    setEditingChronicle(chron);
    setFormSessionNum(chron.session_number);
    setFormTitle(chron.title);
    setFormSummary(chron.summary);
    setFormInGameDate(chron.in_game_date || '');
    setFormIsPublished(chron.is_published);
    setFormGmSecrets(chron.gm_secrets || '');
    setShowChronicleModal(true);
  };

  return (
    <div data-testid="atmosphere-manager" className="space-y-6 font-inter text-gray-200">
      {/* Table Resilience Notice */}
      {tableMissing && (
        <GMTableNotice tableName="campaign_environments & session_chronicles" />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-cinzel font-bold text-gold-gradient">
              {t.atmosphere.title}
            </h2>
            <p className="text-[11px] text-gray-400">
              {t.atmosphere.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="create-session-btn"
          onClick={() => {
            setEditingChronicle(null);
            setFormSessionNum(chronicles.length + 1);
            setFormTitle('');
            setFormSummary('');
            setFormGmSecrets('');
            setShowChronicleModal(true);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.atmosphere.writeNewChronicle}</span>
        </button>
      </div>

      {/* Grid: Left: Atmosphere Controls / Right: Danger & Audio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Weather & Time */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weather Controls */}
          <div className="glass p-5 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-cinzel font-bold text-gold-gradient uppercase tracking-widest flex items-center gap-2">
                <CloudFog className="w-4 h-4 text-[#ffd700]" /> {t.atmosphere.weatherControls}
              </h3>
              <span className="text-[11px] text-gray-400 capitalize">
                {t.atmosphere.activeWeather}: <strong className="text-gray-200">{environment.weather}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {weatherOptions.map((w) => {
                const Icon = w.icon;
                const isSelected = environment.weather === w.key;
                return (
                  <button
                    key={w.key}
                    type="button"
                    data-testid={`weather-btn-${w.key}`}
                    onClick={() => updateEnvironment({ weather: w.key })}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'border-[#ffd700]/70 bg-gradient-to-br from-[#ffd700]/15 to-transparent shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                        : 'border-white/5 glass hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 shrink-0" style={{ color: w.color }} />
                      <span className="text-xs font-bold text-gray-200">{w.label}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-snug line-clamp-2">{w.desc}</p>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffd700] animate-ping" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time of Day */}
          <div className="glass p-5 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-cinzel font-bold text-gold-gradient uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#ffd700]" /> {t.atmosphere.timeOfDay}
              </h3>
              <span className="text-[11px] text-gray-400 capitalize">
                {t.common.active}: <strong className="text-gray-200">{environment.time_of_day}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {timeOfDayOptions.map((tod) => {
                const Icon = tod.icon;
                const isSelected = environment.time_of_day === tod.key;
                return (
                  <button
                    key={tod.key}
                    type="button"
                    data-testid={`time-btn-${tod.key}`}
                    onClick={() => updateEnvironment({ time_of_day: tod.key })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-[#ffd700]/70 bg-gradient-to-b from-[#ffd700]/20 to-transparent shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                        : 'border-white/5 glass hover:border-white/20'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color: tod.color }} />
                    <div className="text-xs font-bold text-gray-200">{tod.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Danger Level & Ambient Sound Preset */}
        <div className="space-y-6">
          {/* Danger Level Meter */}
          <div
            data-testid="danger-meter"
            className="glass p-5 rounded-xl border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-cinzel font-bold text-gold-gradient uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" /> {t.atmosphere.dangerLevel}
              </h3>
            </div>

            <div className="space-y-2">
              {dangerLevels.map((lvl) => {
                const isSelected = environment.danger_level === lvl.key;
                return (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => updateEnvironment({ danger_level: lvl.key })}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? `${lvl.badgeBg} font-bold shadow-md`
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5 text-gray-400'
                    }`}
                  >
                    <span className="text-xs">{lvl.label}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ambient Sound Selector */}
          <div className="glass p-5 rounded-xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-cinzel font-bold text-gold-gradient uppercase tracking-widest flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#ffd700]" /> {t.atmosphere.audioPreset}
              </h3>

              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isPlayingAudio
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
                title={isPlayingAudio ? t.atmosphere.stopAudio : t.atmosphere.playPreview}
              >
                {isPlayingAudio ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {ambientPresets.map((p) => {
                const isSelected = environment.ambient_preset === p.key;
                return (
                  <div
                    key={p.key}
                    onClick={() => updateEnvironment({ ambient_preset: p.key })}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#ffd700]/60 bg-[#ffd700]/10 text-gray-200'
                        : 'border-white/5 hover:border-white/15 bg-white/[0.01]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{p.label}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-gray-400 border border-white/5">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{p.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Volume slider */}
            <div className="pt-2 border-t border-white/5 flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseInt(e.target.value, 10))}
                className="w-full accent-[#ffd700] h-1 bg-white/10 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-gray-400 tabular-nums w-8 text-right">
                %{audioVolume}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Session Chronicles Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#ffd700]" />
            <h3 className="text-sm font-cinzel font-bold text-[#ffd700]">
              {t.atmosphere.sessionChronicles}
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            {chronicles.length} {t.atmosphere.totalRecords}
          </span>
        </div>

        {chronicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chronicles.map((ch) => (
              <div
                key={ch.id}
                className="glass p-5 rounded-xl border border-white/5 hover:border-white/15 transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#ffd700]/20 text-[#ffd700] text-[10px] font-bold font-mono">
                        {t.atmosphere.sessionNo} #{ch.session_number}
                      </span>
                      {ch.is_published ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5" /> {t.atmosphere.publicToPlayers}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5" /> {t.atmosphere.hiddenDraft}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-cinzel font-bold text-gray-200 mt-1">
                      {ch.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditChronicle(ch)}
                      className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                      title={t.common.edit}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      data-testid="delete-session-btn"
                      onClick={() => handleDeleteChronicle(ch.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {ch.in_game_date && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3 text-[#ffd700]" />
                    <span>{t.atmosphere.inGameDate}: {ch.in_game_date}</span>
                  </div>
                )}

                <p className="text-xs text-gray-300/90 leading-relaxed line-clamp-3">
                  {ch.summary}
                </p>

                {/* GM Secrets Box */}
                {ch.gm_secrets && (
                  <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-950/20 text-xs text-red-200/90 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {t.atmosphere.gmNotes}:
                    </div>
                    <p className="text-[11px] leading-snug">{ch.gm_secrets}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center glass rounded-xl border border-white/5 space-y-2">
            <BookOpen className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400">{t.atmosphere.noChronicles}</p>
          </div>
        )}
      </div>

      {/* Modal: Create / Edit Chronicle */}
      <AnimatePresence>
        {showChronicleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl border border-white/10 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-cinzel font-bold text-gold-gradient flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#ffd700]" />
                {editingChronicle ? t.atmosphere.editChronicle : t.atmosphere.writeNewChronicle}
              </h3>

              <form onSubmit={handleSaveChronicle} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      {t.atmosphere.sessionNo}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formSessionNum}
                      onChange={(e) => setFormSessionNum(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 text-center focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      {t.atmosphere.inGameDate}
                    </label>
                    <input
                      type="text"
                      value={formInGameDate}
                      onChange={(e) => setFormInGameDate(e.target.value)}
                      placeholder={t.atmosphere.inGameDatePlaceholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    {t.atmosphere.sessionTitle}
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="session-title-input"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={t.atmosphere.sessionTitlePlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    {t.atmosphere.sessionSummary}
                  </label>
                  <textarea
                    rows={4}
                    required
                    data-testid="session-summary-input"
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder={t.atmosphere.sessionSummaryPlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  />
                </div>

                <div>
                  <label className="text-xs text-red-400 uppercase font-bold block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> {t.atmosphere.gmNotes}
                  </label>
                  <textarea
                    rows={2}
                    data-testid="session-secrets-input"
                    value={formGmSecrets}
                    onChange={(e) => setFormGmSecrets(e.target.value)}
                    placeholder={t.atmosphere.gmNotesPlaceholder}
                    className="w-full bg-red-950/20 border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-200 placeholder-red-400/40 focus:outline-none focus:border-red-500/40"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chronicle-publish-checkbox"
                    data-testid="session-publish-toggle"
                    checked={formIsPublished}
                    onChange={(e) => setFormIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-[#ffd700] focus:ring-0"
                  />
                  <label htmlFor="chronicle-publish-checkbox" className="text-xs text-gray-300">
                    {t.atmosphere.publishToPlayers}
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowChronicleModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-200"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    data-testid="session-submit-btn"
                    className="px-4 py-1.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[#ffd700] text-xs font-bold"
                  >
                    {editingChronicle ? t.atmosphere.updateChronicle : t.common.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
