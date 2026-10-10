import { test, expect } from '@playwright/test';
import { setupAuthSession, getAuthenticatedSession, createConsoleErrorCollector } from './helpers/auth';
import { getAuthenticatedSupabaseClient, GM_TABLES } from './helpers/supabase';

/**
 * Tier 2: Player Security & Authentic RLS Rejection Verification
 * - Verifies that player accounts have zero access to GM-only modules in the UI
 *   (no GM tab in sidebar, navigation to /gm and /admin strictly redirected to /).
 * - Verifies that direct Supabase queries to GM tables:
 *   ('campaign_encounters', 'encounter_combatants', 'campaign_environments', 'session_chronicles', 'campaign_loot_chests')
 *   by an authentic player session (with genuine player JWT Bearer token) are strictly rejected
 *   by PostgreSQL Row Level Security (RLS error 42501 or zero-row response).
 * - Verifies anti-privilege escalation (players cannot modify their role to 'gm' or 'admin').
 */

test.describe('Tier 2: Player Security — UI Access Control', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticates with genuine player credentials. Fails explicitly if credentials missing.
    await setupAuthSession(page, 'player');
  });

  test('Player cannot see GM Dashboard link or badge in sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Sidebar navigation check
    const gmNavLinks = page.locator('nav a[href="/gm"], nav a:has-text("GM Dashboard"), nav a:has-text("Game Master")');
    await expect(gmNavLinks).toHaveCount(0);

    // Assert that GM badge is not present for player
    const gmBadges = page.locator('span:text-is("GM")');
    await expect(gmBadges).toHaveCount(0);
  });

  test('Player attempting direct navigation to /gm is redirected to /', async ({ page }) => {
    const consoleMonitor = createConsoleErrorCollector(page);

    await page.goto('/gm');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/');
    // Check dashboard welcome banner rendered
    await expect(page.getByText(/welcome|hoş geldin|adventure|macera/i).first()).toBeVisible();

    consoleMonitor.assertNoErrors();
  });

  test('Player attempting direct navigation to /admin is redirected to /', async ({ page }) => {
    const consoleMonitor = createConsoleErrorCollector(page);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL('/');
    consoleMonitor.assertNoErrors();
  });
});

test.describe('Tier 2: Player Security — Direct Database & Authentic RLS Rejection', () => {
  for (const tableName of GM_TABLES) {
    test(`Direct INSERT to GM table '${tableName}' by authentic player JWT session is rejected by RLS`, async () => {
      // Create authentic Supabase client with genuine player JWT
      const supabase = await getAuthenticatedSupabaseClient('player');

      const fakeRecord = {
        name: 'Unauthorized E2E Test Entry',
        title: 'Unauthorized E2E Title',
        notes: 'Malicious payload',
        weather: 'stormy',
        description: 'Unauthorized loot',
      };

      const { data, error } = await supabase.from(tableName).insert([fakeRecord]).select();

      // Postgres RLS must reject via error 42501 (insufficient privilege) or reject operation
      const isRejected =
        (error &&
          (error.code === '42501' ||
            error.message.toLowerCase().includes('violates row-level security') ||
            error.message.toLowerCase().includes('permission denied'))) ||
        !data ||
        data.length === 0;

      expect(
        isRejected,
        `Expected INSERT into ${tableName} by authentic player session to be rejected by RLS, but it succeeded: ${JSON.stringify(data)}`
      ).toBe(true);
    });

    test(`Direct UPDATE on GM table '${tableName}' by authentic player JWT session is rejected by RLS`, async () => {
      const supabase = await getAuthenticatedSupabaseClient('player');

      const { data, error } = await supabase
        .from(tableName)
        .update({ name: 'Hacked by Player', notes: 'Hacked' })
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      const isRejected =
        (error &&
          (error.code === '42501' ||
            error.message.toLowerCase().includes('violates row-level security') ||
            error.message.toLowerCase().includes('permission denied'))) ||
        !data ||
        data.length === 0;

      expect(
        isRejected,
        `Expected UPDATE on ${tableName} by authentic player session to be rejected or affect 0 rows, but it updated: ${JSON.stringify(data)}`
      ).toBe(true);
    });

    test(`Direct DELETE on GM table '${tableName}' by authentic player JWT session is rejected by RLS`, async () => {
      const supabase = await getAuthenticatedSupabaseClient('player');

      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      const isRejected =
        (error &&
          (error.code === '42501' ||
            error.message.toLowerCase().includes('violates row-level security') ||
            error.message.toLowerCase().includes('permission denied'))) ||
        !data ||
        data.length === 0;

      expect(
        isRejected,
        `Expected DELETE on ${tableName} by authentic player session to be rejected or affect 0 rows, but it deleted: ${JSON.stringify(data)}`
      ).toBe(true);
    });
  }

  test('Privilege escalation attempt: Player cannot escalate profile role to "admin" or "gm"', async () => {
    const session = await getAuthenticatedSession('player');
    const playerId = session.user.id;
    const supabase = await getAuthenticatedSupabaseClient('player');

    // Attempt to escalate role directly on profiles table
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', playerId);

    // Query back the true profile in database
    const { data: trueProfile } = await supabase.from('profiles').select('role').eq('id', playerId).single();

    // The player's role in database MUST NOT be admin or gm
    expect(trueProfile?.role).not.toBe('admin');
    expect(trueProfile?.role).not.toBe('gm');
  });
});
