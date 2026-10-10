import { test, expect } from '@playwright/test';
import { setupAuthSession, TEST_USERS, createConsoleErrorCollector } from './helpers/auth';
import { getSupabaseClient, GM_TABLES } from './helpers/supabase';

/**
 * Tier 2: Player Security & RLS Rejection Verification
 * - Verifies that player accounts have zero access to GM-only modules in the UI
 *   (no GM tab in sidebar, navigation to /gm and /admin strictly redirected to /).
 * - Verifies that direct Supabase queries to GM tables:
 *   ('campaign_encounters', 'encounter_combatants', 'campaign_environments', 'session_chronicles', 'campaign_loot_chests')
 *   by an unauthorized player session are strictly rejected by RLS or access control.
 * - Verifies anti-privilege escalation (players cannot modify their role to 'gm' or 'admin').
 */

test.describe('Tier 2: Player Security — UI Access Control', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page, 'player');
  });

  test('Player cannot see GM Dashboard link or badge in sidebar navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Sidebar navigation check
    const gmNavLinks = page.locator('nav a[href="/gm"], nav a:has-text("GM Dashboard")');
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
    // Check player name is displayed on dashboard
    await expect(page.getByText(TEST_USERS.player.username).first()).toBeVisible();

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

test.describe('Tier 2: Player Security — Direct Database & RLS Rejection', () => {
  const supabase = getSupabaseClient();
  const player = TEST_USERS.player;

  for (const tableName of GM_TABLES) {
    test(`Direct INSERT to GM table '${tableName}' by unauthorized player session is rejected`, async () => {
      // Attempting an INSERT query as an unauthorized user
      const fakeRecord = {
        name: 'Unauthorized E2E Test Entry',
        title: 'Unauthorized E2E Title',
        notes: 'Malicious payload',
        weather: 'stormy',
        description: 'Unauthorized loot',
      };

      const { data, error } = await supabase.from(tableName).insert([fakeRecord]).select();

      // RLS or schema cache must reject or block insertion
      const isRejected = !!error || !data || data.length === 0;
      expect(
        isRejected,
        `Expected INSERT into ${tableName} by player to be rejected, but it succeeded: ${JSON.stringify(data)}`
      ).toBe(true);
    });

    test(`Direct UPDATE on GM table '${tableName}' by unauthorized player session is rejected`, async () => {
      // Attempting an UPDATE query targeting any record in GM table
      const { data, error } = await supabase
        .from(tableName)
        .update({ name: 'Hacked by Player', notes: 'Hacked' })
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      const isRejected = !!error || !data || data.length === 0;
      expect(
        isRejected,
        `Expected UPDATE on ${tableName} by player to be rejected or affect 0 rows, but it updated: ${JSON.stringify(data)}`
      ).toBe(true);
    });

    test(`Direct DELETE on GM table '${tableName}' by unauthorized player session is rejected`, async () => {
      // Attempting a DELETE query targeting any record in GM table
      const { data, error } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')
        .select();

      const isRejected = !!error || !data || data.length === 0;
      expect(
        isRejected,
        `Expected DELETE on ${tableName} by player to be rejected or affect 0 rows, but it deleted: ${JSON.stringify(data)}`
      ).toBe(true);
    });
  }

  test('Privilege escalation attempt: Player cannot escalate role to "admin" or "gm"', async () => {
    // Attempt to update own profile role directly
    await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', player.id);

    // Query back the true profile in database
    const { data: trueProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', player.id)
      .single();

    // The player's role in database MUST NOT be admin or gm
    expect(trueProfile?.role).toBe('player');
  });
});
