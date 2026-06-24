## 2026-06-19T14:46:33Z
You are teamwork_preview_worker_implementation_1.
Your working directory is D:\DnD\.agents\teamwork_preview_worker_implementation_1\.
Your role is Integrator.

Your task is to implement the live data integration and GM character management features in D:\DnD.

Here are the requirements:

1. **SQL Migration**:
   - Create a file `D:\DnD\characters_gm_migration.sql` with the RLS policies needed to:
     - Allow GMs to insert new characters in campaigns they manage.
     - Allow GMs to insert character stats for these characters.
     - Allow GMs to insert map tokens for these characters.
   - Example policies:
     ```sql
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
     ```

2. **CampaignContext Updates**:
   - Modify `src/contexts/CampaignContext.tsx`.
   - Update the characters state to be typed as `Character[]` (imported from `../lib/types`).
   - Modify the campaign characters query to use nested select joins to fetch race and subclass details:
     ```typescript
     const { data: charData, error: charError } = await supabase
       .from('characters')
       .select(`
         *,
         race:race_definitions(
           *,
           tier:race_tiers(*)
         ),
         subclass:subclass_definitions(
           *,
           category:class_categories(*)
         ),
         profile:profiles(*)
       `)
       .eq('campaign_id', activeCampaignId);
     ```
   - Cast the result to `Character[]` when updating state.

3. **DashboardPage Updates**:
   - Modify `src/pages/DashboardPage.tsx`.
   - Read `characters` and `activeCharacterId` from `useCampaign()`.
   - Find the active character in the characters list.
   - If the active character is present, dynamically map the dashboard stats (Level, XP, Race, and Class) to the character's database values. Use the subclass name (localized based on `locale` using `name_tr` or `name_en`) and the race name. Ensure that the "Half-Elf Paladin" hardcoded fallback is only used when no active character exists at all. Fix the bug where newly created characters (e.g. Brain Eater Psycho Mage) display as Half-Elf Paladin.

4. **GMDashboard Updates**:
   - Modify `src/components/gm/GMDashboard.tsx`.
   - Replace the static/demo data in `GMDashboard.tsx` with live characters data from the current campaign (using Supabase queries or CampaignContext).
   - Fetch/subscribe to characters in the current campaign. Include a mapping function `mapCharacterToDemoPlayer(char: any): DemoPlayer` (similar to the one in Explorer 3's handoff) that translates a live character object (with joins) into the `DemoPlayer` structure used by GMDashboard.
   - Fetch the active races and subclasses list from Supabase (`race_definitions` and `subclass_definitions`) to use for option selection.
   - In the Party and XP tabs, render actual characters from Supabase.
   - Implement XP Distribution: When the GM distributes XP (either bulk or individual), update the `xp_total`, `xp_available` in the Supabase `characters` table for those characters. Calculate the new level based on XP (e.g. `Math.floor(newXp / 1000) + 1`). Ensure changes persist in the database.
   - Implement GM Character Creation:
     - Add a "Create Character" button and form/modal within the Party tab or general dashboard header.
     - The GM can specify: Name, Assigned User/Profile (selected from campaign members list), Race (loaded from `race_definitions`), Subclass (loaded from `subclass_definitions` joined with class categories or class categories list), Level, and XP.
     - When created, insert:
       1. The new character record into the Supabase `characters` table.
       2. Six base stats in `character_stats` (STR, DEX, CON, INT, WIS, CHA) calculated as `10 + (race_bonus) + (subclass_bonus)`.
       3. A default map token in `map_tokens` (x_position = 600, y_position = 400, color = '#ffd700').
       4. Refresh the characters list.
   - Set up a realtime subscription listener on the `characters` table so that updates to characters refresh the UI state in the dashboard.

5. **Build and Type Checking**:
   - Run `npx tsc --noEmit` and `npm run dev` to verify the build compiles perfectly with no errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Save your handoff report to D:\DnD\.agents\teamwork_preview_worker_implementation_1\handoff.md.
