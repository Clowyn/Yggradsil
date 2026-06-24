## 2026-06-20T01:12:45Z
You are the Layout Bug Fixer subagent. Your task is to resolve compile issues and a cycle crash vulnerability in `src/hooks/useSpellTree.ts` to satisfy type checking and ensure runtime safety.

Please make the following edits:

1. In `src/hooks/useSpellTree.ts`:
   - Locate and delete the unused constant:
     `const SPELL_SCALE = 0.15;` (originally around line 16).
   
   - Locate the helper function `calculateSpellCoordinates` (originally around line 141-260).
     - Change `const X_SPREAD = 90;` to `const X_SPREAD = 130;` to prevent adjacent sibling nodes from overlapping horizontally.
     - Add a cycle tracking mechanism to the `getDepth` recursive function inside `calculateSpellCoordinates` to prevent stack overflow crashes:
       ```typescript
       const visiting = new Set<string>();
       const getDepth = (spellKey: string): number => {
         if (spellKey in depthMap) return depthMap[spellKey];
         if (visiting.has(spellKey)) return 0; // Prevent cycle recursion
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
       ```

   - Locate the `spellNodes` creation inside the `nodes` `useMemo` block (originally around lines 580-660).
     - Replace the outer loop:
       `Object.entries(spellsByTree).forEach(([treeId, spellsInTree]) => {`
       with:
       `Object.values(spellsByTree).forEach((spellsInTree) => {`
       This completely removes the unused `treeId` variable.

2. Run `npx tsc --noEmit` and check that the typescript compilation completes successfully with zero errors.
3. Run `node scripts/test-spell-tree.js` and verify it passes successfully.
4. Report build and test outcomes in your handoff.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
