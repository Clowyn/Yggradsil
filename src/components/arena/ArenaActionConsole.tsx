import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Sparkles, Backpack, Shield, AlertCircle, Heart, Zap, Crosshair, Loader2 } from 'lucide-react';
import type { CombatArenaParticipant } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';
import {
  fetchCombatantSpells,
  fetchCombatantInventory,
  consumeCombatantItem,
  type ArenaSpell,
  type ArenaItem,
} from './arenaData';

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
  const isTr = locale === 'tr';

  const [activeTab, setActiveTab] = useState<'attacks' | 'spells' | 'inventory'>('attacks');
  const [spells, setSpells] = useState<ArenaSpell[]>([]);
  const [items, setItems] = useState<ArenaItem[]>([]);
  const [loadingSpells, setLoadingSpells] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  // Dynamically load active combatant's spells from Spell Tree and items from Inventory
  useEffect(() => {
    let isMounted = true;
    const combatant = activeCombatant;
    if (!combatant) return;

    Promise.resolve().then(() => {
      if (isMounted) {
        setLoadingSpells(true);
        setLoadingItems(true);
      }
    });

    fetchCombatantSpells(combatant, locale)
      .then((res) => {
        if (isMounted) {
          setSpells(res);
          setLoadingSpells(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingSpells(false);
      });

    fetchCombatantInventory(combatant, locale)
      .then((res) => {
        if (isMounted) {
          setItems(res);
          setLoadingItems(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingItems(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCombatant, locale]);

  const handleUseItem = async (item: ArenaItem) => {
    if (item.quantity <= 0) return;

    // Decrement local inventory quantity
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i))
    );

    // Persist consumption to character's real inventory in Supabase
    await consumeCombatantItem(item, activeCombatant);

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
          <span>{t.arena.spells} ({spells.length})</span>
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
          <span>{t.arena.inventory} ({items.length})</span>
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
                data-testid="arena-basic-attack-btn"
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

        {/* 2. Spells Grimoire (From Spell Tree / Character Spells) */}
        {activeTab === 'spells' && (
          <div>
            {loadingSpells ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2 text-stone-400 font-cinzel text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                <span>{isTr ? 'Büyü Ağacı taranıyor ve büyüler kuşanılıyor...' : 'Attuning to Spell Tree & loading spells...'}</span>
              </div>
            ) : spells.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/40 border border-dashed border-white/10 space-y-2">
                <Sparkles className="w-8 h-8 text-stone-500 mx-auto" />
                <p className="font-cinzel text-xs text-stone-400 font-bold">
                  {isTr ? 'Bu karakterin Büyü Ağacında henüz açık büyüsü bulunmuyor.' : 'No unlocked spells found in this character\'s Spell Tree.'}
                </p>
                <p className="text-[11px] font-inter text-stone-500">
                  {isTr ? 'Büyü Kitabından (Spell Tree) büyülerin kilidini açabilirsiniz.' : 'You can unlock spells from the Spell Tree page.'}
                </p>
              </div>
            ) : (
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
                          <h4 className="font-cinzel text-xs font-bold text-purple-200 flex items-center gap-1.5">
                            <span>{spell.icon || '✨'}</span>
                            <span>{spell.name}</span>
                          </h4>
                          <span className="text-[10px] font-cinzel font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                            {spell.manaCost} Mana
                          </span>
                        </div>
                        <p className="text-[11px] font-cinzel text-stone-400 mt-1">
                          {spell.description}
                        </p>
                        {spell.tier && (
                          <div className="mt-1 flex items-center gap-2 text-[9px] font-cinzel text-stone-500">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase">
                              Kademe {spell.tier}
                            </span>
                            <span className="uppercase text-purple-400">
                              {spell.type === 'heal' ? 'Şifa' : spell.type === 'buff' ? 'Kalkan' : 'Saldırı'}
                            </span>
                          </div>
                        )}
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
          </div>
        )}

        {/* 3. Inventory Bag (From Real Inventory / Adventurer Pack) */}
        {activeTab === 'inventory' && (
          <div>
            {loadingItems ? (
              <div className="flex flex-col items-center justify-center p-8 gap-2 text-stone-400 font-cinzel text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                <span>{isTr ? 'Maceracı çantası ve envanter taranıyor...' : 'Opening adventurer pack & loading inventory...'}</span>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-black/40 border border-dashed border-white/10 space-y-2">
                <Backpack className="w-8 h-8 text-stone-500 mx-auto" />
                <p className="font-cinzel text-xs text-stone-400 font-bold">
                  {isTr ? 'Bu karakterin çantasında kullanılabilir iksir veya eşya bulunmuyor.' : 'No usable potions or items in this character\'s inventory.'}
                </p>
                <p className="text-[11px] font-inter text-stone-500">
                  {isTr ? 'Envanter (Inventory) sayfasından çantanıza eşya ekleyebilirsiniz.' : 'You can acquire and manage items from the Inventory page.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-black/40 border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-cinzel text-xs font-bold text-stone-200 flex items-center gap-1.5">
                          <span>{item.icon || '🧪'}</span>
                          <span>{item.name}</span>
                        </h4>
                        <span className="text-[10px] font-cinzel font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          x{item.quantity}
                        </span>
                      </div>
                      <p className="text-[11px] font-cinzel text-stone-400 mt-1">
                        {item.description}
                      </p>
                      {item.isDbItem && (
                        <div className="mt-1">
                          <span className="text-[9px] font-cinzel text-emerald-400/80 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                            {isTr ? 'Canlı Envanter' : 'Live Inventory'}
                          </span>
                        </div>
                      )}
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
