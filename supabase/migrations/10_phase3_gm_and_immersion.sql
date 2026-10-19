-- ==============================================================================
-- Migration: 10_phase3_gm_and_immersion.sql
-- Description: Phase 3 (P2) Advanced GM Modules, Dynamic Line-of-Sight Walls,
--              Realtime Table Chat, Dice Roll Stream & GM Secret Whispers,
--              and Admin Bulk Level / Role Aggregation RPCs.
-- Safe & Idempotent: Yes (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
--                    DROP POLICY IF EXISTS, SECURITY DEFINER anti-recursion helpers)
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DYNAMIC LINE-OF-SIGHT (LoS) & WALL SEGMENTS ON CAMPAIGN MAPS
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

ALTER TABLE IF EXISTS public.campaign_maps
  ADD COLUMN IF NOT EXISTS walls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS los_enabled boolean DEFAULT true;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. REALTIME TABLE CHAT, DICE LOG & GM WHISPERS (campaign_messages)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_role text DEFAULT 'player' CHECK (sender_role IN ('admin', 'gm', 'player')),
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_name text DEFAULT NULL,
  message_type text DEFAULT 'chat' CHECK (message_type IN ('chat', 'whisper', 'roll', 'secret_roll', 'dice', 'system')),
  content text NOT NULL,
  dice_data jsonb DEFAULT NULL,
  is_whisper boolean DEFAULT false,
  is_secret_roll boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign_created
  ON public.campaign_messages(campaign_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_recipient
  ON public.campaign_messages(recipient_id)
  WHERE is_whisper = true;

-- Enable RLS
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read campaign messages with whisper privacy" ON public.campaign_messages;
DROP POLICY IF EXISTS "Insert campaign messages" ON public.campaign_messages;
DROP POLICY IF EXISTS "Delete campaign messages" ON public.campaign_messages;

-- Anti-recursion RLS: uses SECURITY DEFINER public.is_gm() and public.is_admin()
-- Secret GM rolls (is_secret_roll = true or message_type = 'secret_roll') are only readable by GM/Admin or sender.
-- Whispers (is_whisper = true or message_type = 'whisper') are only readable by GM/Admin, sender, or recipient.
CREATE POLICY "Read campaign messages with whisper privacy" ON public.campaign_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      public.is_gm() OR
      public.is_admin() OR
      sender_id = auth.uid() OR
      (
        COALESCE(is_whisper, false) = false
        AND COALESCE(is_secret_roll, false) = false
        AND message_type NOT IN ('whisper', 'secret_roll')
      ) OR
      (
        (COALESCE(is_whisper, false) = true OR message_type = 'whisper')
        AND COALESCE(is_secret_roll, false) = false
        AND message_type <> 'secret_roll'
        AND recipient_id = auth.uid()
      )
    )
  );

CREATE POLICY "Insert campaign messages" ON public.campaign_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      sender_id IS NULL OR
      sender_id = auth.uid() OR
      public.is_gm() OR
      public.is_admin()
    )
  );

CREATE POLICY "Delete campaign messages" ON public.campaign_messages
  FOR DELETE USING (
    public.is_gm() OR
    public.is_admin() OR
    sender_id = auth.uid()
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ATOMIC ADMIN BULK LEVEL UPDATE & ROLE BREAKDOWN RPCs (Section 4.1)
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.bulk_update_character_levels(uuid[], int);

CREATE OR REPLACE FUNCTION public.bulk_update_character_levels(
  p_character_ids uuid[],
  p_level_delta int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_gm()) THEN
    RAISE EXCEPTION 'Unauthorized: Only Admins or GMs can bulk update character levels.';
  END IF;

  IF p_character_ids IS NULL OR array_length(p_character_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.characters
  SET level = GREATEST(1, LEAST(20, COALESCE(level, 1) + p_level_delta)),
      updated_at = now()
  WHERE id = ANY(p_character_ids);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bulk_update_character_levels(uuid[], int) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.bulk_update_character_levels(uuid[], int) TO authenticated, service_role;


DROP FUNCTION IF EXISTS public.get_admin_role_counts();

CREATE OR REPLACE FUNCTION public.get_admin_role_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_admin bigint := 0;
  v_gm bigint := 0;
  v_player bigint := 0;
BEGIN
  IF NOT (public.is_admin() OR public.is_gm()) THEN
    RAISE EXCEPTION 'Unauthorized: Only Admins or GMs can query role statistics.';
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE role = 'admin'),
    COUNT(*) FILTER (WHERE role = 'gm'),
    COUNT(*) FILTER (WHERE role = 'player')
  INTO v_admin, v_gm, v_player
  FROM public.profiles;

  RETURN jsonb_build_object(
    'admin', v_admin,
    'gm', v_gm,
    'player', v_player,
    'total', v_admin + v_gm + v_player
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_role_counts() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_role_counts() TO authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. REALTIME PUBLICATION SUBSCRIPTION
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_messages;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
