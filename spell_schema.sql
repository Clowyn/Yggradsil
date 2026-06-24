-- ==========================================
-- Spell Tree Feature Schema & Seed (Updated)
-- ==========================================

-- 1. Create SPELL TREES Table
CREATE TABLE IF NOT EXISTS spell_trees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  description_tr text,
  description_en text,
  created_at timestamptz DEFAULT now()
);

-- 2. Create SPELL TREE ASSIGNMENTS Table (Junction/Restriction)
CREATE TABLE IF NOT EXISTS spell_tree_assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  spell_tree_id uuid REFERENCES spell_trees(id) ON DELETE CASCADE,
  class_key text, -- e.g., 'mage', 'warrior'
  subclass_key text, -- e.g., 'fire_mage', 'berserker'
  race_key text, -- e.g., 'elf', 'dwarf'
  min_level int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- 3. Create SPELLS Table
CREATE TABLE IF NOT EXISTS spells (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  spell_tree_id uuid REFERENCES spell_trees(id) ON DELETE CASCADE,
  spell_key text UNIQUE NOT NULL,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  description_tr text,
  description_en text,
  school text, -- e.g., 'evocation', 'abjuration'
  xp_cost int DEFAULT 100,
  tier int DEFAULT 1,
  prerequisites text[] DEFAULT '{}'::text[], -- spell keys
  position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
  effects jsonb DEFAULT '{}'::jsonb,
  icon text,
  created_at timestamptz DEFAULT now()
);

-- 4. Create CHARACTER SPELLS Table
CREATE TABLE IF NOT EXISTS character_spells (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  spell_id uuid REFERENCES spells(id) ON DELETE CASCADE,
  unlocked boolean DEFAULT false,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(character_id, spell_id)
);

-- ==========================================
-- ROW-LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE spell_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE spell_tree_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_spells ENABLE ROW LEVEL SECURITY;

-- ── spell_trees Policies
CREATE POLICY "Spell trees viewable by everyone" ON spell_trees FOR SELECT USING (true);
CREATE POLICY "GMs manage spell trees" ON spell_trees FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gm'));

-- ── spell_tree_assignments Policies
CREATE POLICY "Assignments viewable by everyone" ON spell_tree_assignments FOR SELECT USING (true);
CREATE POLICY "GMs manage assignments" ON spell_tree_assignments FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gm'));

-- ── spells Policies
CREATE POLICY "Spells viewable by everyone" ON spells FOR SELECT USING (true);
CREATE POLICY "GMs manage spells" ON spells FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'gm'));

-- ── character_spells Policies
CREATE POLICY "Users view own character spells, GMs view all" ON character_spells FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM characters 
    WHERE characters.id = character_spells.character_id 
    AND (
      characters.profile_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM campaign_members 
        WHERE campaign_members.campaign_id = characters.campaign_id 
        AND campaign_members.profile_id = auth.uid() 
        AND campaign_members.role = 'gm'
      )
    )
  )
);

CREATE POLICY "Users unlock character spells, GMs unlock all" ON character_spells FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM characters 
    WHERE characters.id = character_spells.character_id 
    AND (
      characters.profile_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM campaign_members 
        WHERE campaign_members.campaign_id = characters.campaign_id 
        AND campaign_members.profile_id = auth.uid() 
        AND campaign_members.role = 'gm'
      )
    )
  )
);

CREATE POLICY "Users delete character spells, GMs delete all" ON character_spells FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM characters 
    WHERE characters.id = character_spells.character_id 
    AND (
      characters.profile_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM campaign_members 
        WHERE campaign_members.campaign_id = characters.campaign_id 
        AND campaign_members.profile_id = auth.uid() 
        AND campaign_members.role = 'gm'
      )
    )
  )
);

-- ==========================================
-- REALTIME PUBLICATION
-- ==========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE character_spells;
    ALTER PUBLICATION supabase_realtime ADD TABLE spells;
    ALTER PUBLICATION supabase_realtime ADD TABLE spell_trees;
  END IF;
END $$;

-- ==========================================
-- ATOMIC TRANSACTION TRANSACTION FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION unlock_spell(
  char_id uuid,
  spell_val_id uuid,
  xp_val_cost int
) RETURNS void AS $$
BEGIN
  -- 1. Check if character has enough available XP
  IF (SELECT xp_available FROM characters WHERE id = char_id) < xp_val_cost THEN
    RAISE EXCEPTION 'Insufficient XP to unlock this spell';
  END IF;

  -- 2. Deduct XP from character
  UPDATE characters 
  SET xp_available = xp_available - xp_val_cost 
  WHERE id = char_id;

  -- 3. Insert character spell
  INSERT INTO character_spells (character_id, spell_id, unlocked)
  VALUES (char_id, spell_val_id, true)
  ON CONFLICT (character_id, spell_id) DO UPDATE SET unlocked = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- SEED DATA FOR DEMO SPELL TREE
-- ==========================================

-- Seed Spell Tree
INSERT INTO spell_trees (id, name_tr, name_en, description_tr, description_en)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Arkana Örgüsü',
  'Arcane Weave',
  'Evrenin temel büyü dokusu. Sadece büyücüler ve bilge varlıklar tarafından yönlendirilebilir.',
  'The fundamental fabric of magic. Can only be channeled by mages and enlightened beings.'
) ON CONFLICT (id) DO NOTHING;

-- Seed Assignment (Assign Arcane Weave to mage class and min level 1)
INSERT INTO spell_tree_assignments (spell_tree_id, class_key, min_level)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'mage',
  1
) ON CONFLICT DO NOTHING;

-- Seed Spells for Arcane Weave
INSERT INTO spells (
  spell_tree_id,
  spell_key,
  name_tr,
  name_en,
  description_tr,
  description_en,
  school,
  xp_cost,
  tier,
  prerequisites,
  position,
  effects,
  icon
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'magic_missile',
  'Sihirli Füze',
  'Magic Missile',
  'Ufalanan büyü enerjisinden üç adet füze yaratır. Her füze hedefi otomatik vurur.',
  'You create three glowing darts of magical force. Each dart hits a creature of your choice.',
  'evocation',
  100,
  1,
  ARRAY[]::text[],
  '{"x": 0, "y": 0}'::jsonb,
  '{"damage": "3d4+3", "damage_type": "force"}'::jsonb,
  '🔮'
),
(
  '11111111-1111-1111-1111-111111111111',
  'shield',
  'Kalkan',
  'Shield',
  'Saldırıya uğradığında görünmez bir büyü bariyeri çağırarak zırh sınıfını +5 arttırır.',
  'An invisible barrier of magical force appears to protect you, adding +5 to AC.',
  'abjuration',
  100,
  1,
  ARRAY[]::text[],
  '{"x": 300, "y": 0}'::jsonb,
  '{"ac_bonus": 5, "duration": "1 round"}'::jsonb,
  '🛡️'
),
(
  '11111111-1111-1111-1111-111111111111',
  'misty_step',
  'Sisli Adım',
  'Misty Step',
  'Kısa süreliğine gümüşi bir sisle sarınıp 30 fit ötedeki boş bir alana ışınlanırsın.',
  'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space.',
  'conjuration',
  200,
  2,
  ARRAY['shield']::text[],
  '{"x": 300, "y": 200}'::jsonb,
  '{"range": "30 feet", "type": "teleportation"}'::jsonb,
  '💨'
),
(
  '11111111-1111-1111-1111-111111111111',
  'fireball',
  'Alev Topu',
  'Fireball',
  'Parmağından fırlayan parlak bir ışık patlayarak etraftaki her şeyi yakar.',
  'A bright streak flashes from your pointing finger and then blossoms into a low roar of flame.',
  'evocation',
  300,
  3,
  ARRAY['magic_missile', 'misty_step']::text[],
  '{"x": 150, "y": 400}'::jsonb,
  '{"damage": "8d6", "damage_type": "fire", "radius": "20 feet"}'::jsonb,
  '🔥'
)
ON CONFLICT (spell_key) DO UPDATE SET
  spell_tree_id = EXCLUDED.spell_tree_id,
  name_tr = EXCLUDED.name_tr,
  name_en = EXCLUDED.name_en,
  description_tr = EXCLUDED.description_tr,
  description_en = EXCLUDED.description_en,
  school = EXCLUDED.school,
  xp_cost = EXCLUDED.xp_cost,
  tier = EXCLUDED.tier,
  prerequisites = EXCLUDED.prerequisites,
  position = EXCLUDED.position,
  effects = EXCLUDED.effects,
  icon = EXCLUDED.icon;
