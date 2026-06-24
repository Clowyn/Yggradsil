# Analysis of Spell Tree Layout, Spacing, and Visual Highlights

## 1. Subclass Spells (Blood Mage) Mapping & Seeding Investigation

### Data Structure & Seeding
In the database, the spells, spell trees, and character subclasses are structured as follows:
- **`subclass_definitions`**: Contains keys such as `'blood_mage'`, `'druid'`, etc. This table is populated in `seed.sql`.
- **`spell_trees`**: Contains tree definitions. The Blood Arts tree is inserted in `final_seed_v3.sql` (and `seed.sql`) with ID `'f4de9c34-33e5-43ff-807d-80ddba9561f6'`.
- **`spell_tree_assignments`**: Maps trees to subclasses/classes. The Blood Arts tree has an assignment mapping it to class `'mage'` and subclass `'blood_mage'`.
- **`spells`**: Contains the spell nodes. Blood Mage spells (prefixed with `bm_`) are inserted under `spell_tree_id = 'f4de9c34-33e5-43ff-807d-80ddba9561f6'`.

### Root Causes of Missing Blood Mage Spells
Through code review and database script analysis, we identified two primary reasons why Blood Mage spells are missing or not mapping:

1. **Fallback/Mock Mode Omission**:
   - In `useSpellTree.ts`, if Supabase fails to connect, has a schema cache issue, or no `characterId` is provided, it falls back to hardcoded mock states (`isFallbackMode = true`).
   - The mock data only defines a mock character with subclass `'wizard'` under category `'arcane'`, and a single mock tree `'Arcane Weave'` with 4 spells (`magic_missile`, `shield`, `misty_step`, `fireball`).
   - There are **no** mock spells or trees for the Blood Mage or any other subclass in `useSpellTree.ts`. If the app operates in offline/demo mode, Blood Mage spells will be completely missing.
2. **Seed Script Dependency**:
   - `final_seed_v3.sql` handles tree structure insertions but does **not** insert records into `subclass_definitions` or `class_categories`. It assumes these have already been seeded by `seed.sql`.
   - If the database was reset and only `final_seed_v3.sql` was executed, the `subclass_definitions` table is empty, which causes character queries to return null subclasses, filtering out the corresponding spell trees.
3. **Query Relationship Resolution**:
   - The Supabase query in `useSpellTree.ts` pulls subclass category keys using `.select('*, subclass:subclass_definitions(*, category:class_categories(*))')`. If the category relationship is not mapped or is missing in PostgreSQL RLS/caching, the query fails and forces a fallback to the mock data.

---

## 2. Spacing Multiplier & Tree Layout Spacing

### Location of Spacing Multiplier
The spacing logic is located in `src/hooks/useSpellTree.ts` in two places:
1. **Subclass Nodes Placement** (lines 391-395):
   ```typescript
   const subclassNodes: Node[] = activeSubclasses.map((sub) => {
     const sibIdx = activeSubclasses.findIndex(s => s.key === sub.key);
     const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
     const subclassY = 800;
     ...
   ```
2. **Spell Nodes Placement** (lines 438-444):
   ```typescript
   const sibIdx = activeSubclasses.findIndex(s => s.key === assign.subclass_key);
   if (sibIdx !== -1) {
     const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
     const subclassY = 800;
     spellX += subclassX;
     spellY += subclassY;
   }
   ```

### Overlap Risk and Mitigation
- **The Issue**: Individual subclass trees are extremely wide. For example, the Blood Arts spells have local X-coordinates ranging from `-2338` (e.g. `bm_omni_blood_eclipse`) to `+610` (e.g. `bm_blood_thirst`), spanning a width of **~3000 units**.
- If the horizontal multiplier is simply decreased to `800` or `1200`, adjacent subclass trees will severely overlap because their centers will be closer than their individual widths.
- **Proposed Solution**:
  Scale down the local X-coordinates of the spells in `useSpellTree.ts` by a compression factor (e.g., `0.15` or `0.20`), and then use the target tree spacing multiplier (e.g., `1000` or `1200`):
  ```typescript
  // In useSpellTree.ts, scale local spell coordinates:
  let spellX = (spell.position?.x || 0) * 0.15;
  ```
  This reduces the maximum tree width to `~450 units`, allowing a spacing multiplier of `1000` or `1200` to be used cleanly without overlaps.

---

## 3. Visual Highlight Mechanics Design

We analyzed `SpellTreeGraph.tsx`, `SpellNode.tsx`, and `SpellEdge.tsx` to design visual highlights:

### A. "Divine Light" Beam Effect
- **Target**: Selected subclass tree root node and its descendants.
- **Design**:
  - The subclass root node displays concentric glowing and pulsing light column divs (radial and linear gradients with blurs) behind it to represent a column of light ascending/descending.
  - This is controlled by checks like `isSubclassRoot && isActiveSubclassTree` inside `SpellNode.tsx`.

### B. "Dark Mist" Shroud Effect
- **Target**: Sibling trees (non-selected subclasses and their spells/edges).
- **Design**:
  - Apply `opacity` and `filter` styles to sibling trees in `SpellTreeGraph.tsx`.
  - Non-selected nodes and edges are set to `opacity = 0.35` (nodes) / `0.15` (edges) with a CSS filter: `filter: grayscale(80%) brightness(45%) contrast(85%)`.
  - In `SpellNode.tsx`, a subtle dark purple radial gradient background (`radial-gradient(circle, rgba(88, 28, 135, 0.15) 0%, rgba(15, 23, 42, 0.3) 50%, transparent 70%)`) with a `blur(25px)` filter creates a mist/shroud visual behind dimmed roots.

### C. Click & Hover Interaction Disabling
- **Clicks**:
  - In `SpellTreeGraph.tsx`, the `handleNodeClick` function immediately exits if the node has the `isDimmed` flag:
    ```typescript
    if (node.data?.isDimmed) return;
    ```
- **Hovers & Tooltips**:
  - In `SpellNode.tsx`, Framer Motion animations (`whileHover`, `whileTap`) are set to `undefined` if `isDimmed` is true.
  - Tooltip rendering `onMouseEnter` is blocked:
    ```typescript
    onMouseEnter={() => !isDimmed && setShowTooltip(true)}
    ```
  - The cursor style is set to `cursor-not-allowed` instead of `cursor-pointer`.

### D. CSS Transform Rule Compliance
- **Rule**: Never apply CSS `transform` styles directly to React Flow nodes because React Flow relies on `transform` for absolute node positioning.
- **Safe Options**:
  1. **Opacity and Filters**: Set `opacity` and `filter` properties directly on the React Flow node's `style` object inside `SpellTreeGraph.tsx`:
     ```typescript
     style: {
       opacity: 0.35,
       filter: 'grayscale(80%) brightness(45%) contrast(85%)'
     }
     ```
  2. **Inner Wrappers**: Inside `SpellNode.tsx`, perform any scaling or visual transformations (like Framer Motion's `whileHover={{ scale: 1.12 }}`) on the inner `div` wrapper, leaving the top-level React Flow node style unmodified.
