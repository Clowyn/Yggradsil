// ============================================================
// D&D Companion App — Core Type Definitions
// ============================================================

export type UserRole = 'gm' | 'player';
export type Locale = 'tr' | 'en';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  role: UserRole;
  locale: Locale;
  created_at: string;
}

// --- Stats ---
export type StatKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
export const STAT_KEYS: StatKey[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

export const STAT_INFO: Record<StatKey, { name_en: string; name_tr: string; color: string; icon: string }> = {
  STR: { name_en: 'Strength', name_tr: 'Güç', color: '#dc2626', icon: '⚔️' },
  DEX: { name_en: 'Dexterity', name_tr: 'Çeviklik', color: '#16a34a', icon: '🏹' },
  CON: { name_en: 'Constitution', name_tr: 'Dayanıklılık', color: '#d97706', icon: '🛡️' },
  INT: { name_en: 'Intelligence', name_tr: 'Zeka', color: '#2563eb', icon: '📖' },
  WIS: { name_en: 'Wisdom', name_tr: 'Bilgelik', color: '#9333ea', icon: '🔮' },
  CHA: { name_en: 'Charisma', name_tr: 'Karizma', color: '#ec4899', icon: '✨' },
};

// --- Class System ---
export interface ClassCategory {
  id: string;
  key: string;
  name_tr: string;
  name_en: string;
  icon_url: string | null;
  sort_order: number;
}

export interface SubclassDefinition {
  id: string;
  category_id: string;
  key: string;
  name_tr: string;
  name_en: string;
  ability_name_tr: string;
  ability_name_en: string;
  ability_desc_tr: string;
  ability_desc_en: string;
  is_low_rate: boolean;
  is_advanced: boolean;
  icon_url: string | null;
  base_stats: Partial<Record<StatKey, number>>;
  category?: ClassCategory;
}

// --- Race System ---
export type RaceTierKey = 'humanoid' | 'demi_humanoid' | 'heteromorphic';

export interface RaceTier {
  id: string;
  key: RaceTierKey;
  name_tr: string;
  name_en: string;
  sort_order: number;
}

export interface RaceDefinition {
  id: string;
  tier_id: string;
  key: string;
  name: string;
  description_tr: string;
  description_en: string;
  icon_url: string | null;
  stat_bonuses: Partial<Record<StatKey, number>>;
  tier?: RaceTier;
}

// --- Characters ---
export interface Character {
  id: string;
  profile_id: string;
  campaign_id: string;
  name: string;
  race_id: string;
  subclass_id: string;
  level: number;
  xp_total: number;
  xp_available: number;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  race?: RaceDefinition;
  subclass?: SubclassDefinition;
  profile?: Profile;
}

export interface CharacterStat {
  id: string;
  character_id: string;
  stat_key: StatKey;
  base_value: number;
  bonus_value: number;
}

// --- Skills ---
export interface SkillDefinition {
  id: string;
  skill_key: string;
  name: string;
  name_tr: string;
  name_en: string;
  description: string;
  stat_parent: StatKey;
  xp_cost: number;
  tier: number;
  prerequisites: string[];
  position: { x: number; y: number };
  icon: string;
  effects: SkillEffects;
}

export interface SkillEffects {
  stat_bonuses?: Partial<Record<StatKey, number>>;
  abilities?: string[];
  description: string;
  [key: string]: unknown;
}

export interface CharacterSkill {
  id: string;
  character_id: string;
  skill_definition_id: string;
  unlocked: boolean;
  unlocked_at: string | null;
  skill_definition?: SkillDefinition;
}

// --- Inventory ---
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'quest' | 'misc';

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f97316',
};

export interface ItemDefinition {
  id: string;
  name_tr: string;
  name_en: string;
  description_tr: string;
  description_en: string;
  rarity: ItemRarity;
  type: ItemType;
  properties: Record<string, unknown>;
  icon_url: string | null;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  item_definition_id: string;
  quantity: number;
  equipped: boolean;
  acquired_at: string;
  item_definition?: ItemDefinition;
}

// --- Map ---
export interface MapState {
  id: string;
  campaign_id: string;
  map_image_url: string;
  map_width: number;
  map_height: number;
  fog_radius: number;
  updated_at: string;
}

export interface MapToken {
  id: string;
  character_id: string;
  campaign_id: string;
  x_position: number;
  y_position: number;
  icon_url: string | null;
  color: string;
  label: string;
  updated_at: string;
}

// --- Campaign ---
export interface Campaign {
  id: string;
  name: string;
  gm_id: string;
  settings: { fog_radius: number };
  created_at: string;
}

export interface CampaignMember {
  id: string;
  campaign_id: string;
  profile_id: string;
  role: UserRole;
  profile?: Profile;
}

// --- Utility ---
export function t(obj: { name_tr?: string; name_en?: string } | undefined, locale: Locale): string {
  if (!obj) return '';
  return locale === 'tr' ? (obj.name_tr ?? obj.name_en ?? '') : (obj.name_en ?? obj.name_tr ?? '');
}

export function tDesc(obj: { description_tr?: string; description_en?: string } | undefined, locale: Locale): string {
  if (!obj) return '';
  return locale === 'tr' ? (obj.description_tr ?? obj.description_en ?? '') : (obj.description_en ?? obj.description_tr ?? '');
}

export interface SpellTree {
  id: string;
  name_tr: string;
  name_en: string;
  description_tr?: string;
  description_en?: string;
  created_at?: string;
  assignments?: SpellTreeAssignment[];
}

export interface SpellTreeAssignment {
  id: string;
  spell_tree_id: string;
  class_key?: string | null;
  subclass_key?: string | null;
  race_key?: string | null;
  min_level: number;
}

export interface SpellNode {
  id: string;
  spell_tree_id: string;
  spell_key: string;
  name_tr: string;
  name_en: string;
  description_tr?: string;
  description_en?: string;
  min_level: number;
  branch?: string;
  xp_cost: number;
  tier: number;
  prerequisites: string[];
  position: { x: number; y: number };
  effects: Record<string, any>;
  icon?: string;
  created_at?: string;
}

export interface CharacterSpell {
  id: string;
  character_id: string;
  spell_id: string;
  unlocked: boolean;
  unlocked_at?: string;
  spell?: SpellNode;
}
