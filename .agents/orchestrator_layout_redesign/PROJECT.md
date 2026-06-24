# Project: Spell Tree Layout Redesign

## Architecture
This project refactors the layout positioning math in `useSpellTree.ts` and the visual layout of `SpellNode.tsx` in a React 19 + TypeScript + Vite project using `@xyflow/react` (React Flow).
- **Positioning Layout**:
  - The Main Class node must be centered at the top.
  - Subclass nodes must be arranged in a horizontal row below it, evenly spaced.
  - Spells must branch vertically downward under their corresponding subclass. Spells are structured by tier (tier 1 closest to the subclass, tier 5 furthest down).
  - Each subclass's spell tree must occupy its own non-overlapping horizontal zone.
  - Prerequisite edges must flow top-to-bottom and not cross between subclass zones.
- **Node Visualization**:
  - Spell names, subclass names, and class names must be rendered inside the circle nodes.
  - The node circle size must be adjusted to contain both the icon and name text legibly.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Analyze current node positioning logic in `useSpellTree.ts` and label rendering in `SpellNode.tsx`. | None | PLANNED |
| 2 | Layout Redesign | Re-implement node coordinate generation to place main class centered at top, subclasses horizontally, and spells vertically below without overlaps. | M1 | PLANNED |
| 3 | Label Integration | Move labels inside circle nodes in `SpellNode.tsx` and resize circles. | M1 | PLANNED |
| 4 | Verification | Build and run tests to verify layout correctness and integrity. | M2, M3 | PLANNED |
