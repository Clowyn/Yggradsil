-- ==========================================
-- COMPLETE DOMAIN ADMIN & RLS FIX MIGRATION
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. UPDATE PROFILES ROLE CONSTRAINT
-- Support 3-tier role system: 'admin' > 'gm' > 'player'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'gm', 'player'));

-- 2. ENSURE CASCADE CONSTRAINTS ON ALL RELATIONAL TABLES
ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS characters_profile_id_fkey,
  ADD CONSTRAINT characters_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE campaign_members
  DROP CONSTRAINT IF EXISTS campaign_members_profile_id_fkey,
  ADD CONSTRAINT campaign_members_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_gm_id_fkey,
  ADD CONSTRAINT campaigns_gm_id_fkey
    FOREIGN KEY (gm_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE character_stats
  DROP CONSTRAINT IF EXISTS character_stats_character_id_fkey,
  ADD CONSTRAINT character_stats_character_id_fkey
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE character_skills
  DROP CONSTRAINT IF EXISTS character_skills_character_id_fkey,
  ADD CONSTRAINT character_skills_character_id_fkey
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_character_id_fkey,
  ADD CONSTRAINT inventory_items_character_id_fkey
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE;

ALTER TABLE map_tokens
  DROP CONSTRAINT IF EXISTS map_tokens_character_id_fkey,
  ADD CONSTRAINT map_tokens_character_id_fkey
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'character_spells') THEN
    ALTER TABLE character_spells
      DROP CONSTRAINT IF EXISTS character_spells_character_id_fkey,
      ADD CONSTRAINT character_spells_character_id_fkey
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. CREATE ADMIN LOGS TABLE
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- 4. ENSURE COMPLETE RLS POLICIES ACROSS ALL TABLES

-- ── PROFILES ───────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
CREATE POLICY "Admins manage all profiles" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── CAMPAIGNS ──────────────────────────────────────────
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View campaigns" ON campaigns;
CREATE POLICY "View campaigns" ON campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Create campaigns" ON campaigns;
CREATE POLICY "Create campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update campaigns" ON campaigns;
CREATE POLICY "Update campaigns" ON campaigns FOR UPDATE USING (
  gm_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Delete campaigns" ON campaigns;
CREATE POLICY "Delete campaigns" ON campaigns FOR DELETE USING (
  gm_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins manage all campaigns" ON campaigns;
CREATE POLICY "Admins manage all campaigns" ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── CAMPAIGN MEMBERS ───────────────────────────────────
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View campaign members" ON campaign_members;
CREATE POLICY "View campaign members" ON campaign_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Join campaign members" ON campaign_members;
CREATE POLICY "Join campaign members" ON campaign_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update campaign members" ON campaign_members;
CREATE POLICY "Update campaign members" ON campaign_members FOR UPDATE USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Delete campaign members" ON campaign_members;
CREATE POLICY "Delete campaign members" ON campaign_members FOR DELETE USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── CHARACTERS ─────────────────────────────────────────
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View characters" ON characters;
CREATE POLICY "View characters" ON characters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert characters" ON characters;
CREATE POLICY "Insert characters" ON characters FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update characters" ON characters;
CREATE POLICY "Update characters" ON characters FOR UPDATE USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Delete characters" ON characters;
CREATE POLICY "Delete characters" ON characters FOR DELETE USING (
  profile_id = auth.uid() OR
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ── CHARACTER STATS ────────────────────────────────────
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View character stats" ON character_stats;
CREATE POLICY "View character stats" ON character_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert character stats" ON character_stats;
CREATE POLICY "Insert character stats" ON character_stats FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update character stats" ON character_stats;
CREATE POLICY "Update character stats" ON character_stats FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Delete character stats" ON character_stats;
CREATE POLICY "Delete character stats" ON character_stats FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── CHARACTER SKILLS ───────────────────────────────────
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View character skills" ON character_skills;
CREATE POLICY "View character skills" ON character_skills FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert character skills" ON character_skills;
CREATE POLICY "Insert character skills" ON character_skills FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update character skills" ON character_skills;
CREATE POLICY "Update character skills" ON character_skills FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Delete character skills" ON character_skills;
CREATE POLICY "Delete character skills" ON character_skills FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── INVENTORY ITEMS ────────────────────────────────────
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View inventory items" ON inventory_items;
CREATE POLICY "View inventory items" ON inventory_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert inventory items" ON inventory_items;
CREATE POLICY "Insert inventory items" ON inventory_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update inventory items" ON inventory_items;
CREATE POLICY "Update inventory items" ON inventory_items FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Delete inventory items" ON inventory_items;
CREATE POLICY "Delete inventory items" ON inventory_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── MAP STATE & TOKENS ─────────────────────────────────
ALTER TABLE map_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View map state" ON map_state;
CREATE POLICY "View map state" ON map_state FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert map state" ON map_state;
CREATE POLICY "Insert map state" ON map_state FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update map state" ON map_state;
CREATE POLICY "Update map state" ON map_state FOR UPDATE USING (auth.uid() IS NOT NULL);

ALTER TABLE map_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View map tokens" ON map_tokens;
CREATE POLICY "View map tokens" ON map_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert map tokens" ON map_tokens;
CREATE POLICY "Insert map tokens" ON map_tokens FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update map tokens" ON map_tokens;
CREATE POLICY "Update map tokens" ON map_tokens FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Delete map tokens" ON map_tokens;
CREATE POLICY "Delete map tokens" ON map_tokens FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── ITEM DEFINITIONS ───────────────────────────────────
ALTER TABLE item_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Item definitions viewable" ON item_definitions;
CREATE POLICY "Item definitions viewable" ON item_definitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage all item definitions" ON item_definitions;
CREATE POLICY "Admins manage all item definitions" ON item_definitions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'gm')));

-- ── ADMIN LOGS ─────────────────────────────────────────
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read logs" ON admin_logs;
CREATE POLICY "Admins read logs" ON admin_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins insert logs" ON admin_logs;
CREATE POLICY "Admins insert logs" ON admin_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. ENSURE DEFAULT STORY/CAMPAIGN EXISTS
INSERT INTO campaigns (id, name, settings)
SELECT '11111111-2222-3333-4444-555555555555'::uuid, 'Gölgeler Diyarı', '{"fog_radius": 80}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM campaigns LIMIT 1);
