import { motion } from 'framer-motion';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

interface GMMapControlsProps {
  fogRadius: number;
  onFogRadiusChange: (radius: number) => void;
  onResetPositions: () => void;
  showFog: boolean;
  onToggleFog: () => void;
}

export function GMMapControls({
  fogRadius,
  onFogRadiusChange,
  onResetPositions,
  showFog,
  onToggleFog,
}: GMMapControlsProps) {
  return (
    <motion.div
      className="absolute top-4 right-4 z-20 arcane-glass rounded-2xl p-4 min-w-[220px] border border-amber-900/40 bg-[#0e1017]/90 shadow-2xl"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
        <h3 className="text-xs font-cinzel font-bold text-amber-200 uppercase tracking-widest">
          GM CONTROLS
        </h3>
      </div>

      {/* Fog Radius Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-cinzel text-stone-400 uppercase tracking-wider">
            FOG RADIUS
          </label>
          <span className="text-xs font-cinzel font-bold text-amber-400 tabular-nums">
            {fogRadius}px
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={200}
          value={fogRadius}
          onChange={(e) => onFogRadiusChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #b45309 0%, #f59e0b ${((fogRadius - 20) / 180) * 100}%, #222 ${((fogRadius - 20) / 180) * 100}%, #222 100%)`,
          }}
        />
        <div className="flex justify-between text-[9px] font-cinzel text-stone-600 mt-0.5">
          <span>20</span>
          <span>200</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent mb-3" />

      {/* Toggle Fog */}
      <button
        onClick={onToggleFog}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 hover:bg-amber-500/10 border border-amber-900/30 hover:border-amber-500/40 transition-all duration-200 mb-2 cursor-pointer"
      >
        {showFog ? (
          <EyeOff className="w-3.5 h-3.5 text-stone-400" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-amber-400" />
        )}
        <span className="text-[11px] font-cinzel text-stone-300">
          {showFog ? 'Hide Fog (GM View)' : 'Show Fog (Player View)'}
        </span>
      </button>

      {/* Reset Positions */}
      <button
        onClick={onResetPositions}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 hover:bg-rose-950/30 border border-amber-900/30 hover:border-rose-900/40 transition-all duration-200 cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
        <span className="text-[11px] font-cinzel text-stone-300">Reset Positions</span>
      </button>
    </motion.div>
  );
}
