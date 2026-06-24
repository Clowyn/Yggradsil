# Handoff Report: Spell Tree Positioning Analysis & Layout Optimization Strategy

## 1. Observation
We analyzed the positioning logic in the React Flow spell tree codebase. The observations are structured around the exact files and lines of code:

### A. Main Class Node Position
In `src/hooks/useSpellTree.ts` (lines 404-429), the main class node position is hardcoded:
```typescript
const classNodes: Node[] = CLASS_CATEGORIES.filter(c => c.key === classCategoryKey).map((cls) => ({
  id: `class-${cls.key}`,
  type: 'spellNode',
  position: { x: 0, y: 0 },
  ...
}));
```
Thus, the main class node is always centered at `(0, 0)`.

### B. Subclass Nodes Position
In `src/hooks/useSpellTree.ts` (lines 431-434), the subclass nodes are laid out horizontally:
```typescript
const subclassNodes: Node[] = activeSubclasses.map((sub) => {
  const sibIdx = activeSubclasses.findIndex(s => s.key === sub.key);
  const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
  const subclassY = SUBCLASS_Y;
  ...
```
Where:
* `TREE_SPACING` is defined on line 15: `const TREE_SPACING = 1200;`
* `SUBCLASS_Y` is defined on line 17: `const SUBCLASS_Y = 200;`
This aligns all active subclass nodes horizontally at $y = 200$, spaced by $1200$ pixels.

### C. Spell Nodes Position
In `src/hooks/useSpellTree.ts` (lines 465-492), the spell node positions are computed by scaling the database position values by a factor of `0.15` and adding subclass/class offsets:
```typescript
const spellNodes: Node[] = visibleSpells.map(spell => {
  ...
  let spellX = (spell.position?.x || 0) * SPELL_SCALE;
  let spellY = (spell.position?.y || 0) * SPELL_SCALE;
  ...
  const tree = visibleTrees.find(t => t.id === spell.spell_tree_id);
  if (tree && tree.assignments) {
    const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || tree.assignments.find(a => a.class_key === classCategoryKey) || tree.assignments[0];
    if (assign && assign.subclass_key) {
      const sibIdx = activeSubclasses.findIndex(s => s.key === assign.subclass_key);
      if (sibIdx !== -1) {
        const subclassX = (sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING;
        const subclassY = SUBCLASS_Y;
        spellX += subclassX;
        spellY += subclassY;
      }
      ...
    } else if (assign && assign.class_key) {
      spellY += SUBCLASS_Y;
      ...
    }
  }
```
Where:
* `SPELL_SCALE` is defined on line 16: `const SPELL_SCALE = 0.15;`

### D. Database Position Generation
The database position coordinates are generated in `scripts/aggregate_spells.py` (lines 64-84):
```python
def compute_position(spell_index, branch_name, branches, total_in_branch, pos_in_branch):
    branch_idx = branches.index(branch_name) if branch_name in branches else 0
    num_branches = max(len(branches), 1)

    # Spread branches in a fan from -120 to +120 degrees (top-down tree)
    angle_spread = 240  # degrees
    start_angle = -angle_spread / 2
    branch_angle_deg = start_angle + (branch_idx / max(num_branches - 1, 1)) * angle_spread
    branch_angle = math.radians(branch_angle_deg + 90)  # +90 so 0 is downward

    # Each spell in a branch goes further from center
    radius = 200 + pos_in_branch * 250

    x = int(math.cos(branch_angle) * radius)
    y = int(math.sin(branch_angle) * radius)

    return x, y
```
This script writes position objects like `{"x": 173, "y": -99}` directly to the database (e.g. in `final_seed_v3.sql`).

---

## 2. Logic Chain (Why Nodes Overlap)

Based on the observations above, the overlaps occur due to the following mathematical and architectural factors:

1. **Negative Y-Coordinates Branching Upward:**
   * In `aggregate_spells.py`, the radial layout spreads branches at angles from $-120^\circ$ to $+120^\circ$ relative to downward. This means branches at the extreme edges (e.g., Potion index $0$ at $-120^\circ$ and Cross-Branch index $3$ at $+120^\circ$) lie in the upper half-plane relative to the node center.
   * This yields negative $y$ values in the database (e.g., $y = -99$, $y = -224$, etc.).
   * Because SVG and React Flow invert the y-axis (negative $y$ is **UP**, positive $y$ is **DOWN**), these spells are placed at $y_{\text{spell}} < y_{\text{subclass}}$ ($y < 200$).
   * This causes these nodes to grow upwards towards the main class node ($y = 0$), overlapping with class-to-subclass edge connections and subclass nodes.

2. **Insufficient Horizontal and Vertical Spacing:**
   * The radius step between spells in the same branch in the database is $250$ pixels.
   * When scaled by `SPELL_SCALE = 0.15` in the frontend, the level spacing is compressed to only $250 \times 0.15 = 37.5$ pixels.
   * Since a standard React Flow node has physical dimensions around $150 \times 60$ pixels, placing parent and child nodes only $37.5$ pixels apart guarantees severe visual overlap.

3. **Sideways Expansion Crossing adjacent Trees:**
   * Fanning branches out at $\pm 120^\circ$ forces nodes outward sideways. With maximum radii exceeding $2000$ pixels in the DB, the scaled horizontal spread reaches $\pm (2000 \times 0.15) = \pm 300$ pixels.
   * In classes with many active subclasses (e.g., Mage has 10 subclasses), the subclass trees are closely packed, and these wide lateral branches collide with adjacent subclass trees.

4. **Class Spells Centered on Subclass Tree X-Coordinates:**
   * Spells assigned to the class category (rather than a subclass) are offset vertically by `spellY += SUBCLASS_Y = 200`, but they receive **no horizontal offset** (`spellX` remains centered around $0$).
   * Because the subclass trees themselves are centered around $0$, the class spells overlap directly with the middle subclass tree.

---

## 3. Caveats
* **Offline Mock Data:** The analysis includes both mock data structures (such as `MOCK_SPELLS` in `useSpellTree.ts`) and the live seed generator in `scripts/aggregate_spells.py`. Both are consistent in using scaled coordinates that exhibit overlap.
* **Component Sizing:** We assume standard React Flow custom nodes are being used. Dynamic layout measurements (such as using `getBoundingClientRect`) are not currently implemented and could be an alternative but add rendering-pass complexity.
* **Static Database Positions:** We assume database coordinates should not be modified, or if they are modified, it would affect existing instances. Designing a layout computed entirely dynamically in the frontend is far more robust because it bypasses raw database coordinates.

---

## 4. Conclusion & Strategy

We propose a **dynamic, frontend-computed hierarchical grid layout** to replace database-driven coordinates. This strategy organizes nodes on a clean grid based on their metadata (Tree, Branch, Tier, and sibling index), forcing a strictly downward tree flow.

### The Geometric Model

1. **Hierarchy Level Spacing:**
   * Class Node level: $Y_{\text{class}} = 0$
   * Subclass Node level: $Y_{\text{subclass}} = 150$
   * Tier vertical step: $H_{\text{tier}} = 160$ (placing Tier 1 at $y = 310$, Tier 2 at $y = 470$, etc. ensuring downward branching)
   * Subclass tree horizontal spacing: $W_{\text{subclass}} = 1200$
   * Branch horizontal spacing: $W_{\text{branch}} = 250$
   * Sibling horizontal spacing: $W_{\text{sibling}} = 100$

2. **Base Class Tree Horizontal Separation:**
   * Rather than rendering class-level spells at $x = 0$ and overlapping with middle subclass trees, treat the Base Class Tree as its own column.
   * In a set of $M$ trees (Base Class Tree + subclass trees), order them such that the Base Class Tree sits at the center index $c = \lfloor M/2 \rfloor$, and subclass trees are positioned symmetrically around it.
   * Tree horizontal offset:
     $$X_{\text{tree}}^{(k)} = (k - c) \times W_{\text{subclass}}$$

3. **Node Coordinates Formulation:**
   * **Main Class Node**: $(0, 0)$
   * **Subclass Node** $k$: $(X_{\text{tree}}^{(k)}, Y_{\text{subclass}})$
   * **Spell Node** $j$ in tree $k$, branch $b$, and tier $t$:
     * Calculate branch index $b \in [0, B-1]$ and unique branch count $B$.
     * Identify the group of spells $S$ in the same tree, branch, and tier. Sort them to get a stable sibling index $j \in [0, |S|-1]$.
     * **Y coordinate:**
       $$y = Y_{\text{subclass}} + t \times H_{\text{tier}}$$
     * **X coordinate:**
       $$x = X_{\text{tree}}^{(k)} + \left(b - \frac{B - 1}{2}\right) \times W_{\text{branch}} + \left(j - \frac{|S| - 1}{2}\right) \times W_{\text{sibling}}$$

### Proposed Code Implementation (`useSpellTree.ts` nodes generator replacement)

To implement this layout dynamically inside the `useMemo` of `nodes` in `src/hooks/useSpellTree.ts`, replace the `spellNodes` computation with:

```typescript
// 1. Gather all active subclass keys and add "base_class" as a virtual key
const activeSubclassKeys = activeSubclasses.map(s => s.key);
const allTreeKeys = ['base_class', ...activeSubclassKeys];
const centerIdx = Math.floor(allTreeKeys.length / 2);

const TIER_SPACING = 160;
const BRANCH_SPACING = 250;
const SIBLING_SPACING = 100;

// 2. Map spell nodes dynamically
const spellNodes: Node[] = visibleSpells.map(spell => {
  const status = getSpellStatus(spell);
  const nodeColor = BRANCH_COLORS[spell.branch || 'Base'] || '#3b82f6';
  
  // Find which tree key this spell belongs to
  let treeKey = 'base_class';
  const tree = visibleTrees.find(t => t.id === spell.spell_tree_id);
  if (tree && tree.assignments) {
    const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || 
                   tree.assignments.find(a => a.class_key === classCategoryKey) || 
                   tree.assignments[0];
    if (assign && assign.subclass_key) {
      treeKey = assign.subclass_key;
    }
  }

  // Horizontal Tree position
  const treeIdx = allTreeKeys.indexOf(treeKey);
  const treeX = (treeIdx !== -1 ? treeIdx - centerIdx : 0) * TREE_SPACING;

  // Determine branch order within this tree
  const treeSpells = visibleSpells.filter(s => s.spell_tree_id === spell.spell_tree_id);
  const branchesInTree = Array.from(new Set(treeSpells.map(s => s.branch || 'Base'))).sort();
  const branchIdx = branchesInTree.indexOf(spell.branch || 'Base');
  const numBranches = branchesInTree.length;
  const branchXOffset = numBranches > 1 ? (branchIdx - (numBranches - 1) / 2) * BRANCH_SPACING : 0;

  // Determine sibling order within the same branch and tier
  const siblings = treeSpells
    .filter(s => (s.branch || 'Base') === (spell.branch || 'Base') && s.tier === spell.tier)
    .sort((a, b) => a.spell_key.localeCompare(b.spell_key));
  const siblingIdx = siblings.findIndex(s => s.id === spell.id);
  const numSiblings = siblings.length;
  const siblingXOffset = numSiblings > 1 ? (siblingIdx - (numSiblings - 1) / 2) * SIBLING_SPACING : 0;

  // Final Coordinates (strictly downward y-progression)
  const spellX = treeX + branchXOffset + siblingXOffset;
  const spellY = SUBCLASS_Y + (spell.tier * TIER_SPACING);

  const isCharacterSubclass = treeKey === 'base_class' || treeKey === subclassKey;

  return {
    id: spell.id,
    type: 'spellNode',
    position: { x: spellX, y: spellY },
    data: {
      spell,
      status,
      nodeColor,
      isDimmed: !isCharacterSubclass,
      isActiveSubclassTree: isCharacterSubclass,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  };
});
```

---

## 5. Verification Method

To independently verify the implementation and layout:

1. **Visual inspection of graph structure:**
   * Open the spell tree page (via client dev server `npm run dev`).
   * Verify the Main Class Node `👑` is at top center $(0,0)$.
   * Verify subclass nodes are positioned horizontally at $y = 200$.
   * Verify spells are arranged below their respective subclass node, flowing strictly downward as their tier increases ($y$ increases).
   * Confirm that base class spells branch straight down at $x = 0$ without colliding with the middle subclass tree.

2. **Project Linting & TypeScript Build Compilation:**
   * Execute the following commands to confirm code integrity:
     ```powershell
     npm run lint
     npm run build
     ```
   * Confirm that no TypeScript errors or ESLint warnings are introduced.
