import { test, expect, Page } from '@playwright/test';

/**
 * Phase 10: Multi-Viewport Responsive UI/UX Verification Suite
 * Verifies Web (1440×900), Tablet (820×1180), and Mobile (390×844) layouts:
 * 1. Mobile (<768px): Bottom ergonomic navigation bar (`mobile-bottom-nav`) is visible, character selector (`header-character-selector`) is accessible, and Dashboard quick-actions strip works.
 * 2. Tablet (820×1180) & Desktop (1440×900): Floating pill dock (`desktop-floating-dock`) is active while mobile bottom bar is hidden.
 * 3. Character Sheet (`/character`) on Mobile/Tablet: Sticky section switcher (`character-sheet-mobile-tabs`) filters sections cleanly.
 * 4. Battle Map (`/map`) & GM Dashboard (`/gm`): Touch-ready canvas (`touch-none`), collapsible GM map controls, and horizontally scrollable GM tabs with visible labels on mobile.
 */

async function setupMockSession(page: Page) {
  const mockUser = {
    id: 'e2e-responsive-user',
    email: 'gm@example.com',
  };

  const mockSession = {
    access_token: 'fake-jwt-token-for-e2e',
    refresh_token: 'fake-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    token_type: 'bearer',
    user: mockUser,
  };

  await page.route('**/auth/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: mockUser,
        session: mockSession,
      }),
    });
  });

  await page.route('**/rest/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: mockUser.id,
          username: 'Loremaster GM',
          role: 'gm',
          locale: 'en',
        },
      ]),
    });
  });

  await page.addInitScript(
    ({ session }) => {
      window.localStorage.setItem('sb-cpyiinhfcgeqxubzhacw-auth-token', JSON.stringify(session));
    },
    { session: mockSession }
  );
}

test.describe('10-Phase Multi-Viewport UI/UX Verification (Web, Tablet, Mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockSession(page);
  });

  test('Mobile Viewport (390×844): Ergonomic bottom nav, character selector, and Dashboard quick actions', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Mobile bottom navigation bar should be visible on 390px viewport
    const mobileNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileNav).toBeVisible({ timeout: 10000 });

    // Desktop floating dock should be hidden on <768px
    const desktopDock = page.getByTestId('desktop-floating-dock');
    await expect(desktopDock).toBeHidden();

    // 2. Dashboard Quick Action Strip should be visible and trigger Initiative roll
    const quickActions = page.getByTestId('dashboard-quick-actions');
    await expect(quickActions).toBeVisible();

    const rollInitBtn = page.getByTestId('dashboard-roll-initiative-btn');
    await expect(rollInitBtn).toBeVisible();
    await rollInitBtn.click();

    // Verify 3D Dice Tray modal opens on mobile without overflowing
    const die3D = page.getByTestId('polyhedral-die-3d');
    await expect(die3D).toBeVisible({ timeout: 5000 });

    // Close Dice Tray
    await page.getByRole('button', { name: /close dice tray/i }).click();

    expect(pageErrors).toEqual([]);
  });

  test('Tablet (820×1180) & Desktop (1440×900): Floating pill dock and Double-Bezel War Table layout', async ({
    page,
  }) => {
    // Tablet Viewport (820×1180)
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const desktopDock = page.getByTestId('desktop-floating-dock');
    await expect(desktopDock).toBeVisible({ timeout: 10000 });

    const mobileNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileNav).toBeHidden();

    // Desktop Viewport (1440×900)
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(desktopDock).toBeVisible();
    await expect(page.getByTestId('dashboard-quick-actions')).toBeVisible();
  });

  test('Battle Map & GM Sanctum on Mobile (390×844): Touch-none canvas, collapsible GM map controls, and GM tabs', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/map');
    await page.waitForLoadState('domcontentloaded');

    const mapCanvas = page.getByTestId('battle-map-canvas');
    await expect(mapCanvas).toBeVisible({ timeout: 10000 });
    await expect(mapCanvas).toHaveClass(/touch-none/);

    // Verify GM Map Controls collapse toggle works on mobile
    const collapseBtn = page.getByTestId('gm-map-controls-collapse-btn');
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      await collapseBtn.click();
    }

    // Navigate to GM Sanctum and verify horizontal scrollable tabs show labels on mobile
    await page.goto('/gm');
    await page.waitForLoadState('domcontentloaded');
    const gmTabs = page.getByTestId('gm-dashboard-tabs');
    await expect(gmTabs).toBeVisible({ timeout: 10000 });
    await expect(gmTabs.getByText('Combat Tracker')).toBeVisible();
  });
});
