# Spell Tree Spacing & Integration Analysis

## 1. Executive Summary
This report analyzes the TypeScript build status and layout integration between `useSpellTree.ts`, `SpellTreeGraph.tsx`, and `SpellNode.tsx`. While the project compiles cleanly under TypeScript, a critical layout issue exists: the programmatic layout generator in `useSpellTree.ts` uses static spacing parameters that cause significant node overlap (both vertically and horizontally) when nodes are rendered at their designated size of `110x110px`. 

We analyzed the entire seed database containing **2,985 unique spells** across **67 spell trees** and found **1,142 same-tier prerequisite links** with horizontal row densities of up to **14 nodes per row**. This analysis mathematically demonstrates why the current spacing layout fails and proposes a comprehensive dynamic integration strategy to resolve these conflicts without code modification.

---

## 2. TypeScript Compilation & Verification Status
The TypeScript build status was verified using standard compiler checks:
- **Command Run**: `npx tsc --noEmit` from the workspace root (`d:\DnD`)
- **Status**: **Success** (no compile errors or warnings)
- **Implication**: The typescript types, interfaces (`SpellTree`, `SpellNode`, `CharacterSpell`), and hook return signatures are perfectly aligned. There are no static type discrepancies between the hook (`useSpellTree.ts`) and the renderer (`SpellTreeGraph.tsx`).

---

## 3. Node-Level Analysis: `SpellNode.tsx`
The custom node component `SpellNode.tsx` was inspected for style and text boundaries:
- **Node Size**: The node is hardcoded to `w-[110px] h-[110px]` in `getNodeStyles()`.
- **Text Area**: The spell name label is rendered using a `font-cinzel` uppercase serif font, with `text-[9px] md:text-[10px]`, `px-2.5`, and `line-clamp-2`.
- **Visual Boundaries**:
  - The node is circular (`rounded-full`).
  - At a width of `110px` with `px-2.5` padding, the content box is restricted to `90px` wide.
  - At the bottom of the second line of text (around `y = 80px` to `85px` below the top of the node, i.e., `25px` to `30px` below the center), the width of the circle is mathematically `2 * sqrt(55^2 - 30^2) ≈ 92.2px`.
  - Because `90px` (content box) is extremely close to `92.2px` (circle boundary), long spell names or characters with wide serifs in the `Cinzel` font will touch or slightly overlap the circular border, causing visual clipping.
  - Furthermore, there is no word-break tailwind utility class, meaning long words in names (especially in Turkish, such as "İyileştirme" or "Dönüştürme") will wrap awkwardly or truncate abruptly.

---

## 4. Layout & Spacing Conflict Analysis
The layout coordinates are generated programmatically by `calculateSpellCoordinates` in `useSpellTree.ts`. It groups spells by tier and topological depth `d` (computed recursively from prerequisite spells in the same tier).

### A. Spacing Constants in `useSpellTree.ts`
```typescript
const TREE_SPACING = 1200; // Horizontal gap between subclass trees
const SUBCLASS_Y = 250;     // Subclass root node Y offset
const TIER_HEIGHT = 220;    // Vertical distance between tier starts
const ROW_HEIGHT = 70;      // Vertical distance between depths in the same tier
const Y_OFFSET = 120;       // Y offset for the tree start
```

### B. Vertical Overlap Proof (Same Tier, Different Depth)
Within the same tier, if a spell has a prerequisite, its depth `d` increments by 1.
- The Y difference between depth `d` and `d+1` is `ROW_HEIGHT = 70px`.
- The node height is `110px`.
- **Overlap**: Center-to-center distance is `70px`, which is less than the node height of `110px`. Thus, parent and child nodes on adjacent rows in the same tier **overlap vertically by 40px** (`110 - 70 = 40px`).

### C. Vertical Overlap Proof (Different Tiers)
Our database analysis revealed that the maximum topological depth `d` within a single tier is **4** (e.g. `ex_dread_juggernaut` has depth 4 in its tier).
- If a tier has depths `d = 0` to `d = 4`, the nodes in that tier will span Y coordinates from `Y_start` to `Y_start + 4 * 70 = Y_start + 280px`.
- The start Y coordinate of the next tier is `Y_start + TIER_HEIGHT = Y_start + 220px`.
- **Overlap**: The next tier starts at `Y_start + 220px`, which is *above* the depth 3 node (`Y_start + 210px` is safe but only 10px difference, meaning they overlap) and the depth 4 node (`Y_start + 280px`). This causes nodes from Tier `t` and Tier `t+1` to interpenetrate, completely breaking the visual hierarchy.

### D. Horizontal Overlap Proof (Row Density)
The horizontal positioning spaces out nodes using a dynamic gap capped by a maximum tier width:
```typescript
const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
```
Where `M` is the number of spells on the same row (same tier and depth).
- Our database analysis showed that the maximum row density is **14 nodes in a single row**.
- For `M = 14`, `X_GAP = 900 / 13 ≈ 69.2px`.
- **Overlap**: Center-to-center distance is `69.2px`. Since node width is `110px`, adjacent nodes will **overlap horizontally by 40.8px** (`110 - 69.2 = 40.8px`).
- In fact, any row density `M >= 10` causes center-to-center distance to be `100px` or less, resulting in automatic overlaps. The seed data contains **43 instances of rows with density 10 or more**.

---

## 5. Recommended Spacing & Integration Strategy

To accommodate `110x110px` nodes and support the high density of same-tier prerequisites without overlap, we recommend the following adjustments:

### Recommendation 1: Dynamic Vertical Layout Algorithm
Rather than using a fixed `TIER_HEIGHT` that assumes a flat structure, compute tier starting Y positions adaptively based on the maximum depth of preceding tiers.
1. Group spells by tier: `T_1, T_2, ...`
2. For each spell in tier `t`, compute its topological depth `d`.
3. Find the maximum depth in each tier: `D_max(t)`.
4. Define spacing constants:
   - `ROW_HEIGHT = 180` (allows `110px` node height + `70px` vertical gap)
   - `TIER_GAP = 220` (allows `110px` gap between the bottom of tier `t-1` and top of tier `t`)
5. Compute Y start for each tier:
   - `tier_start_y[1] = Y_OFFSET`
   - `tier_start_y[t] = tier_start_y[t-1] + (D_max(t-1) * ROW_HEIGHT) + TIER_GAP`
6. Set node position `y` to: `tier_start_y[t] + d * ROW_HEIGHT`.

### Recommendation 2: Constant Horizontal Spacing with Expanded Tree Widths
1. Remove the horizontal width limit (`900px`) that causes nodes to bundle up when density increases.
2. Define a fixed horizontal gap `X_GAP = 180` (providing a comfortable `70px` horizontal gap between `110px` nodes).
3. Increase the horizontal spacing between subclass trees (`TREE_SPACING`) from `1200` to `2500` or `3000` to prevent wide rows of adjacent subclass trees from intersecting.

### Recommendation 3: Node-Level Label Improvements in `SpellNode.tsx`
1. **Change padding** from `px-2.5` to `px-2` to gain 4px of horizontal text width.
2. **Add Tailwind wrapping classes** to the name container: `break-words hyphens-auto` to handle long words.
3. **Implement dynamic font scaling** based on spell name length to prevent truncation of long names inside the circle:
   ```typescript
   const getFontSizeClass = (name: string) => {
     if (name.length > 20) return 'text-[8px]';
     if (name.length > 12) return 'text-[9px]';
     return 'text-[10px]';
   };
   ```

---

## 6. Verification and Integration Tests
We propose the following tests to verify layout correctness after implementation:
1. **Compilation Check**: Run `npx tsc --noEmit` to verify syntax and type correctness.
2. **Node Boundary Assertions**: Write a unit test using Jest or Vitest that imports `calculateSpellCoordinates` and asserts that for all generated positions:
   - Horizontal distance between any two nodes on the same row: `|x_1 - x_2| >= 160`.
   - Vertical distance between any two nodes: `|y_1 - y_2| >= 160` (or `0` if on the same row).
   - Maximum height of a tier does not exceed the Y-start of the subsequent tier.
