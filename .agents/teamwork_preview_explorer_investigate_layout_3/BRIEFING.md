# BRIEFING — 2026-06-19T22:06:37Z

## Mission
Design a deterministic coordinate calculation algorithm for subclass spell trees in `src/hooks/useSpellTree.ts` to assign X/Y coordinates based on tiers and prerequisites without crossing or overlapping.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigation: analyze problems, synthesize findings, produce structured reports
- Working directory: d:\DnD\.agents\teamwork_preview_explorer_investigate_layout_3
- Original parent: c3d65076-e695-492e-bef6-454f9eedeb34
- Milestone: layout_investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Code-only network mode (no external network requests)
- Write only to own folder `d:\DnD\.agents\teamwork_preview_explorer_investigate_layout_3`

## Current Parent
- Conversation ID: c3d65076-e695-492e-bef6-454f9eedeb34
- Updated: 2026-06-19T22:08:50Z

## Investigation State
- **Explored paths**:
  - `src/hooks/useSpellTree.ts`
  - `src/lib/types.ts`
  - `src/lib/constants.ts`
  - `spell_schema.sql`
  - `seed.sql`
  - `scripts/spells/blood_mage.json` and 64 other subclass files
- **Key findings**:
  - Spells currently use manual database coordinates scaled by `0.15` and shifted by subclass index.
  - Subclasses have 3 or 4 primary branches (excluding generic branches like `Cross-Branch` or `Grand Ultimate`).
  - Spells within the same branch and tier often form chains of prerequisites (e.g. A -> B -> C), meaning they should be placed vertically by topological depth.
  - Spells with multiple prerequisites can cause overlaps if not spread out.
  - Formulated a 4-step layout algorithm (mapping, topological depth, cell spacing, overlap resolution).
  - Simulated and verified that this algorithm results in exactly **zero overlaps** and stays within $[-510, 510]$ relative coordinate range.
- **Unexplored areas**: None.

## Key Decisions Made
- Chose alphabetical sorting for primary branches to ensure deterministic column assignment.
- Used parent-centered average columns as a sorting key for siblings to minimize edge crossings.

## Artifact Index
- d:\DnD\.agents\teamwork_preview_explorer_investigate_layout_3\handoff.md — Handoff report containing the algorithm design and coordinates model
