import assert from 'assert';

// Test assignment matching function
function isAssignmentMatch(assign, char) {
  // If assignment specifies a subclass, it MUST match character's subclass
  if (assign.subclass_key && assign.subclass_key !== char.subclassKey) {
    return false;
  }
  // If assignment specifies class category, it MUST match character's class category
  if (assign.class_key && assign.class_key !== char.classCategoryKey) {
    return false;
  }
  // If assignment specifies race, it MUST match character's race
  if (assign.race_key && assign.race_key !== char.raceKey) {
    return false;
  }

  // Must match at least one criterion
  const hasCriteria = Boolean(assign.subclass_key || assign.class_key || assign.race_key);
  if (!hasCriteria) return true;

  if (assign.subclass_key && assign.subclass_key === char.subclassKey) return true;
  if (assign.class_key && assign.class_key === char.classCategoryKey && !assign.subclass_key) return true;
  if (assign.race_key && assign.race_key === char.raceKey && !assign.subclass_key && !assign.class_key) return true;

  return false;
}

// Tree finder
function getMatchingTreeIds(spellTrees, assignments, char) {
  return spellTrees.filter(tree => {
    const treeAssigns = assignments.filter(a => a.spell_tree_id === tree.id);
    if (treeAssigns.length === 0) return false;
    return treeAssigns.some(assign => isAssignmentMatch(assign, char));
  }).map(t => t.id);
}

console.log('--- STARTING GM SPELL MANAGER LOGIC TESTS ---');

const trees = [
  { id: 'tree-fire', name_tr: 'Ateş Büyüsü' },
  { id: 'tree-ice', name_tr: 'Buz Büyüsü' },
  { id: 'tree-general-mage', name_tr: 'Genel Arkana' },
  { id: 'tree-elf', name_tr: 'Elf Kadim Büyüsü' },
  { id: 'tree-warrior', name_tr: 'Savaşçı Teknikleri' }
];

const assignments = [
  { id: 'a1', spell_tree_id: 'tree-fire', class_key: 'mage', subclass_key: 'fire_mage' },
  { id: 'a2', spell_tree_id: 'tree-ice', class_key: 'mage', subclass_key: 'ice_mage' },
  { id: 'a3', spell_tree_id: 'tree-general-mage', class_key: 'mage' },
  { id: 'a4', spell_tree_id: 'tree-elf', race_key: 'elf' },
  { id: 'a5', spell_tree_id: 'tree-warrior', class_key: 'warrior', subclass_key: 'berserker' }
];

// Test 1: Human Fire Mage
{
  const char = {
    classCategoryKey: 'mage',
    subclassKey: 'fire_mage',
    raceKey: 'human'
  };
  const matched = getMatchingTreeIds(trees, assignments, char);
  console.log('Human Fire Mage matched trees:', matched);
  assert.deepStrictEqual(matched.sort(), ['tree-fire', 'tree-general-mage'].sort(), 'Human Fire Mage should match tree-fire and tree-general-mage only');
  console.log('✓ Test 1 Passed: Fire Mage does NOT match Ice Mage or Elf tree');
}

// Test 2: Elf Fire Mage
{
  const char = {
    classCategoryKey: 'mage',
    subclassKey: 'fire_mage',
    raceKey: 'elf'
  };
  const matched = getMatchingTreeIds(trees, assignments, char);
  console.log('Elf Fire Mage matched trees:', matched);
  assert.deepStrictEqual(matched.sort(), ['tree-elf', 'tree-fire', 'tree-general-mage'].sort(), 'Elf Fire Mage should match tree-elf, tree-fire, and tree-general-mage');
  console.log('✓ Test 2 Passed: Racial spell tree matching verified');
}

// Test 3: Berserker Human
{
  const char = {
    classCategoryKey: 'warrior',
    subclassKey: 'berserker',
    raceKey: 'human'
  };
  const matched = getMatchingTreeIds(trees, assignments, char);
  console.log('Berserker matched trees:', matched);
  assert.deepStrictEqual(matched, ['tree-warrior']);
  console.log('✓ Test 3 Passed: Berserker matched tree-warrior');
}

// Test 4: Wall Guard (Warrior but not Berserker)
{
  const char = {
    classCategoryKey: 'warrior',
    subclassKey: 'wall_guard',
    raceKey: 'human'
  };
  const matched = getMatchingTreeIds(trees, assignments, char);
  console.log('Wall Guard matched trees:', matched);
  assert.deepStrictEqual(matched, [], 'Wall Guard should not match Berserker tree');
  console.log('✓ Test 4 Passed: Subclass mismatch correctly excluded');
}

// Test 5: Teach All Spells calculation (filtering already unlocked)
{
  const allSpells = [
    { id: 's1', spell_tree_id: 'tree-fire', name: 'Fireball' },
    { id: 's2', spell_tree_id: 'tree-fire', name: 'Pyroclasm' },
    { id: 's3', spell_tree_id: 'tree-ice', name: 'Frostbolt' }
  ];
  const charSpells = [
    { character_id: 'c1', spell_id: 's1', unlocked: true },
    { character_id: 'c2', spell_id: 's2', unlocked: true }
  ];

  const matchedTreeIds = ['tree-fire'];
  const targetSpells = allSpells.filter(s => matchedTreeIds.includes(s.spell_tree_id));
  const alreadyUnlocked = new Set(charSpells.filter(cs => cs.character_id === 'c1').map(cs => cs.spell_id));
  const toTeach = targetSpells.filter(s => !alreadyUnlocked.has(s.id));

  assert.strictEqual(toTeach.length, 1);
  assert.strictEqual(toTeach[0].id, 's2');
  console.log('✓ Test 5 Passed: Only unlearned eligible spells are taught');
}

// Test 6: Forget All Spells isolation
{
  const charSpells = [
    { character_id: 'c1', spell_id: 's1', unlocked: true },
    { character_id: 'c1', spell_id: 's2', unlocked: true },
    { character_id: 'c2', spell_id: 's3', unlocked: true }
  ];
  const afterForgetC1 = charSpells.filter(cs => cs.character_id !== 'c1');
  assert.strictEqual(afterForgetC1.length, 1);
  assert.strictEqual(afterForgetC1[0].character_id, 'c2');
  console.log('✓ Test 6 Passed: Forgetting c1 spells leaves c2 spells intact');
}

console.log('--- ALL GM SPELL MANAGER TESTS PASSED ---');
