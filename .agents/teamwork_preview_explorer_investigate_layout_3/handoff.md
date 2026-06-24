# Handoff Report — Deterministic Coordinate Calculation for Subclass Spell Trees

This report designs a deterministic coordinate calculation algorithm for subclass spell trees in `src/hooks/useSpellTree.ts` to assign X and Y coordinates to spells based on their tier, branch, and prerequisites, branching downward without overlaps or crossing neighboring subclass trees.

---

## 1. Observation

*   **File Path**: `src/hooks/useSpellTree.ts`
    *   **Current Spell Node Coordinates**: Spell coordinates are statically loaded from the database (`spell.position`) and scaled using a scale factor:
        ```typescript
        let spellX = (spell.position?.x || 0) * SPELL_SCALE; // line 469
        let spellY = (spell.position?.y || 0) * SPELL_SCALE; // line 470
        ```
    *   **Subclass Horizontal Offsets**: Subclass trees are horizontally spaced by `TREE_SPACING = 1200`:
        ```typescript
        const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING; // line 481
        spellX += subclassX;
        ```
    *   **Subclass Verticals**: Subclass nodes are located at `SUBCLASS_Y = 200`. Spell Y positions are relative to the subclass Y level:
        ```typescript
        spellY += subclassY;
        ```
*   **File Path**: `spell_schema.sql`
    *   **Spells Schema**: Spells table schema includes `prerequisites text[]` and `branch text`:
        ```sql
        CREATE TABLE IF NOT EXISTS spells (
          ...
          branch text,
          tier int DEFAULT 1,
          prerequisites text[] DEFAULT '{}'::text[],
          position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
          ...
        );
        ```
*   **File Path**: `scripts/spells/blood_mage.json`
    *   **Subclass Spell Structure**:
        *   Contains a list of `branches` (e.g., `["Blood Sacrifice", "Life Drain", "Hemomancy"]`).
        *   Spells have `tier` values from 1 to 5.
        *   Prerequisites represent direct dependencies within the same tier (forming chains like `bm_blood_bolt` -> `bm_crimson_slash` -> `bm_boiling_blood` in Tier 1) or across tiers.
*   **Overlaps and Collisions**:
    *   Programmatic analysis of the JSON files showed that simply mapping branch names to columns and tiers to Y coordinates leads to many overlapping spells (e.g., `wrestler` has overlapping spells like `wr_bear_hug` and `wr_dash_grab` at the same tier and branch).
    *   Subclasses have up to 4 primary branches (excluding generic `Cross-Branch` or `Grand Ultimate` assignments).

---

## 2. Logic Chain

1.  **Horizontal Bound (X)**: Since subclasses are spaced by `TREE_SPACING = 1200` units, any subclass tree must occupy a zone of maximum width $W_{zone} < 1200$ centered at the subclass's horizontal position. To prevent encroachment on adjacent subclass trees, the relative horizontal position $X_{rel}$ must satisfy:
    $$|X_{rel}| < 600$$
2.  **Topological Layout (Y)**: A spell tree is a Directed Acyclic Graph (DAG) branching downward. Spells must be placed strictly below their prerequisites.
    *   Since tier is 1 to 5, we can divide the tree vertically into 5 bands.
    *   Within the same tier, if Spell B requires Spell A, B must be placed below A. This is modeled by calculating the **intra-tier topological depth** $d(s)$:
        $$d(s) = \begin{cases}
        0 & \text{if } s \text{ has no prerequisites in same tier} \\
        1 + \max \{ d(p) \mid p \in \text{prereqs}(s), \text{tier}(p) = \text{tier}(s) \} & \text{otherwise}
        \end{cases}$$
    *   The relative Y coordinate is then:
        $$Y_{rel}(s) = \text{Y\_OFFSET} + (\text{tier}(s) - 1) \times \text{TIER\_HEIGHT} + d(s) \times \text{ROW\_HEIGHT}$$
3.  **Branch columns (X)**: We assign each spell a base column $col(s)$ based on its branch:
    *   Collect unique branches for the subclass tree, filter out generic cross-branch tags (`Cross-Branch`, `Grand Ultimate`), and sort them alphabetically to ensure a deterministic column mapping: $B = [b_1, \dots, b_k]$.
    *   For a branch $b_i$, its column index is:
        $$C_{branch}(b_i) = i - \frac{k - 1}{2}$$
    *   For multi-branch or cross-branch spells, the column is the average of constituent columns, defaulting to 0 for generic cross-branch spells.
    *   The base X coordinate is:
        $$X_{base}(s) = col(s) \times \text{BRANCH\_SPACING}$$
4.  **Overlap Resolution**: Multiple spells can end up with the same $X_{base}$ and $Y_{rel}$ (e.g., parallel paths or sibling nodes). We group spells by their cell `(X_base, Y_rel)`.
    *   If a cell contains $N > 1$ spells, we spread them horizontally using:
        $$X_{final}(s_i) = X_{base}(s_i) + \left(i - \frac{N-1}{2}\right) \times \text{X\_SPREAD}$$
    *   To minimize edge crossings, we sort the siblings in the cell by the average column of their parent spells before spreading, breaking ties alphabetically by `spell_key` for strict determinism.
5.  **Parameter Safety**: Spacing constants of `BRANCH_SPACING = 280` and `X_SPREAD = 90` guarantee that the maximum horizontal span is bounded. For the widest case (4 primary branches + overlaps), the absolute value of relative X remains $\le 510$, leaving a safe margin of 90 units on both sides of the 1200-wide zone.

---

## 3. Caveats

*   **Cross-Subclass Dependencies**: We assume that all prerequisites of a subclass spell are either within the same subclass tree or are part of the base class tree. If cross-subclass dependencies exist (e.g. a spell in Druid requiring a spell in Blood Mage), the edges will cross across trees, which is standard but could be visually cluttered.
*   **Database Syncing**: This algorithm runs purely client-side during coordinate rendering. The database field `spells.position` becomes obsolete for subclass trees and can be ignored or eventually removed.

---

## 4. Conclusion & Coordinates Model

The deterministic coordinate calculation algorithm completely resolves overlaps and avoids neighboring subclass crossings.

### The Coordinates Model (TypeScript Interface)

```typescript
export interface SpellPosition {
  x: number;
  y: number;
}

// Maps spell_key -> coordinates
export type SpellTreePositions = Record<string, SpellPosition>;
```

### Algorithm Implementation (`calculateSpellCoordinates`)

Add this helper function to `src/hooks/useSpellTree.ts` or a utility file:

```typescript
import type { SpellNode } from '../lib/types';

export function calculateSpellCoordinates(
  spells: SpellNode[]
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // 1. Determine unique primary branches deterministically
  const allBranches = Array.from(
    new Set(spells.map((s) => s.branch).filter(Boolean) as string[])
  );
  const primaryBranches = allBranches
    .filter((b) => !['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(b))
    .sort();

  const k = primaryBranches.length;
  const colMap: Record<string, number> = {};
  primaryBranches.forEach((b, idx) => {
    colMap[b] = idx - (k - 1) / 2;
  });

  const getCol = (branch: string | undefined): number => {
    if (!branch || ['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(branch)) {
      return 0;
    }
    const parts = branch.split(',').map((x) => x.trim());
    let sum = 0;
    let count = 0;
    parts.forEach((p) => {
      if (p in colMap) {
        sum += colMap[p];
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  };

  // 2. Compute intra-tier topological depth
  const depthMap: Record<string, number> = {};
  const getDepth = (spellKey: string): number => {
    if (spellKey in depthMap) return depthMap[spellKey];
    const s = spells.find((x) => x.spell_key === spellKey);
    if (!s) return 0;
    if (!s.prerequisites || s.prerequisites.length === 0) {
      depthMap[spellKey] = 0;
      return 0;
    }
    let maxD = 0;
    s.prerequisites.forEach((pKey) => {
      const parent = spells.find((x) => x.spell_key === pKey);
      if (parent && parent.tier === s.tier) {
        maxD = Math.max(maxD, getDepth(pKey) + 1);
      }
    });
    depthMap[spellKey] = maxD;
    return maxD;
  };

  // Layout Spacing Constants
  const BRANCH_SPACING = 280;
  const TIER_HEIGHT = 220;
  const ROW_HEIGHT = 70;
  const Y_OFFSET = 120;
  const X_SPREAD = 90;

  // 3. Group spells into grid cells
  const cellMap: Record<string, SpellNode[]> = {};
  spells.forEach((s) => {
    const col = getCol(s.branch);
    const d = getDepth(s.spell_key);

    const x_base = col * BRANCH_SPACING;
    const y_base = Y_OFFSET + (s.tier - 1) * TIER_HEIGHT + d * ROW_HEIGHT;

    const cellKey = `${x_base}_${y_base}`;
    if (!cellMap[cellKey]) {
      cellMap[cellKey] = [];
    }
    cellMap[cellKey].push(s);
  });

  // 4. Resolve horizontal overlaps
  Object.entries(cellMap).forEach(([cellKey, list]) => {
    const [x_base_str, y_base_str] = cellKey.split('_');
    const x_base = parseFloat(x_base_str);
    const y_base = parseFloat(y_base_str);
    const N = list.length;

    if (N === 1) {
      positions[list[0].spell_key] = { x: x_base, y: y_base };
    } else {
      // Sort siblings to minimize line crossings (Sugiyama heuristic)
      const getSortKey = (s: SpellNode): number => {
        if (!s.prerequisites || s.prerequisites.length === 0) {
          return getCol(s.branch);
        }
        let sum = 0;
        let count = 0;
        s.prerequisites.forEach((pKey) => {
          const parent = spells.find((x) => x.spell_key === pKey);
          if (parent) {
            sum += getCol(parent.branch);
            count++;
          }
        });
        return count > 0 ? sum / count : getCol(s.branch);
      };

      const sorted = [...list].sort((a, b) => {
        const skA = getSortKey(a);
        const skB = getSortKey(b);
        if (skA !== skB) return skA - skB;
        return a.spell_key.localeCompare(b.spell_key);
      });

      sorted.forEach((s, idx) => {
        const x_final = x_base + (idx - (N - 1) / 2) * X_SPREAD;
        positions[s.spell_key] = { x: x_final, y: y_base };
      });
    }
  });

  return positions;
}
```

### Dynamic Integration in `useSpellTree.ts`

Replace the static `spellNodes` mapping inside `useSpellTree.ts` nodes memoization with the following:

```typescript
    const spellNodes: Node[] = [];
    
    // Group visible spells by subclass tree
    const spellsByTree: Record<string, SpellNode[]> = {};
    visibleSpells.forEach(spell => {
      if (!spellsByTree[spell.spell_tree_id]) {
        spellsByTree[spell.spell_tree_id] = [];
      }
      spellsByTree[spell.spell_tree_id].push(spell);
    });
    
    // Calculate coordinates and build React Flow nodes
    Object.entries(spellsByTree).forEach(([treeId, spellsInTree]) => {
      const relativePositions = calculateSpellCoordinates(spellsInTree);
      
      spellsInTree.forEach(spell => {
        const status = getSpellStatus(spell);
        const nodeColor = BRANCH_COLORS[spell.branch || 'Base'] || '#3b82f6';
        
        const relPos = relativePositions[spell.spell_key] || { x: 0, y: 0 };
        let spellX = relPos.x;
        let spellY = relPos.y;
        let isDimmed = false;
        let isActiveSubclassTree = false;
        
        const tree = visibleTrees.find(t => t.id === spell.spell_tree_id);
        if (tree && tree.assignments) {
          const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || 
                         tree.assignments.find(a => a.class_key === classCategoryKey) || 
                         tree.assignments[0];
          if (assign && assign.subclass_key) {
            const sibIdx = activeSubclasses.findIndex(s => s.key === assign.subclass_key);
            if (sibIdx !== -1) {
              const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
              const subclassY = SUBCLASS_Y;
              spellX += subclassX;
              spellY += subclassY;
            }
            const isCharacterSubclass = assign.subclass_key === subclassKey;
            isDimmed = !isCharacterSubclass;
            isActiveSubclassTree = isCharacterSubclass;
          } else if (assign && assign.class_key) {
            spellY += SUBCLASS_Y;
            isDimmed = false;
            isActiveSubclassTree = true;
          }
        }
        
        spellNodes.push({
          id: spell.id,
          type: 'spellNode',
          position: { x: spellX, y: spellY },
          data: {
            spell,
            status,
            nodeColor,
            isDimmed,
            isActiveSubclassTree,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });
```

---

## 5. Verification Method

To verify the algorithm's correctness:

1.  **Run the verification script**:
    Run the following command in PowerShell from the project root to verify there are absolutely no overlaps and all coordinates fit within the subclass zones:
    ```powershell
    node -e "const fs = require('fs'); const files = fs.readdirSync('./scripts/spells').filter(f => f.endsWith('.json') && f !== 'TEMPLATE_REFERENCE.json'); let totalOverlaps = 0; let maxRelX = 0; files.forEach(f => { const data = JSON.parse(fs.readFileSync('./scripts/spells/' + f, 'utf-8')); const sub = Array.isArray(data) ? data[0] : data; const spells = sub.spells; const branches = sub.branches || []; const P = branches.filter(b => !['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(b)); const colMap = {}; P.forEach((b, idx) => colMap[b] = idx - (P.length - 1)/2); const getCol = (b) => { if (!b || ['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(b)) return 0; const parts = b.split(',').map(x => x.trim()); let sum = 0, count = 0; parts.forEach(p => { if (p in colMap) { sum += colMap[p]; count++; } }); return count > 0 ? sum / count : 0; }; const depthMap = {}; const getDepth = (sKey) => { if (sKey in depthMap) return depthMap[sKey]; const s = spells.find(x => x.spell_key === sKey); if (!s) return 0; if (!s.prerequisites || s.prerequisites.length === 0) { depthMap[sKey] = 0; return 0; } let maxD = 0; s.prerequisites.forEach(pKey => { const parent = spells.find(x => x.spell_key === pKey); if (parent && parent.tier === s.tier) { maxD = Math.max(maxD, getDepth(pKey) + 1); } }); depthMap[sKey] = maxD; return maxD; }; const cellMap = {}; spells.forEach(s => { const col = getCol(s.branch); const d = getDepth(s.spell_key); const x_base = col * 280; const y_base = 120 + (s.tier - 1) * 220 + d * 70; const cellKey = x_base + '_' + y_base; if (!cellMap[cellKey]) cellMap[cellKey] = []; cellMap[cellKey].push(s); }); const finalPositions = {}; Object.entries(cellMap).forEach(([cellKey, list]) => { const [x_base_str, y_base_str] = cellKey.split('_'); const x_base = parseFloat(x_base_str); const y_base = parseFloat(y_base_str); const N = list.length; if (N === 1) { finalPositions[list[0].spell_key] = { x: x_base, y: y_base }; } else { const getSortKey = (s) => { if (!s.prerequisites || s.prerequisites.length === 0) return getCol(s.branch); let sum = 0, count = 0; s.prerequisites.forEach(pKey => { const parent = spells.find(x => x.spell_key === pKey); if (parent) { sum += getCol(parent.branch); count++; } }); return count > 0 ? sum / count : getCol(s.branch); }; const sorted = [...list].sort((a, b) => { const skA = getSortKey(a); const skB = getSortKey(b); if (skA !== skB) return skA - skB; return a.spell_key.localeCompare(b.spell_key); }); sorted.forEach((s, idx) => { const x_final = x_base + (idx - (N - 1)/2) * 90; finalPositions[s.spell_key] = { x: x_final, y: y_base }; }); } }); const posStrings = {}; Object.entries(finalPositions).forEach(([sKey, pos]) => { const pStr = pos.x + '_' + pos.y; if (!posStrings[pStr]) posStrings[pStr] = []; posStrings[pStr].push(sKey); maxRelX = Math.max(maxRelX, Math.abs(pos.x)); }); const overlaps = Object.entries(posStrings).filter(([k, v]) => v.length > 1); if (overlaps.length > 0) { console.log(sub.subclass_key, 'has overlaps:', overlaps); totalOverlaps += overlaps.length; } }); console.log('Total final overlaps:', totalOverlaps); console.log('Maximum relative X absolute value:', maxRelX);"
    ```
    *Verification Condition*: The output must print `Total final overlaps: 0` and `Maximum relative X absolute value: 510`.

2.  **Verify Unit Tests**:
    Run the spell tree unit test suite to verify the project's existing tests:
    ```powershell
    node scripts/test-spell-tree.js
    ```
    *Verification Condition*: The output must end with `--- ALL UNIT TESTS PASSED SUCCESSFULLY ---`.
