import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  TreePine,
  Map as MapIcon,
  Backpack,
  Crown,
  Sparkles,
  Shield,
  Heart,
  Flame,
  ArrowRight,
  BookOpen,
  Users,
  Scroll,
  Compass,
  Feather,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCampaign } from '../contexts/CampaignContext';
import { playSound } from '../lib/audio';
import { supabase, isSupabaseOffline } from '../lib/supabase';

interface ChronicleLog {
  id: string;
  timestamp: string;
  type: 'RUNE' | 'QUEST' | 'SANCTUM' | 'PARTY' | 'FOLIO';
  text: string;
}

const DEFAULT_CHRONICLE_LOGS: ChronicleLog[] = [
  {
    id: '1',
    timestamp: 'Session VIII',
    type: 'QUEST',
    text: 'The party shattered the Shadow Well and deciphered the Ancient Runic Gateway.',
  },
  {
    id: '2',
    timestamp: 'Session VII',
    type: 'RUNE',
    text: 'Arcane resonances attuned across Yggdrasil. The Astral Spire revealed its sanctum.',
  },
  {
    id: '3',
    timestamp: 'Session VI',
    type: 'PARTY',
    text: 'Expedition party gathered at the High Crossroads under the waning blood moon.',
  },
  {
    id: '4',
    timestamp: 'Session V',
    type: 'SANCTUM',
    text: 'Restored the Dragon Crest talisman to the Vault of the Archmage.',
  },
];

export function DashboardPage() {
  const { profile, isGM, locale } = useAuth();
  const { campaign, members, characters, activeCharacterId } = useCampaign();
  const isTr = locale === 'tr';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeDeckTab, setActiveDeckTab] = useState<'charms' | 'expedition'>('charms');
  const [logs, setLogs] = useState<ChronicleLog[]>(DEFAULT_CHRONICLE_LOGS);

  // Fetch live published chronicles from Supabase (get_session_chronicles RPC / session_chronicles_public)
  useEffect(() => {
    if (!campaign?.id || isSupabaseOffline()) return;
    let isMounted = true;

    const fetchChronicles = async () => {
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_session_chronicles', {
          p_campaign_id: campaign.id,
        });

        let rows: Array<Record<string, unknown>> = [];
        if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
          rows = rpcData as Array<Record<string, unknown>>;
        } else {
          const { data: viewData } = await supabase
            .from('session_chronicles_public')
            .select('id, session_number, title, summary, is_published, created_at')
            .eq('campaign_id', campaign.id)
            .eq('is_published', true)
            .order('session_number', { ascending: false })
            .limit(10);
          if (viewData && viewData.length > 0) {
            rows = viewData as Array<Record<string, unknown>>;
          }
        }

        if (isMounted && rows.length > 0) {
          const publishedRows = rows.filter((r) => r.is_published !== false);
          if (publishedRows.length > 0) {
            const mapped: ChronicleLog[] = publishedRows.map((r, idx) => {
              const summaryText = String(r.summary || r.public_summary || '');
              return {
                id: String(r.id || `chron-${idx}`),
                timestamp: r.session_number ? `Session ${r.session_number}` : 'Chronicle',
                type: idx % 2 === 0 ? 'QUEST' : 'RUNE',
                text: r.title
                  ? `${String(r.title)}${summaryText ? ` — ${summaryText}` : ''}`
                  : summaryText,
              };
            });
            setLogs([...mapped, ...DEFAULT_CHRONICLE_LOGS].slice(0, 8));
          }
        }
      } catch {
        // graceful fallback to DEFAULT_CHRONICLE_LOGS
      }
    };

    fetchChronicles();

    const channel = supabase
      .channel(`dashboard_chronicles_${campaign.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_chronicles',
          filter: `campaign_id=eq.${campaign.id}`,
        },
        () => {
          fetchChronicles();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [campaign?.id]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString(isTr ? 'tr-TR' : 'en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, [isTr]);

  const addCustomLog = async (type: 'QUEST' | 'RUNE', message: string) => {
    playSound('paper_flip');
    const newLog: ChronicleLog = {
      id: String(Date.now()),
      timestamp: 'Just now',
      type,
      text: message,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 7)]);

    if (isGM && campaign?.id && !isSupabaseOffline()) {
      try {
        await supabase.from('session_chronicles').insert({
          campaign_id: campaign.id,
          session_number: logs.length + 1,
          title: type === 'QUEST' ? 'Expedition Note' : 'Runic Commune',
          summary: message,
          is_published: true,
        });
      } catch {
        // ignore
      }
    }
  };

  const activeCharacter = characters?.find((c) => c.id === activeCharacterId);

  // Dynamic calculations
  const currentLevel = activeCharacter?.level ?? 1;
  const currentXp = activeCharacter?.xp_total ?? 0;
  const nextLevelXp = currentLevel * 1500;
  const xpPercent = Math.min(100, Math.round((currentXp / Math.max(nextLevelXp, 1)) * 100));

  const { currentHp, maxHp, hpPercent } = useMemo(() => {
    const defaultMax = Math.max(10, 50 + (currentLevel - 1) * 6);
    let savedCurrent: number | undefined;
    if (activeCharacterId) {
      try {
        const raw = localStorage.getItem(`dnd_vitals_${activeCharacterId}`);
        if (raw) {
          const parsed = JSON.parse(raw) as { currentHp?: number };
          if (typeof parsed.currentHp === 'number') savedCurrent = parsed.currentHp;
        }
      } catch {
        // ignore
      }
    }
    const charVitals =
      activeCharacter?.vitals && Object.keys(activeCharacter.vitals).length > 0
        ? activeCharacter.vitals
        : activeCharacter?.appearance?.vitals;
    const resolvedCurrent = Math.min(
      defaultMax,
      Math.max(0, savedCurrent ?? charVitals?.currentHp ?? defaultMax)
    );
    const pct = Math.max(0, Math.min(100, Math.round((resolvedCurrent / defaultMax) * 100)));
    return { currentHp: resolvedCurrent, maxHp: defaultMax, hpPercent: pct };
  }, [activeCharacterId, activeCharacter?.vitals, activeCharacter?.appearance?.vitals, currentLevel]);

  const navCharms = useMemo(
    () => [
      {
        to: '/character',
        title: isTr ? 'Karakter Föyü' : 'Hero Folio',
        subtitle: isTr ? 'Nitelikler & Zırh' : 'Attributes & Armaments',
        desc: isTr
          ? 'Karakter istatistikleri, pasif algılar ve kuşanılan kadim eşyalar.'
          : 'Character attributes, passive perception & equipped relics.',
        badge: isTr ? 'Karakter' : 'Hero Folio',
        icon: <User className="w-5 h-5 text-amber-400" />,
        accent: 'from-amber-500/10 to-transparent',
      },
      {
        to: '/stat-tree',
        title: isTr ? 'Yggdrasil Ağacı' : 'Yggdrasil Tree',
        subtitle: isTr ? 'Kutsal Öz Dalları' : 'Sacred Essence Branches',
        desc: isTr
          ? 'Dünya ağacının derin köklerinden güç alan temel stat geliştirmeleri.'
          : 'Core attribute ascension branching from the roots of the world tree.',
        badge: isTr ? 'Dünya Ağacı' : 'World Tree',
        icon: <TreePine className="w-5 h-5 text-emerald-400" />,
        accent: 'from-emerald-500/10 to-transparent',
      },
      {
        to: '/spells',
        title: isTr ? 'Büyü Kitabı' : 'Spell Grimoire',
        subtitle: isTr ? 'Kadim Rün Düğümleri' : 'Ancient Rune Nodes',
        desc: isTr
          ? 'Ateş, buz ve arkan büyü yolları; efsunlu büyüler ve yetenek rünleri.'
          : 'Attuned spell grimoire, elemental rites and sacred arcana.',
        badge: isTr ? 'Büyü Kitabı' : 'Spell Grimoire',
        icon: <Sparkles className="w-5 h-5 text-purple-400" />,
        accent: 'from-purple-500/10 to-transparent',
      },
      {
        to: '/map',
        title: isTr ? 'Savaş Haritası' : 'Battle Map',
        subtitle: isTr ? 'Taktik Sefer Masası' : 'Tactical War Table',
        desc: isTr
          ? 'Savaş alanı sisleri, taktiksel ızgara ve dost/düşman piyonları.'
          : 'Dynamic fog-of-war, terrain grid and tactical adventurer tokens.',
        badge: isTr ? 'Sefer Atlası' : 'Battle Atlas',
        icon: <MapIcon className="w-5 h-5 text-sky-400" />,
        accent: 'from-sky-500/10 to-transparent',
      },
      {
        to: '/inventory',
        title: isTr ? 'Maceracı Çantası' : 'Adventurer Pack',
        subtitle: isTr ? '24 Hazne & Hazine' : '24 Slots & Gold Cache',
        desc: isTr
          ? 'Efsanevi kılıçlar, iksirler, parşömenler ve altın sikke kesesi.'
          : 'Fixed-slot inventory, legendary gear, potions and gold coin purse.',
        badge: isTr ? 'Teçhizat' : 'Adventurer Pack',
        icon: <Backpack className="w-5 h-5 text-amber-500" />,
        accent: 'from-amber-600/10 to-transparent',
      },
      isGM
        ? {
            to: '/gm',
            title: isTr ? 'GM Kontrol Odası' : 'GM Chamber',
            subtitle: isTr ? 'Zindan Ustası Masası' : 'Overseer Sanctum',
            desc: isTr
              ? 'Savaş simülatörü, hava durumu/ortam ve hazine sandığı dağıtımı.'
              : 'Encounter simulation, atmospheric chronicle & loot chest distribution.',
            badge: isTr ? 'GM Odası' : 'GM Sanctum',
            icon: <Crown className="w-5 h-5 text-rose-400" />,
            accent: 'from-rose-950/25 to-transparent',
          }
        : {
            to: '/character',
            title: isTr ? 'Kader Ağacı' : 'Destiny Path',
            subtitle: isTr ? 'Yetenek Yükselişi' : 'Ascension Rites',
            desc: isTr
              ? 'Seviye atlama hakları, yetenek puanları ve sınıf kazanımları.'
              : 'Level progression, heroic traits, and class ascension features.',
            badge: isTr ? 'Kader Yolu' : 'Destiny Path',
            icon: <Shield className="w-5 h-5 text-amber-300" />,
            accent: 'from-amber-700/10 to-transparent',
          },
    ],
    [isTr, isGM]
  );

  return (
    <div className="space-y-6 w-full max-w-[1680px] mx-auto font-inter relative pb-28 px-2 sm:px-4">
      {/* ─── Hero Overview: War Table Header ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="arcane-glass p-5 sm:p-6 lg:p-7 relative overflow-hidden border border-amber-900/30"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="wax-seal-badge">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                CAMPAIGN WAR TABLE
              </span>
              <span className="text-xs font-cinzel text-amber-200/60 tracking-wider">
                {currentTime}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-cinzel font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 tracking-wide">
              {isTr ? 'SEFER KONSOLU' : 'EXPEDITION COUNCIL'} • {profile?.username || 'WANDERER'}
            </h1>

            <div className="flex items-center gap-2.5 text-xs text-amber-200/80">
              <Scroll size={14} className="text-amber-400 shrink-0" />
              <span className="font-cinzel">{isTr ? 'AKTİF SERÜVEN:' : 'ACTIVE CAMPAIGN:'}</span>
              <span className="font-cinzel text-amber-100 font-bold px-2.5 py-0.5 rounded-full bg-amber-950/40 border border-amber-900/40">
                {campaign?.name || (isTr ? 'Gölgeler Diyarı Seferi' : 'Chronicles of Yggdrasil')}
              </span>
            </div>
          </div>

          {/* Quick Party Presence */}
          <div className="flex flex-wrap items-center gap-3 bg-black/40 p-3 rounded-2xl border border-amber-900/30">
            <div className="flex items-center gap-2 text-xs font-cinzel text-amber-200/90 px-3 py-1.5 rounded-xl bg-amber-950/30 border border-amber-900/30">
              <Users size={14} className="text-amber-400" />
              <span>
                {members.length} {isTr ? 'Maceracı Hazır' : 'Adventurers Present'}
              </span>
            </div>

            <button
              onClick={() => {
                playSound('paper_flip');
                addCustomLog('RUNE', isTr ? 'Kutsal rünler şöminede parıldadı.' : 'Sacred runes gleamed in the hearth.');
              }}
              className="px-5 py-2.5 rounded-xl border border-amber-900/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 text-xs sm:text-sm font-cinzel font-bold tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md"
              title="Commune with the party"
            >
              <Feather size={15} className="text-amber-400" />
              <span>{isTr ? 'NOT DÜŞ' : 'COMMUNE'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Hero Centerpiece: Adventurer's Medallion & War Table ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Adventurer's Medallion (4 cols on xl) */}
        <div className="lg:col-span-5 xl:col-span-4 arcane-glass p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden border border-amber-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Compass size={17} className="text-amber-400" />
              <span className="font-cinzel text-xs font-bold tracking-widest text-amber-300 uppercase">
                {isTr ? 'KAHRAMAN MADALYONU' : 'ADVENTURER MEDALLION'}
              </span>
            </div>
            <span className="text-[10px] font-cinzel px-2.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-900/40 text-emerald-300 font-semibold">
              VITALITY: {hpPercent === 100 ? 'FULL' : `${hpPercent}%`}
            </span>
          </div>

          {/* Central Medallion Visual */}
          <div className="py-6 flex flex-col items-center justify-center relative">
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
              {/* Outer Carved Brass Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-900/40 animate-spin-slow" />
              <div className="absolute inset-2 rounded-full border border-amber-500/20" />

              {/* Progress Ring */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-amber-950/40"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-amber-500 transition-all duration-1000 ease-out"
                  strokeWidth="4"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * xpPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Center Medallion Plate */}
              <div className="absolute inset-5 rounded-full bg-gradient-to-br from-[#1c1f2e] via-[#0e1017] to-[#08090c] border border-amber-900/40 flex flex-col items-center justify-center p-3 text-center shadow-2xl">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-300 mb-1 shadow-sm">
                  <Flame size={18} className="animate-candle-flicker" />
                </div>
                <span className="font-cinzel text-xl sm:text-2xl font-black text-amber-100 tracking-wider">
                  LVL {currentLevel}
                </span>
                <span className="text-[11px] font-cinzel text-amber-300/90 font-bold uppercase truncate max-w-[170px] px-1">
                  {activeCharacter?.name || (isTr ? 'Valen Shadowflame' : 'Valen Shadowflame')}
                </span>
              </div>
            </div>

            {/* Spec Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="px-3 py-1 rounded-full bg-black/50 border border-amber-900/40 text-xs font-cinzel text-amber-200">
                {activeCharacter?.race?.name || 'High Elf'}
              </span>
              <span className="px-3 py-1 rounded-full bg-black/50 border border-amber-900/40 text-xs font-cinzel text-amber-200">
                {activeCharacter?.subclass
                  ? isTr
                    ? activeCharacter.subclass.name_tr
                    : activeCharacter.subclass.name_en
                  : 'Evoker'}
              </span>
            </div>
          </div>

          {/* Vitals Telemetry */}
          <div className="space-y-3 mt-4 pt-4 border-t border-amber-900/25">
            {/* HP Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-cinzel mb-1">
                <span className="text-amber-200/70 flex items-center gap-1.5">
                  <Heart size={13} className="text-rose-500" />
                  {isTr ? 'Can Puanı (HP)' : 'Hit Points (HP)'}
                </span>
                <span className="text-rose-300 font-bold">
                  {currentHp} / {maxHp} HP <span className="text-emerald-400">({hpPercent}%)</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-rose-950/40">
                <div
                  className="h-full bg-gradient-to-r from-rose-700 to-rose-500 shadow-sm transition-all duration-300"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            {/* XP Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-cinzel mb-1">
                <span className="text-amber-200/70 flex items-center gap-1.5">
                  <Flame size={13} className="text-amber-400" />
                  {isTr ? 'Deneyim (XP)' : 'Experience (XP)'}
                </span>
                <span className="text-amber-300 font-bold">
                  {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-amber-950/40">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Actions & Expedition Bay (7 cols on lg, 8 cols on xl) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          {/* Deck Tabs */}
          <div className="flex items-center justify-between border-b border-amber-900/25 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen size={19} className="text-amber-400" />
              <h2 className="font-cinzel text-sm sm:text-base font-bold text-amber-100 tracking-wider uppercase">
                {isTr ? 'SERÜVEN KARTLARI' : 'EXPEDITION CHARMS'}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-amber-900/30">
              <button
                onClick={() => {
                  playSound('lock_click');
                  setActiveDeckTab('charms');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-cinzel font-semibold transition-all cursor-pointer ${
                  activeDeckTab === 'charms'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isTr ? 'TILSIMLAR' : 'CHARMS'}
              </button>
              <button
                onClick={() => {
                  playSound('lock_click');
                  setActiveDeckTab('expedition');
                }}
                className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-cinzel font-semibold transition-all cursor-pointer ${
                  activeDeckTab === 'expedition'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm font-bold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {isTr ? 'SEFER MASASI' : 'WAR TABLE'}
              </button>
            </div>
          </div>

          {/* Tab 1: Navigation Charms */}
          {activeDeckTab === 'charms' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {navCharms.map((charm) => (
                <Link
                  key={charm.to}
                  to={charm.to}
                  onClick={() => playSound('lock_click')}
                  className="group block"
                >
                  <div
                    className={`arcane-glass p-5 min-h-[175px] h-full flex flex-col justify-between border border-amber-900/35 hover:border-amber-400/50 hover:shadow-[0_0_24px_rgba(245,158,11,0.18)] bg-gradient-to-br ${charm.accent} transition-all duration-300 cursor-pointer relative overflow-hidden rounded-2xl`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-cinzel text-amber-300/80 font-bold tracking-widest uppercase">
                        {charm.badge}
                      </span>
                      <span className="text-[9px] font-cinzel font-bold px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-900/40">
                        {isTr ? 'GİRİŞ' : 'ENTER'}
                      </span>
                    </div>

                    <div className="space-y-1 my-1">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-black/50 border border-amber-900/40 group-hover:scale-105 transition-transform shrink-0">
                          {charm.icon}
                        </div>
                        <div>
                          <h3 className="font-cinzel text-sm font-bold text-amber-100 group-hover:text-amber-300 transition-colors">
                            {charm.title}
                          </h3>
                          <p className="text-[10px] text-amber-200/60 font-cinzel">
                            {charm.subtitle}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-stone-300 pt-1 line-clamp-2 leading-relaxed">
                        {charm.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-amber-900/25 flex items-center justify-between text-xs sm:text-sm font-cinzel font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                      <span>{isTr ? 'GÖRÜNTÜLE' : 'INSPECT'}</span>
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Tab 2: War Table Expedition Overview */}
          {activeDeckTab === 'expedition' && (
            <div className="arcane-glass p-5 border border-amber-900/30 flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-900/25 mb-4">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-amber-400" />
                    <h3 className="font-cinzel text-sm font-bold text-amber-100 uppercase">
                      {isTr ? 'GÖLGE DİYARI SEFER HARİTASI' : 'SECTOR WAR TABLE & EXPEDITION'}
                    </h3>
                  </div>
                  <span className="text-[11px] font-cinzel text-amber-300/80">
                    {members.length} {isTr ? 'Maceracı Hazır' : 'Heroes Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-black/40 border border-amber-900/25 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-cinzel font-bold text-amber-300 text-xs">
                        {m.profile?.username ? m.profile.username[0].toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-cinzel font-bold text-amber-200 truncate">
                          {m.profile?.username || 'Wanderer'}
                        </div>
                        <div className="text-[10px] text-stone-400 uppercase">
                          {m.role === 'gm' ? 'Dungeon Master' : 'Party Member'}
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-amber-900/25 flex items-center justify-between text-xs font-cinzel text-amber-200/80">
                <span>{isTr ? 'Harita Taktik Alanı Hazır' : 'Battle Map Position: Verified'}</span>
                <Link
                  to="/map"
                  className="text-amber-400 hover:text-amber-200 flex items-center gap-1 font-bold transition-colors"
                >
                  <span>{isTr ? 'Haritaya Git' : 'Open Battle Map'}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Real-Time Chronicles & Rumors Stream ────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="arcane-glass p-5 border border-amber-900/30 bg-[#08090c]/85"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-amber-900/25">
          <div className="flex items-center gap-2">
            <Scroll size={16} className="text-amber-400" />
            <h3 className="font-cinzel text-xs sm:text-sm font-bold text-amber-100 tracking-wider uppercase">
              CHRONICLES OF YGGDRASIL
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => addCustomLog('QUEST', 'The party secured the ancient sanctuary.')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-xs font-cinzel font-bold text-amber-200 transition-all cursor-pointer border border-amber-900/40 hover:scale-105 active:scale-95 shadow-sm"
            >
              + INSCRIBE NOTE
            </button>
            <button
              onClick={() => {
                playSound('paper_flip');
                setLogs([]);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-cinzel font-semibold text-stone-300 transition-all cursor-pointer border border-white/10 hover:scale-105 active:scale-95"
            >
              CLEAR
            </button>
            <span className="text-xs font-cinzel text-amber-400 flex items-center gap-1.5 ml-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              HEARTH LIT
            </span>
          </div>
        </div>

        {/* Chronicle Logs */}
        <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-2 no-scrollbar">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 text-stone-300 hover:bg-white/[0.03] p-1.5 rounded-lg transition-colors"
            >
              <span className="text-amber-200/80 font-cinzel select-none shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-amber-900/30">
                {log.timestamp}
              </span>
              <span
                className={`font-cinzel font-bold select-none shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${
                  log.type === 'QUEST'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : log.type === 'RUNE'
                    ? 'text-purple-300 bg-purple-500/10 border-purple-500/30'
                    : log.type === 'PARTY'
                    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-amber-200 bg-amber-950/30 border-amber-900/30'
                }`}
              >
                {log.type}
              </span>
              <span className="text-stone-200 font-inter leading-relaxed">{log.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
