import { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { Backpack, Shield, Coins, Users, Feather, ArrowRightLeft, Info, Sparkles, Dices, Plus, Minus, AlertTriangle } from 'lucide-react';

import { ItemCard, type InventoryItemLocal } from './ItemCard';
import { RARITY_COLORS, type ItemRarity } from '../../lib/types';
import { useCampaign } from '../../contexts/CampaignContext';
import { playSound } from '../../lib/audio';
import { supabase, isSupabaseOffline } from '../../lib/supabase';
import { arcaneToast } from '../../lib/toast';
import { computeSkillBonuses } from '../../hooks/useSkillTree';
import { triggerDiceRoll } from '../../lib/diceRoller';

import {
  DEMO_ITEMS,
  TOTAL_SLOTS,
  EQUIP_SLOTS,
  MAX_ATTUNED,
  EQUIP_SLOT_CONFIG,
  canEquipInSlot,
  calculateMaxCarryWeight,
} from './inventoryConstants';

interface SlotData {
  id: string;
  item: InventoryItemLocal | null;
  type: 'equipped' | 'bag';
}


function buildDefaultSlots(): SlotData[] {
  const initialSlots: SlotData[] = [];
  const demoEquipped = DEMO_ITEMS.filter((i) => i.equipped);
  const demoBag = DEMO_ITEMS.filter((i) => !i.equipped);

  for (let i = 0; i < EQUIP_SLOTS; i++) {
    const rawItem = demoEquipped[i] || null;
    const item = rawItem
      ? {
          ...rawItem,
          attuned: rawItem.rarity === 'legendary' || rawItem.rarity === 'epic',
          slotIndex: i,
        }
      : null;
    initialSlots.push({ id: item ? item.id : `empty-eq-${i}`, item, type: 'equipped' });
  }
  for (let i = 0; i < TOTAL_SLOTS - EQUIP_SLOTS; i++) {
    const rawItem = demoBag[i] || null;
    const item = rawItem ? { ...rawItem, attuned: false, slotIndex: i + EQUIP_SLOTS } : null;
    initialSlots.push({ id: item ? item.id : `empty-bag-${i}`, item, type: 'bag' });
  }
  return initialSlots;
}

const DEFAULT_ICON_BY_TYPE: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  consumable: '🧪',
  quest: '📜',
  misc: '💍',
};

export function InventoryGrid() {
  const { activeCharacterId, characters } = useCampaign();
  const activeCharacter = characters?.find((c) => c.id === activeCharacterId);

  const storageKey = `dnd_inventory_slots_${activeCharacterId || 'demo'}`;
  const goldStorageKey = `dnd_gold_${activeCharacterId || 'demo'}`;

  // Initialize a fixed-size grid of exactly 24 slots.
  const [slots, setSlots] = useState<SlotData[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as SlotData[];
        if (Array.isArray(parsed) && parsed.length === TOTAL_SLOTS) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return buildDefaultSlots();
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>('item-1');
  const [strScore, setStrScore] = useState<number>(10);
  const [gold, setGold] = useState<number>(() => {
    try {
      const savedGold = localStorage.getItem(goldStorageKey);
      if (savedGold !== null && !Number.isNaN(Number(savedGold))) return Number(savedGold);
    } catch {
      // ignore
    }
    if (typeof activeCharacter?.appearance?.gold === 'number') return activeCharacter.appearance.gold;
    if (typeof activeCharacter?.gold === 'number') return activeCharacter.gold;
    return 1247;
  });

  // Sync gold when active character changes
  useEffect(() => {
    try {
      const savedGold = localStorage.getItem(goldStorageKey);
      if (savedGold !== null && !Number.isNaN(Number(savedGold))) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setGold(Number(savedGold));
        return;
      }
    } catch {
      // ignore
    }
    if (typeof activeCharacter?.appearance?.gold === 'number') {
      setGold(activeCharacter.appearance.gold);
      return;
    }
    if (typeof activeCharacter?.gold === 'number') {
      setGold(activeCharacter.gold);
      return;
    }
    setGold(1247);
  }, [activeCharacter?.id, activeCharacter?.gold, activeCharacter?.appearance?.gold, goldStorageKey]);

  // Fetch character STR + skill tree bonuses for dynamic D&D 5e carrying capacity (STR * 15 lbs)
  useEffect(() => {
    let isMounted = true;
    async function loadStrScore() {
      let baseStr = 10;
      let unlockedIds = new Set<string>();

      try {
        const localUnlocked = localStorage.getItem(`dnd_unlocked_skills_${activeCharacterId || 'demo'}`);
        if (localUnlocked) {
          unlockedIds = new Set(JSON.parse(localUnlocked) as string[]);
        }
      } catch {
        // ignore
      }

      if (activeCharacterId && !isSupabaseOffline()) {
        try {
          const [statsRes, skillsRes] = await Promise.all([
            supabase
              .from('character_stats')
              .select('stat_key, base_value, bonus_value')
              .eq('character_id', activeCharacterId)
              .eq('stat_key', 'STR')
              .maybeSingle(),
            supabase
              .from('character_skills')
              .select('skill_definition_id, skill_definition:skill_definitions(skill_key, name_en)')
              .eq('character_id', activeCharacterId)
              .eq('unlocked', true),
          ]);
          if (statsRes.data) {
            const row = statsRes.data as { base_value?: number; bonus_value?: number };
            baseStr = (row.base_value ?? 10) + (row.bonus_value ?? 0);
          }
          if (skillsRes.data) {
            for (const row of skillsRes.data as Array<{ skill_definition_id: string; skill_definition?: { skill_key?: string } | Array<{ skill_key?: string }> }>) {
              const def = Array.isArray(row.skill_definition) ? row.skill_definition[0] : row.skill_definition;
              unlockedIds.add(def?.skill_key || row.skill_definition_id);
            }
          }
        } catch {
          // fallback to baseStr
        }
      }

      const bonuses = computeSkillBonuses(unlockedIds);
      if (isMounted) {
        setStrScore(baseStr + (bonuses.statBonuses.STR || 0));
      }
    }

    loadStrScore();
    return () => {
      isMounted = false;
    };
  }, [activeCharacterId]);

  // Fetch live inventory_items + item_definitions from Supabase
  const fetchLiveInventory = useCallback(async () => {
    if (!activeCharacterId || isSupabaseOffline()) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as SlotData[];
          if (Array.isArray(parsed) && parsed.length === TOTAL_SLOTS) {
            setSlots(parsed);
            return;
          }
        }
      } catch {
        // ignore
      }
      setSlots(buildDefaultSlots());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*, item:item_definitions(*)')
        .eq('character_id', activeCharacterId);

      if (error || !data || data.length === 0) {
        // Graceful fallback to localStorage or DEMO_ITEMS if character has 0 DB items
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const parsed = JSON.parse(saved) as SlotData[];
            if (Array.isArray(parsed) && parsed.length === TOTAL_SLOTS) {
              setSlots(parsed);
              return;
            }
          }
        } catch {
          // ignore
        }
        setSlots(buildDefaultSlots());
        return;
      }

      const nextSlots: SlotData[] = Array.from({ length: TOTAL_SLOTS }, (_, idx) => ({
        id: idx < EQUIP_SLOTS ? `empty-eq-${idx}` : `empty-bag-${idx - EQUIP_SLOTS}`,
        item: null,
        type: idx < EQUIP_SLOTS ? 'equipped' : 'bag',
      }));

      const unplacedItems: InventoryItemLocal[] = [];

      for (const row of data as Array<Record<string, unknown>>) {
        const itemDef = (row.item || {}) as Record<string, unknown>;
        const rawName = (itemDef.name_en as string) || (itemDef.name_tr as string) || 'Unknown Relic';
        const demoMatch = DEMO_ITEMS.find((d) => d.name.toLowerCase() === rawName.toLowerCase());
        const itemType = ((itemDef.type as string) || demoMatch?.type || 'misc').toLowerCase();
        const rawProps = ((itemDef.properties as Record<string, unknown>) || {}) as Record<string, unknown>;
        const customProps = ((row.custom_properties as Record<string, unknown>) || {}) as Record<string, unknown>;

        const stringProps: Record<string, string> = {};
        if (demoMatch?.properties) {
          Object.assign(stringProps, demoMatch.properties);
        }
        for (const [k, v] of Object.entries(rawProps)) {
          if (k !== 'icon' && v !== undefined && v !== null) {
            stringProps[k] = String(v);
          }
        }

        const localItem: InventoryItemLocal = {
          id: String(row.id),
          dbId: String(row.id),
          name: rawName,
          description:
            (itemDef.description_en as string) ||
            (itemDef.description_tr as string) ||
            demoMatch?.description ||
            'An artifact forged in the realms.',
          icon:
            (itemDef.icon_url as string) ||
            (rawProps.icon as string) ||
            demoMatch?.icon ||
            DEFAULT_ICON_BY_TYPE[itemType] ||
            '✨',
          rarity: ((itemDef.rarity as ItemRarity) || demoMatch?.rarity || 'common') as ItemRarity,
          type: itemType,
          quantity: typeof row.quantity === 'number' ? row.quantity : 1,
          equipped: Boolean(row.equipped),
          attuned: Boolean(customProps.attuned),
          slotIndex: typeof row.slot_index === 'number' ? row.slot_index : undefined,
          properties: stringProps,
          customProperties: customProps,
        };

        const preferredIdx =
          typeof localItem.slotIndex === 'number' &&
          localItem.slotIndex >= 0 &&
          localItem.slotIndex < TOTAL_SLOTS
            ? localItem.slotIndex
            : undefined;

        const canPlaceAtPreferred =
          preferredIdx !== undefined &&
          !nextSlots[preferredIdx].item &&
          (preferredIdx < EQUIP_SLOTS
            ? localItem.equipped && canEquipInSlot(localItem, preferredIdx).valid
            : !localItem.equipped);

        if (canPlaceAtPreferred && preferredIdx !== undefined) {
          const isEquippedSlot = preferredIdx < EQUIP_SLOTS;
          nextSlots[preferredIdx] = {
            id: localItem.id,
            item: { ...localItem, equipped: isEquippedSlot, slotIndex: preferredIdx },
            type: isEquippedSlot ? 'equipped' : 'bag',
          };
        } else {
          unplacedItems.push(localItem);
        }
      }

      // Place any items without an explicit compatible slot_index
      for (const item of unplacedItems) {
        let placed = false;
        if (item.equipped) {
          for (let i = 0; i < EQUIP_SLOTS; i++) {
            if (!nextSlots[i].item && canEquipInSlot(item, i).valid) {
              nextSlots[i] = {
                id: item.id,
                item: { ...item, equipped: true, slotIndex: i },
                type: 'equipped',
              };
              placed = true;
              break;
            }
          }
        }
        if (!placed) {
          for (let i = EQUIP_SLOTS; i < TOTAL_SLOTS; i++) {
            if (!nextSlots[i].item) {
              nextSlots[i] = {
                id: item.id,
                item: { ...item, equipped: false, slotIndex: i },
                type: 'bag',
              };
              break;
            }
          }
        }
      }

      setSlots(nextSlots);
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextSlots));
      } catch {
        // ignore
      }
    } catch {
      // keep existing slots on network error
    }
  }, [activeCharacterId, storageKey]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLiveInventory();

    if (!activeCharacterId || isSupabaseOffline()) return;

    const channel = supabase
      .channel(`inventory_grid_${activeCharacterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `character_id=eq.${activeCharacterId}`,
        },
        () => {
          fetchLiveInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeCharacterId, fetchLiveInventory]);

  const syncSlotItemToSupabase = useCallback(
    async (item: InventoryItemLocal | null, slotIndex: number) => {
      if (!item?.dbId || !activeCharacterId || isSupabaseOffline()) return;
      try {
        const nextCustomProps = {
          ...(item.customProperties || {}),
          attuned: Boolean(item.attuned),
        };
        const { error } = await supabase
          .from('inventory_items')
          .update({
            equipped: slotIndex < EQUIP_SLOTS,
            slot_index: slotIndex,
            custom_properties: nextCustomProps,
          })
          .eq('id', item.dbId);

        if (error) {
          // Fallback if slot_index / custom_properties columns are not yet migrated
          await supabase
            .from('inventory_items')
            .update({ equipped: slotIndex < EQUIP_SLOTS })
            .eq('id', item.dbId);
        }
      } catch {
        // ignore offline errors
      }
    },
    [activeCharacterId]
  );

  const selectedItem = useMemo(() => {
    return slots.find((s) => s.item?.id === selectedItemId)?.item ?? slots.find((s) => s.item)?.item ?? null;
  }, [slots, selectedItemId]);

  const maxCarryWeight = calculateMaxCarryWeight(strScore);

  // Calculate total carrying weight
  const totalWeight = useMemo(() => {
    return slots.reduce((acc, slot) => {
      if (!slot.item) return acc;
      const rawWeight = slot.item.properties?.Weight || slot.item.properties?.weight;
      const w = rawWeight ? parseFloat(rawWeight) : 1;
      return acc + (isNaN(w) ? 1 : w) * slot.item.quantity;
    }, 0);
  }, [slots]);

  const isEncumbered = totalWeight > maxCarryWeight;
  const attunedCount = useMemo(() => slots.filter((s) => s.item?.attuned).length, [slots]);

  const handleAdjustGold = useCallback(
    async (delta: number) => {
      playSound('lock_click');
      const nextGold = Math.max(0, gold + delta);
      setGold(nextGold);
      try {
        localStorage.setItem(goldStorageKey, String(nextGold));
      } catch {
        // ignore
      }
      if (activeCharacter && !isSupabaseOffline()) {
        try {
          const nextAppearance = {
            ...(activeCharacter.appearance || {}),
            gold: nextGold,
          };
          const { error } = await supabase
            .from('characters')
            .update({ gold: nextGold, appearance: nextAppearance })
            .eq('id', activeCharacter.id);
          if (error) {
            await supabase
              .from('characters')
              .update({ appearance: nextAppearance })
              .eq('id', activeCharacter.id);
          }
        } catch {
          // ignore
        }
      }
    },
    [gold, goldStorageKey, activeCharacter]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setSlots((prev) => {
        const oldIdx = prev.findIndex((s) => s.id === active.id);
        const newIdx = prev.findIndex((s) => s.id === over.id);
        if (oldIdx === -1 || newIdx === -1) return prev;

        const activeSlot = { ...prev[oldIdx] };
        const overSlot = { ...prev[newIdx] };

        // Validate D&D 5e Equipment Slot Restrictions before swapping
        if (newIdx < EQUIP_SLOTS && activeSlot.item) {
          const check = canEquipInSlot(activeSlot.item, newIdx);
          if (!check.valid) {
            playSound('error');
            arcaneToast.warning(check.reason || 'Invalid equipment slot for this item.');
            return prev;
          }
        }
        if (oldIdx < EQUIP_SLOTS && overSlot.item) {
          const check = canEquipInSlot(overSlot.item, oldIdx);
          if (!check.valid) {
            playSound('error');
            arcaneToast.warning(check.reason || 'Cannot swap incompatible item into this equipment slot.');
            return prev;
          }
        }

        const next = [...prev];

        // SWAP the entire slot data (which swaps their physical positions in the grid)
        next[oldIdx] = overSlot;
        next[newIdx] = activeSlot;

        // Update their logical types and the underlying item's equipped status based on the new slot index
        next[oldIdx].type = oldIdx < EQUIP_SLOTS ? 'equipped' : 'bag';
        if (next[oldIdx].item) {
          next[oldIdx].item = {
            ...next[oldIdx].item,
            equipped: next[oldIdx].type === 'equipped',
            slotIndex: oldIdx,
          };
        }

        next[newIdx].type = newIdx < EQUIP_SLOTS ? 'equipped' : 'bag';
        if (next[newIdx].item) {
          next[newIdx].item = {
            ...next[newIdx].item,
            equipped: next[newIdx].type === 'equipped',
            slotIndex: newIdx,
          };
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }

        void syncSlotItemToSupabase(next[oldIdx].item, oldIdx);
        void syncSlotItemToSupabase(next[newIdx].item, newIdx);

        return next;
      });
    },
    [storageKey, syncSlotItemToSupabase]
  );

  const handleEquipToggle = useCallback(
    (id: string) => {
      setSlots((prev) => {
        const idx = prev.findIndex((s) => s.item?.id === id);
        if (idx === -1 || !prev[idx].item) return prev;

        const item = prev[idx].item!;
        const isCurrentlyEquipped = prev[idx].type === 'equipped';

        let emptyIdx = -1;

        if (isCurrentlyEquipped) {
          // Unequip to first empty bag slot
          emptyIdx = prev.findIndex((s, i) => i >= EQUIP_SLOTS && !s.item);
          if (emptyIdx === -1) {
            playSound('error');
            arcaneToast.warning('Adventurer pack is full! Free a slot before unequipping.');
            return prev;
          }
        } else {
          // Validate item type first
          const itemType = (item.type || 'misc').toLowerCase();
          if (itemType === 'consumable' || itemType === 'quest') {
            playSound('error');
            arcaneToast.warning(`${item.name} (${item.type}) cannot be equipped in an armament slot.`);
            return prev;
          }
          // Find first compatible empty equipment slot
          for (let i = 0; i < EQUIP_SLOTS; i++) {
            if (!prev[i].item && canEquipInSlot(item, i).valid) {
              emptyIdx = i;
              break;
            }
          }
          if (emptyIdx === -1) {
            playSound('error');
            arcaneToast.warning(
              `No empty compatible equipment slot available for ${item.name} (${item.type}). Drag to swap or unequip an existing item first.`
            );
            return prev;
          }
        }

        const next = [...prev];
        const activeSlot = { ...next[idx] };
        const emptySlot = { ...next[emptyIdx] };

        next[idx] = emptySlot;
        next[emptyIdx] = activeSlot;

        next[idx].type = idx < EQUIP_SLOTS ? 'equipped' : 'bag';
        next[emptyIdx].type = emptyIdx < EQUIP_SLOTS ? 'equipped' : 'bag';

        next[emptyIdx].item = {
          ...item,
          equipped: next[emptyIdx].type === 'equipped',
          slotIndex: emptyIdx,
        };

        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }

        void syncSlotItemToSupabase(next[emptyIdx].item, emptyIdx);

        return next;
      });
    },
    [storageKey, syncSlotItemToSupabase]
  );

  const handleAttuneToggle = useCallback(
    (id: string) => {
      setSlots((prev) => {
        const idx = prev.findIndex((s) => s.item?.id === id);
        if (idx === -1 || !prev[idx].item) return prev;

        const targetItem = prev[idx].item!;
        const currentAttunedCount = prev.filter((s) => s.item?.attuned).length;
        const nextAttuned = !targetItem.attuned;

        if (nextAttuned && currentAttunedCount >= MAX_ATTUNED) {
          playSound('error');
          arcaneToast.warning('D&D 5e Attunement Limit: You can attune to at most 3 relics at once!');
          return prev;
        }

        playSound(nextAttuned ? 'skill_unlock' : 'lock_click');
        if (nextAttuned) {
          arcaneToast.arcane(`Attuned to ${targetItem.name} (${currentAttunedCount + 1}/${MAX_ATTUNED})`);
        } else {
          arcaneToast.info(`Broke attunement with ${targetItem.name}`);
        }

        const next = [...prev];
        const updatedItem: InventoryItemLocal = {
          ...targetItem,
          attuned: nextAttuned,
          customProperties: {
            ...(targetItem.customProperties || {}),
            attuned: nextAttuned,
          },
        };
        next[idx] = {
          ...next[idx],
          item: updatedItem,
        };

        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }

        void syncSlotItemToSupabase(updatedItem, idx);
        return next;
      });
    },
    [storageKey, syncSlotItemToSupabase]
  );

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
  const bagItemsCount = bagSlots.filter((s) => s.item).length;
  const equippedItemsCount = equippedSlots.filter((s) => s.item).length;

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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              {activeCharacter && (
                <div className="text-xs font-cinzel bg-black/40 px-3 py-1 rounded-xl inline-flex items-center gap-2 border border-amber-900/30">
                  <Users size={13} className="text-amber-400" />
                  <span className="text-amber-200/60 uppercase">ADVENTURER LOADOUT:</span>
                  <span className="text-amber-300 font-bold">{activeCharacter.name}</span>
                </div>
              )}

              {/* D&D 5e Attunement Counter */}
              <div className="text-[10px] font-cinzel bg-purple-950/30 px-3 py-1 rounded-xl inline-flex items-center gap-1.5 border border-purple-500/30 text-purple-300">
                <Sparkles size={12} className="text-purple-400" />
                <span className="uppercase tracking-wider">ATTUNEMENT:</span>
                <span className="font-bold text-purple-200">
                  {attunedCount} / {MAX_ATTUNED} SLOTS
                </span>
              </div>
            </div>

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
                {equippedSlots.map((slot, idx) => (
                  <div key={slot.id} className="flex flex-col gap-1">
                    <span className="text-[9px] font-cinzel text-amber-200/60 uppercase tracking-wider text-center truncate">
                      {EQUIP_SLOT_CONFIG[idx]?.label}
                    </span>
                    <ItemCard
                      id={slot.id}
                      item={slot.item}
                      slotLabel={EQUIP_SLOT_CONFIG[idx]?.label}
                      isSelected={slot.item?.id === selectedItem?.id}
                      onSelect={(id) => {
                        playSound('lock_click');
                        setSelectedItemId(id);
                      }}
                      onEquipToggle={handleEquipToggle}
                    />
                  </div>
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

        {/* Gold Purse Counter & D&D 5e Currency Wallet (PP / GP / SP / CP) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 bg-black/50 border border-amber-900/30 rounded-xl px-4 py-2.5 shadow-inner">
          <div className="flex flex-wrap items-center gap-2 text-stone-400 text-xs font-cinzel">
            <span className="text-[10px] uppercase tracking-wider">D&amp;D PURSE:</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-[10px] font-bold" title="Platinum Pieces (1 PP = 10 GP)">
              {Math.floor(gold / 10)} PP
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-[10px] font-bold" title="Gold Pieces">
              {gold} GP
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900/60 border border-slate-500/30 text-slate-300 text-[10px] font-bold" title="Silver Pieces">
              {(gold % 10) * 3} SP
            </span>
            <span className="px-1.5 py-0.5 rounded bg-orange-950/40 border border-orange-700/30 text-orange-300 text-[10px] font-bold" title="Copper Pieces">
              {(gold % 7) * 5} CP
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAdjustGold(-10)}
              title="Spend 10 Gold"
              className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-900/40 text-amber-300/80 hover:text-amber-200 hover:border-amber-500/50 text-[10px] font-cinzel flex items-center gap-0.5 cursor-pointer"
            >
              <Minus size={10} />10
            </button>
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-cinzel font-extrabold text-gold-gradient">
              {gold.toLocaleString()}
            </span>
            <span className="text-[10px] font-cinzel text-amber-300/80 uppercase tracking-wider">GOLD COINS</span>
            <button
              type="button"
              onClick={() => handleAdjustGold(10)}
              title="Add 10 Gold"
              className="px-1.5 py-0.5 rounded bg-black/60 border border-amber-900/40 text-amber-300/80 hover:text-amber-200 hover:border-amber-500/50 text-[10px] font-cinzel flex items-center gap-0.5 cursor-pointer"
            >
              <Plus size={10} />10
            </button>
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
                <div className="flex items-center gap-1.5">
                  {selectedItem.attuned && (
                    <span className="text-[10px] font-cinzel uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border border-purple-500/60 bg-purple-500/15 text-purple-300">
                      ✦ Attuned
                    </span>
                  )}
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
              {/* Click-to-Roll Weapon Damage if item has Damage property */}
              {selectedItem.properties?.Damage && (
                <button
                  type="button"
                  onClick={() => {
                    triggerDiceRoll({
                      label: `${selectedItem.name} Damage`,
                      formula: selectedItem.properties?.Damage || '1d8',
                      characterName: activeCharacter?.name,
                    });
                  }}
                  className="w-full py-2 rounded-xl font-cinzel text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-red-950/40 border border-red-700/50 text-red-200 hover:bg-red-900/50 shadow-md"
                >
                  <Dices size={14} className="text-red-400" />
                  <span>ROLL DAMAGE ({selectedItem.properties.Damage})</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playSound('lock_click');
                    handleEquipToggle(selectedItem.id);
                  }}
                  className={`py-2 px-3 rounded-xl font-cinzel text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 ${
                    selectedItem.equipped
                      ? 'bg-rose-950/40 border border-rose-900/50 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-amber-500/20 border border-amber-500/50 text-amber-200 hover:bg-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  }`}
                >
                  <ArrowRightLeft size={13} />
                  <span>{selectedItem.equipped ? 'UNEQUIP' : 'EQUIP RELIC'}</span>
                </button>

                {/* Attunement toggle button */}
                <button
                  type="button"
                  onClick={() => handleAttuneToggle(selectedItem.id)}
                  disabled={selectedItem.type === 'consumable' || selectedItem.type === 'quest'}
                  className={`py-2 px-3 rounded-xl font-cinzel text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                    selectedItem.attuned
                      ? 'bg-purple-900/50 border border-purple-400/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      : 'bg-black/60 border border-purple-900/40 text-purple-300/80 hover:border-purple-500/50 hover:text-purple-200'
                  }`}
                >
                  <Sparkles size={13} />
                  <span>{selectedItem.attuned ? 'UNATTUNE (✦)' : 'ATTUNE (✦)'}</span>
                </button>
              </div>

              {/* Encumbrance status (Dynamic D&D 5e STR * 15 lbs) */}
              <div className="bg-black/40 p-2 rounded-xl border border-amber-900/20 text-[10px] font-cinzel">
                <div className="flex justify-between items-center text-stone-400 mb-1">
                  <span className="flex items-center gap-1">
                    <span>PACK ENCUMBRANCE (STR {strScore})</span>
                    {isEncumbered && (
                      <span className="inline-flex items-center gap-0.5 text-red-400 font-bold">
                        <AlertTriangle size={10} /> ENCUMBERED
                      </span>
                    )}
                  </span>
                  <span className={isEncumbered ? 'text-red-400 font-bold' : 'text-amber-300 font-bold'}>
                    {totalWeight.toFixed(1)} / {maxCarryWeight} LBS
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-amber-950/40">
                  <div
                    className={`h-full rounded-full ${
                      isEncumbered
                        ? 'bg-gradient-to-r from-red-700 to-red-500'
                        : 'bg-gradient-to-r from-amber-600 to-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, (totalWeight / maxCarryWeight) * 100)}%` }}
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
