import { chromium } from 'playwright';
import { preview } from 'vite';
import fs from 'fs';
import path from 'path';

async function capture() {
  const server = await preview({ preview: { port: 5185 } });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400 * 30;
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 'gm-user-id', aud: 'authenticated', role: 'authenticated', email: 'eldrin@yggdrasil.realm', exp, iat: now })).toString('base64url');
  const token = header + '.' + payload + '.mock_signature';
  const mockSession = { access_token: token, token_type: 'bearer', expires_in: 86400 * 30, expires_at: exp, refresh_token: 'mock', user: { id: 'gm-user-id', aud: 'authenticated', role: 'authenticated', email: 'eldrin@yggdrasil.realm', app_metadata: { provider: 'email' }, user_metadata: { username: 'Alcyone' } } };

  await page.addInitScript(({ sessionData }) => {
    const s = JSON.stringify(sessionData);
    window.localStorage.setItem('sb-cpyiinhfcgeqxubzhacw-auth-token', s);
    window.localStorage.setItem('sb-placeholder-auth-token', s);
    window.localStorage.setItem('sb-127-auth-token', s);
    window.localStorage.setItem('sb-localhost-auth-token', s);
    window.localStorage.setItem('supabase.auth.token', s);
    window.localStorage.setItem('dnd_active_character_id', 'char-1');
  }, { sessionData: mockSession });

  const mockProfile = { id: 'gm-user-id', username: 'Alcyone', role: 'gm', locale: 'tr', avatar_url: null, created_at: '2026-01-01T00:00:00Z' };
  const mockCampaign = { id: 'c1', name: 'Gölgeler Diyarı', gm_id: 'gm-user-id', created_by: 'gm-user-id', description: 'desc', created_at: '2026-01-01', settings: { fog_radius: 80 } };
  const mockMembers = [{ id: 'm1', campaign_id: 'c1', profile_id: 'gm-user-id', user_id: 'gm-user-id', role: 'gm', campaign: mockCampaign, profile: mockProfile }];
  const mockCharacter = {
    id: 'char-1',
    profile_id: 'gm-user-id',
    campaign_id: 'c1',
    name: 'Valen Shadowflame',
    level: 5,
    xp_total: 6500,
    xp_available: 500,
    race_id: 'r1',
    subclass_id: 'sc1',
    race: { id: 'r1', name: 'Yüksek Elf', tier: { key: 'common' } },
    subclass: { id: 'sc1', name_tr: 'Çağırıcı', name_en: 'Evoker' }
  };

  const mockSpells = [
    { id: 'sp1', spell_key: 'fireball', name_tr: 'Ateş Topu', name_en: 'Fireball', tier: 3, min_level: 5, xp_cost: 300, icon: '🔥', branch: 'Evocation' },
    { id: 'sp2', spell_key: 'magic_missile', name_tr: 'Sihirli Füze', name_en: 'Magic Missile', tier: 1, min_level: 1, xp_cost: 100, icon: '✨', branch: 'Evocation' },
    { id: 'sp3', spell_key: 'shield', name_tr: 'Kalkan', name_en: 'Shield', tier: 1, min_level: 1, xp_cost: 100, icon: '🛡️', branch: 'Abjuration' },
    { id: 'sp4', spell_key: 'teleport', name_tr: 'Işınlanma', name_en: 'Teleport', tier: 4, min_level: 7, xp_cost: 500, icon: '🌀', branch: 'Conjuration' },
    { id: 'sp5', spell_key: 'chain_lightning', name_tr: 'Zincirleme Yıldırım', name_en: 'Chain Lightning', tier: 4, min_level: 7, xp_cost: 600, icon: '⚡', branch: 'Evocation' },
    { id: 'sp6', spell_key: 'cone_of_cold', name_tr: 'Buz Konisi', name_en: 'Cone of Cold', tier: 3, min_level: 5, xp_cost: 350, icon: '❄️', branch: 'Evocation' },
  ];

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/user') || url.includes('/auth/v1/session') || url.includes('/auth/v1/token')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSession) });
    }
    if (url.includes('/rest/v1/profiles')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockProfile]) });
    if (url.includes('/rest/v1/campaigns')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockCampaign]) });
    if (url.includes('/rest/v1/campaign_members')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockMembers) });
    if (url.includes('/rest/v1/characters')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockCharacter]) });
    if (url.includes('/rest/v1/spells')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSpells) });
    if (url.includes('/rest/v1/spell_trees')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'st1', key: 'mage_tree', name_tr: 'Büyücü Ağacı', name_en: 'Mage Tree' }]) });
    if (url.includes('/rest/v1/character_spells')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'cs1', character_id: 'char-1', spell_id: 'sp1', unlocked: true }]) });
    if (url.includes('/rest/v1/')) return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    return route.continue();
  });

  const outDir = 'docs/screenshots_widescreen';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Dashboard
  await page.goto('http://localhost:5185/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'widescreen_dashboard.png') });
  console.log('Saved widescreen_dashboard.png');

  // 2. Character Creation - Step 2 (Race Selector)
  await page.goto('http://localhost:5185/character', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const createTab = page.locator('button:has-text("YENİ MACERACI"), button:has-text("CREATE ADVENTURER")');
  if (await createTab.isVisible()) {
    await createTab.click();
    await page.waitForTimeout(500);
  }
  const demiHumanBtn = page.locator('button:has-text("Yarı-İnsansı")').first();
  if (await demiHumanBtn.isVisible()) {
    await demiHumanBtn.click();
    await page.waitForTimeout(400);
  }
  const nextBtn = page.locator('button:has-text("İleri")').last();
  if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
    await nextBtn.click();
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: path.join(outDir, 'widescreen_character_step2.png') });
  console.log('Saved widescreen_character_step2.png');

  // 3. GM Page with Spell Manager
  await page.goto('http://localhost:5185/gm', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const spellsGmTab = page.locator('button:has-text("Büyüler"), button:has-text("Spells")').first();
  if (await spellsGmTab.isVisible()) {
    await spellsGmTab.click();
    await page.waitForTimeout(500);
  }
  const playerSpellsTab = page.locator('button:has-text("Oyuncu Büyüleri"), button:has-text("Player Spells")').first();
  if (await playerSpellsTab.isVisible()) {
    await playerSpellsTab.click();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(outDir, 'widescreen_gm_spells.png') });
  console.log('Saved widescreen_gm_spells.png');

  // 4. Inventory Page
  await page.goto('http://localhost:5185/inventory', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, 'widescreen_inventory.png') });
  console.log('Saved widescreen_inventory.png');

  await browser.close();
  server.httpServer.close();
  console.log('All widescreen captures complete!');
}

capture().catch(console.error);
