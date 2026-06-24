-- Allow GMs to insert characters in campaigns they manage
CREATE POLICY "GMs can insert characters for members" ON characters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = characters.campaign_id AND campaigns.gm_id = auth.uid()
    )
  );

-- Allow GMs to insert initial stats
CREATE POLICY "GMs can insert stats for characters" ON character_stats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      JOIN campaigns ON campaigns.id = characters.campaign_id
      WHERE characters.id = character_stats.character_id AND campaigns.gm_id = auth.uid()
    )
  );

-- Allow GMs to insert map tokens
CREATE POLICY "GMs can insert tokens for characters" ON map_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      JOIN campaigns ON campaigns.id = characters.campaign_id
      WHERE characters.id = map_tokens.character_id AND campaigns.gm_id = auth.uid()
    )
  );
