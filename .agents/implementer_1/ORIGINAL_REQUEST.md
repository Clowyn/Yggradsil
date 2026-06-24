## 2026-06-18T18:12:00Z

Update the Spell Tree feature implementation in the repository at D:\DnD to address the Reviewer's feedback.

Please modify and create the following files:

1. `D:\DnD\src\lib\types.ts`
   Update the types to reflect the multi-tree database schema.

2. `D:\DnD\src\hooks\useSpellTree.ts`
   Update the hook `useSpellTree(characterId: string | null)`:
   - Perform query database filtering: fetch only the character spells where `character_id = characterId` at the database query level (`.eq('character_id', characterId)`).
   - Query `spell_trees` with their `spell_tree_assignments` (via `.select('*, assignments:spell_tree_assignments(*)')`) and query `spells` (via `select('*')`).
   - Implement filtering:
     - Filter out spell trees if they have assignments, and the character does not satisfy them (check character class category key, subclass key, or race key).
     - Filter out spells that are not linked to the visible spell trees.
     - Spells that are visible but have a level prerequisite greater than the character level, or have prerequisites not yet unlocked, are marked as `locked` (not hidden).
   - Atomic Unlock: When unlocking a spell, call the database Pl/pgSQL RPC function `unlock_spell` via `supabase.rpc('unlock_spell', { char_id: characterId, spell_val_id: spellId, xp_val_cost: xpCost })` to ensure atomic deduction of XP and insertion of the spell in a single transaction.
   - Return `{ nodes, edges, onNodeClick, xp, unlockedCount, totalSkills, loading, isMock }`.
   - Ensure the mock fallback sets `isMock: true` and logs a console warning when the database throws a "relation not found" or "schema cache" error.

3. `D:\DnD\src\components\spell-tree\SpellTreeGraph.tsx`
   Update the component to check `isMock` from `useSpellTree`. If `isMock` is true, render a warning banner/badge at the top of the graph page (e.g. `[Offline Demo Mode — Database Unavailable]`) to make it clear that the mock state is active. Adjust node/edge mappings to use the new `SpellNode` and `CharacterSpell` structures.

4. `D:\DnD\src\components\gm\GMSpellManager.tsx`
   Update the GM dashboard CRUD interface:
   - "Manage Spells" tab: Allow adding/editing/deleting spell trees, spell tree assignments (linking trees to classes, subclasses, races, and min level), and spells (attaching them to a specific tree).
   - "Player Spells" tab: Allow GMs to view, teach (inserts a record), or remove (deletes a record) player spells using standard Supabase calls.

5. `D:\DnD\src\components\gm\GMDashboard.tsx`
   Align tabs and properties to match the updated `GMSpellManager.tsx`.

6. `D:\DnD\scripts\test-spell-tree.js`
   Write a pure Node.js javascript test script (e.g. using `node scripts/test-spell-tree.js`) that runs mock-based unit tests for the filtering logic, ancestor/descendant recursive path tracking (with cycle safeguarding), and mock fallback behavior of the Spell Tree feature. This script will serve as our E2E and unit test suite.

Verify that there are zero TypeScript compiler errors (npx tsc --noEmit), that npm run build compiles successfully, and that the test suite runs correctly.

## 2026-06-19T13:40:00Z

Implement the Spell Tree Player Page enhancements described in ORIGINAL_REQUEST.md.
Specifically:
1. Apply the modifications to the following files to implement R1, R2, R3, and R4:
   - `src/hooks/useSpellTree.ts`
   - `src/components/spell-tree/SpellTreeGraph.tsx`
   - `src/components/spell-tree/SpellNode.tsx`
   You can use the patches provided in `D:\DnD\.agents\teamwork_preview_explorer_setup\` or write the equivalent logic:
   - R1: Spells mapped under correct subclasses, forming a prerequisite-based tree structure. Spells positioned dynamically under their subclass nodes (offsetting their database coordinates by the subclass position) to ensure they are visually connected.
   - R2: Active character class/subclass filtering. Hiding other classes. Auto-selection/highlight of active subclass tree.
   - R3: Divine Light golden beam/glow/radiance from above on the active subclass tree root node. Pulsing animations.
   - R4: Dark Mist on non-selected sibling subclasses and their spells: grayed out/dimmed (opacity 0.35, blur/grayscale), disabled click/hover interactions (no tooltip, no click centering).
   - Compliance with CSS transform constraint: NEVER apply CSS `transform` styles directly to React Flow nodes. (Use opacity, filter, or wrapper `<div>` elements inside/for nodes).
   - Ensure NO modification of GM Dashboard or GMSpellManager.tsx.
2. Verify that there are absolutely no TypeScript / compile errors in the workspace by running:
   - `npx tsc --noEmit`
3. Verify that the unit tests pass:
   - `node scripts/test-spell-tree.js`
4. Verify that the application builds successfully:
   - `npm run build`

