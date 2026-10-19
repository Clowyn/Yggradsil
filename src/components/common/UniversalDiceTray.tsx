import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, X, Sparkles, Skull, Plus, Minus, RotateCcw, Trash2, EyeOff } from 'lucide-react';
import {
  subscribeToDiceTray,
  closeDiceTray,
  updateDiceTrayConfig,
  triggerDiceRoll,
  clearDiceHistory,
  DIE_MAX,
  type DiceTrayState,
  type DieType,
  type RollMode,
} from '../../lib/diceRoller';
import { useAuth } from '../../contexts/AuthContext';
import { playSound } from '../../lib/audio';

const DICE_TYPES: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

export function UniversalDiceTray() {
  const { locale, isGM } = useAuth();
  const isTr = locale === 'tr';

  const [state, setState] = useState<DiceTrayState>({
    isOpen: false,
    rolling: false,
    selectedDie: 'd20',
    count: 1,
    modifier: 0,
    mode: 'normal',
    activeLabel: 'Arcane Roll',
    isSecretRoll: false,
    currentResult: null,
    history: [],
  });

  const [animNumber, setAnimNumber] = useState<number>(20);

  useEffect(() => {
    return subscribeToDiceTray(setState);
  }, []);

  useEffect(() => {
    if (!state.rolling) return;
    const max = DIE_MAX[state.selectedDie] || 20;
    const interval = setInterval(() => {
      setAnimNumber(Math.floor(Math.random() * max) + 1);
    }, 55);
    return () => clearInterval(interval);
  }, [state.rolling, state.selectedDie]);

  if (!state.isOpen) return null;

  const current = state.currentResult;
  const displayValue = state.rolling
    ? animNumber
    : current
    ? current.total
    : DIE_MAX[state.selectedDie];

  const handleSelectDie = (die: DieType) => {
    playSound('lock_click');
    updateDiceTrayConfig({
      selectedDie: die,
      activeLabel: `${state.count}${die}${state.modifier >= 0 ? (state.modifier > 0 ? `+${state.modifier}` : '') : state.modifier}`,
    });
  };

  const handleSelectMode = (mode: RollMode) => {
    playSound('lock_click');
    updateDiceTrayConfig({ mode });
  };

  const handleRollClick = () => {
    const modPart = state.modifier > 0 ? `+${state.modifier}` : state.modifier < 0 ? `${state.modifier}` : '';
    const customLabel =
      state.activeLabel && state.activeLabel !== 'Arcane Roll'
        ? state.activeLabel
        : `${state.count}${state.selectedDie}${modPart}`;

    triggerDiceRoll({
      dieType: state.selectedDie,
      count: state.count,
      modifier: state.modifier,
      mode: state.mode,
      label: customLabel,
      isSecretRoll: state.isSecretRoll,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2 }}
          className="arcane-glass rounded-3xl border border-amber-500/40 bg-[#0c0e15]/95 w-full max-w-lg p-5 sm:p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden"
        >
          {/* Top Hairline */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300">
                <Dices size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-cinzel font-extrabold text-amber-100 tracking-wider uppercase">
                  {isTr ? 'KADİM ZAR TEPSİSİ' : 'UNIVERSAL DICE TRAY'}
                </h3>
                <p className="text-[10px] font-cinzel text-amber-300/70 uppercase tracking-widest">
                  {state.activeLabel}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('lock_click');
                closeDiceTray();
              }}
              className="p-2 rounded-xl border border-amber-900/30 bg-black/40 text-stone-400 hover:text-amber-200 hover:border-amber-500/40 transition-colors cursor-pointer"
              aria-label="Close Dice Tray"
            >
              <X size={16} />
            </button>
          </div>

          {/* Polyhedral Die Selector (d4 .. d100) */}
          <div className="mt-4">
            <div className="text-[10px] font-cinzel text-amber-200/60 uppercase tracking-widest mb-2 font-semibold">
              {isTr ? 'ZAR TÜRÜ SEÇİN' : 'SELECT POLYHEDRAL DIE'}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {DICE_TYPES.map((die) => {
                const active = state.selectedDie === die;
                return (
                  <button
                    key={die}
                    type="button"
                    onClick={() => handleSelectDie(die)}
                    className={`py-2 rounded-xl font-cinzel text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                      active
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
                        : 'bg-black/50 border-amber-900/30 text-stone-400 hover:text-amber-200 hover:border-amber-500/30'
                    }`}
                  >
                    {die}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Roll Mode (Normal / Advantage / Disadvantage) & Modifiers */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode Selector */}
            <div className="bg-black/40 p-2 rounded-xl border border-amber-900/25 flex items-center justify-between gap-1">
              {(['normal', 'advantage', 'disadvantage'] as RollMode[]).map((m) => {
                const active = state.mode === m;
                const label =
                  m === 'normal'
                    ? isTr
                      ? 'Normal'
                      : 'Normal'
                    : m === 'advantage'
                    ? isTr
                      ? 'Avantaj'
                      : 'Advantage'
                    : isTr
                    ? 'Dezavantaj'
                    : 'Disadv.';
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectMode(m)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-cinzel font-bold uppercase transition-all cursor-pointer ${
                      active
                        ? m === 'advantage'
                          ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50'
                          : m === 'disadvantage'
                          ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50'
                          : 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Quantity & Bonus Controls */}
            <div className="bg-black/40 p-2 rounded-xl border border-amber-900/25 flex items-center justify-between gap-3">
              {/* Count */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-cinzel text-stone-400 uppercase">
                  {isTr ? 'Adet:' : 'Qty:'}
                </span>
                <button
                  type="button"
                  onClick={() => updateDiceTrayConfig({ count: Math.max(1, state.count - 1) })}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-amber-200 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="text-xs font-cinzel font-bold text-amber-200 w-4 text-center">
                  {state.count}
                </span>
                <button
                  type="button"
                  onClick={() => updateDiceTrayConfig({ count: Math.min(10, state.count + 1) })}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-amber-200 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>

              <div className="h-4 w-px bg-amber-900/30" />

              {/* Modifier */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-cinzel text-stone-400 uppercase">
                  {isTr ? 'Bonus:' : 'Mod:'}
                </span>
                <button
                  type="button"
                  onClick={() => updateDiceTrayConfig({ modifier: state.modifier - 1 })}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-amber-200 cursor-pointer"
                >
                  <Minus size={11} />
                </button>
                <span className="text-xs font-cinzel font-bold text-amber-300 w-7 text-center">
                  {state.modifier >= 0 ? `+${state.modifier}` : state.modifier}
                </span>
                <button
                  type="button"
                  onClick={() => updateDiceTrayConfig({ modifier: state.modifier + 1 })}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-amber-200 cursor-pointer"
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Center Interactive Die Emblem */}
          <div className="my-5 flex flex-col items-center justify-center">
            <motion.button
              type="button"
              onClick={handleRollClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={
                state.rolling
                  ? {
                      rotate: [0, 120, 240, 360],
                      scale: [1, 1.15, 0.95, 1],
                    }
                  : {}
              }
              transition={state.rolling ? { repeat: Infinity, duration: 0.4, ease: 'linear' } : {}}
              className={`w-28 h-28 rounded-3xl flex flex-col items-center justify-center cursor-pointer select-none border-2 transition-all relative ${
                current?.isCrit
                  ? 'bg-gradient-to-br from-amber-500 to-yellow-300 text-black border-yellow-200 shadow-[0_0_35px_rgba(255,215,0,0.75)]'
                  : current?.isFumble
                  ? 'bg-gradient-to-br from-rose-950 to-red-800 text-rose-100 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.7)]'
                  : 'bg-gradient-to-br from-[#1b1f2e] via-[#121521] to-[#090b10] text-amber-300 border-amber-500/50 hover:border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
              }`}
            >
              <span className="font-cinzel text-4xl font-black tabular-nums tracking-tight">
                {displayValue}
              </span>
              <span className="text-[10px] font-cinzel uppercase font-bold tracking-widest mt-1 opacity-80">
                {state.count}{state.selectedDie}
                {state.modifier > 0 ? `+${state.modifier}` : state.modifier < 0 ? state.modifier : ''}
              </span>
            </motion.button>

            {/* Current Result Breakdown */}
            {current && !state.rolling && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center space-y-1"
              >
                {current.isCrit && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-cinzel font-bold">
                    <Sparkles size={13} />
                    <span>{isTr ? 'DOĞAL 20 — KRİTİK BAŞARI!' : 'NATURAL 20 — CRITICAL SUCCESS!'}</span>
                  </div>
                )}
                {current.isFumble && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-cinzel font-bold">
                    <Skull size={13} />
                    <span>{isTr ? 'DOĞAL 1 — KRİTİK BAŞARISIZLIK!' : 'NATURAL 1 — CRITICAL FUMBLE!'}</span>
                  </div>
                )}
                <div className="text-xs font-cinzel text-stone-300">
                  <span className="text-amber-200 font-bold">{current.label}:</span>{' '}
                  <span>
                    [{current.rolls.join(', ')}]
                    {current.discardedRoll !== undefined && (
                      <span className="text-stone-500 ml-1">
                        ({isTr ? 'elenen:' : 'dropped:'} {current.discardedRoll})
                      </span>
                    )}
                  </span>
                  {current.modifier !== 0 && (
                    <span className="text-amber-400 ml-1">
                      {current.modifier >= 0 ? `+ ${current.modifier}` : `- ${Math.abs(current.modifier)}`}
                    </span>
                  )}{' '}
                  ={' '}
                  <strong className="text-amber-300 text-sm font-extrabold">{current.total}</strong>
                </div>
              </motion.div>
            )}
          </div>

          {/* GM Secret Roll Toggle */}
          {isGM && (
            <div className="mb-3 flex items-center justify-center">
              <button
                type="button"
                data-testid="dice-secret-roll-toggle"
                onClick={() => {
                  playSound('lock_click');
                  updateDiceTrayConfig({ isSecretRoll: !state.isSecretRoll });
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-cinzel font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                  state.isSecretRoll
                    ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'bg-black/40 border-white/10 text-stone-400 hover:text-stone-200'
                }`}
              >
                <EyeOff size={13} className={state.isSecretRoll ? 'text-purple-300' : 'text-stone-500'} />
                <span>
                  {state.isSecretRoll
                    ? isTr
                      ? 'GM Gizli Zar Aktif (Oyuncular Göremez)'
                      : 'GM Secret Roll Active (Hidden from Players)'
                    : isTr
                    ? 'GM Gizli Zar (Kapalı)'
                    : 'GM Secret Roll (Off)'}
                </span>
              </button>
            </div>
          )}

          {/* Primary Roll Action Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="dice-cast-btn"
              onClick={handleRollClick}
              disabled={state.rolling}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-cinzel font-black text-xs sm:text-sm tracking-wider uppercase shadow-lg shadow-amber-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw size={15} />
              <span>{state.rolling ? (isTr ? 'ZAR ATILIYOR...' : 'ROLLING...') : (isTr ? 'ZARI AT' : 'CAST DICE')}</span>
            </button>
            {state.history.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  playSound('paper_flip');
                  clearDiceHistory();
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-400 hover:text-rose-300 transition-colors cursor-pointer"
                title={isTr ? 'Geçmişi Temizle' : 'Clear Roll History'}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>

          {/* Roll History Stream */}
          {state.history.length > 0 && (
            <div className="mt-4 pt-3 border-t border-amber-900/25">
              <div className="text-[10px] font-cinzel text-amber-200/60 uppercase tracking-widest mb-2 font-semibold">
                {isTr ? 'SON ATILAN ZARLAR' : 'RECENT ROLL LOG'}
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 no-scrollbar">
                {state.history.map((h) => (
                  <div
                    key={h.id}
                    className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-900/20 flex items-center justify-between text-xs font-cinzel"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-stone-500">{h.timestamp}</span>
                      <span className="text-amber-100 font-semibold truncate">{h.label}</span>
                      <span className="text-[10px] text-stone-400">
                        ({h.count}{h.dieType}
                        {h.modifier > 0 ? `+${h.modifier}` : h.modifier < 0 ? h.modifier : ''})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-stone-400">[{h.rolls.join(',')}]</span>
                      <span
                        className={`font-extrabold px-2 py-0.5 rounded-md border ${
                          h.isCrit
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                            : h.isFumble
                            ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                            : 'bg-amber-950/40 border-amber-900/40 text-amber-200'
                        }`}
                      >
                        {h.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
