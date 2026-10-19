import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import {
  subscribeToToasts,
  dismissToast,
  type ArcaneToastItem,
  type ToastType,
} from '../../lib/toast';

const TOAST_STYLES: Record<
  ToastType,
  {
    border: string;
    bg: string;
    glow: string;
    iconColor: string;
    titleColor: string;
    defaultTitle: string;
    Icon: typeof Sparkles;
  }
> = {
  success: {
    border: 'border-emerald-500/45',
    bg: 'from-[#091f15]/95 via-[#0b1318]/95 to-[#090b10]/95',
    glow: 'shadow-[0_12px_36px_rgba(0,0,0,0.75),0_0_20px_rgba(16,185,129,0.2)]',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-300',
    defaultTitle: 'ARCANE DECREE FULFILLED',
    Icon: CheckCircle2,
  },
  error: {
    border: 'border-rose-500/50',
    bg: 'from-[#240b11]/95 via-[#140a10]/95 to-[#090b10]/95',
    glow: 'shadow-[0_12px_36px_rgba(0,0,0,0.75),0_0_22px_rgba(244,63,94,0.25)]',
    iconColor: 'text-rose-400',
    titleColor: 'text-rose-300',
    defaultTitle: 'WARDING SEAL REJECTED',
    Icon: ShieldAlert,
  },
  warning: {
    border: 'border-amber-500/50',
    bg: 'from-[#241909]/95 via-[#14100b]/95 to-[#090b10]/95',
    glow: 'shadow-[0_12px_36px_rgba(0,0,0,0.75),0_0_20px_rgba(245,158,11,0.22)]',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-300',
    defaultTitle: 'OMEN OF CAUTION',
    Icon: AlertTriangle,
  },
  info: {
    border: 'border-amber-400/40',
    bg: 'from-[#1a1528]/95 via-[#0e1018]/95 to-[#090b10]/95',
    glow: 'shadow-[0_12px_36px_rgba(0,0,0,0.75),0_0_20px_rgba(251,191,36,0.18)]',
    iconColor: 'text-amber-300',
    titleColor: 'text-amber-200',
    defaultTitle: 'CHRONICLE WHISPER',
    Icon: Sparkles,
  },
};

export function ArcaneToastContainer() {
  const [toasts, setToasts] = useState<ArcaneToastItem[]>([]);

  useEffect(() => {
    return subscribeToToasts(setToasts);
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((item) => {
          const style = TOAST_STYLES[item.type] || TOAST_STYLES.info;
          const IconComponent = style.Icon;

          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.94 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`pointer-events-auto relative overflow-hidden rounded-xl border ${style.border} bg-gradient-to-br ${style.bg} ${style.glow} p-3.5 backdrop-blur-md`}
              role="status"
              data-testid="arcane-toast"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shrink-0 ${style.iconColor}`}
                >
                  <IconComponent size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[10px] font-cinzel font-bold uppercase tracking-widest ${style.titleColor}`}
                  >
                    {item.title || style.defaultTitle}
                  </div>
                  <p className="mt-0.5 text-xs font-inter text-stone-200 leading-relaxed break-words">
                    {item.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(item.id)}
                  className="text-stone-400 hover:text-amber-200 transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
