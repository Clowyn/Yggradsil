import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Heart, Zap, Sword, Sparkles, Award, User,
  Backpack, ChevronRight, Compass, Flame, Eye, Activity,
  CheckCircle2, AlertCircle, Dices, Moon, Sun, Skull, Plus, Minus
} from 'lucide-react';
import type { Character, StatKey, ItemRarity, CharacterVitals } from '../../lib/types';
import { RARITY_COLORS } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseOffline } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { computeSkillBonuses, DEMO_SKILLS } from '../../hooks/useSkillTree';
import { triggerDiceRoll } from '../../lib/diceRoller';
import { arcaneToast } from '../../lib/toast';
import { playSound } from '../../lib/audio';

interface CharacterSheetProps {
  character: Character;
  onOpenCreation?: () => void;
}

interface CharacterStatRow {
  stat_key: StatKey;
  base_value: number;
  bonus_value: number;
}

interface EquippedItem {
  id: string;
  name: string;
  name_tr?: string;
  name_en?: string;
  rarity: ItemRarity;
  type: string;
  icon: string;
  properties?: Record<string, string>;
}

const STAT_LABELS: Record<StatKey, { en: string; tr: string; descEn: string; descTr: string }> = {
  STR: { en: 'Strength', tr: 'Kuvvet', descEn: 'Physical power and melee attacks', descTr: 'Fiziksel güç ve yakın dövüş' },
  DEX: { en: 'Dexterity', tr: 'Çeviklik', descEn: 'Agility, reflexes, and balance', descTr: 'Çeviklik, refleksler ve denge' },
  CON: { en: 'Constitution', tr: 'Dayanıklılık', descEn: 'Health, stamina, and vital force', descTr: 'Sağlık, direnç ve yaşamsal güç' },
  INT: { en: 'Intelligence', tr: 'Zeka', descEn: 'Reasoning, memory, and arcane lore', descTr: 'Mantık, hafıza ve büyü ilmi' },
  WIS: { en: 'Wisdom', tr: 'Bilgelik', descEn: 'Perception, insight, and willpower', descTr: 'Algı, sezgi ve irade' },
  CHA: { en: 'Charisma', tr: 'Karizma', descEn: 'Force of personality and presence', descTr: 'Kişilik gücü ve liderlik' },
};

const SKILL_MAP: Array<{ key: string; nameEn: string; nameTr: string; stat: StatKey }> = [
  { key: 'athletics', nameEn: 'Athletics', nameTr: 'Atletizm', stat: 'STR' },
  { key: 'acrobatics', nameEn: 'Acrobatics', nameTr: 'Akrobasi', stat: 'DEX' },
  { key: 'sleight_of_hand', nameEn: 'Sleight of Hand', nameTr: 'El Çabukluğu', stat: 'DEX' },
  { key: 'stealth', nameEn: 'Stealth', nameTr: 'Gizlilik', stat: 'DEX' },
  { key: 'arcana', nameEn: 'Arcana', nameTr: 'Büyü Bilgisi', stat: 'INT' },
  { key: 'history', nameEn: 'History', nameTr: 'Tarih', stat: 'INT' },
  { key: 'investigation', nameEn: 'Investigation', nameTr: 'Soruşturma', stat: 'INT' },
  { key: 'nature', nameEn: 'Nature', nameTr: 'Doğa', stat: 'INT' },
  { key: 'religion', nameEn: 'Religion', nameTr: 'Din', stat: 'INT' },
  { key: 'animal_handling', nameEn: 'Animal Handling', nameTr: 'Hayvan Terbiyesi', stat: 'WIS' },
  { key: 'insight', nameEn: 'Insight', nameTr: 'Sezgi', stat: 'WIS' },
  { key: 'medicine', nameEn: 'Medicine', nameTr: 'Tıp', stat: 'WIS' },
  { key: 'perception', nameEn: 'Perception', nameTr: 'Algı', stat: 'WIS' },
  { key: 'survival', nameEn: 'Survival', nameTr: 'Hayatta Kalma', stat: 'WIS' },
  { key: 'deception', nameEn: 'Deception', nameTr: 'Aldatma', stat: 'CHA' },
  { key: 'intimidation', nameEn: 'Intimidation', nameTr: 'Gözdağı', stat: 'CHA' },
  { key: 'performance', nameEn: 'Performance', nameTr: 'Performans', stat: 'CHA' },
  { key: 'persuasion', nameEn: 'Persuasion', nameTr: 'İkna', stat: 'CHA' },
];

import { computeDefaultSpellSlots, DEMO_ITEMS } from '../inventory/inventoryConstants';

function getLocalEquippedFallback(charId: string): EquippedItem[] {
  for (const key of [`dnd_inventory_slots_${charId}`, 'dnd_inventory_slots_demo']) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{
          type?: string;
          item?: {
            id: string;
            name: string;
            rarity: ItemRarity;
            type: string;
            icon: string;
            equipped?: boolean;
            properties?: Record<string, string>;
          } | null;
        }>;
        if (Array.isArray(parsed)) {
          const equipped = parsed
            .filter((s) => (s.type === 'equipped' || s.item?.equipped) && s.item)
            .map((s) => ({
              id: s.item!.id,
              name: s.item!.name,
              name_en: s.item!.name,
              rarity: s.item!.rarity || 'common',
              type: s.item!.type || 'gear',
              icon: s.item!.icon || '🗡️',
              properties: s.item!.properties,
            }));
          if (equipped.length > 0) return equipped;
        }
      }
    } catch {
      // ignore
    }
  }
  return DEMO_ITEMS.filter((i) => i.equipped).map((i) => ({
    id: i.id,
    name: i.name,
    name_en: i.name,
    rarity: i.rarity,
    type: i.type,
    icon: i.icon,
    properties: i.properties,
  }));
}

export function CharacterSheet({ character, onOpenCreation }: CharacterSheetProps) {
  const { locale } = useAuth();
  const isTr = locale === 'tr';

  const [dbStats, setDbStats] = useState<CharacterStatRow[]>([]);
  const [equippedItems, setEquippedItems] = useState<EquippedItem[]>(() =>
    getLocalEquippedFallback(character.id)
  );
  const [unlockedSkillIds, setUnlockedSkillIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`dnd_unlocked_skills_${character.id}`);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) return new Set(parsed);
      }
    } catch {
      // ignore
    }
    return new Set(['str-1', 'dex-1']);
  });
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [hpInputAmount, setHpInputAmount] = useState<number>(5);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      // Read local unlocked skills first
      const mergedSkills = new Set<string>();
      try {
        const saved = localStorage.getItem(`dnd_unlocked_skills_${character.id}`);
        if (saved) {
          for (const id of JSON.parse(saved) as string[]) mergedSkills.add(id);
        }
      } catch {
        // ignore
      }

      try {
        if (!isSupabaseOffline()) {
          const [statsRes, itemsRes, skillsRes] = await Promise.all([
            supabase
              .from('character_stats')
              .select('stat_key, base_value, bonus_value')
              .eq('character_id', character.id),
            supabase
              .from('inventory_items')
              .select(`
                id,
                equipped,
                item_definition:item_definitions(
                  name_tr,
                  name_en,
                  rarity,
                  type,
                  icon_url,
                  properties
                )
              `)
              .eq('character_id', character.id)
              .eq('equipped', true),
            supabase
              .from('character_skills')
              .select('skill_definition_id, skill_definition:skill_definitions(skill_key, name_en)')
              .eq('character_id', character.id)
              .eq('unlocked', true),
          ]);

          if (isMounted) {
            setDbStats(
              statsRes.data && statsRes.data.length > 0
                ? (statsRes.data as CharacterStatRow[])
                : []
            );

            if (skillsRes.data && skillsRes.data.length > 0) {
              for (const row of skillsRes.data as Array<{ skill_definition_id: string; skill_definition?: { skill_key?: string; name_en?: string } | Array<{ skill_key?: string; name_en?: string }> }>) {
                const def = Array.isArray(row.skill_definition) ? row.skill_definition[0] : row.skill_definition;
                if (def?.skill_key) {
                  mergedSkills.add(def.skill_key);
                } else if (def?.name_en) {
                  const m = DEMO_SKILLS.find((s) => s.name.toLowerCase() === def.name_en!.toLowerCase());
                  mergedSkills.add(m?.id || row.skill_definition_id);
                } else {
                  mergedSkills.add(row.skill_definition_id);
                }
              }
            }
            if (mergedSkills.size === 0) {
              mergedSkills.add('str-1');
              mergedSkills.add('dex-1');
            }
            setUnlockedSkillIds(new Set(mergedSkills));

            if (!itemsRes.error && itemsRes.data && itemsRes.data.length > 0) {
              const mapped: EquippedItem[] = itemsRes.data.map((row) => {
                const def = Array.isArray(row.item_definition)
                  ? row.item_definition[0]
                  : row.item_definition;
                const props = ((def?.properties as Record<string, string>) || {}) as Record<string, string>;
                return {
                  id: row.id,
                  name: def?.name_en || def?.name_tr || 'Equipped Item',
                  name_tr: def?.name_tr,
                  name_en: def?.name_en,
                  rarity: (def?.rarity as ItemRarity) || 'common',
                  type: def?.type || 'gear',
                  icon: def?.icon_url || props.icon || '🗡️',
                  properties: props,
                };
              });
              setEquippedItems(mapped);
            } else {
              setEquippedItems(getLocalEquippedFallback(character.id));
            }
            setLoadingDetails(false);
          }
        } else {
          if (mergedSkills.size === 0) {
            mergedSkills.add('str-1');
            mergedSkills.add('dex-1');
          }
          if (isMounted) {
            setUnlockedSkillIds(new Set(mergedSkills));
            setEquippedItems(getLocalEquippedFallback(character.id));
            setLoadingDetails(false);
          }
        }
      } catch (err) {
        console.warn('Could not load detailed character stats/items:', err);
        if (isMounted) {
          setEquippedItems(getLocalEquippedFallback(character.id));
          setLoadingDetails(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [character.id]);

  // Compute Yggdrasil Skill Tree Bonuses
  const skillBonuses = useMemo(() => computeSkillBonuses(unlockedSkillIds), [unlockedSkillIds]);

  // Ability scores with fallbacks to race + subclass + Yggdrasil skill tree bonuses
  const stats = useMemo(() => {
    const statKeys: StatKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    const raceBonuses = (character.race?.stat_bonuses as Record<string, number>) || {};
    const classBases = (character.subclass?.base_stats as Record<string, number>) || {};

    const result: Record<StatKey, { score: number; treeBonus: number; mod: number; modStr: string }> = {} as Record<
      StatKey,
      { score: number; treeBonus: number; mod: number; modStr: string }
    >;

    statKeys.forEach((key) => {
      const dbStat = dbStats.find((s) => s.stat_key === key);
      let baseScore: number;
      if (dbStat) {
        baseScore = dbStat.base_value + dbStat.bonus_value;
      } else {
        const raceBonus = raceBonuses[key] || 0;
        const classBase = classBases[key] || 10;
        baseScore = classBase + raceBonus;
      }
      const treeBonus = skillBonuses.statBonuses[key] || 0;
      const score = baseScore + treeBonus;
      const mod = Math.floor((score - 10) / 2);
      result[key] = {
        score,
        treeBonus,
        mod,
        modStr: mod >= 0 ? `+${mod}` : `${mod}`,
      };
    });

    return result;
  }, [character, dbStats, skillBonuses]);

  const level = character.level || 1;
  const profBonus = Math.floor((level - 1) / 4) + 2;
  const profBonusStr = `+${profBonus}`;

  // Calculated Vitals
  const conMod = stats.CON.mod;
  const dexMod = stats.DEX.mod;
  const wisMod = stats.WIS.mod;

  const maxHP = Math.max(10, 50 + conMod * 5 + (level - 1) * 6 + skillBonuses.hpBonus);
  const equippedArmor = equippedItems.find((i) => i.type === 'armor');
  const armorBonus = useMemo(() => {
    if (!equippedArmor) return 0;
    const rawAc = equippedArmor.properties?.AC || equippedArmor.properties?.ac;
    if (rawAc) {
      const parsed = parseInt(String(rawAc), 10);
      if (!Number.isNaN(parsed)) {
        // If AC is a full base AC like "16" (Mithril Chainmail), bonus over 10 is parsed - 10; if "+3", bonus is 3
        return String(rawAc).trim().startsWith('+') ? parsed : Math.max(1, parsed - 10);
      }
    }
    return 3;
  }, [equippedArmor]);
  const armorClass = 10 + dexMod + armorBonus + skillBonuses.acBonus;
  const initTotal = dexMod + skillBonuses.initiativeBonus;
  const initiative = initTotal >= 0 ? `+${initTotal}` : `${initTotal}`;
  const speed = 30;
  const passivePerception = 10 + wisMod + profBonus;

  const hitDieSides = useMemo(() => {
    const cat = character.subclass?.category?.key;
    if (cat === 'combat') return 10;
    if (cat === 'magic') return 6;
    return 8;
  }, [character.subclass?.category?.key]);

  const vitalsStorageKey = `dnd_vitals_${character.id}`;

  const [vitals, setVitals] = useState<CharacterVitals>(() => {
    const defaultVitals: CharacterVitals = {
      currentHp: maxHP,
      tempHp: 0,
      hitDiceTotal: level,
      hitDiceRemaining: level,
      hitDieType: hitDieSides,
      deathSaves: { successes: 0, failures: 0 },
      spellSlots: computeDefaultSpellSlots(level),
    };

    try {
      const localRaw = localStorage.getItem(vitalsStorageKey);
      if (localRaw) {
        const parsed = JSON.parse(localRaw) as Partial<CharacterVitals>;
        return {
          ...defaultVitals,
          ...parsed,
          deathSaves: parsed.deathSaves || defaultVitals.deathSaves,
          spellSlots: { ...defaultVitals.spellSlots, ...(parsed.spellSlots || {}) },
        };
      }
    } catch {
      // ignore
    }

    const fromChar =
      character.vitals && Object.keys(character.vitals).length > 0
        ? character.vitals
        : character.appearance?.vitals;
    if (fromChar && Object.keys(fromChar).length > 0) {
      return {
        ...defaultVitals,
        ...fromChar,
        deathSaves: fromChar.deathSaves || defaultVitals.deathSaves,
        spellSlots: { ...defaultVitals.spellSlots, ...(fromChar.spellSlots || {}) },
      };
    }

    return defaultVitals;
  });

  // Re-initialize vitals when switching active character
  useEffect(() => {
    const defaultVitals: CharacterVitals = {
      currentHp: maxHP,
      tempHp: 0,
      hitDiceTotal: level,
      hitDiceRemaining: level,
      hitDieType: hitDieSides,
      deathSaves: { successes: 0, failures: 0 },
      spellSlots: computeDefaultSpellSlots(level),
    };
    try {
      const localRaw = localStorage.getItem(vitalsStorageKey);
      if (localRaw) {
        const parsed = JSON.parse(localRaw) as Partial<CharacterVitals>;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setVitals({
          ...defaultVitals,
          ...parsed,
          currentHp: Math.min(maxHP, parsed.currentHp ?? maxHP),
          deathSaves: parsed.deathSaves || defaultVitals.deathSaves,
          spellSlots: { ...defaultVitals.spellSlots, ...(parsed.spellSlots || {}) },
        });
        return;
      }
    } catch {
      // ignore
    }
    const fromChar =
      character.vitals && Object.keys(character.vitals).length > 0
        ? character.vitals
        : character.appearance?.vitals;
    if (fromChar && Object.keys(fromChar).length > 0) {
      setVitals({
        ...defaultVitals,
        ...fromChar,
        currentHp: Math.min(maxHP, fromChar.currentHp ?? maxHP),
        deathSaves: fromChar.deathSaves || defaultVitals.deathSaves,
        spellSlots: { ...defaultVitals.spellSlots, ...(fromChar.spellSlots || {}) },
      });
      return;
    }
    setVitals(defaultVitals);
  }, [character.id, maxHP, level, hitDieSides, vitalsStorageKey, character.vitals, character.appearance?.vitals]);

  const persistVitals = useCallback(
    async (next: CharacterVitals) => {
      setVitals(next);
      try {
        localStorage.setItem(vitalsStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      if (!isSupabaseOffline()) {
        try {
          const nextAppearance = {
            ...(character.appearance || {}),
            vitals: next,
          };
          const { error } = await supabase
            .from('characters')
            .update({ vitals: next, appearance: nextAppearance })
            .eq('id', character.id);
          if (error) {
            await supabase
              .from('characters')
              .update({ appearance: nextAppearance })
              .eq('id', character.id);
          }
        } catch {
          // ignore network errors
        }
      }
    },
    [character.id, character.appearance, vitalsStorageKey]
  );

  // Damage & Heal handlers (D&D 5e rules: Temp HP absorbs damage first)
  const handleDamage = useCallback(
    (amount: number) => {
      const dmg = Math.max(1, Math.floor(amount));
      playSound('error');
      let remDmg = dmg;
      let nextTemp = vitals.tempHp;
      if (nextTemp > 0) {
        const absorbed = Math.min(nextTemp, remDmg);
        nextTemp -= absorbed;
        remDmg -= absorbed;
      }
      const nextHp = Math.max(0, vitals.currentHp - remDmg);
      const next: CharacterVitals = {
        ...vitals,
        currentHp: nextHp,
        tempHp: nextTemp,
      };
      void persistVitals(next);
      if (nextHp === 0 && vitals.currentHp > 0) {
        arcaneToast.error(
          isTr
            ? `${character.name} 0 Can Puanına düştü! Ölüm Kurtarma Zarları aktif.`
            : `${character.name} dropped to 0 HP! Death Saving Throws are now active.`
        );
      }
    },
    [vitals, persistVitals, character.name, isTr]
  );

  const handleHeal = useCallback(
    (amount: number) => {
      const heal = Math.max(1, Math.floor(amount));
      playSound('Button_click_sound');
      const nextHp = Math.min(maxHP, vitals.currentHp + heal);
      const next: CharacterVitals = {
        ...vitals,
        currentHp: nextHp,
        deathSaves: nextHp > 0 ? { successes: 0, failures: 0 } : vitals.deathSaves,
      };
      void persistVitals(next);
    },
    [vitals, maxHP, persistVitals]
  );

  const handleGrantTempHp = useCallback(
    (amount: number) => {
      playSound('skill_unlock');
      // D&D 5e rule: Temp HP takes the higher value rather than stacking infinitely, or adds if 0
      const nextTemp = vitals.tempHp + Math.max(1, amount);
      void persistVitals({ ...vitals, tempHp: nextTemp });
      arcaneToast.arcane(
        isTr ? `+${amount} Geçici Can Puanı kazanıldı!` : `Gained +${amount} Temporary HP!`
      );
    },
    [vitals, persistVitals, isTr]
  );

  const handleSpendHitDie = useCallback(() => {
    if (vitals.hitDiceRemaining <= 0) {
      playSound('error');
      arcaneToast.warning(
        isTr ? 'Kalan Can Zarı (Hit Die) yok! Uzun dinlenme yapın.' : 'No Hit Dice remaining! Take a Long Rest to recover Hit Dice.'
      );
      return;
    }
    const event = triggerDiceRoll({
      label: `${character.name} Hit Die Recovery`,
      formula: `1d${vitals.hitDieType}${conMod >= 0 ? `+${conMod}` : conMod}`,
      characterName: character.name,
      openModal: false,
    });
    const healed = Math.max(1, event.total);
    const nextHp = Math.min(maxHP, vitals.currentHp + healed);
    const next: CharacterVitals = {
      ...vitals,
      currentHp: nextHp,
      hitDiceRemaining: Math.max(0, vitals.hitDiceRemaining - 1),
      deathSaves: nextHp > 0 ? { successes: 0, failures: 0 } : vitals.deathSaves,
    };
    void persistVitals(next);
    arcaneToast.success(
      isTr
        ? `Can Zarı harcandı (1d${vitals.hitDieType}): +${healed} HP iyileşti!`
        : `Spent 1 Hit Die (1d${vitals.hitDieType}): recovered +${healed} HP!`
    );
  }, [vitals, character.name, conMod, maxHP, persistVitals, isTr]);

  const handleShortRest = useCallback(() => {
    playSound('skill_unlock');
    if (vitals.currentHp < maxHP && vitals.hitDiceRemaining > 0) {
      handleSpendHitDie();
    } else {
      arcaneToast.info(
        isTr
          ? `${character.name} Kısa Dinlenme tamamladı.`
          : `${character.name} completed a Short Rest.`
      );
    }
  }, [vitals.currentHp, vitals.hitDiceRemaining, maxHP, handleSpendHitDie, character.name, isTr]);

  const handleLongRest = useCallback(() => {
    playSound('skill_unlock');
    const regainedHitDice = Math.max(1, Math.floor(level / 2));
    const resetSlots: Record<string, { max: number; used: number }> = {};
    for (const [lvlKey, slot] of Object.entries(vitals.spellSlots)) {
      resetSlots[lvlKey] = { max: slot.max, used: 0 };
    }
    const next: CharacterVitals = {
      ...vitals,
      currentHp: maxHP,
      tempHp: 0,
      hitDiceTotal: level,
      hitDiceRemaining: Math.min(level, vitals.hitDiceRemaining + regainedHitDice),
      deathSaves: { successes: 0, failures: 0 },
      spellSlots: resetSlots,
    };
    void persistVitals(next);
    arcaneToast.success(
      isTr
        ? `${character.name} Uzun Dinlenme tamamladı! Can, Büyü Yuvaları ve Can Zarları yenilendi.`
        : `${character.name} completed a Long Rest! Full HP, Spell Slots, and Hit Dice restored.`
    );
  }, [vitals, level, maxHP, persistVitals, character.name, isTr]);

  const handleRollDeathSave = useCallback(() => {
    const event = triggerDiceRoll({
      label: `${character.name} Death Saving Throw`,
      formula: '1d20',
      characterName: character.name,
      openModal: false,
    });
    const roll = event.keptRolls[0];
    if (roll === 20) {
      const next: CharacterVitals = {
        ...vitals,
        currentHp: 1,
        deathSaves: { successes: 0, failures: 0 },
      };
      void persistVitals(next);
      arcaneToast.success(
        isTr
          ? 'DOĞAL 20! 1 Can Puanı ile bilinciniz yerine geldi!'
          : 'NATURAL 20! You regain consciousness with 1 HP!'
      );
      return;
    }
    if (roll === 1) {
      const nextFailures = Math.min(3, vitals.deathSaves.failures + 2);
      void persistVitals({
        ...vitals,
        deathSaves: { ...vitals.deathSaves, failures: nextFailures },
      });
      arcaneToast.error(
        isTr
          ? `Doğal 1! 2 Ölüm Kurtarma başarısızlığı (${nextFailures}/3)!`
          : `Natural 1! Suffering 2 Death Save failures (${nextFailures}/3)!`
      );
      return;
    }
    if (roll >= 10) {
      const nextSuccesses = Math.min(3, vitals.deathSaves.successes + 1);
      void persistVitals({
        ...vitals,
        deathSaves: { ...vitals.deathSaves, successes: nextSuccesses },
      });
      arcaneToast.success(
        nextSuccesses >= 3
          ? isTr
            ? `Ölüm Kurtarma Başarılı (${roll}) — Karakter Stabilize Oldu!`
            : `Death Save Success (${roll}) — Character Stabilized (3/3)!`
          : isTr
          ? `Ölüm Kurtarma Başarılı: ${roll} (${nextSuccesses}/3)`
          : `Death Save Success: rolled ${roll} (${nextSuccesses}/3)`
      );
    } else {
      const nextFailures = Math.min(3, vitals.deathSaves.failures + 1);
      void persistVitals({
        ...vitals,
        deathSaves: { ...vitals.deathSaves, failures: nextFailures },
      });
      arcaneToast.error(
        isTr
          ? `Ölüm Kurtarma Başarısız: ${roll} (${nextFailures}/3)`
          : `Death Save Failure: rolled ${roll} (${nextFailures}/3)`
      );
    }
  }, [vitals, character.name, persistVitals, isTr]);

  const handleToggleSpellSlot = useCallback(
    (lvlKey: string, pipIndex: number) => {
      playSound('lock_click');
      const slot = vitals.spellSlots[lvlKey];
      if (!slot) return;
      const isCurrentlyUsed = pipIndex < slot.used;
      const nextUsed = isCurrentlyUsed ? pipIndex : pipIndex + 1;
      const next: CharacterVitals = {
        ...vitals,
        spellSlots: {
          ...vitals.spellSlots,
          [lvlKey]: {
            ...slot,
            used: Math.max(0, Math.min(slot.max, nextUsed)),
          },
        },
      };
      void persistVitals(next);
    },
    [vitals, persistVitals]
  );

  const currentHP = Math.min(maxHP, vitals.currentHp);
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHP / maxHP) * 100)));

  // XP calculations
  const nextLevelXp = level * 1000;
  const xpCurrent = character.xp_total || 0;
  const xpAvailable = character.xp_available ?? 0;
  const xpProgressPercent = Math.min(100, Math.round((xpCurrent / nextLevelXp) * 100));

  // Saving Throw Proficiencies (Subclass primary stat bias)
  const isProficientSave = (key: StatKey) => {
    const primaryCategory = character.subclass?.category?.key;
    if (primaryCategory === 'combat') return key === 'STR' || key === 'CON';
    if (primaryCategory === 'magic') return key === 'INT' || key === 'WIS';
    if (primaryCategory === 'covert') return key === 'DEX' || key === 'INT';
    return key === 'CON' || key === 'WIS';
  };

  const [mobileSection, setMobileSection] = useState<'all' | 'vitals' | 'abilities' | 'spells' | 'gear'>('all');

  const showVitalsOnMobile = mobileSection === 'all' || mobileSection === 'vitals';
  const showSpellsOnMobile = mobileSection === 'all' || mobileSection === 'spells';
  const showAbilitiesOnMobile = mobileSection === 'all' || mobileSection === 'abilities';
  const showGearOnMobile = mobileSection === 'all' || mobileSection === 'gear';

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ─── Hero Header & Identity Card (Double-Bezel) ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="double-bezel relative overflow-hidden"
      >
        <div className="double-bezel-core p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Avatar or Class Emblem */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b from-[#2a1f0e] to-[#0a0a0f] border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] overflow-hidden">
                  {character.avatar_url ? (
                    <img
                      src={character.avatar_url}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl select-none">
                      {character.race?.icon_url || '🧙'}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black font-cinzel font-bold text-xs px-2 py-0.5 rounded-lg shadow-md border border-white/20">
                  Lv. {level}
                </div>
              </div>

              {/* Name and Archetype Titles */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-cinzel font-bold text-gold-gradient tracking-wide truncate">
                    {character.name}
                  </h1>
                  {character.race?.tier && (
                    <span className="text-[10px] font-cinzel uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-900/40">
                      {isTr ? character.race.tier.name_tr : character.race.tier.name_en}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs sm:text-sm text-stone-300 font-inter">
                  <span className="flex items-center gap-1.5 text-amber-100 font-medium font-cinzel">
                    <User size={14} className="text-amber-400" />
                    {character.race?.name || (isTr ? 'Bilinmeyen Irk' : 'Unknown Race')}
                  </span>
                  <span className="text-amber-900">•</span>
                  <span className="flex items-center gap-1.5 text-amber-300 font-medium font-cinzel">
                    <Flame size={14} className="text-amber-400" />
                    {character.subclass
                      ? isTr
                        ? character.subclass.name_tr
                        : character.subclass.name_en
                      : isTr
                      ? 'Sınıfsız'
                      : 'Unclassed'}
                  </span>
                  {character.subclass?.category && (
                    <>
                      <span className="text-amber-900 hidden sm:inline">•</span>
                      <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-black/40 text-stone-300 border border-amber-900/30 font-cinzel">
                        {isTr
                          ? character.subclass.category.name_tr
                          : character.subclass.category.name_en}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions & Navigation */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
              <Link
                to="/spells"
                className="px-3 py-2 rounded-xl bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 border border-purple-900/40 text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Sparkles size={14} className="text-purple-400" />
                {isTr ? 'Büyü Kitabı' : 'Grimoire'}
              </Link>
              <Link
                to="/stat-tree"
                className="px-3 py-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200 border border-emerald-900/40 text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Award size={14} className="text-emerald-400" />
                {isTr ? 'Yggdrasil Ağacı' : 'Yggdrasil Tree'}
              </Link>
              <Link
                to="/inventory"
                className="px-3 py-2 rounded-xl bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 border border-amber-900/40 text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Backpack size={14} className="text-amber-400" />
                {isTr ? 'Maceracı Çantası' : 'Adventurer Pack'}
              </Link>
              {onOpenCreation && (
                <button
                  type="button"
                  onClick={onOpenCreation}
                  className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Compass size={14} className="text-amber-400" />
                  {isTr ? 'Yeni Maceracı' : 'New Adventurer'}
                </button>
              )}
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-amber-900/25">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5 font-cinzel">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 font-medium">
                  {isTr ? 'Deneyim (XP):' : 'Experience Points:'}
                </span>
                <span className="text-amber-300 font-bold">{xpCurrent.toLocaleString()} XP</span>
                <span className="text-stone-500">/ {nextLevelXp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-medium bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-900/40">
                  {isTr ? 'Harcanabilir XP:' : 'Available XP:'} {xpAvailable.toLocaleString()}
                </span>
                <span className="text-stone-400 font-semibold">{xpProgressPercent}%</span>
              </div>
            </div>
            <div className="w-full h-2 rounded-full bg-black/60 border border-amber-950/40 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Sticky Mobile & Tablet Section Switcher (<1024px) ─────────────────── */}
      <div
        data-testid="character-sheet-mobile-tabs"
        className="lg:hidden sticky top-0 z-20 -mx-2 px-2 py-2 bg-[#07080d]/95 border-y border-amber-900/30 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
      >
        {([
          { id: 'all', labelTr: 'Tümü', labelEn: 'All Sections' },
          { id: 'vitals', labelTr: 'Yaşam & Savaş', labelEn: 'Vitals & Combat' },
          { id: 'abilities', labelTr: 'Nitelikler & Beceriler', labelEn: 'Stats & Skills' },
          { id: 'spells', labelTr: 'Büyü Yuvaları', labelEn: 'Spell Slots' },
          { id: 'gear', labelTr: 'Teçhizat & Ağaç', labelEn: 'Relics & Nodes' },
        ] as const).map((tab) => {
          const active = mobileSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`char-tab-${tab.id}`}
              onClick={() => setMobileSection(tab.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-cinzel font-bold tracking-wider transition-all cursor-pointer border ${
                active
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-[#0e1017] text-stone-400 border-white/10 hover:text-amber-200'
              }`}
            >
              {isTr ? tab.labelTr : tab.labelEn}
            </button>
          );
        })}
      </div>

      {/* ─── Vitals Hero Row ─────────────────────────────────────── */}
      <div className={`${showVitalsOnMobile ? 'grid' : 'hidden lg:grid'} grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`}>
        {/* HP */}
        <div className="arcane-glass p-3.5 border border-rose-900/40 bg-rose-950/20 flex flex-col items-center justify-center text-center shadow-lg rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-cinzel font-bold mb-1">
            <Heart size={14} className="text-rose-500 fill-rose-500/20" />
            <span>{isTr ? 'Can Puanı' : 'Hit Points'}</span>
          </div>
          <div className="text-2xl font-cinzel font-extrabold text-rose-200 flex items-baseline gap-1">
            <span>{currentHP}</span>
            <span className="text-xs text-rose-400/80">/ {maxHP}</span>
            {vitals.tempHp > 0 && (
              <span className="text-xs text-cyan-300 font-bold ml-1" title="Temporary HP">
                (+{vitals.tempHp} THP)
              </span>
            )}
          </div>
          <div className="w-full bg-black/50 h-1.5 rounded-full mt-2 overflow-hidden border border-rose-900/50">
            <div
              className={`h-full transition-all duration-300 ${
                currentHP === 0
                  ? 'bg-red-900'
                  : hpPercent <= 30
                  ? 'bg-gradient-to-r from-red-700 to-orange-500'
                  : 'bg-gradient-to-r from-rose-700 to-rose-400'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Armor Class (Click-to-Roll Defense Check) */}
        <button
          type="button"
          onClick={() =>
            triggerDiceRoll({
              label: `${character.name} — Defense Check (AC ${armorClass})`,
              formula: `1d20${dexMod + skillBonuses.acBonus >= 0 ? `+${dexMod + skillBonuses.acBonus}` : dexMod + skillBonuses.acBonus}`,
              characterName: character.name,
            })
          }
          className="arcane-glass p-3.5 border border-amber-900/40 hover:border-amber-400/60 bg-amber-950/20 flex flex-col items-center justify-center text-center shadow-lg rounded-2xl cursor-pointer transition-all group"
          title="Click to roll Defense Check (1d20)"
        >
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-cinzel font-bold mb-1">
            <Shield size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
            <span>{isTr ? 'Zırh Sınıfı (AC)' : 'Armor Class'}</span>
            <Dices size={11} className="text-amber-300/70" />
          </div>
          <div className="text-2xl font-cinzel font-extrabold text-amber-200">{armorClass}</div>
          <span className="text-[10px] text-amber-300/70 font-inter mt-1">
            {armorBonus > 0 ? (isTr ? `+${armorBonus} Zırh dahil` : `+${armorBonus} Armor bonus`) : (isTr ? 'Temel Refleks' : 'Base Dexterity')}
          </span>
        </button>

        {/* Initiative (Click-to-Roll) */}
        <button
          type="button"
          onClick={() =>
            triggerDiceRoll({
              label: `${character.name} — Initiative`,
              formula: `1d20${initTotal >= 0 ? `+${initTotal}` : initTotal}`,
              characterName: character.name,
            })
          }
          className="arcane-glass p-3.5 border border-amber-900/40 hover:border-amber-400/60 bg-amber-950/20 flex flex-col items-center justify-center text-center shadow-lg rounded-2xl cursor-pointer transition-all group"
          title="Click to roll Initiative (1d20)"
        >
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-cinzel font-bold mb-1">
            <Sword size={14} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>{isTr ? 'İnisiyatif' : 'Initiative'}</span>
            <Dices size={11} className="text-amber-300/70" />
          </div>
          <div className="text-2xl font-cinzel font-extrabold text-amber-200">{initiative}</div>
          <span className="text-[10px] text-amber-300/70 font-inter mt-1">Click to Roll d20</span>
        </button>

        {/* Speed */}
        <div className="arcane-glass p-3.5 border border-emerald-900/40 bg-emerald-950/20 flex flex-col items-center justify-center text-center shadow-lg rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-cinzel font-bold mb-1">
            <Activity size={14} className="text-emerald-400" />
            <span>{isTr ? 'Hız' : 'Speed'}</span>
          </div>
          <div className="text-2xl font-cinzel font-extrabold text-emerald-200">{speed} <span className="text-xs">ft</span></div>
          <span className="text-[10px] text-emerald-300/70 font-inter mt-1">{isTr ? 'Standart hareket' : 'Base Movement'}</span>
        </div>

        {/* Proficiency Bonus */}
        <div className="arcane-glass p-3.5 border border-purple-900/40 bg-purple-950/20 flex flex-col items-center justify-center text-center shadow-lg rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-cinzel font-bold mb-1">
            <Zap size={14} className="text-purple-400" />
            <span>{isTr ? 'Yeterlilik' : 'Proficiency'}</span>
          </div>
          <div className="text-2xl font-cinzel font-extrabold text-purple-200">{profBonusStr}</div>
          <span className="text-[10px] text-purple-300/70 font-inter mt-1">Tier {Math.ceil(level / 4)} bonus</span>
        </div>

        {/* Passive Perception */}
        <div className="arcane-glass p-3.5 border border-sky-900/40 bg-sky-950/20 flex flex-col items-center justify-center text-center shadow-lg rounded-2xl">
          <div className="flex items-center gap-1.5 text-xs text-sky-400 font-cinzel font-bold mb-1">
            <Eye size={14} className="text-sky-400" />
            <span>{isTr ? 'Pasif Algı' : 'Passive Sense'}</span>
          </div>
          <div className="text-2xl font-cinzel font-extrabold text-sky-200">{passivePerception}</div>
          <span className="text-[10px] text-sky-300/70 font-inter mt-1">10 + WIS + Prof</span>
        </div>
      </div>

      {/* ─── D&D 5e Live Vitals, Rest & Spell Slot Engine (Task 2.3) ─── */}
      <div className={`${showVitalsOnMobile || showSpellsOnMobile ? 'grid' : 'hidden lg:grid'} grid-cols-1 lg:grid-cols-12 gap-4`}>
        {/* Left: Combat Vitals, Hit Dice & Rest Controls (7 cols) */}
        <div className={`${showVitalsOnMobile ? 'block' : 'hidden lg:block'} lg:col-span-7 arcane-glass p-4 sm:p-5 border border-rose-900/35 bg-[#0e1017]/90 rounded-2xl shadow-xl space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-amber-900/25">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-rose-400" />
              <h3 className="text-xs sm:text-sm font-cinzel font-bold text-amber-100 uppercase tracking-wider">
                {isTr ? 'Can, Dinlenme & Ölüm Kurtarma Motoru' : 'Vitality, Rest & Death Save Engine'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShortRest}
                className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-600/40 text-amber-200 text-[11px] font-cinzel font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Short Rest: Spend a Hit Die to recover HP"
              >
                <Sun size={12} className="text-amber-400" />
                <span>{isTr ? 'Kısa Dinlenme' : 'Short Rest'}</span>
              </button>
              <button
                type="button"
                onClick={handleLongRest}
                className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-200 text-[11px] font-cinzel font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                title="Long Rest: Restore full HP, Spell Slots, and Hit Dice"
              >
                <Moon size={12} className="text-indigo-400" />
                <span>{isTr ? 'Uzun Dinlenme' : 'Long Rest'}</span>
              </button>
            </div>
          </div>

          {/* HP Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleDamage(1)}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-700/50 text-rose-200 text-xs font-cinzel font-bold cursor-pointer"
              >
                -1 HP
              </button>
              <button
                type="button"
                onClick={() => handleDamage(5)}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-700/50 text-rose-200 text-xs font-cinzel font-bold cursor-pointer"
              >
                -5 HP
              </button>
              <button
                type="button"
                onClick={() => handleHeal(1)}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-700/50 text-emerald-200 text-xs font-cinzel font-bold cursor-pointer"
              >
                +1 HP
              </button>
              <button
                type="button"
                onClick={() => handleHeal(5)}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-700/50 text-emerald-200 text-xs font-cinzel font-bold cursor-pointer"
              >
                +5 HP
              </button>
              <button
                type="button"
                onClick={() => handleGrantTempHp(5)}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-700/50 text-cyan-200 text-xs font-cinzel font-bold cursor-pointer"
              >
                +5 Temp HP
              </button>
            </div>

            {/* Custom HP Delta */}
            <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl border border-amber-900/30">
              <input
                type="number"
                min={1}
                max={999}
                value={hpInputAmount}
                onChange={(e) => setHpInputAmount(Math.max(1, Number(e.target.value) || 1))}
                aria-label="Custom HP amount"
                className="w-12 bg-black/60 border border-amber-900/40 rounded px-1.5 py-0.5 text-xs text-amber-200 font-cinzel text-center"
              />
              <button
                type="button"
                onClick={() => handleDamage(hpInputAmount)}
                className="px-2 py-1 rounded bg-rose-900/50 hover:bg-rose-800/60 text-rose-200 text-[10px] font-cinzel font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Minus size={10} /> {isTr ? 'Hasar' : 'Damage'}
              </button>
              <button
                type="button"
                onClick={() => handleHeal(hpInputAmount)}
                className="px-2 py-1 rounded bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-200 text-[10px] font-cinzel font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Plus size={10} /> {isTr ? 'İyileş' : 'Heal'}
              </button>
            </div>
          </div>

          {/* Hit Dice & Death Saving Throws Sub-row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Hit Dice Box */}
            <div className="p-3 rounded-xl bg-black/40 border border-amber-900/25 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-cinzel text-amber-300/80 uppercase tracking-wider font-bold">
                  {isTr ? 'Can Zarları (Hit Dice)' : 'Hit Dice Pool'}
                </div>
                <div className="text-sm font-cinzel font-extrabold text-amber-200 mt-0.5">
                  {vitals.hitDiceRemaining} / {vitals.hitDiceTotal}{' '}
                  <span className="text-xs text-amber-400">(1d{vitals.hitDieType})</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSpendHitDie}
                disabled={vitals.hitDiceRemaining <= 0}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-500/40 text-amber-200 text-[11px] font-cinzel font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Dices size={13} className="text-amber-400" />
                <span>{isTr ? 'Can Zarı Harca' : 'Spend Hit Die'}</span>
              </button>
            </div>

            {/* Death Saving Throws Box */}
            <div
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                currentHP === 0
                  ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                  : 'bg-black/40 border-amber-900/25'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-cinzel text-rose-300 uppercase tracking-wider font-bold flex items-center gap-1">
                  <Skull size={12} className="text-rose-400" />
                  <span>{isTr ? 'Ölüm Kurtarma (Death Saves)' : 'Death Saving Throws'}</span>
                </span>
                <button
                  type="button"
                  onClick={handleRollDeathSave}
                  className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800/80 border border-rose-500/40 text-[10px] font-cinzel font-bold text-rose-100 flex items-center gap-1 cursor-pointer"
                >
                  <Dices size={10} />
                  <span>{isTr ? 'Zar At (d20)' : 'Roll Save'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] font-cinzel">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400/90 text-[10px]">PASS:</span>
                  {[0, 1, 2].map((idx) => {
                    const active = idx < vitals.deathSaves.successes;
                    return (
                      <button
                        key={`ds-s-${idx}`}
                        type="button"
                        onClick={() =>
                          persistVitals({
                            ...vitals,
                            deathSaves: {
                              ...vitals.deathSaves,
                              successes: active ? idx : idx + 1,
                            },
                          })
                        }
                        aria-label={`Death Save Success ${idx + 1}`}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-400 border-emerald-200 shadow-[0_0_6px_#34d399]'
                            : 'bg-black/60 border-emerald-800/60'
                        }`}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400/90 text-[10px]">FAIL:</span>
                  {[0, 1, 2].map((idx) => {
                    const active = idx < vitals.deathSaves.failures;
                    return (
                      <button
                        key={`ds-f-${idx}`}
                        type="button"
                        onClick={() =>
                          persistVitals({
                            ...vitals,
                            deathSaves: {
                              ...vitals.deathSaves,
                              failures: active ? idx : idx + 1,
                            },
                          })
                        }
                        aria-label={`Death Save Failure ${idx + 1}`}
                        className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                          active
                            ? 'bg-rose-500 border-rose-200 shadow-[0_0_6px_#f43f5e]'
                            : 'bg-black/60 border-rose-800/60'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interactive Spell Slot Tracker (5 cols) */}
        <div className={`${showSpellsOnMobile ? 'flex' : 'hidden lg:flex'} lg:col-span-5 arcane-glass p-4 sm:p-5 border border-purple-900/35 bg-[#0e1017]/90 rounded-2xl shadow-xl flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-purple-900/30 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <h3 className="text-xs sm:text-sm font-cinzel font-bold text-purple-200 uppercase tracking-wider">
                  {isTr ? 'Büyü Yuvaları (Spell Slots)' : 'Arcane Spell Slots'}
                </h3>
              </div>
              <span className="text-[10px] font-cinzel text-purple-300/70">
                {isTr ? 'Harcamak için tıklayın' : 'Click crystal to expend'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(vitals.spellSlots).map(([lvlKey, slot]) => {
                const availableCount = Math.max(0, slot.max - slot.used);
                return (
                  <div
                    key={lvlKey}
                    className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-black/40 border border-purple-900/25"
                  >
                    <span className="text-[11px] font-cinzel font-bold text-purple-200">
                      {isTr ? `Sv. ${lvlKey}` : `Lv. ${lvlKey}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: slot.max }, (_, idx) => {
                        const isUsed = idx < slot.used;
                        return (
                          <button
                            key={`slot-${lvlKey}-${idx}`}
                            type="button"
                            onClick={() => handleToggleSpellSlot(lvlKey, idx)}
                            title={isUsed ? 'Expended Slot (Click to restore)' : 'Available Slot (Click to expend)'}
                            className={`w-5 h-5 sm:w-4 sm:h-4 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                              isUsed
                                ? 'bg-black/70 border-stone-700 text-stone-600'
                                : 'bg-purple-600/30 border-purple-400 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                            }`}
                          >
                            <span className="text-[9px]">{isUsed ? '◇' : '◆'}</span>
                          </button>
                        );
                      })}
                      <span className="text-[10px] font-cinzel text-purple-300/80 ml-1 min-w-[26px] text-right">
                        {availableCount}/{slot.max}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-purple-900/20 flex items-center justify-between text-[10px] font-cinzel text-stone-400">
            <span>{isTr ? 'Uzun dinlenme tüm yuvaları yeniler' : 'Long Rest restores all expended slots'}</span>
            <Link to="/spells" className="text-purple-300 hover:text-purple-200 font-bold">
              {isTr ? 'Büyü Ağacı →' : 'Spell Tree →'}
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Ability Scores & Saving Throws (Click-to-Roll) ─────────────────────── */}
      <div className={`${showAbilitiesOnMobile ? 'grid' : 'hidden lg:grid'} grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`}>
        {(Object.keys(STAT_LABELS) as StatKey[]).map((key) => {
          const statData = stats[key];
          const label = STAT_LABELS[key];
          const proficient = isProficientSave(key);
          const saveBonus =
            statData.mod +
            (proficient ? profBonus : 0) +
            (skillBonuses.savingThrowBonuses[key] || 0);
          const saveBonusStr = saveBonus >= 0 ? `+${saveBonus}` : `${saveBonus}`;

          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              onClick={() =>
                triggerDiceRoll({
                  label: `${character.name} — ${label.en} (${key}) Check`,
                  formula: `1d20${statData.mod >= 0 ? `+${statData.mod}` : statData.mod}`,
                  characterName: character.name,
                })
              }
              className="arcane-glass p-4 border border-amber-900/30 hover:border-amber-500/50 transition-all flex flex-col items-center relative overflow-hidden bg-[#0e1017]/85 shadow-lg rounded-2xl cursor-pointer group"
              title={`Click to roll ${label.en} Check (1d20${statData.modStr})`}
            >
              <span className="text-xs font-cinzel font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1">
                <span>{isTr ? label.tr : label.en}</span>
                <Dices size={11} className="text-amber-400/60 group-hover:text-amber-300 transition-colors" />
              </span>
              <span className="text-xs text-amber-400 font-cinzel mt-0.5 font-bold">{key}</span>

              {/* Modifier Big Badge */}
              <div className="my-2 text-2xl font-cinzel font-black text-amber-200 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                {statData.modStr}
              </div>

              {/* Raw Score + Yggdrasil Tree Bonus */}
              <div className="text-xs font-inter text-stone-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-amber-900/20 flex items-center gap-1">
                <span>Score: <strong className="text-amber-100">{statData.score}</strong></span>
                {statData.treeBonus > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold" title="Yggdrasil Tree Bonus">
                    (+{statData.treeBonus})
                  </span>
                )}
              </div>

              {/* Saving Throw Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDiceRoll({
                    label: `${character.name} — ${key} Saving Throw`,
                    formula: `1d20${saveBonus >= 0 ? `+${saveBonus}` : saveBonus}`,
                    characterName: character.name,
                  });
                }}
                className={`mt-3 w-full pt-2 border-t border-amber-900/20 flex items-center justify-between text-[11px] font-inter px-1 hover:text-amber-200 cursor-pointer ${
                  proficient ? 'text-amber-300 font-semibold' : 'text-stone-400'
                }`}
                title={`Click to roll ${key} Saving Throw (1d20${saveBonusStr})`}
              >
                <span className="flex items-center gap-1 font-cinzel">
                  {proficient && <CheckCircle2 size={11} className="text-amber-400" />}
                  {isTr ? 'Kurtarma' : 'Save'}
                </span>
                <span className="font-bold text-amber-200">{saveBonusStr}</span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Two-Column Detail Grid: Skills Matrix & Gear / Level Up ── */}
      <div className={`${showAbilitiesOnMobile || showGearOnMobile ? 'grid' : 'hidden lg:grid'} grid-cols-1 lg:grid-cols-12 gap-6`}>
        {/* Left Column: Skills Matrix (7 cols) */}
        <div className={`${showAbilitiesOnMobile ? 'block' : 'hidden lg:block'} lg:col-span-7 arcane-glass p-5 border border-amber-900/30 bg-[#0e1017]/85 rounded-2xl space-y-4 shadow-xl`}>
          <div className="flex items-center justify-between pb-3 border-b border-amber-900/25">
            <div className="flex items-center gap-2">
              <Award className="text-amber-400" size={18} />
              <h3 className="text-sm font-cinzel font-bold text-amber-100 uppercase tracking-wider">
                {isTr ? 'Yetenekler ve Beceriler' : 'Skills & Proficiencies'}
              </h3>
            </div>
            <span className="text-[11px] text-stone-400 font-cinzel flex items-center gap-1">
              <Dices size={12} className="text-amber-400" />
              <span>{isTr ? 'Zar atmak için tıklayın' : 'Click any skill to roll d20'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-inter">
            {SKILL_MAP.map((skill) => {
              const statMod = stats[skill.stat].mod;
              const skillProficient = isProficientSave(skill.stat);
              const totalBonus = statMod + (skillProficient ? profBonus : 0);
              const totalBonusStr = totalBonus >= 0 ? `+${totalBonus}` : `${totalBonus}`;

              return (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() =>
                    triggerDiceRoll({
                      label: `${character.name} — ${skill.nameEn} (${skill.stat})`,
                      formula: `1d20${totalBonus >= 0 ? `+${totalBonus}` : totalBonus}`,
                      characterName: character.name,
                    })
                  }
                  className="flex items-center justify-between p-2.5 sm:p-2 rounded-xl bg-white/[0.02] hover:bg-amber-500/10 border border-amber-900/15 hover:border-amber-500/40 transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        skillProficient ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]' : 'bg-stone-700'
                      }`}
                    />
                    <span className="text-stone-200 group-hover:text-amber-100 font-medium truncate font-inter">
                      {isTr ? skill.nameTr : skill.nameEn}
                    </span>
                    <span className="text-[10px] text-amber-200/50 font-cinzel uppercase">
                      ({skill.stat})
                    </span>
                  </div>
                  <span
                    className={`font-bold ml-2 flex items-center gap-1 ${
                      skillProficient ? 'text-amber-300 font-cinzel' : 'text-stone-400'
                    }`}
                  >
                    <span>{totalBonusStr}</span>
                    <Dices size={11} className="opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Equipped Gear Preview, Yggdrasil Nodes & Class Details (5 cols) */}
        <div className={`${showGearOnMobile ? 'block' : 'hidden lg:block'} lg:col-span-5 space-y-6`}>
          {/* Equipped Items Preview */}
          <div className="arcane-glass p-5 border border-amber-900/30 bg-[#0e1017]/85 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/25">
              <div className="flex items-center gap-2">
                <Shield className="text-amber-400" size={18} />
                <h3 className="text-sm font-cinzel font-bold text-amber-100 uppercase tracking-wider">
                  {isTr ? 'Kuşanılmış Eşyalar' : 'Equipped Relics'}
                </h3>
              </div>
              <Link
                to="/inventory"
                className="text-xs text-amber-300/80 hover:text-amber-200 flex items-center gap-1 font-cinzel transition-colors"
              >
                <span>{isTr ? 'Tüm Envanter' : 'Open Inventory'}</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {loadingDetails ? (
              <div className="py-6 text-center text-xs text-gray-500 font-inter">
                {isTr ? 'Donanımlar yükleniyor...' : 'Loading equipment...'}
              </div>
            ) : equippedItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500 font-inter">
                {isTr ? 'Kuşanılmış eşya bulunmuyor.' : 'No items currently equipped.'}
              </div>
            ) : (
              <div className="space-y-2">
                {equippedItems.map((item) => {
                  const color = RARITY_COLORS[item.rarity] || '#ffffff';
                  const damageFormula = item.properties?.Damage || item.properties?.damage;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (damageFormula) {
                          triggerDiceRoll({
                            label: `${character.name} — ${item.name} Damage`,
                            formula: damageFormula,
                            characterName: character.name,
                          });
                        }
                      }}
                      className={`p-2.5 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-between hover:bg-white/[0.06] transition-all ${
                        damageFormula ? 'cursor-pointer hover:border-amber-500/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <div
                            className="text-xs font-bold leading-tight"
                            style={{ color }}
                          >
                            {isTr ? (item.name_tr || item.name_en || item.name) : (item.name_en || item.name_tr || item.name)}
                          </div>
                          <span className="text-[10px] text-gray-400 capitalize">
                            {item.rarity} {item.type}
                          </span>
                        </div>
                      </div>
                      {item.properties && Object.keys(item.properties).length > 0 && (
                        <div className="text-[10px] text-gray-300 font-mono bg-black/40 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                          <span>
                            {Object.entries(item.properties)
                              .filter(([k]) => k !== 'icon')
                              .map(([k, v]) => `${k}: ${v}`)
                              .slice(0, 1)
                              .join(', ')}
                          </span>
                          {damageFormula && <Dices size={11} className="text-amber-400" />}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attuned Yggdrasil Skill Nodes Card (Task 2.4) */}
          <div className="arcane-glass p-5 border border-emerald-900/35 bg-[#0e1017]/85 rounded-2xl space-y-3 shadow-xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-900/25">
              <div className="flex items-center gap-2">
                <Award className="text-emerald-400" size={16} />
                <h3 className="text-xs font-cinzel font-bold text-emerald-200 uppercase tracking-wider">
                  {isTr ? 'Yggdrasil Aktif Düğümleri' : 'Attuned Yggdrasil Nodes'}
                </h3>
              </div>
              <Link
                to="/stat-tree"
                className="text-[11px] text-emerald-300 hover:text-emerald-200 font-cinzel flex items-center gap-1"
              >
                <span>{skillBonuses.unlockedDefs.length} Active</span>
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillBonuses.unlockedDefs.map((node) => (
                <span
                  key={node.id}
                  className="text-[10px] font-cinzel px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 flex items-center gap-1"
                  title={node.description}
                >
                  <span>{node.icon}</span>
                  <span>{node.name}</span>
                  <span className="text-emerald-400/80 font-bold">({node.stat})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Level Up & Progression Preview Card */}
          <div className="glass rounded-xl p-5 border border-gold/30 bg-gradient-to-br from-gold/10 via-black/40 to-black/60 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-gold" size={18} />
              <h3 className="text-sm font-cinzel font-bold text-gold uppercase tracking-wider">
                {isTr ? 'Gelişim & Seviye Atlatma' : 'Progression & Level Up'}
              </h3>
            </div>

            <p className="text-xs text-parchment/80 font-inter leading-relaxed mb-4">
              {isTr
                ? `Seviye ${level + 1} için gereken deneyim: ${Math.max(
                    0,
                    nextLevelXp - xpCurrent
                  ).toLocaleString()} XP. Seviye atlandığında Can Puanınız +${5 + conMod} artacak ve Büyü Ağacında yeni yetenek yuvaları açılacaktır.`
                : `XP required for Level ${level + 1}: ${Math.max(
                    0,
                    nextLevelXp - xpCurrent
                  ).toLocaleString()} XP. Upon leveling up, you gain +${5 + conMod} HP and unlock deeper nodes in your class tree.`}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gold/20 text-xs font-inter">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <AlertCircle size={14} />
                <span>
                  {xpAvailable > 0
                    ? isTr
                      ? `${xpAvailable} XP harcanmayı bekliyor!`
                      : `${xpAvailable} XP available to spend!`
                    : isTr
                    ? 'Tüm XP harcandı'
                    : 'All XP utilized'}
                </span>
              </div>
              <Link
                to="/spells"
                className="text-xs text-gold hover:underline font-cinzel font-bold flex items-center gap-1"
              >
                <span>{isTr ? 'Büyüleri Gör' : 'View Spells'}</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
