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
      className="absolute top-4 right-4 z-20 glass rounded-xl p-4 min-w-[220px]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" />
        <h3 className="text-xs font-cinzel font-bold text-[#ffd700] uppercase tracking-widest">
          GM Controls
        </h3>
      </div>

      {/* Fog Radius Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] text-gray-400 uppercase tracking-wider">
            Fog Radius
          </label>
          <span className="text-xs font-bold text-emerald-400 tabular-nums">
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
            background: `linear-gradient(to right, #10b981 0%, #ffd700 ${((fogRadius - 20) / 180) * 100}%, #333 ${((fogRadius - 20) / 180) * 100}%, #333 100%)`,
          }}
        />
        <div className="flex justify-between text-[9px] text-gray-600 mt-0.5">
          <span>20</span>
          <span>200</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />

      {/* Toggle Fog */}
      <button
        onClick={onToggleFog}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-200 mb-2"
      >
        {showFog ? (
          <EyeOff className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span className="text-xs text-gray-300">
          {showFog ? 'Hide Fog (GM View)' : 'Show Fog (Player View)'}
        </span>
      </button>

      {/* Reset Positions */}
      <button
        onClick={onResetPositions}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-crimson/20 border border-white/5 hover:border-crimson/30 transition-all duration-200"
      >
        <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-xs text-gray-300">Reset Positions</span>
      </button>
    </motion.div>
  );
}
