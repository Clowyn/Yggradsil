-- ==============================================================================
-- Migration: 07_gm_bulk_teach_spells.sql
-- Description: Defines SECURITY DEFINER function public.gm_teach_spells
--              for atomic bulk teaching of spells to a character,
--              bypassing RLS policies while keeping execution safe and idempotent.
-- Safe & Idempotent: Yes (CREATE OR REPLACE FUNCTION)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.gm_teach_spells(
  p_character_id uuid,
  p_spell_ids uuid[]
) RETURNS void AS $$
BEGIN
  IF p_character_id IS NULL OR p_spell_ids IS NULL OR array_length(p_spell_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO character_spells (character_id, spell_id, unlocked, unlocked_at)
  SELECT p_character_id, s_id, true, now()
  FROM unnest(p_spell_ids) AS s_id
  ON CONFLICT (character_id, spell_id)
  DO UPDATE SET unlocked = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.gm_teach_spells(uuid, uuid[]) TO authenticated, service_role, anon;
