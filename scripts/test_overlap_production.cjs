const fs = require('fs');
const path = require('path');

// Constants replicated from constants.ts and useSpellTree.ts
const CLASS_CATEGORIES = [
  { key: 'mage', name_en: 'Mage' },
  { key: 'warrior', name_en: 'Warrior' },
  { key: 'tank', name_en: 'Tank' },
  { key: 'neutral', name_en: 'Neutral' },
  { key: 'assassin', name_en: 'Assassin' },
  { key: 'marksman', name_en: 'Marksman' },
  { key: 'crafting', name_en: 'Crafting' },
  { key: 'summoner', name_en: 'Summoner' },
];

const SUBCLASSES = [
  // MAGE
  { category_key: 'mage', key: 'druid' },
  { category_key: 'mage', key: 'dark_mage' },
  { category_key: 'mage', key: 'elementalist_mage' },
  { category_key: 'mage', key: 'psychomage' },
  { category_key: 'mage', key: 'blood_mage' },
  { category_key: 'mage', key: 'mana_mage' },
  { category_key: 'mage', key: 'priest' },
  { category_key: 'mage', key: 'warlock' },
  { category_key: 'mage', key: 'shaman' },
  { category_key: 'mage', key: 'oracle_mage' },
  // WARRIOR
  { category_key: 'warrior', key: 'executioner' },
  { category_key: 'warrior', key: 'drunken_master' },
  { category_key: 'warrior', key: 'berserker' },
  { category_key: 'warrior', key: 'monk' },
  { category_key: 'warrior', key: 'iron_fist' },
  { category_key: 'warrior', key: 'sword_sentinel' },
  { category_key: 'warrior', key: 'samurai' },
  { category_key: 'warrior', key: 'aura_fighter' },
  { category_key: 'warrior', key: 'elemental_swordmaster' },
  { category_key: 'warrior', key: 'weapon_saint' },
  // TANK
  { category_key: 'tank', key: 'vanguard_guardian' },
  { category_key: 'tank', key: 'wall_guard' },
  { category_key: 'tank', key: 'coreplate' },
  { category_key: 'tank', key: 'sworn_shield' },
  { category_key: 'tank', key: 'guardian_of_faith' },
  { category_key: 'tank', key: 'stoneheart' },
  { category_key: 'tank', key: 'twin_ramparts' },
  { category_key: 'tank', key: 'life_guardian' },
  { category_key: 'tank', key: 'wrestler' },
  // NEUTRAL
  { category_key: 'neutral', key: 'commander' },
  { category_key: 'neutral', key: 'gambler' },
  { category_key: 'neutral', key: 'merchant' },
  { category_key: 'neutral', key: 'curious' },
  { category_key: 'neutral', key: 'beast_tamer' },
  { category_key: 'neutral', key: 'imposter' },
  { category_key: 'neutral', key: 'genius' },
  // ASSASSIN
  { category_key: 'assassin', key: 'darkcabe' },
  { category_key: 'assassin', key: 'venomblood' },
  { category_key: 'assassin', key: 'phantom_veil' },
  { category_key: 'assassin', key: 'nightmare_stalker' },
  { category_key: 'assassin', key: 'echoblade' },
  { category_key: 'assassin', key: 'ninja' },
  { category_key: 'assassin', key: 'mindhunter' },
  { category_key: 'assassin', key: 'spy' },
  // MARKSMAN
  { category_key: 'marksman', key: 'stormshot' },
  { category_key: 'marksman', key: 'sniper' },
  { category_key: 'marksman', key: 'index' },
  { category_key: 'marksman', key: 'one_shot' },
  { category_key: 'marksman', key: 'gunslinger' },
  { category_key: 'marksman', key: 'rune_archer' },
  { category_key: 'marksman', key: 'late_chaser' },
  { category_key: 'marksman', key: 'elementalist_archer' },
  // CRAFTING
  { category_key: 'crafting', key: 'rune_master' },
  { category_key: 'crafting', key: 'blacksmith' },
  { category_key: 'crafting', key: 'alchemist' },
  { category_key: 'crafting', key: 'cook' },
  // SUMMONER
  { category_key: 'summoner', key: 'necromancer' },
  { category_key: 'summoner', key: 'hellbinder' },
  { category_key: 'summoner', key: 'oracle_summoner' },
  { category_key: 'summoner', key: 'soul_summoner' },
  // ADVANCED
  { category_key: 'warrior', key: 'last_samurai', is_advanced: true },
  { category_key: 'tank', key: 'triple_ramparts', is_advanced: true },
  { category_key: 'warrior', key: 'executioner_adv', is_advanced: true }
];

const TREE_SPACING = 2500;
const SUBCLASS_Y = 250;

function calculateSpellCoordinates(spells) {
  const positions = {};
  const allBranches = Array.from(new Set(spells.map((s) => s.branch).filter(Boolean)));
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

  const ROW_HEIGHT = 180;
  const TIER_GAP = 220;
  const Y_OFFSET = 120;

  const maxDepthByTier = {};
  const tiersSet = new Set();
  spells.forEach((s) => {
    const tier = s.tier;
    tiersSet.add(tier);
    const d = getDepth(s.spell_key);
    maxDepthByTier[tier] = Math.max(maxDepthByTier[tier] || 0, d);
  });

  const uniqueTiers = Array.from(tiersSet).sort((a, b) => a - b);

  const tierStartY = {};
  let currentY = Y_OFFSET;
  
  uniqueTiers.forEach((tier) => {
    tierStartY[tier] = currentY;
    const maxDepth = maxDepthByTier[tier] || 0;
    currentY += (maxDepth * ROW_HEIGHT) + TIER_GAP;
  });

  const levelsMap = {};
  spells.forEach((s) => {
    const d = getDepth(s.spell_key);
    const y = tierStartY[s.tier] + d * ROW_HEIGHT;

    if (!levelsMap[y]) {
      levelsMap[y] = [];
    }
    levelsMap[y].push(s);
  });

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

const spellsDir = path.join(__dirname, 'spells');
const files = fs.readdirSync(spellsDir).filter(f => f.endsWith('.json') && f !== 'TEMPLATE_REFERENCE.json');

const logFile = path.join(__dirname, 'overlap_results.txt');
const logStream = fs.createWriteStream(logFile);
function logWrite(text) {
  logStream.write(text + '\n');
}

logWrite(`Found ${files.length} spell tree files to check.\n`);

const allSubclassSpells = {};
const allSubclassTrees = {};

let individualOverlapsCount = 0;
let individualHorizViolationsCount = 0;
let individualVertViolationsCount = 0;

files.forEach(f => {
  const filePath = path.join(spellsDir, f);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const sub = Array.isArray(data) ? data[0] : data;
  const subclassKey = sub.subclass_key || f.replace('.json', '');
  
  allSubclassSpells[subclassKey] = sub.spells;
  allSubclassTrees[subclassKey] = {
    subclass_key: subclassKey,
    tree_name_en: sub.tree_name_en,
    branches: sub.branches,
    file: f
  };

  const relPositions = calculateSpellCoordinates(sub.spells);
  
  // Overlaps
  const posStrings = {};
  Object.entries(relPositions).forEach(([sKey, pos]) => {
    const pStr = `${pos.x.toFixed(4)}_${pos.y.toFixed(4)}`;
    if (!posStrings[pStr]) posStrings[pStr] = [];
    posStrings[pStr].push(sKey);
  });
  
  const overlaps = Object.entries(posStrings).filter(([k, v]) => v.length > 1);
  if (overlaps.length > 0) {
    individualOverlapsCount += overlaps.length;
    logWrite(`[OVERLAP] Subclass tree "${subclassKey}" has overlaps: ${JSON.stringify(overlaps)}`);
  }

  // Spacing
  const yGroups = {};
  Object.entries(relPositions).forEach(([sKey, pos]) => {
    const yKey = pos.y.toFixed(4);
    if (!yGroups[yKey]) yGroups[yKey] = [];
    yGroups[yKey].push({ key: sKey, x: pos.x });
  });

  Object.entries(yGroups).forEach(([yStr, nodes]) => {
    nodes.sort((a, b) => a.x - b.x);
    for (let i = 0; i < nodes.length - 1; i++) {
      const diff = nodes[i+1].x - nodes[i].x;
      if (diff < 134.999) {
        individualHorizViolationsCount++;
        logWrite(`[SPACING] Subclass tree "${subclassKey}" has horizontal spacing violation at Y=${parseFloat(yStr)}: "${nodes[i].key}" (${nodes[i].x.toFixed(2)}) and "${nodes[i+1].key}" (${nodes[i+1].x.toFixed(2)}), diff = ${diff.toFixed(2)}px`);
      }
    }
  });

  const uniqueYLevels = Object.keys(yGroups).map(parseFloat).sort((a, b) => a - b);
  for (let i = 0; i < uniqueYLevels.length - 1; i++) {
    const diff = uniqueYLevels[i+1] - uniqueYLevels[i];
    if (diff < 179.999) {
      individualVertViolationsCount++;
      logWrite(`[SPACING] Subclass tree "${subclassKey}" has vertical spacing violation between Y levels ${uniqueYLevels[i]} and ${uniqueYLevels[i+1]}, diff = ${diff.toFixed(2)}px`);
    }
  }
});

logWrite('\n--- COMBINED CLASS CATEGORY GRAPH TESTS ---\n');

let combinedOverlapsCount = 0;
let combinedHorizViolationsCount = 0;
let combinedVertViolationsCount = 0;

CLASS_CATEGORIES.forEach(category => {
  logWrite(`Checking Combined Graph for Class Category: "${category.key}"`);

  const activeSubclasses = SUBCLASSES.filter(sub => sub.category_key === category.key);
  const nodes = [];
  
  nodes.push({ id: `class-${category.key}`, type: 'class_root', x: 0, y: 0, name: category.key });

  activeSubclasses.forEach((sub) => {
    const sibIdx = activeSubclasses.findIndex(s => s.key === sub.key);
    const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
    const subclassY = SUBCLASS_Y;

    nodes.push({ id: `subclass-${sub.key}`, type: 'subclass_root', x: subclassX, y: subclassY, name: sub.key });

    const spells = allSubclassSpells[sub.key] || [];
    if (spells.length === 0) return;

    const relPositions = calculateSpellCoordinates(spells);
    spells.forEach(spell => {
      const relPos = relPositions[spell.spell_key] || { x: 0, y: 0 };
      const spellX = relPos.x + subclassX;
      const spellY = relPos.y + subclassY;

      nodes.push({
        id: spell.id || `spell-${spell.spell_key}`,
        type: 'spell',
        x: spellX,
        y: spellY,
        name: spell.spell_key
      });
    });
  });

  // Check overlaps
  const globalPosMap = {};
  nodes.forEach(node => {
    const pStr = `${node.x.toFixed(4)}_${node.y.toFixed(4)}`;
    if (!globalPosMap[pStr]) globalPosMap[pStr] = [];
    globalPosMap[pStr].push(node);
  });

  const globalOverlaps = Object.entries(globalPosMap).filter(([k, v]) => v.length > 1);
  if (globalOverlaps.length > 0) {
    combinedOverlapsCount += globalOverlaps.length;
    logWrite(`  [COMBINED OVERLAP] Category "${category.key}" has overlaps:`);
    globalOverlaps.forEach(([k, list]) => {
      logWrite(`    At (${k.replace('_', ', ')}): ${list.map(n => `${n.type}:${n.name}`).join(', ')}`);
    });
  }

  // Check spacing
  const yGroups = {};
  nodes.forEach(node => {
    const yKey = node.y.toFixed(4);
    if (!yGroups[yKey]) yGroups[yKey] = [];
    yGroups[yKey].push(node);
  });

  Object.entries(yGroups).forEach(([yStr, yNodes]) => {
    yNodes.sort((a, b) => a.x - b.x);
    for (let i = 0; i < yNodes.length - 1; i++) {
      const diff = yNodes[i+1].x - yNodes[i].x;
      if (diff < 134.999) {
        combinedHorizViolationsCount++;
        logWrite(`  [COMBINED SPACING] Horizontal spacing violation at Y=${parseFloat(yStr)}: "${yNodes[i].type}:${yNodes[i].name}" (${yNodes[i].x.toFixed(2)}) and "${yNodes[i+1].type}:${yNodes[i+1].name}" (${yNodes[i+1].x.toFixed(2)}), diff = ${diff.toFixed(2)}px`);
      }
    }
  });

  const uniqueYLevels = Object.keys(yGroups).map(parseFloat).sort((a, b) => a - b);
  for (let i = 0; i < uniqueYLevels.length - 1; i++) {
    const diff = uniqueYLevels[i+1] - uniqueYLevels[i];
    if (diff < 179.999) {
      combinedVertViolationsCount++;
      logWrite(`  [COMBINED SPACING] Vertical spacing violation between Y levels ${uniqueYLevels[i]} and ${uniqueYLevels[i+1]}, diff = ${diff.toFixed(2)}px`);
      const level1Nodes = yGroups[uniqueYLevels[i].toFixed(4)].map(n => `${n.type}:${n.name}`);
      const level2Nodes = yGroups[uniqueYLevels[i+1].toFixed(4)].map(n => `${n.type}:${n.name}`);
      logWrite(`    Level ${uniqueYLevels[i]} nodes: ${level1Nodes.slice(0, 8).join(', ')}${level1Nodes.length > 8 ? ' ...' : ''}`);
      logWrite(`    Level ${uniqueYLevels[i+1]} nodes: ${level2Nodes.slice(0, 8).join(', ')}${level2Nodes.length > 8 ? ' ...' : ''}`);
    }
  }
});

logStream.end(() => {
  console.log('--- LAYOUT TEST SUMMARY ---');
  console.log(`Individual tree overlaps: ${individualOverlapsCount}`);
  console.log(`Individual tree horizontal spacing violations (< 135px): ${individualHorizViolationsCount}`);
  console.log(`Individual tree vertical spacing violations (< 180px): ${individualVertViolationsCount}`);
  console.log('');
  console.log(`Combined graph overlaps (across all trees in class categories): ${combinedOverlapsCount}`);
  console.log(`Combined graph horizontal spacing violations (< 135px): ${combinedHorizViolationsCount}`);
  console.log(`Combined graph vertical spacing violations (< 180px): ${combinedVertViolationsCount}`);
  console.log(`Detailed logs written to: ${logFile}`);
});
