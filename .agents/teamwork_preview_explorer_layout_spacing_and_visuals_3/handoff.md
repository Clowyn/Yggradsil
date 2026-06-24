# Handoff Report: Layout, Spacing, and Visual highlights for Spell Trees

## 1. Observation
* **Mock data structures in `useSpellTree.ts`**:
  * Line 15: `const MOCK_SPELLS: SpellNode[] = [ ... ]`
  * Line 86: `const MOCK_SPELL_TREES: SpellTree[] = [ ... ]`
  * Line 104: `const MOCK_CHARACTER = { ... subclass: { key: 'wizard', category: { key: 'arcane' } } }`
  These structures only contain the Arcane Weave mock tree and wizard/arcane definitions. There are no definitions or spells for the `blood_mage` subclass.
* **Database seed data**:
  * `seed.sql` line 593: `INSERT INTO subclass_definitions ... VALUES (..., 'blood_mage', ...)`
  * `final_seed_v3.sql` line 83: `INSERT INTO spell_tree_assignments (id, spell_tree_id, class_key, subclass_key, min_level) VALUES ('aebac13a-7f7d-4b3b-991d-c5c6296845ce', 'f4de9c34-33e5-43ff-807d-80ddba9561f6', 'mage', 'blood_mage', 1);`
  * `final_seed_v3.sql` lines 397-442: `INSERT INTO spells ...` for tree `f4de9c34-33e5-43ff-807d-80ddba9561f6` (e.g. `bm_blood_bolt`, `bm_sacrifice_pact`, etc.).
* **Tree visibility filtering**:
  * `useSpellTree.ts` lines 240-266:
    ```typescript
    return spellTrees.filter(tree => {
      if (!tree.assignments || tree.assignments.length === 0) return true;
      return tree.assignments.some(assign => {
        if (effectiveCharacter.level < (assign.min_level ?? 1)) return false;
        if (assign.class_key && classCategoryKey !== assign.class_key) return false;
        if (assign.race_key && raceKey !== assign.race_key) return false;
        return true;
      });
    });
    ```
    This code does not check `assign.subclass_key` against `effectiveCharacter.subclass?.key`. If `subclass` is null (e.g. level 1-2 character), `classCategoryKey` is undefined, causing all class trees to be filtered out.
* **Layout Spacing**:
  * `useSpellTree.ts` line 393 and 440:
    ```typescript
    const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
    ```
  * Pre-authored spell coordinates in `final_seed_v3.sql` range from `x: -2338` to `x: 2121`.
* **Visual Effects**:
  * `SpellNode.tsx` lines 81-121 renders a multi-layered radial/linear gradient light beam for `isActiveSubclassTree`.
  * `SpellNode.tsx` lines 124-133 renders a purple radial gradient for `isDimmed`.
  * `SpellTreeGraph.tsx` line 177: `if (node.data?.isDimmed) return;` prevents clicks on dimmed nodes.
  * `SpellTreeGraph.tsx` line 120-127 sets `opacity` and `filter` in the React Flow node `style` without utilizing CSS `transform`.

---

## 2. Logic Chain
1. **Subclass Spells Mapping**:
   * *Observation*: Mock data structures in `useSpellTree.ts` completely lack Blood Mage entries. Database seeds (`seed.sql` and `final_seed_v3.sql`) correctly map the `blood_mage` subclass to the `Blood Arts` tree and spells.
   * *Inference*: In offline/mock mode, Blood Mage spells will never be mapped or shown. In database mode, they are loaded but the `visibleTrees` filter does not check `assign.subclass_key`.
   * *Inference*: Because subclass key is not checked in the filter, all subclass trees belonging to the category `mage` are visible to any mage character, but sibling subclass trees are dimmed.
   * *Conclusion*: To fix missing/unmapped spells, subclass spells must be added to the mock data. Also, to ensure proper subclass-specific filtering, `visibleTrees` filter should check `assign.subclass_key` if defined.
2. **Horizontal Spacing**:
   * *Observation*: The horizontal spacing gap multiplier is hardcoded to `6000` because the pre-authored spell coordinates in the database span over `4500px` in width.
   * *Inference*: Decreasing the gap to `800` or `1200` directly will cause overlaps between sibling subclass trees.
   * *Conclusion*: By scaling down the relative spell X coordinates (e.g. by `SPELL_X_SCALE = 0.15`), the total width of a single tree shrinks to `~670px`. This fits perfectly inside an `800` or `1200` horizontal gap without overlaps.
3. **Visual Highlights**:
   * *Observation*: Layered gradients for "divine light" and "dark mist" are implemented inside the node component `SpellNode.tsx`. Clicks and hovers are disabled for dimmed nodes. Opacity and filter are set on the node style in `SpellTreeGraph.tsx` without directly setting `transform`.
   * *Conclusion*: The current visual highlights are structurally compliant with the React Flow node styling rule (avoiding `transform` on the outer node). We can enhance the "dark mist" look using a purplish grayscale filter on dimmed nodes.

---

## 3. Caveats
* We assumed that the pre-authored X/Y positions in the database should not be changed directly, and that scaling them dynamically in `useSpellTree.ts` is the preferred approach.
* Database initialization script execution order was not fully investigated. If `final_seed_v3.sql` is not fully applied to the database, Blood Mage spells will not load online.
* Pre-existing compilation errors in `GMDashboard.tsx` prevent the project from building successfully. These errors are unrelated to our spell tree files.

---

## 4. Conclusion
1. **Blood Mage Spells Mapping**: Modify `useSpellTree.ts` mock variables to include `blood_mage` subclass, `Blood Arts` tree, and mock spells so they render in offline mode. For online mode, ensure `visibleTrees` filter checks `assign.subclass_key === subclassKey` when subclass assignments exist.
2. **Horizontal Spacing**: Add `HORIZONTAL_TREE_GAP = 1200` and `SPELL_X_SCALE = 0.15` to `useSpellTree.ts`, and scale the relative coordinates of spell nodes before placing them in the graph.
3. **Visual Highlights**: The current beam ("divine light") and shroud ("dark mist") implementations in `SpellNode.tsx` and `SpellTreeGraph.tsx` are fully functional, interactive-disabled, and compliant with React Flow node styling constraints.

---

## 5. Verification Method
* **Files to Inspect**:
  * `src/hooks/useSpellTree.ts`
  * `src/components/spell-tree/SpellNode.tsx`
  * `src/components/spell-tree/SpellTreeGraph.tsx`
* **Suggested Patch / Code Changes**:
  See the proposed diff patch in the accompanying `analysis.md` file.
* **Verification Command**:
  * Run `npm run dev` to launch the development server and verify the layout visually in the browser.
  * Check that no typescript errors exist in the modified files.
