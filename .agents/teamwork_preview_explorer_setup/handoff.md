# Handoff Report — Spell Tree Explorer

## 1. Observation
We investigated the following files and codebase contexts:
* **`src/hooks/useSpellTree.ts`**:
  * Line 240: Filters `spellTrees` using a React `useMemo` block where sibling subclasses are filtered out if their key doesn't match the active character's subclass key:
    ```typescript
    // Check subclass_key
    if (assign.subclass_key && subclassKey !== assign.subclass_key) {
      return false;
    }
    ```
  * Lines 379-436: Generates class nodes for ALL 8 class categories and subclass nodes for ALL 63 subclasses in `constants.ts`.
  * Line 382: Class nodes are positioned at huge horizontal increments: `position: { x: idx * 15000, y: 0 }`.
  * Line 413: Subclass nodes are positioned at: `position: { x: classX + (sibIdx - subSiblings.length/2) * 1200, y: 500 }` where `classX = parentClassIdx * 15000`.
  * Line 368: Spell nodes are positioned at their raw coordinates: `position: spell.position || { x: 0, y: 0 }`.
  * Lines 482-500: Links subclass root nodes to tier 1 spells using the subclass edge connection:
    ```typescript
    const subclassSpellEdges: Edge[] = [];
    visibleSpells.forEach(spell => {
      if (!spell.prerequisites || spell.prerequisites.length === 0) {
        ...
        const assign = tree.assignments[0];
        if (assign && assign.subclass_key) {
          subclassSpellEdges.push({
            id: `edge-subclass-${assign.subclass_key}-spell-${spell.id}`,
            ...
    ```
* **`D:\DnD\final_seed_v3.sql`**:
  * Contains seed data for 63 spell trees and 3,150 spells.
  * Line 143: A typical spell entry position: `position = '{"x": 173, "y": -99}'::jsonb`. The coordinates represent relative positions from `(0, 0)` forming 4 quadrants (Potion, Transmutation, Explosive, Cross-Branch).
* **`src/components/spell-tree/SpellTreeGraph.tsx`**:
  * Lines 95-159: Computes `processedNodes` and `processedEdges` opacity using selected paths and branch filters. Sibling subclass opacity/dimming is currently unhandled.
* **`src/components/spell-tree/SpellNode.tsx`**:
  * Custom circular node displaying the icon and lock status. Hover shows tooltips. Opacities/filters for dimmed states and glowing beam effects are not yet implemented.
* **TypeScript Check**:
  * Proactively ran `npx tsc --noEmit` on `D:\DnD`, which succeeded with zero errors/warnings.
* **Constraints (from `RULE[AGENTS.md]`)**:
  * "Never apply CSS `transform` styles directly to React Flow nodes. React Flow uses `transform: translate(...)` internally for positioning. Use `opacity`, `filter`, or wrapper `<div>` elements for visual effects instead."

---

## 2. Logic Chain
1. **Subclass Spells Disconnected / Missing**:
   * Class category nodes are positioned at intervals of 15,000 pixels (`x = 0, 15000, 30000...`). Subclass nodes are clustered around their parent class category node (e.g. `x = 90000` for an `alchemist` subclass under `crafting` class at index 6).
   * Spells are rendered using raw coordinates from the database (centered around `x = 0, y = 0`).
   * Because of this, the `alchemist` spells appear near `x = 0` (visually under the `mage` class category), while the `alchemist` subclass node resides at `x = 90000`. The resulting horizontal distance is ~90,000 pixels, rendering them completely disconnected.
   * In addition, the edge connecting them extends 90,000 pixels horizontally, making it look broken.
   * In mock/offline mode, `MOCK_SPELL_TREES` has no `subclass_key` (only `class_key`), meaning the edge connection logic fails to find `assign.subclass_key`, leaving the mock spells floating disconnected.
2. **Auto-Selection & Filtering**:
   * Sibling subclasses are currently hidden because the tree filtering logic discards any assignment matching a subclass key other than the character's active `subclassKey`.
   * To show sibling subclass trees as dimmed, we must include all subclass spell trees within the player's class category, i.e., filter trees where `assign.class_key === classCategoryKey`.
3. **CSS Transform Restriction Compliancy**:
   * We cannot use CSS `transform` directly on the React Flow node wrappers.
   * To implement the Divine Light golden beam effect (R3) on the active subclass tree, we can render the vertical golden gradient column as absolute positioned child divs inside the active subclass's `SpellNode` component.
   * Sibling subclasses can be dimmed (R4) by passing an `isDimmed: true` property in the node's `data` object, which is then mapped to the node's native `style: { opacity: 0.35, filter: 'grayscale(80%) brightness(45%)' }` in `SpellTreeGraph.tsx`. This avoids direct CSS `transform` overrides and respects React Flow's native layout.
   * Click/hover interactions are disabled on dimmed nodes by checking `node.data.isDimmed` in `onNodeClick` and the tooltip hover callbacks.

---

## 3. Caveats
* We assumed that the coordinate system centered at `(0, 0)` is intentional to allow radial branching for each tree. Our dynamic offsetting strategy relies on this assumption by placing subclass nodes at `subclassX` and translating their spells to `subclassX + spell.position.x`.
* We assume the class category keys and subclass keys stored in the database match the static constants in `src/lib/constants.ts`. If there are mismatching keys in a real campaign database, they will fail to match assignments.

---

## 4. Conclusion
* **Diagnosis**: The subclass spells appear disconnected because subclass nodes are positioned at large offsets (`idx * 15000`) while spell nodes are placed at raw coordinates (`x ~ 0, y ~ 0`).
* **Strategy**:
  1. Filter layout to only show the active character's class category and its subclasses, spaced horizontally by 6000px centered around `x = 0`.
  2. Dynamically offset spell positions by their subclass coordinates: `x = subclassX + spell.position.x, y = subclassY + spell.position.y`.
  3. Generalize edge mapping to support subclass-level and class-level connections.
  4. Render Divine Light (R3) as pulsing golden child divs inside `SpellNode` for the active subclass root.
  5. Dim sibling subclass nodes and spells (R4) by adding `isDimmed` flags and applying styles (`style: { opacity, filter }`) in `SpellTreeGraph` and disabling interactions in click/hover events.
* **Patches**: We wrote three unified diff patch files to guide direct continuation:
  * `useSpellTree.patch`
  * `SpellTreeGraph.patch`
  * `SpellNode.patch`

---

## 5. Verification Method
1. **Compilation Check**: Run `npx tsc --noEmit` inside `D:\DnD`. It must compile with zero errors/warnings.
2. **Development Build**: Run `npm run dev` to verify the Vite dev server starts correctly.
3. **Graph Rendering Visuals**: Navigate to `/spells` on a character. Verify that:
   * Only the active character's class category and its subclasses (e.g. Alchemist, Blacksmith, etc.) are rendered.
   * The subclass nodes are separated by 6000px, and their spells are positioned directly underneath.
   * The active subclass has a vertical golden glowing beam extending upwards.
   * Sibling subclasses are grayed out, blurred, and do not show hover tooltips or trigger click actions.
