import { useState, useCallback } from 'react';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Backpack, Shield, Coins, Users } from 'lucide-react';

import { ItemCard, type InventoryItemLocal } from './ItemCard';
import type { ItemRarity } from '../../lib/types';
import { useCampaign } from '../../contexts/CampaignContext';

// ─── Demo Items ────────────────────────────────────────────────

const DEMO_ITEMS: InventoryItemLocal[] = [
  {
    id: 'item-1',
    name: 'Flamebrand',
    description: 'A sword wreathed in eternal fire, forged in the heart of a dying star.',
    icon: '🗡️',
    rarity: 'legendary' as ItemRarity,
    type: 'weapon',
    quantity: 1,
    equipped: true,
    properties: { Damage: '2d6+3 fire', 'Attack Bonus': '+3', Weight: '3 lbs' },
  },
  {
    id: 'item-2',
    name: 'Mithril Chainmail',
    description: 'Impossibly light elven chain, woven from threads of pure mithril.',
    icon: '🛡️',
    rarity: 'epic' as ItemRarity,
    type: 'armor',
    quantity: 1,
    equipped: true,
    properties: { AC: '16', Weight: '20 lbs', 'Stealth': 'No penalty' },
  },
  {
    id: 'item-3',
    name: 'Healing Potion',
    description: 'A crimson vial that mends wounds and restores vitality when consumed.',
    icon: '🧪',
    rarity: 'common' as ItemRarity,
    type: 'consumable',
    quantity: 5,
    equipped: false,
    properties: { Healing: '2d4+2 HP', Action: 'Bonus action' },
  },
  {
    id: 'item-4',
    name: 'Ring of Shadows',
    description: 'A dark band that lets the wearer meld with darkness, becoming nearly invisible.',
    icon: '💍',
    rarity: 'rare' as ItemRarity,
    type: 'misc',
    quantity: 1,
    equipped: true,
    properties: { Effect: 'Advantage on Stealth', Charges: '3/day' },
  },
  {
    id: 'item-5',
    name: 'Dragon Scale',
    description: 'A single iridescent scale from an ancient dragon, warm to the touch.',
    icon: '🐉',
    rarity: 'uncommon' as ItemRarity,
    type: 'quest',
    quantity: 3,
    equipped: false,
    properties: { Type: 'Quest item', 'Fire Resistance': '+5' },
  },
  {
    id: 'item-6',
    name: 'Tome of Knowledge',
    description: 'An ancient book filled with forbidden arcane knowledge from the lost age.',
    icon: '📖',
    rarity: 'epic' as ItemRarity,
    type: 'misc',
    quantity: 1,
    equipped: false,
    properties: { Effect: '+1 INT', 'Study Time': '48 hours' },
  },
  {
    id: 'item-7',
    name: 'Elven Waybread',
    description: 'Nourishing bread baked by woodland elves. A single bite sustains for a full day.',
    icon: '🍞',
    rarity: 'uncommon' as ItemRarity,
    type: 'consumable',
    quantity: 8,
    equipped: false,
    properties: { Effect: 'Full day nourishment', Weight: '0.1 lbs' },
  },
  {
    id: 'item-8',
    name: 'Amulet of Fate',
    description: 'A golden amulet inscribed with runes of destiny. It hums with latent power.',
    icon: '🔮',
    rarity: 'legendary' as ItemRarity,
    type: 'misc',
    quantity: 1,
    equipped: true,
    properties: { Effect: 'Reroll 1 death save/day', Attunement: 'Required' },
  },
];

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

  const gold = 1247;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIdx = slots.findIndex((s) => s.id === active.id);
      const newIdx = slots.findIndex((s) => s.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;

      setSlots((prev) => {
        const next = [...prev];
        const activeSlot = { ...next[oldIdx] };
        const overSlot = { ...next[newIdx] };

        // SWAP the entire slot data (which swaps their physical positions in the grid)
        next[oldIdx] = overSlot;
        next[newIdx] = activeSlot;

        // Update their logical types and the underlying item's equipped status based on the new slot index
        next[oldIdx].type = oldIdx < EQUIP_SLOTS ? 'equipped' : 'bag';
        if (next[oldIdx].item) next[oldIdx].item.equipped = next[oldIdx].type === 'equipped';

        next[newIdx].type = newIdx < EQUIP_SLOTS ? 'equipped' : 'bag';
        if (next[newIdx].item) next[newIdx].item.equipped = next[newIdx].type === 'equipped';

        return next;
      });
    },
    [slots],
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
      className="w-full max-w-[600px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={allIds} strategy={rectSortingStrategy}>
          {activeCharacter && (
            <div className="mb-4 text-xs font-inter bg-black/40 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 border border-glass-border">
              <Users size={12} className="text-gold/70" />
              <span className="text-parchment/70">Viewing Inventory of:</span>
              <span className="text-gold font-semibold">{activeCharacter.name}</span>
            </div>
          )}

          {/* Equipped Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#ffd700]" />
              <h3 className="text-sm font-cinzel font-bold text-[#ffd700] uppercase tracking-widest">
                Equipped
              </h3>
              <span className="text-[10px] text-gray-500 ml-auto">
                {equippedItemsCount} / {EQUIP_SLOTS}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {equippedSlots.map((slot) => (
                <ItemCard key={slot.id} id={slot.id} item={slot.item} onEquipToggle={handleEquipToggle} />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#ffd700]/20 to-transparent mb-4" />

          {/* Bag Section */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Backpack className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-cinzel font-bold text-gray-300 uppercase tracking-widest">
                Inventory
              </h3>
              <span className="text-[10px] text-gray-500 ml-auto">
                {bagItemsCount} / {TOTAL_SLOTS - EQUIP_SLOTS} slots
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {bagSlots.map((slot) => (
                <ItemCard key={slot.id} id={slot.id} item={slot.item} onEquipToggle={handleEquipToggle} />
              ))}
            </div>
          </div>
        </SortableContext>
      </DndContext>

      {/* Gold Counter */}
      <div className="flex items-center justify-end gap-2 mt-4 glass rounded-lg px-4 py-2">
        <Coins className="w-4 h-4 text-[#ffd700]" />
        <span className="text-sm font-cinzel font-bold text-gold-gradient">
          {gold.toLocaleString()}
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">gold</span>
      </div>
    </motion.div>
  );
}
