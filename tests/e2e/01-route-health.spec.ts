import { test, expect } from '@playwright/test';
import { setupAuthSession, createConsoleErrorCollector } from './helpers/auth';

/**
 * Tier 1: Route Health & Navigation Verification
 * - Opens every route in the app:
 *   ['/', '/dashboard', '/character', '/stat-tree', '/spells', '/inventory', '/map', '/gm', '/admin']
 * - Verifies navigation with both a GM account and a Player account.
 * - Asserts zero uncaught console errors, page exceptions, or unhandled rejections during navigation.
 */

test.describe('Tier 1: Route Health & Console Integrity — GM Account', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthSession(page, 'gm');
  });

  const routes = [
    { path: '/', expectedContent: 'Alcyone', description: 'Dashboard root' },
    { path: '/dashboard', expectedContent: 'Alcyone', description: 'Dashboard alias (redirects to /)' },
    { path: '/character', expectedContent: 'Character', description: 'Character page' },
    { path: '/stat-tree', expectedContent: 'Stat', description: 'Stat / Skill Tree' },
    { path: '/spells', expectedContent: 'Spell', description: 'Spell Tree' },
    { path: '/inventory', expectedContent: 'Inventory', description: 'Inventory Grid' },
    { path: '/map', expectedContent: 'Map', description: 'Battle Map' },
    { path: '/gm', expectedContent: 'Game Master', description: 'GM Dashboard' },
  ];

  for (const route of routes) {
    test(`GM can open ${route.path} (${route.description}) without console errors`, async ({ page }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      // Verify content presence
      await expect(page.getByText(route.expectedContent).first()).toBeVisible({ timeout: 10000 });

      // Verify no uncaught console errors
      consoleMonitor.assertNoErrors();
    });
  }

  test('GM navigation to /admin handles access gracefully with zero console errors', async ({ page }) => {
    const consoleMonitor = createConsoleErrorCollector(page);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Either renders Admin Panel or redirects to / if not role=admin
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
    { path: '/', expectedContent: 'Bob Valor', description: 'Dashboard root' },
    { path: '/dashboard', expectedContent: 'Bob Valor', description: 'Dashboard alias' },
    { path: '/character', expectedContent: 'Character', description: 'Character page' },
    { path: '/stat-tree', expectedContent: 'Stat', description: 'Stat / Skill Tree' },
    { path: '/spells', expectedContent: 'Spell', description: 'Spell Tree' },
    { path: '/inventory', expectedContent: 'Inventory', description: 'Inventory Grid' },
    { path: '/map', expectedContent: 'Map', description: 'Battle Map' },
  ];

  for (const route of playerRoutes) {
    test(`Player can open ${route.path} (${route.description}) without console errors`, async ({ page }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      // Verify user greeting or route content
      await expect(page.getByText(route.expectedContent).first()).toBeVisible({ timeout: 10000 });

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
    await expect(page.getByText('Bob Valor').first()).toBeVisible();

    consoleMonitor.assertNoErrors();
  });

  test('Player accessing /admin is redirected to / without console errors', async ({ page }) => {
    const consoleMonitor = createConsoleErrorCollector(page);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // ProtectedRoute with requireAdmin redirects non-admin players to /
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Bob Valor').first()).toBeVisible();

    consoleMonitor.assertNoErrors();
  });
});
