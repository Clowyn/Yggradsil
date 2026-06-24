import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// 1. REPRODUCE calculateSpellCoordinates EXACTLY
// ==========================================

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

  // Calculate max depth for each tier first
  const maxDepthByTier = {};
  spells.forEach((s) => {
    const tier = s.tier;
    const d = getDepth(s.spell_key);
    maxDepthByTier[tier] = Math.max(maxDepthByTier[tier] || 0, d);
  });

  // Compute starting Y position for each tier (1 to 5)
  const tierStartY = {};
  tierStartY[1] = Y_OFFSET;
  for (let t = 2; t <= 5; t++) {
    const prevMaxDepth = maxDepthByTier[t - 1] !== undefined ? maxDepthByTier[t - 1] : 0;
    const prevStartY = tierStartY[t - 1] !== undefined ? tierStartY[t - 1] : Y_OFFSET;
    tierStartY[t] = prevStartY + (prevMaxDepth * ROW_HEIGHT) + TIER_GAP;
  }

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

    // Space out nodes horizontally centering at 0
    // Use 150px gap between nodes. If there are many nodes, cap horizontal width to 900px
    const X_GAP = Math.max(135, Math.min(180, 1400 / Math.max(M - 1, 1)));
    sortedSpells.forEach((s, idx) => {
      const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
      positions[s.spell_key] = { x, y, xGap: X_GAP, mValue: M };
    });
  });

  return positions;
}

// ==========================================
// 2. HELPER TO CHECK SPACING CONSTRAINTS
// ==========================================

function verifySpacing(positions, contextName = 'Test') {
  // Group positions by Y coordinate
  const yMap = {};
  Object.entries(positions).forEach(([key, pos]) => {
    if (!yMap[pos.y]) yMap[pos.y] = [];
    yMap[pos.y].push({ key, x: pos.x });
  });

  // 1. Horizontal Distance Check
  Object.entries(yMap).forEach(([yStr, nodes]) => {
    const y = parseFloat(yStr);
    // Sort nodes by X coordinate
    nodes.sort((a, b) => a.x - b.x);

    for (let i = 0; i < nodes.length - 1; i++) {
      const dist = nodes[i+1].x - nodes[i].x;
      // Assert horizontal distance is >= 135px
      assert.ok(
        dist >= 135,
        `[${contextName}] Horizontal spacing violation at y=${y}: nodes "${nodes[i].key}" and "${nodes[i+1].key}" are too close (${dist.toFixed(2)}px < 135px)`
      );
    }
  });

  // 2. Vertical Distance Check
  const distinctY = Object.keys(yMap).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < distinctY.length - 1; i++) {
    const vDist = distinctY[i+1] - distinctY[i];
    // Assert vertical distance is >= 180px
    assert.ok(
      vDist >= 180,
      `[${contextName}] Vertical spacing violation: levels at y=${distinctY[i]} and y=${distinctY[i+1]} are too close (${vDist}px < 180px)`
    );
  }

  // 3. No Absolute Overlaps Check
  const posKeys = {};
  Object.entries(positions).forEach(([key, pos]) => {
    const coordKey = `${pos.x.toFixed(2)}_${pos.y.toFixed(2)}`;
    if (posKeys[coordKey]) {
      throw new Error(`[${contextName}] Absolute overlap detected at coordinate (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}) between "${posKeys[coordKey]}" and "${key}"`);
    }
    posKeys[coordKey] = key;
  });
}

// ==========================================
// 3. RUN SYNTHETIC TESTS (DENSITY 1 TO 20)
// ==========================================

console.log('--- STARTING SYNTHETIC SPACING TESTS ---');

// Test Suite 1: Single Tier with M spells (M = 1 to 20)
for (let M = 1; M <= 20; M++) {
  const spells = [];
  for (let i = 0; i < M; i++) {
    spells.push({
      spell_key: `spell_${i}`,
      branch: 'Offense', // All in same branch to keep colMap / branch sorting uniform
      tier: 1,
      prerequisites: []
    });
  }

  const positions = calculateSpellCoordinates(spells);
  
  if (M > 1) {
    const firstKey = `spell_0`;
    const xGapValue = positions[firstKey].xGap;
    console.log(`Density Test: M = ${M} spells. Computed Horizontal Gap = ${xGapValue.toFixed(2)}px`);
  } else {
    console.log(`Density Test: M = 1 spell. No spacing comparison possible.`);
  }

  try {
    verifySpacing(positions, `Synthetic Density M=${M}`);
  } catch (err) {
    console.error(`✗ Synthetic Density M=${M} failed verification!`, err.message);
    process.exit(1);
  }
}
console.log('✓ All synthetic density tests (M=1..20) passed (Horizontal >= 135px, Vertical >= 180px).');

// Test Suite 2: Multi-Tier Depth Chains
console.log('\n--- STARTING SYNTHETIC DEPTH CHAIN TESTS ---');
const depthSpells = [
  // Tier 1 chain (depth 0, 1, 2)
  { spell_key: 't1_a', branch: 'Offense', tier: 1, prerequisites: [] },
  { spell_key: 't1_b', branch: 'Offense', tier: 1, prerequisites: ['t1_a'] },
  { spell_key: 't1_c', branch: 'Offense', tier: 1, prerequisites: ['t1_b'] },

  // Tier 2 chain (depth 0, 1)
  { spell_key: 't2_a', branch: 'Defense', tier: 2, prerequisites: ['t1_c'] },
  { spell_key: 't2_b', branch: 'Defense', tier: 2, prerequisites: ['t2_a'] },

  // Tier 3 root
  { spell_key: 't3_a', branch: 'Utility', tier: 3, prerequisites: ['t2_b'] }
];

const depthPositions = calculateSpellCoordinates(depthSpells);
console.log('Generated Depth Positions:');
Object.entries(depthPositions).forEach(([key, pos]) => {
  console.log(`  ${key}: x=${pos.x.toFixed(2)}, y=${pos.y}`);
});

try {
  verifySpacing(depthPositions, 'Synthetic Depth Chains');
  console.log('✓ Synthetic Depth Chain tests passed.');
} catch (err) {
  console.error('✗ Synthetic Depth Chain tests failed!', err.message);
  process.exit(1);
}

// ==========================================
// 4. SCAN ALL PRODUCTION SPELL DEFINITIONS
// ==========================================

console.log('\n--- SCANNING PRODUCTION SPELL TREES ---');
const spellsDir = path.join(__dirname, 'spells');
const files = fs.readdirSync(spellsDir).filter(f => f.endsWith('.json') && f !== 'TEMPLATE_REFERENCE.json');

let totalTreesChecked = 0;
let maxDensitySeen = 0;

files.forEach(f => {
  const fileContent = fs.readFileSync(path.join(spellsDir, f), 'utf-8');
  const data = JSON.parse(fileContent);
  const sub = Array.isArray(data) ? data[0] : data;
  const spells = sub.spells || [];
  
  if (spells.length === 0) return;

  // Run calculateSpellCoordinates
  const positions = calculateSpellCoordinates(spells);

  // Measure max density per Y level in this tree
  const yCount = {};
  Object.values(positions).forEach(pos => {
    yCount[pos.y] = (yCount[pos.y] || 0) + 1;
    if (yCount[pos.y] > maxDensitySeen) {
      maxDensitySeen = yCount[pos.y];
    }
  });

  try {
    verifySpacing(positions, `Subclass Tree: ${sub.subclass_key || f}`);
    totalTreesChecked++;
  } catch (err) {
    console.error(`✗ Spacing violation found in subclass tree ${sub.subclass_key || f}:`, err.message);
    process.exit(1);
  }
});

console.log(`✓ successfully verified ${totalTreesChecked} subclass/class trees.`);
console.log(`Maximum node density observed on a single level in production data: ${maxDensitySeen}`);
console.log('\n======================================================');
console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
console.log('======================================================');
process.exit(0);
