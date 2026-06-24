# Project: Spell Tree Feature

## Architecture
The Spell Tree feature will be built on the existing React + Tailwind CSS + Vite + Supabase + @xyflow/react stack.
- **Database**: Add `spell_trees`, `spell_tree_assignments`, `spells`, and `character_spells` tables to Supabase. Write policies allowing view/read access for all authenticated users, and modification permissions for GMs. Set up Supabase realtime replication for these tables.
- **GM Interface**: A new tab in `GMDashboard.tsx` to perform CRUD operations on spell trees, spells (nodes in the graph), and assignments to character classes, subclasses, races, and levels.
- **Player Interface**: A new route `/spells` showing a node graph of spell trees using `@xyflow/react`.
  - Sibling trees fade/shrink when a root node is selected.
  - Branching paths visually show prerequisites (lines/edges colored by state).
  - Node states: locked (unmet prereqs/requirements), available (prereqs met, has XP to unlock), unlocked (already unlocked).
- **Filtering**: Filters spell trees visible to the active character based on class, subclass, race, and level.
- **Sidebar Navigation**: Add "Spell Tree" to the main application navigation sidebar.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Database Schema | SQL migration file with tables, RLS policies, realtime publication, and seed data. Apply to local DB. | None | COMPLETED |
| 2 | E2E Test Suite | Create opaque-box E2E test suite testing Spell Tree GM CRUD and player visualization/interaction. | None | COMPLETED |
| 3 | GM CRUD Interfaces | GM Spell Management dashboard component for CRUDing trees, spells, and tree assignments. | M1 | COMPLETED |
| 4 | Spell Tree Visuals | Route `/spells` showing spell nodes, branching, states, selection effects using React Flow. | M1, M3 | COMPLETED |
| 5 | Filtering & Navigation | Race, class, subclass, level filtering logic. Integrate page route in Sidebar and layout. | M4 | COMPLETED |
| 6 | Verification | Zero TypeScript compiler errors (`npx tsc --noEmit`), dev build starts, verification tests pass. | M5 | COMPLETED |

## Interface Contracts
### Database Schema
- `spell_trees`: `id` (uuid), `name_tr` (text), `name_en` (text), `description_tr` (text), `description_en` (text).
- `spell_tree_assignments`: `id` (uuid), `spell_tree_id` (uuid), `class_key` (text), `subclass_key` (text), `race_key` (text), `min_level` (int).
- `spells`: `id` (uuid), `spell_tree_id` (uuid), `spell_key` (text), `name_tr` (text), `name_en` (text), `description_tr` (text), `description_en` (text), `level` (int), `xp_cost` (int), `prerequisites` (text[]), `position` (jsonb), `effects` (jsonb).
- `character_spells`: `id` (uuid), `character_id` (uuid), `spell_id` (uuid), `unlocked` (boolean), `unlocked_at` (timestamptz).

### Frontend Routing
- Route `/spells` resolves to `pages/SpellTreePage.tsx`.

## Code Layout
- SQL: `supabase/migrations/` (or root sql file for migration, applied to local Db).
- Components: `src/components/spell-tree/`
  - `SpellNode.tsx` - custom React Flow node component
  - `SpellEdge.tsx` - custom React Flow edge component
  - `SpellTreeGraph.tsx` - main visualization node-graph component
- GM Admin: `src/components/gm/GMSpellManager.tsx`
- Routing & Navigation: `src/src/components/layout/Sidebar.tsx` and `src/App.tsx`.
- Hooks: `src/hooks/useSpellTree.ts`
