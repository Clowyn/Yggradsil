import { test, expect } from '@playwright/test';
import { setupAuthSession, createConsoleErrorCollector } from './helpers/auth';

/**
 * Tier 1: Route Health & Navigation Verification
 * - Opens every route in the app with authentic GM and Player sessions:
 *   ['/', '/dashboard', '/character', '/stat-tree', '/spells', '/inventory', '/map', '/arena', '/gm',
 *    '/admin', '/admin/users', '/admin/characters', '/admin/campaigns', '/admin/items', '/admin/logs']
 * - Verifies navigation with authentic sessions (authenticates via Supabase Auth signInWithPassword).
 * - Fails explicitly with descriptive instructions if E2E credentials are not configured in .env.local.
 * - Asserts zero uncaught console errors, page exceptions, or unhandled rejections during navigation.
 */

const ADMIN_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/characters',
  '/admin/campaigns',
  '/admin/items',
  '/admin/logs',
];

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
    { path: '/arena', expectedPattern: /arena|lobby|lobi|karşılaşma|combatants|savaşçı/i, description: 'Combat Arena (4v4)' },
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

  for (const adminPath of ADMIN_ROUTES) {
    test(`GM navigation to ${adminPath} handles access gracefully with zero console errors`, async ({ page }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto(adminPath);
      await page.waitForLoadState('domcontentloaded');

      // Either renders Admin Panel route (if account has admin role) or redirects to / (if role is gm only)
      const currentUrl = page.url();
      expect(currentUrl.endsWith(adminPath) || currentUrl.endsWith('/')).toBeTruthy();

      consoleMonitor.assertNoErrors();
    });
  }
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
    { path: '/arena', expectedPattern: /arena|lobby|lobi|karşılaşma|combatants|savaşçı/i, description: 'Combat Arena (4v4)' },
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

  for (const adminPath of ADMIN_ROUTES) {
    test(`Player accessing ${adminPath} is redirected to / without console errors`, async ({ page }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto(adminPath);
      await page.waitForLoadState('domcontentloaded');

      // ProtectedRoute with requireAdmin redirects non-admin players to /
      await expect(page).toHaveURL('/');
      await expect(page.getByText(/welcome|hoş geldin|adventure|macera/i).first()).toBeVisible();

      consoleMonitor.assertNoErrors();
    });
  }
});
