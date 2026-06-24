import assert from 'assert';

// ==========================================
// 1. MOCK DATA DEFINITIONS
// ==========================================

const MOCK_SPELLS = [
  {
    id: 'spell-magic-missile',
    spell_tree_id: 'tree-arcane',
    spell_key: 'magic_missile',
    name_en: 'Magic Missile',
    name_tr: 'Sihirli Füze',
    school: 'evocation',
    xp_cost: 100,
    tier: 1,
    prerequisites: [],
  },
  {
    id: 'spell-shield',
    spell_tree_id: 'tree-arcane',
    spell_key: 'shield',
    name_en: 'Shield',
    name_tr: 'Kalkan',
    school: 'abjuration',
    xp_cost: 100,
    tier: 1,
    prerequisites: [],
  },
  {
    id: 'spell-misty-step',
    spell_tree_id: 'tree-arcane',
    spell_key: 'misty_step',
    name_en: 'Misty Step',
    name_tr: 'Sisli Adım',
    school: 'conjuration',
    xp_cost: 200,
    tier: 2,
    prerequisites: ['shield'],
  },
  {
    id: 'spell-fireball',
    spell_tree_id: 'tree-arcane',
    spell_key: 'fireball',
    name_en: 'Fireball',
    name_tr: 'Alev Topu',
    school: 'evocation',
    xp_cost: 300,
    tier: 3,
    prerequisites: ['magic_missile', 'misty_step'],
  },
  {
    id: 'spell-divine-smite',
    spell_tree_id: 'tree-divine',
    spell_key: 'divine_smite',
    name_en: 'Divine Smite',
    name_tr: 'İlahi Darbe',
    school: 'evocation',
    xp_cost: 150,
    tier: 1,
    prerequisites: [],
  }
];

const MOCK_SPELL_TREES = [
  {
    id: 'tree-arcane',
    name_en: 'Arcane Weave',
    name_tr: 'Arkana Örgüsü',
    assignments: [
      {
        id: 'assign-1',
        spell_tree_id: 'tree-arcane',
        class_key: 'mage',
        min_level: 1
      }
    ]
  },
  {
    id: 'tree-divine',
    name_en: 'Divine Power',
    name_tr: 'İlahi Güç',
    assignments: [
      {
        id: 'assign-2',
        spell_tree_id: 'tree-divine',
        class_key: 'cleric',
        min_level: 3
      }
    ]
  },
  {
    id: 'tree-general',
    name_en: 'General Magic',
    name_tr: 'Genel Büyü',
    assignments: [] // No assignments - visible to all
  }
];

// ==========================================
// 2. CORE IMPLEMENTATIONS (FILTERING & PATHS)
// ==========================================

function filterSpellTrees(spellTrees, character) {
  const classCategoryKey = character.subclass?.category?.key;
  const subclassKey = character.subclass?.key;
  const raceKey = character.race?.key;

  return spellTrees.filter(tree => {
    if (!tree.assignments || tree.assignments.length === 0) {
      return true;
    }
    return tree.assignments.some(assign => {
      if (character.level < (assign.min_level ?? 1)) {
        return false;
      }
      if (assign.class_key && classCategoryKey !== assign.class_key) {
        return false;
      }
      if (assign.subclass_key && subclassKey !== assign.subclass_key) {
        return false;
      }
      if (assign.race_key && raceKey !== assign.race_key) {
        return false;
      }
      return true;
    });
  });
}

function filterSpells(spells, visibleTrees) {
  const visibleTreeIds = new Set(visibleTrees.map(t => t.id));
  return spells.filter(spell => visibleTreeIds.has(spell.spell_tree_id));
}

function getSpellStatus(spell, character, unlockedSpellKeys) {
  if (unlockedSpellKeys.has(spell.spell_key)) {
    return 'unlocked';
  }

  // Level prerequisite check
  const level = character.level ?? 1;
  const levelPrereq = spell.level_prerequisite ?? spell.min_level ?? 0;
  if (level < levelPrereq) {
    return 'locked';
  }

  // Prerequisites check
  if (spell.prerequisites && spell.prerequisites.length > 0) {
    const allPrereqsMet = spell.prerequisites.every(prereqKey => unlockedSpellKeys.has(prereqKey));
    if (!allPrereqsMet) {
      return 'locked';
    }
  }

  // XP check
  const xpAvailable = character.xp_available ?? 0;
  if (xpAvailable < spell.xp_cost) {
    return 'locked';
  }

  return 'unlockable';
}

function getActivePathIds(selectedId, visibleSpells) {
  const activeIds = new Set();
  activeIds.add(selectedId);

  const selectedSpell = visibleSpells.find(s => s.id === selectedId);
  if (!selectedSpell) return activeIds;

  // Recursively add ancestors
  const addAncestors = (spellKey) => {
    const spell = visibleSpells.find(s => s.spell_key === spellKey);
    if (!spell) return;
    if (activeIds.has(spell.id)) return; // Safeguard against cycle
    activeIds.add(spell.id);
    if (spell.prerequisites) {
      spell.prerequisites.forEach(preKey => addAncestors(preKey));
    }
  };

  if (selectedSpell.prerequisites) {
    selectedSpell.prerequisites.forEach(preKey => addAncestors(preKey));
  }

  // Recursively add descendants
  const addDescendants = (spellKey) => {
    const children = visibleSpells.filter(
      s => s.prerequisites && s.prerequisites.includes(spellKey)
    );
    children.forEach(child => {
      if (activeIds.has(child.id)) return; // Safeguard against cycle
      activeIds.add(child.id);
      addDescendants(child.spell_key);
    });
  };

  addDescendants(selectedSpell.spell_key);

  return activeIds;
}

// ==========================================
// 3. UNIT TESTS SUITE
// ==========================================

console.log('--- STARTING SPELL TREE UNIT TESTS ---');

// Test Case 1: Filtering logic for Mage Level 1
try {
  const characterMageLvl1 = {
    level: 1,
    xp_available: 500,
    subclass: {
      key: 'wizard',
      category: { key: 'mage' }
    },
    race: { key: 'human' }
  };

  const visibleTrees = filterSpellTrees(MOCK_SPELL_TREES, characterMageLvl1);
  const visibleSpells = filterSpells(MOCK_SPELLS, visibleTrees);

  // tree-arcane has class_key: 'mage', min_level: 1 -> visible
  // tree-divine has class_key: 'cleric', min_level: 3 -> filtered out
  // tree-general has no assignments -> visible
  assert.ok(visibleTrees.some(t => t.id === 'tree-arcane'));
  assert.ok(!visibleTrees.some(t => t.id === 'tree-divine'));
  assert.ok(visibleTrees.some(t => t.id === 'tree-general'));

  // Spells in tree-arcane should be visible
  assert.ok(visibleSpells.some(s => s.id === 'spell-magic-missile'));
  // Spells in tree-divine should NOT be visible (filtered out)
  assert.ok(!visibleSpells.some(s => s.id === 'spell-divine-smite'));

  console.log('✓ Test Case 1: Filtering logic (Mage Level 1) passed.');
} catch (err) {
  console.error('✗ Test Case 1 failed:', err);
  process.exit(1);
}

// Test Case 2: Filtering logic for Cleric Level 2 vs Level 3
try {
  const characterClericLvl2 = {
    level: 2,
    xp_available: 500,
    subclass: {
      key: 'priest',
      category: { key: 'cleric' }
    },
    race: { key: 'dwarf' }
  };

  const characterClericLvl3 = {
    level: 3,
    xp_available: 500,
    subclass: {
      key: 'priest',
      category: { key: 'cleric' }
    },
    race: { key: 'dwarf' }
  };

  const visibleTreesLvl2 = filterSpellTrees(MOCK_SPELL_TREES, characterClericLvl2);
  const visibleTreesLvl3 = filterSpellTrees(MOCK_SPELL_TREES, characterClericLvl3);

  // Level 2 cleric does not satisfy min_level = 3 of tree-divine
  assert.ok(!visibleTreesLvl2.some(t => t.id === 'tree-divine'));

  // Level 3 cleric satisfies min_level = 3 of tree-divine
  assert.ok(visibleTreesLvl3.some(t => t.id === 'tree-divine'));

  console.log('✓ Test Case 2: Filtering logic (Level check) passed.');
} catch (err) {
  console.error('✗ Test Case 2 failed:', err);
  process.exit(1);
}

// Test Case 3: Spell Status: Locked vs Unlockable vs Unlocked
try {
  const character = {
    level: 5,
    xp_available: 150,
  };

  const unlockedKeys = new Set(['shield']);

  // magic_missile: no prerequisites, xp_cost = 100, xp_available = 150 -> unlockable
  const statusMM = getSpellStatus(MOCK_SPELLS.find(s => s.spell_key === 'magic_missile'), character, unlockedKeys);
  assert.strictEqual(statusMM, 'unlockable');

  // shield: in unlockedKeys -> unlocked
  const statusShield = getSpellStatus(MOCK_SPELLS.find(s => s.spell_key === 'shield'), character, unlockedKeys);
  assert.strictEqual(statusShield, 'unlocked');

  // misty_step: prerequisite 'shield' (unlocked), xp_cost = 200, xp_available = 150 -> locked (due to XP)
  const statusMisty = getSpellStatus(MOCK_SPELLS.find(s => s.spell_key === 'misty_step'), character, unlockedKeys);
  assert.strictEqual(statusMisty, 'locked');

  // fireball: prerequisites 'magic_missile' & 'misty_step' (not unlocked) -> locked
  const statusFireball = getSpellStatus(MOCK_SPELLS.find(s => s.spell_key === 'fireball'), character, unlockedKeys);
  assert.strictEqual(statusFireball, 'locked');

  console.log('✓ Test Case 3: Spell status determination passed.');
} catch (err) {
  console.error('✗ Test Case 3 failed:', err);
  process.exit(1);
}

// Test Case 4: Recursive Path Tracking (Ancestors and Descendants)
try {
  // Select 'fireball' which has prerequisites 'magic_missile' and 'misty_step'. 'misty_step' requires 'shield'.
  // Ancestors of fireball: magic_missile, misty_step, shield.
  // Descendants of shield: misty_step, fireball.
  const activeIds = getActivePathIds('spell-fireball', MOCK_SPELLS);

  assert.ok(activeIds.has('spell-fireball'));
  assert.ok(activeIds.has('spell-magic-missile'));
  assert.ok(activeIds.has('spell-misty-step'));
  assert.ok(activeIds.has('spell-shield'));

  console.log('✓ Test Case 4: Recursive path tracking passed.');
} catch (err) {
  console.error('✗ Test Case 4 failed:', err);
  process.exit(1);
}

// Test Case 5: Cycle Safeguarding
try {
  // Introduce a cycle: A -> B -> A
  const cyclicalSpells = [
    {
      id: 'spell-a',
      spell_key: 'spell_a',
      prerequisites: ['spell_b']
    },
    {
      id: 'spell-b',
      spell_key: 'spell_b',
      prerequisites: ['spell_a']
    }
  ];

  // This should not hang/infinite-loop, and return a set containing both A and B
  const activeIds = getActivePathIds('spell-a', cyclicalSpells);
  
  assert.ok(activeIds.has('spell-a'));
  assert.ok(activeIds.has('spell-b'));
  assert.strictEqual(activeIds.size, 2);

  console.log('✓ Test Case 5: Cycle safeguarding passed.');
} catch (err) {
  console.error('✗ Test Case 5 failed:', err);
  process.exit(1);
}

// Test Case 6: Mock Fallback Trigger Behavior
try {
  const errorsToTest = [
    new Error('relation "public.spell_trees" does not exist'),
    new Error('schema cache lookup failed')
  ];

  errorsToTest.forEach(err => {
    const errMsg = err.message;
    const isRelationOrCacheError = errMsg.includes('relation not found') || 
                                   errMsg.includes('relation "') || 
                                   errMsg.includes('schema cache');
    assert.ok(isRelationOrCacheError, `Error message "${errMsg}" should trigger fallback`);
  });

  console.log('✓ Test Case 6: Mock fallback trigger check passed.');
} catch (err) {
  console.error('✗ Test Case 6 failed:', err);
  process.exit(1);
}

console.log('--- ALL UNIT TESTS PASSED SUCCESSFULLY ---');
process.exit(0);
