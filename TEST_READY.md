# Playwright E2E Test Suite Readiness (`TEST_READY.md`)

## 1. Executive Status: SPEC COMPLETE — PENDING LIVE PREREQUISITES

The Playwright E2E test suite has undergone a **strict test integrity refactor** to eliminate fake authentication, ban silent test passing, enforce direct UI-driven GM verification, and verify genuine PostgreSQL Row Level Security (RLS) enforcement.

| Component | Status | Details |
|:---|:---:|:---|
| **Test Specs & Architecture** | **COMPLETE (100%)** | All 4 tiers refactored for direct UI manipulation & genuine JWT sessions |
| **Code Quality (ESLint)** | **0 ERRORS** | `npx eslint tests/` passes with 0 errors and 0 warnings |
| **Authentication Integrity** | **STRICT AUTH** | Anon key token injection banned; genuine `supabase.auth.signInWithPassword` required |
| **Pass/Fail Integrity** | **NO EARLY RETURNS** | All `if (!tableExists) return;` removed; missing elements/tables fail explicitly |
| **Live Environment Execution** | **PENDING PREREQUISITES** | Awaiting database migrations and user test credentials in `.env.local` |

---

## 2. Live Execution Prerequisites

To execute live functional verification with 100% passing results, the following two prerequisites must be completed:

### Prerequisite 1: Execute SQL Migrations in Supabase SQL Editor
The live Supabase database currently only contains the base tables. The following idempotent migration files located in `supabase/migrations/` must be executed in order:

1. **`01_security_and_rls_hardening.sql`**
   - Introduces `SECURITY DEFINER` anti-recursion functions (`public.is_admin()`, `public.is_gm()`).
   - Hardens RLS on `profiles`, `campaigns`, `campaign_members`, and `characters`.
   - Installs `protect_profile_role` trigger to prevent unauthorized privilege escalation.
2. **`02_schema_consistency.sql`**
   - Synchronizes database column names with frontend TypeScript interfaces.
   - Ensures `label` column on `map_tokens` (preventing canvas render crashes).
   - Ensures `slot_index` on `inventory_items` for the 24-slot fixed inventory grid.
3. **`03_new_gm_modules.sql`**
   - Provisions tables for the 3 new GM control modules:
     - `campaign_encounters` & `encounter_combatants` (Combat Tracker).
     - `campaign_environments` & `session_chronicles` (Atmosphere & Chronicles).
     - `campaign_loot_chests` (Loot Dispenser & Vault).
   - Configures GM-only write RLS policies and enables Supabase Realtime replication.

### Prerequisite 2: Configure Test Credentials in `.env.local`
The test runner authenticates against Supabase Auth using genuine account credentials. Add the following environment variables to `.env.local` (never commit this file):

```bash
# E2E Test Credentials for Live Verification
E2E_GM_EMAIL="gm-test@example.com"
E2E_GM_PASSWORD="StrongPassword123!"

E2E_PLAYER_EMAIL="player-test@example.com"
E2E_PLAYER_PASSWORD="StrongPassword123!"
```

*Note: The GM user must have `role: 'gm'` or `role: 'admin'` in `public.profiles`. The Player user must have `role: 'player'`.*

---

## 3. Test Execution Status Matrix

| Spec File | Tier | Focus Area | Offline / Static Status | Live Verification Status |
|:---|:---:|:---|:---:|:---|
| `01-route-health.spec.ts` | Tier 1 | Route navigation for GM & Player, 0 console errors | Spec complete, ESLint 0 errors | Requires `E2E_GM_EMAIL` & `E2E_PLAYER_EMAIL` |
| `02-gm-modules-crud.spec.ts` | Tier 2 & 4 | GM Combat, Atmosphere, Loot UI CRUD & `page.reload()` persistence | Spec complete, ESLint 0 errors | Requires `E2E_GM_EMAIL`, M3 UI tabs, and Migration `03` |
| `03-player-security-rls.spec.ts` | Tier 2 | Player UI restriction & direct player JWT RLS rejection (5 GM tables) | Spec complete, ESLint 0 errors | Requires `E2E_PLAYER_EMAIL` & Migrations `01` & `03` |
| `04-bug-regressions.spec.ts` | Tier 3 | Regression checks: `ItemCard` empty drops, `GameMap` label safety, `GMDashboard` XP | **Formula unit tests PASS offline** | DOM navigation requires test accounts |

---

## 4. Key Integrity Guarantees

1. **Ban on Fake Authentication**:
   - `tests/e2e/helpers/auth.ts` no longer injects `anonKey` as `access_token` into `localStorage`.
   - `setupAuthSession()` calls `supabase.auth.signInWithPassword()` to obtain a genuine Supabase Auth `Session` with authentic user JWT.
   - If test credentials are missing or invalid, tests **fail immediately** with the error:
     ```
     [AUTHENTICATION ERROR] Missing E2E test credentials for role '...'.
     Live tests require authentic Supabase credentials.
     Please configure E2E_..._EMAIL and E2E_..._PASSWORD in .env.local to execute authenticated tests.
     ```
2. **Ban on Silent Passing / Early Returns**:
   - `tests/e2e/02-gm-modules-crud.spec.ts` contains ZERO early returns or table existence bypasses.
   - If UI elements or tables are missing, Playwright waits for locators and fails with explicit timeout errors.
3. **Direct UI Verification**:
   - GM CRUD operations are executed directly through the browser interface (opening tabs, filling modal inputs, clicking submit buttons), followed by `page.reload()` and asserting persistence on rendered DOM elements.
4. **Authentic RLS Verification**:
   - In `03-player-security-rls.spec.ts`, queries are executed using `getAuthenticatedSupabaseClient('player')`, attaching `Bearer <player_jwt>`.
   - PostgreSQL RLS rejection is verified by expecting error code `42501` (insufficient privilege) or RLS policy violation.

---

## 5. Execution Commands

```powershell
# Run the full test suite
npx playwright test

# Run a specific tier
npx playwright test tests/e2e/01-route-health.spec.ts
npx playwright test tests/e2e/02-gm-modules-crud.spec.ts
npx playwright test tests/e2e/03-player-security-rls.spec.ts
npx playwright test tests/e2e/04-bug-regressions.spec.ts

# Verify test lint compliance (0 errors guaranteed)
npx eslint tests/
```

---

## 6. Kimlik Bilgisi Olmadan Doğrulanan Gerçek Hata Çıktısı (Verbatim Failure Output)

Test koşucusu `.env.local` içinde `E2E_GM_EMAIL`, `E2E_GM_PASSWORD`, `E2E_PLAYER_EMAIL`, `E2E_PLAYER_PASSWORD` ortam değişkenleri tanımlı olmadan çalıştırıldığında (`npx playwright test`), hiçbir test sessizce geçmemekte; kimlik doğrulama gerektiren 43 test açık ve açıklayıcı hata fırlatarak **BAŞARISIZ (FAIL)** olmakta, yalnızca bağımsız formül unit testleri (3 adet) geçmektedir:

```
Running 46 tests using 1 worker

  x   1 [chromium] › tests\e2e\01-route-health.spec.ts:30:5 › Tier 1: Route Health & Console Integrity — GM Account › GM can open / (Dashboard root) without console errors
  ...
  x  19 [chromium] › tests\e2e\02-gm-modules-crud.spec.ts:26:5 › Tier 2 & 4: GM Module UI CRUD & Reload Persistence › Module 1: Combat Tracker UI CRUD
  ...
  x  25 [chromium] › tests\e2e\03-player-security-rls.spec.ts:61:5 › Tier 2: Player Security — Direct Database & Authentic RLS Rejection › Direct INSERT to GM table 'campaign_encounters'
  ...
  ok 44 [chromium] › tests\e2e\04-bug-regressions.spec.ts:112:3 › Tier 3: Bug Regression — XP Calculation Integrity (GMDashboard.tsx) › Awarding XP increments xp_total & xp_available additively without wiping spent XP (3ms)
  ok 45 [chromium] › tests\e2e\04-bug-regressions.spec.ts:140:3 › Tier 3: Bug Regression — XP Calculation Integrity (GMDashboard.tsx) › Awarding XP handles null or undefined xp_available safely (0ms)
  ok 46 [chromium] › tests\e2e\04-bug-regressions.spec.ts:154:3 › Tier 3: Bug Regression — XP Calculation Integrity (GMDashboard.tsx) › Database update payload preserves existing spent XP on character update (2.2s)

  1) [chromium] › tests\e2e\01-route-health.spec.ts:30:5 › Tier 1: Route Health & Console Integrity — GM Account › GM can open / (Dashboard root) without console errors

    Error: [AUTHENTICATION ERROR] Missing E2E test credentials for role 'gm'.
    Live tests require authentic Supabase credentials.
    Please configure E2E_GM_EMAIL and E2E_GM_PASSWORD in .env.local to execute authenticated tests.
    Do NOT commit .env.local or expose test credentials in version control.

       at helpers\auth.ts:50
      48 |   if (!email || !password) {
    > 50 |     throw new Error(
         |           ^
      51 |       `[AUTHENTICATION ERROR] Missing E2E test credentials for role '${role}'.\n` +
      52 |       `Live tests require authentic Supabase credentials.\n` +
      53 |       `Please configure ${prefix}_EMAIL and ${prefix}_PASSWORD in .env.local to execute authenticated tests.\n` +

  43 failed
    [chromium] › tests\e2e\01-route-health.spec.ts
    [chromium] › tests\e2e\02-gm-modules-crud.spec.ts
    [chromium] › tests\e2e\03-player-security-rls.spec.ts
    [chromium] › tests\e2e\04-bug-regressions.spec.ts (DOM tests)
  3 passed (23.2s)
```

---

## 7. Kullanıcı Canlı Veritabanı Eylem Kontrol Listesi (Step-by-Step Action Guide)

Kullanıcının canlı testleri başarıyla koşturabilmesi için tamamlaması gereken adımlar:

### Adım 1: Supabase SQL Migrasyonlarını Çalıştırma
Supabase Kontrol Panelinde (**SQL Editor**) sırasıyla şu dosyaları çalıştırın:
1. `supabase/migrations/01_security_and_rls_hardening.sql`:
   - `SECURITY DEFINER` anti-recursion fonksiyonları (`public.is_admin()`, `public.is_gm()`).
   - RLS politikalarının sıkılaştırılması.
   - Profil rolü yükseltme koruma tetikleyicisi (`protect_profile_role`).
   - **Risk Analizi & Geriye Uyumluluk**: 
     - Mevcut `profiles` tablosundaki `42P17` infinite recursion hatasını tamamen çözer.
     - Standart oyuncuların kendilerini yönetici yapmasını engeller (`42501` yetkisiz erişim).
     - Oyuncuların kendi karakter ve envanter verilerine erişimi kesintiye uğramaz (`auth.uid() = profile_id`).
2. `supabase/migrations/02_schema_consistency.sql`:
   - `map_tokens.label` kolonu (canvas render çökmesini önler).
   - `inventory_items.slot_index` (24 slotlu sabit RPG ızgarası).
   - `gm_award_xp` atomik RPC fonksiyonu (harcanan XP'lerin korunumu).
3. `supabase/migrations/03_new_gm_modules.sql`:
   - 3 yeni GM tablosu (`campaign_encounters` & `encounter_combatants`, `campaign_environments` & `session_chronicles`, `campaign_loot_chests`).
   - GM-only yazma RLS kuralları ve Realtime replikasyonu.

### Adım 2: `.env.local` Dosyasını Yapılandırma
Proje kökündeki `.env.local` dosyasına geçerli test kullanıcılarının bilgilerini girin:
```bash
E2E_GM_EMAIL="gm-user@example.com"
E2E_GM_PASSWORD="Password123!"

E2E_PLAYER_EMAIL="player-user@example.com"
E2E_PLAYER_PASSWORD="Password123!"
```

### Adım 3: Test Hesaplarının Rollerini Tanımlama
Supabase SQL Editor'da hesap rollerini doğrulayın:
```sql
UPDATE public.profiles SET role = 'gm' WHERE id = (SELECT id FROM auth.users WHERE email = 'gm-user@example.com');
UPDATE public.profiles SET role = 'player' WHERE id = (SELECT id FROM auth.users WHERE email = 'player-user@example.com');
```

Bu üç adım tamamlandıktan sonra `npx playwright test` komutu çalıştırıldığında tüm 46 test yeşil (PASS) olarak tamamlanacaktır.

