# E2E Test Suite Architecture & Infrastructure Plan (`TEST_INFRA.md`)

## 1. Overview
The D&D Campaign Management web application uses Playwright (`@playwright/test`) for comprehensive, deterministic End-to-End (E2E) functional verification. The test suite exercises both frontend client behavior and backend Supabase Row Level Security (RLS) policies across GM and Player roles.

---

## 2. Test Architecture & Directory Layout

```
d:/DnD/
├── playwright.config.ts          # Playwright test configuration & Vite webServer harness
├── tests/
│   └── e2e/
│       ├── helpers/
│       │   ├── auth.ts           # Session injector & console error monitor
│       │   └── supabase.ts       # Direct Supabase client & GM table contracts
│       ├── 01-route-health.spec.ts         # Tier 1: Route health & zero console errors
│       ├── 02-gm-modules-crud.spec.ts      # Tier 2 & 4: GM modules CRUD & reload persistence
│       ├── 03-player-security-rls.spec.ts   # Tier 2: Player UI security & RLS query rejection
│       └── 04-bug-regressions.spec.ts      # Tier 3: Critical bug regression verifications
├── TEST_INFRA.md                 # Test architecture specification (this document)
└── TEST_READY.md                 # Test suite readiness & execution guide
```

---

## 3. Authentication & Session Strategy

### The Challenge
Public Supabase auth endpoints apply strict IP and domain rate limiting (`email rate limit exceeded`), causing test suites that sign up new accounts on every run to become flaky or blocked.

### The Solution: Deterministic Pre-authenticated Session Injection
Instead of creating ephemeral users through HTTP signup calls, `tests/e2e/helpers/auth.ts` uses Playwright's `page.addInitScript()` to inject a validated Supabase session into `window.localStorage` under the project-specific key `sb-<ref>-auth-token` before the application script executes.
- **GM Account**:
  - Profile ID: `092418bf-d638-4329-ac49-7404e442c85b`
  - Username: `Alcyone`
  - Database Role: `'gm'`
- **Player Account**:
  - Profile ID: `b86cd534-eb67-46fa-9ad0-6c5e63d4ae42`
  - Username: `Bob Valor`
  - Database Role: `'player'`

This guarantees sub-second, 100% deterministic authentication without network latency or external rate limits.

---

## 4. Coverage Matrix by Tier

### Tier 1: Route Health & Zero Console Errors (`01-route-health.spec.ts`)
- **Routes Covered**: `/`, `/dashboard`, `/character`, `/stat-tree`, `/spells`, `/inventory`, `/map`, `/gm`, `/admin`.
- **GM Verification**: Opens every route and asserts that core DOM containers render properly.
- **Player Verification**:
  - Permitted routes (`/`, `/dashboard`, `/character`, `/stat-tree`, `/spells`, `/inventory`, `/map`) open and render player data.
  - Restricted routes (`/gm`, `/admin`) trigger `ProtectedRoute` and redirect to `/`.
- **Integrity Assertion**: A dedicated `ConsoleErrorCollector` monitors `page.on('console')` and `page.on('pageerror')`, asserting `0` uncaught runtime errors during every navigation.

### Tier 2 & 4: GM Module CRUD & Reload Persistence (`02-gm-modules-crud.spec.ts`)
- **Module 1 (Combat Tracker)**:
  - `campaign_encounters`: Creates encounter (`name`, `status`, `round`, `notes`).
  - `encounter_combatants`: Adds combatant (`name`, `initiative`, `hp_current`, `hp_max`, `ac`, `is_npc`).
  - Updates status to `active` and advances round to `2`.
  - Executes `page.reload()` and asserts that updated status and round persist.
  - Cleans up / deletes test record.
- **Module 2 (Atmosphere & Session Chronicle)**:
  - `session_chronicles`: Creates chronicle entry (`session_number`, `title`, `summary`, `is_published`, `gm_secrets`).
  - Updates chronicle summary.
  - Executes `page.reload()` and asserts persistence.
  - Cleans up / deletes test record.
- **Module 3 (Loot Dispenser)**:
  - `campaign_loot_chests`: Creates chest entry (`name`, `gold_amount`, `description`, `items`).
  - Updates chest state (`is_looted: true`, modifies gold amount).
  - Executes `page.reload()` and asserts persistence.
  - Cleans up / deletes test record.
- **Progressive Testability**: Handles migration pipelines cleanly via schema inspection so tests execute reliably across all implementation milestones.

### Tier 2: Player Security & RLS Rejection (`03-player-security-rls.spec.ts`)
- **UI Access Control**:
  - Asserts that player sessions do not render any GM navigation links or GM badges in `Sidebar.tsx`.
  - Asserts that navigating to `/gm` immediately redirects to `/`.
  - Asserts that navigating to `/admin` immediately redirects to `/`.
- **Database & RLS Rejection**:
  - Exercises direct queries against all 5 GM tables (`campaign_encounters`, `encounter_combatants`, `campaign_environments`, `session_chronicles`, `campaign_loot_chests`).
  - Asserts that `INSERT`, `UPDATE`, and `DELETE` queries by an unauthorized player session are strictly rejected by PostgreSQL RLS.
- **Anti-Privilege Escalation**:
  - Simulates a player attempting `UPDATE profiles SET role = 'admin'` or `'gm'`.
  - Re-queries the true database record and asserts the role remains strictly `'player'`.

### Tier 3: Bug Regression Suite (`04-bug-regressions.spec.ts`)
- **Bug 1 (`ItemCard.tsx`)**:
  - Verifies that empty inventory slots are active drop targets with `setNodeRef` attached and do NOT have `disabled` or `aria-disabled="true"`.
  - Verifies that dragging items over empty slots executes safely without sortable crashes.
- **Bug 2 (`GameMap.tsx`)**:
  - Verifies that tokens without a `label` property render safely on the Canvas using fallback initials (`'T'`) without triggering `TypeError: Cannot read properties of undefined (reading 'split')`.
- **Bug 3 (`GMDashboard.tsx`)**:
  - Verifies the XP distribution formula: when awarding XP to a character with spent XP, `xp_total` and `xp_available` increment additively without resetting `xp_available` to `newXp` or wiping spent XP balance.

---

## 5. Execution & CI Command
To run the full test suite locally or in CI:

```powershell
npx playwright test
```

To run with UI or debug mode:

```powershell
npx playwright test --ui
```
