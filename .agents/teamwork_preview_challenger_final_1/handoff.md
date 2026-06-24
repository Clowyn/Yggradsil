# Handoff Report - Spell Tree Coordinates Overlap & Spacing Tests

## 1. Observation
The following commands and observations were made during the verification process:
- **Test Execution Command**:
  ```powershell
  node scripts/test_overlap_production.cjs
  ```
- **Test Output Summary**:
  ```
  --- LAYOUT TEST SUMMARY ---
  Individual tree overlaps: 0
  Individual tree horizontal spacing violations (< 135px): 0
  Individual tree vertical spacing violations (< 180px): 0

  Combined graph overlaps (across all trees in class categories): 0
  Combined graph horizontal spacing violations (< 135px): 0
  Combined graph vertical spacing violations (< 180px): 240
  Detailed logs written to: D:\DnD\scripts\overlap_results.txt
  ```
- **Combined Graph Vertical Spacing Violation Examples** (from `D:\DnD\scripts\overlap_results.txt`):
  - **Subclass Root to Tier 1 Spell**:
    ```
    [COMBINED SPACING] Vertical spacing violation between Y levels 250 and 370, diff = 120.00px
      Level 250 nodes: subclass_root:druid, subclass_root:dark_mage, subclass_root:elementalist_mage, subclass_root:psychomage, subclass_root:blood_mage, subclass_root:mana_mage, subclass_root:priest, subclass_root:warlock ...
      Level 370 nodes: spell:dr_summon_wolf, spell:dr_shape_cat, spell:dr_entangling_vines, spell:dm_curse_of_weakness, spell:dm_blood_tribute, spell:dm_shadow_bolt, spell:em_gust, spell:em_magic_stone ...
    ```
  - **Inter-Tree Tier Asymmetry**:
    ```
    [COMBINED SPACING] Vertical spacing violation between Y levels 550 and 590, diff = 40.00px
      Level 550 nodes: spell:dr_eagle_eye, ... (tier 1, depth 1 of druid tree)
      Level 590 nodes: spell:om_divination_mind, ... (tier 1, depth 1 of oracle_mage tree)
    ```

## 2. Logic Chain
1. We parsed all 63 production spell tree JSON files in `D:\DnD\scripts\spells` (excluding `TEMPLATE_REFERENCE.json`).
2. We replicated the layout logic from `D:\DnD\src\hooks\useSpellTree.ts` where spell node relative coordinates are calculated by:
   - Dynamic tier starting Y: `tierStartY[tier] = currentY` where `currentY` increments by `(maxDepth * ROW_HEIGHT) + TIER_GAP` (`ROW_HEIGHT = 180`, `TIER_GAP = 220`).
   - Spell Y coordinate: `y = tierStartY[s.tier] + d * ROW_HEIGHT`.
   - Horizontal gap: `X_GAP = Math.max(135, Math.min(180, 1400 / Math.max(M - 1, 1)))`.
3. In isolation, each of the 63 spell trees has **0 overlaps**, **0 horizontal spacing violations (< 135px)**, and **0 vertical spacing violations (< 180px)** between its spell levels.
4. In the combined layout graph:
   - All subclass trees under the same class category are rendered side-by-side, offset by `subclassX = sibIdx * 2500` horizontally.
   - A vertical gap of exactly **120px** exists between the subclass root nodes (at `Y = 250`) and their corresponding Tier 1 spells (at `Y = 370` because `Y_OFFSET = 120`). This is a vertical spacing violation of the `180px` requirement.
   - Side-by-side trees have slightly different dynamic Y levels for corresponding tiers because of varying tree depths (e.g. one tree has depth 1, another has depth 0). This causes vertical spacing checks across different subtrees to report small offsets (like 40px, 60px, 80px), but these are visually harmless due to the `2500px` horizontal separation between subtrees.

## 3. Caveats
- The test relies on the coordinate calculation logic implemented in `useSpellTree.ts` being the true rendering logic.
- Global Y-level differences (e.g. 40px) between different subclasses are flagged as vertical violations by the global vertical spacing test, but they are visually separated by a large horizontal offset of `2500px` and do not cause visual clutter or overlap.

## 4. Conclusion
1. **Overlapping**: Verified that **no overlapping exists on any level** in both individual and combined layouts.
2. **Horizontal Spacing**: Verified that all horizontal node separation is strictly **>= 135px** (ranges from 135px to 180px).
3. **Vertical Spacing**:
   - The vertical spacing of **>= 180px** is fully maintained between spell levels within each individual tree.
   - A **120px** vertical gap exists between the subclass root nodes (`Y = 250`) and the Tier 1 spell nodes (`Y = 370`), which is less than the required `180px` vertical separation.
   - Inter-tree dynamic Y levels result in global Y differences of less than 180px, though this does not impact visual quality because of the `2500px` horizontal spacing.

## 5. Verification Method
To rerun this test, execute:
```powershell
node scripts/test_overlap_production.cjs
```
This script will print the summary of overlaps and violations, and output the detailed log to `scripts/overlap_results.txt`.
