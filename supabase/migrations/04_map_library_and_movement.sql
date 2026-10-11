-- ==============================================================================
-- Migration: 04_map_library_and_movement.sql
-- Description: Introduces campaign map library, dual movement mode (free vs approved),
--              and persistent Fog of War revealed areas with Realtime sync.
-- Safe & Idempotent: Yes (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS)
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CAMPAIGN MAPS (LIBRARY & ACTIVE MAP STATE)
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: campaign_maps
ALTER TABLE public.campaign_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view campaign maps" ON public.campaign_maps;
CREATE POLICY "Players view campaign maps" ON public.campaign_maps
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMs manage campaign maps" ON public.campaign_maps;
CREATE POLICY "GMs manage campaign maps" ON public.campaign_maps
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

DROP POLICY IF EXISTS "Players update revealed areas on campaign maps" ON public.campaign_maps;
CREATE POLICY "Players update revealed areas on campaign maps" ON public.campaign_maps
  FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);



-- ─────────────────────────────────────────────────────────────────────────────
-- 2. MAP MOVEMENT REQUESTS (GM APPROVED MODE)
-- ─────────────────────────────────────────────────────────────────────────────

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

-- RLS: map_movement_requests
ALTER TABLE public.map_movement_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players view movement requests" ON public.map_movement_requests;
CREATE POLICY "Players view movement requests" ON public.map_movement_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Players create movement requests" ON public.map_movement_requests;
CREATE POLICY "Players create movement requests" ON public.map_movement_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "GMs manage movement requests" ON public.map_movement_requests;
CREATE POLICY "GMs manage movement requests" ON public.map_movement_requests
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. REALTIME PUBLICATION SUBSCRIPTION
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.campaign_maps,
    public.map_movement_requests;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
