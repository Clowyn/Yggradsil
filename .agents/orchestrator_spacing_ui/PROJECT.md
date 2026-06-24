# Project: Spell Tree Spacing & UI Redesign

## Architecture
- `src/hooks/useSpellTree.ts`: Generates positions, nodes, and edges for class categories, subclasses, and spells.
- `src/components/spell-tree/SpellTreeGraph.tsx`: React Flow container displaying the graph, filters, and legend.
- `src/components/spell-tree/SpellNode.tsx`: Custom React Flow node rendering.

## Code Layout
- `src/hooks/useSpellTree.ts`
- `src/components/spell-tree/SpellTreeGraph.tsx`
- `src/components/spell-tree/SpellNode.tsx`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Planning | Explore layout spacing factors, max-width caps, and the Filter UI setup. | None | PLANNED |
| 2 | Code Modifications | Modify spacing parameters in useSpellTree.ts, modernize & minimize filter in SpellTreeGraph.tsx. | M1 | PLANNED |
| 3 | Verification & Auditing | Run typechecks, verify build, challenger verification, and forensic audit. | M2 | PLANNED |

## Interface Contracts
- Spacing interface remains internal to useSpellTree.ts layout calculation.
- Filter UI toggle and visual styling are internal to SpellTreeGraph.tsx.
