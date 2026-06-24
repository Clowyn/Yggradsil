# Handoff Report: Spell Tree Layout, Spacing, and Visuals

## 1. Observation

### File Paths and Line Numbers
- **`src/hooks/useSpellTree.ts`**:
  - Spacing multiplier: Lines 393 and 440:
    ```typescript
    const subclassX = (sibIdx - activeSubclasses.length / 2) * 6000;
    ```
  - Mock character data definition: Lines 104–118:
    ```typescript
    const MOCK_CHARACTER = {
      id: 'mock-character-id',
      name: 'Mock Mage',
      level: 5,
      xp_available: 1000,
      subclass: {
        key: 'wizard',
        category: {
          key: 'arcane'
        }
      },
      race: {
        key: 'human'
      }
    };
    ```
  - Mock spells: Lines 15–84 (Contains only 4 basic mock spells, e.g., `magic_missile`, `shield`, `misty_step`, `fireball` - no Blood Mage or subclass-specific spells).
- **`src/components/spell-tree/SpellTreeGraph.tsx`**:
  - Node hover/opacity setting: Lines 120–127:
    ```typescript
    return {
      ...node,
      style: {
        opacity,
        filter,
      },
    };
    ```
  - Click interaction disabling: Line 177:
    ```typescript
    if (node.data?.isDimmed) return; // Prevent clicks on dimmed sibling subclass trees
    ```
- **`src/components/spell-tree/SpellNode.tsx`**:
  - Hover disablement: Lines 70–73:
    ```typescript
    whileHover={isDimmed ? undefined : { scale: 1.12 }}
    whileTap={isDimmed ? undefined : { scale: 0.95 }}
    onMouseEnter={() => !isDimmed && setShowTooltip(true)}
    ```
  - "Divine Light" beam effect (pulsing lines/columns of yellow light): Lines 81–121.
  - "Dark Mist" shroud effect (pulsing dark purple radial gradients): Lines 123–133.
- **`final_seed_v3.sql`**:
  - Spells and Tree assignments: Blood Arts spell tree (`f4de9c34-33e5-43ff-807d-80ddba9561f6`) is inserted, and Blood Mage spells (e.g. `bm_siphoning_spikes` with X offset `-389` to `-2338` for high-tier spells) are populated. However, `subclass_definitions` and `class_categories` are not populated in this seed file.
- **`seed.sql`**:
  - Subclasses insert: Lines 590–605 (Inserts subclass key `'blood_mage'`).

---

## 2. Logic Chain

1. **Subclass Spells (Blood Mage) Omission**:
   - If the application runs in fallback mode (e.g. due to database connection loss, invalid character ID, or table cache cache issues), it uses the mock definitions (`MOCK_CHARACTER`, `MOCK_SPELLS`, `MOCK_SPELL_TREES`).
   - Because `MOCK_CHARACTER` has subclass `'wizard'` under category `'arcane'`, and `MOCK_SPELLS` only contains 4 base spells (none starting with `bm_`), the Blood Mage subclass and spells do not exist in the mock state.
   - If the database is online but `seed.sql` is not run before `final_seed_v3.sql`, the `subclass_definitions` table remains empty. Characters cannot be associated with subclass IDs, causing query failures and triggering fallback mode.

2. **Horizontal Spacing and Overlaps**:
   - The horizontal spacing is calculated by taking `subclassX = (sibIdx - activeSubclasses.length / 2) * multiplier`. The current multiplier is `6000`.
   - The Blood Mage spell tree has local coordinates extending from `x = -2338` to `x = +610` (width of ~3000 units).
   - If we reduce the multiplier to `800` or `1200` without scaling the node X-coordinates, adjacent subclass trees will overlap (since their centers will be only 800–1200 units apart, which is less than their 3000-unit width).
   - Therefore, to decrease horizontal spacing cleanly to `800` or `1200`, the local spell X-coordinates must be scaled down by a factor (e.g. `* 0.15` or `* 0.2`).

3. **Visual Highlights & Interaction Disabling**:
   - The "divine light" beam and "dark mist" shroud effects are successfully bound to root nodes in `SpellNode.tsx` using Tailwind classes, radial/linear gradients, and CSS blurs.
   - Clicks are disabled in `SpellTreeGraph.tsx` by early return when `node.data?.isDimmed` is true.
   - Hover animations, tooltip rendering, and cursor styles are disabled in `SpellNode.tsx` using ternary logic on the `isDimmed` prop.
   - Visual nodes are styled in `SpellTreeGraph.tsx` by setting `style.opacity` and `style.filter`. No `transform` styles are added, preserving React Flow's native positioning transform.

---

## 3. Caveats

- We assumed that the local coordinate layout specified in `final_seed_v3.sql` is intended to be preserved relative to each other (i.e. the tree shape itself is correct, just needs scaling).
- We have not run database migrations or modified any codebase files since this is a read-only Explorer investigation.

---

## 4. Conclusion

- **Missing Subclass Spells**: Caused by running the application in fallback/mock mode (where subclass spells are omitted) or failing to seed `subclass_definitions` before running `final_seed_v3.sql`.
- **Tree Overlaps**: Changing the tree spacing multiplier to `800` or `1200` will cause overlaps unless spell coordinates are compressed. Propose multiplying local spell X-coordinates by `0.15` or `0.2` in `useSpellTree.ts`.
- **Highlight Mechanics**: Properly styled and secured. The code respects the React Flow `transform` rule by applying opacity/grayscale filters on the node style and keeping animations inside the inner wrapper of `SpellNode.tsx`.

---

## 5. Verification Method

To verify these findings:
1. Check `src/hooks/useSpellTree.ts` lines 393 and 440 to confirm the `6000` multiplier is being used.
2. Confirm the lack of `blood_mage` or other subclasses in `MOCK_SPELLS` and `MOCK_CHARACTER` in `src/hooks/useSpellTree.ts`.
3. Verify that running `npm run test` or the local build compiles correctly.

---

## Remaining Work (Handoff to Implementer)

1. **Update Fallback Mock Data**: Add `blood_mage` subclass and sample `bm_` spells to `MOCK_SPELLS` and `MOCK_CHARACTER` in `useSpellTree.ts` so that fallback mode handles subclasses correctly.
2. **Apply Coordinate Scaling**:
   Update `useSpellTree.ts` to multiply local coordinates by a scaling factor and adjust the spacing multiplier to `1200`:
   ```typescript
   // In useSpellTree.ts:
   let spellX = (spell.position?.x || 0) * 0.15;
   ...
   const subclassX = (sibIdx - activeSubclasses.length / 2) * 1200;
   ```
3. **Double-Check CSS Transform Compliance**: Ensure that any new visual effects or hover animations in `SpellNode.tsx` only apply to the inner elements (e.g. `<motion.div className={getNodeStyles()} ...>`) and never modify the outer node element's CSS `transform` directly.
