# Layout Spacing Analysis

## Summary of Findings
The horizontal spacing in the spell tree is determined by a base node gap of `150px` which is dynamically compressed by a maximum tree width cap of `900px` when the number of nodes at a single depth level exceeds 7. Because the custom `SpellNode` component has a fixed width of `110px` (and scales to `123.2px` on hover), any level containing 10 or more nodes results in center-to-center spacing of `100px` or less, causing direct overlapping and clipping.

---

## 1. Horizontal Gap Variables & Spacing Determination

### Intra-Tree Node Spacing (`X_GAP`)
Within a single spell tree, nodes are grouped by their computed vertical (`Y`) coordinate level (determined by tier and topological depth). Spacing between nodes on each horizontal level is calculated inside the helper function `calculateSpellCoordinates` (lines 140–266 of `useSpellTree.ts`):

```typescript
// Line 258: Dynamic gap calculation
const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
```

Where:
- **`M`**: Represents `levelSpells.length`, which is the total number of spell nodes residing on that specific horizontal level.
- **`150`**: The default ideal horizontal gap (in pixels) between node centers.
- **`900`**: The maximum width constraint (cap) in pixels allocated for the nodes on a single level of a tree.

The horizontal coordinate `x` for each node is then assigned sequentially, centering the level around `x = 0` (lines 259–262):

```typescript
sortedSpells.forEach((s, idx) => {
  const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
  positions[s.spell_key] = { x, y };
});
```

### Inter-Tree Subclass Spacing (`TREE_SPACING`)
At the top level of the file, the spacing between different subclass tree roots is defined by a constant (line 15):

```typescript
const TREE_SPACING = 1200;
```

This variable dictates the horizontal offset applied to entire subclass trees. For active subclasses, their root nodes and all descendant spell nodes are offset horizontally based on their index in the active subclasses list (lines 559–560):

```typescript
const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
```

---

## 2. Max Width Cap for a Tree

### Enforced Location
The maximum width cap is hardcoded and enforced at **line 258** of `src/hooks/useSpellTree.ts` as part of the `X_GAP` calculation:
```typescript
const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
```

### Derivation & Mathematical Proof of Overlapping
The width of a single tree at any horizontal level is given by:
$$\text{Width} = (M - 1) \times X\_GAP$$

Substituting the definition of $X\_GAP$:
$$\text{Width} = (M - 1) \times \min\left(150, \frac{900}{M - 1}\right)$$
$$\text{Width} \le (M - 1) \times \frac{900}{M - 1} = 900\text{px}$$

Thus, the overall horizontal boundary of a tree's level is capped at exactly **`900px`** (stretching from `-450px` to `+450px` relative to its subclass center).

#### The Overlap Threshold:
1. **`SpellNode` Visual Footprint:**
   As defined in `src/components/spell-tree/SpellNode.tsx` (line 32), each spell node has a fixed width:
   `w-[110px]` ($110\text{px}$).
   Additionally, on hover, the node scales up by a factor of `1.12` (line 70), resulting in a temporary visual width of $123.2\text{px}$.

2. **Scaling of the Gap:**
   - **For $M \le 7$:**
     $X\_GAP = \min(150, 900 / 6) = 150\text{px}$.
     The edge-to-edge gap is $150\text{px} - 110\text{px} = 40\text{px}$ (or $26.8\text{px}$ when hovered). Nodes are spaced correctly.
   - **For $M = 8$:**
     $X\_GAP = \min(150, 900 / 7) \approx 128.6\text{px}$.
     Edge-to-edge gap is $128.6 - 110 = 18.6\text{px}$.
   - **For $M = 9$:**
     $X\_GAP = \min(150, 900 / 8) = 112.5\text{px}$.
     Edge-to-edge gap is $112.5 - 110 = 2.5\text{px}$.
   - **For $M \ge 10$:**
     $X\_GAP = \min(150, 900 / 9) = 100\text{px}$.
     Because the center-to-center distance ($100\text{px}$) is smaller than the node width ($110\text{px}$), the nodes overlap by $10\text{px}$ at rest, and by $23.2\text{px}$ when hovered.
   - **For $M = 12$:**
     $X\_GAP = \min(150, 900 / 11) \approx 81.8\text{px}$.
     Nodes overlap by $\approx 28.2\text{px}$ at rest.

---

## 3. Recommended Code Modifications

To resolve overlapping and clipping issues, the layout constants must be increased, and a minimum spacing safeguard should be introduced. Furthermore, increasing a tree's maximum width cap requires a proportional increase in `TREE_SPACING` to prevent adjacent subclass trees from colliding.

### Recommended Constants & Calculations:
1. **Increase Ideal Gap (`IDEAL_GAP`)**: Set the target gap to `180px` or `200px` to give nodes more room to breath (especially when hovered).
2. **Relax Max Width Cap (`MAX_WIDTH_CAP`)**: Set the max width limit to `1400px` or `1600px` to support dense spell trees.
3. **Enforce Minimum Gap (`MIN_GAP`)**: Enforce a lower bound of `130px` (or `140px` to account for hover states) so that under no circumstances can nodes overlap, even if the total width exceeds the cap.
4. **Scale Tree Spacing (`TREE_SPACING`)**: Increase `TREE_SPACING` to `1800px` to prevent subclass trees from overlapping horizontally.

### Proposed Code Changes

#### Section A: Update Tree Spacing Constant
In `src/hooks/useSpellTree.ts`, modify the top spacing constant:

```typescript
// BEFORE (Line 15):
const TREE_SPACING = 1200;

// AFTER:
const TREE_SPACING = 1800; // Increased to prevent adjacent subclass trees from overlapping
```

#### Section B: Update Coordinate Calculation Logic
Modify `calculateSpellCoordinates` to use the relaxed width, larger ideal gap, and minimum gap safeguard:

```typescript
// BEFORE (Lines 257-258):
    // Space out nodes horizontally centering at 0
    // Use 150px gap between nodes. If there are many nodes, cap horizontal width to 900px
    const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));

// AFTER:
    // Space out nodes horizontally centering at 0
    // Ideal gap is 180px. Max width cap is relaxed to 1400px.
    // Enforce a minimum gap of 135px to prevent node overlapping (nodes are 110px wide, 123px on hover)
    const IDEAL_GAP = 180;
    const MAX_WIDTH_CAP = 1400;
    const MIN_GAP = 135;
    
    const X_GAP = Math.max(
      MIN_GAP,
      Math.min(IDEAL_GAP, MAX_WIDTH_CAP / Math.max(M - 1, 1))
    );
```
