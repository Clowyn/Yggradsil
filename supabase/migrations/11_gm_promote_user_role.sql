-- ==============================================================================
-- Migration: 11_gm_promote_user_role.sql
-- Description: Enables Game Masters (GMs) and Administrators to promote other
--              users to GM (or demote GMs back to player) via the GM Sanctum.
--              Provides the SECURITY DEFINER RPC `public.gm_set_user_role` and
--              updates `public.protect_profile_role` and RLS policies safely
--              without recursion.
-- Safe & Idempotent: Yes (CREATE OR REPLACE FUNCTION, DROP POLICY IF EXISTS)
-- ==============================================================================

-- 1. Ensure Anti-Recursion Helper Functions Exist
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
  )
  OR EXISTS (
    SELECT 1 FROM public.campaign_members
    WHERE profile_id = auth.uid() AND role IN ('gm', 'admin')
  )
  OR EXISTS (
    SELECT 1 FROM public.campaigns
    WHERE gm_id = auth.uid()
  );
$$;

-- 2. Update protect_profile_role trigger function so GMs can assign gm/player roles to non-admin users
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent non-admin users from altering another user's non-role profile fields
  IF auth.uid() IS DISTINCT FROM OLD.id AND NOT public.is_admin() THEN
    IF NEW.username IS DISTINCT FROM OLD.username
       OR NEW.avatar_url IS DISTINCT FROM OLD.avatar_url
       OR NEW.locale IS DISTINCT FROM OLD.locale THEN
      RAISE EXCEPTION 'Unauthorized: Game Masters can only update user roles, not personal profile fields.';
    END IF;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- System administrators can modify any role
    IF public.is_admin() THEN
      RETURN NEW;
    END IF;

    -- Game Masters can promote players to 'gm' or demote other non-host GMs to 'player',
    -- provided the target is not an admin, the new role is not 'admin', and they are not changing their own role.
    IF public.is_gm()
       AND OLD.role <> 'admin'
       AND NEW.role IN ('gm', 'player')
       AND NEW.id <> auth.uid()
       AND NOT (NEW.role = 'player' AND EXISTS (SELECT 1 FROM public.campaigns WHERE gm_id = NEW.id)) THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Unauthorized: Only Game Masters or system administrators can modify user roles.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- 3. Update profiles RLS policy so GMs can update non-admin user roles
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users and admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users, GMs, and admins can update profiles" ON public.profiles;

CREATE POLICY "Users, GMs, and admins can update profiles" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
    OR (public.is_gm() AND role <> 'admin')
  )
  WITH CHECK (
    auth.uid() = id
    OR public.is_admin()
    OR (public.is_gm() AND role IN ('gm', 'player'))
  );

-- 4. Update campaign_members RLS policies so players cannot self-promote and GMs can manage member roles
ALTER TABLE IF EXISTS public.campaign_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Join campaign members" ON public.campaign_members;
CREATE POLICY "Join campaign members" ON public.campaign_members
  FOR INSERT
  WITH CHECK (
    public.is_gm()
    OR public.is_admin()
    OR (auth.uid() = profile_id AND role = 'player')
  );

DROP POLICY IF EXISTS "Update campaign members" ON public.campaign_members;
CREATE POLICY "Update campaign members" ON public.campaign_members
  FOR UPDATE
  USING (
    public.is_gm()
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND gm_id = auth.uid())
  )
  WITH CHECK (
    public.is_gm()
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND gm_id = auth.uid())
  );

-- 5. Authoritative RPC for GMs to promote/demote users between 'gm' and 'player'
CREATE OR REPLACE FUNCTION public.gm_set_user_role(
  p_target_user_id uuid,
  p_new_role text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_profile public.profiles%ROWTYPE;
  v_default_campaign_id uuid;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Unauthorized: Only Game Masters or Administrators can change user roles.';
  END IF;

  IF p_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required.';
  END IF;

  IF p_new_role NOT IN ('gm', 'player') THEN
    RAISE EXCEPTION 'Invalid role: Only gm or player can be assigned from GM Sanctum.';
  END IF;

  IF p_target_user_id = auth.uid() AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Cannot change your own GM role.';
  END IF;

  SELECT * INTO v_target_profile
  FROM public.profiles
  WHERE id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target user profile not found.';
  END IF;

  IF v_target_profile.role = 'admin' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify an administrator profile.';
  END IF;

  IF p_new_role = 'player'
     AND NOT public.is_admin()
     AND EXISTS (SELECT 1 FROM public.campaigns WHERE gm_id = p_target_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot demote a Campaign Host.';
  END IF;

  UPDATE public.profiles
  SET role = p_new_role
  WHERE id = p_target_user_id;

  UPDATE public.campaign_members
  SET role = p_new_role
  WHERE profile_id = p_target_user_id;

  IF NOT FOUND THEN
    SELECT id INTO v_default_campaign_id
    FROM public.campaigns
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_default_campaign_id IS NOT NULL THEN
      INSERT INTO public.campaign_members (campaign_id, profile_id, role)
      VALUES (v_default_campaign_id, p_target_user_id, p_new_role)
      ON CONFLICT (campaign_id, profile_id) DO UPDATE SET role = EXCLUDED.role;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', p_target_user_id,
    'username', v_target_profile.username,
    'old_role', v_target_profile.role,
    'new_role', p_new_role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.gm_set_user_role(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.gm_set_user_role(uuid, text) TO authenticated, service_role;
