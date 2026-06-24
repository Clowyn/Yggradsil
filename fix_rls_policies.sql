-- ==========================================
-- FIX: Missing INSERT/UPDATE/DELETE RLS Policies
-- Run this in the Supabase SQL Editor
-- ==========================================

-- ── CAMPAIGNS ──────────────────────────────────────────
-- GMs can create campaigns
CREATE POLICY "GMs can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = gm_id);

-- GMs can update their own campaigns
CREATE POLICY "GMs can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = gm_id);

-- Also allow GMs to SELECT their own campaigns even before they add themselves as members
DROP POLICY IF EXISTS "View campaigns" ON campaigns;
CREATE POLICY "View campaigns" ON campaigns FOR SELECT USING (
  gm_id = auth.uid() OR
  EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = id AND profile_id = auth.uid())
);

-- ── CAMPAIGN MEMBERS ───────────────────────────────────
-- Authenticated users can insert themselves as members
CREATE POLICY "Users can join campaigns" ON campaign_members
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- GMs can also add members to their campaigns
CREATE POLICY "GMs can add members" ON campaign_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND gm_id = auth.uid())
  );

-- ── CHARACTER STATS ────────────────────────────────────
-- Players can insert their own character stats
CREATE POLICY "Players insert own stats" ON character_stats
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

-- Players (and GMs) can update stats
CREATE POLICY "Players update own stats" ON character_stats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM characters WHERE id = character_id AND (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm')
      )
    )
  );

-- ── CHARACTER SKILLS ───────────────────────────────────
CREATE POLICY "Players insert own skills" ON character_skills
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players view own skills" ON character_skills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM characters WHERE id = character_id AND (
      profile_id = auth.uid() OR
      EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm')
    )
  )
);

CREATE POLICY "Players update own skills" ON character_skills
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM characters WHERE id = character_id AND (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm')
      )
    )
  );

-- ── INVENTORY ITEMS ────────────────────────────────────
CREATE POLICY "Players insert own inventory" ON inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );

CREATE POLICY "Players update own inventory" ON inventory_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM characters WHERE id = character_id AND (
        profile_id = auth.uid() OR
        EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm')
      )
    )
  );

-- ── MAP STATE ──────────────────────────────────────────
CREATE POLICY "GMs insert map state" ON map_state
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM campaign_members WHERE campaign_id = map_state.campaign_id AND profile_id = auth.uid() AND role = 'gm')
  );

-- ── MAP TOKENS ─────────────────────────────────────────
CREATE POLICY "Players insert own tokens" ON map_tokens
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM characters WHERE id = character_id AND profile_id = auth.uid())
  );
