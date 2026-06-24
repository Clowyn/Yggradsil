# Handoff Report — 2026-06-20T01:21:00+03:00

## 1. Observation

Direct observations made on files under review (`src/hooks/useSpellTree.ts`, `src/components/spell-tree/SpellNode.tsx`, and `src/components/spell-tree/SpellTreeGraph.tsx`):

### 1.1 Node Spacing & Dimensions
- In `src/components/spell-tree/SpellNode.tsx`, the node width is explicitly defined as `110px` (line 32):
  ```typescript
  32:       border-2 w-[110px] h-[110px]
  ```
- In `src/hooks/useSpellTree.ts`, the horizontal spacing is calculated as follows (lines 258-261):
  ```typescript
  258:     const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
  259:     sortedSpells.forEach((s, idx) => {
  260:       const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
  261:       positions[s.spell_key] = { x, y };
  ```
- Running `node scripts/stress_test_layout.cjs` reports **849 near-overlaps** where the distance between nodes at the same horizontal level is `< 150px`, with many distances at `100px`, `90px`, or `112.5px`. For example:
  ```json
  {
    "subclass": "warlock",
    "y": 560,
    "node1": "wl_eldritch_beam",
    "x1": -450,
    "node2": "wl_eldritch_storm",
    "x2": -360,
    "dist": 90
  }
  ```

### 1.2 Cycle Detection in `getDepth`
- In `src/hooks/useSpellTree.ts`, `getDepth` is defined with a recursion tracker `visiting` Set (lines 176-204):
  ```typescript
  176:   const depthMap: Record<string, number> = {};
  177:   const visiting = new Set<string>();
  178: 
  179:   const getDepth = (spellKey: string): number => {
  180:     if (spellKey in depthMap) return depthMap[spellKey];
  181:     if (visiting.has(spellKey)) return 0;
  182:     visiting.add(spellKey);
  ...
  201:     visiting.delete(spellKey);
  202:     depthMap[spellKey] = maxD;
  203:     return maxD;
  204:   };
  ```

### 1.3 Strict Linting & Compiler Issues
- Running `npx eslint .` fails with **24 errors** (Exit Code 1).
- In the reviewed files, the following lint issues are reported:
  - **`src/hooks/useSpellTree.ts`**:
    - Line 284: `Avoid calling setState() directly within an effect` (`react-hooks/set-state-in-effect`)
    - Lines 276, 311, 348, 449, 496, 516: `Unexpected any. Specify a different type` (`@typescript-eslint/no-explicit-any`)
  - **`src/components/spell-tree/SpellTreeGraph.tsx`**:
    - Lines 114, 153, 154, 344: `Unexpected any. Specify a different type` (`@typescript-eslint/no-explicit-any`)

---

## 2. Logic Chain

1. **Overlapping Nodes**:
   - The nodes are circles with a width of `110px` (radius $r = 55\text{px}$). For two adjacent nodes to not overlap visually, their center-to-center horizontal distance must be strictly greater than their width: $\text{distance} \ge 110\text{px}$.
   - The code calculates center-to-center distance as $X_{GAP} = \min(150, 900 / (M - 1))$.
   - If there are $M \ge 10$ nodes at the same Y level, the denominator $(M - 1) \ge 9$.
   - Thus, $X_{GAP} \le 900 / 9 = 100\text{px}$.
   - Since $100\text{px} < 110\text{px}$, adjacent nodes will overlap horizontally by $110 - 100 = 10\text{px}$ (and more if $M > 10$, e.g., $20\text{px}$ overlap when $M = 11$).
   - This leads to visible overlaps in trees such as `warlock` and `twin_ramparts`.

2. **Cycle Detection Correctness**:
   - `getDepth` keeps track of currently visited nodes in `visiting`.
   - If `visiting.has(spellKey)` evaluates to true, it returns `0` immediately.
   - This successfully cuts off recursive traversal and avoids infinite loops (stack overflow) for cyclical spell dependencies.

3. **Compiler & Lint Failures**:
   - ESLint is run as part of quality verification. Because it rejects explicit `any` and synchronous `setState` in `useEffect` as errors, the codebase does not compile under strict/linted conditions.

---

## 3. Caveats

- Database-connected state behavior was not fully run against a live Supabase database instance during this specific review turn (the offline mock mode fallback was triggered and verified). However, the SQL schema and RPC code paths were inspected.
- No other caveats.

---

## 4. Conclusion

- **Verdict**: **REQUEST_CHANGES**
- **Actionable Findings**:
  - Fix the horizontal spacing algorithm in `calculateSpellCoordinates` to ensure a minimum gap of $110\text{px}$ or dynamically adjust width based on $M$ without capping spacing below node width.
  - Refactor synchronous state setters (`setIsFallbackMode`, etc.) inside the `useEffect` hook in `useSpellTree.ts` to avoid cascading render lint errors.
  - Replace `any` type definitions in `useSpellTree.ts` and `SpellTreeGraph.tsx` with specific interfaces or type annotations to resolve `@typescript-eslint/no-explicit-any` lint errors.

---

## 5. Verification Method

To verify:
1. **Layout Spacing**: Run `node scripts/stress_test_layout.cjs`. It will print overlaps where distance is $< 150\text{px}$. Ensure all distances between adjacent nodes are $\ge 110\text{px}$.
2. **Lint/Compiler Errors**: Run `npx eslint .` to check for linter issues, and `npx tsc -b` for compiler checks.
3. **Unit Tests**: Run `node scripts/test-spell-tree.js`.

---
---

# Quality Review Report

**Verdict**: REQUEST_CHANGES

## Findings

### [Critical] Finding 1: Sibling Nodes Horizontal Overlapping
- **What**: Adjacent sibling nodes overlap visually on the graph when $M \ge 10$.
- **Where**: `src/hooks/useSpellTree.ts:258-261` and `src/components/spell-tree/SpellNode.tsx:32`.
- **Why**: Capping the total level width to `900px` reduces the gap between nodes below the node width of `110px`.
- **Suggestion**: Remove or scale the `900px` cap dynamically, or assert that $X_{GAP}$ is at least `120px` to guarantee a clean separation gap.

### [Major] Finding 2: Synchronous setState in useEffect
- **What**: React-hooks error triggered by synchronous state updates inside mounting `useEffect`.
- **Where**: `src/hooks/useSpellTree.ts:284`.
- **Why**: Triggers cascading renders which degrade performance and violate lint rules.
- **Suggestion**: Use default initial values in `useState` or defer fallback state setting.

### [Major] Finding 3: Explicit `any` Types
- **What**: Multiple typescript-eslint errors due to explicit `any` usage.
- **Where**: `src/hooks/useSpellTree.ts` (lines 276, 311, 348, 449, 496, 516) and `src/components/spell-tree/SpellTreeGraph.tsx` (lines 114, 153, 154, 344).
- **Why**: Bypasses typescript compiler safety checks.
- **Suggestion**: Define explicit types (e.g. `Character`, `SpellNode`, `React.MouseEvent`) instead of `any`.

## Verified Claims

- Cycle detection in `getDepth` → verified via inspection and running `node scripts/test-spell-tree.js` Test Case 5 → **PASS**
- TypeScript compiler output → verified via `npx tsc -b` → **PASS** (Zero compiler-level errors, though linting fails).

---
---

# Challenge Report (Adversarial Review)

**Overall risk assessment**: MEDIUM

## Challenges

### [High] Challenge 1: Space Exhaustion on High Node Count
- **Assumption challenged**: That capping the tree width to 900px yields a usable graph.
- **Attack scenario**: A user views a subclass tree with 15 spells at tier 2. The horizontal gap is squeezed to 64px, causing nodes to stack directly on top of each other.
- **Blast radius**: User cannot read spell names or click correct nodes.
- **Mitigation**: Implement horizontal panning/scroll or dynamic width expansion.

### [Medium] Challenge 2: Cycle depth Map caching
- **Assumption challenged**: That the topological depth logic returns consistent depths when cycle detection is triggered.
- **Attack scenario**: If a cyclical dependency is introduced, `getDepth` returns `0` for the cyclic node. The parent-child depth calculation gets skewed depending on which node is traversed first, resulting in strange visual vertical jumps.
- **Blast radius**: Misaligned layout representation.
- **Mitigation**: Detect cycles before computing coordinates and throw an error, rather than fallback caching.

## Stress Test Results

- cyclical graph node depth resolution → returns `0` correctly and terminates → **PASS** (does not hang)
- 10+ node layout test → produces nodes with overlapping coordinates → **FAIL**
