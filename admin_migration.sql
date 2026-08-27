-- ==========================================
-- Domain Admin Panel Migration
-- ==========================================

-- 1. UPDATE PROFILES ROLE CONSTRAINT
-- Support 3-tier role system: 'admin' > 'gm' > 'player'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'gm', 'player'));

-- 2. ENSURE CASCADE CONSTRAINTS ON ALL RELATIONAL TABLES
-- Ensure characters cascade on profile deletion
ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS characters_profile_id_fkey,
  ADD CONSTRAINT characters_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure campaign members cascade on profile deletion
ALTER TABLE campaign_members
  DROP CONSTRAINT IF EXISTS campaign_members_profile_id_fkey,
  ADD CONSTRAINT campaign_members_profile_id_fkey
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure campaigns cascade on gm profile deletion
ALTER TABLE campaigns
  DROP CONSTRAINT IF EXISTS campaigns_gm_id_fkey,
  ADD CONSTRAINT campaigns_gm_id_fkey
    FOREIGN KEY (gm_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Ensure character child tables cascade on character deletion
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
  action text NOT NULL,           -- e.g. 'user.delete', 'user.role_change', 'character.edit', 'campaign.create'
  target_type text NOT NULL,      -- e.g. 'profile', 'character', 'campaign', 'item_definition'
  target_id uuid,                 -- ID of affected entity
  details jsonb DEFAULT '{}'::jsonb, -- Additional context (old/new values, counts, reasons)
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- 4. RLS POLICIES FOR ADMIN LOGS & ADMIN OMNISCIENCE
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read logs" ON admin_logs;
CREATE POLICY "Admins read logs" ON admin_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins insert logs" ON admin_logs;
CREATE POLICY "Admins insert logs" ON admin_logs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Grant admin full CRUD across core tables
-- Profiles
DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
CREATE POLICY "Admins manage all profiles" ON profiles FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Characters
DROP POLICY IF EXISTS "Admins manage all characters" ON characters;
CREATE POLICY "Admins manage all characters" ON characters FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Character Stats
DROP POLICY IF EXISTS "Admins manage all character stats" ON character_stats;
CREATE POLICY "Admins manage all character stats" ON character_stats FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Character Skills
DROP POLICY IF EXISTS "Admins manage all character skills" ON character_skills;
CREATE POLICY "Admins manage all character skills" ON character_skills FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Inventory Items
DROP POLICY IF EXISTS "Admins manage all inventory items" ON inventory_items;
CREATE POLICY "Admins manage all inventory items" ON inventory_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Campaigns
DROP POLICY IF EXISTS "Admins manage all campaigns" ON campaigns;
CREATE POLICY "Admins manage all campaigns" ON campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Campaign Members
DROP POLICY IF EXISTS "Admins manage all campaign members" ON campaign_members;
CREATE POLICY "Admins manage all campaign members" ON campaign_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Item Definitions
DROP POLICY IF EXISTS "Admins manage all item definitions" ON item_definitions;
CREATE POLICY "Admins manage all item definitions" ON item_definitions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Map State & Tokens
DROP POLICY IF EXISTS "Admins manage map state" ON map_state;
CREATE POLICY "Admins manage map state" ON map_state FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins manage map tokens" ON map_tokens;
CREATE POLICY "Admins manage map tokens" ON map_tokens FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Spell tables (if exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'character_spells') THEN
    DROP POLICY IF EXISTS "Admins manage character spells" ON character_spells;
    CREATE POLICY "Admins manage character spells" ON character_spells FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spells') THEN
    DROP POLICY IF EXISTS "Admins manage spells" ON spells;
    CREATE POLICY "Admins manage spells" ON spells FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spell_trees') THEN
    DROP POLICY IF EXISTS "Admins manage spell trees" ON spell_trees;
    CREATE POLICY "Admins manage spell trees" ON spell_trees FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spell_tree_assignments') THEN
    DROP POLICY IF EXISTS "Admins manage spell tree assignments" ON spell_tree_assignments;
    CREATE POLICY "Admins manage spell tree assignments" ON spell_tree_assignments FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;
