import { supabase } from '../../lib/supabase';
import type { CombatArenaParticipant, SpellNode } from '../../lib/types';
import { MOCK_SPELLS } from '../../hooks/useSpellTree';
import { DEMO_ITEMS } from '../inventory/inventoryConstants';

export interface ArenaSpell {
  id: string;
  name: string;
  manaCost: number;
  description: string;
  type: 'attack' | 'heal' | 'buff';
  baseDamage?: number;
  baseHeal?: number;
  statusToApply?: {
    type: 'poison' | 'burn' | 'shield' | 'stun';
    value: number;
    remaining_turns: number;
  };
  icon?: string;
  school?: string;
  tier?: number;
}

export interface ArenaItem {
  id: string;
  name: string;
  quantity: number;
  type: 'heal_hp' | 'heal_mana' | 'cleanse' | 'damage';
  value: number;
  description: string;
  isDbItem?: boolean;
  dbItemId?: string;
  icon?: string;
}

// ─── Helpers to parse Spells into Arena Format ──────────────────

export function mapSpellNodeToArenaSpell(node: SpellNode, locale: string = 'tr'): ArenaSpell {
  const isTr = locale === 'tr';
  const name = (isTr ? node.name_tr || node.name_en : node.name_en || node.name_tr) || 'Spell';
  const description = (isTr ? node.description_tr || node.description_en : node.description_en || node.description_tr) || '';
  const effects = (node.effects || {}) as Record<string, unknown>;

  // Determine Type (Heal, Buff, or Attack)
  let type: 'attack' | 'heal' | 'buff' = 'attack';
  const nameDescCombined = `${name} ${description}`.toLowerCase();

  if (effects.healing || /heal|şifa|cure|vitality|yaşam|regen/i.test(nameDescCombined)) {
    type = 'heal';
  } else if (effects.buff || effects.armor_bonus || /shield|kalkan|armor|aegis|barrier|ward|koru/i.test(nameDescCombined)) {
    type = 'buff';
  }

  // Calculate Base Damage
  let baseDamage = 10;
  if (typeof effects.damage === 'number') {
    baseDamage = effects.damage;
  } else if (typeof effects.damage === 'string') {
    const match = effects.damage.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const die = parseInt(match[2], 10);
      const bonus = match[3] ? parseInt(match[3], 10) : 0;
      baseDamage = Math.round(count * ((die + 1) / 2)) + bonus;
    } else {
      const parsedNum = parseInt(effects.damage, 10);
      if (!isNaN(parsedNum)) baseDamage = parsedNum;
    }
  } else if (node.tier) {
    baseDamage = 8 + node.tier * 5;
  }

  // Calculate Base Heal
  let baseHeal = 20;
  if (typeof effects.healing === 'number') {
    baseHeal = effects.healing;
  } else if (typeof effects.healing === 'string') {
    const match = effects.healing.match(/(\d+)d(\d+)(?:\+(\d+))?/i);
    if (match) {
      const count = parseInt(match[1], 10);
      const die = parseInt(match[2], 10);
      const bonus = match[3] ? parseInt(match[3], 10) : 0;
      baseHeal = Math.round(count * ((die + 1) / 2)) + bonus;
    } else if (effects.healing === 'half') {
      baseHeal = Math.round(baseDamage / 2);
    }
  } else if (node.tier) {
    baseHeal = 15 + node.tier * 6;
  }

  // Determine Status Effect (DoT Poison, Burn, Stun, Shield)
  let statusToApply: ArenaSpell['statusToApply'] = undefined;
  if (effects.condition === 'poisoned' || /poison|zehir|venom/i.test(nameDescCombined)) {
    statusToApply = { type: 'poison', value: 4, remaining_turns: 3 };
  } else if (effects.condition === 'burn' || /fire|burn|alev|ateş|flame/i.test(nameDescCombined)) {
    statusToApply = { type: 'burn', value: 5, remaining_turns: 2 };
  } else if (effects.condition === 'stunned' || effects.condition === 'restrained' || /stun|sersem|sarmaşık|paraly/i.test(nameDescCombined)) {
    statusToApply = { type: 'stun', value: 1, remaining_turns: 1 };
  } else if (type === 'buff') {
    statusToApply = { type: 'shield', value: 4, remaining_turns: 2 };
  }

  // Calculate Mana Cost
  let manaCost = 12;
  if (typeof effects.mana_cost === 'number') {
    manaCost = effects.mana_cost;
  } else if (node.tier) {
    manaCost = 6 + node.tier * 6;
  }

  return {
    id: node.id || node.spell_key,
    name,
    manaCost,
    description,
    type,
    baseDamage,
    baseHeal,
    statusToApply,
    icon: node.icon,
    tier: node.tier,
  };
}

// ─── Helpers to parse Inventory Items into Arena Format ─────────

interface RawDbInventoryItem {
  id: string;
  character_id: string;
  quantity: number;
  custom_properties?: Record<string, unknown>;
  item_definition?: {
    id: string;
    name_tr: string;
    name_en: string;
    description_tr: string;
    description_en: string;
    type: string;
    properties?: Record<string, unknown>;
    icon_url?: string | null;
  };
}

export function mapDbInventoryToArenaItem(inv: RawDbInventoryItem, locale: string = 'tr'): ArenaItem {
  const isTr = locale === 'tr';
  const def = inv.item_definition || {
    id: 'unknown',
    name_tr: 'Eşya',
    name_en: 'Item',
    description_tr: '',
    description_en: '',
    type: 'misc',
    properties: {},
  };

  const name = isTr ? def.name_tr || def.name_en : def.name_en || def.name_tr;
  const description = isTr ? def.description_tr || def.description_en : def.description_en || def.description_tr;
  const props = { ...(def.properties || {}), ...(inv.custom_properties || {}) };
  const combinedText = `${name} ${description}`.toLowerCase();

  let type: ArenaItem['type'] = 'heal_hp';
  if (/mana/i.test(combinedText)) {
    type = 'heal_mana';
  } else if (/antidote|panzehir|cleanse|cure|arındır/i.test(combinedText)) {
    type = 'cleanse';
  } else if (/damage|bomb|bomba|parşömen|scroll|fire/i.test(combinedText)) {
    type = 'damage';
  }

  let value = 25;
  if (props.Healing) {
    const match = String(props.Healing).match(/(\d+)d(\d+)(?:\+(\d+))?/i);
    if (match) {
      value = Math.round(parseInt(match[1], 10) * ((parseInt(match[2], 10) + 1) / 2)) + (parseInt(match[3] || '0', 10) || 0);
    } else {
      const parsed = parseInt(String(props.Healing), 10);
      if (!isNaN(parsed)) value = parsed;
    }
  } else if (typeof props.value === 'number') {
    value = props.value;
  }

  return {
    id: inv.id,
    name,
    quantity: Math.max(1, inv.quantity),
    type,
    value,
    description,
    isDbItem: true,
    dbItemId: inv.id,
    icon: def.icon_url || undefined,
  };
}

// ─── Fetch Combatant Spells from Spell Tree / DB ─────────────────

export async function fetchCombatantSpells(
  combatant: CombatArenaParticipant | null,
  locale: string = 'tr'
): Promise<ArenaSpell[]> {
  if (!combatant) return [];

  // 1. If combatant is linked to a campaign character, fetch unlocked spells from character_spells!
  if (combatant.character_id) {
    try {
      const { data: charSpells, error: csErr } = await supabase
        .from('character_spells')
        .select('*, spell:spells(*)')
        .eq('character_id', combatant.character_id)
        .eq('unlocked', true);

      if (!csErr && charSpells && charSpells.length > 0) {
        const arenaSpells = charSpells
          .filter((cs) => cs.spell && typeof cs.spell === 'object')
          .map((cs) => mapSpellNodeToArenaSpell(cs.spell as unknown as SpellNode, locale));

        if (arenaSpells.length > 0) {
          return arenaSpells;
        }
      }

      // If character has no unlocked spells yet, fetch from spells table matching their class/tree
      const { data: allSpells, error: sErr } = await supabase
        .from('spells')
        .select('*')
        .limit(10);

      if (!sErr && allSpells && allSpells.length > 0) {
        return allSpells.map((s) => mapSpellNodeToArenaSpell(s as unknown as SpellNode, locale));
      }
    } catch (err) {
      console.warn('Failed to query character_spells from Supabase:', err);
    }
  } else {
    // 2. Archetype / NPC combatant: query available spells from spell tree
    try {
      const { data: dbSpells } = await supabase
        .from('spells')
        .select('*')
        .limit(10);

      if (dbSpells && dbSpells.length > 0) {
        return dbSpells.map((s) => mapSpellNodeToArenaSpell(s as unknown as SpellNode, locale));
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback to spell tree mock spells (Blood Bolt, Vampiric Touch, Entangle, Thorn Whip)
  return MOCK_SPELLS.map((s) => mapSpellNodeToArenaSpell(s, locale));
}

// ─── Fetch Combatant Inventory from DB / Adventurer Pack ─────────

export async function fetchCombatantInventory(
  combatant: CombatArenaParticipant | null,
  locale: string = 'tr'
): Promise<ArenaItem[]> {
  if (!combatant) return [];
  const isTr = locale === 'tr';

  // 1. If combatant is linked to a campaign character, fetch directly from inventory_items!
  if (combatant.character_id) {
    try {
      const { data: dbInv, error: invErr } = await supabase
        .from('inventory_items')
        .select('*, item_definition:item_definitions(*)')
        .eq('character_id', combatant.character_id)
        .gt('quantity', 0);

      if (!invErr && dbInv && dbInv.length > 0) {
        const usableItems = dbInv.map((inv) =>
          mapDbInventoryToArenaItem(inv as unknown as RawDbInventoryItem, locale)
        );
        if (usableItems.length > 0) {
          return usableItems;
        }
      }
    } catch (err) {
      console.warn('Failed to query inventory_items from Supabase:', err);
    }
  }

  // 2. Fallback to character's adventurer pack items from InventoryGrid DEMO_ITEMS
  const consumableOrUsable = DEMO_ITEMS.filter(
    (item) => item.type === 'consumable' || /potion|iksir|bread|scale/i.test(item.name)
  );

  return consumableOrUsable.map((item) => {
    let type: ArenaItem['type'] = 'heal_hp';
    if (/mana/i.test(item.name)) {
      type = 'heal_mana';
    } else if (/antidote|panzehir|cleanse/i.test(item.name)) {
      type = 'cleanse';
    }

    let value = 25;
    if (item.properties?.Healing) {
      const match = String(item.properties.Healing).match(/(\d+)d(\d+)(?:\+(\d+))?/i);
      if (match) {
        value = Math.round(parseInt(match[1], 10) * ((parseInt(match[2], 10) + 1) / 2)) + (parseInt(match[3] || '0', 10) || 0);
      }
    }

    return {
      id: item.id,
      name: isTr ? (item.name === 'Healing Potion' ? 'Can İksiri' : item.name === 'Elven Waybread' ? 'Elf Ekmeği' : item.name) : item.name,
      quantity: item.quantity,
      type,
      value,
      description: item.description,
      isDbItem: false,
    };
  });
}

// ─── Consume Item in Database ────────────────────────────────────

export async function consumeCombatantItem(
  item: ArenaItem,
  combatant: CombatArenaParticipant | null
): Promise<void> {
  if (!item.isDbItem || !item.dbItemId || !combatant?.character_id) {
    return;
  }

  try {
    if (item.quantity > 1) {
      await supabase
        .from('inventory_items')
        .update({ quantity: item.quantity - 1 })
        .eq('id', item.dbItemId);
    } else {
      await supabase
        .from('inventory_items')
        .delete()
        .eq('id', item.dbItemId);
    }
  } catch (err) {
    console.warn('Failed to persist item consumption in database:', err);
  }
}

// Archetype Roster for 4v4 Arena
export const ARCHETYPE_ROSTER = [
  {
    name: 'Valerius Ironclad',
    role: 'Warrior',
    avatar_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80',
    max_hp: 45,
    max_mana: 15,
    ac: 16,
    initiative_score: 14,
  },
  {
    name: 'Morrigan Shadowweaver',
    role: 'Mage',
    avatar_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80',
    max_hp: 28,
    max_mana: 50,
    ac: 12,
    initiative_score: 18,
  },
  {
    name: 'Kaelen Nightblade',
    role: 'Rogue',
    avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80',
    max_hp: 34,
    max_mana: 25,
    ac: 14,
    initiative_score: 19,
  },
  {
    name: 'Sister Elenore',
    role: 'Cleric',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    max_hp: 38,
    max_mana: 40,
    ac: 15,
    initiative_score: 12,
  },
  {
    name: 'Gorgar Bloodfist',
    role: 'Orc Berserker',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
    max_hp: 50,
    max_mana: 10,
    ac: 13,
    initiative_score: 15,
  },
  {
    name: 'Malakor The Cursed',
    role: 'Necromancer',
    avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
    max_hp: 30,
    max_mana: 45,
    ac: 11,
    initiative_score: 13,
  },
  {
    name: 'Skarr Venomfang',
    role: 'Goblin Assassin',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    max_hp: 26,
    max_mana: 20,
    ac: 15,
    initiative_score: 20,
  },
  {
    name: 'Vaelen Sunreaver',
    role: 'Paladin',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    max_hp: 44,
    max_mana: 30,
    ac: 17,
    initiative_score: 11,
  },
];
