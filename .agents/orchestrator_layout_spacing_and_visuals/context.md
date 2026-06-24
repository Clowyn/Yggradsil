# Context - D&D Spell Tree Layout, Spacing, and Visuals

## Current Objective
Resolve visual layout spacing issues, ensure subclass spells (e.g., Blood Mage) appear under their respective trees, and implement divine light & dark mist visuals.

## Synthesized Findings from Explorers 1, 2, and 3

### 1. Missing Subclass Spells (Blood Mage)
- **Root Cause 1 (Pagination Limit)**: The remote Supabase server enforces a hard limit of 1000 rows per request. The `spells` table has 3,150 rows. A simple `.select('*')` only retrieves the first 1000 spells. Blood Mage spells are inserted later in the seed file (index > 1000), making them completely missing in online mode.
  - *Solution*: Implement paginated chunk loading in `useSpellTree.ts` to fetch all 3,150 spells or filter spells by visible tree IDs using `.in('spell_tree_id', visibleTreeIds)`. Paginated fetching (e.g., in batches of 1000) is preferred as it is robust for GM views showing all trees.
- **Root Cause 2 (Offline Fallback Mismatch)**: When no active character is present, the app falls back to offline/mock mode. In mock mode, the subclass list is empty because `MOCK_CHARACTER` has subclass key `'wizard'` (under category `'arcane'`), which is not in `SUBCLASSES` or `CLASS_CATEGORIES` constants. Thus, mock mode shows no subclass roots or trees, only basic `Arcane Weave` spells.
  - *Solution*: Align `MOCK_CHARACTER` with real constants (e.g., subclass `'blood_mage'`, class category `'mage'`) and populate `MOCK_SPELLS` and `MOCK_SPELL_TREES` with subclass examples to allow visual rendering and testing.

### 2. Spacing Multiplier & Layout
- **Tree Overlaps at Smaller Spacing**: Spells inside a subclass tree have coordinates ranging from `-2987` to `3853` horizontally (width of nearly 7000 units). Setting the tree spacing multiplier from `6000` to `1200` or `800` directly causes massive tree overlaps.
  - *Solution*: In `useSpellTree.ts`, multiply local spell X and Y coordinates by a scale factor (e.g., `0.15` or `0.2`) to make individual trees compact (~1000 width). Then set the spacing multiplier to `1200` or `800`.
- **Centering Correction**: Change spacing centering from `sibIdx - activeSubclasses.length / 2` to `sibIdx - (activeSubclasses.length - 1) / 2` to align the trees symmetrically around the vertical axis `X = 0`.
- **Vertical Spacing Compactness**: Set subclass root nodes Y coordinate to `200` instead of `800` for a tighter vertical layout, and adjust spell Y coordinate calculation accordingly.

### 3. Visual Highlights & Sibling Shrouding
- **Divine Light & Dark Mist**: These effects are already implemented inside `SpellNode.tsx` using Tailwind class modifiers, CSS filters, animations, and child element overlays. They do not violate the CSS `transform` constraint on React Flow nodes.
- **Click & Hover Disabling**: In `SpellTreeGraph.tsx`, clicking is prevented by returning early on `node.data?.isDimmed`. In `SpellNode.tsx`, hover scaling, tap scaling, and mouse-enter tooltips are successfully disabled using conditional expressions.

## Next Steps
- Spawn a `teamwork_preview_worker` to apply these layout, data fetching, and mock changes.
