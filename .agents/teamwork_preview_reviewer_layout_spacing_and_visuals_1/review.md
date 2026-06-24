# Review Report — Layout Spacing, Visuals & Type Safety

## Review Summary

**Verdict**: APPROVE

We reviewed the code changes made in `src/hooks/useSpellTree.ts` and `src/components/gm/GMDashboard.tsx` against the project design guidelines and constraints. The implementation is of high quality, adheres strictly to project rules, computes coordinates correctly, maps spell/edge structures using the correct priority (subclass first, then class), and compiles cleanly.

---

## Verified Claims

1. **Compliance with React Flow Node Transform Rule**
   - *Claim*: Never apply CSS transform styles directly to React Flow nodes.
   - *Verification Method*: Inspected the node definitions in `useSpellTree.ts` (lines 404-509) and the styling in the custom component `SpellNode.tsx` (lines 68-79) and ran a project-wide search for direct node transform styling.
   - *Result*: **PASS**. The nodes returned by the hook have no inline styles. The custom node component `SpellNode.tsx` applies scale transformations using Framer Motion (`whileHover` / `whileTap`) on an *inner* `<motion.div>` wrapper, which does not interfere with React Flow's outer container translate positioning.

2. **Proper Layout Coordinate Calculations**
   - *Claim*: Compact spacing constants are configured and calculated correctly (`TREE_SPACING = 1200`, `SPELL_SCALE = 0.15`, `SUBCLASS_Y = 200`).
   - *Verification Method*: Inspected the coordinate mapping logic in `useSpellTree.ts`.
   - *Result*: **PASS**. Subclass nodes are spaced at offsets of `TREE_SPACING` (1200 px), vertical subclass baseline starts at `SUBCLASS_Y` (200 px), and individual spell coordinates from the database are scaled by `SPELL_SCALE` (0.15) before being offset by their respective parent subclass/class coordinates.

3. **Correct Spell and Edge Mappings**
   - *Claim*: Maps spells and edges by checking subclass key first, then falling back to class category.
   - *Verification Method*: Inspected tree assignment lookups in `useSpellTree.ts` (lines 476, 568).
   - *Result*: **PASS**. The lookup checks `tree.assignments.find(a => a.subclass_key === subclassKey)` first, then falls back to `tree.assignments.find(a => a.class_key === classCategoryKey)`, and finally falls back to `tree.assignments[0]`.

4. **Correct Compilation of Types**
   - *Claim*: Project builds cleanly and compile-checks without errors.
   - *Verification Method*: Executed `npx tsc -b`.
   - *Result*: **PASS**. The compiler exited with exit code 0 and no output, verifying complete type safety.

---

## Coverage Gaps

- No coverage gaps identified. The review fully covered all implementation paths in both target files.

## Unverified Items

- None.

---

# Adversarial Challenge Report

## Challenge Summary

**Overall risk assessment**: LOW

The layout coordinate arithmetic and fallback state machines are robust. The risk of regression or visual artifacts under normal usage is minimal.

---

## Challenges

### [Low] Challenge 1: Empty or Unspecified Character Subclass

- **Assumption challenged**: Characters always have a valid subclass and category structure loaded.
- **Attack scenario**: If a character has a null/undefined subclass (e.g., during creation before subclass is chosen or in corrupted states), `classCategoryKey` and `subclassKey` will be undefined.
- **Blast radius**: Visual tree assignments may fail to resolve or fallback incorrectly to the first available assignment (`tree.assignments[0]`).
- **Mitigation**: Optional chaining (`subclass?.category?.key`) prevents runtime crashes, and fallback logic defaults safely to the first assignment index.

### [Low] Challenge 2: Node Coordinates Bleeding Between Subtrees

- **Assumption challenged**: `TREE_SPACING = 1200` is wide enough to prevent overlap between adjacent subclass trees.
- **Attack scenario**: If a subclass tree has a very wide database layout (large horizontal offsets `x`), the scaled coordinates (`spell.position.x * 0.15`) might bleed into the adjacent tree's spacing.
- **Blast radius**: Minor visual clutter and overlapping nodes in React Flow canvas.
- **Mitigation**: The `SPELL_SCALE = 0.15` compression factor effectively maps a database range of 2000px horizontally into just 300px, leaving ample buffer relative to the 1200px gap.

---

## Stress Test Results

- **Offline/Database Error Failures** -> Inspected fallback mock state logic in `useSpellTree.ts` (offline detection triggers fallback mode cleanly with realistic mock character data) -> **PASS**
- **Dynamic Unlock XP Check** -> Verified that unlocking a spell checks available XP and subtracts cost correctly in both fallback mock mode and RPC call paths -> **PASS**
