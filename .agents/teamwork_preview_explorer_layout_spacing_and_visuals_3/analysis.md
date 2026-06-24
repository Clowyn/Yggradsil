# Analysis Report: Layout, Spacing, and Visual Highlights for Spell Trees

## 1. Missing Subclass Spells (Blood Mage) Analysis

### Direct Observations & Structure
* **Database & Seed Data**:
  * In `seed.sql`, the subclass `blood_mage` is correctly defined under the `mage` class category:
    ```sql
    INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
    VALUES (
      (SELECT id FROM class_categories WHERE key = 'mage'),
      'blood_mage',
      'Kan Büyücüsü',
      'Blood Mage',
      ...
    )
    ```
  * In `final_seed_v3.sql`, the spell tree `Kan Sanatları` (Blood Arts, ID: `f4de9c34-33e5-43ff-807d-80ddba9561f6`) is assigned to the `blood_mage` subclass:
    ```sql
    INSERT INTO spell_tree_assignments (id, spell_tree_id, class_key, subclass_key, min_level)
    VALUES ('aebac13a-7f7d-4b3b-991d-c5c6296845ce', 'f4de9c34-33e5-43ff-807d-80ddba9561f6', 'mage', 'blood_mage', 1);
    ```
  * Spells such as `bm_blood_bolt`, `bm_sacrifice_pact`, etc. are correctly seeded in the `spells` table under this tree ID.
* **Offline/Mock Fallback Mode**:
  * If the database connection is offline or if the user is in demo mode (no `characterId` supplied), `useSpellTree.ts` falls back to `MOCK_CHARACTER`, `MOCK_SPELL_TREES`, and `MOCK_SPELLS`.
  * The mock data structures in `useSpellTree.ts` (lines 15-118) **completely lack any references to the Blood Mage subclass or its spells**.
  * Specifically:
    * `MOCK_CHARACTER` has `subclass.key: 'wizard'` and subclass category `category.key: 'arcane'`.
    * `MOCK_SPELL_TREES` only has `mock-tree-id` (Arcane Weave).
    * `MOCK_SPELLS` only contains spells for the `mock-tree-id` (Magic Missile, Shield, Misty Step, Fireball).
  * Consequently, Blood Mage spells are entirely missing when running in offline/mock mode.

### Logic/Filtering Issues in `useSpellTree.ts`
* In `visibleTrees` (lines 240-266), the hook filters the spell trees as follows:
  ```typescript
  return tree.assignments.some(assign => {
    if (effectiveCharacter.level < (assign.min_level ?? 1)) return false;
    if (assign.class_key && classCategoryKey !== assign.class_key) return false;
    if (assign.race_key && raceKey !== assign.race_key) return false;
    return true;
  });
  ```
* **Critical Bug**: This filter does **NOT** check `assign.subclass_key` against the character's subclass key (`effectiveCharacter.subclass?.key`).
* **Consequence**:
  * Since `blood_mage` assignments have `class_key = 'mage'`, any character with a subclass belonging to the `mage` category (e.g., `druid`, `dark_mage`) will match the `assign.class_key` check.
  * As a result, the Blood Mage tree (and all other subclass trees under `mage`) are fetched and marked as visible for every mage.
  * In the React Flow graph, this displays all subclass trees side-by-side (rendered as dimmed/inactive unless they match the character's subclass key). If a character does not have a subclass assigned (i.e. `subclass` is null), `classCategoryKey` is undefined, causing all class trees to be filtered out entirely.

---

## 2. Horizontal Spacing Gap & Overlap Mitigation

### Spacing Logic
* In `useSpellTree.ts`, the horizontal spacing between subclass trees is hardcoded to **`6000` pixels** (lines 393 and 440):
  ```typescript
  const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
  ```
* The gap was set to `6000` because the pre-authored spell positions in the database are extremely wide. For example, in the Blood Mage tree, spell X-coordinates range from `-2338` (e.g., `bm_omni_blood_eclipse`) to `+2121` (e.g., `bm_crimson_meteor`).
* If the horizontal tree gap is decreased to `800` or `1200` without changes, the trees will heavily overlap.

### Proposal for Overlap-Free Spacing
To support a compact tree layout (e.g. `800` or `1200` gap) without overlapping and without migrating the database, we can scale down the relative X coordinates of the spells in `useSpellTree.ts`.
1. **Define Constants**:
   ```typescript
   const HORIZONTAL_TREE_GAP = 1200; // Proposed spacing gap
   const SPELL_X_SCALE = 0.15;        // Scale factor for pre-authored spell X positions
   ```
2. **Apply Scaling in Node Generation**:
   * Scale the relative spell position X coordinates:
     ```typescript
     let spellX = (spell.position?.x || 0) * SPELL_X_SCALE;
     ```
   * Position subclass roots using the compact gap:
     ```typescript
     const subclassX = (sibIdx - activeSubclasses.length / 2) * HORIZONTAL_TREE_GAP;
     ```
   * Apply this offset to spell positions:
     ```typescript
     spellX += subclassX;
     ```
* **Math Proof**:
  * With `SPELL_X_SCALE = 0.15`, the Blood Mage tree's relative width is scaled from `~4500px` down to `~675px` (spanning from `-350` to `+318`).
  * If subclass tree centers are spaced `1200px` apart, the right edge of Tree 1 (`X = 318`) and the left edge of Tree 2 (`X = 1200 - 350 = 850`) will have a gap of `532px` between them, preventing any overlap.

---

## 3. Visual Highlight Mechanics & React Flow Node Compliance

### Existing Visual Highlights
* **Divine Light Beam**:
  Implemented in `SpellNode.tsx` (lines 80-121) using layered radial/linear gradients on `isSubclassRoot && isActiveSubclassTree`.
* **Dark Mist Shroud**:
  Implemented in `SpellNode.tsx` (lines 123-133) using a purple-hued radial gradient on `isSubclassRoot && isDimmed`.
* **Interaction Disabling**:
  * **Click**: Disabled in `SpellTreeGraph.tsx` line 177:
    ```typescript
    if (node.data?.isDimmed) return;
    ```
  * **Hover/Tap**: Disabled in `SpellNode.tsx` line 70 by passing `undefined` to Framer Motion's hover/tap properties when `isDimmed` is true.

### Proposed Visual Refinements
1. **Enhanced Dark Mist Shroud**:
   To make non-selected trees look more shrouded in "mist", we can apply a sepia/purple-tint filter to the dimmed nodes in `SpellTreeGraph.tsx`'s `processedNodes`:
   ```typescript
   if (node.data?.isDimmed) {
     opacity = 0.35;
     filter = 'grayscale(90%) brightness(35%) sepia(25%) hue-rotate(260deg) contrast(80%)';
   }
   ```
2. **React Flow Node Styling Rule Compliance**:
   * React Flow positions nodes using CSS `transform` internally.
   * To prevent visual glitches, we must **never** apply `transform` directly to the `style` object of the node.
   * Instead, visual effects (glow, shadow, opacity, color) must be applied using:
     * `opacity` and `filter` in the node style returned by the hook/graph.
     * Inner wrapper elements (like `motion.div` inside `SpellNode.tsx`) for animations, scaling, or offsets.
