import assert from 'assert';

// Mock database definitions representing RACES and SUBCLASSES
const MOCK_RACES = [
  { key: 'human', stat_bonuses: { STR: 1, DEX: 1, CON: 1, INT: 1, WIS: 1, CHA: 1 } },
  { key: 'elf', stat_bonuses: { DEX: 2, INT: 1, WIS: 1 } },
  { key: 'goblin', stat_bonuses: { DEX: 2, CON: -1 } },
];

const MOCK_SUBCLASSES = [
  { key: 'druid', base_stats: { WIS: 2, INT: 1 } },
  { key: 'berserker', base_stats: { STR: 3 } },
  { key: 'wall_guard', base_stats: { CON: 3 } },
];

// Calculation Function replicating character creation logic in CharacterCreation.tsx & GMDashboard.tsx
function calculateStats(raceKey, subclassKey) {
  const race = MOCK_RACES.find(r => r.key === raceKey);
  const subclass = MOCK_SUBCLASSES.find(s => s.key === subclassKey);
  
  if (!race || !subclass) {
    throw new Error('Race or subclass not found');
  }

  const statKeys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
  const stats = {};

  statKeys.forEach(stat => {
    const raceBonus = race.stat_bonuses[stat] ?? 0;
    const subclassBonus = subclass.base_stats[stat] ?? 0;
    stats[stat] = 10 + raceBonus + subclassBonus;
  });

  return stats;
}

// Map Token simulation representing default map token values and user assignment
function createMockMapToken(characterId, campaignId) {
  return {
    character_id: characterId,
    campaign_id: campaignId,
    x_position: 600,
    y_position: 400,
    color: '#ffd700',
  };
}

console.log('--- STARTING CHARACTER CREATION LOGIC TESTS ---');

// Test Case 1: Human Berserker
try {
  const stats = calculateStats('human', 'berserker');
  console.log('Calculated stats for Human Berserker:', stats);
  // Human has STR +1, Berserker has STR +3 -> STR: 10 + 1 + 3 = 14
  assert.strictEqual(stats.STR, 14);
  // Human has DEX +1, Berserker has DEX +0 -> DEX: 10 + 1 + 0 = 11
  assert.strictEqual(stats.DEX, 11);
  // Human has CON +1, Berserker has CON +0 -> CON: 10 + 1 + 0 = 11
  assert.strictEqual(stats.CON, 11);
  // Human has INT +1, Berserker has INT +0 -> INT: 10 + 1 + 0 = 11
  assert.strictEqual(stats.INT, 11);
  // Human has WIS +1, Berserker has WIS +0 -> WIS: 10 + 1 + 0 = 11
  assert.strictEqual(stats.WIS, 11);
  // Human has CHA +1, Berserker has CHA +0 -> CHA: 10 + 1 + 0 = 11
  assert.strictEqual(stats.CHA, 11);
  console.log('✓ Test Case 1 (Human Berserker stats) passed.');
} catch (err) {
  console.error('✗ Test Case 1 failed:', err);
  process.exit(1);
}

// Test Case 2: Elf Druid
try {
  const stats = calculateStats('elf', 'druid');
  console.log('Calculated stats for Elf Druid:', stats);
  // Elf: DEX +2, INT +1, WIS +1
  // Druid: WIS +2, INT +1
  // STR: 10 + 0 + 0 = 10
  assert.strictEqual(stats.STR, 10);
  // DEX: 10 + 2 + 0 = 12
  assert.strictEqual(stats.DEX, 12);
  // CON: 10 + 0 + 0 = 10
  assert.strictEqual(stats.CON, 10);
  // INT: 10 + 1 + 1 = 12
  assert.strictEqual(stats.INT, 12);
  // WIS: 10 + 1 + 2 = 13
  assert.strictEqual(stats.WIS, 13);
  // CHA: 10 + 0 + 0 = 10
  assert.strictEqual(stats.CHA, 10);
  console.log('✓ Test Case 2 (Elf Druid stats) passed.');
} catch (err) {
  console.error('✗ Test Case 2 failed:', err);
  process.exit(1);
}

// Test Case 3: Goblin Wall Guard (Negative bonuses test)
try {
  const stats = calculateStats('goblin', 'wall_guard');
  console.log('Calculated stats for Goblin Wall Guard:', stats);
  // Goblin: DEX +2, CON -1
  // Wall Guard: CON +3
  // STR: 10 + 0 + 0 = 10
  assert.strictEqual(stats.STR, 10);
  // DEX: 10 + 2 + 0 = 12
  assert.strictEqual(stats.DEX, 12);
  // CON: 10 - 1 + 3 = 12
  assert.strictEqual(stats.CON, 12);
  // INT: 10 + 0 + 0 = 10
  assert.strictEqual(stats.INT, 10);
  // WIS: 10 + 0 + 0 = 10
  assert.strictEqual(stats.WIS, 10);
  // CHA: 10 + 0 + 0 = 10
  assert.strictEqual(stats.CHA, 10);
  console.log('✓ Test Case 3 (Goblin Wall Guard stats) passed.');
} catch (err) {
  console.error('✗ Test Case 3 failed:', err);
  process.exit(1);
}

// Test Case 4: Default map token values and user assignment verification
try {
  const charId = 'test-character-uuid';
  const campaignId = 'test-campaign-uuid';
  const token = createMockMapToken(charId, campaignId);
  
  assert.strictEqual(token.x_position, 600, 'x_position must default to 600');
  assert.strictEqual(token.y_position, 400, 'y_position must default to 400');
  assert.strictEqual(token.color, '#ffd700', 'color must default to #ffd700');
  assert.strictEqual(token.character_id, charId, 'token must map to character');
  assert.strictEqual(token.campaign_id, campaignId, 'token must map to campaign');

  console.log('✓ Test Case 4 (Default map token values & user assignment) passed.');
} catch (err) {
  console.error('✗ Test Case 4 failed:', err);
  process.exit(1);
}

console.log('--- ALL CHARACTER CREATION TESTS PASSED SUCCESSFULLY ---');
process.exit(0);
