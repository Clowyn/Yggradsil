# Project Summary: D&D Spell Tree Feature

> [!IMPORTANT]
> **Active Workspace Path**: `D:\DnD`
> Note: The IDE workspace is configured as `D:\D&D` to match the user's project name, but all actual application files, directories, and scripts reside in **`D:\DnD`** to prevent terminal execution errors caused by the `&` character.

---

## 1. Tech Stack & Environment
* **Frontend**: React 19, TypeScript, Vite.
* **Styling**: TailwindCSS v4 (RPG dark-fantasy theme: dark background `bg-abyss`, gold text gradients, Cinzel font, custom `.glass` panels).
* **Graph Rendering**: `@xyflow/react` v12 (React Flow).
* **Animations**: Framer Motion.
* **Icons**: Lucide React.
* **Database**: Supabase.
  * Configured via `src/lib/supabase.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
  * Authentication uses `AuthContext` (`useAuth()`), checking if user is GM (`isGM`).
  * Campaign scoping uses `CampaignContext` (`useCampaign()`) to scope data by `campaign_id`.

---

## 2. Database Schema (`schema.sql`)
The database contains the following spell-related tables:
* `spell_trees`
  * `id` (uuid, PK)
  * `name_tr` (text)
  * `name_en` (text)
  * `description_tr` (text)
  * `description_en` (text)
* `spell_tree_assignments`
  * `id` (uuid, PK)
  * `spell_tree_id` (uuid, FK to `spell_trees`)
  * `class_key` (text, nullable)
  * `subclass_key` (text, nullable)
  * `race_key` (text, nullable)
  * `min_level` (int)
* `spells`
  * `id` (uuid, PK)
  * `spell_tree_id` (uuid, FK to `spell_trees`)
  * `spell_key` (text)
  * `name_tr` (text)
  * `name_en` (text)
  * `description_tr` (text)
  * `description_en` (text)
  * `level` (int)
  * `xp_cost` (int)
  * `prerequisites` (text[] - stored as Postgres text array, e.g. `{"spell_key_1", "spell_key_2"}`)
  * `position` (jsonb - `{"x": number, "y": number}`)
  * `effects` (jsonb)
* `character_spells`
  * `id` (uuid, PK)
  * `character_id` (uuid)
  * `spell_id` (uuid, FK to `spells`)
  * `unlocked` (boolean)
  * `unlocked_at` (timestamptz)

### RLS Policies
* GM (`role = 'gm'`) has full CRUD rights (INSERT, UPDATE, DELETE).
* Authenticated users have SELECT rights.
* Players can INSERT/UPDATE their own `character_spells` rows to unlock spells.

---

## 3. Completed Milestones (Frontend & Database)
* **GM Dashboard Spells CRUD**: Completely implemented in `src/components/gm/GMSpellManager.tsx`.
* **Player Spell Tree UI**: Completely implemented in `src/pages/SpellTreePage.tsx` and mapped to route `/spells`.
* **React Flow Integration**: Branching paths, custom nodes (`SpellNode`), custom edges (`SpellEdge`), states (Locked/Available/Unlocked), and focus animations (sibling tree scaling & opacity reduction) are fully operational.
* **Menu Navigation**: Added to the main sidebar menu layout.

---

## 4. Generated Spell Data & Seed SQL
* **Total Subclass Trees**: 63 subclasses.
* **Total Spells**: 3,150 spells (exactly 50 spells per subclass, spanning 5 tiers).
* **Constraints Met**:
  * Metric system only (meters/m instead of feet/ft).
  * Unique spell keys and branch prerequisite linkages.
  * Emojis at the beginning of each bilingual spell name.
* **SQL Parsing Fix**: Postgres `text[]` columns require curly braces formatting (`{"prereq1", "prereq2"}`) instead of JSON arrays (`["prereq1", "prereq2"]`). The Python script `aggregate_spells.py` has been updated to output the proper string format, eliminating the `"malformed array literal: []"` error in Supabase.
* **Seed Files Location**:
  * Generated unified seed: `D:\DnD\final_seed_v3.sql` (2.2 MB, too large for a single Supabase query block).
  * **Split Files for Execution**:
    1. [final_seed_v3_part1.sql](file:///d:/DnD/final_seed_v3_part1.sql)
    2. [final_seed_v3_part2.sql](file:///d:/DnD/final_seed_v3_part2.sql)
    3. [final_seed_v3_part3.sql](file:///d:/DnD/final_seed_v3_part3.sql)
  * These files have been ran successfully to seed the Supabase database.
* **Seeding Frequency**: This database seeding is a **one-time setup**. The database stores this data permanently in the cloud, so starting the local server (`npm run dev`) does **not** require running the SQL scripts again.

---

## 5. Next Steps
When starting the new conversation, proceed with the following task:
1. **Spell Tree Modification**: Address/edit the specific spell tree that needs adjustment as requested by the user.
