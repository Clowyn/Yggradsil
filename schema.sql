-- ==========================================
-- D&D Companion App - Supabase Schema
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username text NOT NULL UNIQUE,
  avatar_url text,
  role text DEFAULT 'player' CHECK (role IN ('gm', 'player')),
  locale text DEFAULT 'en' CHECK (locale IN ('tr', 'en')),
  created_at timestamptz DEFAULT now()
);

-- 2. CAMPAIGNS TABLE
CREATE TABLE campaigns (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  gm_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{"fog_radius": 80}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 3. CAMPAIGN MEMBERS TABLE
CREATE TABLE campaign_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'player' CHECK (role IN ('gm', 'player')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, profile_id)
);

-- 4. CLASS CATEGORIES
CREATE TABLE class_categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  icon_url text,
  sort_order int NOT NULL
);

-- 5. SUBCLASS DEFINITIONS
CREATE TABLE subclass_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id uuid REFERENCES class_categories(id) ON DELETE CASCADE,
  key text UNIQUE NOT NULL,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  ability_name_tr text,
  ability_name_en text,
  ability_desc_tr text,
  ability_desc_en text,
  is_low_rate boolean DEFAULT false,
  is_advanced boolean DEFAULT false,
  icon_url text,
  base_stats jsonb DEFAULT '{}'::jsonb
);

-- 6. RACE TIERS
CREATE TABLE race_tiers (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  sort_order int NOT NULL
);

-- 7. RACE DEFINITIONS
CREATE TABLE race_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  tier_id uuid REFERENCES race_tiers(id) ON DELETE CASCADE,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description_tr text,
  description_en text,
  icon_url text,
  stat_bonuses jsonb DEFAULT '{}'::jsonb
);

-- 8. CHARACTERS TABLE
CREATE TABLE characters (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  race_id uuid REFERENCES race_definitions(id),
  subclass_id uuid REFERENCES subclass_definitions(id),
  level int DEFAULT 1,
  xp_total int DEFAULT 0,
  xp_available int DEFAULT 0,
  avatar_url text,
  appearance jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. CHARACTER STATS
CREATE TABLE character_stats (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  stat_key text NOT NULL CHECK (stat_key IN ('STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA')),
  base_value int DEFAULT 10,
  bonus_value int DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(character_id, stat_key)
);

-- 10. SKILL DEFINITIONS (YGGDRASIL TREE)
CREATE TABLE skill_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  skill_key text UNIQUE NOT NULL,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  description_tr text,
  description_en text,
  stat_parent text NOT NULL,
  subclass_restriction text,
  race_restriction text,
  xp_cost int DEFAULT 100,
  tier int DEFAULT 1,
  prerequisites text[] DEFAULT '{}'::text[],
  position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
  effects jsonb DEFAULT '{}'::jsonb
);

-- 11. CHARACTER SKILLS
CREATE TABLE character_skills (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  skill_definition_id uuid REFERENCES skill_definitions(id) ON DELETE CASCADE,
  unlocked boolean DEFAULT false,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(character_id, skill_definition_id)
);

-- 12. ITEM DEFINITIONS
CREATE TABLE item_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  description_tr text,
  description_en text,
  rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  type text DEFAULT 'misc' CHECK (type IN ('weapon', 'armor', 'consumable', 'quest', 'misc')),
  properties jsonb DEFAULT '{}'::jsonb,
  icon_url text
);

-- 13. INVENTORY ITEMS
CREATE TABLE inventory_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  item_definition_id uuid REFERENCES item_definitions(id) ON DELETE CASCADE,
  quantity int DEFAULT 1,
  equipped boolean DEFAULT false,
  custom_properties jsonb DEFAULT '{}'::jsonb,
  acquired_at timestamptz DEFAULT now()
);

-- 14. MAP STATE
CREATE TABLE map_state (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  map_image_url text,
  map_width int DEFAULT 1200,
  map_height int DEFAULT 800,
  fog_radius int DEFAULT 80,
  revealed_areas jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id)
);

-- 15. MAP TOKENS
CREATE TABLE map_tokens (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  x_position int DEFAULT 0,
  y_position int DEFAULT 0,
  icon_url text,
  color text DEFAULT '#ffffff',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(character_id, campaign_id)
);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subclass_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can read, only owner can update
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Reference Tables: Anyone can read
CREATE POLICY "Categories viewable" ON class_categories FOR SELECT USING (true);
CREATE POLICY "Subclasses viewable" ON subclass_definitions FOR SELECT USING (true);
CREATE POLICY "Race Tiers viewable" ON race_tiers FOR SELECT USING (true);
CREATE POLICY "Races viewable" ON race_definitions FOR SELECT USING (true);
CREATE POLICY "Skill definitions viewable" ON skill_definitions FOR SELECT USING (true);
CREATE POLICY "Item definitions viewable" ON item_definitions FOR SELECT USING (true);

-- Characters: Users can select their own, or GMs can select/edit all in their campaign
CREATE POLICY "Players view own characters" ON characters FOR SELECT USING (
  profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM campaign_members 
    WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm'
  )
);
CREATE POLICY "Players insert own characters" ON characters FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Players edit own characters" ON characters FOR UPDATE USING (
  profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM campaign_members 
    WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm'
  )
);

-- Character Stats: Viewable by owner and GM
CREATE POLICY "Players view own stats" ON character_stats FOR SELECT USING (
  EXISTS (SELECT 1 FROM characters WHERE id = character_id AND (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm')))
);

-- Inventory Items: Viewable by owner and GM
CREATE POLICY "Players view own inventory" ON inventory_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM characters WHERE id = character_id AND (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm')))
);

-- Campaigns: Viewable by members
CREATE POLICY "View campaigns" ON campaigns FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = id AND profile_id = auth.uid())
);

-- Campaign Members: Viewable by anyone
CREATE POLICY "View campaign members" ON campaign_members FOR SELECT USING (true);

-- Map State: Viewable by campaign members
CREATE POLICY "View map state" ON map_state FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = map_state.campaign_id AND profile_id = auth.uid())
);
CREATE POLICY "Update map state" ON map_state FOR UPDATE USING (
  EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = map_state.campaign_id AND profile_id = auth.uid() AND role = 'gm')
);

-- Map Tokens: Viewable by campaign members
CREATE POLICY "View map tokens" ON map_tokens FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = map_tokens.campaign_id AND profile_id = auth.uid())
);
CREATE POLICY "Update map tokens" ON map_tokens FOR UPDATE USING (
  EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = map_tokens.campaign_id AND profile_id = auth.uid() AND role = 'gm')
);

-- ==========================================
-- REALTIME
-- ==========================================
alter publication supabase_realtime add table map_state;
alter publication supabase_realtime add table map_tokens;
alter publication supabase_realtime add table inventory_items;
alter publication supabase_realtime add table character_skills;
alter publication supabase_realtime add table character_stats;
alter publication supabase_realtime add table characters;
