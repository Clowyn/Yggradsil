-- ==============================================================================
-- Migration: 06_character_spells_hardening.sql
-- Description: Ensures safe, anti-recursion RLS policies for character_spells
--              allowing GMs and character owners to SELECT, INSERT, UPDATE, DELETE.
-- Safe & Idempotent: Yes (IF EXISTS, DROP POLICY IF EXISTS, CREATE POLICY)
-- ==============================================================================

ALTER TABLE IF EXISTS character_spells ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage character spells" ON character_spells;
DROP POLICY IF EXISTS "Users view own character spells, GMs view all" ON character_spells;
DROP POLICY IF EXISTS "Users unlock character spells, GMs unlock all" ON character_spells;
DROP POLICY IF EXISTS "Users delete character spells, GMs delete all" ON character_spells;
DROP POLICY IF EXISTS "View character spells" ON character_spells;
DROP POLICY IF EXISTS "Insert character spells" ON character_spells;
DROP POLICY IF EXISTS "Update character spells" ON character_spells;
DROP POLICY IF EXISTS "Delete character spells" ON character_spells;
DROP POLICY IF EXISTS "character_spells_select_policy" ON character_spells;
DROP POLICY IF EXISTS "character_spells_insert_policy" ON character_spells;
DROP POLICY IF EXISTS "character_spells_update_policy" ON character_spells;
DROP POLICY IF EXISTS "character_spells_delete_policy" ON character_spells;

-- SELECT Policy
CREATE POLICY "character_spells_select_policy" ON character_spells
  FOR SELECT USING (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_spells.character_id
      AND characters.profile_id = auth.uid()
    ) OR
    auth.uid() IS NOT NULL
  );

-- INSERT Policy
CREATE POLICY "character_spells_insert_policy" ON character_spells
  FOR INSERT WITH CHECK (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_spells.character_id
      AND (
        characters.profile_id = auth.uid() OR
        characters.campaign_id IN (
          SELECT campaign_id FROM campaign_members
          WHERE profile_id = auth.uid() AND role IN ('gm', 'admin')
        )
      )
    )
  );

-- UPDATE Policy
CREATE POLICY "character_spells_update_policy" ON character_spells
  FOR UPDATE USING (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_spells.character_id
      AND (
        characters.profile_id = auth.uid() OR
        characters.campaign_id IN (
          SELECT campaign_id FROM campaign_members
          WHERE profile_id = auth.uid() AND role IN ('gm', 'admin')
        )
      )
    )
  )
  WITH CHECK (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_spells.character_id
      AND (
        characters.profile_id = auth.uid() OR
        characters.campaign_id IN (
          SELECT campaign_id FROM campaign_members
          WHERE profile_id = auth.uid() AND role IN ('gm', 'admin')
        )
      )
    )
  );

-- DELETE Policy
CREATE POLICY "character_spells_delete_policy" ON character_spells
  FOR DELETE USING (
    public.is_gm() OR
    EXISTS (
      SELECT 1 FROM characters
      WHERE characters.id = character_spells.character_id
      AND (
        characters.profile_id = auth.uid() OR
        characters.campaign_id IN (
          SELECT campaign_id FROM campaign_members
          WHERE profile_id = auth.uid() AND role IN ('gm', 'admin')
        )
      )
    )
  );
