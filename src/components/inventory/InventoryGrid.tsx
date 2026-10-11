import { useState, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Backpack, Shield, Coins, Users, Feather, ArrowRightLeft, Info } from 'lucide-react';

import { ItemCard, type InventoryItemLocal } from './ItemCard';
import { RARITY_COLORS } from '../../lib/types';
import { useCampaign } from '../../contexts/CampaignContext';
import { playSound } from '../../lib/audio';

import { DEMO_ITEMS } from './inventoryConstants';

interface SlotData {
  id: string;
  item: InventoryItemLocal | null;
  type: 'equipped' | 'bag';
}

const TOTAL_SLOTS = 24;
const EQUIP_SLOTS = 4;

export function InventoryGrid() {
  const { activeCharacterId, characters } = useCampaign();
  const activeCharacter = characters?.find(c => c.id === activeCharacterId);

  // Initialize a fixed-size grid of exactly 24 slots.
  const [slots, setSlots] = useState<SlotData[]>(() => {
    const initialSlots: SlotData[] = [];
    const demoEquipped = DEMO_ITEMS.filter((i) => i.equipped);
    const demoBag = DEMO_ITEMS.filter((i) => !i.equipped);

    // 4 equipped slots
    for (let i = 0; i < EQUIP_SLOTS; i++) {
      const item = demoEquipped[i] || null;
      initialSlots.push({ id: item ? item.id : `empty-eq-${i}`, item, type: 'equipped' });
    }
    // 20 bag slots
    for (let i = 0; i < TOTAL_SLOTS - EQUIP_SLOTS; i++) {
      const item = demoBag[i] || null;
      initialSlots.push({ id: item ? item.id : `empty-bag-${i}`, item, type: 'bag' });
    }
    return initialSlots;
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>('item-1');

  const selectedItem = useMemo(() => {
    return slots.find((s) => s.item?.id === selectedItemId)?.item ?? slots.find((s) => s.item)?.item ?? null;
  }, [slots, selectedItemId]);

  const gold = 1247;

  // Calculate total carrying weight
  const totalWeight = useMemo(() => {
    return slots.reduce((acc, slot) => {
      if (!slot.item) return acc;
      const w = slot.item.properties?.Weight ? parseFloat(slot.item.properties.Weight) : 1;
      return acc + (isNaN(w) ? 1 : w) * slot.item.quantity;
    }, 0);
  }, [slots]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setSlots((prev) => {
        const oldIdx = prev.findIndex((s) => s.id === active.id);
        const newIdx = prev.findIndex((s) => s.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;

        const next = [...prev];
        const activeSlot = { ...next[oldIdx] };
        const overSlot = { ...next[newIdx] };

        // SWAP the entire slot data (which swaps their physical positions in the grid)
        next[oldIdx] = overSlot;
        next[newIdx] = activeSlot;

        // Update their logical types and the underlying item's equipped status based on the new slot index
        next[oldIdx].type = oldIdx < EQUIP_SLOTS ? 'equipped' : 'bag';
        if (next[oldIdx].item) next[oldIdx].item = { ...next[oldIdx].item, equipped: next[oldIdx].type === 'equipped' };

        next[newIdx].type = newIdx < EQUIP_SLOTS ? 'equipped' : 'bag';
        if (next[newIdx].item) next[newIdx].item = { ...next[newIdx].item, equipped: next[newIdx].type === 'equipped' };

        return next;
      });
    },
    [],
  );

  const handleEquipToggle = useCallback((id: string) => {
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s.item?.id === id);
      if (idx === -1) return prev;
      
      const isCurrentlyEquipped = prev[idx].type === 'equipped';
      const targetType = isCurrentlyEquipped ? 'bag' : 'equipped';

      // Find first empty slot in the target section
      const emptyIdx = prev.findIndex((s) => s.type === targetType && !s.item);
      if (emptyIdx === -1) return prev; // No empty slots available

      const next = [...prev];
      const activeSlot = { ...next[idx] };
      const emptySlot = { ...next[emptyIdx] };

      next[idx] = emptySlot;
      next[emptyIdx] = activeSlot;

      next[idx].type = idx < EQUIP_SLOTS ? 'equipped' : 'bag';
      next[emptyIdx].type = emptyIdx < EQUIP_SLOTS ? 'equipped' : 'bag';
      
      if (next[emptyIdx].item) next[emptyIdx].item.equipped = next[emptyIdx].type === 'equipped';

      return next;
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const allIds = slots.map((s) => s.id);
  const equippedSlots = slots.slice(0, EQUIP_SLOTS);
  const bagSlots = slots.slice(EQUIP_SLOTS);
  const bagItemsCount = bagSlots.filter(s => s.item).length;
  const equippedItemsCount = equippedSlots.filter(s => s.item).length;

  return (
    <motion.div
      className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 pb-28"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ── Left Column: 24-Slot Inventory Grid (7 cols on lg) ── */}
      <div className="lg:col-span-7 arcane-glass p-4 sm:p-5 border border-amber-900/35 bg-[#0e1017]/85 shadow-2xl rounded-2xl flex flex-col justify-between">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={allIds} strategy={rectSortingStrategy}>
            {activeCharacter && (
              <div className="mb-3 text-xs font-cinzel bg-black/40 px-3 py-1 rounded-xl inline-flex items-center gap-2 border border-amber-900/30">
                <Users size={13} className="text-amber-400" />
                <span className="text-amber-200/60 uppercase">ADVENTURER LOADOUT:</span>
                <span className="text-amber-300 font-bold">{activeCharacter.name}</span>
              </div>
            )}

            {/* Equipped Section */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-cinzel font-bold text-amber-200 uppercase tracking-wider">
                  EQUIPPED RELICS & ARMAMENTS
                </h3>
                <span className="text-[10px] font-cinzel text-amber-300/80 ml-auto font-semibold">
                  {equippedItemsCount} / {EQUIP_SLOTS} SLOTS ATTIRED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {equippedSlots.map((slot) => (
                  <ItemCard
                    key={slot.id}
                    id={slot.id}
                    item={slot.item}
                    isSelected={slot.item?.id === selectedItem?.id}
                    onSelect={(id) => {
                      playSound('lock_click');
                      setSelectedItemId(id);
                    }}
                    onEquipToggle={handleEquipToggle}
                  />
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent mb-3" />

            {/* Bag Section */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-3">
                <Backpack className="w-4 h-4 text-amber-400/80" />
                <h3 className="text-xs font-cinzel font-bold text-amber-100 uppercase tracking-wider">
                  ADVENTURER'S PACK (20 SLOTS)
                </h3>
                <span className="text-[10px] font-cinzel text-stone-400 ml-auto">
                  {bagItemsCount} / {TOTAL_SLOTS - EQUIP_SLOTS} SLOTS OCCUPIED
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {bagSlots.map((slot) => (
                  <ItemCard
                    key={slot.id}
                    id={slot.id}
                    item={slot.item}
                    isSelected={slot.item?.id === selectedItem?.id}
                    onSelect={(id) => {
                      playSound('lock_click');
                      setSelectedItemId(id);
                    }}
                    onEquipToggle={handleEquipToggle}
                  />
                ))}
              </div>
            </div>
          </SortableContext>
        </DndContext>

        {/* Gold Purse Counter */}
        <div className="flex items-center justify-between mt-4 bg-black/50 border border-amber-900/30 rounded-xl px-4 py-2.5 shadow-inner">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-cinzel">
            <span className="text-[10px] uppercase tracking-wider">SLOT SWAP:</span>
            <span className="text-amber-200/80">DRAG OR DOUBLE-CLICK</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-cinzel font-extrabold text-gold-gradient">
              {gold.toLocaleString()}
            </span>
            <span className="text-[10px] font-cinzel text-amber-300/80 uppercase tracking-wider">GOLD COINS</span>
          </div>
        </div>
      </div>

      {/* ── Right Column: Arcane Relic & Armament Inspector (5 cols on lg) ── */}
      <div className="lg:col-span-5 arcane-glass p-4 sm:p-5 border border-amber-900/35 bg-[#0e1017]/85 shadow-2xl rounded-2xl flex flex-col justify-between relative overflow-hidden">
        {selectedItem ? (
          <div className="flex flex-col h-full justify-between space-y-3">
            <div>
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-2.5 border-b border-amber-900/25 mb-3">
                <span className="text-[10px] font-cinzel text-amber-300/80 uppercase tracking-widest font-bold">
                  RELIC INSPECTION
                </span>
                <span
                  className="text-[10px] font-cinzel uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border"
                  style={{
                    color: RARITY_COLORS[selectedItem.rarity],
                    borderColor: `${RARITY_COLORS[selectedItem.rarity]}60`,
                    backgroundColor: `${RARITY_COLORS[selectedItem.rarity]}15`,
                  }}
                >
                  {selectedItem.rarity} {selectedItem.type}
                </span>
              </div>

              {/* Dais & Visual Icon */}
              <div className="flex flex-col items-center justify-center py-2 relative">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-black/80 to-[#141722] border-2 border-amber-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.15)] mb-2">
                  <span className="text-4xl select-none filter drop-shadow-md">{selectedItem.icon}</span>
                  <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-md bg-black/90 border border-amber-900/40 text-[10px] font-cinzel text-amber-300 font-bold">
                    x{selectedItem.quantity}
                  </div>
                </div>

                <h2
                  className="text-lg sm:text-xl font-cinzel font-bold text-center tracking-wide"
                  style={{ color: RARITY_COLORS[selectedItem.rarity] }}
                >
                  {selectedItem.name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-cinzel text-stone-400 capitalize">
                    {selectedItem.type} Relic
                  </span>
                  <span className="text-amber-900">•</span>
                  <span className="text-[11px] font-cinzel text-amber-400 font-semibold">
                    {selectedItem.equipped ? 'Currently Attired' : 'Stored in Pack'}
                  </span>
                </div>
              </div>

              {/* Witcher-style Narrative Lore Block */}
              <div className="p-2.5 rounded-xl bg-black/50 border border-amber-900/25 my-2 relative">
                <Feather className="w-3.5 h-3.5 text-amber-400/70 absolute top-2.5 right-2.5" />
                <p className="text-xs text-stone-300 italic font-inter leading-relaxed pr-5">
                  "{selectedItem.description}"
                </p>
              </div>

              {/* Combat & Stat Properties Table */}
              {selectedItem.properties && Object.keys(selectedItem.properties).length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <span className="text-[10px] font-cinzel text-amber-200/60 uppercase tracking-wider font-semibold">
                    RELIC PROPERTIES & ATTRIBUTES
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {Object.entries(selectedItem.properties).map(([key, val]) => (
                      <div
                        key={key}
                        className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-900/20 flex items-center justify-between text-xs font-cinzel"
                      >
                        <span className="text-stone-400">{key}</span>
                        <span className="text-amber-300 font-bold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions & Capacity */}
            <div className="pt-3 border-t border-amber-900/25 space-y-2">
              <button
                onClick={() => {
                  playSound('lock_click');
                  handleEquipToggle(selectedItem.id);
                }}
                className={`w-full py-2 rounded-xl font-cinzel text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                  selectedItem.equipped
                    ? 'bg-rose-950/40 border border-rose-900/50 text-rose-300 hover:bg-rose-900/50'
                    : 'bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                }`}
              >
                <ArrowRightLeft size={14} />
                <span>{selectedItem.equipped ? 'UNEQUIP TO PACK' : 'EQUIP RELIC'}</span>
              </button>

              {/* Encumbrance status */}
              <div className="bg-black/40 p-2 rounded-xl border border-amber-900/20 text-[10px] font-cinzel">
                <div className="flex justify-between text-stone-400 mb-1">
                  <span>PACK ENCUMBRANCE</span>
                  <span className="text-amber-300 font-bold">{totalWeight.toFixed(1)} / 150 LBS</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-amber-950/40">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                    style={{ width: `${Math.min(100, (totalWeight / 150) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 text-stone-500">
            <Info size={28} className="mb-2 opacity-40 text-amber-400" />
            <p className="text-xs font-cinzel text-stone-400">Select any relic from your pack to inspect lore and attributes.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
