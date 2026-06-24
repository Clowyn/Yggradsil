# Plan - D&D Spell Tree Layout, Spacing, and Visuals

This plan covers resolving the layout spacing, missing subclass spells (e.g. Blood Mage), and implementing visual highlights (divine light & dark mist).

## Phase 1: Investigation
- Spawn a read-only Explorer subagent to:
  1. Inspect `src/hooks/useSpellTree.ts` to identify why subclass spells (specifically Blood Mage) are missing or not mapping.
  2. Inspect the database/seed data relationships or class/subclass key assignments.
  3. Inspect the spacing logic in `useSpellTree.ts` and the `x` coordinates multiplier.
  4. Inspect the React Flow node/edge styling in `src/components/spell-tree/SpellTreeGraph.tsx`, `SpellNode.tsx`, and `SpellEdge.tsx`.
  5. Identify how to implement "divine light" beam effect on the selected tree and "dark mist" on the non-selected sibling trees without violating the "no CSS transform on nodes" rule.
- Verify Explorer results and document findings.

## Phase 2: Implementation
- Spawn a Worker subagent to:
  1. Implement any database query fixes or data mapping adjustments in `useSpellTree.ts` to display all subclass spells (including Blood Mage) under their respective trees.
  2. Decrease the tree horizontal spacing multiplier (e.g., from `6000` to `800` or `1200`) in `useSpellTree.ts`.
  3. Implement the "divine light" beam of golden light on the selected subclass tree.
  4. Implement the "dark mist" / dim shadow effect on non-selected sibling subclass trees, disabling their click/hover interactions.
  5. Run local builds/tests to verify compilation and runtime behavior.
- Worker will document the exact files modified and build/test outputs.

## Phase 3: Review & Verification
- Spawn Reviewer(s) to verify:
  - Correctness of styling implementation (no CSS `transform` on React Flow nodes).
  - Proper data visualization (all spells visible and correctly connected).
  - Spacing adjustments are correct and trees do not overlap.
  - Active character's subclass is correctly focused with visual effects.
- Spawn Forensic Auditor to verify integrity and ensure no cheat/mock implementation exists.
- Review and compile final report.
