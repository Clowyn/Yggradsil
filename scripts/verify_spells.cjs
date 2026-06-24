const fs = require('fs');
const path = require('path');

const spellsDir = path.join(__dirname, 'spells');
const files = fs.readdirSync(spellsDir).filter(f => f.endsWith('.json') && f !== 'TEMPLATE_REFERENCE.json');

let totalOverlaps = 0;
let maxRelX = 0;

files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(path.join(spellsDir, f), 'utf-8'));
  const sub = Array.isArray(data) ? data[0] : data;
  const spells = sub.spells;
  const branches = sub.branches || [];
  const P = branches.filter(b => !['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(b));
  
  const colMap = {};
  P.forEach((b, idx) => colMap[b] = idx - (P.length - 1) / 2);
  
  const getCol = (b) => {
    if (!b || ['Cross-Branch', 'Cross-branch', 'Grand Ultimate'].includes(b)) return 0;
    const parts = b.split(',').map(x => x.trim());
    let sum = 0, count = 0;
    parts.forEach(p => {
      if (p in colMap) {
        sum += colMap[p];
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  };
  
  const depthMap = {};
  const visiting = new Set();
  const getDepth = (sKey) => {
    if (sKey in depthMap) return depthMap[sKey];
    if (visiting.has(sKey)) return 0;
    visiting.add(sKey);
    const s = spells.find(x => x.spell_key === sKey);
    if (!s) {
      visiting.delete(sKey);
      return 0;
    }
    if (!s.prerequisites || s.prerequisites.length === 0) {
      visiting.delete(sKey);
      depthMap[sKey] = 0;
      return 0;
    }
    let maxD = 0;
    s.prerequisites.forEach(pKey => {
      const parent = spells.find(x => x.spell_key === pKey);
      if (parent && parent.tier === s.tier) {
        maxD = Math.max(maxD, getDepth(pKey) + 1);
      }
    });
    visiting.delete(sKey);
    depthMap[sKey] = maxD;
    return maxD;
  };

  const TIER_HEIGHT = 220;
  const ROW_HEIGHT = 70;
  const Y_OFFSET = 120;

  const levelsMap = {};
  spells.forEach(s => {
    const d = getDepth(s.spell_key);
    const y = Y_OFFSET + (s.tier - 1) * TIER_HEIGHT + d * ROW_HEIGHT;
    if (!levelsMap[y]) {
      levelsMap[y] = [];
    }
    levelsMap[y].push(s);
  });

  const finalPositions = {};
  Object.entries(levelsMap).forEach(([yStr, levelSpells]) => {
    const y = parseFloat(yStr);
    const M = levelSpells.length;

    const getSortKey = (s) => {
      if (!s.prerequisites || s.prerequisites.length === 0) {
        return getCol(s.branch);
      }
      let sum = 0;
      let count = 0;
      s.prerequisites.forEach(pKey => {
        const parent = spells.find(x => x.spell_key === pKey);
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

    const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
    sortedSpells.forEach((s, idx) => {
      const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
      finalPositions[s.spell_key] = { x, y };
    });
  });
  
  const posStrings = {};
  Object.entries(finalPositions).forEach(([sKey, pos]) => {
    const pStr = pos.x + '_' + pos.y;
    if (!posStrings[pStr]) posStrings[pStr] = [];
    posStrings[pStr].push(sKey);
    maxRelX = Math.max(maxRelX, Math.abs(pos.x));
  });
  
  const overlaps = Object.entries(posStrings).filter(([k, v]) => v.length > 1);
  if (overlaps.length > 0) {
    console.log(sub.subclass_key, 'has overlaps:', overlaps);
    totalOverlaps += overlaps.length;
  }
});

console.log('Total final overlaps:', totalOverlaps);
console.log('Maximum relative X absolute value:', maxRelX);
