import { chromium } from '@playwright/test';
import { preview } from 'vite';
import fs from 'fs';
import path from 'path';

/**
 * Visual UI Screenshot Capture Script
 * Captures Before (commit 23e1e9c baseline) vs After (M5 UI revamp) screenshots
 * across Desktop (1280x800) and Mobile (375x667) viewports.
 * 
 * NOTE: This script intercepts Supabase endpoints using route.fulfill purely
 * for rendering visual UI review mocks, NOT as functional proof.
 */

const outDir = path.resolve('docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const now = Math.floor(Date.now() / 1000);
const exp = now + 86400 * 30;

const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(
  JSON.stringify({
    sub: 'gm-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'eldrin@yggdrasil.realm',
    exp,
    iat: now,
  })
).toString('base64url');
const token = `${header}.${payload}.mock_signature`;

const mockSession = {
  access_token: token,
  token_type: 'bearer',
  expires_in: 86400 * 30,
  expires_at: exp,
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'gm-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'eldrin@yggdrasil.realm',
    app_metadata: { provider: 'email' },
    user_metadata: { username: 'Eldrin the Wise' },
  },
};

const mockProfile = {
  id: 'gm-user-id',
  username: 'Eldrin the Wise',
  role: 'gm',
  locale: 'en',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
};

const mockCampaign = {
  id: 'camp-1',
  name: 'Chronicles of Yggdrasil',
  gm_id: 'gm-user-id',
  created_by: 'gm-user-id',
  description: 'An epic adventure through the realms of shadow and arcane magic.',
  created_at: '2026-01-01T00:00:00Z',
  settings: { fog_radius: 80 },
};

const mockMembers = [
  {
    id: 'mem-1',
    campaign_id: 'camp-1',
    profile_id: 'gm-user-id',
    user_id: 'gm-user-id',
    role: 'gm',
    campaign: mockCampaign,
    profile: mockProfile,
  },
  {
    id: 'mem-2',
    campaign_id: 'camp-1',
    profile_id: 'p1',
    user_id: 'p1',
    role: 'player',
    campaign: mockCampaign,
    profile: {
      id: 'p1',
      username: 'Lyra Shadowswift',
      role: 'player',
      avatar_url: null,
    },
  },
];

const mockCharacter = {
  id: 'char-1',
  profile_id: 'gm-user-id',
  campaign_id: 'camp-1',
  name: 'Valen Shadowflame',
  level: 5,
  xp_total: 6500,
  xp_available: 500,
  avatar_url: null,
  race_id: 'race-1',
  subclass_id: 'subclass-1',
  race: {
    id: 'race-1',
    name: 'High Elf',
    description_en: 'Graceful and attuned to ancient arcane arts.',
    description_tr: 'Kadim büyü sanatlarına yatkın zarif elfler.',
    stat_bonuses: { INT: 2, DEX: 1 },
  },
  subclass: {
    id: 'subclass-1',
    name_en: 'Evoker',
    name_tr: 'Çağırıcı',
    key: 'evoker',
    ability_name_en: 'Sculpt Spells',
    ability_name_tr: 'Büyü Şekillendirme',
    ability_desc_en: 'Create pockets of relative safety within the effects of your evocation spells.',
    ability_desc_tr: 'Çağırım büyülerinizin etki alanında güvenli cepler oluşturun.',
    is_low_rate: false,
    is_advanced: false,
    icon_url: null,
    base_stats: { INT: 15, CON: 14, DEX: 13, WIS: 12, STR: 10, CHA: 8 },
  },
};

const mockStats = [
  { id: 's1', character_id: 'char-1', stat_key: 'STR', base_value: 10, bonus_value: 0 },
  { id: 's2', character_id: 'char-1', stat_key: 'DEX', base_value: 14, bonus_value: 1 },
  { id: 's3', character_id: 'char-1', stat_key: 'CON', base_value: 14, bonus_value: 0 },
  { id: 's4', character_id: 'char-1', stat_key: 'INT', base_value: 18, bonus_value: 2 },
  { id: 's5', character_id: 'char-1', stat_key: 'WIS', base_value: 12, bonus_value: 0 },
  { id: 's6', character_id: 'char-1', stat_key: 'CHA', base_value: 10, bonus_value: 0 },
];

const mockTokens = [
  {
    id: 'tok-1',
    campaign_id: 'camp-1',
    character_id: 'char-1',
    x: 240,
    y: 180,
    size: 44,
    color: '#ffd700',
    label: 'Valen',
  },
  {
    id: 'tok-2',
    campaign_id: 'camp-1',
    character_id: null,
    x: 420,
    y: 280,
    size: 44,
    color: '#dc143c',
    label: 'Shadow Dragon',
  },
];

const mockEncounters = [
  {
    id: 'enc-1',
    campaign_id: 'camp-1',
    name: 'Sanctum of the Astral Lich',
    status: 'active',
    round: 3,
    active_combatant_id: 'comb-1',
    notes: 'Magical darkness covers the central dais.',
  },
];

const mockCombatants = [
  {
    id: 'comb-1',
    encounter_id: 'enc-1',
    character_id: 'char-1',
    name: 'Valen Shadowflame',
    initiative: 21,
    hp_current: 34,
    hp_max: 38,
    hp_temp: 5,
    ac: 15,
    is_npc: false,
    is_hidden: false,
    conditions: ['blessed'],
    sort_order: 1,
  },
  {
    id: 'comb-2',
    encounter_id: 'enc-1',
    character_id: null,
    name: 'Astral Lich',
    initiative: 17,
    hp_current: 95,
    hp_max: 135,
    hp_temp: 0,
    ac: 17,
    is_npc: true,
    is_hidden: false,
    conditions: ['flying'],
    sort_order: 2,
  },
];

const mockEnvironments = [
  {
    id: 'env-1',
    campaign_id: 'camp-1',
    weather: 'Arcane Auroras',
    time_of_day: 'Witching Hour',
    ambient_preset: 'Cathedral of Whispers',
    danger_level: 'Deadly',
  },
];

const mockChronicles = [
  {
    id: 'chron-1',
    campaign_id: 'camp-1',
    session_number: 8,
    title: 'The Fall of the Sunken Spire',
    summary: 'The party decoded the runes of Yggdrasil and shattered the Nether Portal.',
    in_game_date: '22nd of Nightal, 1492 DR',
    is_published: true,
    gm_secrets: 'The portal core absorbed part of the necrotic backlash.',
  },
];

const mockLootChests = [
  {
    id: 'loot-1',
    campaign_id: 'camp-1',
    name: 'Vault of the Archmage',
    description: 'An obsidian coffer etched with glowing elven glyphs.',
    is_looted: false,
    gold_amount: 2400,
    items: [
      { name: 'Staff of Arcane Power', rarity: 'legendary', quantity: 1 },
      { name: 'Potion of Supreme Healing', rarity: 'epic', quantity: 3 },
    ],
  },
];

async function captureTarget({ targetName, rootDir, port, suffix }) {
  console.log(`\n==================================================`);
  console.log(`Starting Preview Server for ${targetName} on port ${port}...`);
  console.log(`Root: ${rootDir} | Suffix: ${suffix}`);
  console.log(`==================================================`);

  const server = await preview({
    root: rootDir,
    preview: {
      port,
      host: '127.0.0.1',
    },
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server ready at: ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });

  const routes = [
    { path: '/', name: 'dashboard' },
    { path: '/spells', name: 'spells' },
    { path: '/character', name: 'character' },
    { path: '/inventory', name: 'inventory' },
    { path: '/map', name: 'map' },
    { path: '/gm', name: 'gm' },
  ];

  async function captureForViewport(width, height, prefix) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    // Setup authentic session in localStorage
    await page.addInitScript(({ sessionData }) => {
      window.localStorage.setItem('sb-cpyiinhfcgeqxubzhacw-auth-token', JSON.stringify(sessionData));
      window.localStorage.setItem('dnd_active_character_id', 'char-1');
    }, { sessionData: mockSession });

    // Intercept Supabase API calls
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.includes('supabase.co')) {
        if (url.includes('/auth/v1/user') || url.includes('/auth/v1/session')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockSession.user),
          });
        }
        if (url.includes('/rest/v1/profiles')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockProfile),
          });
        }
        if (url.includes('/rest/v1/campaign_members')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockMembers),
          });
        }
        if (url.includes('/rest/v1/campaigns')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockCampaign),
          });
        }
        if (url.includes('/rest/v1/characters')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockCharacter]),
          });
        }
        if (url.includes('/rest/v1/character_stats')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockStats),
          });
        }
        if (url.includes('/rest/v1/map_tokens')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockTokens),
          });
        }
        if (url.includes('/rest/v1/campaign_encounters')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockEncounters),
          });
        }
        if (url.includes('/rest/v1/encounter_combatants')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockCombatants),
          });
        }
        if (url.includes('/rest/v1/campaign_environments')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockEnvironments),
          });
        }
        if (url.includes('/rest/v1/session_chronicles')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockChronicles),
          });
        }
        if (url.includes('/rest/v1/campaign_loot_chests')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockLootChests),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
      return route.continue();
    });

    for (const r of routes) {
      const fileName = `${prefix}_${r.name}${suffix}.png`;
      console.log(`Capturing ${fileName} ...`);
      await page.goto(`${baseUrl}${r.path}`, { waitUntil: 'domcontentloaded' });
      // Allow dynamic data and animations to settle
      await page.waitForTimeout(1200);

      const filePath = path.join(outDir, fileName);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved ${filePath}`);
    }

    // If mobile, capture off-canvas drawer open state if hamburger exists
    if (prefix === 'mobile') {
      console.log(`Testing mobile drawer for ${targetName}...`);
      await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);

      const hamburgerBtn = page.locator('button[aria-label="Toggle navigation menu"]');
      if (await hamburgerBtn.isVisible()) {
        await hamburgerBtn.click();
        await page.waitForTimeout(600); // Wait for drawer slide transition
        const drawerFileName = `mobile_drawer_open${suffix}.png`;
        const drawerPath = path.join(outDir, drawerFileName);
        await page.screenshot({ path: drawerPath, fullPage: false });
        console.log(`Saved ${drawerPath}`);
      } else {
        console.log(`(Note: Hamburger drawer button not present in ${targetName} - pre-M5 layout)`);
      }
    }

    await context.close();
  }

  console.log(`\n--- Capturing Desktop Screenshots (1280x800) for ${targetName} ---`);
  await captureForViewport(1280, 800, 'desktop');

  console.log(`\n--- Capturing Mobile Screenshots (375x667) for ${targetName} ---`);
  await captureForViewport(375, 667, 'mobile');

  await browser.close();
  server.httpServer.close();
  console.log(`Screenshots for ${targetName} completed!`);
}

async function main() {
  const baselineDir = path.resolve('../dnd-baseline');
  const currentDir = path.resolve('.');

  // 1. Capture BEFORE screenshots from baseline if baseline exists
  if (fs.existsSync(baselineDir)) {
    console.log('Capturing BEFORE screenshots from baseline commit 23e1e9c...');
    await captureTarget({
      targetName: 'Before (Baseline 23e1e9c)',
      rootDir: baselineDir,
      port: 4174,
      suffix: '_before',
    });
  } else {
    console.warn('Baseline directory ../dnd-baseline not found; skipping BEFORE capture.');
  }

  // 2. Capture AFTER screenshots from current working tree
  console.log('\nCapturing AFTER screenshots from current working directory...');
  await captureTarget({
    targetName: 'After (Current State)',
    rootDir: currentDir,
    port: 4173,
    suffix: '_after',
  });

  console.log('\nAll Before and After screenshots captured successfully in docs/screenshots/!');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
