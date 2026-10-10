-- ==============================================================================
-- Migration: 03_new_gm_modules.sql
-- Description: Introduces 3+ new persistent GM control modules:
--              1. GM Combat & Initiative Tracker (campaign_encounters, encounter_combatants)
--              2. GM Atmosphere & Session Chronicle (campaign_environments, session_chronicles)
--              3. GM Loot & Inventory Dispenser (campaign_loot_chests)
--              Enables Row Level Security (RLS) and Realtime synchronization.
-- Safe & Idempotent: Yes (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS)
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. GM COMBAT & INITIATIVE TRACKER
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: campaign_encounters
ALTER TABLE public.campaign_encounters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view campaign encounters" ON public.campaign_encounters;
CREATE POLICY "Players view campaign encounters" ON public.campaign_encounters
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMs manage campaign encounters" ON public.campaign_encounters;
CREATE POLICY "GMs manage campaign encounters" ON public.campaign_encounters
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

-- RLS: encounter_combatants
ALTER TABLE public.encounter_combatants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view visible combatants" ON public.encounter_combatants;
CREATE POLICY "Players view visible combatants" ON public.encounter_combatants
  FOR SELECT USING (
    public.is_gm() OR (is_hidden = false AND auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "GMs manage combatants" ON public.encounter_combatants;
CREATE POLICY "GMs manage combatants" ON public.encounter_combatants
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. GM ATMOSPHERE & SESSION CHRONICLE
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: campaign_environments
ALTER TABLE public.campaign_environments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view environment" ON public.campaign_environments;
CREATE POLICY "Players view environment" ON public.campaign_environments
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMs manage environment" ON public.campaign_environments;
CREATE POLICY "GMs manage environment" ON public.campaign_environments
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

-- RLS: session_chronicles
ALTER TABLE public.session_chronicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view published chronicles" ON public.session_chronicles;
CREATE POLICY "Players view published chronicles" ON public.session_chronicles
  FOR SELECT USING (
    public.is_gm() OR (is_published = true AND auth.uid() IS NOT NULL)
  );

DROP POLICY IF EXISTS "GMs manage chronicles" ON public.session_chronicles;
CREATE POLICY "GMs manage chronicles" ON public.session_chronicles
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. GM LOOT & INVENTORY DISPENSER
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: campaign_loot_chests
ALTER TABLE public.campaign_loot_chests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view loot chests" ON public.campaign_loot_chests;
CREATE POLICY "Players view loot chests" ON public.campaign_loot_chests
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMs manage loot chests" ON public.campaign_loot_chests;
CREATE POLICY "GMs manage loot chests" ON public.campaign_loot_chests
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. REALTIME PUBLICATION SUBSCRIPTION
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.campaign_encounters,
    public.encounter_combatants,
    public.campaign_environments,
    public.session_chronicles,
    public.campaign_loot_chests;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
