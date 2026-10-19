import type { InventoryItemLocal } from './ItemCard';
import type { ItemRarity } from '../../lib/types';

export const DEMO_ITEMS: InventoryItemLocal[] = [
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

export const TOTAL_SLOTS = 24;
export const EQUIP_SLOTS = 4;
export const MAX_ATTUNED = 3;

export const EQUIP_SLOT_CONFIG: Record<number, { label: string; allowedTypes: string[] }> = {
  0: { label: 'Main Hand', allowedTypes: ['weapon'] },
  1: { label: 'Armor', allowedTypes: ['armor'] },
  2: { label: 'Off-Hand / Ring', allowedTypes: ['weapon', 'armor', 'shield', 'ring', 'accessory', 'misc'] },
  3: { label: 'Amulet / Relic', allowedTypes: ['amulet', 'ring', 'accessory', 'relic', 'misc'] },
};

export function canEquipInSlot(
  item: Pick<InventoryItemLocal, 'name' | 'type' | 'properties'>,
  slotIdx: number
): { valid: boolean; reason?: string } {
  if (slotIdx < 0 || slotIdx >= TOTAL_SLOTS) {
    return { valid: false, reason: 'Slot index out of bounds.' };
  }
  if (slotIdx >= EQUIP_SLOTS) return { valid: true };

  const itemType = (item.type || 'misc').toLowerCase().trim();
  if (itemType === 'consumable' || itemType === 'quest') {
    return {
      valid: false,
      reason: `${item.name} (${item.type}) cannot be equipped in an active armament slot.`,
    };
  }

  const config = EQUIP_SLOT_CONFIG[slotIdx];
  if (config && !config.allowedTypes.includes(itemType)) {
    return {
      valid: false,
      reason: `${item.name} (${item.type}) cannot be placed in the ${config.label} slot.`,
    };
  }
  return { valid: true };
}

export function calculateMaxCarryWeight(strScore: number): number {
  const validStr = Number.isFinite(strScore) ? Math.max(1, Math.floor(strScore)) : 10;
  return Math.max(15, validStr * 15);
}

export function computeDefaultSpellSlots(level: number): Record<string, { max: number; used: number }> {
  const safeLevel = Math.max(1, Math.min(20, Math.floor(level || 1)));
  return {
    '1': { max: Math.min(4, Math.max(2, safeLevel + 1)), used: 0 },
    '2': { max: safeLevel >= 3 ? Math.min(3, safeLevel - 1) : 2, used: 0 },
    '3': { max: safeLevel >= 5 ? Math.min(3, safeLevel - 3) : 2, used: 0 },
    '4': { max: safeLevel >= 7 ? Math.min(3, safeLevel - 5) : 1, used: 0 },
    '5': { max: safeLevel >= 9 ? Math.min(3, safeLevel - 7) : 1, used: 0 },
    '6': { max: safeLevel >= 11 ? 2 : 1, used: 0 },
    '7': { max: safeLevel >= 13 ? 2 : 1, used: 0 },
    '8': { max: 1, used: 0 },
    '9': { max: 1, used: 0 },
  };
}

