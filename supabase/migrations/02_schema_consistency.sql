-- ==============================================================================
-- Migration: 02_schema_consistency.sql
-- Description: Synchronizes database columns with TypeScript interfaces
--              (adds map_tokens.label, inventory_items.slot_index),
--              and introduces atomic XP distribution function + ledger table.
-- Safe & Idempotent: Yes (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS)
-- ==============================================================================

-- 1. Add missing 'label' column to map_tokens (prevents runtime TypeError in GameMap & MapToken)
ALTER TABLE IF EXISTS public.map_tokens 
  ADD COLUMN IF NOT EXISTS label text;

-- 2. Add 'slot_index' column to inventory_items (for 24-slot RPG grid persistence)
ALTER TABLE IF EXISTS public.inventory_items 
  ADD COLUMN IF NOT EXISTS slot_index int DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_inventory_slot_index'
  ) THEN
    ALTER TABLE public.inventory_items
      ADD CONSTRAINT chk_inventory_slot_index CHECK (slot_index >= 0 AND slot_index < 24);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Persistent XP Ledger Table (Tracks all XP awards, deductions, and reasons)
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

-- Enable RLS on xp_ledger
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view campaign xp ledger" ON public.xp_ledger;
CREATE POLICY "Users view campaign xp ledger" ON public.xp_ledger
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "GMs manage xp ledger" ON public.xp_ledger;
CREATE POLICY "GMs manage xp ledger" ON public.xp_ledger
  FOR ALL
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

-- 4. Atomic XP Distribution RPC Function (Fixes Harcanan XP Sıfırlama Hatası)
-- Correctly modifies xp_total and xp_available without overwriting spent XP
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
  -- Strict GM check
  IF NOT public.is_gm() THEN
    RAISE EXCEPTION 'Unauthorized: Only Game Masters can award or deduct XP.';
  END IF;

  -- Lock row for atomic update
  SELECT * INTO v_char FROM public.characters WHERE id = char_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Character not found.';
  END IF;

  -- Compute new XP totals (preserving spent XP delta)
  v_new_xp_total := GREATEST(0, COALESCE(v_char.xp_total, 0) + amount);
  v_new_xp_avail := GREATEST(0, COALESCE(v_char.xp_available, 0) + amount);
  v_new_level := (v_new_xp_total / 1000) + 1;

  UPDATE public.characters
  SET xp_total = v_new_xp_total,
      xp_available = v_new_xp_avail,
      level = v_new_level,
      updated_at = now()
  WHERE id = char_id;

  -- Record in audit ledger
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

-- Enable Realtime publication for xp_ledger
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_ledger;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
