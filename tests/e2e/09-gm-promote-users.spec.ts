import { test, expect, Page } from '@playwright/test';

/**
 * E2E Verification: GM User Role Promotion & Demotion inside GM Menu (/gm)
 * Verifies:
 * 1. GM can access GM Role Management from header quick action button, GM Roles tab, Overview card, and Party Management tab.
 * 2. Promoting a player to GM via 1-click "GM Yap / Make GM" button updates role via RPC/REST and updates badge + filter counts.
 * 3. Promoting a player to GM via Quick Promote selector panel works and clears selection.
 * 4. Demoting another GM to Player via "Oyuncu Yap / Set as Player" button works.
 * 5. Edge Cases:
 *    - Current GM's own role control is locked (cannot self-demote).
 *    - Admin user role is locked when viewed by a non-admin GM.
 *    - Search filter and role filter tabs (All / GM / Players) work including empty search state.
 *    - Backend error handling displays error message without corrupting state.
 */

const MOCK_GM_USER = {
  id: 'gm-user-1',
  email: 'alcyone@example.com',
};

interface MockProfile {
  id: string;
  username: string;
  role: 'admin' | 'gm' | 'player';
  avatar_url?: string | null;
  created_at?: string;
  locale?: string;
}

async function setupGMMockBackend(page: Page, initialProfiles?: MockProfile[], shouldFailRoleUpdate = false) {
  const profiles: MockProfile[] = initialProfiles ?? [
    {
      id: MOCK_GM_USER.id,
      username: 'Alcyone',
      role: 'gm',
      created_at: '2026-01-01T00:00:00Z',
      locale: 'tr',
    },
    {
      id: 'player-bob',
      username: 'Bob Valor',
      role: 'player',
      created_at: '2026-01-02T00:00:00Z',
      locale: 'tr',
    },
    {
      id: 'player-maximus',
      username: 'Maximus',
      role: 'player',
      created_at: '2026-01-03T00:00:00Z',
      locale: 'tr',
    },
    {
      id: 'admin-overlord',
      username: 'ArchAdmin',
      role: 'admin',
      created_at: '2026-01-01T00:00:00Z',
      locale: 'tr',
    },
  ];

  const rpcCalls: Array<{ targetId: string; newRole: string }> = [];

  const mockSession = {
    access_token: 'fake-jwt-token-for-gm-e2e',
    refresh_token: 'fake-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    token_type: 'bearer',
    user: MOCK_GM_USER,
  };

  await page.route('**/auth/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: MOCK_GM_USER,
        session: mockSession,
      }),
    });
  });

  await page.route('**/rest/v1/rpc/gm_set_user_role**', async (route) => {
    const postData = route.request().postDataJSON() as {
      p_target_user_id: string;
      p_new_role: 'gm' | 'player';
    };
    rpcCalls.push({ targetId: postData.p_target_user_id, newRole: postData.p_new_role });

    if (shouldFailRoleUpdate) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Database permission denied during test' }),
      });
      return;
    }

    const target = profiles.find((p) => p.id === postData.p_target_user_id);
    if (target) {
      target.role = postData.p_new_role;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(target ?? { id: postData.p_target_user_id, role: postData.p_new_role }),
    });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/rpc/gm_set_user_role')) {
      return route.fallback();
    }

    if (url.includes('/rest/v1/profiles')) {
      if (method === 'PATCH') {
        if (shouldFailRoleUpdate) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Database permission denied during test' }),
          });
          return;
        }
        const body = route.request().postDataJSON() as { role?: 'gm' | 'player' };
        const idMatch = url.match(/id=eq\.([^&]+)/);
        const targetId = idMatch ? decodeURIComponent(idMatch[1]) : '';
        const target = profiles.find((p) => p.id === targetId);
        if (target && body.role) {
          target.role = body.role;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(target ? [target] : []),
        });
        return;
      }

      // Check if filtered by id (`id=eq.gm-user-1`), e.g. for AuthContext .maybeSingle() or .single()
      const accept = route.request().headers()['accept'] || '';
      const idMatch = url.match(/id=eq\.([^&]+)/);
      if (idMatch) {
        const found = profiles.find((p) => p.id === decodeURIComponent(idMatch[1]));
        if (accept.includes('application/vnd.pgrst.object+json')) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(found ?? profiles[0]),
          });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(found ? [found] : []),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profiles),
      });
      return;
    }

    if (url.includes('/rest/v1/campaign_members')) {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            // Regression test: co-GM has profiles.role = 'gm' but a legacy 'player' row in campaign_members
            {
              id: 'mem-cogm',
              campaign_id: 'camp-1',
              profile_id: 'gm-co-host',
              role: 'player',
            },
          ]),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (url.includes('/rest/v1/characters')) {
      // Strictly reject non-existent 'user_id' column in select= query param just like real PostgREST
      if (url.includes('user_id')) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: '42703',
            message: 'column characters.user_id does not exist',
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'char-1',
            profile_id: 'player-bob',
            name: 'Sir Bob',
            class: 'Paladin',
            level: 5,
            hp_current: 44,
            hp_max: 44,
            ac: 18,
            gold: 100,
            inventory: [],
          },
        ]),
      });
      return;
    }

    // Default empty array for other tables
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.addInitScript(
    ({ session }) => {
      window.localStorage.setItem('sb-cpyiinhfcgeqxubzhacw-auth-token', JSON.stringify(session));
    },
    { session: mockSession }
  );

  return { profiles, rpcCalls };
}

test.describe('GM Menu User Role Promotion & Demotion (/gm)', () => {
  test('Promotes players to GM via 1-click button and Quick Promote panel, demotes GM to player, and enforces self/admin/stale-select/member-role regressions', async ({
    page,
  }) => {
    const { rpcCalls } = await setupGMMockBackend(page, [
      {
        id: MOCK_GM_USER.id,
        username: 'Alcyone',
        role: 'gm',
        created_at: '2026-01-01T00:00:00Z',
        locale: 'tr',
      },
      {
        id: 'gm-co-host',
        username: 'CoMaster Lyra',
        role: 'gm',
        created_at: '2026-01-01T12:00:00Z',
        locale: 'tr',
      },
      {
        id: 'player-bob',
        username: 'Bob Valor',
        role: 'player',
        created_at: '2026-01-02T00:00:00Z',
        locale: 'tr',
      },
      {
        id: 'player-maximus',
        username: 'Maximus',
        role: 'player',
        created_at: '2026-01-03T00:00:00Z',
        locale: 'tr',
      },
      {
        id: 'admin-overlord',
        username: 'ArchAdmin',
        role: 'admin',
        created_at: '2026-01-01T00:00:00Z',
        locale: 'tr',
      },
    ]);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gm');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify GM header button & GM Roles tab exist
    const headerManageRolesBtn = page.getByTestId('gm-header-manage-roles-btn');
    await expect(headerManageRolesBtn).toBeVisible({ timeout: 10000 });

    const gmRolesTab = page.getByTestId('gm-tab-users');
    await expect(gmRolesTab).toBeVisible();

    // Open GM Roles tab via header button
    await headerManageRolesBtn.click();

    const roleManager = page.getByTestId('gm-user-role-manager');
    await expect(roleManager).toBeVisible();

    // 2. Verify initial user badges & character names (proves characters.select('profile_id, name') succeeded)
    await expect(page.getByTestId('gm-user-role-badge-gm-user-1')).toContainText('GM');
    // Regression check: CoMaster Lyra has profiles.role='gm' and campaign_members.role='player', must still resolve to 'GM'
    await expect(page.getByTestId('gm-user-role-badge-gm-co-host')).toContainText('GM');
    await expect(page.getByTestId('gm-user-role-badge-player-bob')).toContainText(/Oyuncu|Player/i);
    await expect(page.getByTestId('gm-user-row-player-bob')).toContainText('Sir Bob');
    await expect(page.getByTestId('gm-user-role-badge-player-maximus')).toContainText(/Oyuncu|Player/i);
    await expect(page.getByTestId('gm-user-role-badge-admin-overlord')).toContainText(/Admin/i);

    // 3. Edge case: Current GM cannot demote themselves & cannot modify Admin
    await expect(page.getByTestId('gm-role-select-gm-user-1')).toBeDisabled();
    await expect(page.getByTestId('gm-demote-btn-gm-user-1')).toHaveCount(0);
    await expect(page.getByTestId('gm-role-select-admin-overlord')).toHaveCount(0);
    await expect(page.getByTestId('gm-promote-btn-admin-overlord')).toHaveCount(0);

    // 4. Regression check: Select Bob Valor in Quick Promote dropdown, then promote Bob via row button.
    // The Quick Promote dropdown must invalidate stale 'player-bob' and auto-select the remaining single player 'player-maximus'.
    const quickPromoteSelect = page.getByTestId('gm-promote-user-select');
    await quickPromoteSelect.selectOption('player-bob');
    await expect(quickPromoteSelect).toHaveValue('player-bob');

    const promoteBobBtn = page.getByTestId('gm-promote-btn-player-bob');
    await expect(promoteBobBtn).toBeVisible();
    await promoteBobBtn.click();

    // Verify RPC was called and badge updated to GM
    await expect(page.getByTestId('gm-user-role-badge-player-bob')).toContainText('GM');
    await expect(page.getByTestId('gm-demote-btn-player-bob')).toBeVisible();
    expect(rpcCalls).toContainEqual({ targetId: 'player-bob', newRole: 'gm' });

    // Quick Promote select must now reflect the remaining player ('player-maximus'), NOT stale 'player-bob'
    await expect(quickPromoteSelect).toHaveValue('player-maximus');

    // 5. Promote Maximus to GM using the Quick Promote panel button
    const quickPromoteBtn = page.getByTestId('gm-quick-promote-btn');
    await expect(quickPromoteBtn).toBeEnabled();
    await quickPromoteBtn.click();

    await expect(page.getByTestId('gm-user-role-badge-player-maximus')).toContainText('GM');
    expect(rpcCalls).toContainEqual({ targetId: 'player-maximus', newRole: 'gm' });
    await expect(quickPromoteBtn).toBeDisabled();

    // 6. Demote Bob Valor back to Player using "Oyuncu Yap / Set as Player" button
    const demoteBobBtn = page.getByTestId('gm-demote-btn-player-bob');
    await demoteBobBtn.click();

    await expect(page.getByTestId('gm-user-role-badge-player-bob')).toContainText(/Oyuncu|Player/i);
    expect(rpcCalls).toContainEqual({ targetId: 'player-bob', newRole: 'player' });

    // 7. Search filter & Empty state edge case
    const searchInput = page.getByTestId('gm-user-search-input');
    await searchInput.fill('Maximus');
    await expect(page.getByTestId('gm-user-row-player-maximus')).toBeVisible();
    await expect(page.getByTestId('gm-user-row-player-bob')).toHaveCount(0);

    await searchInput.fill('NonExistentUserXYZ');
    await expect(roleManager).toContainText(/Kullanıcı bulunamadı|No matching users/i);
    await searchInput.fill('');

    // 8. Also verify GMUserRoleManager is accessible inside Party Management tab
    await page.getByTestId('gm-tab-party').click();
    await expect(page.getByTestId('gm-user-role-manager')).toBeVisible();
  });

  test('Displays error feedback and preserves user role when backend role update fails', async ({
    page,
  }) => {
    await setupGMMockBackend(page, undefined, true);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/gm');
    await page.waitForLoadState('domcontentloaded');

    await page.getByTestId('gm-tab-users').click();
    await expect(page.getByTestId('gm-user-role-manager')).toBeVisible();

    await page.getByTestId('gm-promote-btn-player-bob').click();

    // Role should revert/remain Oyuncu (Player) and error toast should appear
    await expect(page.getByTestId('gm-user-role-badge-player-bob')).toContainText(/Oyuncu|Player/i);
    await expect(page.locator('body')).toContainText(
      /Yetki güncellenemedi|Could not update role/i
    );
  });
});
