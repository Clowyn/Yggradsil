import { test, expect } from '@playwright/test';
import { setupAuthSession, createConsoleErrorCollector } from './helpers/auth';

/**
 * Tier 1: Route Health & Navigation Verification
 * - Opens every route in the app with authentic GM and Player sessions:
 *   ['/', '/dashboard', '/character', '/stat-tree', '/spells', '/inventory', '/map', '/gm', '/admin']
 * - Verifies navigation with authentic sessions (authenticates via Supabase Auth signInWithPassword).
 * - Fails explicitly with descriptive instructions if E2E credentials are not configured in .env.local.
 * - Asserts zero uncaught console errors, page exceptions, or unhandled rejections during navigation.
 */

test.describe('Tier 1: Route Health & Console Integrity — GM Account', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page, 'gm');
  });

  const routes = [
    { path: '/', expectedPattern: /welcome|hoş geldin|adventure|macera/i, description: 'Dashboard root' },
    { path: '/dashboard', expectedPattern: /welcome|hoş geldin|adventure|macera/i, description: 'Dashboard alias' },
    { path: '/character', expectedPattern: /character|karakter/i, description: 'Character page' },
    { path: '/stat-tree', expectedPattern: /stat|skill|yetenek/i, description: 'Stat / Skill Tree' },
    { path: '/spells', expectedPattern: /spell|büyü/i, description: 'Spell Tree' },
    { path: '/inventory', expectedPattern: /inventory|envanter/i, description: 'Inventory Grid' },
    { path: '/map', expectedPattern: /map|harita/i, description: 'Battle Map' },
    { path: '/gm', expectedPattern: /game master|gm dashboard/i, description: 'GM Dashboard' },
  ];

  for (const route of routes) {
    test(`GM can open ${route.path} (${route.description}) without console errors`, async ({ page }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      // Verify core content rendered
      await expect(page.getByText(route.expectedPattern).first()).toBeVisible({ timeout: 10000 });

      // Verify no uncaught console errors
      consoleMonitor.assertNoErrors();
    });
  }

  test('GM navigation to /admin handles access gracefully with zero console errors', async ({ page }) => {
    const consoleMonitor = createConsoleErrorCollector(page);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Either renders Admin Panel or redirects to / if role is gm but not admin
    const currentUrl = page.url();
    expect(currentUrl.endsWith('/admin') || currentUrl.endsWith('/')).toBeTruthy();

    consoleMonitor.assertNoErrors();
  });
});

test.describe('Tier 1: Route Health & Console Integrity — Player Account', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page, 'player');
  });

  const playerRoutes = [
    { path: '/', expectedPattern: /welcome|hoş geldin|adventure|macera/i, description: 'Dashboard root' },
    { path: '/dashboard', expectedPattern: /welcome|hoş geldin|adventure|macera/i, description: 'Dashboard alias' },
    { path: '/character', expectedPattern: /character|karakter/i, description: 'Character page' },
    { path: '/stat-tree', expectedPattern: /stat|skill|yetenek/i, description: 'Stat / Skill Tree' },
    { path: '/spells', expectedPattern: /spell|büyü/i, description: 'Spell Tree' },
    { path: '/inventory', expectedPattern: /inventory|envanter/i, description: 'Inventory Grid' },
    { path: '/map', expectedPattern: /map|harita/i, description: 'Battle Map' },
  ];

  for (const route of playerRoutes) {
    test(`Player can open ${route.path} (${route.description}) without console errors`, async ({ page }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      // Verify route content is rendered
      await expect(page.getByText(route.expectedPattern).first()).toBeVisible({ timeout: 10000 });

      // Verify no uncaught console errors
      consoleMonitor.assertNoErrors();
    });
  }

  test('Player accessing /gm is redirected to / without console errors', async ({ page }) => {
    const consoleMonitor = createConsoleErrorCollector(page);

    await page.goto('/gm');
    await page.waitForLoadState('domcontentloaded');

    // ProtectedRoute with requireGM redirects non-GM players to /
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/welcome|hoş geldin|adventure|macera/i).first()).toBeVisible();

    consoleMonitor.assertNoErrors();
  });

  test('Player accessing /admin is redirected to / without console errors', async ({ page }) => {
    const consoleMonitor = createConsoleErrorCollector(page);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // ProtectedRoute with requireAdmin redirects non-admin players to /
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/welcome|hoş geldin|adventure|macera/i).first()).toBeVisible();

    consoleMonitor.assertNoErrors();
  });
});
