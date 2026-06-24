# Spell Tree Spacing, Mapping, and Visuals Analysis

## Executive Summary
This analysis investigates the spell tree visualization, focusing on subclass mapping issues (specifically for the Blood Mage), horizontal tree spacing optimization in `useSpellTree.ts`, and the design of visual highlight effects (divine light, dark mist) in `SpellTreeGraph.tsx`, `SpellNode.tsx`, and `SpellEdge.tsx`.

---

## 1. Subclass Spells Mapping & Loading Investigation (Blood Mage)
### Direct Observations
- **Database Schema**: The `spells` table (defined in `spell_schema.sql:27-43`) does not natively contain `branch` and `min_level` columns, but they are added by the migration `spell_tree_v2_migration.sql:8-10`.
- **Seed Data**: 
  - `seed.sql` contains subclass definitions (such as `blood_mage` in `seed.sql:596-606`) but does **not** contain any spells or spell tree assignments.
  - `final_seed_v3.sql` contains the complete inserts for the Blood Mage tree (`Blood Arts`, ID: `f4de9c34-33e5-43ff-807d-80ddba9561f6`), its assignment (`final_seed_v3.sql:83`), and all corresponding spells (e.g. `bm_blood_bolt`).
- **Hook Data Loading (`useSpellTree.ts`)**:
  - The hook fetches subclass information via:
    `select('*, subclass:subclass_definitions(*, category:class_categories(*)), race:race_definitions(*)')` (line 151)
  - If the database query fails, the hook catches the error and silently falls back to offline/mock mode (lines 181-194).
  - In mock mode, the hook loads `MOCK_SPELLS` (line 15-84) and `MOCK_SPELL_TREES` (line 86-102). These mock datasets only contain the base `Arcane Weave` tree and 4 generic demo spells (`Magic Missile`, `Shield`, `Misty Step`, `Fireball`). There are no Blood Mage spells defined in the mock data.

### Root Causes of Missing/Unmapped Subclass Spells
1. **Unapplied Seed/Migration Scripts**: If `final_seed_v3.sql` is not fully executed on the database, subclass spells will be completely missing from database queries.
2. **Offline Fallback Limitation**: In fallback/demo mode (or when no character ID is active), `useSpellTree.ts` serves only the basic 4 mock spells, meaning subclass trees (including Blood Mage) are entirely absent from the mock state.
3. **Mock Character/Subclass Misalignment**: In `useSpellTree.ts:104-118`, the `MOCK_CHARACTER` has subclass key `'wizard'` and class category key `'arcane'`. However, `wizard` is not in `SUBCLASSES` (in `constants.ts`), and `arcane` is not a valid category. This breaks subclass mappings in offline mode.
4. **Subclass Key Ignored in Tree Filter**:
   In `useSpellTree.ts` lines 240-265, `visibleTrees` only checks `class_key` and `race_key` in the assignments:
   ```typescript
   return tree.assignments.some(assign => {
     if (effectiveCharacter.level < (assign.min_level ?? 1)) return false;
     if (assign.class_key && classCategoryKey !== assign.class_key) return false;
     if (assign.race_key && raceKey !== assign.race_key) return false;
     return true;
   });
   ```
   It fails to verify `assign.subclass_key === subclassKey`. Consequently, all subclass trees for a class category are loaded for every character of that category (and later dimmed), which bloats the view.
5. **Null Class Key Overlap**: If a subclass assignment in the database has a `NULL` `class_key` (which is logically possible since the subclass key alone determines the class), then `tree.assignments.find(a => a.class_key === classCategoryKey)` in line 436 returns `undefined`. This causes the subclass positioning offset to be skipped, making all subclass spells overlap at coordinate `(0, 0)`.

---

## 2. Horizontal Spacing Gap Optimization
### Spacing Multiplier Location
The subclass horizontal spacing offset is calculated in two places in `useSpellTree.ts`:
1. **Subclass Root Nodes** (lines 391-423):
   ```typescript
   const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
   ```
2. **Spell Nodes** (lines 438-444):
   ```typescript
   const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
   ```

### Overlap-Free Spacing Proposal
A multiplier of `6000` is used because the spell trees are generated with a large radial layout scale in the database (radius up to `3950` units, giving a tree width of `~6840` units). 
If the spacing multiplier is directly reduced to `800` or `1200` without scaling down the trees, the spell nodes of sibling trees will overlap.

#### Solution
1. **Scale Down Spells**: Scale down the individual spell coordinates inside the frontend hook to make the trees more compact.
2. **Reduce Multiplier**: Use `1200` (or `800`) as the new multiplier.
3. **Center Offsets**: Improve the centering math using `activeSubclasses.length - 1` instead of `activeSubclasses.length`.

#### Code Changes Proposal in `useSpellTree.ts`
- **Constant Definition**:
  ```typescript
  const TREE_SPACING = 1200; // Optimized spacing
  const SPELL_SCALE = 0.2;  // Compact scale factor
  ```
- **Subclass Root Nodes position calculation**:
  ```typescript
  const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
  ```
- **Spell Nodes position calculation**:
  ```typescript
  let spellX = (spell.position?.x || 0) * SPELL_SCALE;
  let spellY = (spell.position?.y || 0) * SPELL_SCALE;
  // Add offset
  const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
  spellX += subclassX;
  ```

---

## 3. Visual Highlights & Interactions Design
### Divine Light (Active Subclass Tree)
We can design an enhanced vertical light beam effect centered behind the active subclass root.
- **Implementation**: In `SpellNode.tsx`, the active root displays nested HTML elements styled with absolute positioning, blurring, and radial/linear gradients.
- **Styles**:
  - Outer glow: `w-[350px] h-[3000px]`, `background: linear-gradient(to bottom, ...)`, `filter: blur(45px)`
  - Pulse column: `w-[90px] h-[3000px]`, `background: linear-gradient(...)`, `filter: blur(10px)`, `animate-pulse`
  - Core light shaft: `w-[16px] h-[1500px]`, `background: linear-gradient(to top, rgba(251, 191, 36, 0.5) 0%, #fff 100%)`

### Dark Mist (Dimmed Sibling Trees)
For inactive sibling trees, we shroud the root nodes and dim all connection edges.
- **Inactive Roots**: A dark purple/slate pulsing radial glow behind the node (`SpellNode.tsx` line 124-133).
- **Dimmed Spells**: Apply a grayscale/darkened CSS filter in `SpellTreeGraph.tsx` (`grayscale(100%) brightness(35%) contrast(85%) blur(0.5px)`).

### Interaction Disabling
To prevent interactions with the dimmed sibling trees:
1. **Clicks**: The `onNodeClick` handler in `SpellTreeGraph.tsx` checks `node.data.isDimmed` and returns early.
2. **Hovers & Tooltips**:
   - `whileHover` and `whileTap` animations in `SpellNode.tsx` are disabled conditionally if `isDimmed` is true.
   - `onMouseEnter` is blocked so that the description tooltip does not open.
   - Cursor style is changed to `cursor-not-allowed` instead of `cursor-pointer`.

### React Flow Node Styling Compliance
*Crucial Constraint: Never apply CSS `transform` styles directly to React Flow nodes.*
- **Correct approach**: The node styles are modified in `SpellTreeGraph.tsx` using `opacity` and `filter`:
  ```typescript
  return {
    ...node,
    style: {
      opacity: node.data?.isDimmed ? 0.35 : 1.0,
      filter: node.data?.isDimmed ? 'grayscale(80%) brightness(45%) contrast(85%)' : 'none',
    },
  };
  ```
- All layout offsets, scaling, and light beams are either added to the node coordinates `(x, y)` directly or rendered *inside* the child elements of `SpellNode` as wrapper divs. React Flow's root node wrapper is untouched.
