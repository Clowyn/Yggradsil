# Handoff Report — Spell Tree Layout, Spacing, and Visuals

## 1. Observation

### Subclass Mapping & Spells Loading (Blood Mage)
- In `src/hooks/useSpellTree.ts` (lines 149-198), the hook queries the database for characters, spell trees, assignments, and character spells. If a database error or schema cache error occurs, it falls back to mock/offline mode:
  ```typescript
  } catch (err: any) {
    ...
    setIsFallbackMode(true);
    setSpellTrees(MOCK_SPELL_TREES);
    setSpells(MOCK_SPELLS);
    setCharacter(MOCK_CHARACTER);
  }
  ```
- In mock mode, the data is set to `MOCK_SPELLS` (lines 15-84) and `MOCK_SPELL_TREES` (lines 86-102). `MOCK_SPELLS` only contains `mock-magic-missile`, `mock-shield`, `mock-misty-step`, and `mock-fireball`. There are no Blood Mage spells or subclass spell trees in `MOCK_SPELLS`.
- In `src/lib/constants.ts` (lines 100-173), the subclass key for the Blood Mage is defined as `'blood_mage'`:
  ```typescript
  { category_key: 'mage', key: 'blood_mage', name_tr: 'Kan Büyücüsü', name_en: 'Blood Mage', ... }
  ```
- In the database schema (`spell_schema.sql` lines 27-43), the `spells` table is created without `branch` and `min_level` columns, which are subsequently added by `spell_tree_v2_migration.sql` (lines 8-10):
  ```sql
  ALTER TABLE spells ADD COLUMN IF NOT EXISTS min_level integer DEFAULT 1;
  ALTER TABLE spells ADD COLUMN IF NOT EXISTS branch text;
  ```
- The `final_seed_v3.sql` seed file (and `final_seed_v3_part1.sql`) contains insertions into `spell_tree_assignments` (lines 83/85) and `spells` (lines 393/395) for the Blood Mage subclass:
  ```sql
  INSERT INTO spell_tree_assignments (id, spell_tree_id, class_key, subclass_key, min_level) VALUES 
  ('aebac13a-7f7d-4b3b-991d-c5c6296845ce', 'f4de9c34-33e5-43ff-807d-80ddba9561f6', 'mage', 'blood_mage', 1);
  ```
- In `src/hooks/useSpellTree.ts` lines 240-265, `visibleTrees` filters spell trees based on character details but does not check if `assign.subclass_key === subclassKey`:
  ```typescript
  return tree.assignments.some(assign => {
    if (effectiveCharacter.level < (assign.min_level ?? 1)) return false;
    if (assign.class_key && classCategoryKey !== assign.class_key) return false;
    if (assign.race_key && raceKey !== assign.race_key) return false;
    return true;
  });
  ```
- In `src/hooks/useSpellTree.ts` line 436, the code retrieves tree assignments:
  ```typescript
  const assign = tree.assignments.find(a => a.class_key === classCategoryKey);
  ```

### Spacing Multiplier & Layout
- The horizontal spacing offset is calculated in `src/hooks/useSpellTree.ts` using a spacing multiplier of `6000` (lines 393, 440):
  ```typescript
  const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
  ```
- Spells in a single tree are positioned radially with coordinates (radius up to `3950` units, e.g. `scripts/aggregate_spells.py:79`):
  ```python
  radius = 200 + pos_in_branch * 250
  ```

### Visual Highlights & Interactions
- Visual highlighting styles are defined in `src/components/spell-tree/SpellTreeGraph.tsx` (lines 95-128) using `opacity` and `filter` style objects:
  ```typescript
  return {
    ...node,
    style: {
      opacity,
      filter,
    },
  };
  ```
- Click event blocking is in `src/components/spell-tree/SpellTreeGraph.tsx` (line 177):
  ```typescript
  if (node.data?.isDimmed) return;
  ```
- Hover animation and tooltip blocking is in `src/components/spell-tree/SpellNode.tsx` (lines 70-73):
  ```typescript
  whileHover={isDimmed ? undefined : { scale: 1.12 }}
  whileTap={isDimmed ? undefined : { scale: 0.95 }}
  onMouseEnter={() => !isDimmed && setShowTooltip(true)}
  ```

---

## 2. Logic Chain

1. **Subclass Spells Missing Root Cause**:
   - In offline/fallback mode, `useSpellTree.ts` uses `MOCK_SPELLS` which contains only 4 basic demo spells. It has no Blood Mage spells.
   - If the database was only initialized with `seed.sql` and `spell_schema.sql` (which only contains the `Arcane Weave` demo spells), the `spells` table in the database will be empty of subclass spells. Only running `final_seed_v3.sql` populates the Blood Mage spells and assignments.
   - If a character has no subclass chosen (or a misspelled subclass key), `classCategoryKey` is undefined. The assignment lookup `tree.assignments.find(a => a.class_key === classCategoryKey)` returns `undefined`, which skips the subclass position offset and causes trees to cluster at the center.

2. **Spacing Gap Adjustment**:
   - Spells within a single tree are spread up to `~3400` units horizontally from the center because of the database-defined radial layout (`radius = 200 + pos_in_branch * 250`).
   - If the subclass roots spacing multiplier is changed from `6000` to `800` or `1200` without changes to spell positions, the trees will overlap.
   - Therefore, to decrease spacing to `800` or `1200` without overlaps, we must scale down the spell coordinates by a factor of `0.2` (resulting in a maximum tree radius of `~790` units) in the frontend.
   - Centering math should be adjusted to `(sibIdx - (activeSubclasses.length - 1) / 2)` to align the trees around coordinate X = 0.

3. **Visual Highlights & Interactions**:
   - Applying `transform` styles directly to React Flow nodes breaks layout/positioning. The project rule specifies: *"Never apply CSS `transform` styles directly to React Flow nodes."*
   - Modifying `processedNodes` in `SpellTreeGraph.tsx` to apply `opacity` and `filter` to the node's style object is fully compliant.
   - Hover and click events are successfully disabled by checking `isDimmed` in `SpellNode` event handlers and returning early in `handleNodeClick`.
   - The "divine light" beam effect is implemented as child `div` elements inside `SpellNode` under the condition `isSubclassRoot && isActiveSubclassTree` (using linear/radial gradients and blurring). The "dark mist" shroud is placed behind dimmed roots.

---

## 3. Caveats

- **Database State**: The actual runtime database state was not directly queried. We assume the database has not been seeded with `final_seed_v3.sql` if the subclass spells are not rendering in online mode.
- **Class-wide Trees**: If a tree is assigned to all subclasses of a class category (with `subclass_key` as `NULL`), then the first assignment matching the class key will be returned by `tree.assignments.find`. If a tree is assigned to multiple classes/subclasses, a more advanced matching algorithm is required.

---

## 4. Conclusion

- **Missing Spells**: Blood Mage spells are missing because they are not defined in `MOCK_SPELLS` (causing issues in mock/fallback mode) and the subclass-specific seed `final_seed_v3.sql` must be successfully run on the Supabase database.
- **Spacing Decrease**: Decreasing the spacing to `800` or `1200` requires scaling down the spell coordinates (e.g. by `0.2`) in the hook nodes list calculation, accompanied by adjusting the centering math.
- **Visual Highlighting**: Highlighting and shroud effects are styled inside the nodes using wrapper elements and Tailwind animations, and on the React Flow node styles using only `opacity` and `filter` properties, conforming to AGENTS.md rules.

---

## 5. Verification Method

1. **Verify Missing Spells/Fallback Mode**:
   - Inspect `src/hooks/useSpellTree.ts` mock data to confirm that only `Arcane Weave` spells exist.
   - Run the application in offline mode and view the spell trees; confirm that Blood Mage is not visible.
2. **Verify Spacing Multiplier**:
   - Inspect lines 393 and 440 of `src/hooks/useSpellTree.ts` to locate the `6000` spacing multiplier.
   - Implement the `0.2` scale factor and `1200` spacing multiplier locally, and check the React Flow viewport for node overlap.
3. **Verify Node Styling (No CSS Transform)**:
   - Check `src/components/spell-tree/SpellTreeGraph.tsx` to verify that `processedNodes` does not use `style.transform`.
