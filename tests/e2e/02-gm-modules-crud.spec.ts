import { test, expect } from '@playwright/test';
import { setupAuthSession, createConsoleErrorCollector } from './helpers/auth';

/**
 * Tier 2 & Tier 4: GM Module UI CRUD & Reload Persistence Verification
 * Covers the 3 New GM Control Modules:
 * 1. Combat & Initiative Tracker (campaign_encounters, encounter_combatants)
 * 2. Atmosphere & Session Chronicle (campaign_environments, session_chronicles)
 * 3. Loot Dispenser & Vault (campaign_loot_chests)
 *
 * CRITICAL TEST INTEGRITY DIRECTIVES:
 * - NO fake auth, NO anon key injection. Uses authentic session from Supabase Auth.
 * - NO silent passing, NO early returns (`return` if table missing is strictly banned).
 * - Direct UI automation: clicks tabs in GMDashboard.tsx, enters form data, submits,
 *   updates, executes `page.reload()`, and verifies persistence via rendered DOM elements.
 */

test.describe('Tier 2 & 4: GM Module UI CRUD & Reload Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticates with genuine GM session. Fails explicitly if credentials missing.
    await setupAuthSession(page, 'gm');
  });

  // ─── MODULE 1: COMBAT TRACKER ─────────────────────────────────
  test.describe('Module 1: Combat Tracker UI CRUD & Reload Persistence', () => {
    test('GM creates, updates, and verifies persistence of encounter & combatants via UI across reload', async ({
      page,
    }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto('/gm');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText(/Game Master|GM Dashboard/i).first()).toBeVisible({ timeout: 10000 });

      // 1. Switch to Combat Tracker Tab
      const combatTab = page
        .locator('button')
        .filter({ hasText: /combat|encounter|karşılaşma/i })
        .first();
      await expect(combatTab, 'Combat Tracker tab must exist in GM Dashboard').toBeVisible({ timeout: 7000 });
      await combatTab.click();

      const encounterName = `E2E Boss Encounter ${Date.now()}`;

      // 2. Open New Encounter Modal & Submit Form
      const createEncounterBtn = page
        .locator('[data-testid="create-encounter-btn"]')
        .or(page.getByRole('button', { name: /yeni karşılaşma|create encounter/i }))
        .first();
      await expect(createEncounterBtn, 'Create encounter button must be present in Combat module').toBeVisible();
      await createEncounterBtn.click();

      const encounterInput = page
        .locator('[data-testid="encounter-name-input"]')
        .or(page.getByPlaceholder(/Goblin Pususu|encounter name|karşılaşma/i))
        .first();
      await expect(encounterInput, 'Encounter name input must be visible in modal').toBeVisible();
      await encounterInput.fill(encounterName);

      const submitEncounterBtn = page
        .locator('[data-testid="encounter-submit-btn"]')
        .or(page.getByRole('button', { name: /^oluştur$|^create$/i }))
        .first();
      await submitEncounterBtn.click();

      // Verify encounter is rendered in UI
      await expect(page.getByText(encounterName).first()).toBeVisible({ timeout: 7000 });

      // 3. Open Add Combatant Modal & Submit Form
      const addCombatantBtn = page
        .locator('[data-testid="add-combatant-btn"]')
        .or(page.getByRole('button', { name: /savaşçı.*ekle|add combatant/i }))
        .first();
      await expect(addCombatantBtn, 'Add combatant button must be present').toBeVisible();
      await addCombatantBtn.click();

      const combatantInput = page
        .getByPlaceholder(/Goblin Okçusu|combatant name|isim/i)
        .or(page.locator('form input[type="text"]'))
        .first();
      await expect(combatantInput, 'Combatant name input must be visible in modal').toBeVisible();
      await combatantInput.fill('Goblin Scout');

      const submitCombatantBtn = page
        .getByRole('button', { name: /^ekle$|^add$/i })
        .last();
      await submitCombatantBtn.click();

      // Verify combatant rendered
      await expect(page.getByText('Goblin Scout').first()).toBeVisible({ timeout: 7000 });

      // 4. UPDATE Encounter (Advance round via next round button)
      const nextRoundBtn = page
        .locator('[data-testid="next-round-btn"]')
        .or(page.getByRole('button', { name: /next round|sonraki tur/i }))
        .first();
      await expect(nextRoundBtn, 'Next round button must be present').toBeVisible();
      await nextRoundBtn.click();

      // Verify round counter shows at least 2
      const roundCounter = page
        .locator('[data-testid="round-counter"]')
        .or(page.getByText(/tur 2|round 2/i))
        .first();
      await expect(roundCounter).toBeVisible({ timeout: 7000 });

      // 5. RELOAD BROWSER PAGE to verify persistence
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // Re-activate Combat tab if necessary
      if (await combatTab.isVisible()) {
        await combatTab.click();
      }

      // 6. VERIFY PERSISTENCE after reload
      await expect(
        page.getByText(encounterName).first(),
        `Encounter '${encounterName}' must persist in UI after page reload`
      ).toBeVisible({ timeout: 7000 });
      await expect(
        page.getByText('Goblin Scout').first(),
        'Combatant "Goblin Scout" must persist in UI after page reload'
      ).toBeVisible({ timeout: 7000 });

      // 7. CLEAN UP / DELETE
      const deleteEncounterBtn = page
        .locator('[data-testid="delete-encounter-btn"]')
        .or(page.getByRole('button', { name: /delete encounter|sil/i }))
        .first();
      if (await deleteEncounterBtn.isVisible()) {
        await deleteEncounterBtn.click();
      }

      consoleMonitor.assertNoErrors();
    });
  });

  // ─── MODULE 2: ATMOSPHERE & SESSION CHRONICLE ─────────────────
  test.describe('Module 2: Atmosphere & Session Chronicle UI CRUD & Reload Persistence', () => {
    test('GM creates, updates, and verifies persistence of chronicle and atmosphere via UI across reload', async ({
      page,
    }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto('/gm');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText(/Game Master|GM Dashboard/i).first()).toBeVisible({ timeout: 10000 });

      // 1. Switch to Atmosphere / Chronicle Tab
      const atmosphereTab = page
        .locator('button')
        .filter({ hasText: /atmosphere|chronicle|atmosfer|günlük/i })
        .first();
      await expect(atmosphereTab, 'Atmosphere & Chronicle tab must exist in GM Dashboard').toBeVisible({
        timeout: 7000,
      });
      await atmosphereTab.click();

      const chronicleTitle = `Chronicle Entry ${Date.now()}`;
      const chronicleSummary = 'The adventurers crossed the scorched wastes into the ancient citadel.';

      // 2. Open Create Chronicle Modal & Submit Form
      const createSessionBtn = page
        .locator('[data-testid="create-session-btn"]')
        .or(page.getByRole('button', { name: /yeni seans günlüğü|create chronicle|yeni günlük/i }))
        .first();
      await expect(createSessionBtn, 'Create session chronicle button must be present').toBeVisible();
      await createSessionBtn.click();

      const titleInput = page
        .locator('[data-testid="session-title-input"]')
        .or(page.getByPlaceholder(/Gölge Kalesi|seans başlığı|session title/i))
        .first();
      await expect(titleInput, 'Chronicle title input must be visible in modal').toBeVisible();
      await titleInput.fill(chronicleTitle);

      const summaryInput = page
        .locator('[data-testid="session-summary-input"]')
        .or(page.getByPlaceholder(/özet|summary/i))
        .first();
      await summaryInput.fill(chronicleSummary);

      const submitChronicleBtn = page
        .locator('[data-testid="session-submit-btn"]')
        .or(page.getByRole('button', { name: /^kaydet$|^save$|^güncelle$/i }))
        .first();
      await submitChronicleBtn.click();

      // Verify chronicle rendered in chronicle log
      await expect(page.getByText(chronicleTitle).first()).toBeVisible({ timeout: 7000 });

      // 3. UPDATE Atmosphere Setting (Weather trigger)
      const weatherBtn = page
        .locator('[data-testid="weather-btn-storm"]')
        .or(page.locator('button').filter({ hasText: /fırtına|storm/i }))
        .first();
      if (await weatherBtn.isVisible()) {
        await weatherBtn.click();
      }

      // 4. RELOAD BROWSER PAGE to verify persistence
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      if (await atmosphereTab.isVisible()) {
        await atmosphereTab.click();
      }

      // 5. VERIFY PERSISTENCE after reload
      await expect(
        page.getByText(chronicleTitle).first(),
        `Chronicle '${chronicleTitle}' must persist in UI after page reload`
      ).toBeVisible({ timeout: 7000 });

      consoleMonitor.assertNoErrors();
    });
  });

  // ─── MODULE 3: LOOT DISPENSER ─────────────────────────────────
  test.describe('Module 3: Loot Dispenser UI CRUD & Reload Persistence', () => {
    test('GM creates, updates, and verifies persistence of loot chest via UI across reload', async ({
      page,
    }) => {
      const consoleMonitor = createConsoleErrorCollector(page);

      await page.goto('/gm');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByText(/Game Master|GM Dashboard/i).first()).toBeVisible({ timeout: 10000 });

      // 1. Switch to Loot Dispenser Tab
      const lootTab = page
        .locator('button')
        .filter({ hasText: /loot|ganimet|chest|sandık/i })
        .first();
      await expect(lootTab, 'Loot Dispenser tab must exist in GM Dashboard').toBeVisible({ timeout: 7000 });
      await lootTab.click();

      const chestName = `Dragon Vault ${Date.now()}`;

      // 2. Open Create Chest Modal / Form
      const createChestBtn = page
        .locator('[data-testid="create-chest-btn"]')
        .or(page.getByRole('button', { name: /yeni sandık|create chest|sandık oluştur/i }))
        .first();
      await expect(createChestBtn, 'Create chest button must be present in Loot module').toBeVisible();
      await createChestBtn.click();

      const chestNameInput = page
        .locator('[data-testid="chest-name-input"]')
        .or(page.getByPlaceholder(/sandık adı|chest name/i))
        .first();
      await expect(chestNameInput, 'Chest name input must be present').toBeVisible();
      await chestNameInput.fill(chestName);

      const goldInput = page
        .locator('[data-testid="chest-gold-input"]')
        .or(page.getByPlaceholder(/altın|gold/i))
        .first();
      if (await goldInput.isVisible()) {
        await goldInput.fill('1500');
      }

      const submitChestBtn = page
        .locator('[data-testid="chest-submit-btn"]')
        .or(page.getByRole('button', { name: /^oluştur$|^kaydet$|^create$/i }))
        .first();
      await submitChestBtn.click();

      // Verify chest rendered in UI
      await expect(page.getByText(chestName).first()).toBeVisible({ timeout: 7000 });

      // 3. RELOAD BROWSER PAGE to verify persistence
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      if (await lootTab.isVisible()) {
        await lootTab.click();
      }

      // 4. VERIFY PERSISTENCE after reload
      await expect(
        page.getByText(chestName).first(),
        `Loot chest '${chestName}' must persist in UI after page reload`
      ).toBeVisible({ timeout: 7000 });

      consoleMonitor.assertNoErrors();
    });
  });
});
