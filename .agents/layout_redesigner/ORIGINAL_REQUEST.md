## 2026-06-19T22:09:42Z
You are the Layout Redesigner subagent. Your mission is to implement the D&D Spell Tree layout redesign and move names inside the circle nodes.

Please make the following changes:

1. In `src/hooks/useSpellTree.ts`:
   - Add the following helper function `calculateSpellCoordinates` to deterministically calculate spell coordinates:
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

       // Compute intra-tier topological depth
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

       // Group spells into grid cells
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

       // Resolve horizontal overlaps
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
   - Update constants:
     `const SUBCLASS_Y = 250;`
   - In the `spellNodes` creation inside the `useMemo` of `nodes`, rewrite it to group visible spells by subclass tree, calculate relative positions using the helper function, and position the nodes correctly. The code should look like this:
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

2. In `src/components/spell-tree/SpellNode.tsx`:
   - Change `w-[80px] h-[80px]` in `getNodeStyles()` to `w-[110px] h-[110px]`.
   - Remove the old spell name label div rendered below the motion.div (originally around lines 179-189).
   - Place the name label inside the motion.div below the icon. Add appropriate Tailwind classes:
     ```typescript
     {/* Icon */}
     <span className="text-xl md:text-2xl leading-none mb-1 animate-none" role="img">
       {spell.icon || '🔮'}
     </span>

     {/* Spell name label inside */}
     <div
       className="mt-1 text-[9px] md:text-[10px] font-bold tracking-wide text-center px-2.5 font-cinzel line-clamp-2 max-w-full leading-tight select-none"
       style={{
         color: isDimmed || status === 'locked' ? '#555' : nodeColor,
         textShadow: !isDimmed && status !== 'locked' ? `0 0 8px ${nodeColor}44` : 'none',
       }}
     >
       {name}
     </div>
     ```

3. In `src/components/spell-tree/SpellTreeGraph.tsx`:
   - Change centering offset in `handleNodeClick`:
     `setCenter(node.position.x + 40, node.position.y + 40, ...)` -> `setCenter(node.position.x + 55, node.position.y + 55, ...)`

4. MANDATORY INTEGRITY WARNING:
   DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

5. After editing these files, run `npx tsc --noEmit` and check that the typescript compilation completes successfully. Provide the build output in your handoff report.
