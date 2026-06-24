# BRIEFING — 2026-06-19T14:45:35Z

## Mission
Investigate the dashboard page implementation, locate hardcoded demo data, determine active character fetching/mapping to live data, resolve the fallback bug, and write a handoff report.

## 🔒 My Identity
- Archetype: explorer
- Roles: explorer, investigator
- Working directory: D:\DnD\.agents\teamwork_preview_explorer_investigate_2\
- Original parent: c052b2e8-8ac2-4df2-9aa0-1c90460c865d
- Milestone: Dashboard Investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement

## Current Parent
- Conversation ID: c052b2e8-8ac2-4df2-9aa0-1c90460c865d
- Updated: 2026-06-19T14:45:35Z

## Investigation State
- **Explored paths**:
  - `src/pages/DashboardPage.tsx`
  - `src/contexts/CampaignContext.tsx`
  - `src/components/gm/GMDashboard.tsx`
  - `src/components/gm/PlayerManager.tsx`
  - `src/components/gm/XPDistributor.tsx`
  - `src/components/inventory/GMItemManager.tsx`
  - `schema.sql`
- **Key findings**:
  - Hardcoded demo data ("14,500 XP", "Half-Elf", "Paladin") is defined as `DEMO_STATS` in `src/pages/DashboardPage.tsx`.
  - "Kael the Bold" demo player data is defined in `GMDashboard.tsx`, `PlayerManager.tsx`, `XPDistributor.tsx`, and `GMItemManager.tsx`.
  - The fallback bug for newly created characters (like `BRT the Brain Eater / Psycho Mage`) occurs because `DashboardPage.tsx` does not check for the active character and because `CampaignContext.tsx`'s characters query does not join `race_definitions` and `subclass_definitions` relation definitions.
- **Unexplored areas**: None. Investigation complete.

## Key Decisions Made
- Identified the necessary database relationship joins and frontend changes to support dynamic mapping and fallback on the Dashboard.

## Artifact Index
- D:\DnD\.agents\teamwork_preview_explorer_investigate_2\handoff.md — Handoff report for findings and recommendations
