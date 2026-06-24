# Handoff Report - Layout Overlap Verification

## 1. Observation

- Executed the user-supplied verification script saved to `d:\DnD\scripts\verify_spells.cjs`:
  - **Command**: `node scripts/verify_spells.cjs`
  - **Output**:
    ```
    Total final overlaps: 0
    Maximum relative X absolute value: 550
    ```
- Executed a secondary stress-testing script at `d:\DnD\scripts\stress_test_layout.cjs` checking for near visual overlaps (horizontal separation `< 150px` on the same Y level):
  - **Command**: `node scripts/stress_test_layout.cjs`
  - **Output snippet**:
    ```json
    [
      {
        "subclass": "drunken_master",
        "y": 560,
        "node1": "dkm_fluid_motion",
        "x1": -150,
        "node2": "dkm_drunken_juggler",
        "x2": -140,
        "dist": 10
      },
      ...
      {
        "subclass": "warlock",
        "y": 780,
        "node1": "wl_hex_mastery",
        "x1": -130,
        "node2": "wl_force_quake",
        "x2": -150,
        "dist": 20
      }
    ]
    Total near-overlaps (< 150px): 1411
    ```

## 2. Logic Chain

1. The provided verification script checks for *exact* overlaps in computed coordinates (i.e. where two nodes share the same `x` and `y` properties).
2. The execution of the provided script on all 64 JSON files resulted in `Total final overlaps: 0`.
3. Therefore, there are no instances of nodes occupying the exact same coordinates.
4. However, the horizontal positioning logic uses:
   - Base column separation of `280` pixels.
   - Horizontal spread within a cell of `(idx - (N - 1)/2) * 130` pixels (a spacing of 130px).
   - Multi-branch columns located at fractional positions (e.g. `col = -0.5` which maps to `x = -140`).
5. When a cell has multiple nodes (e.g. `N = 3`), the leftmost/rightmost nodes are shifted by `±130px` from their column center. This pushes a node in a column at `x = -280` to `x = -150`.
6. Concurrently, a node in a neighboring fractional column (e.g. `x = -140`) on the same Y-level is placed at `x = -140`.
7. This results in a horizontal center-to-center distance of only `10px` (e.g. `dkm_fluid_motion` at `-150` vs `dkm_drunken_juggler` at `-140`).
8. Since React Flow nodes have a visual width much larger than `10px`, these nodes will visually collide and overlap on the screen. There are 1,411 such visual collisions/near-overlaps (`dist < 150px`) across all subclasses.

## 3. Caveats

- We assumed a standard React Flow node width threshold of `150px` to define visual overlaps. If the visual nodes are styled narrower (e.g., `< 10px`), they might not overlap, but in practice, standard text nodes are significantly wider.
- We did not investigate visual overlaps on the Y-axis, as Y positions are cleanly separated by tier (`s.tier`) and depth (`getDepth`), which ensures strict separation.

## 4. Conclusion

The layout script correctly outputs exactly **0 exact coordinate overlaps** for all 64 subclasses. However, it exhibits a critical visual bug: because of cell node shifting and fractional columns, there are **1,411 instances of visual collisions/near-overlaps** where node centers are separated by less than 150px on the same Y level, with the closest pair separated by only 10px in the `drunken_master` subclass.

## 5. Verification Method

To verify these results:
1. Run the exact coordinate check:
   `node scripts/verify_spells.cjs`
2. Run the visual near-overlap check:
   `node scripts/stress_test_layout.cjs`
