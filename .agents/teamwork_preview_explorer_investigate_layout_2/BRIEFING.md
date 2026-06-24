# BRIEFING — 2026-06-20T22:15:00Z

## Mission
Analyze node rendering in SpellNode.tsx and recommend changes to move text labels inside the circle node alongside the icon.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigator
- Working directory: d:\DnD\.agents\teamwork_preview_explorer_investigate_layout_2
- Original parent: 9af5a7d0-a6e5-4e4b-a4a7-b6ae785b0900
- Milestone: spell-node-layout-analysis

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Never apply CSS transform styles directly to React Flow nodes.
- Save report to d:\DnD\.agents\teamwork_preview_explorer_investigate_layout_2\handoff.md.

## Current Parent
- Conversation ID: 9af5a7d0-a6e5-4e4b-a4a7-b6ae785b0900
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/components/spell-tree/SpellNode.tsx` — Custom React Flow node component (investigated styles, dimensions, text placements, effects).
  - `src/components/spell-tree/SpellTreeGraph.tsx` — React Flow graph structure (viewport centering, node/edge styles).
  - `src/hooks/useSpellTree.ts` — Layout hooks, coordinate scaling, spacing calculations.
  - `scripts/aggregate_spells.py` — Database seed coordinate generation logic.
- **Key findings**:
  - SpellNode currently uses `w-[80px] h-[80px]` for circle styling and an absolute positioned sibling div (`-bottom-7`) for the spell/class/subclass label.
  - Moving the label inside requires increasing the node size (to e.g., `110x110px`) to prevent overflow and maintain readability (with line-clamp-2).
  - Increasing the node size requires updating the viewport centering offset in `SpellTreeGraph.tsx` from `+40` to `+55`.
  - Spacing in the spell tree is heavily dependent on `SPELL_SCALE` (currently `0.15`) and `TREE_SPACING` (currently `1200`). To prevent overlap, `SPELL_SCALE` must be increased to `0.5` and `TREE_SPACING` to `2400+`.
- **Unexplored areas**:
  - The live DB values of spell coordinates (only mock and seed generation script analyzed).

## Key Decisions Made
- Recommended moving text inside using Tailwind's flex-col layout and `line-clamp-2` with `px-2.5` horizontal padding.
- Recommended scaling up node size to `110x110px`.
- Recommended scaling up `SPELL_SCALE` to `0.5` and `TREE_SPACING` to `3000` to prevent overlapping nodes in the flow.

## Artifact Index
- d:\DnD\.agents\teamwork_preview_explorer_investigate_layout_2\handoff.md — Analysis and recommendation report
