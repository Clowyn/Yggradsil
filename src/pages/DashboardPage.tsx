import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  User,
  TreePine,
  Map,
  Backpack,
  Crown,
  Sparkles,
  Shield,
  Flame,
  Radio,
  Cpu,
  ArrowRight,
  Terminal,
  Crosshair,
  Wifi,
  Zap,
  Disc3,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCampaign } from '../contexts/CampaignContext';
import { playSound } from '../lib/audio';

interface TelemetryLog {
  id: string;
  timestamp: string;
  type: 'UPLINK' | 'RESONANCE' | 'RADAR' | 'CARGO' | 'SYSTEM';
  text: string;
}

export function DashboardPage() {
  const { profile, isGM, locale } = useAuth();
  const { campaign, members, characters, activeCharacterId } = useCampaign();
  const isTr = locale === 'tr';

  const [currentTime, setCurrentTime] = useState<string>('');
  const [activeDeckTab, setActiveDeckTab] = useState<'modules' | 'metrics' | 'radar'>('modules');
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<TelemetryLog[]>([
    {
      id: '1',
      timestamp: '13:40:12',
      type: 'UPLINK',
      text: 'Quantum entanglement synchronized with Party Core.',
    },
    {
      id: '2',
      timestamp: '13:41:05',
      type: 'RESONANCE',
      text: 'Biometric telemetry verified: 100% chassis integrity.',
    },
    {
      id: '3',
      timestamp: '13:41:48',
      type: 'RADAR',
      text: 'Orbital sensors active. Tactical grid loaded for Sector 07.',
    },
    {
      id: '4',
      timestamp: '13:42:01',
      type: 'CARGO',
      text: 'Arsenal encryption verified. Nano-cargo compartments ready.',
    },
  ]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toISOString().replace('T', ' // ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerScan = () => {
    playSound('scan');
    setIsScanning(true);
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 8);
    const newLog: TelemetryLog = {
      id: String(Date.now()),
      timestamp: timeStr,
      type: 'RADAR',
      text: isTr
        ? `Taktik sensör taraması tamamlandı: ${members.length} operatör aktif rezonansta.`
        : `Tactical sensor sweep complete: ${members.length} operators active in resonance.`,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 6)]);
    setTimeout(() => {
      setIsScanning(false);
      playSound('ping');
    }, 1600);
  };

  const addCustomLog = (type: 'SYSTEM' | 'RESONANCE', message: string) => {
    playSound('blip');
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 8);
    setLogs((prev) => [
      { id: String(Date.now()), timestamp: timeStr, type, text: message },
      ...prev.slice(0, 6),
    ]);
  };

  const activeCharacter = characters?.find((c) => c.id === activeCharacterId);

  // Dynamic calculations for reactor
  const currentLevel = activeCharacter?.level ?? 1;
  const currentXp = activeCharacter?.xp_total ?? 0;
  const nextLevelXp = currentLevel * 1500;
  const xpPercent = Math.min(100, Math.round((currentXp / Math.max(nextLevelXp, 1)) * 100));

  const navModules = useMemo(
    () => [
      {
        to: '/character',
        code: 'BIO.02',
        title: isTr ? 'Kahraman Matrisi' : 'Hero Matrix',
        subtitle: isTr ? 'Siber Biyometrik Veriler' : 'Cybernetic Biometrics',
        desc: isTr ? 'Nitelikler, donanım yuvaları ve zırh modülleri.' : 'Attributes, gear sockets & armor modules.',
        telemetry: 'SYNCED',
        badgeColor: 'border-cyan-400/40 text-cyan-400 bg-cyan-400/10',
        icon: <User className="w-5 h-5 text-cyan-400" />,
        glow: 'hover:shadow-[0_0_30px_rgba(0,240,255,0.25)]',
        accent: 'from-cyan-500/20 to-transparent',
      },
      {
        to: '/stat-tree',
        code: 'NEU.03',
        title: isTr ? 'Nöral Statlar' : 'Neural Stats',
        subtitle: isTr ? 'Sinaptik Yollar' : 'Synaptic Pathways',
        desc: isTr ? 'Yggdrasil dünya ağacı üzerinden nöral güçlendirme.' : 'Neural augmentation across the world stat tree.',
        telemetry: 'ONLINE',
        badgeColor: 'border-emerald-400/40 text-emerald-400 bg-emerald-400/10',
        icon: <TreePine className="w-5 h-5 text-emerald-400" />,
        glow: 'hover:shadow-[0_0_30px_rgba(0,255,157,0.25)]',
        accent: 'from-emerald-500/20 to-transparent',
      },
      {
        to: '/spells',
        code: 'ARC.04',
        title: isTr ? 'Büyü Matrisi' : 'Spell Matrix',
        subtitle: isTr ? 'Kuantum Frekansları' : 'Quantum Resonance',
        desc: isTr ? 'Antik büyü düğümleri ve arkan frekans dalları.' : 'Ancient spell nodes & arcane phase pathways.',
        telemetry: 'OPTIMAL',
        badgeColor: 'border-purple-400/40 text-purple-400 bg-purple-400/10',
        icon: <Sparkles className="w-5 h-5 text-purple-400" />,
        glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
        accent: 'from-purple-500/20 to-transparent',
      },
      {
        to: '/map',
        code: 'ORB.05',
        title: isTr ? 'Sektör Radarı' : 'Sector Radar',
        subtitle: isTr ? 'Yörüngesel Harita' : 'Orbital Recon Map',
        desc: isTr ? 'Savaş alanı koordinatları ve taktiksel görüş ağı.' : 'Battlefield coordinates & fog-of-war tracking.',
        telemetry: 'ACTIVE',
        badgeColor: 'border-sky-400/40 text-sky-400 bg-sky-400/10',
        icon: <Map className="w-5 h-5 text-sky-400" />,
        glow: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.25)]',
        accent: 'from-sky-500/20 to-transparent',
      },
      {
        to: '/inventory',
        code: 'MAT.06',
        title: isTr ? 'Kuantum Kargo' : 'Quantum Cargo',
        subtitle: isTr ? 'Mühimmat Bölmesi' : 'Tactical Arsenal Bay',
        desc: isTr ? 'Nano-eşya bölmeleri, kuantum para ve ekipman.' : 'Nano-item slots, credit balances & tactical gear.',
        telemetry: 'SECURE',
        badgeColor: 'border-pink-500/40 text-pink-400 bg-pink-500/10',
        icon: <Backpack className="w-5 h-5 text-pink-400" />,
        glow: 'hover:shadow-[0_0_30px_rgba(255,0,85,0.25)]',
        accent: 'from-pink-500/20 to-transparent',
      },
    ],
    [isTr]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-inter relative pb-12">
      {/* ─── Ambient Holographic Laser Sweep Overlay ───────────────── */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
          >
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser-sweep shadow-[0_0_30px_#00f0ff]" />
            <div className="absolute inset-0 bg-cyan-400/5 backdrop-blur-[1px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Cockpit Directive Status Header ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="holo-card p-4 sm:p-5 relative overflow-hidden border border-cyan-400/30"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/40 text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                // APEX_NEXUS_COMMAND_V5
              </span>
              <span className="text-[11px] font-mono text-parchment-dim tracking-wider">
                {currentTime || 'CHRONO_CALIBRATING...'}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-orbitron font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 uppercase drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              {isTr ? 'KOMUTA KÖPRÜSÜ' : 'COMMAND BRIDGE'} // {profile?.username || 'AGENT'}
            </h1>

            <div className="flex items-center gap-2 text-xs font-mono text-parchment-dim">
              <Radio size={13} className="text-emerald animate-pulse shrink-0" />
              <span>{isTr ? 'AKTİF HAREKAT:' : 'ACTIVE MISSION:'}</span>
              <span className="text-white font-bold tracking-wider px-2 py-0.5 rounded bg-black/50 border border-white/10">
                {campaign?.name || (isTr ? 'GÖLGELER SEKTÖRÜ' : 'SECTOR OF SHADOWS')}
              </span>
            </div>
          </div>

          {/* Quick HUD Telemetry & Sonar Trigger */}
          <div className="flex flex-wrap items-center gap-3 bg-black/60 p-2.5 sm:p-3 rounded-xl border border-cyan-400/20">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-400/20 text-xs font-mono text-cyan-300">
              <Wifi size={14} className="text-emerald animate-pulse" />
              <span>12MS LATENCY</span>
            </div>

            <button
              onClick={triggerScan}
              disabled={isScanning}
              className="px-3.5 py-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)] active:scale-95 cursor-pointer disabled:opacity-50"
              title="Ping orbital radar sensors"
            >
              <Crosshair size={14} className={isScanning ? 'animate-spin' : ''} />
              <span>{isScanning ? (isTr ? 'TARANIYOR...' : 'SCANNING...') : (isTr ? 'SONAR TARA' : 'PING RADAR')}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Hero Centerpiece: Holographic Biometric Reactor ──────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Reactor Biometric Core (5 cols on lg) */}
        <div className="lg:col-span-5 holo-card p-6 flex flex-col justify-between relative overflow-hidden border border-cyan-400/30">
          {/* Subtle Ambient Radial Flare */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2">
              <Disc3 size={16} className="text-cyan-400 animate-spin-slow" />
              <span className="font-orbitron text-xs font-bold tracking-widest text-cyan-400 uppercase">
                {isTr ? 'BİYOMETRİK ÇEKİRDEK' : 'BIOMETRIC CORE REACTOR'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald/10 border border-emerald/30 text-emerald font-semibold">
              // SYNC 99.8%
            </span>
          </div>

          {/* Central Reactor Visual */}
          <div className="relative py-6 flex flex-col items-center justify-center">
            {/* Multi-layered Rotating Tech Ring */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
              {/* Outer Ticked Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-cyan-400/30 animate-reactor-spin" />
              {/* Counter Rotating Ring */}
              <div className="absolute inset-2 rounded-full border border-cyan-400/20 animate-reactor-spin-reverse" />

              {/* Progress SVG Ring */}
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-cyan-950/60"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-cyan-400 transition-all duration-1000 ease-out drop-shadow-[0_0_8px_#00f0ff]"
                  strokeWidth="5"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * xpPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Central Core Display */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-950/90 to-black border border-cyan-400/40 flex flex-col items-center justify-center p-3 text-center shadow-[inset_0_0_20px_rgba(0,240,255,0.25)]">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 mb-1 shadow-[0_0_12px_rgba(0,240,255,0.4)]">
                  <Zap size={16} className="animate-pulse" />
                </div>
                <span className="font-orbitron text-xl sm:text-2xl font-black text-white tracking-wider">
                  LVL {currentLevel}
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase truncate max-w-[120px]">
                  {activeCharacter?.name || (isTr ? 'Bilinmeyen' : 'Unknown')}
                </span>
              </div>
            </div>

            {/* Spec Readout Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="px-2.5 py-1 rounded bg-black/60 border border-purple-400/30 text-[11px] font-mono text-purple-300">
                {activeCharacter?.race?.name || 'High Elf'}
              </span>
              <span className="px-2.5 py-1 rounded bg-black/60 border border-pink-400/30 text-[11px] font-mono text-pink-300">
                {activeCharacter?.subclass
                  ? (isTr ? activeCharacter.subclass.name_tr : activeCharacter.subclass.name_en)
                  : 'Evoker'}
              </span>
            </div>
          </div>

          {/* Vitals Telemetry Matrix */}
          <div className="space-y-3 mt-4 pt-4 border-t border-cyan-400/15 relative z-10">
            {/* Vital HP Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-parchment-dim flex items-center gap-1.5">
                  <Shield size={12} className="text-cyan-400" />
                  {isTr ? 'HAYAT MATRİSİ (HP)' : 'VITAL INTEGRITY (HP)'}
                </span>
                <span className="text-cyan-300 font-bold">
                  84 / 84 HP <span className="text-emerald">(100%)</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-cyan-400/20">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald w-full shadow-[0_0_8px_#00f0ff]" />
              </div>
            </div>

            {/* Quantum XP Capacitor */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-parchment-dim flex items-center gap-1.5">
                  <Flame size={12} className="text-purple-400" />
                  {isTr ? 'KUANTUM KAPASİTÖRÜ (XP)' : 'QUANTUM CAPACITOR (XP)'}
                </span>
                <span className="text-purple-300 font-bold">
                  {currentXp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-purple-400/20">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Operations Bay (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Deck Tabs */}
          <div className="flex items-center justify-between border-b border-cyan-400/20 pb-3">
            <div className="flex items-center gap-2">
              <Cpu size={18} className="text-cyan-400" />
              <h2 className="font-orbitron text-sm sm:text-base font-bold text-white tracking-widest uppercase">
                {isTr ? 'TAKTIK MODÜLLER' : 'TACTICAL DOCKING BAY'}
              </h2>
            </div>

            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-cyan-400/20">
              <button
                onClick={() => {
                  playSound('click');
                  setActiveDeckTab('modules');
                }}
                className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                  activeDeckTab === 'modules'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                    : 'text-parchment-dim hover:text-white'
                }`}
              >
                {isTr ? 'MODÜLLER' : 'MODULES'}
              </button>
              <button
                onClick={() => {
                  playSound('click');
                  setActiveDeckTab('radar');
                }}
                className={`px-3 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                  activeDeckTab === 'radar'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                    : 'text-parchment-dim hover:text-white'
                }`}
              >
                {isTr ? 'RADAR' : 'RADAR'}
              </button>
            </div>
          </div>

          {/* Tab 1: Module Cards */}
          {activeDeckTab === 'modules' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {navModules.map((mod) => (
                <Link
                  key={mod.to}
                  to={mod.to}
                  onClick={() => playSound('click')}
                  className="group block"
                >
                  <div
                    className={`holo-card p-4 h-full flex flex-col justify-between border border-cyan-400/20 bg-gradient-to-br ${mod.accent} ${mod.glow} transition-all duration-300 cursor-pointer relative overflow-hidden`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono text-parchment-dim tracking-widest">
                        [{mod.code}]
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${mod.badgeColor}`}>
                        {mod.telemetry}
                      </span>
                    </div>

                    <div className="space-y-1 my-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-black/50 border border-white/10 group-hover:scale-110 transition-transform">
                          {mod.icon}
                        </div>
                        <div>
                          <h3 className="font-orbitron text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {mod.title}
                          </h3>
                          <p className="text-[10px] font-mono text-parchment-dim">
                            {mod.subtitle}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-parchment/70 font-rajdhani pt-2 line-clamp-2">
                        {mod.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition-transform">
                      <span>{isTr ? 'SİSTEMİ BAŞLAT' : 'LAUNCH DECK'}</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))}

              {/* GM Console Card if GM */}
              {isGM && (
                <Link
                  to="/gm"
                  onClick={() => playSound('click')}
                  className="group block sm:col-span-2"
                >
                  <div className="holo-card p-4 border border-crimson/40 bg-gradient-to-r from-crimson/15 via-black/40 to-transparent hover:shadow-[0_0_30px_rgba(255,0,85,0.25)] transition-all cursor-pointer flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-crimson/20 border border-crimson/50 text-crimson">
                        <Crown size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-crimson font-bold uppercase tracking-wider">
                            // OVERSEER_CMD.07
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-crimson text-black text-[9px] font-mono font-black">
                            GM ONLY
                          </span>
                        </div>
                        <h3 className="font-orbitron text-sm sm:text-base font-bold text-white group-hover:text-crimson transition-colors">
                          {isTr ? 'GM YÖNETİM KONSOLU' : 'GAME MASTER OVERSEER DECK'}
                        </h3>
                        <p className="text-xs text-parchment-dim font-rajdhani">
                          {isTr ? 'Savaş simülasyonu, hava koşulları ve eşya dağıtımı.' : 'Encounter simulation, atmospheric audio & loot dispensary.'}
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-crimson">
                      <span>ACCESS</span>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}

          {/* Tab 2: Interactive Sonar Radar Widget */}
          {activeDeckTab === 'radar' && (
            <div className="holo-card p-5 border border-cyan-400/30 flex flex-col items-center justify-center relative min-h-[320px]">
              {/* Radar Screen */}
              <div className="relative w-64 h-64 rounded-full border-2 border-cyan-400/30 bg-black/80 flex items-center justify-center overflow-hidden shadow-[inset_0_0_30px_rgba(0,240,255,0.2)]">
                {/* Concentric rings */}
                <div className="absolute inset-8 rounded-full border border-cyan-400/20" />
                <div className="absolute inset-16 rounded-full border border-cyan-400/20" />
                <div className="absolute inset-24 rounded-full border border-cyan-400/20" />

                {/* Crosshairs */}
                <div className="absolute inset-x-0 h-px bg-cyan-400/20" />
                <div className="absolute inset-y-0 w-px bg-cyan-400/20" />

                {/* Sonar Beam Sweep */}
                <div className="absolute inset-0 animate-radar-sweep bg-gradient-to-tr from-transparent via-transparent to-cyan-400/25 pointer-events-none" />

                {/* Center Beacon */}
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#00f0ff] z-10 animate-ping" />

                {/* Party Blips */}
                {members.map((m, idx) => {
                  const angle = (idx * 360) / Math.max(members.length, 1);
                  const rad = (angle * Math.PI) / 180;
                  const dist = 75;
                  const x = Math.cos(rad) * dist;
                  const y = Math.sin(rad) * dist;
                  return (
                    <div
                      key={m.id}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute z-20 flex flex-col items-center cursor-pointer group"
                      title={m.profile?.username}
                    >
                      <div className="w-3 h-3 rounded-full bg-emerald border border-black shadow-[0_0_8px_#00ff9d] group-hover:scale-150 transition-transform" />
                      <span className="text-[9px] font-mono text-emerald mt-1 bg-black/80 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {m.profile?.username}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-between w-full text-xs font-mono text-parchment-dim">
                <span>{members.length} {isTr ? 'OPERATÖR TESPİT EDİLDİ' : 'OPERATORS IN RANGE'}</span>
                <button
                  onClick={triggerScan}
                  className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>{isTr ? 'RE-KALİBRE ET' : 'RECALIBRATE'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Real-Time Quantum Telemetry Console Stream ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="holo-card p-4 sm:p-5 border border-cyan-400/20 bg-black/75"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-cyan-400/15">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-cyan-400" />
            <h3 className="font-orbitron text-xs sm:text-sm font-bold text-white tracking-widest uppercase">
              // TELEMETRY_STREAM: YGGDRASIL.SYS
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => addCustomLog('SYSTEM', 'Chassis diagnostic: all servos optimal.')}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-parchment transition-all cursor-pointer border border-white/10"
            >
              + DIAGNOSTIC
            </button>
            <button
              onClick={() => {
                playSound('blip');
                setLogs([]);
              }}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] font-mono text-parchment transition-all cursor-pointer border border-white/10"
            >
              CLEAR
            </button>
            <span className="text-[10px] font-mono text-emerald flex items-center gap-1 ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-ping" />
              LIVE
            </span>
          </div>
        </div>

        {/* Console Logs */}
        <div className="space-y-1.5 font-mono text-xs max-h-40 overflow-y-auto pr-2 no-scrollbar">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 text-parchment/80 hover:bg-white/[0.03] p-1 rounded transition-colors"
            >
              <span className="text-parchment-dim select-none shrink-0">[{log.timestamp}]</span>
              <span
                className={`font-bold select-none shrink-0 ${
                  log.type === 'UPLINK'
                    ? 'text-cyan-400'
                    : log.type === 'RESONANCE'
                    ? 'text-purple-400'
                    : log.type === 'RADAR'
                    ? 'text-emerald'
                    : 'text-amber-400'
                }`}
              >
                [{log.type}]
              </span>
              <span className="text-parchment">{log.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
