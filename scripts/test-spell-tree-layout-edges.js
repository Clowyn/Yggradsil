import assert from 'assert';

// Replicate constants for testing, matches src/lib/constants.ts
const CLASS_CATEGORIES = [
  { key: 'mage', name_tr: 'Büyücü', name_en: 'Mage', icon_url: null, sort_order: 1 },
  { key: 'warrior', name_tr: 'Savaşçı', name_en: 'Warrior', icon_url: null, sort_order: 2 },
  { key: 'tank', name_tr: 'Tank', name_en: 'Tank', icon_url: null, sort_order: 3 },
  { key: 'neutral', name_tr: 'Tarafsız', name_en: 'Neutral', icon_url: null, sort_order: 4 },
  { key: 'assassin', name_tr: 'Suikastçı', name_en: 'Assassin', icon_url: null, sort_order: 5 },
  { key: 'marksman', name_tr: 'Nişancı', name_en: 'Marksman', icon_url: null, sort_order: 6 },
  { key: 'crafting', name_tr: 'Üretim', name_en: 'Crafting', icon_url: null, sort_order: 7 },
  { key: 'summoner', name_tr: 'Çağırıcı', name_en: 'Summoner', icon_url: null, sort_order: 8 },
];

const SUBCLASSES = [
  { category_key: 'mage', key: 'druid', name_tr: 'Druid', name_en: 'Druid', ability_name_en: 'Breath of Nature', ability_desc_en: 'Turns your surroundings into a forest.' },
  { category_key: 'mage', key: 'blood_mage', name_tr: 'Kan Büyücüsü', name_en: 'Blood Mage', ability_name_en: 'Magical Blood', ability_desc_en: 'Drains life / HP steal.' },
];

const BRANCH_COLORS = {
  Offense: '#ef4444',
  Defense: '#3b82f6',
  Utility: '#10b981',
  Ultimate: '#eab308',
  Base: '#8b5cf6',
};

const TREE_SPACING = 2500;
const SUBCLASS_Y = 250;

// Replicate calculateSpellCoordinates from useSpellTree.ts
function calculateSpellCoordinates(spells) {
  const positions = {};

  // Determine unique primary branches deterministically
  const allBranches = Array.from(
    new Set(spells.map((s) => s.branch).filter(Boolean))
  );
  const primaryBranches = allBranches
    .filter((b) => !['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(b))
    .sort();

  const k = primaryBranches.length;
  const colMap = {};
  primaryBranches.forEach((b, idx) => {
    colMap[b] = idx - (k - 1) / 2;
  });

  const getCol = (branch) => {
    if (!branch || ['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(branch)) {
      return 0;
    }
    const parts = branch.split(',').map((x) => x.trim());
    let sum = 0;
    let count = 0;
    parts.forEach((p) => {
      if (p in colMap) {
        sum += colMap[p];
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  };

  // Compute intra-tier topological depth with cycle detection
  const depthMap = {};
  const visiting = new Set();

  const getDepth = (spellKey) => {
    if (spellKey in depthMap) return depthMap[spellKey];
    if (visiting.has(spellKey)) return 0;
    visiting.add(spellKey);

    const s = spells.find((x) => x.spell_key === spellKey);
    if (!s) {
      visiting.delete(spellKey);
      return 0;
    }
    if (!s.prerequisites || s.prerequisites.length === 0) {
      visiting.delete(spellKey);
      depthMap[spellKey] = 0;
      return 0;
    }
    let maxD = 0;
    s.prerequisites.forEach((pKey) => {
      const parent = spells.find((x) => x.spell_key === pKey);
      if (parent && parent.tier === s.tier) {
        maxD = Math.max(maxD, getDepth(pKey) + 1);
      }
    });
    visiting.delete(spellKey);
    depthMap[spellKey] = maxD;
    return maxD;
  };

  // Dynamic Layout Spacing Constants
  const ROW_HEIGHT = 180;
  const TIER_GAP = 220;
  const Y_OFFSET = 120;

  // Group spells by tier and calculate max depths for each tier
  const maxDepthByTier = {};
  const tiersSet = new Set();
  spells.forEach((s) => {
    const tier = s.tier;
    tiersSet.add(tier);
    const d = getDepth(s.spell_key);
    maxDepthByTier[tier] = Math.max(maxDepthByTier[tier] || 0, d);
  });

  // Sort the unique tiers ascending
  const uniqueTiers = Array.from(tiersSet).sort((a, b) => a - b);

  // Compute starting Y position for each tier dynamically
  const tierStartY = {};
  let currentY = Y_OFFSET;
  
  uniqueTiers.forEach((tier) => {
    tierStartY[tier] = currentY;
    const maxDepth = maxDepthByTier[tier] || 0;
    currentY += (maxDepth * ROW_HEIGHT) + TIER_GAP;
  });

  // Group spells by their calculated Y coordinate
  const levelsMap = {};
  spells.forEach((s) => {
    const d = getDepth(s.spell_key);
    const y = tierStartY[s.tier] + d * ROW_HEIGHT;

    if (!levelsMap[y]) {
      levelsMap[y] = [];
    }
    levelsMap[y].push(s);
  });

  // Position spells on each Y level horizontally, sorted by column
  Object.entries(levelsMap).forEach(([yStr, levelSpells]) => {
    const y = parseFloat(yStr);
    const M = levelSpells.length;

    const getSortKey = (s) => {
      if (!s.prerequisites || s.prerequisites.length === 0) {
        return getCol(s.branch);
      }
      let sum = 0;
      let count = 0;
      s.prerequisites.forEach((pKey) => {
        const parent = spells.find((x) => x.spell_key === pKey);
        if (parent) {
          sum += getCol(parent.branch);
          count++;
        }
      });
      return count > 0 ? sum / count : getCol(s.branch);
    };

    const sortedSpells = [...levelSpells].sort((a, b) => {
      const colA = getCol(a.branch);
      const colB = getCol(b.branch);
      if (colA !== colB) return colA - colB;

      const skA = getSortKey(a);
      const skB = getSortKey(b);
      if (skA !== skB) return skA - skB;

      return a.spell_key.localeCompare(b.spell_key);
    });

    const X_GAP = Math.max(135, Math.min(180, 1400 / Math.max(M - 1, 1)));
    sortedSpells.forEach((s, idx) => {
      const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
      positions[s.spell_key] = { x, y };
    });
  });

  return positions;
}

// Replicate Node & Edge Generation Logic
function generateNodesAndEdges(effectiveCharacter, spells, visibleTrees, unlockedSpellKeys) {
  if (!effectiveCharacter) return { nodes: [], edges: [] };

  const classCategoryKey = effectiveCharacter.subclass?.category?.key;
  const subclassKey = effectiveCharacter.subclass?.key;

  const activeSubclasses = SUBCLASSES.filter(sub => sub.category_key === classCategoryKey);

  const classNodes = CLASS_CATEGORIES.filter(c => c.key === classCategoryKey).map((cls) => ({
    id: `class-${cls.key}`,
    type: 'spellNode',
    position: { x: 0, y: 0 },
    data: {
      spell: {
        id: `class-${cls.key}`,
        spell_key: `class_${cls.key}`,
        name_en: cls.name_en,
        name_tr: cls.name_tr,
        icon: '👑',
        branch: 'Base',
        tier: 0,
        min_level: 0,
        xp_cost: 0,
        description_en: 'Class Root',
        description_tr: 'Sınıf Kökü',
      },
      status: 'unlocked',
      nodeColor: '#ffd700',
      isDimmed: false,
      isActiveSubclassTree: true,
    },
  }));

  const subclassNodes = activeSubclasses.map((sub) => {
    const sibIdx = activeSubclasses.findIndex(s => s.key === sub.key);
    const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
    const subclassY = SUBCLASS_Y;
    const isCharacterSubclass = sub.key === subclassKey;

    return {
      id: `subclass-${sub.key}`,
      type: 'spellNode',
      position: { x: subclassX, y: subclassY },
      data: {
        spell: {
          id: `subclass-${sub.key}`,
          spell_key: `subclass_${sub.key}`,
          name_en: sub.name_en,
          name_tr: sub.name_tr,
          icon: '⚔️',
          branch: 'Base',
          tier: 0,
          min_level: 0,
          xp_cost: 0,
          description_en: sub.ability_desc_en,
          description_tr: sub.ability_desc_tr,
        },
        status: 'unlocked',
        nodeColor: isCharacterSubclass ? '#ffd700' : '#c0c0c0',
        isDimmed: !isCharacterSubclass,
        isActiveSubclassTree: isCharacterSubclass,
      },
    };
  });

  const spellNodes = [];
  const spellsByTree = {};
  spells.forEach(spell => {
    if (!spellsByTree[spell.spell_tree_id]) {
      spellsByTree[spell.spell_tree_id] = [];
    }
    spellsByTree[spell.spell_tree_id].push(spell);
  });

  Object.values(spellsByTree).forEach((spellsInTree) => {
    const relativePositions = calculateSpellCoordinates(spellsInTree);
    
    spellsInTree.forEach(spell => {
      const status = unlockedSpellKeys.has(spell.spell_key) ? 'unlocked' : 'locked';
      const nodeColor = BRANCH_COLORS[spell.branch || 'Base'] || '#3b82f6';
      
      const relPos = relativePositions[spell.spell_key] || { x: 0, y: 0 };
      let spellX = relPos.x;
      let spellY = relPos.y;
      let isDimmed = false;
      let isActiveSubclassTree = false;
      
      const tree = visibleTrees.find(t => t.id === spell.spell_tree_id);
      if (tree && tree.assignments) {
        const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || 
                       tree.assignments.find(a => a.class_key === classCategoryKey) || 
                       tree.assignments[0];
        if (assign && assign.subclass_key) {
          const sibIdx = activeSubclasses.findIndex(s => s.key === assign.subclass_key);
          if (sibIdx !== -1) {
            const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
            const subclassY = SUBCLASS_Y;
            spellX += subclassX;
            spellY += subclassY;
          }
          const isCharacterSubclass = assign.subclass_key === subclassKey;
          isDimmed = !isCharacterSubclass;
          isActiveSubclassTree = isCharacterSubclass;
        } else if (assign && assign.class_key) {
          spellY += SUBCLASS_Y;
          isDimmed = false;
          isActiveSubclassTree = true;
        }
      }
      
      spellNodes.push({
        id: spell.id,
        type: 'spellNode',
        position: { x: spellX, y: spellY },
        data: {
          spell,
          status,
          nodeColor,
          isDimmed,
          isActiveSubclassTree,
        },
      });
    });
  });

  const resultEdges = [];
  spells.forEach(spell => {
    if (spell.prerequisites && spell.prerequisites.length > 0) {
      spell.prerequisites.forEach(prereqKey => {
        const parentSpell = spells.find(s => s.spell_key === prereqKey);
        if (!parentSpell) return;

        const parentStatus = unlockedSpellKeys.has(parentSpell.spell_key) ? 'unlocked' : 'locked';
        const childStatus = unlockedSpellKeys.has(spell.spell_key) ? 'unlocked' : 'locked';

        let edgeStatus = 'locked';
        if (parentStatus === 'unlocked' && childStatus === 'unlocked') {
          edgeStatus = 'unlocked';
        }

        const nodeColor = BRANCH_COLORS[spell.branch || 'Base'] || '#3b82f6';

        resultEdges.push({
          id: `edge-${parentSpell.id}-${spell.id}`,
          source: parentSpell.id,
          target: spell.id,
          type: 'spellEdge',
          data: {
            status: edgeStatus,
            color: nodeColor,
          },
        });
      });
    }
  });

  const classSubclassEdges = activeSubclasses.map(sub => ({
    id: `edge-class-${sub.category_key}-subclass-${sub.key}`,
    source: `class-${sub.category_key}`,
    target: `subclass-${sub.key}`,
    type: 'spellEdge',
    data: { status: 'unlocked', color: '#ffd700' },
  }));

  const subclassSpellEdges = [];
  spells.forEach(spell => {
    if (!spell.prerequisites || spell.prerequisites.length === 0) {
      const tree = visibleTrees.find(t => t.id === spell.spell_tree_id);
      if (tree && tree.assignments) {
        const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || tree.assignments.find(a => a.class_key === classCategoryKey) || tree.assignments[0];
        if (assign) {
          const sourceId = assign.subclass_key 
            ? `subclass-${assign.subclass_key}` 
            : `class-${assign.class_key}`;
          
          subclassSpellEdges.push({
            id: `edge-${sourceId}-spell-${spell.id}`,
            source: sourceId,
            target: spell.id,
            type: 'spellEdge',
            data: { 
              status: unlockedSpellKeys.has(spell.spell_key) ? 'unlocked' : 'locked', 
              color: '#c0c0c0' 
            },
          });
        }
      }
    }
  });

  return {
    nodes: [...classNodes, ...subclassNodes, ...spellNodes],
    edges: [...classSubclassEdges, ...subclassSpellEdges, ...resultEdges]
  };
}

// Validation helper to check for NaN, Infinity, and invalid coordinate values
function validateLayoutResult(result, caseName) {
  const { nodes, edges } = result;

  nodes.forEach(node => {
    const { x, y } = node.position;
    assert.ok(typeof x === 'number' && !isNaN(x) && isFinite(x), `${caseName}: node ${node.id} has invalid X coordinate: ${x}`);
    assert.ok(typeof y === 'number' && !isNaN(y) && isFinite(y), `${caseName}: node ${node.id} has invalid Y coordinate: ${y}`);
    assert.ok(node.id, `${caseName}: node has missing ID`);
  });

  edges.forEach(edge => {
    assert.ok(edge.id, `${caseName}: edge has missing ID`);
    assert.ok(edge.source, `${caseName}: edge has missing source`);
    assert.ok(edge.target, `${caseName}: edge has missing target`);
  });

  console.log(`✓ ${caseName} passed validation: ${nodes.length} nodes, ${edges.length} edges.`);
}

console.log('--- STARTING LAYOUT EDGE CASE TESTS ---');

// Edge Case 1: 0 Spells (Empty Tree)
try {
  const character = {
    id: 'char-1',
    level: 5,
    subclass: {
      key: 'blood_mage',
      category: { key: 'mage' }
    }
  };
  const spells = [];
  const visibleTrees = [];
  const unlocked = new Set();

  const result = generateNodesAndEdges(character, spells, visibleTrees, unlocked);
  validateLayoutResult(result, 'Edge Case 1 (0 Spells)');
} catch (err) {
  console.error('✗ Edge Case 1 failed:', err);
  process.exit(1);
}

// Edge Case 2: 1 Spell
try {
  const character = {
    id: 'char-1',
    level: 5,
    subclass: {
      key: 'blood_mage',
      category: { key: 'mage' }
    }
  };
  const spells = [{
    id: 'spell-1',
    spell_tree_id: 'tree-1',
    spell_key: 'spell_one',
    branch: 'Offense',
    tier: 1,
    prerequisites: []
  }];
  const visibleTrees = [{
    id: 'tree-1',
    assignments: [{ subclass_key: 'blood_mage' }]
  }];
  const unlocked = new Set();

  const result = generateNodesAndEdges(character, spells, visibleTrees, unlocked);
  validateLayoutResult(result, 'Edge Case 2 (1 Spell)');
} catch (err) {
  console.error('✗ Edge Case 2 failed:', err);
  process.exit(1);
}

// Edge Case 3: Missing subclass
try {
  const character = {
    id: 'char-1',
    level: 5,
    subclass: null // Missing subclass
  };
  const spells = [{
    id: 'spell-1',
    spell_tree_id: 'tree-1',
    spell_key: 'spell_one',
    branch: 'Offense',
    tier: 1,
    prerequisites: []
  }];
  const visibleTrees = [{
    id: 'tree-1',
    assignments: [{ class_key: 'mage' }]
  }];
  const unlocked = new Set();

  const result = generateNodesAndEdges(character, spells, visibleTrees, unlocked);
  validateLayoutResult(result, 'Edge Case 3 (Missing Subclass)');
} catch (err) {
  console.error('✗ Edge Case 3 failed:', err);
  process.exit(1);
}

// Edge Case 4: Missing class category
try {
  const character = {
    id: 'char-1',
    level: 5,
    subclass: {
      key: 'blood_mage',
      category: null // Missing class category
    }
  };
  const spells = [{
    id: 'spell-1',
    spell_tree_id: 'tree-1',
    spell_key: 'spell_one',
    branch: 'Offense',
    tier: 1,
    prerequisites: []
  }];
  const visibleTrees = [{
    id: 'tree-1',
    assignments: [{ subclass_key: 'blood_mage' }]
  }];
  const unlocked = new Set();

  const result = generateNodesAndEdges(character, spells, visibleTrees, unlocked);
  validateLayoutResult(result, 'Edge Case 4 (Missing Class Category)');
} catch (err) {
  console.error('✗ Edge Case 4 failed:', err);
  process.exit(1);
}

// Edge Case 5: Tier outside bounds (e.g. tier 0 or tier 6)
try {
  const character = {
    id: 'char-1',
    level: 5,
    subclass: {
      key: 'blood_mage',
      category: { key: 'mage' }
    }
  };
  const spells = [
    {
      id: 'spell-tier-0',
      spell_tree_id: 'tree-1',
      spell_key: 'spell_tier_0',
      branch: 'Offense',
      tier: 0, // Tier 0
      prerequisites: []
    },
    {
      id: 'spell-tier-6',
      spell_tree_id: 'tree-1',
      spell_key: 'spell_tier_6',
      branch: 'Defense',
      tier: 6, // Tier 6
      prerequisites: []
    }
  ];
  const visibleTrees = [{
    id: 'tree-1',
    assignments: [{ subclass_key: 'blood_mage' }]
  }];
  const unlocked = new Set();

  const result = generateNodesAndEdges(character, spells, visibleTrees, unlocked);
  validateLayoutResult(result, 'Edge Case 5 (Tiers 0 & 6 outside bounds)');
} catch (err) {
  console.error('✗ Edge Case 5 failed:', err);
  process.exit(1);
}

console.log('--- ALL LAYOUT EDGE CASE TESTS PASSED SUCCESSFULLY ---');
process.exit(0);
