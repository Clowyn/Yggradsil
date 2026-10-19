-- ==============================================================================
-- Migration: 08_phase1_security_and_schema_patch.sql
-- Description: Consolidated & Self-Contained Phase 1 (P0) Security & Schema Patch.
--              Automatically bootstraps any missing prerequisite tables/functions
--              from Migrations 01-07 (campaign_maps, combat_arenas, session_chronicles,
--              xp_ledger, spell tables, is_gm/is_admin helpers) so it never fails
--              with 42P01 (relation does not exist), then applies all P0 security fixes:
--              1. Enforces public.is_gm() and revokes anon execution on gm_teach_spells & gm_forget_spells
--              2. Replaces loose campaign_maps UPDATE policy with GM-only policy + reveal_map_fog RPC
--              3. Restricts combat_arenas & combat_arena_participants mutations to GM or character owner
--              4. Protects session_chronicles.gm_secrets via GM-only table policy + public view & RPC
--              5. Hardens public.unlock_spell with SET search_path = public and ownership verification
--              6. Restricts characters INSERT policy to public.is_gm() OR profile_id = auth.uid()
--              7. Aligns campaign_members_role_check constraint with UserRole ('admin', 'gm', 'player')
-- Safe & Idempotent: Yes (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. PREREQUISITE HELPER FUNCTIONS & TABLES (MIGRATIONS 01–07 BOOTSTRAP)
-- ─────────────────────────────────────────────────────────────────────────────

-- 0.1 Anti-Recursion Role Check Helpers (Migration 01)
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

-- 0.2 Spell Tables Bootstrap (spell_schema.sql & spell_tree_v2_migration.sql)
CREATE TABLE IF NOT EXISTS public.spell_trees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  description_tr text,
  description_en text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spell_tree_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  spell_tree_id uuid REFERENCES public.spell_trees(id) ON DELETE CASCADE,
  class_key text,
  subclass_key text,
  race_key text,
  min_level int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spells (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  spell_tree_id uuid REFERENCES public.spell_trees(id) ON DELETE CASCADE,
  spell_key text UNIQUE NOT NULL,
  name_tr text NOT NULL,
  name_en text NOT NULL,
  description_tr text,
  description_en text,
  min_level int DEFAULT 1,
  branch text,
  xp_cost int DEFAULT 100,
  tier int DEFAULT 1,
  prerequisites text[] DEFAULT '{}'::text[],
  position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
  effects jsonb DEFAULT '{}'::jsonb,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS min_level integer DEFAULT 1;
ALTER TABLE public.spells ADD COLUMN IF NOT EXISTS branch text;

CREATE TABLE IF NOT EXISTS public.character_spells (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_id uuid REFERENCES public.spells(id) ON DELETE CASCADE,
  unlocked boolean DEFAULT false,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(character_id, spell_id)
);

ALTER TABLE public.spell_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spell_tree_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_spells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spell trees viewable by everyone" ON public.spell_trees;
CREATE POLICY "Spell trees viewable by everyone" ON public.spell_trees FOR SELECT USING (true);
DROP POLICY IF EXISTS "GMs manage spell trees" ON public.spell_trees;
CREATE POLICY "GMs manage spell trees" ON public.spell_trees FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

DROP POLICY IF EXISTS "Assignments viewable by everyone" ON public.spell_tree_assignments;
CREATE POLICY "Assignments viewable by everyone" ON public.spell_tree_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "GMs manage assignments" ON public.spell_tree_assignments;
CREATE POLICY "GMs manage assignments" ON public.spell_tree_assignments FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

DROP POLICY IF EXISTS "Spells viewable by everyone" ON public.spells;
CREATE POLICY "Spells viewable by everyone" ON public.spells FOR SELECT USING (true);
DROP POLICY IF EXISTS "GMs manage spells" ON public.spells;
CREATE POLICY "GMs manage spells" ON public.spells FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

-- 0.3 Schema Consistency & XP Ledger Bootstrap (Migration 02)
ALTER TABLE IF EXISTS public.map_tokens
  ADD COLUMN IF NOT EXISTS label text;

CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  amount int NOT NULL,
  reason text NOT NULL,
  gm_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xp_ledger_campaign ON public.xp_ledger(campaign_id);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_character ON public.xp_ledger(character_id, created_at DESC);

ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view campaign xp ledger" ON public.xp_ledger;
CREATE POLICY "Users view campaign xp ledger" ON public.xp_ledger FOR SELECT USING (true);

DROP POLICY IF EXISTS "GMs manage xp ledger" ON public.xp_ledger;
CREATE POLICY "GMs manage xp ledger" ON public.xp_ledger FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

CREATE OR REPLACE FUNCTION public.gm_award_xp(
  char_id uuid,
  amount int,
  award_reason text DEFAULT 'GM Award'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_char characters%ROWTYPE;
  v_new_xp_total int;
  v_new_xp_avail int;
  v_new_level int;
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Unauthorized: Only Game Masters can award or deduct XP.';
  END IF;

  SELECT * INTO v_char FROM public.characters WHERE id = char_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found.';
  END IF;

  v_new_xp_total := GREATEST(0, COALESCE(v_char.xp_total, 0) + amount);
  v_new_xp_avail := GREATEST(0, COALESCE(v_char.xp_available, 0) + amount);
  v_new_level := (v_new_xp_total / 1000) + 1;

  UPDATE public.characters
  SET xp_total = v_new_xp_total,
      xp_available = v_new_xp_avail,
      level = v_new_level,
      updated_at = now()
  WHERE id = char_id;

  INSERT INTO public.xp_ledger (campaign_id, character_id, amount, reason, gm_id)
  VALUES (v_char.campaign_id, char_id, amount, award_reason, auth.uid());

  RETURN json_build_object(
    'character_id', char_id,
    'xp_total', v_new_xp_total,
    'xp_available', v_new_xp_avail,
    'level', v_new_level
  );
END;
$$;

-- 0.4 GM Modules Tables Bootstrap (Migration 03)
CREATE TABLE IF NOT EXISTS public.campaign_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'preparing' CHECK (status IN ('preparing', 'active', 'completed')),
  round int DEFAULT 1,
  active_combatant_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.encounter_combatants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid REFERENCES public.campaign_encounters(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  name text NOT NULL,
  initiative int DEFAULT 0,
  hp_current int NOT NULL,
  hp_max int NOT NULL,
  hp_temp int DEFAULT 0,
  ac int DEFAULT 10,
  is_npc boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  conditions jsonb DEFAULT '[]'::jsonb,
  sort_order int DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_campaign_encounters_campaign ON public.campaign_encounters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_encounter_combatants_encounter ON public.encounter_combatants(encounter_id);

ALTER TABLE public.campaign_encounters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view campaign encounters" ON public.campaign_encounters;
CREATE POLICY "Players view campaign encounters" ON public.campaign_encounters FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "GMs manage campaign encounters" ON public.campaign_encounters;
CREATE POLICY "GMs manage campaign encounters" ON public.campaign_encounters FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

ALTER TABLE public.encounter_combatants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view visible combatants" ON public.encounter_combatants;
CREATE POLICY "Players view visible combatants" ON public.encounter_combatants FOR SELECT USING (public.is_gm() OR (is_hidden = false AND auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "GMs manage combatants" ON public.encounter_combatants;
CREATE POLICY "GMs manage combatants" ON public.encounter_combatants FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

CREATE TABLE IF NOT EXISTS public.campaign_environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE UNIQUE,
  weather text DEFAULT 'clear',
  time_of_day text DEFAULT 'twilight',
  ambient_preset text DEFAULT 'abyss_winds',
  danger_level text DEFAULT 'normal',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_chronicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_number int NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  in_game_date text,
  is_published boolean DEFAULT false,
  gm_secrets text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_environments_campaign ON public.campaign_environments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_session_chronicles_campaign ON public.session_chronicles(campaign_id, session_number);

ALTER TABLE public.campaign_environments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view environment" ON public.campaign_environments;
CREATE POLICY "Players view environment" ON public.campaign_environments FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "GMs manage environment" ON public.campaign_environments;
CREATE POLICY "GMs manage environment" ON public.campaign_environments FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

CREATE TABLE IF NOT EXISTS public.campaign_loot_chests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_looted boolean DEFAULT false,
  gold_amount int DEFAULT 0,
  items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loot_chests_campaign ON public.campaign_loot_chests(campaign_id);

ALTER TABLE public.campaign_loot_chests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view loot chests" ON public.campaign_loot_chests;
CREATE POLICY "Players view loot chests" ON public.campaign_loot_chests FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "GMs manage loot chests" ON public.campaign_loot_chests;
CREATE POLICY "GMs manage loot chests" ON public.campaign_loot_chests FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

-- 0.5 Campaign Maps & Movement Requests Bootstrap (Migration 04)
CREATE TABLE IF NOT EXISTS public.campaign_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  grid_size int DEFAULT 40,
  width int DEFAULT 1200,
  height int DEFAULT 800,
  fog_radius int DEFAULT 80,
  is_active boolean DEFAULT false,
  movement_mode text DEFAULT 'free' CHECK (movement_mode IN ('free', 'approved')),
  revealed_areas jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_maps_campaign ON public.campaign_maps(campaign_id);

ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view campaign maps" ON public.campaign_maps;
CREATE POLICY "Players view campaign maps" ON public.campaign_maps FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "GMs manage campaign maps" ON public.campaign_maps;
CREATE POLICY "GMs manage campaign maps" ON public.campaign_maps FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

CREATE TABLE IF NOT EXISTS public.map_movement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  token_id text NOT NULL,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  from_x int NOT NULL,
  from_y int NOT NULL,
  target_x int NOT NULL,
  target_y int NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_movement_requests_campaign ON public.map_movement_requests(campaign_id);

ALTER TABLE public.map_movement_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view movement requests" ON public.map_movement_requests;
CREATE POLICY "Players view movement requests" ON public.map_movement_requests FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Players create movement requests" ON public.map_movement_requests;
CREATE POLICY "Players create movement requests" ON public.map_movement_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "GMs manage movement requests" ON public.map_movement_requests;
CREATE POLICY "GMs manage movement requests" ON public.map_movement_requests FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

-- 0.6 Combat Arena Tables Bootstrap (Migration 05)
CREATE TABLE IF NOT EXISTS public.combat_arenas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'lobby' CHECK (status IN ('lobby', 'intro', 'active', 'finished')),
  round_number int DEFAULT 1,
  active_combatant_id uuid,
  team_a_name text DEFAULT 'Blue Vanguard',
  team_b_name text DEFAULT 'Red Legion',
  winner_team text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combat_arenas_campaign ON public.combat_arenas(campaign_id);

ALTER TABLE public.combat_arenas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view combat arenas" ON public.combat_arenas;
CREATE POLICY "Players view combat arenas" ON public.combat_arenas FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "GMs manage combat arenas" ON public.combat_arenas;
CREATE POLICY "GMs manage combat arenas" ON public.combat_arenas FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());

CREATE TABLE IF NOT EXISTS public.combat_arena_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id uuid REFERENCES public.combat_arenas(id) ON DELETE CASCADE,
  character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  name text NOT NULL,
  avatar_url text,
  team text NOT NULL CHECK (team IN ('team_a', 'team_b')),
  slot_index int NOT NULL CHECK (slot_index BETWEEN 0 AND 3),
  current_hp int NOT NULL,
  max_hp int NOT NULL,
  current_mana int NOT NULL,
  max_mana int NOT NULL,
  ac int DEFAULT 10,
  initiative_score int DEFAULT 0,
  is_alive boolean DEFAULT true,
  status_effects jsonb DEFAULT '[]'::jsonb,
  is_npc boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_arena_participants_arena ON public.combat_arena_participants(arena_id);

ALTER TABLE public.combat_arena_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view arena participants" ON public.combat_arena_participants;
CREATE POLICY "Players view arena participants" ON public.combat_arena_participants FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.combat_arena_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arena_id uuid REFERENCES public.combat_arenas(id) ON DELETE CASCADE,
  message text NOT NULL,
  actor_name text,
  target_name text,
  action_type text,
  dice_roll int,
  damage_dealt int,
  healing_done int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_combat_arena_logs_arena ON public.combat_arena_logs(arena_id);

ALTER TABLE public.combat_arena_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players view arena logs" ON public.combat_arena_logs;
CREATE POLICY "Players view arena logs" ON public.combat_arena_logs FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Players create arena logs" ON public.combat_arena_logs;
CREATE POLICY "Players create arena logs" ON public.combat_arena_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "GMs manage arena logs" ON public.combat_arena_logs;
CREATE POLICY "GMs manage arena logs" ON public.combat_arena_logs FOR ALL USING (public.is_gm()) WITH CHECK (public.is_gm());


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SPELL BULK RPC AUTHORIZATION HARDENING
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.gm_teach_spells(
  p_character_id uuid,
  p_spell_ids uuid[]
) RETURNS void AS $$
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Unauthorized: Only Game Masters can teach spells in bulk.';
  END IF;

  IF p_character_id IS NULL OR p_spell_ids IS NULL OR array_length(p_spell_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.character_spells (character_id, spell_id, unlocked, unlocked_at)
  SELECT DISTINCT p_character_id, s_id, true, now()
  FROM unnest(p_spell_ids) AS s_id
  ON CONFLICT (character_id, spell_id)
  DO UPDATE SET unlocked = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.gm_forget_spells(
  p_character_id uuid,
  p_spell_id uuid DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Unauthorized: Only Game Masters can remove spells.';
  END IF;

  IF p_character_id IS NULL THEN
    RETURN;
  END IF;

  IF p_spell_id IS NULL THEN
    DELETE FROM public.character_spells WHERE character_id = p_character_id;
  ELSE
    DELETE FROM public.character_spells WHERE character_id = p_character_id AND spell_id = p_spell_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.gm_teach_spells(uuid, uuid[]) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.gm_teach_spells(uuid, uuid[]) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.gm_forget_spells(uuid, uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.gm_forget_spells(uuid, uuid) TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CAMPAIGN MAPS UPDATE HARDENING & CONTROLLED FOG RPC
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Players update revealed areas on campaign maps" ON public.campaign_maps;
DROP POLICY IF EXISTS "GMs manage campaign maps update" ON public.campaign_maps;
CREATE POLICY "GMs manage campaign maps update" ON public.campaign_maps
  FOR UPDATE
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

CREATE OR REPLACE FUNCTION public.reveal_map_fog(
  p_map_id uuid,
  p_revealed_areas jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  IF p_map_id IS NULL OR p_revealed_areas IS NULL OR jsonb_typeof(p_revealed_areas) <> 'array' THEN
    RETURN;
  END IF;

  IF NOT (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM public.campaign_maps cm
      WHERE cm.id = p_map_id
        AND (
          EXISTS (SELECT 1 FROM public.campaign_members m WHERE m.campaign_id = cm.campaign_id AND m.profile_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.characters c WHERE c.campaign_id = cm.campaign_id AND c.profile_id = auth.uid())
        )
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You do not belong to this campaign map.';
  END IF;

  UPDATE public.campaign_maps
  SET revealed_areas = p_revealed_areas,
      updated_at = now()
  WHERE id = p_map_id
    AND (
      public.is_gm() OR
      jsonb_array_length(p_revealed_areas) >= jsonb_array_length(COALESCE(revealed_areas, '[]'::jsonb))
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reveal_map_fog(uuid, jsonb) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reveal_map_fog(uuid, jsonb) TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. COMBAT ARENA & PARTICIPANTS RLS HARDENING
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Authenticated users update combat arenas" ON public.combat_arenas;
CREATE POLICY "Authenticated users update combat arenas" ON public.combat_arenas
  FOR UPDATE
  USING (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM public.combat_arena_participants cap
      JOIN public.characters c ON c.id = cap.character_id
      WHERE cap.arena_id = combat_arenas.id AND c.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM public.combat_arena_participants cap
      JOIN public.characters c ON c.id = cap.character_id
      WHERE cap.arena_id = combat_arenas.id AND c.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Players update own combatant or GMs manage" ON public.combat_arena_participants;
CREATE POLICY "Players update own combatant or GMs manage" ON public.combat_arena_participants
  FOR ALL
  USING (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.characters
      WHERE id = character_id AND profile_id = auth.uid()
    ))
  )
  WITH CHECK (
    public.is_gm() OR
    (character_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.characters
      WHERE id = character_id AND profile_id = auth.uid()
    ))
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SESSION CHRONICLES GM_SECRETS PROTECTION
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.session_chronicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view published chronicles" ON public.session_chronicles;
DROP POLICY IF EXISTS "GMs manage chronicles" ON public.session_chronicles;
CREATE POLICY "GMs manage chronicles" ON public.session_chronicles
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

CREATE OR REPLACE VIEW public.session_chronicles_public AS
  SELECT
    id,
    campaign_id,
    session_number,
    title,
    summary,
    in_game_date,
    is_published,
    CASE WHEN public.is_gm() THEN gm_secrets ELSE NULL END AS gm_secrets,
    created_at
  FROM public.session_chronicles
  WHERE public.is_gm() OR (is_published = true AND auth.uid() IS NOT NULL);

GRANT SELECT ON public.session_chronicles_public TO authenticated;

CREATE OR REPLACE FUNCTION public.get_session_chronicles(p_campaign_id uuid)
RETURNS TABLE (
  id uuid,
  campaign_id uuid,
  session_number int,
  title text,
  summary text,
  in_game_date text,
  is_published boolean,
  gm_secrets text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    sc.id,
    sc.campaign_id,
    sc.session_number,
    sc.title,
    sc.summary,
    sc.in_game_date,
    sc.is_published,
    CASE WHEN public.is_gm() THEN sc.gm_secrets ELSE NULL END AS gm_secrets,
    sc.created_at
  FROM public.session_chronicles sc
  WHERE sc.campaign_id = p_campaign_id
    AND (public.is_gm() OR (sc.is_published = true AND auth.uid() IS NOT NULL))
  ORDER BY sc.session_number DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_session_chronicles(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_session_chronicles(uuid) TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. UNLOCK_SPELL SEARCH_PATH, COST ENFORCEMENT & OWNERSHIP VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.unlock_spell(
  char_id uuid,
  spell_val_id uuid,
  xp_val_cost int
) RETURNS void AS $$
DECLARE
  v_effective_cost int;
BEGIN
  IF NOT (
    public.is_gm() OR
    EXISTS (SELECT 1 FROM public.characters WHERE id = char_id AND profile_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized: You can only unlock spells for your own character.';
  END IF;

  IF public.is_gm() THEN
    v_effective_cost := GREATEST(COALESCE(xp_val_cost, 0), 0);
  ELSE
    v_effective_cost := GREATEST(
      COALESCE((SELECT xp_cost FROM public.spells WHERE id = spell_val_id), xp_val_cost, 0),
      COALESCE(xp_val_cost, 0),
      0
    );
  END IF;

  IF (SELECT xp_available FROM public.characters WHERE id = char_id) < v_effective_cost THEN
    RAISE EXCEPTION 'Insufficient XP to unlock this spell';
  END IF;

  UPDATE public.characters
  SET xp_available = xp_available - v_effective_cost
  WHERE id = char_id;

  INSERT INTO public.character_spells (character_id, spell_id, unlocked)
  VALUES (char_id, spell_val_id, true)
  ON CONFLICT (character_id, spell_id) DO UPDATE SET unlocked = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.unlock_spell(uuid, uuid, int) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.unlock_spell(uuid, uuid, int) TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CHARACTERS INSERT POLICY & CAMPAIGN_MEMBERS ROLE CONSTRAINT
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Insert characters" ON public.characters;
CREATE POLICY "Insert characters" ON public.characters
  FOR INSERT WITH CHECK (
    public.is_gm() OR profile_id = auth.uid()
  );

ALTER TABLE public.campaign_members
  DROP CONSTRAINT IF EXISTS campaign_members_role_check;

ALTER TABLE public.campaign_members
  ADD CONSTRAINT campaign_members_role_check
  CHECK (role IN ('admin', 'gm', 'player'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'gm', 'player'));
