# Spell Tree Layout Redesign Plan

## Objective
Redesign the D&D Spell Tree layout to:
1. Position the Main Class at the top center.
2. Position Subclasses in a horizontal row below the Main Class, evenly spaced.
3. Position Spells vertically downward under their subclass based on their tier, forming a clean tree.
4. Ensure subclass zones do not overlap horizontal bounds.
5. Move names inside the circle nodes legibly (updating `SpellNode.tsx`).
6. Validate everything with build checks (`npx tsc --noEmit`) and runtime dev server startup.

## Steps
1. **Analyze Current Implementation**: Spawn Explorer subagents to review `src/hooks/useSpellTree.ts` and `src/components/spell-tree/SpellNode.tsx` to understand the node-coordinate generation, spacing, scaling, and DOM structure.
2. **Design Positioning Algorithm**: Develop a deterministic layout strategy.
   - Main class: `(centerX, 0)`
   - Subclasses: `(subX, subclassY)` spaced out evenly based on subclass index.
   - Spells: `(subX + spellOffset, spellY)` where `spellY` is proportional to `tier` and `spellOffset` is calculated from the spell's branch structure or branch/position layout within the subclass tree to prevent crossing or overlapping.
3. **Implement Visual Changes**:
   - Update `SpellNode.tsx` to put the labels inside the circle, increase size of circle if needed.
   - Update `useSpellTree.ts` to implement the new layout algorithm.
4. **Review & Test**: Spawn Reviewer and Challenger agents to verify correctness, visual style, and node sizing.
5. **Auditor Gating**: Run Forensic Auditor to ensure no cheating/hardcoding.
