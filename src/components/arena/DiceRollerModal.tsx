import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Sparkles, Skull, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../lib/audio';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

export interface DiceRollResult {
  diceValue: number;
  totalAttack: number;
  isHit: boolean;
  isCrit: boolean;
  isFumble: boolean;
  damage: number;
}

interface DiceRollerModalProps {
  isOpen: boolean;
  actorName: string;
  targetName: string;
  targetAC: number;
  attackBonus?: number;
  baseDamage?: number;
  actionTitle?: string;
  onResolved: (result: DiceRollResult) => void;
  onClose?: () => void;
}

export function DiceRollerModal({
  isOpen,
  actorName,
  targetName,
  targetAC,
  attackBonus = 3,
  baseDamage = 8,
  actionTitle = 'Attack / Spell',
  onResolved,
  onClose,
}: DiceRollerModalProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;

  const [rolling, setRolling] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number>(20);
  const [finalResult, setFinalResult] = useState<DiceRollResult | null>(null);

  const handleRoll = () => {
    if (rolling || finalResult) return;
    setRolling(true);
    playSound('dice_roll');

    let counter = 0;
    const interval = setInterval(() => {
      setDisplayNumber(Math.floor(Math.random() * 20) + 1);
      counter++;
      if (counter > 14) {
        clearInterval(interval);
        // Determine authentic d20 roll
        const rolled = Math.floor(Math.random() * 20) + 1;
        setDisplayNumber(rolled);
        setRolling(false);

        const isCrit = rolled === 20;
        const isFumble = rolled === 1;
        const totalAttack = rolled + attackBonus;
        const isHit = isCrit || (!isFumble && totalAttack >= targetAC);

        // Compute damage (Crit doubles damage)
        const damage = isCrit
          ? baseDamage * 2
          : isHit
          ? baseDamage + Math.floor(Math.random() * 4)
          : 0;

        if (isHit) {
          playSound('sword_hit');
        } else {
          playSound('alert');
        }

        const res: DiceRollResult = {
          diceValue: rolled,
          totalAttack,
          isHit,
          isCrit,
          isFumble,
          damage,
        };

        setFinalResult(res);
      }
    }, 70);
  };

  const handleConfirm = () => {
    if (finalResult) {
      onResolved(finalResult);
      setRolling(false);
      setDisplayNumber(20);
      setFinalResult(null);
    }
  };

  const handleClose = () => {
    setRolling(false);
    setDisplayNumber(20);
    setFinalResult(null);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glass rounded-3xl border border-amber-500/40 w-full max-w-md p-6 text-center space-y-5 shadow-2xl relative bg-[#0d0f17]/95"
        >
          {/* Action Header */}
          <div>
            <span className="text-[10px] font-cinzel uppercase tracking-widest text-amber-400 font-bold block mb-1">
              {actionTitle}
            </span>
            <h3 className="text-lg font-cinzel font-bold text-stone-200">
              <span className="text-[#ffd700]">{actorName}</span> ⚔️{' '}
              <span className="text-red-400">{targetName}</span>
            </h3>
            <p className="text-xs text-stone-400 font-cinzel mt-1">
              Target AC: <strong className="text-amber-300 font-bold">{targetAC}</strong> • Roll Bonus: +{attackBonus}
            </p>
          </div>

          {/* Interactive D20 Die Container */}
          <div className="py-4 flex flex-col items-center justify-center">
            <motion.div
              onClick={handleRoll}
              whileHover={!rolling && !finalResult ? { scale: 1.08 } : {}}
              whileTap={!rolling && !finalResult ? { scale: 0.95 } : {}}
              animate={
                rolling
                  ? {
                      rotateX: [0, 180, 360, 540],
                      rotateY: [0, 240, 480, 720],
                      scale: [1, 1.25, 0.95, 1],
                    }
                  : {}
              }
              transition={rolling ? { repeat: Infinity, duration: 0.5, ease: 'linear' } : {}}
              className={`w-32 h-32 rounded-3xl cursor-pointer flex flex-col items-center justify-center relative shadow-2xl transition-all duration-300 select-none ${
                finalResult?.isCrit
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-300 text-black border-4 border-yellow-200 shadow-[0_0_35px_rgba(255,215,0,0.8)]'
                  : finalResult?.isFumble
                  ? 'bg-gradient-to-br from-red-950 to-red-800 text-red-200 border-4 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                  : finalResult?.isHit
                  ? 'bg-gradient-to-br from-emerald-900 to-emerald-700 text-emerald-100 border-4 border-emerald-400 shadow-[0_0_25px_rgba(34,197,94,0.6)]'
                  : finalResult && !finalResult.isHit
                  ? 'bg-gradient-to-br from-stone-900 to-stone-800 text-stone-400 border-4 border-stone-600'
                  : 'bg-gradient-to-br from-[#1a1c29] via-[#24283b] to-[#12131d] text-[#ffd700] border-2 border-amber-500/50 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              }`}
            >
              {/* D20 Hexagon / Shape background styling */}
              <span className="font-cinzel text-5xl font-black tabular-nums tracking-tighter drop-shadow-md">
                {displayNumber}
              </span>
              <span className="text-[10px] font-cinzel uppercase font-bold tracking-widest mt-1 opacity-80">
                D20
              </span>
            </motion.div>

            {!rolling && !finalResult && (
              <p className="text-xs font-cinzel text-amber-300/80 mt-3 animate-pulse">
                👇 {t.arena.rollDice}
              </p>
            )}
            {rolling && (
              <p className="text-xs font-cinzel text-amber-400 mt-3 animate-pulse">
                🎲 {t.arena.rolling}
              </p>
            )}
          </div>

          {/* Roll Outcome Evaluation */}
          {finalResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2 text-xs font-cinzel"
            >
              {finalResult.isCrit ? (
                <div className="text-amber-300 font-bold text-sm flex items-center justify-center gap-1.5 animate-bounce">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t.arena.critHit}</span>
                </div>
              ) : finalResult.isFumble ? (
                <div className="text-red-400 font-bold text-sm flex items-center justify-center gap-1.5">
                  <Skull className="w-4 h-4 text-red-500" />
                  <span>{t.arena.critMiss}</span>
                </div>
              ) : finalResult.isHit ? (
                <div className="text-emerald-300 font-bold text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {finalResult.totalAttack} vs AC {targetAC} — {t.arena.hitSuccess}
                  </span>
                </div>
              ) : (
                <div className="text-stone-400 font-bold text-sm">
                  {finalResult.totalAttack} vs AC {targetAC} — {t.arena.missed}
                </div>
              )}

              {finalResult.isHit && (
                <div className="text-stone-300">
                  <span className="text-red-400 font-bold text-sm tabular-nums">
                    -{finalResult.damage} HP
                  </span>{' '}
                  {t.arena.damageDealt}
                </div>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {!finalResult ? (
              <button
                type="button"
                onClick={handleRoll}
                disabled={rolling}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-cinzel font-black text-sm tracking-wider shadow-lg shadow-amber-900/40 transition-all cursor-pointer"
              >
                <span className="flex items-center justify-center gap-2">
                  <Dices className="w-4 h-4" />
                  <span>{rolling ? t.arena.rolling : t.arena.rollDice}</span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cinzel font-bold text-sm tracking-wider shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
              >
                {t.common.confirm}
              </button>
            )}

            {onClose && !rolling && (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-stone-200 font-cinzel text-xs font-bold transition-all cursor-pointer"
              >
                {t.common.close}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
