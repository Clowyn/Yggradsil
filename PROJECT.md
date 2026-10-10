# Project: D&D Campaign Management Web App — End-to-End Audit, Revamp & Expansion

## Architecture
The application is a full-featured D&D campaign-management web platform built on React 19, TypeScript, Vite, Tailwind CSS v4, React Flow (@xyflow/react), Framer Motion, and Supabase.
- **Frontend Core**: React 19 + TypeScript with strict ESLint compliance, React Router DOM, dark-fantasy RPG aesthetic (Abyss, Void, Obsidian, Royal Gold, Crimson, Parchment, glassmorphic panels, Cinzel & Inter typography).
- **Database & Security**: PostgreSQL via Supabase with Row Level Security (RLS) hardened using `SECURITY DEFINER` helper functions (`public.is_admin()`, `public.is_gm()`, `public.protect_profile_role()`) ensuring anti-recursion compliance (no 42P17 errors).
- **GM Dashboard & Modules**: Multi-tab GM interface restricted at UI and DB levels. Includes persistent GM Combat & Initiative Tracker, GM Atmosphere & Session Chronicle, and GM Loot & Inventory Dispenser.
- **Player Experience**: Interactive Character Sheet & Level-Up system, 24-slot fixed RPG inventory with slot-swap DND, persistent Battle Map with Fog-of-War and token synchronization, 63-subclass Spell Tree (3,150 spells) with visible-element culling, and Dice Roller.
- **Dual-Track Testing**: Playwright E2E automation exercising GM/Player authentication, route availability, CRUD persistence across reloads, RLS rejection for unauthorized player queries, and bug regression.

## Feature Inventory
Every feature from the Survey phase and user requirements is inventoried here with its assigned milestone.
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1 Comprehensive Audit Report | Detailed Turkish markdown audit of all 15 architectural/logical gaps and broken functions with file:line, evidence, and fix plans | M1 | Survey (Explorer 1 & 2) |
| 2 | R2 Feature Research Report | Detailed Turkish markdown research on candidate features, value/cost matrix, dependencies, and prioritization | M1 | Survey (Explorer 3) |
| 3 | R3 Optimization Report (Baseline) | Detailed Turkish markdown optimization report with baseline production bundle measurements (1,070 kB JS, 116 kB CSS) and load analysis | M1 | Survey (Explorer 3) |
| 4 | R4 UI Revamp Plan | Detailed Turkish markdown plan for modernizing UI, responsive mobile drawer, and preserving dark-fantasy aesthetic | M1 | Survey (Explorer 3) |
| 5 | R6 Database Security Migrations | Idempotent SQL migrations for anti-recursion RLS (`is_gm()`), profile protection trigger, `map_tokens.label`, `inventory_items.slot_index`, and GM tables | M1 | Survey (Explorer 2) |
| 6 | Lint & TypeScript Cleanup | Eliminate all 63 ESLint errors and warnings (`react-hooks/set-state-in-effect`, `any` types, unused vars) | M2 | Survey (Explorer 1) |
| 7 | Inventory Drop Target Fix | Comply with AGENTS.md Rule 2: Remove `disabled: !item` from `ItemCard.tsx` so empty slots are valid drop targets | M2 | Survey (Explorer 1) |
| 8 | Map Token Crash & Hardcoded GM Fix | Add `token.label` fallback in `GameMap.tsx` and wire `useMap.ts` to authenticated user's actual GM status (`useAuth().isGM`) | M2 | Survey (Explorer 1 & 2) |
| 9 | GMDashboard XP Exploit Fix | Correct `xp_available` calculation in `GMDashboard.tsx` so awarding XP does not wipe spent XP and reset `xp_available` to `newXp` | M2 | Survey (Explorer 2) |
| 10 | React Flow Filter Cleanups | Comply with AGENTS.md Rule 5.3: Remove `grayscale` filters from `SkillNode.tsx` and `SpellNode.tsx`, rely on compositor opacity | M2 | Survey (Explorer 1) |
| 11 | Character Sheet View | Provide full Character Sheet view for active character on `/character` instead of forcing creation wizard | M2 | Survey (Explorer 1) |
| 12 | GM Combat & Initiative Tracker | R5 Module 1: GM encounter creator, combatant list with auto/manual initiative, HP modifiers, status effects, and Realtime sync | M3 | Survey (Explorer 2) |
| 13 | GM Atmosphere & Session Chronicle | R5 Module 2: Weather, time of day, ambient audio presets, public session notes and secret GM notes with Supabase persistence | M3 | Survey (Explorer 2) |
| 14 | GM Loot & Inventory Dispenser | R5 Module 3: Chest loot generation, persistent item distribution to characters' 24-slot inventories | M3 | Survey (Explorer 2) |
| 15 | Query & Memory Optimization | Filter 3,150 spells by active tree on fetch (`useSpellTree.ts`), isolate Framer Motion in layout, measure before/after bundle | M4 | Survey (Explorer 3) |
| 16 | UI Revamp & Responsive Mobile Drawer | Responsive mobile drawer overlay, Header hamburger toggle, gold accent refinement, glassmorphism enhancements, Dashboard Spell Tree card | M5 | Survey (Explorer 3) |
| 17 | Desktop & Mobile Screenshots | Capture before/after screenshots of main routes (Dashboard, Spells, Inventory, Map, GM) at desktop (1280px) and mobile (375px) | M5 | Survey (Explorer 3) |
| 18 | Playwright E2E Suite (Tiers 1-4) | Opaque-box automated tests: route health, GM CRUD persistence, Player RLS rejection, bug regressions | E2E Track | ORIGINAL_REQUEST |
| 19 | Independent UI Review | Review before/after screenshots against 5-point rubric (theme, nav, features, hierarchy, mobile) | M6 | ORIGINAL_REQUEST |
| 20 | Final Integrity Audit & Verification | Forensic verification of zero hardcoded facade logic, clean RLS, 0 build/lint errors, 100% E2E tests pass | M6 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Suite | Playwright test harness, GM/Player route tests, GM CRUD persistence tests, RLS rejection tests, bug regression tests | None | IN_PROGRESS |
| M1 | Documentation & Database Migrations | Generate R1, R2, R3 (baseline), R4 reports in Turkish markdown. Write idempotent SQL migrations in `supabase/migrations/` | None | COMPLETED |
| M2 | Codebase Bug Fixes & Linting | Fix 63 ESLint errors, fix Inventory drop target, fix Map token label & GM hardcode, fix XP exploit, remove React Flow grayscale, add Character Sheet | M1 | COMPLETED |
| M3 | R5 New GM Control Modules | Implement GM Combat Tracker, GM Atmosphere & Chronicle, GM Loot Dispenser in GM Dashboard with Supabase persistence | M1, M2 | PLANNED |
| M4 | Performance Optimization (R3) | Optimize spell fetching, streamline layout bundle, measure before/after bundle size and initial load, finalize R3 report | M2, M3 | PLANNED |
| M5 | UI Revamp & Visual Polish (R4) | Responsive mobile drawer, Header hamburger, gold details, glass panels, Dashboard card, capture desktop/mobile screenshots | M2, M3, M4 | PLANNED |
| M6 | Final Verification, UI Review & Audit | Run 100% E2E tests, independent UI screenshot review, forensic integrity audit, git checkpoints | E2E, M1-M5 | PLANNED |

## Interface Contracts
### Supabase RLS Helper Functions
- `public.is_admin() -> boolean` (SECURITY DEFINER, SET search_path = public STABLE)
- `public.is_gm() -> boolean` (SECURITY DEFINER, SET search_path = public STABLE)
- `public.protect_profile_role() -> trigger` (blocks non-admin role mutation)

### R5 GM Tables
- `campaign_encounters`: `(id, campaign_id, name, status, round, active_combatant_id, notes, created_at, updated_at)`
- `encounter_combatants`: `(id, encounter_id, character_id, name, initiative, hp_current, hp_max, hp_temp, ac, is_npc, is_hidden, conditions, sort_order)`
- `campaign_environments`: `(id, campaign_id, weather, time_of_day, ambient_preset, danger_level, updated_at)`
- `session_chronicles`: `(id, campaign_id, session_number, title, summary, in_game_date, is_published, gm_secrets, created_at)`
- `campaign_loot_chests`: `(id, campaign_id, name, description, is_looted, gold_amount, items, created_at)`

## Code Layout
- Reports: `R1_AUDIT_REPORT.md`, `R2_FEATURE_RESEARCH.md`, `R3_PERFORMANCE_AUDIT.md`, `R4_UI_REVAMP_PLAN.md` in repo root.
- Migrations: `supabase/migrations/` (or root sql migrations applied to DB).
- Components:
  - GM: `src/components/gm/` (`GMCombatTracker.tsx`, `GMAtmosphereManager.tsx`, `GMLootDispenser.tsx`, `GMDashboard.tsx`)
  - Character: `src/components/character/` (`CharacterSheet.tsx`, `CharacterCreation.tsx`)
  - Inventory: `src/components/inventory/` (`InventoryGrid.tsx`, `ItemCard.tsx`)
  - Layout: `src/components/layout/` (`Sidebar.tsx`, `Header.tsx`, `AppLayout.tsx`)
  - Spells: `src/components/spell-tree/` (`SpellNode.tsx`, `SpellEdge.tsx`, `SpellTreeGraph.tsx`)
  - Tests: `tests/e2e/` (Playwright test specs)
