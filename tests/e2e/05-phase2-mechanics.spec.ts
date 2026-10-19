import { test, expect } from '@playwright/test';
import {
  parseDiceFormula,
  executeRoll,
  subscribeToDiceTray,
  updateDiceTrayConfig,
  clearDiceHistory,
} from '../../src/lib/diceRoller';
import { computeSkillBonuses, DEMO_SKILLS } from '../../src/hooks/useSkillTree';
import {
  TOTAL_SLOTS,
  EQUIP_SLOTS,
  MAX_ATTUNED,
  canEquipInSlot,
  calculateMaxCarryWeight,
  computeDefaultSpellSlots,
} from '../../src/components/inventory/inventoryConstants';
import { getSupabaseClient } from './helpers/supabase';

test.describe('Phase 2: Core RPG Mechanics & Data Integration', () => {
  test('2.6 Universal Dice Roller: parseDiceFormula parses standard, negative, multi-die, and fallback formulas', () => {
    expect(parseDiceFormula('1d20+5')).toEqual({ count: 1, dieType: 'd20', modifier: 5 });
    expect(parseDiceFormula('2d6 + 3')).toEqual({ count: 2, dieType: 'd6', modifier: 3 });
    expect(parseDiceFormula('1d8-2')).toEqual({ count: 1, dieType: 'd8', modifier: -2 });
    expect(parseDiceFormula('1d100')).toEqual({ count: 1, dieType: 'd100', modifier: 0 });
    expect(parseDiceFormula('3d4+2')).toEqual({ count: 3, dieType: 'd4', modifier: 2 });
    expect(parseDiceFormula('1d12 - 1')).toEqual({ count: 1, dieType: 'd12', modifier: -1 });
    expect(parseDiceFormula('+4')).toEqual({ count: 1, dieType: 'd20', modifier: 4 });
    expect(parseDiceFormula('-2')).toEqual({ count: 1, dieType: 'd20', modifier: -2 });
    expect(parseDiceFormula('invalid')).toEqual({ count: 1, dieType: 'd20', modifier: 0 });
  });

  test('2.6 Universal Dice Roller: executeRoll & tray state handle normal, advantage, disadvantage, and multi-die accurately', () => {
    for (let i = 0; i < 25; i++) {
      const adv = executeRoll({ dieType: 'd20', count: 1, modifier: 3, mode: 'advantage', label: 'Attack' });
      expect(adv.rolls).toHaveLength(2);
      expect(adv.keptRoll).toBe(Math.max(adv.rolls[0], adv.rolls[1]));
      expect(adv.discardedRoll).toBe(Math.min(adv.rolls[0], adv.rolls[1]));
      expect(adv.total).toBe(adv.keptRoll + 3);
      expect(adv.isCrit).toBe(adv.keptRoll === 20);
      expect(adv.isFumble).toBe(adv.keptRoll === 1);

      const dis = executeRoll({ dieType: 'd20', count: 1, modifier: -1, mode: 'disadvantage', label: 'Stealth' });
      expect(dis.rolls).toHaveLength(2);
      expect(dis.keptRoll).toBe(Math.min(dis.rolls[0], dis.rolls[1]));
      expect(dis.discardedRoll).toBe(Math.max(dis.rolls[0], dis.rolls[1]));
      expect(dis.total).toBe(dis.keptRoll - 1);

      const multi = executeRoll({ formula: '3d6+2', label: 'Fireball Fragment' });
      expect(multi.rolls).toHaveLength(3);
      expect(multi.keptRoll).toBe(multi.rolls.reduce((a, b) => a + b, 0));
      expect(multi.total).toBe(multi.keptRoll + 2);
      expect(multi.isCrit).toBe(false);
    }

    let latestDie = 'd20';
    const unsub = subscribeToDiceTray((st) => {
      latestDie = st.selectedDie;
    });
    updateDiceTrayConfig({ selectedDie: 'd12', modifier: 4 });
    expect(latestDie).toBe('d12');
    clearDiceHistory();
    unsub();
  });

  test('2.1 & 2.2 Inventory Mechanics: 24-slot architecture, equipment slot restrictions, attunement limit, and STR * 15 lbs capacity', () => {
    expect(TOTAL_SLOTS).toBe(24);
    expect(EQUIP_SLOTS).toBe(4);
    expect(MAX_ATTUNED).toBe(3);

    // Carrying capacity: STR * 15 lbs (with minimum 15 lbs floor)
    expect(calculateMaxCarryWeight(10)).toBe(150);
    expect(calculateMaxCarryWeight(18)).toBe(270);
    expect(calculateMaxCarryWeight(0)).toBe(15);
    expect(calculateMaxCarryWeight(NaN)).toBe(150);

    // Slot restrictions:
    // Slot 0 = Main Hand (weapon only)
    expect(canEquipInSlot({ name: 'Flamebrand', type: 'weapon' }, 0).valid).toBe(true);
    expect(canEquipInSlot({ name: 'Mithril Chainmail', type: 'armor' }, 0).valid).toBe(false);

    // Slot 1 = Armor (armor only)
    expect(canEquipInSlot({ name: 'Mithril Chainmail', type: 'armor' }, 1).valid).toBe(true);
    expect(canEquipInSlot({ name: 'Flamebrand', type: 'weapon' }, 1).valid).toBe(false);

    // Slot 2 = Off-Hand / Ring (weapon, armor, shield, ring, accessory, misc)
    expect(canEquipInSlot({ name: 'Ring of Shadows', type: 'ring' }, 2).valid).toBe(true);
    expect(canEquipInSlot({ name: 'Flamebrand', type: 'weapon' }, 2).valid).toBe(true);

    // Slot 3 = Amulet / Relic (amulet, ring, accessory, relic, misc)
    expect(canEquipInSlot({ name: 'Amulet of Fate', type: 'misc' }, 3).valid).toBe(true);
    expect(canEquipInSlot({ name: 'Flamebrand', type: 'weapon' }, 3).valid).toBe(false);

    // Consumables and Quest items cannot be equipped in any armament slot (0..3), but are valid in bag slots (4..23)
    for (let s = 0; s < EQUIP_SLOTS; s++) {
      expect(canEquipInSlot({ name: 'Healing Potion', type: 'consumable' }, s).valid).toBe(false);
      expect(canEquipInSlot({ name: 'Dragon Scale', type: 'quest' }, s).valid).toBe(false);
    }
    expect(canEquipInSlot({ name: 'Healing Potion', type: 'consumable' }, 4).valid).toBe(true);
    expect(canEquipInSlot({ name: 'Dragon Scale', type: 'quest' }, 23).valid).toBe(true);
    expect(canEquipInSlot({ name: 'Dragon Scale', type: 'quest' }, 24).valid).toBe(false);
  });

  test('2.3 Spell Slot Matrix: computeDefaultSpellSlots generates 1st through 9th level spell slots', () => {
    const lvl1Slots = computeDefaultSpellSlots(1);
    expect(Object.keys(lvl1Slots)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    expect(lvl1Slots['1'].max).toBeGreaterThanOrEqual(2);
    expect(lvl1Slots['1'].used).toBe(0);

    const lvl15Slots = computeDefaultSpellSlots(15);
    expect(lvl15Slots['1'].max).toBe(4);
    expect(lvl15Slots['5'].max).toBe(3);
    expect(lvl15Slots['7'].max).toBe(2);
    expect(lvl15Slots['9'].max).toBe(1);
  });

  test('2.4 Yggdrasil Skill Tree: computeSkillBonuses aggregates stat, HP, AC, initiative, and save bonuses with deduplication', () => {
    const emptyBonuses = computeSkillBonuses(new Set());
    expect(emptyBonuses.statBonuses.STR).toBe(0);
    expect(emptyBonuses.hpBonus).toBe(0);
    expect(emptyBonuses.acBonus).toBe(0);

    // Unlock tier 1 & tier 2 nodes across STR, DEX, CON, including duplicates and Turkish name lookup
    const unlocked = new Set([
      'str-1',
      'STR-1', // duplicate case-insensitive check
      'str-2',
      'str-3',
      'dex-1',
      'dex-3',
      ' dex-4 ',
      'con-1',
      'con-2',
      'Kale Beden', // Turkish name lookup for con-4
    ]);
    const bonuses = computeSkillBonuses(unlocked);

    expect(bonuses.statBonuses.STR).toBe(3); // str-1 (+1) + str-3 (+2)
    expect(bonuses.statBonuses.DEX).toBe(1); // dex-3 (+1)
    expect(bonuses.statBonuses.CON).toBe(3); // con-4 (+3)
    expect(bonuses.hpBonus).toBe(35); // con-1 (+5) + con-2 (+10) + con-4 (+20)
    expect(bonuses.acBonus).toBe(1); // dex-1 (+1)
    expect(bonuses.initiativeBonus).toBe(3); // dex-4 (+3)
    expect(bonuses.savingThrowBonuses.STR).toBe(2); // str-2 (+2)
    expect(bonuses.unlockedDefs.length).toBe(9);
    expect(DEMO_SKILLS.length).toBe(24);

    // Default unlocked skills ('str-1', 'dex-1') parity check between CharacterSheet and YggdrasilTree
    const defaultTreeBonuses = computeSkillBonuses(new Set(['str-1', 'dex-1']));
    expect(defaultTreeBonuses.unlockedDefs.map((d) => d.id)).toEqual(['str-1', 'dex-1']);
    expect(defaultTreeBonuses.statBonuses.STR).toBe(1);
    expect(defaultTreeBonuses.acBonus).toBe(1);
  });

  test('2.1 & 2.5 Supabase Live Schema Queries: characters, item_definitions, skill_definitions, inventory_items, character_skills, map_tokens', async () => {
    const supabase = getSupabaseClient();

    try {
      const timeoutSentinel = Symbol('timeout');
      const queryPromise = Promise.all([
        supabase.from('characters').select('id, name, level, xp_total, xp_available, appearance').limit(5),
        supabase.from('item_definitions').select('id, name_en, type, rarity').limit(5),
        supabase.from('skill_definitions').select('id, name_en, stat_parent, tier').limit(5),
        supabase.from('inventory_items').select('id, character_id, item_definition_id, quantity, equipped').limit(5),
        supabase.from('character_skills').select('id, character_id, skill_definition_id, unlocked').limit(5),
        supabase.from('map_tokens').select('id, campaign_id, character_id, x_position, y_position').limit(5),
      ]);

      const raced = await Promise.race([
        queryPromise,
        new Promise<typeof timeoutSentinel>((resolve) => setTimeout(() => resolve(timeoutSentinel), 5000)),
      ]);

      if (raced === timeoutSentinel) {
        test.skip(true, 'Outbound network is sandboxed in current test runner environment');
        return;
      }

      const [charsRes, itemsDefRes, skillsDefRes, invRes, charSkillsRes, tokensRes] = raced;

      for (const res of [charsRes, itemsDefRes, skillsDefRes, invRes, charSkillsRes, tokensRes]) {
        if (res.error && res.error.message?.includes('fetch failed')) {
          test.skip(true, 'Outbound network is sandboxed in current test runner environment');
          return;
        }
        expect(res.error).toBeNull();
      }
    } catch (err) {
      const msg = String((err as Error)?.message || err);
      if (msg.includes('fetch failed') || msg.includes('ConnectTimeoutError')) {
        test.skip(true, 'Outbound network is sandboxed in current test runner environment');
        return;
      }
      throw err;
    }
  });
});

