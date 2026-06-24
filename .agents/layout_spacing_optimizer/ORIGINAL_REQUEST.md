## 2026-06-20T01:15:17Z
You are the Layout Spacing Optimizer subagent. Your mission is to implement a robust, level-based horizontal spacing algorithm in `src/hooks/useSpellTree.ts` to completely eliminate both exact coordinate overlaps and visual near-overlaps between spell nodes.

Please make the following changes:

1. In `src/hooks/useSpellTree.ts`:
   - Replace the `calculateSpellCoordinates` helper function with the following level-grouped spacing algorithm:
     ```typescript
     function calculateSpellCoordinates(
       spells: SpellNode[]
     ): Record<string, { x: number; y: number }> {
       const positions: Record<string, { x: number; y: number }> = {};

       // Determine unique primary branches deterministically
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

       // Compute intra-tier topological depth with cycle detection
       const depthMap: Record<string, number> = {};
       const visiting = new Set<string>();

       const getDepth = (spellKey: string): number => {
         if (spellKey in depthMap) return depthMap[spellKey];
         if (visiting.has(spellKey)) return 0;
         visiting.add(spellKey);

         const s = spells.find((x) => x.spell_key === spellKey);
         if (!s) {
           visiting.delete(spellKey);
           return 0;
         }
         if (!s.prerequisites || s.prerequisites.length === 0) {
           visiting.delete(spellKey);
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
         visiting.delete(spellKey);
         depthMap[spellKey] = maxD;
         return maxD;
       };

       // Layout Spacing Constants
       const TIER_HEIGHT = 220;
       const ROW_HEIGHT = 70;
       const Y_OFFSET = 120;

       // Group spells by their Y coordinate level
       const levelsMap: Record<number, SpellNode[]> = {};
       spells.forEach((s) => {
         const d = getDepth(s.spell_key);
         const y = Y_OFFSET + (s.tier - 1) * TIER_HEIGHT + d * ROW_HEIGHT;

         if (!levelsMap[y]) {
           levelsMap[y] = [];
         }
         levelsMap[y].push(s);
       });

       // Position spells on each Y level horizontally, sorted by column
       Object.entries(levelsMap).forEach(([yStr, levelSpells]) => {
         const y = parseFloat(yStr);
         const M = levelSpells.length;

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

         const sortedSpells = [...levelSpells].sort((a, b) => {
           const colA = getCol(a.branch);
           const colB = getCol(b.branch);
           if (colA !== colB) return colA - colB;

           const skA = getSortKey(a);
           const skB = getSortKey(b);
           if (skA !== skB) return skA - skB;

           return a.spell_key.localeCompare(b.spell_key);
         });

         // Space out nodes horizontally centering at 0
         // Use 150px gap between nodes. If there are many nodes, cap horizontal width to 900px
         const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
         sortedSpells.forEach((s, idx) => {
           const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
           positions[s.spell_key] = { x, y };
         });
       });

       return positions;
     }
     ```

2. After making this change, execute:
   - `npx tsc --noEmit` to verify zero compiler errors.
   - `node scripts/test-spell-tree.js` to verify unit tests pass.
   - `node scripts/verify_spells.cjs` to check coordinate overlaps.
   - `node scripts/stress_test_layout.cjs` to check for visual/near overlaps.

Provide the exact commands run and their output in your handoff report.
