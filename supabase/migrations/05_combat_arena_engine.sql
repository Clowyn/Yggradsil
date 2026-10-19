-- ==============================================================================
-- Migration: 05_combat_arena_engine.sql
-- Description: Introduces 4v4 Turn-Based Combat Arena engine, participant rosters,
--              status effects (DoT poison, burn, shield), and real-time combat logs.
-- Safe & Idempotent: Yes (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS)
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. COMBAT ARENAS (ENCOUNTER SESSIONS)
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: combat_arenas
ALTER TABLE public.combat_arenas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view combat arenas" ON public.combat_arenas;
CREATE POLICY "Players view combat arenas" ON public.combat_arenas
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMs manage combat arenas" ON public.combat_arenas;
CREATE POLICY "GMs manage combat arenas" ON public.combat_arenas
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

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



-- ─────────────────────────────────────────────────────────────────────────────
-- 2. COMBAT ARENA PARTICIPANTS (4v4 TEAM ROSTERS)
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: combat_arena_participants
ALTER TABLE public.combat_arena_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view arena participants" ON public.combat_arena_participants;
CREATE POLICY "Players view arena participants" ON public.combat_arena_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

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
-- 3. COMBAT ARENA LOGS (BATTLE EVENT TICKER)
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: combat_arena_logs
ALTER TABLE public.combat_arena_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view arena logs" ON public.combat_arena_logs;
CREATE POLICY "Players view arena logs" ON public.combat_arena_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Players create arena logs" ON public.combat_arena_logs;
CREATE POLICY "Players create arena logs" ON public.combat_arena_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMs manage arena logs" ON public.combat_arena_logs;
CREATE POLICY "GMs manage arena logs" ON public.combat_arena_logs
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. REALTIME PUBLICATION SUBSCRIPTION
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.combat_arenas,
    public.combat_arena_participants,
    public.combat_arena_logs;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
