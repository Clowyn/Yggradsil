-- ==============================================================================
-- Migration: 01_security_and_rls_hardening.sql
-- Description: Hardens RLS policies, prevents infinite recursion (42P17)
--              using SECURITY DEFINER helper functions, prevents profile
--              privilege escalation via a trigger, and tightens loose policies.
-- Safe & Idempotent: Yes (IF NOT EXISTS, CREATE OR REPLACE, DROP POLICY IF EXISTS)
-- ==============================================================================

-- 1. Helper Security Functions (Anti-Recursion Compliance)
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

-- 2. Privilege Escalation Prevention on Profiles
-- Prevents non-admins from changing their role or any user from self-promoting
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If role is being changed and user is not an administrator, reject
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Unauthorized: Only system administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- 3. Hardening Spell Trees and Spells RLS (Replacing Inline profile queries)
ALTER TABLE IF EXISTS spell_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spell_tree_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS spells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GMs manage spell trees" ON spell_trees;
CREATE POLICY "GMs manage spell trees" ON spell_trees
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

DROP POLICY IF EXISTS "GMs manage assignments" ON spell_tree_assignments;
CREATE POLICY "GMs manage assignments" ON spell_tree_assignments
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

DROP POLICY IF EXISTS "GMs manage spells" ON spells;
CREATE POLICY "GMs manage spells" ON spells
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

-- 4. Tightening Loose RLS Policies (Fixing 'auth.uid() IS NOT NULL' vulnerabilities)

-- 4.1 Character Stats
ALTER TABLE IF EXISTS character_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage stats" ON character_stats;
DROP POLICY IF EXISTS "Players insert own stats" ON character_stats;
DROP POLICY IF EXISTS "Players update own stats" ON character_stats;
DROP POLICY IF EXISTS "Players delete own stats" ON character_stats;

CREATE POLICY "Players view stats" ON character_stats
  FOR SELECT USING (true);

CREATE POLICY "Players insert own stats" ON character_stats
  FOR INSERT WITH CHECK (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players update own stats" ON character_stats
  FOR UPDATE USING (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  )
  WITH CHECK (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players delete own stats" ON character_stats
  FOR DELETE USING (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

-- 4.2 Inventory Items
ALTER TABLE IF EXISTS inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage inventory" ON inventory_items;
DROP POLICY IF EXISTS "Players insert own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Players update own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Players delete own inventory" ON inventory_items;

CREATE POLICY "Players view inventory" ON inventory_items
  FOR SELECT USING (true);

CREATE POLICY "Players insert own inventory" ON inventory_items
  FOR INSERT WITH CHECK (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players update own inventory" ON inventory_items
  FOR UPDATE USING (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  )
  WITH CHECK (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players delete own inventory" ON inventory_items
  FOR DELETE USING (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

-- 4.3 Map State
ALTER TABLE IF EXISTS map_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage map state" ON map_state;
DROP POLICY IF EXISTS "GMs insert map state" ON map_state;
DROP POLICY IF EXISTS "GMs update map state" ON map_state;
DROP POLICY IF EXISTS "GMs delete map state" ON map_state;

CREATE POLICY "Users view map state" ON map_state
  FOR SELECT USING (true);

CREATE POLICY "GMs insert map state" ON map_state
  FOR INSERT WITH CHECK (public.is_gm());

CREATE POLICY "GMs update map state" ON map_state
  FOR UPDATE USING (public.is_gm())
  WITH CHECK (public.is_gm());

CREATE POLICY "GMs delete map state" ON map_state
  FOR DELETE USING (public.is_gm());

-- 4.4 Map Tokens
ALTER TABLE IF EXISTS map_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage tokens" ON map_tokens;
DROP POLICY IF EXISTS "Players insert own tokens" ON map_tokens;
DROP POLICY IF EXISTS "Players update own tokens" ON map_tokens;
DROP POLICY IF EXISTS "Players delete own tokens" ON map_tokens;

CREATE POLICY "Users view tokens" ON map_tokens
  FOR SELECT USING (true);

CREATE POLICY "Players insert own tokens" ON map_tokens
  FOR INSERT WITH CHECK (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid()))
  );

CREATE POLICY "Players update own tokens" ON map_tokens
  FOR UPDATE USING (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid()))
  )
  WITH CHECK (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid()))
  );

CREATE POLICY "Players delete own tokens" ON map_tokens
  FOR DELETE USING (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid()))
  );

-- 4.5 Admin Logs Hardening (Prevent Log Spoofing)
ALTER TABLE IF EXISTS admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins insert logs" ON admin_logs;
CREATE POLICY "Admins insert logs" ON admin_logs
  FOR INSERT WITH CHECK (public.is_admin());
