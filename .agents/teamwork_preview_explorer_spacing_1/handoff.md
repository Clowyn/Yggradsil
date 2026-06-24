# Handoff Report: Layout Spacing Analysis

## 1. Observation

Direct observations from the codebase files:

- **`D:\DnD\src\hooks\useSpellTree.ts`**:
  - Line 15 defines the horizontal spacing constant between subclass trees:
    ```typescript
    15: const TREE_SPACING = 1200;
    ```
  - Line 258 defines the horizontal node spacing calculation:
    ```typescript
    258:     const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
    ```
  - Line 260 centers and places the nodes horizontally based on `X_GAP`:
    ```typescript
    260:       const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
    ```

- **`D:\DnD\src\components\spell-tree\SpellNode.tsx`**:
  - Line 32 defines the fixed dimensions of the SpellNode:
    ```typescript
    32:       border-2 w-[110px] h-[110px]
    ```
  - Line 70 defines the hover scale action (12% increase in scale):
    ```typescript
    70:         whileHover={isDimmed ? undefined : { scale: 1.12 }}
    ```

---

## 2. Logic Chain

1. **Step 1 (Node footprint):** From `SpellNode.tsx:32`, each node has a resting width of $110\text{px}$. Under hover (`SpellNode.tsx:70`), it scales to $110\text{px} \times 1.12 = 123.2\text{px}$.
2. **Step 2 (Ideal spacing):** From `useSpellTree.ts:258`, when the number of nodes at a horizontal level $M$ is small ($\le 7$), `X_GAP` is $150\text{px}$. The resting edge-to-edge distance is $150 - 110 = 40\text{px}$, which prevents overlapping.
3. **Step 3 (Compression due to Cap):** From `useSpellTree.ts:258`, as $M$ increases, the gap is capped by $\frac{900}{M - 1}\text{px}$. If $M \ge 10$, then `X_GAP` becomes $\le 100\text{px}$.
4. **Step 4 (Overlap occurrence):** When `X_GAP` ($\le 100\text{px}$) is smaller than the node width ($110\text{px}$), the nodes overlap. For $M = 10$, the overlap is $10\text{px}$ at rest and $23.2\text{px}$ when hovered. For larger $M$, the overlap is even more severe.
5. **Step 5 (Inter-tree collision):** If the max width cap ($900\text{px}$) is increased to allow wider levels (e.g. $1400\text{px}$), the tree can extend up to $700\text{px}$ to the left/right of its center. Since `TREE_SPACING` is $1200\text{px}$, adjacent subclass tree nodes will collide (max extension $700\text{px} + 700\text{px} = 1400\text{px} > 1200\text{px}$). Therefore, `TREE_SPACING` must be increased as well.

---

## 3. Caveats

No caveats. All aspects of the layout logic have been traced and analyzed directly from source.

---

## 4. Conclusion

To resolve node overlapping and clipping, we recommend the following modifications:

1. **Relax Tree Spacing:** Increase `TREE_SPACING` from `1200` to `1800` in `useSpellTree.ts`.
2. **Adjust Spacing Calculations:**
   - Increase `IDEAL_GAP` from `150` to `180`.
   - Relax `MAX_WIDTH_CAP` from `900` to `1400`.
   - Implement `MIN_GAP = 135` (guarding against node overlaps, including hover scaling).
3. **Replace the X_GAP logic in `calculateSpellCoordinates`:**
   ```typescript
   const IDEAL_GAP = 180;
   const MAX_WIDTH_CAP = 1400;
   const MIN_GAP = 135;
   
   const X_GAP = Math.max(
     MIN_GAP,
     Math.min(IDEAL_GAP, MAX_WIDTH_CAP / Math.max(M - 1, 1))
   );
   ```

---

## 5. Verification Method

- **Static analysis and code compilation:** Run `npm run build` or `npm run lint` to verify that there are no syntax or type errors in the proposed typescript code.
- **Visual verification:** Open the Spell Tree dashboard in the application and inspect levels that have multiple nodes (e.g., $M \ge 10$). Verify that the minimum edge-to-edge separation is at least $25\text{px}$ at rest, and that adjacent subclass trees do not overlap.
- **Invalidation Condition:** Changes to the `SpellNode` width in CSS/Tailwind (e.g., changing `w-[110px]` to a larger size) will invalidate this `MIN_GAP` threshold.
