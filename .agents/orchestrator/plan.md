# Spell Tree Feature Implementation Plan

We are implementing the Spell Tree feature in the D&D companion web application.

## Milestones

1. **Milestone 1: Database Schema & Migration Setup**
   - Create tables `spell_definitions` (spell trees, node properties, school, class/subclass/race restrictions, level prerequisite, prerequisites) and `character_spells` (character unlocked spells).
   - Write RLS policies:
     - `spell_definitions`: SELECT by authenticated users; ALL by GMs.
     - `character_spells`: SELECT/INSERT/DELETE by character owners or campaign GMs.
   - Set up Realtime publication for `character_spells`.
   - Apply SQL to Supabase.

2. **Milestone 2: GM Spell Management CRUD Tab**
   - Extend `GMDashboard.tsx` to add a new 'spells' tab.
   - Implement `SpellTreeTab` in GM Dashboard with:
     - Creating/editing/deleting spell trees.
     - Adding/editing/deleting spell nodes in a tree.
     - Specifying requirements (level, class/subclass restrictions, prerequisites, position, effects).
     - Assigning spells/trees to characters.

3. **Milestone 3: Spell Tree Page & Visualization Component**
   - Create a new page `pages/SpellTreePage.tsx` and register the route `/spells` in `App.tsx`.
   - Create `components/spell-tree/SpellTreeGraph.tsx` using `@xyflow/react`.
   - Implement custom `SpellNode` and `SpellEdge` with glowing school-themed shadows, animated borders/pulses, and lock overlays.
   - Implement active path selection: when a root or node is clicked, highlight its ancestors and descendants, and dim all other nodes and edges.

4. **Milestone 4: Filtering Logic**
   - Update hooks and filtering to dynamically filter visible spell trees based on active character class, subclass, and race.
   - Show level-restricted spells as locked instead of hiding them.

5. **Milestone 5: Sidebar Navigation & Layout Integration**
   - Add 'Spell Tree' item to navigation in `Sidebar.tsx`.
   - Ensure it matches the theme and visual identity of the rest of the application.

6. **Milestone 6: Verification & Hardening**
   - Resolve any TypeScript compiler errors (`npx tsc --noEmit`).
   - Run verification scripts and tests.
   - Verify dev build starts cleanly.
