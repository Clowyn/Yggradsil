import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  RotateCcw,
  FolderOpen,
  ShieldAlert,
  Sparkles,
  BrickWall,
  ScanEye,
  Trash2,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MapMovementMode } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

interface GMMapControlsProps {
  fogRadius: number;
  onFogRadiusChange: (radius: number) => void;
  onResetPositions: () => void;
  showFog: boolean;
  onToggleFog: () => void;
  movementMode: MapMovementMode;
  onToggleMovementMode: (mode: MapMovementMode) => void;
  onResetFog: () => void;
  onOpenMapLibrary: () => void;
  activeMapName: string;
  pendingRequestsCount?: number;
  losEnabled?: boolean;
  onToggleLos?: () => void;
  isWallDrawMode?: boolean;
  onToggleWallDrawMode?: () => void;
  wallCount?: number;
  onLoadPresetWalls?: () => void;
  onClearWalls?: () => void;
}

export function GMMapControls({
  fogRadius,
  onFogRadiusChange,
  onResetPositions,
  showFog,
  onToggleFog,
  movementMode,
  onToggleMovementMode,
  onResetFog,
  onOpenMapLibrary,
  activeMapName,
  pendingRequestsCount = 0,
  losEnabled = true,
  onToggleLos,
  isWallDrawMode = false,
  onToggleWallDrawMode,
  wallCount = 0,
  onLoadPresetWalls,
  onClearWalls,
}: GMMapControlsProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div
      className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-20 arcane-glass rounded-2xl p-3 sm:p-4 border border-amber-900/40 bg-[#0e1017]/95 shadow-2xl backdrop-blur-xl transition-all ${
        isCollapsed ? 'min-w-[180px]' : 'min-w-[250px] sm:min-w-[270px] max-w-[calc(100vw-32px)] sm:max-w-[300px]'
      }`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      {/* Title & Active Map badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
          <h3 className="text-xs font-cinzel font-bold text-amber-200 uppercase tracking-widest">
            {t.map.gmControls}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {!isCollapsed && (
            <button
              type="button"
              onClick={onOpenMapLibrary}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[10px] font-bold font-cinzel transition-all cursor-pointer shadow-sm"
              title={t.map.mapLibrary}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>{t.map.mapLibrary}</span>
            </button>
          )}
          <button
            type="button"
            data-testid="gm-map-controls-collapse-btn"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 text-amber-300 cursor-pointer"
            title={isCollapsed ? 'Expand GM Controls' : 'Minimize GM Controls'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3">
          <div className="text-[11px] font-cinzel text-amber-300/80 mb-3 px-2 py-1 rounded bg-black/40 border border-white/5 truncate">
            <span className="text-stone-400 mr-1">{t.map.activeMap}:</span>
            <span className="font-bold">{activeMapName}</span>
          </div>

      {/* Movement Mode Toggle */}
      <div className="mb-3.5">
        <label className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider block mb-1">
          {t.map.movementMode}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => onToggleMovementMode('free')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-cinzel font-bold transition-all text-center cursor-pointer ${
              movementMode === 'free'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t.map.freeExploration}
          </button>
          <button
            type="button"
            onClick={() => onToggleMovementMode('approved')}
            className={`relative py-1.5 px-2 rounded-lg text-[10px] font-cinzel font-bold transition-all text-center cursor-pointer ${
              movementMode === 'approved'
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {t.map.gmApprovedMode}
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic LoS & Wall Architecture Controls */}
      <div className="mb-3.5 p-2.5 rounded-xl bg-black/40 border border-amber-900/25 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <ScanEye className="w-3.5 h-3.5 text-amber-400" />
            {locale === 'tr' ? 'Dinamik Görüş (LoS)' : 'Dynamic LoS & Walls'}
          </span>
          <span
            data-testid="map-wall-count"
            className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20"
          >
            {wallCount} {locale === 'tr' ? 'Duvar' : 'Walls'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {onToggleLos && (
            <button
              type="button"
              data-testid="map-los-toggle"
              onClick={onToggleLos}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-cinzel font-bold border transition-all cursor-pointer ${
                losEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200'
              }`}
            >
              <ScanEye className="w-3 h-3" />
              <span>{losEnabled ? 'LoS ON' : 'LoS OFF'}</span>
            </button>
          )}

          {onToggleWallDrawMode && (
            <button
              type="button"
              data-testid="map-wall-draw-toggle"
              onClick={onToggleWallDrawMode}
              className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-[10px] font-cinzel font-bold border transition-all cursor-pointer ${
                isWallDrawMode
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-white/5 border-white/10 text-stone-400 hover:text-stone-200'
              }`}
            >
              <BrickWall className="w-3 h-3" />
              <span>{locale === 'tr' ? 'Duvar Çiz' : 'Draw Wall'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {onLoadPresetWalls && (
            <button
              type="button"
              data-testid="map-preset-walls-btn"
              onClick={onLoadPresetWalls}
              className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-[9px] font-cinzel text-stone-300 transition-all cursor-pointer"
            >
              <LayoutGrid className="w-3 h-3 text-amber-400" />
              <span>{locale === 'tr' ? 'Zindan Şablonu' : 'Preset Walls'}</span>
            </button>
          )}
          {onClearWalls && (
            <button
              type="button"
              data-testid="map-clear-walls-btn"
              onClick={onClearWalls}
              className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-[9px] font-cinzel text-stone-300 hover:text-rose-300 transition-all cursor-pointer"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>{locale === 'tr' ? 'Duvarları Sil' : 'Clear Walls'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Fog Radius Slider */}
      <div className="mb-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider">
            {t.map.fogRadius}
          </label>
          <span className="text-xs font-cinzel font-bold text-amber-400 tabular-nums">
            {fogRadius}px
          </span>
        </div>
        <input
          type="range"
          min={30}
          max={250}
          value={fogRadius}
          onChange={(e) => onFogRadiusChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #b45309 0%, #f59e0b ${((fogRadius - 30) / 220) * 100}%, #222 ${((fogRadius - 30) / 220) * 100}%, #222 100%)`,
          }}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent mb-3" />

      {/* Toggle Fog & Reset Fog */}
      <div className="space-y-1.5 mb-2">
        <button
          type="button"
          data-testid="map-fog-toggle"
          onClick={onToggleFog}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-amber-500/10 border border-amber-900/30 hover:border-amber-500/40 transition-all duration-200 cursor-pointer"
        >
          {showFog ? (
            <EyeOff className="w-3.5 h-3.5 text-stone-400" />
          ) : (
            <Eye className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="text-[11px] font-cinzel text-stone-300">
            {showFog ? t.map.toggleFogGm : t.map.toggleFogPlayer}
          </span>
        </button>

        <button
          type="button"
          onClick={onResetFog}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-amber-500/10 border border-amber-900/30 hover:border-amber-500/40 transition-all duration-200 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[11px] font-cinzel text-stone-300">{t.map.resetFog}</span>
        </button>
      </div>

      {/* Reset Positions */}
      <button
        type="button"
        onClick={onResetPositions}
        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-rose-950/30 border border-amber-900/30 hover:border-rose-900/40 transition-all duration-200 cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
        <span className="text-[11px] font-cinzel text-stone-300">{t.map.resetPositions}</span>
      </button>

      {/* Pending Movement Alert if any */}
      {pendingRequestsCount > 0 && (
        <div className="mt-3 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-[10px] font-cinzel">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>
            {pendingRequestsCount} {t.map.pendingMoves}
          </span>
        </div>
      )}
        </div>
      )}
    </motion.div>
  );
}
