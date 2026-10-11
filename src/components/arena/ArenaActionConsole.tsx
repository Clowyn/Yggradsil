import { useState } from 'react';
import { motion } from 'framer-motion';
import { Swords, Sparkles, Backpack, Shield, AlertCircle, Heart, Zap, Crosshair } from 'lucide-react';
import type { CombatArenaParticipant } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';
import { getArenaSpells, getInitialArenaItems, type ArenaSpell, type ArenaItem } from './arenaData';

export interface ExecuteActionPayload {
  actionKind: 'basic_attack' | 'spell' | 'item' | 'defend';
  spell?: ArenaSpell;
  item?: ArenaItem;
}

interface ArenaActionConsoleProps {
  activeCombatant: CombatArenaParticipant | null;
  selectedTarget: CombatArenaParticipant | null;
  canAct: boolean;
  onExecuteAction: (payload: ExecuteActionPayload) => void;
  onEndTurn: () => void;
}

export function ArenaActionConsole({
  activeCombatant,
  selectedTarget,
  canAct,
  onExecuteAction,
  onEndTurn,
}: ArenaActionConsoleProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;

  const [activeTab, setActiveTab] = useState<'attacks' | 'spells' | 'inventory'>('attacks');
  const [items, setItems] = useState<ArenaItem[]>(() => getInitialArenaItems(locale));
  const spells = getArenaSpells(locale);

  const handleUseItem = (item: ArenaItem) => {
    if (item.quantity <= 0) return;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
    );
    onExecuteAction({ actionKind: 'item', item });
  };

  if (!activeCombatant) return null;

  return (
    <div className="w-full arcane-glass rounded-3xl p-5 border border-amber-900/40 bg-[#0d0f17]/95 shadow-2xl backdrop-blur-xl space-y-4">
      {/* Top Banner: Actor & Target status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-cinzel font-bold text-amber-300">
            {activeCombatant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-xs font-bold text-stone-400">
                {t.arena.activeTurn}:
              </span>
              <span className="font-cinzel text-sm font-black text-amber-300">
                {activeCombatant.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-cinzel text-stone-400">
              <span className="text-red-400 flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5" /> {activeCombatant.current_hp}/{activeCombatant.max_hp}
              </span>
              <span className="text-blue-400 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> {activeCombatant.current_mana}/{activeCombatant.max_mana}
              </span>
            </div>
          </div>
        </div>

        {/* Selected target indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10">
          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-cinzel text-stone-400">{t.arena.targetLabel}:</span>
          {selectedTarget ? (
            <span className="font-cinzel text-xs font-bold text-amber-300">
              {selectedTarget.name} (HP: {selectedTarget.current_hp})
            </span>
          ) : (
            <span className="font-cinzel text-xs text-stone-500 italic">
              {t.arena.targetRequired}
            </span>
          )}
        </div>

        {/* End turn button */}
        <button
          type="button"
          disabled={!canAct}
          onClick={onEndTurn}
          className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
            canAct
              ? 'bg-red-600/80 hover:bg-red-500 text-white shadow-lg shadow-red-950/50'
              : 'bg-white/5 text-stone-600 border border-white/5 cursor-not-allowed'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{t.arena.passTurn}</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('attacks')}
          className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'attacks'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
              : 'bg-black/40 text-stone-400 hover:text-stone-200 border border-transparent'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>{t.arena.attacks}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('spells')}
          className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'spells'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
              : 'bg-black/40 text-stone-400 hover:text-stone-200 border border-transparent'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.arena.spells}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-md'
              : 'bg-black/40 text-stone-400 hover:text-stone-200 border border-transparent'
          }`}
        >
          <Backpack className="w-3.5 h-3.5" />
          <span>{t.arena.inventory}</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[140px]">
        {/* 1. Basic Attacks */}
        {activeTab === 'attacks' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="font-cinzel text-xs sm:text-sm font-bold text-stone-200 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.arena.basicStrike}</span>
                </h4>
                <p className="text-[11px] font-cinzel text-stone-400 mt-1">
                  {t.arena.basicAttackDesc}
                </p>
              </div>

              <button
                type="button"
                disabled={!canAct || !selectedTarget}
                onClick={() => onExecuteAction({ actionKind: 'basic_attack' })}
                className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs tracking-wider transition-all shrink-0 cursor-pointer ${
                  canAct && selectedTarget
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-950/40 hover:scale-105'
                    : 'bg-white/5 text-stone-600 border border-white/5 cursor-not-allowed'
                }`}
              >
                {t.arena.rollDice}
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/40 transition-all flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="font-cinzel text-xs sm:text-sm font-bold text-stone-200 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t.arena.defend}</span>
                </h4>
                <p className="text-[11px] font-cinzel text-stone-400 mt-1">
                  {t.arena.defendDesc}
                </p>
              </div>

              <button
                type="button"
                disabled={!canAct}
                onClick={() => onExecuteAction({ actionKind: 'defend' })}
                className={`px-4 py-2 rounded-xl font-cinzel font-bold text-xs tracking-wider transition-all shrink-0 cursor-pointer ${
                  canAct
                    ? 'bg-blue-600/80 hover:bg-blue-500 text-white shadow-lg'
                    : 'bg-white/5 text-stone-600 border border-white/5 cursor-not-allowed'
                }`}
              >
                {t.common.confirm}
              </button>
            </motion.div>
          </div>
        )}

        {/* 2. Spells Grimoire */}
        {activeTab === 'spells' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {spells.map((spell) => {
              const hasMana = activeCombatant.current_mana >= spell.manaCost;

              return (
                <div
                  key={spell.id}
                  className="p-3 rounded-2xl bg-black/40 border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-cinzel text-xs font-bold text-purple-200">
                        {spell.name}
                      </h4>
                      <span className="text-[10px] font-cinzel font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        {spell.manaCost} Mana
                      </span>
                    </div>
                    <p className="text-[11px] font-cinzel text-stone-400 mt-1">
                      {spell.description}
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={!canAct || !hasMana || !selectedTarget}
                      onClick={() => onExecuteAction({ actionKind: 'spell', spell })}
                      className={`px-3 py-1.5 rounded-lg font-cinzel font-bold text-xs tracking-wider transition-all cursor-pointer ${
                        canAct && hasMana && selectedTarget
                          ? 'bg-purple-600/80 hover:bg-purple-500 text-white shadow-md'
                          : 'bg-white/5 text-stone-600 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {t.arena.castSpell}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Inventory Bag */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-cinzel text-xs font-bold text-stone-200">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-cinzel font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      x{item.quantity}
                    </span>
                  </div>
                  <p className="text-[11px] font-cinzel text-stone-400 mt-1">
                    {item.description}
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={!canAct || item.quantity <= 0}
                    onClick={() => handleUseItem(item)}
                    className={`px-3 py-1.5 rounded-lg font-cinzel font-bold text-xs tracking-wider transition-all cursor-pointer ${
                      canAct && item.quantity > 0
                        ? 'bg-emerald-600/80 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-white/5 text-stone-600 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    {t.arena.useItem}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!canAct && (
        <div className="text-[11px] font-cinzel text-stone-500 flex items-center justify-center gap-1.5 pt-1">
          <AlertCircle className="w-3.5 h-3.5 text-stone-600" />
          <span>{t.arena.waitingFor} {activeCombatant.name}...</span>
        </div>
      )}
    </div>
  );
}
