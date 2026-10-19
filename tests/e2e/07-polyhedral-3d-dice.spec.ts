import { test, expect, Page } from '@playwright/test';

/**
 * 3D Polyhedral Dice & D20 Icosahedron Verification Suite
 * Verifies:
 * 1. Opening Universal Dice Tray renders a true 3D 20-sided regular icosahedron with 20 triangular faces.
 * 2. Rolling d20 transitions through rolling state with 3D tumbling rotation and settles on currentResult.keptRoll.
 * 3. Advantage and Disadvantage modes render two 3D d20 dice settling on rolls[0] and rolls[1], distinguishing kept vs discarded.
 * 4. Polyhedral dice (d4, d6, d8, d10, d12, d100) each render their respective 3D polyhedral visual and settle cleanly without errors.
 */

async function setupMockSession(page: Page) {
  const mockUser = {
    id: 'e2e-test-user',
    email: 'gm@example.com',
  };

  const mockSession = {
    access_token: 'fake-jwt-token-for-e2e',
    refresh_token: 'fake-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24,
    token_type: 'bearer',
    user: mockUser,
  };

  // Route Supabase auth & rest calls for hermetic testing in offline test environments
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

  // Inject session into localStorage before initial load
  await page.addInitScript(
    ({ session }) => {
      window.localStorage.setItem('sb-cpyiinhfcgeqxubzhacw-auth-token', JSON.stringify(session));
    },
    { session: mockSession }
  );
}

test.describe('3D Polyhedral Dice & D20 Icosahedron Roll Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockSession(page);
  });

  test('R1 & R2: d20 icosahedron renders all 20 triangular faces, animates tumble, and settles on rolled value', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Universal Dice Tray via Floating Dock button
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await expect(diceTrayBtn).toBeVisible({ timeout: 10000 });
    await diceTrayBtn.click();

    // Verify Dice Tray modal is open
    const modalHeader = page.getByText(/universal dice tray|kadim zar tepsisi/i);
    await expect(modalHeader).toBeVisible({ timeout: 5000 });

    // Verify 3D die container is rendered
    const die3D = page.locator('[data-testid="polyhedral-die-3d"]');
    await expect(die3D).toBeVisible();
    await expect(die3D).toHaveAttribute('data-die-type', 'd20');

    // Verify that all 20 triangular faces of the regular icosahedron are present in DOM
    const d20Faces = page.locator('[data-testid^="dice-d20-face-"]');
    await expect(d20Faces).toHaveCount(20);

    // Verify all face numbers 1 through 20 are present
    for (let faceNum = 1; faceNum <= 20; faceNum++) {
      const face = page.locator(`[data-testid="dice-d20-face-${faceNum}"]`);
      await expect(face).toBeAttached();
    }

    // Trigger a d20 roll via CAST DICE button
    const castBtn = page.locator('[data-testid="dice-cast-btn"]');
    await expect(castBtn).toBeVisible();
    await castBtn.click();

    // Verify transition through rolling state
    await expect(die3D).toHaveAttribute('data-rolling', 'true', { timeout: 1500 });

    // Verify settling to not rolling
    await expect(die3D).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });

    // Verify settled face attribute
    const settledFaceStr = await die3D.getAttribute('data-settled-face');
    expect(settledFaceStr).toBeTruthy();
    const settledVal = parseInt(settledFaceStr!, 10);
    expect(settledVal).toBeGreaterThanOrEqual(1);
    expect(settledVal).toBeLessThanOrEqual(20);

    // Verify the face element matching settledVal is present and displays the rolled number
    const activeFace = page.locator(`[data-testid="dice-d20-face-${settledVal}"]`);
    await expect(activeFace).toBeVisible();

    // Verify roll breakdown text displays the rolled value
    const breakdown = page.locator('.arcane-glass').getByText(new RegExp(`=\\s*${settledVal}|${settledVal}`, 'i'));
    await expect(breakdown.first()).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('R1: Advantage and Disadvantage render two 3D d20 dice with kept and discarded distinction', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Dice Tray
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await diceTrayBtn.click();

    // 1. ADVANTAGE MODE
    const advBtn = page.getByRole('button', { name: /advantage|avantaj/i }).first();
    await expect(advBtn).toBeVisible();
    await advBtn.click();

    // Cast dice with Advantage
    const castBtn = page.locator('[data-testid="dice-cast-btn"]');
    await castBtn.click();

    // Wait for roll to settle
    const dieRoll0 = page.locator('[data-testid="dice-3d-roll-0"]');
    const dieRoll1 = page.locator('[data-testid="dice-3d-roll-1"]');

    await expect(dieRoll0).toBeVisible({ timeout: 5000 });
    await expect(dieRoll1).toBeVisible({ timeout: 5000 });

    await expect(dieRoll0).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });
    await expect(dieRoll1).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });

    // Read settled values of both dice
    const r0Val = parseInt((await dieRoll0.getAttribute('data-settled-face')) || '0', 10);
    const r1Val = parseInt((await dieRoll1.getAttribute('data-settled-face')) || '0', 10);
    expect(r0Val).toBeGreaterThanOrEqual(1);
    expect(r0Val).toBeLessThanOrEqual(20);
    expect(r1Val).toBeGreaterThanOrEqual(1);
    expect(r1Val).toBeLessThanOrEqual(20);

    // Verify Advantage logic: the higher roll is kept, the lower roll is discarded
    const die0Kept = (await dieRoll0.getAttribute('data-is-kept')) === 'true';
    const die1Kept = (await dieRoll1.getAttribute('data-is-kept')) === 'true';

    // Exactly one die is kept
    expect(die0Kept || die1Kept).toBe(true);

    if (r0Val > r1Val) {
      expect(die0Kept).toBe(true);
      expect(await dieRoll1.getAttribute('data-is-discarded')).toBe('true');
    } else if (r1Val > r0Val) {
      expect(die1Kept).toBe(true);
      expect(await dieRoll0.getAttribute('data-is-discarded')).toBe('true');
    }

    // 2. DISADVANTAGE MODE
    const disBtn = page.getByRole('button', { name: /disadv|dezavantaj/i }).first();
    await disBtn.click();
    await castBtn.click();

    await expect(dieRoll0).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });
    await expect(dieRoll1).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });

    const disR0 = parseInt((await dieRoll0.getAttribute('data-settled-face')) || '0', 10);
    const disR1 = parseInt((await dieRoll1.getAttribute('data-settled-face')) || '0', 10);

    const disDie0Kept = (await dieRoll0.getAttribute('data-is-kept')) === 'true';
    const disDie1Kept = (await dieRoll1.getAttribute('data-is-kept')) === 'true';

    expect(disDie0Kept || disDie1Kept).toBe(true);
    if (disR0 < disR1) {
      expect(disDie0Kept).toBe(true);
      expect(await dieRoll1.getAttribute('data-is-discarded')).toBe('true');
    } else if (disR1 < disR0) {
      expect(disDie1Kept).toBe(true);
      expect(await dieRoll0.getAttribute('data-is-discarded')).toBe('true');
    }

    expect(pageErrors).toEqual([]);
  });

  test('R1: Polyhedral dice d4, d6, d8, d10, d12, and d100 each render cohesive 3D visuals and settle cleanly', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Dice Tray
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await diceTrayBtn.click();

    const castBtn = page.locator('[data-testid="dice-cast-btn"]');

    const polyhedralDice = [
      { type: 'd4', expectedFaces: 4, minVal: 1, maxVal: 4 },
      { type: 'd6', expectedFaces: 6, minVal: 1, maxVal: 6 },
      { type: 'd8', expectedFaces: 8, minVal: 1, maxVal: 8 },
      { type: 'd10', expectedFaces: 10, minVal: 1, maxVal: 10 },
      { type: 'd12', expectedFaces: 12, minVal: 1, maxVal: 12 },
      { type: 'd100', expectedFaces: 10, minVal: 1, maxVal: 100 },
    ];

    for (const { type, expectedFaces, minVal, maxVal } of polyhedralDice) {
      // Select the polyhedral die button
      const dieBtn = page.locator('button', { hasText: new RegExp(`^${type}$`, 'i') });
      await expect(dieBtn).toBeVisible();
      await dieBtn.click();

      // Verify the 3D die switches to that dieType
      const die3D = page.locator('[data-testid="polyhedral-die-3d"]');
      await expect(die3D).toBeVisible();
      await expect(die3D).toHaveAttribute('data-die-type', type);

      // Verify all faces of the 3D geometry are present in the DOM
      const faces = page.locator(`[data-testid^="dice-${type}-face-"]`);
      await expect(faces).toHaveCount(expectedFaces);

      // Roll the die
      await castBtn.click();

      // Wait for settling
      await expect(die3D).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });

      // Verify settled face value is within valid bounds
      const settledStr = await die3D.getAttribute('data-settled-face');
      expect(settledStr).toBeTruthy();
      const settledVal = parseInt(settledStr!, 10);
      expect(settledVal).toBeGreaterThanOrEqual(minVal);
      expect(settledVal).toBeLessThanOrEqual(maxVal);
    }

    expect(pageErrors).toEqual([]);
  });

  test('R1: Natural 20 critical hit and Natural 1 critical fumble display distinct landing effects and auras', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Dice Tray
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await diceTrayBtn.click();

    // 1. Force Natural 20 by stubbing Math.random to return 0.999
    await page.evaluate(() => {
      const origRandom = Math.random;
      // When rolling 1d20: Math.floor(random * 20) + 1 = 20 when random = 0.99
      Math.random = () => 0.99;
      (window as unknown as { __origRandom: typeof Math.random }).__origRandom = origRandom;
    });

    const castBtn = page.locator('[data-testid="dice-cast-btn"]');
    await castBtn.click();

    const die3D = page.locator('[data-testid="polyhedral-die-3d"]');
    await expect(die3D).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });
    await expect(die3D).toHaveAttribute('data-settled-face', '20');
    await expect(die3D).toHaveAttribute('data-is-crit', 'true');
    await expect(die3D).toHaveAttribute('data-is-fumble', 'false');

    // Verify Natural 20 critical success banner is visible
    const critBanner = page.getByText(/natural 20|kritik başarı/i);
    await expect(critBanner).toBeVisible();

    // 2. Force Natural 1 by stubbing Math.random to return 0.001
    await page.evaluate(() => {
      Math.random = () => 0.001;
    });

    await castBtn.click();
    await expect(die3D).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });
    await expect(die3D).toHaveAttribute('data-settled-face', '1');
    await expect(die3D).toHaveAttribute('data-is-fumble', 'true');
    await expect(die3D).toHaveAttribute('data-is-crit', 'false');

    // Verify Natural 1 fumble banner is visible
    const fumbleBanner = page.getByText(/natural 1|kritik başarısızlık/i);
    await expect(fumbleBanner).toBeVisible();

    // Restore Math.random
    await page.evaluate(() => {
      const orig = (window as unknown as { __origRandom?: typeof Math.random }).__origRandom;
      if (orig) Math.random = orig;
    });

    expect(pageErrors).toEqual([]);
  });

  test('R2: Rapid repeated roll triggers mid-roll smoothly restart tumble without orientation glitch', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Dice Tray
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await diceTrayBtn.click();

    const die3D = page.locator('[data-testid="polyhedral-die-3d"]');

    // Trigger multiple rolls in rapid succession via window.triggerDiceRoll
    await page.evaluate(async () => {
      const trigger = (window as unknown as { triggerDiceRoll: (req: unknown) => void }).triggerDiceRoll;
      trigger({ formula: '1d20', label: 'Rapid Roll 1' });
      await new Promise((r) => setTimeout(r, 200));
      trigger({ formula: '1d20', label: 'Rapid Roll 2' });
      await new Promise((r) => setTimeout(r, 200));
      trigger({ formula: '1d20', label: 'Rapid Roll 3' });
    });

    // Die should transition through rolling and settle cleanly
    await expect(die3D).toHaveAttribute('data-rolling', 'true', { timeout: 1500 });
    await expect(die3D).toHaveAttribute('data-rolling', 'false', { timeout: 8000 });

    const settledStr = await die3D.getAttribute('data-settled-face');
    expect(settledStr).toBeTruthy();
    const val = parseInt(settledStr!, 10);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(20);

    expect(pageErrors).toEqual([]);
  });

  test('R1: Multi-dice and Advantage rolls render completely unique SVG gradient IDs without collisions', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Dice Tray
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await diceTrayBtn.click();

    // Switch to Advantage mode (renders 2 d20 dice)
    const advBtn = page.getByRole('button', { name: /advantage|avantaj/i }).first();
    await advBtn.click();

    const castBtn = page.locator('[data-testid="dice-cast-btn"]');
    await castBtn.click();

    const die0 = page.locator('[data-testid="dice-3d-roll-0"]');
    const die1 = page.locator('[data-testid="dice-3d-roll-1"]');
    await expect(die0).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });
    await expect(die1).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });

    // Assert that all SVG gradient IDs in the document are unique (no duplicates)
    const duplicateIds = await page.evaluate(() => {
      const gradients = Array.from(document.querySelectorAll('linearGradient[id]'));
      const idCounts: Record<string, number> = {};
      const duplicates: string[] = [];
      for (const grad of gradients) {
        const id = grad.getAttribute('id')!;
        idCounts[id] = (idCounts[id] || 0) + 1;
        if (idCounts[id] > 1 && !duplicates.includes(id)) {
          duplicates.push(id);
        }
      }
      return duplicates;
    });

    expect(duplicateIds).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('R1 & R2: Mode selector synchronizes with polyhedral die selection and supports shorthand formulas', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Dice Tray
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await diceTrayBtn.click();

    // 1. Select Advantage mode
    const advBtn = page.getByRole('button', { name: /advantage|avantaj/i }).first();
    await advBtn.click();

    // Verify d20 is active
    const die3D = page.locator('[data-testid="dice-3d-roll-0"]');
    await expect(die3D).toBeVisible();

    // 2. Select a non-d20 die (e.g. d6)
    const d6Btn = page.locator('button', { hasText: /^d6$/i });
    await d6Btn.click();

    // Mode should automatically reset to normal
    const normalBtn = page.getByRole('button', { name: /normal/i }).first();
    await expect(normalBtn).toHaveAttribute('aria-pressed', 'true');

    // 3. Roll via window.triggerDiceRoll with shorthand formula 'd8+3'
    await page.evaluate(() => {
      const trigger = (window as unknown as { triggerDiceRoll: (req: unknown) => void }).triggerDiceRoll;
      trigger({ formula: 'd8+3', label: 'Longsword Attack' });
    });

    const activeDie = page.locator('[data-testid="polyhedral-die-3d"]');
    await expect(activeDie).toHaveAttribute('data-die-type', 'd8');
    await expect(activeDie).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });

    const settledStr = await activeDie.getAttribute('data-settled-face');
    expect(settledStr).toBeTruthy();
    const val = parseInt(settledStr!, 10);
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(8);

    expect(pageErrors).toEqual([]);
  });

  test('R1 & R2: Switching die clears stale aura & breakdown, and center die supports keyboard Enter trigger', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Open Dice Tray
    const diceTrayBtn = page
      .locator('button[aria-label="Dice Tray"], button[aria-label="Zar Tepsisi"]')
      .first();
    await diceTrayBtn.click();

    // 1. Force Natural 20 on d20
    await page.evaluate(() => {
      const orig = Math.random;
      Math.random = () => 0.99;
      (window as unknown as { __origRandom: typeof Math.random }).__origRandom = orig;
    });

    const castBtn = page.locator('[data-testid="dice-cast-btn"]');
    await castBtn.click();

    const d20Die = page.locator('[data-testid="polyhedral-die-3d"]');
    await expect(d20Die).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });
    await expect(d20Die).toHaveAttribute('data-is-crit', 'true');
    await expect(page.getByText(/natural 20|kritik başarı/i)).toBeVisible();

    // Restore Math.random
    await page.evaluate(() => {
      const orig = (window as unknown as { __origRandom?: typeof Math.random }).__origRandom;
      if (orig) Math.random = orig;
    });

    // 2. Switch to d6: verify d20 Nat 20 crit aura and breakdown do NOT leak into d6!
    const d6Btn = page.locator('button', { hasText: /^d6$/i });
    await d6Btn.click();

    await expect(d20Die).toHaveAttribute('data-die-type', 'd6');
    // d6 should rest on its default face (6), NOT 20!
    await expect(d20Die).toHaveAttribute('data-settled-face', '6');
    await expect(d20Die).toHaveAttribute('data-is-crit', 'false');
    // Stale Nat 20 banner should be hidden for d6 before rolling
    await expect(page.getByText(/natural 20|kritik başarı/i)).not.toBeVisible();

    // 3. Test keyboard activation on center die stage
    const centerDie = page.locator('[data-testid="dice-center-die"]');
    await expect(centerDie).toHaveAttribute('role', 'button');
    await centerDie.focus();
    await page.keyboard.press('Enter');

    // Should transition through rolling and settle on d6 result
    await expect(d20Die).toHaveAttribute('data-rolling', 'true', { timeout: 1500 });
    await expect(d20Die).toHaveAttribute('data-rolling', 'false', { timeout: 6000 });

    const settledD6 = parseInt((await d20Die.getAttribute('data-settled-face')) || '0', 10);
    expect(settledD6).toBeGreaterThanOrEqual(1);
    expect(settledD6).toBeLessThanOrEqual(6);

    expect(pageErrors).toEqual([]);
  });
});
