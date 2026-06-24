# Spell Tree Layout & Spacing Testing Report

## 1. Unit Tests Verification
Run command: `node scripts/test-spell-tree.js`
Result: **ALL UNIT TESTS PASSED SUCCESSFULLY**

### Test Cases Summary
- **Test Case 1: Filtering logic (Mage Level 1) passed.** Spells of trees assigned to `mage` and level 1 are visible. `cleric` level 3 tree spells are correctly hidden.
- **Test Case 2: Filtering logic (Level check) passed.** Level 2 Cleric is excluded from `min_level = 3` tree, while Level 3 Cleric is included.
- **Test Case 3: Spell status determination passed.** Correctly resolves `unlocked`, `unlockable` (has enough XP, level met, prerequisites met), and `locked` states.
- **Test Case 4: Recursive path tracking passed.** Correctly traces all ancestors and descendants (active path highlighting on selection).
- **Test Case 5: Cycle safeguarding passed.** Recursion does not crash or loop infinitely when a cyclic dependency exists in prerequisites.
- **Test Case 6: Mock fallback trigger check passed.** DB errors successfully trigger offline mock mode.

---

## 2. Coordinate Spacing & Overlap Analysis
The positioning logic inside `useSpellTree.ts` is verified as follows:

```typescript
const TREE_SPACING = 1200;
const SPELL_SCALE = 0.15;
const SUBCLASS_Y = 200;
```

### Calculated Subclass Tree Offsets:
- **Mage (10 subclasses)**: Active subclass tree roots are placed at:
  `x = -5400, -4200, -3000, -1800, -600, 600, 1800, 3000, 4200, 5400`
  Class-wide tree is placed at `x = 0` (no horizontal offset).
  **Overlap Check**: The nearest subclass trees are at `x = -600` and `x = 600`. The class-wide tree has maximum spell coordinates width of `45px` (e.g. `shield` at `x = 45.0`), yielding `555px` of safe space. No overlaps occur.
  
- **Warrior (12 subclasses)**: Roots are placed at:
  `x = -6600, -5400, -4200, -3000, -1800, -600, 600, 1800, 3000, 4200, 5400, 6600`
  **Overlap Check**: No subclass tree is centered at `x = 0`. No overlaps occur.

- **Tank (10 subclasses)**: Roots are placed at:
  `x = -5400, -4200, -3000, -1800, -600, 600, 1800, 3000, 4200, 5400`
  **Overlap Check**: No overlaps occur.

- **Neutral (7 subclasses)**: Roots are placed at:
  `x = -3600, -2400, -1200, 0, 1200, 2400, 3600`
  **Overlap Check**: Subclass `curious` is placed at `x = 0`. If a class-wide spell tree is assigned to `neutral`, it will overlap with the `curious` subclass tree. (See Layout Vulnerability 1 below).

- **Assassin (8 subclasses)**: Roots are placed at:
  `x = -4200, -3000, -1800, -600, 600, 1800, 3000, 4200`
  **Overlap Check**: No overlaps occur.

- **Marksman (8 subclasses)**: Roots are placed at:
  `x = -4200, -3000, -1800, -600, 600, 1800, 3000, 4200`
  **Overlap Check**: No overlaps occur.

- **Crafting (4 subclasses)**: Roots are placed at:
  `x = -1800, -600, 600, 1800`
  **Overlap Check**: No overlaps occur.

- **Summoner (4 subclasses)**: Roots are placed at:
  `x = -1800, -600, 600, 1800`
  **Overlap Check**: No overlaps occur.

### Layout Vulnerabilities & Stress Test Findings:
1. **Odd Subclass Count Collision**:
   For class categories with an odd number of subclasses (e.g. `neutral` with 7 subclasses), the middle subclass tree is centered at `x = 0`. Any class-wide tree (which has no subclass key and defaults to `x = 0` offset) will collide and overlap with this subclass tree.
2. **Multiple Class-wide Trees Collision**:
   If a class has multiple class-wide trees, all of them will default to `x = 0` horizontal offset, causing them to overlap/merge visually.

---

## 3. Interactions & Visual Effects Verification

### Hover & Click Interactions:
- **Hover on Dimmed Nodes**: Disabled.
  - Scale transition `whileHover` is set to `isDimmed ? undefined : { scale: 1.12 }` (disabled on dimmed).
  - Tap transition `whileTap` is set to `isDimmed ? undefined : { scale: 0.95 }` (disabled on dimmed).
  - Tooltip generation `onMouseEnter` is guarded: `!isDimmed && setShowTooltip(true)`.
  - Cursor is styled as `cursor-not-allowed opacity-30 grayscale` in `SpellNode.tsx:36`.
- **Click on Dimmed Nodes**: Disabled.
  - Clicks are blocked in `SpellTreeGraph.tsx:177`: `if (node.data?.isDimmed) return;`

### Visual Beams/Mists Effects:
- **Divine Light Effect (Active Subclass Tree Root Node)**:
  - Triggered when `isSubclassRoot && isActiveSubclassTree` is true.
  - Renders 4 overlay effects:
    1. Outer soft light beam (`w-[350px]`, `h-[3000px]`, golden linear-gradient).
    2. Pulsing inner glow column (`w-[90px]`, `h-[3000px]`).
    3. Core high-intensity light shaft above the node (`w-[16px]`, `h-[1500px]`).
    4. Ethereal burst radiating at the node center (`w-[180px]`, `h-[180px]`).
- **Dark Mist Effect (Dimmed/Sibling Subclass Tree Root Node)**:
  - Triggered when `isSubclassRoot && isDimmed` is true.
  - Renders a purple/slate radial gradient pulsing mist (`w-[350px]`, `h-[350px]`) centered on the node.
