import fs from 'fs';
import path from 'path';

// Re-implement the position calculations from aggregate_spells.py and useSpellTree.ts

const SPELL_SCALE = 0.15;
const TREE_SPACING = 1200;
const SUBCLASS_Y = 200;
const NODE_DIAMETER = 80;

function computePosition(spellIndex, branchName, branches, totalInBranch, posInBranch) {
  const branchIdx = branches.indexOf(branchName) !== -1 ? branches.indexOf(branchName) : 0;
  const numBranches = Math.max(branches.length, 1);

  // Spread branches in a fan from -120 to +120 degrees (top-down tree)
  const angleSpread = 240; // degrees
  const startAngle = -angleSpread / 2;
  const branchAngleDeg = startAngle + (branchIdx / Math.max(numBranches - 1, 1)) * angleSpread;
  const branchAngle = ((branchAngleDeg + 90) * Math.PI) / 180; // +90 so 0 is downward

  // Each spell in a branch goes further from center
  const radius = 200 + posInBranch * 250;

  const x = Math.cos(branchAngle) * radius;
  const y = Math.sin(branchAngle) * radius;

  return { x: Math.round(x), y: Math.round(y) };
}

// Load blood_mage.json and calculate node positions
const subclassFile = 'd:/DnD/scripts/spells/blood_mage.json';
const rawData = fs.readFileSync(subclassFile, 'utf8');
const subclassDataArray = JSON.parse(rawData);
const subclassData = subclassDataArray[0];

const branches = subclassData.branches || ['Base'];
if (!branches.includes('Cross-Branch')) {
  branches.push('Cross-Branch');
}

const spells = subclassData.spells || [];
const branchCounters = {};
const computedSpells = [];

spells.forEach((spell, i) => {
  const branch = spell.branch || 'Base';
  if (!branchCounters[branch]) {
    branchCounters[branch] = 0;
  }
  const posInBranch = branchCounters[branch];
  branchCounters[branch]++;

  const totalInBranch = spells.filter(s => (s.branch || 'Base') === branch).length;
  const rawPos = computePosition(i, branch, branches, totalInBranch, posInBranch);

  // Apply scaling and offsets as done in useSpellTree.ts
  const spellX = rawPos.x * SPELL_SCALE;
  const spellY = rawPos.y * SPELL_SCALE + SUBCLASS_Y;

  computedSpells.push({
    spell_key: spell.spell_key,
    name: spell.name_en,
    branch,
    posInBranch,
    x: spellX,
    y: spellY
  });
});

console.log('--- INDIVIDUAL TREE NODE POSITIONS (BLOOD MAGE) ---');
console.log(`Subclass Root Node: x = 0, y = ${SUBCLASS_Y}`);
computedSpells.forEach(s => {
  console.log(`Spell: ${s.name} (${s.spell_key}) - Branch: ${s.branch}, Pos: ${s.posInBranch} -> x = ${s.x.toFixed(2)}, y = ${s.y.toFixed(2)}`);
});

console.log('\n--- CHECKING FOR OVERLAPS WITHIN THE TREE (Distance < 80px) ---');
let overlapCount = 0;

// Compare subclass root to all spells
computedSpells.forEach(s => {
  const dx = s.x - 0;
  const dy = s.y - SUBCLASS_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < NODE_DIAMETER) {
    console.log(`Overlap: Subclass Root and Spell "${s.name}" are too close! Distance = ${dist.toFixed(2)}px (Threshold: 80px)`);
    overlapCount++;
  }
});

// Compare all spells to each other
for (let i = 0; i < computedSpells.length; i++) {
  for (let j = i + 1; j < computedSpells.length; j++) {
    const s1 = computedSpells[i];
    const s2 = computedSpells[j];
    const dx = s1.x - s2.x;
    const dy = s1.y - s2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < NODE_DIAMETER) {
      console.log(`Overlap: Spell "${s1.name}" and Spell "${s2.name}" are too close! Distance = ${dist.toFixed(2)}px (Threshold: 80px)`);
      overlapCount++;
    }
  }
}

console.log(`\nTotal internal overlaps found: ${overlapCount}`);
