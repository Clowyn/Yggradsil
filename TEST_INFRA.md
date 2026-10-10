# E2E Test Suite Architecture & Infrastructure Specification (`TEST_INFRA.md`)

## 1. Overview
The D&D Campaign Management web application uses Playwright (`@playwright/test`) for comprehensive, transparent End-to-End (E2E) functional verification. The test suite exercises both frontend client behavior across GM and Player roles and backend Supabase Row Level Security (RLS) policies using authentic JWT authentication.

---

## 2. Directory Layout

```
d:/DnD/
├── playwright.config.ts                    # Playwright runner configuration & Vite dev harness
├── tests/
│   └── e2e/
│       ├── helpers/
│       │   ├── auth.ts                     # Authentic login, JWT injection & console error collector
│       │   └── supabase.ts                 # Direct authenticated Supabase clients & table contracts
│       ├── 01-route-health.spec.ts         # Tier 1: Authenticated route navigation & 0 console errors
│       ├── 02-gm-modules-crud.spec.ts      # Tier 2 & 4: UI-driven GM module CRUD & reload persistence
│       ├── 03-player-security-rls.spec.ts   # Tier 2: Player UI restrictions & authentic JWT RLS rejection
│       └── 04-bug-regressions.spec.ts      # Tier 3: Bug regression verifications
├── TEST_INFRA.md                           # Test architecture & infrastructure (this document)
└── TEST_READY.md                           # Test readiness, prerequisites & execution guide
```

---

## 3. Authentication & Session Strategy

### The Flaw in Legacy Test Setups
Previous implementations injected the `anonKey` as `access_token` into browser `localStorage`, bypassing actual authentication. As a result:
- Player RLS rejection tests passed due to anonymity rather than the `player` role.
- GM write tests never validated actual GM authorization.
- Tests silently returned early if tables were missing, giving a false sense of completion.

### The Authentic Authentication Architecture
1. **Real Credential Sourcing**:
   - Environment variables `E2E_GM_EMAIL`, `E2E_GM_PASSWORD`, `E2E_PLAYER_EMAIL`, and `E2E_PLAYER_PASSWORD` are loaded from `process.env` or `.env.local`.
   - If missing, tests **explicitly throw an `[AUTHENTICATION ERROR]`** explaining that test credentials must be configured. They never forge dummy tokens or silently pass.
2. **Authentic Token Acquisition**:
   - `getAuthenticatedSession(role)` calls `supabase.auth.signInWithPassword({ email, password })`.
   - Supabase Auth returns a genuine `Session` containing cryptographic JWT `access_token` and `refresh_token` signed by Supabase.
   - An in-memory cache preserves sessions across test cases during a run to prevent triggering auth rate limits.
3. **Deterministic Browser Injection**:
   - `setupAuthSession(page, role)` injects the authentic `Session` into `window.localStorage` under `sb-${projectRef}-auth-token` using `page.addInitScript()`.
   - On initial page load, `AuthContext.tsx` reads this valid session, queries `profiles` with the authentic JWT, and sets `user`, `profile`, and role state.

---

## 4. Coverage Matrix by Tier

### Tier 1: Route Health & Zero Console Errors (`01-route-health.spec.ts`)
- **Routes Covered**: `/`, `/dashboard`, `/character`, `/stat-tree`, `/spells`, `/inventory`, `/map`, `/gm`, `/admin`.
- **GM Verification**: Navigates to every route with an authentic GM session, asserting page elements render and zero uncaught runtime errors occur.
- **Player Verification**:
  - Permitted routes render player content.
  - Restricted routes (`/gm`, `/admin`) trigger `ProtectedRoute` and redirect to `/`.
- **Integrity Assertion**: `ConsoleErrorCollector` monitors `page.on('console')` and `page.on('pageerror')`, verifying 0 unhandled exceptions.

### Tier 2 & 4: GM Module UI CRUD & Reload Persistence (`02-gm-modules-crud.spec.ts`)
- **Strict UI-Driven Verification**:
  - All operations interact directly with the DOM in `GMDashboard.tsx` (opening tabs, filling modal inputs, clicking submit buttons).
  - Verifies data updates on the page, calls `page.reload()`, and verifies persistence on the reloaded page.
- **Module 1 (Combat & Initiative Tracker)**:
  - Creates encounter via UI modal (`[data-testid="encounter-name-input"]`).
  - Adds combatant via UI modal (`[data-testid="add-combatant-btn"]`).
  - Advances round via UI button (`[data-testid="next-round-btn"]`).
  - Reloads and asserts persistence in DOM.
  - Cleans up encounter.
- **Module 2 (Atmosphere & Session Chronicle)**:
  - Creates chronicle via UI modal (`[data-testid="create-session-btn"]`, `[data-testid="session-title-input"]`).
  - Adjusts environment settings via UI trigger.
  - Reloads and asserts chronicle persistence.
- **Module 3 (Loot Dispenser & Vault)**:
  - Creates loot chest via UI modal (`[data-testid="create-chest-btn"]`, `[data-testid="chest-name-input"]`).
  - Reloads and asserts chest persistence.
- **No Early Returns**: All `if (!tableExists) return;` statements have been completely removed. If tabs or inputs are missing, tests fail explicitly.

### Tier 2: Player Security & Authentic RLS Rejection (`03-player-security-rls.spec.ts`)
- **UI Restrictions**:
  - Asserts that player sessions do not render GM links or badges in the sidebar.
  - Asserts that navigation to `/gm` or `/admin` redirects to `/`.
- **Authentic Database RLS Rejection**:
  - Obtains `getAuthenticatedSupabaseClient('player')` with real player JWT in `Authorization: Bearer <token>`.
  - Executes `INSERT`, `UPDATE`, and `DELETE` queries against all 5 GM tables (`campaign_encounters`, `encounter_combatants`, `campaign_environments`, `session_chronicles`, `campaign_loot_chests`).
  - Asserts that queries are rejected by PostgreSQL with code `42501` (insufficient privilege) or RLS policy violation.
- **Privilege Escalation Protection**:
  - Player attempts `UPDATE profiles SET role = 'admin' WHERE id = player.id`.
  - Asserts that query is rejected or that database profile role remains strictly `'player'`.

### Tier 3: Bug Regression Suite (`04-bug-regressions.spec.ts`)
- **Bug 1 (`ItemCard.tsx`)**:
  - Verifies empty inventory slots are active drop targets without `disabled` or `aria-disabled="true"`.
- **Bug 2 (`GameMap.tsx`)**:
  - Verifies canvas renders safely when tokens lack `label`, using fallback logic without throwing `TypeError`.
- **Bug 3 (`GMDashboard.tsx`)**:
  - Verifies the XP distribution formula: awarding XP increments `xp_total` and `xp_available` additively without wiping spent XP balance.

---

## 5. Execution Prerequisites & Commands

### Prerequisites
1. Run migrations in Supabase SQL Editor:
   - `supabase/migrations/01_security_and_rls_hardening.sql`
   - `supabase/migrations/02_schema_consistency.sql`
   - `supabase/migrations/03_new_gm_modules.sql`
2. Configure `.env.local`:
   ```bash
   E2E_GM_EMAIL="..."
   E2E_GM_PASSWORD="..."
   E2E_PLAYER_EMAIL="..."
   E2E_PLAYER_PASSWORD="..."
   ```

### Running Tests
```powershell
# Run all tests
npx playwright test

# Run with Playwright UI inspector
npx playwright test --ui

# Verify test linting (0 errors)
npx eslint tests/
```
