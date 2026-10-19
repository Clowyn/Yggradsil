import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Sparkles, Skull, CheckCircle2, Swords, Shield } from 'lucide-react';
import { playSound } from '../../lib/audio';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';
import { PolyhedralDice3D } from '../common/PolyhedralDice3D';

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
  const [rollId, setRollId] = useState<number>(0);
  const [finalResult, setFinalResult] = useState<DiceRollResult | null>(null);
  const rollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rollTimeoutRef.current) {
        window.clearTimeout(rollTimeoutRef.current);
      }
    };
  }, []);

  const handleRoll = () => {
    if (rolling || finalResult) return;

    // Determine authentic d20 roll upfront so the 3D icosahedron tumbles onto the exact face
    const rolled = Math.floor(Math.random() * 20) + 1;
    setDisplayNumber(rolled);
    setRollId((prev) => prev + 1);
    setRolling(true);
    playSound('dice_roll');

    if (rollTimeoutRef.current) {
      window.clearTimeout(rollTimeoutRef.current);
    }

    rollTimeoutRef.current = window.setTimeout(() => {
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

      if (isCrit) {
        playSound('unlock');
        playSound('sword_hit');
      } else if (isHit) {
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
    }, 760);
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
    if (rollTimeoutRef.current) {
      window.clearTimeout(rollTimeoutRef.current);
    }
    setRolling(false);
    setDisplayNumber(20);
    setFinalResult(null);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          data-testid="arena-dice-roller-modal"
          className="double-bezel w-full max-w-md max-h-[92dvh] overflow-y-auto shadow-[0_0_60px_rgba(0,0,0,0.95)] relative"
        >
          <div className="double-bezel-core p-5 sm:p-6 text-center space-y-5 relative overflow-hidden">
            {/* Ambient radial glow based on roll state */}
            <div
              className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                finalResult?.isCrit
                  ? 'bg-[radial-gradient(circle_at_50%_42%,rgba(250,204,21,0.22),transparent_70%)] opacity-100'
                  : finalResult?.isFumble
                  ? 'bg-[radial-gradient(circle_at_50%_42%,rgba(239,68,68,0.22),transparent_70%)] opacity-100'
                  : finalResult?.isHit
                  ? 'bg-[radial-gradient(circle_at_50%_42%,rgba(16,185,129,0.16),transparent_70%)] opacity-100'
                  : 'bg-[radial-gradient(circle_at_50%_42%,rgba(245,158,11,0.10),transparent_70%)] opacity-100'
              }`}
            />

            {/* Action Header */}
            <div className="relative z-10">
              <span className="text-[10px] font-cinzel uppercase tracking-[0.22em] text-amber-400 font-bold block mb-1.5">
                {actionTitle}
              </span>
              <h3 className="text-base sm:text-lg font-cinzel font-bold text-stone-200 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[#ffd700]">{actorName}</span>
                <Swords className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-red-400">{targetName}</span>
              </h3>
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-stone-400 font-cinzel">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 border border-amber-900/35">
                  <Shield className="w-3 h-3 text-amber-400" />
                  Target AC: <strong className="text-amber-300 font-bold">{targetAC}</strong>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 border border-amber-900/35">
                  Bonus: <strong className="text-emerald-300 font-bold">+{attackBonus}</strong>
                </span>
              </div>
            </div>

            {/* Authentic 3D 20-Sided Regular Icosahedron (d20) Stage */}
            <div className="py-3 flex flex-col items-center justify-center relative z-10">
              <div className="p-4 rounded-3xl bg-gradient-to-b from-[#090b11]/90 to-[#111522]/90 border border-amber-900/30 shadow-inner flex flex-col items-center justify-center min-w-[210px]">
                <PolyhedralDice3D
                  dieType="d20"
                  rolling={rolling}
                  value={displayNumber}
                  rollId={rollId}
                  isCrit={Boolean(finalResult?.isCrit)}
                  isFumble={Boolean(finalResult?.isFumble)}
                  isKept={Boolean(finalResult)}
                  size={134}
                  onClick={handleRoll}
                  testId="arena-polyhedral-die-3d"
                  subLabel={
                    finalResult
                      ? `${finalResult.diceValue} + ${attackBonus} = ${finalResult.totalAttack}`
                      : 'ATTACK D20'
                  }
                />
              </div>

              {!rolling && !finalResult && (
                <p className="text-xs font-cinzel text-amber-300/80 mt-3 animate-pulse">
                  {t.arena.rollDice}
                </p>
              )}
              {rolling && (
                <p className="text-xs font-cinzel text-amber-400 mt-3 animate-pulse">
                  {t.arena.rolling}
                </p>
              )}
            </div>

            {/* Roll Outcome Evaluation */}
            {finalResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-black/65 border border-amber-900/35 space-y-2 text-xs font-cinzel relative z-10"
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
            <div className="flex items-center justify-center gap-3 pt-1 relative z-10">
              {!finalResult ? (
                <button
                  type="button"
                  data-testid="arena-roll-d20-btn"
                  onClick={handleRoll}
                  disabled={rolling}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-60 text-black font-cinzel font-black text-sm tracking-wider shadow-lg shadow-amber-900/40 transition-all cursor-pointer"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Dices className="w-4 h-4" />
                    <span>{rolling ? t.arena.rolling : t.arena.rollDice}</span>
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  data-testid="arena-confirm-roll-btn"
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
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
