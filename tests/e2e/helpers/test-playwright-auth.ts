import { test, expect } from '@playwright/test';

test('verify auth mocking in playwright', async ({ page }) => {
  // Listen for console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));

  // Navigate to login page
  await page.goto('http://localhost:5173/login');
  await expect(page.locator('text=Enter the Realm')).toBeVisible();
});
