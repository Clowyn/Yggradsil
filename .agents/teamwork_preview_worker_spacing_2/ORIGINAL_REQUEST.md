## 2026-06-20T02:08:54+03:00
Your task is to fix the layout robustness issue in useSpellTree.ts and update the edge-case test script scripts/test-spell-tree-layout-edges.js.

### 1. In `D:\DnD\src\hooks\useSpellTree.ts`:
Locate the `tierStartY` calculation in `calculateSpellCoordinates` (around lines 220-226):
```typescript
  // Compute starting Y position for each tier (1 to 5)
  const tierStartY: Record<number, number> = {};
  tierStartY[1] = Y_OFFSET;
  for (let t = 2; t <= 5; t++) {
    const prevMaxDepth = maxDepthByTier[t - 1] !== undefined ? maxDepthByTier[t - 1] : 0;
    const prevStartY = tierStartY[t - 1] !== undefined ? tierStartY[t - 1] : Y_OFFSET;
    tierStartY[t] = prevStartY + (prevMaxDepth * ROW_HEIGHT) + TIER_GAP;
  }
```
Replace it with a fully dynamic calculation that computes offsets for all unique tiers present in the `spells` array (rather than a hardcoded loop 1..5):
```typescript
  // Group spells by tier and calculate max depths for each tier
  const maxDepthByTier: Record<number, number> = {};
  const tiersSet = new Set<number>();
  spells.forEach((s) => {
    const tier = s.tier;
    tiersSet.add(tier);
    const d = getDepth(s.spell_key);
    maxDepthByTier[tier] = Math.max(maxDepthByTier[tier] || 0, d);
  });

  // Sort the unique tiers ascending
  const uniqueTiers = Array.from(tiersSet).sort((a, b) => a - b);

  // Compute starting Y position for each tier dynamically
  const tierStartY: Record<number, number> = {};
  let currentY = Y_OFFSET;
  
  uniqueTiers.forEach((tier) => {
    tierStartY[tier] = currentY;
    const maxDepth = maxDepthByTier[tier] || 0;
    currentY += (maxDepth * ROW_HEIGHT) + TIER_GAP;
  });
```

### 2. In `D:\DnD\scripts\test-spell-tree-layout-edges.js`:
Apply the exact same dynamic layout replacement to the replicated `calculateSpellCoordinates` function (lines 101-116) so that the script tests match the production code logic exactly and can pass when running edge cases.

### 3. Verification:
- Run `node scripts/test-spell-tree-layout-edges.js` to verify all edge cases (including Case 5) now pass successfully.
- Run `npx tsc --noEmit` from D:\DnD to verify that there are no TypeScript compiler errors.
- Run `npm run build` to verify the production bundle builds successfully.

Write a detailed handoff.md under your working directory, and send a message back when completed.
