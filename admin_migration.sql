-- ==========================================
-- DOMAIN ADMIN & RLS FIX MIGRATION (NO RECURSION)
-- Run this in Supabase Dashboard -> SQL Editor
-- ==========================================

-- 1. UPDATE PROFILES ROLE CONSTRAINT
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

-- 4. SECURITY DEFINER FUNCTIONS (Prevents RLS Infinite Recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_gm()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role IN ('gm', 'admin') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- 5. RE-CREATE CLEAN RLS POLICIES (NO RECURSION)

-- ── PROFILES ───────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users and admins can update profiles" ON profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (public.is_admin());

-- ── CAMPAIGNS ──────────────────────────────────────────
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View campaigns" ON campaigns;
DROP POLICY IF EXISTS "Create campaigns" ON campaigns;
DROP POLICY IF EXISTS "Update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Delete campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins manage all campaigns" ON campaigns;

CREATE POLICY "View campaigns" ON campaigns
  FOR SELECT USING (true);

CREATE POLICY "Create campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update campaigns" ON campaigns
  FOR UPDATE USING (gm_id = auth.uid() OR public.is_admin());

CREATE POLICY "Delete campaigns" ON campaigns
  FOR DELETE USING (gm_id = auth.uid() OR public.is_admin());

-- ── CAMPAIGN MEMBERS ───────────────────────────────────
ALTER TABLE campaign_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View campaign members" ON campaign_members;
DROP POLICY IF EXISTS "Join campaign members" ON campaign_members;
DROP POLICY IF EXISTS "Update campaign members" ON campaign_members;
DROP POLICY IF EXISTS "Delete campaign members" ON campaign_members;
DROP POLICY IF EXISTS "Admins manage all campaign members" ON campaign_members;

CREATE POLICY "View campaign members" ON campaign_members
  FOR SELECT USING (true);

CREATE POLICY "Join campaign members" ON campaign_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update campaign members" ON campaign_members
  FOR UPDATE USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Delete campaign members" ON campaign_members
  FOR DELETE USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
    public.is_admin()
  );

-- ── CHARACTERS ─────────────────────────────────────────
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View characters" ON characters;
DROP POLICY IF EXISTS "Insert characters" ON characters;
DROP POLICY IF EXISTS "Update characters" ON characters;
DROP POLICY IF EXISTS "Delete characters" ON characters;
DROP POLICY IF EXISTS "Admins manage all characters" ON characters;
DROP POLICY IF EXISTS "Players view own characters" ON characters;
DROP POLICY IF EXISTS "Players insert own characters" ON characters;
DROP POLICY IF EXISTS "Players edit own characters" ON characters;
DROP POLICY IF EXISTS "GMs can insert characters for members" ON characters;

CREATE POLICY "View characters" ON characters
  FOR SELECT USING (true);

CREATE POLICY "Insert characters" ON characters
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update characters" ON characters
  FOR UPDATE USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Delete characters" ON characters
  FOR DELETE USING (
    profile_id = auth.uid() OR
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid()) OR
    public.is_admin()
  );

-- ── CHARACTER STATS ────────────────────────────────────
ALTER TABLE character_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View character stats" ON character_stats;
DROP POLICY IF EXISTS "Insert character stats" ON character_stats;
DROP POLICY IF EXISTS "Update character stats" ON character_stats;
DROP POLICY IF EXISTS "Delete character stats" ON character_stats;
DROP POLICY IF EXISTS "Admins manage all character stats" ON character_stats;
DROP POLICY IF EXISTS "Players view own stats" ON character_stats;
DROP POLICY IF EXISTS "Players insert own stats" ON character_stats;
DROP POLICY IF EXISTS "Players update own stats" ON character_stats;
DROP POLICY IF EXISTS "GMs can insert stats for characters" ON character_stats;

CREATE POLICY "View character stats" ON character_stats
  FOR SELECT USING (true);

CREATE POLICY "Insert character stats" ON character_stats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update character stats" ON character_stats
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delete character stats" ON character_stats
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── CHARACTER SKILLS ───────────────────────────────────
ALTER TABLE character_skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View character skills" ON character_skills;
DROP POLICY IF EXISTS "Insert character skills" ON character_skills;
DROP POLICY IF EXISTS "Update character skills" ON character_skills;
DROP POLICY IF EXISTS "Delete character skills" ON character_skills;
DROP POLICY IF EXISTS "Admins manage all character skills" ON character_skills;
DROP POLICY IF EXISTS "Players insert own skills" ON character_skills;
DROP POLICY IF EXISTS "Players view own skills" ON character_skills;
DROP POLICY IF EXISTS "Players update own skills" ON character_skills;

CREATE POLICY "View character skills" ON character_skills
  FOR SELECT USING (true);

CREATE POLICY "Insert character skills" ON character_skills
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update character skills" ON character_skills
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delete character skills" ON character_skills
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── INVENTORY ITEMS ────────────────────────────────────
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Insert inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Delete inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Admins manage all inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Players view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Players insert own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Players update own inventory" ON inventory_items;

CREATE POLICY "View inventory items" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Insert inventory items" ON inventory_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update inventory items" ON inventory_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delete inventory items" ON inventory_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── MAP STATE & TOKENS ─────────────────────────────────
ALTER TABLE map_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View map state" ON map_state;
DROP POLICY IF EXISTS "Insert map state" ON map_state;
DROP POLICY IF EXISTS "Update map state" ON map_state;
DROP POLICY IF EXISTS "GMs insert map state" ON map_state;
DROP POLICY IF EXISTS "Admins manage map state" ON map_state;

CREATE POLICY "View map state" ON map_state
  FOR SELECT USING (true);

CREATE POLICY "Insert map state" ON map_state
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update map state" ON map_state
  FOR UPDATE USING (auth.uid() IS NOT NULL);

ALTER TABLE map_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "View map tokens" ON map_tokens;
DROP POLICY IF EXISTS "Insert map tokens" ON map_tokens;
DROP POLICY IF EXISTS "Update map tokens" ON map_tokens;
DROP POLICY IF EXISTS "Delete map tokens" ON map_tokens;
DROP POLICY IF EXISTS "Players insert own tokens" ON map_tokens;
DROP POLICY IF EXISTS "GMs can insert tokens for characters" ON map_tokens;
DROP POLICY IF EXISTS "Admins manage map tokens" ON map_tokens;

CREATE POLICY "View map tokens" ON map_tokens
  FOR SELECT USING (true);

CREATE POLICY "Insert map tokens" ON map_tokens
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update map tokens" ON map_tokens
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Delete map tokens" ON map_tokens
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── ITEM DEFINITIONS ───────────────────────────────────
ALTER TABLE item_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Item definitions viewable" ON item_definitions;
DROP POLICY IF EXISTS "Admins manage all item definitions" ON item_definitions;

CREATE POLICY "Item definitions viewable" ON item_definitions
  FOR SELECT USING (true);

CREATE POLICY "Admins manage all item definitions" ON item_definitions
  FOR ALL USING (public.is_gm());

-- ── ADMIN LOGS ─────────────────────────────────────────
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read logs" ON admin_logs;
DROP POLICY IF EXISTS "Admins insert logs" ON admin_logs;

CREATE POLICY "Admins read logs" ON admin_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins insert logs" ON admin_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── SPELL TABLES (IF THEY EXIST) ───────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'character_spells') THEN
    ALTER TABLE character_spells ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins manage character spells" ON character_spells;
    DROP POLICY IF EXISTS "View character spells" ON character_spells;
    DROP POLICY IF EXISTS "Insert character spells" ON character_spells;
    DROP POLICY IF EXISTS "Update character spells" ON character_spells;
    DROP POLICY IF EXISTS "Delete character spells" ON character_spells;

    CREATE POLICY "View character spells" ON character_spells FOR SELECT USING (true);
    CREATE POLICY "Insert character spells" ON character_spells FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    CREATE POLICY "Update character spells" ON character_spells FOR UPDATE USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Delete character spells" ON character_spells FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 6. ENSURE DEFAULT STORY/CAMPAIGN EXISTS
INSERT INTO campaigns (id, name, settings)
SELECT '11111111-2222-3333-4444-555555555555'::uuid, 'Gölgeler Diyarı', '{"fog_radius": 80}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM campaigns LIMIT 1);
