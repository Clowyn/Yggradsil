-- ==========================================
-- Spell Tree V2 Migration
-- ==========================================

-- 1. Remove 'school' column from spells table
ALTER TABLE spells DROP COLUMN IF EXISTS school;

-- 2. Add 'min_level' and 'branch' columns to spells table
ALTER TABLE spells ADD COLUMN IF NOT EXISTS min_level integer DEFAULT 1;
ALTER TABLE spells ADD COLUMN IF NOT EXISTS branch text;

-- 3. Clear existing dummy/old data (optional but recommended if generating new trees entirely)
-- TRUNCATE TABLE spell_trees CASCADE;
