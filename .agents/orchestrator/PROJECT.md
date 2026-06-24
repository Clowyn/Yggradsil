# Project: D&D Spell Tree Player Page Enhancements

## Architecture
- **Data Fetching and Mapping (R1)**:
  - Connect all 3,150 spells in the database to their correct subclass trees.
  - Fix any query or mapping logic in `useSpellTree.ts` to ensure that spells are fetched and associated with the correct subclasses.
  - Setup prerequisites-based edges: tier-1 spells connect to the subclass root, and higher-tier spells connect to their prerequisite spells.
- **Character-Bound Filtering & Selection (R2)**:
  - Read the active character's class category key and subclass key from CampaignContext/AuthContext.
  - Hide all other main class categories. Only show the active character's class and its associated subclasses.
  - Auto-select and highlight the player's assigned subclass tree.
- **Divine Light Effect (R3)**:
  - Implement a dramatic golden beam/glow/radiance from above on the selected subclass tree.
  - Ensure that it looks premium and dark-fantasy.
- **Dark Mist Effect (R4)**:
  - Dim/shroud sibling subclasses belonging to the same main class (but not selected).
  - Disable interactions (click, hover, tooltips) on those dimmed trees.
- **Visual styling constraints**:
  - Never apply CSS transform directly to React Flow nodes.
  - Do not modify GM Dashboard or GMSpellManager.tsx.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Setup & Explore | Explore the codebase, schema, and current behavior. Identify source of disconnected spells and how selection/effects should be implemented. | None | IN_PROGRESS |
| 2 | E2E Testing Suite | Design and implement an opaque-box E2E test suite (Tiers 1-4) covering requirements. | M1 | PLANNED |
| 3 | Spell-to-Subclass Mapping (R1) | Correct spelling query, mapping, and edge generation. Verify all 3,150 spells map properly. | M1 | PLANNED |
| 4 | Auto-Selection & Filtering (R2) | Implement character-bound filtering & auto-selection in `useSpellTree.ts` and `SpellTreeGraph.tsx`. | M3 | PLANNED |
| 5 | Visual Effects (R3, R4) | Add Divine Light & Dark Mist effects. Ensure compliance with CSS transform rules. | M4 | PLANNED |
| 6 | Final E2E Pass & Hardening | Run E2E tests, fix remaining bugs, run Forensic Auditor, and perform Tier 5 hardening. | M2, M5 | PLANNED |

## Interface Contracts
- `useSpellTree` returns nodes, edges, active character info, select/focus methods.
- UI components respect React Flow conventions and use custom classes/wrappers for R3/R4.
