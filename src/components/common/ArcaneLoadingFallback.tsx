interface ArcaneLoadingFallbackProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export function ArcaneLoadingFallback({
  message = 'COMMUNING WITH REALM...',
  subMessage = 'Attuning ancient grimoires & celestial alignments',
  fullScreen = false,
}: ArcaneLoadingFallbackProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-[#08090c] arcane-bg'
    : 'flex h-full min-h-[320px] w-full items-center justify-center p-6';

  return (
    <div className={containerClass} role="status" aria-live="polite">
      {/* Background radial hearth glow */}
      <div className="absolute w-72 h-72 rounded-full bg-amber-600/10 blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-5 text-center z-10 max-w-sm px-4">
        {/* Arcane Rune Ring Spinner */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          {/* Outer arcane dashed rotating ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/30 animate-spin-slow" />

          {/* Middle counter-rotating accent ring */}
          <div className="absolute inset-1.5 rounded-full border border-amber-500/20 border-t-amber-400 border-r-amber-400/60 animate-spin" />

          {/* Inner pulsating ember hearth */}
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse" />

          {/* Central gold speck */}
          <div className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
        </div>

        {/* Arcane Text & Status Indicator */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-xs sm:text-sm font-cinzel text-amber-200 tracking-[0.25em] uppercase font-bold text-gold-gradient">
              {message}
            </h2>
          </div>
          {subMessage && (
            <p className="text-[11px] font-inter text-stone-400/80 tracking-wide font-normal max-w-xs">
              {subMessage}
            </p>
          )}
        </div>

        {/* Minimal Arcane Progress Bar Glow */}
        <div className="w-32 h-0.5 bg-neutral-900 rounded-full overflow-hidden border border-amber-900/30">
          <div className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full w-2/3 animate-[pulse_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
