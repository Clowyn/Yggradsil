# Plan: Live Data Integration & GM Character Management

## Phase 1: Exploration
- Dispatch `teamwork_preview_explorer` to:
  1. Inspect `src/contexts/CampaignContext.tsx` and identify where and how characters are fetched.
  2. Inspect `src/pages/DashboardPage.tsx` or similar files for dashboard component rendering. Identify hardcoded "Kael the Bold", "14,500 XP", "Half-Elf", "Paladin" data.
  3. Inspect `src/components/gm/GMDashboard.tsx` to find Party and XP tabs, and where `INITIAL_PLAYERS` is defined/used.
  4. Inspect existing characters-related hooks, tables, and functions in Supabase.
  5. Check `src/lib/types.ts` for interfaces like `Character` and relations with `class_categories` etc.
  6. Deliver an exploration handoff.

## Phase 2: Design & Setup
- Read exploration handoff.
- Create `PROJECT.md` at root/orchestrator folder containing milestones, interface contracts, and layout.
- Decompose the implementation into structured milestones.

## Phase 3: Implementation
- Milestone 1: CampaignContext updates (fetching full character relations: class, subclass, race).
- Milestone 2: DashboardPage live data integration (display active character name, level, XP, race, class; fix fallback to Half-Elf Paladin).
- Milestone 3: GM Dashboard Party and XP tabs integration (fetch real characters, create new character, distribute XP, save to Supabase).

## Phase 4: Verification & Audit
- Worker runs build/test checks.
- Reviewer checks code quality, styles, and edge cases.
- Auditor performs integrity and security validation.
