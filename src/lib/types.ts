// ============================================================
// D&D Companion App — Core Type Definitions
// ============================================================

export type UserRole = 'admin' | 'gm' | 'player';
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
export interface CharacterVitals {
  currentHp: number;
  tempHp: number;
  hitDiceTotal: number;
  hitDiceRemaining: number;
  hitDieType: number;
  deathSaves: {
    successes: number;
    failures: number;
  };
  spellSlots: Record<string, { max: number; used: number }>;
  spellSlotsUsed?: Record<string, number>;
  gold?: number;
}

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
  gold?: number;
  vitals?: CharacterVitals;
  avatar_url: string | null;
  appearance?: {
    vitals?: CharacterVitals;
    gold?: number;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
  race?: RaceDefinition;
  subclass?: SubclassDefinition;
  profile?: Profile;
  campaign?: Campaign;
}

export interface CharacterStat {
  id: string;
  character_id: string;
  stat_key: StatKey;
  base_value: number;
  bonus_value: number;
  updated_at?: string;
}

// --- Skills ---
export interface SkillDefinition {
  id: string;
  skill_key: string;
  name: string;
  name_tr: string;
  name_en: string;
  description: string;
  description_tr?: string | null;
  description_en?: string | null;
  stat_parent: StatKey;
  subclass_restriction?: string | null;
  race_restriction?: string | null;
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
  slot_index?: number;
  custom_properties?: Record<string, unknown>;
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
  revealed_areas?: RevealedArea[];
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
  joined_at?: string;
  profile?: Profile;
}

export interface XpLedgerEntry {
  id: string;
  campaign_id: string;
  character_id: string;
  amount: number;
  reason: string;
  gm_id: string | null;
  created_at: string;
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
  created_at?: string;
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
  effects: Record<string, unknown>;
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

// --- Admin System ---
export interface AdminLog {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin?: Profile;
}

export interface AdminStats {
  totalUsers: number;
  roleBreakdown: {
    admin: number;
    gm: number;
    player: number;
  };
  totalCharacters: number;
  totalCampaigns: number;
  totalItems: number;
  totalSpells: number;
}

// --- GM Modules (Combat, Atmosphere, Loot) ---
export type EncounterStatus = 'preparing' | 'active' | 'completed';

export interface CampaignEncounter {
  id: string;
  campaign_id: string;
  name: string;
  status: EncounterStatus;
  round: number;
  active_combatant_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type DndCondition =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'
  | 'exhaustion';

export interface EncounterCombatant {
  id: string;
  encounter_id: string;
  character_id: string | null;
  name: string;
  initiative: number;
  hp_current: number;
  hp_max: number;
  hp_temp: number;
  ac: number;
  is_npc: boolean;
  is_hidden: boolean;
  conditions: DndCondition[];
  sort_order: number;
}

export type EnvironmentWeather = 'clear' | 'fog' | 'rain' | 'storm' | 'ash' | 'sunny';
export type EnvironmentTimeOfDay = 'dawn' | 'noon' | 'dusk' | 'midnight' | 'twilight';
export type EnvironmentDangerLevel = 'safe' | 'low' | 'normal' | 'high' | 'deadly';

export interface CampaignEnvironment {
  id: string;
  campaign_id: string;
  weather: EnvironmentWeather;
  time_of_day: EnvironmentTimeOfDay;
  ambient_preset: string;
  danger_level: EnvironmentDangerLevel;
  updated_at: string;
}

export interface SessionChronicle {
  id: string;
  campaign_id: string;
  session_number: number;
  title: string;
  summary: string;
  in_game_date: string | null;
  is_published: boolean;
  gm_secrets: string | null;
  created_at: string;
}

export interface LootItem {
  id?: string;
  name: string;
  rarity?: ItemRarity;
  type?: ItemType;
  quantity: number;
  icon?: string;
  properties?: Record<string, unknown>;
  item_definition_id?: string;
}

export interface CampaignLootChest {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  is_looted: boolean;
  gold_amount: number;
  items: LootItem[];
  created_at: string;
}

// --- Map Library & Movement System ---
export interface RevealedArea {
  x: number;
  y: number;
  r: number;
}

export type MapMovementMode = 'free' | 'approved';

export interface MapWallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type?: 'wall' | 'door' | 'window';
}

export interface CampaignMap {
  id: string;
  campaign_id: string;
  name: string;
  image_url: string;
  grid_size: number;
  width: number;
  height: number;
  fog_radius: number;
  is_active: boolean;
  movement_mode: MapMovementMode;
  revealed_areas: RevealedArea[];
  walls?: MapWallSegment[];
  los_enabled?: boolean;
  created_at: string;
  updated_at?: string;
}

export type MovementRequestStatus = 'pending' | 'approved' | 'rejected';

export interface MapMovementRequest {
  id: string;
  campaign_id: string;
  token_id: string;
  character_id: string | null;
  from_x: number;
  from_y: number;
  target_x: number;
  target_y: number;
  status: MovementRequestStatus;
  created_at: string;
}

// --- Combat Arena (4v4 Engine) ---
export type ArenaStatus = 'lobby' | 'intro' | 'active' | 'finished';
export type ArenaTeam = 'team_a' | 'team_b';

export interface ArenaStatusEffect {
  type: 'poison' | 'burn' | 'shield' | 'stun';
  value: number; // e.g. 4 damage per turn
  remaining_turns: number;
}

export interface CombatArena {
  id: string;
  campaign_id: string;
  name: string;
  status: ArenaStatus;
  round_number: number;
  active_combatant_id: string | null;
  team_a_name: string;
  team_b_name: string;
  winner_team?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CombatArenaParticipant {
  id: string;
  arena_id: string;
  character_id: string | null;
  name: string;
  avatar_url: string | null;
  team: ArenaTeam;
  slot_index: number; // 0 to 3
  current_hp: number;
  max_hp: number;
  current_mana: number;
  max_mana: number;
  ac: number;
  initiative_score: number;
  is_alive: boolean;
  status_effects: ArenaStatusEffect[];
  is_npc?: boolean;
}

export type CombatArenaActionType = 'attack' | 'spell' | 'item' | 'dot' | 'system';

export interface CombatArenaLog {
  id: string;
  arena_id: string;
  message: string;
  actor_name?: string | null;
  target_name?: string | null;
  action_type?: CombatArenaActionType | null;
  dice_roll?: number | null;
  damage_dealt?: number | null;
  healing_done?: number | null;
  created_at: string;
}

// --- Phase 3: Realtime Table Chat, Dice Log & GM Whispers ---
export type TableMessageType = 'chat' | 'whisper' | 'roll' | 'secret_roll' | 'dice' | 'system';

export interface CampaignMessageDiceData {
  formula?: string;
  dieType: string;
  count: number;
  modifier: number;
  rolls: number[];
  keptRoll: number;
  discardedRoll?: number;
  total: number;
  mode?: 'normal' | 'advantage' | 'disadvantage';
  isCrit?: boolean;
  isFumble?: boolean;
  label?: string;
}

export interface CampaignMessage {
  id: string;
  campaign_id: string;
  sender_id: string | null;
  sender_name: string;
  sender_role: UserRole;
  recipient_id: string | null;
  recipient_name: string | null;
  message_type: TableMessageType;
  content: string;
  dice_data: CampaignMessageDiceData | null;
  is_whisper?: boolean;
  is_secret_roll?: boolean;
  created_at: string;
}

// --- Phase 3: D&D 5e Monster & NPC Bestiary ---
export interface MonsterAction {
  name: string;
  nameTr: string;
  attackBonus: number;
  damageDice: string;
  damageType: string;
  isAoE?: boolean;
  saveDC?: number;
  saveAbility?: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  description: string;
  descriptionTr?: string;
}

export interface BestiaryMonster {
  id: string;
  name: string;
  nameTr: string;
  type: string;
  typeTr: string;
  cr: string;
  xp: number;
  hp: number;
  hpFormula: string;
  ac: number;
  initiativeBonus: number;
  speed: string;
  stats: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
  actions: MonsterAction[];
}

