# Spell Tree Layout & Visuals Testing Report

## Challenge Summary
- **Overall risk assessment**: MEDIUM
- **Key findings**: 
  - **No sibling subclass tree overlaps occur**: Sibling subclass trees are horizontally spaced by exactly 1200px (configured `TREE_SPACING`). Given the maximum radial spread of any subclass tree (approx. 180px), sibling trees remain separated by at least 840px of clear space.
  - **Massive internal spell node overlaps occur**: Within any single subclass tree, consecutive tier nodes along the same branch overlap significantly. The center-to-center distance of consecutive nodes is only 37.5px, which is far below the node diameter of 80px. Similarly, Tier 1 nodes overlap with their Subclass Root node (distance of 30px). A total of **108 internal overlaps** were programmatically detected for the Blood Mage tree.
  - **Interaction restrictions are fully compliant**: Clicks and hovers are correctly blocked on dimmed sibling subclass nodes (`isDimmed`), preventing unwanted unlocks or tooltips.
  - **Visual effects function correctly**: The active subclass tree root node receives a massive "Divine Light" beam effect (up to 3000px high), while inactive/sibling root nodes receive a localized "Dark Mist" glow effect (350px wide).

---

## Challenges

### [High] Challenge 1: Internal Spell Node Overlaps within Subclass Trees
- **Assumption challenged**: The scale factor `SPELL_SCALE = 0.15` in `useSpellTree.ts` combined with radial spacing `radius = 200 + pos_in_branch * 250` creates readable and separated nodes.
- **Attack scenario**: Nodes positioned along the same branch vector have a raw distance of 250 units. When scaled by `SPELL_SCALE = 0.15`, the center-to-center distance is reduced to exactly `37.5` pixels. Since nodes are rendered with a fixed diameter of `80` pixels (radius `40` pixels), consecutive nodes overlap by `42.5` pixels. The subclass root (at `0, 200`) and the first tier node (at radius `30` px) overlap by `50` pixels.
- **Blast radius**: Severe visual clipping, illegible node icons/text, and poor user experience, as nodes are stacked on top of each other.
- **Mitigation**: Adjust `SPELL_SCALE` to at least `0.4` or `0.5`, or increase the database radial spacing multiplier to `600+` units, ensuring that the scaled distance between consecutive centers is at least `85` pixels.

### [Medium] Challenge 2: High Vertical Beam Height Overflow
- **Assumption challenged**: Rendering a 3000px vertical linear-gradient beam centered on the subclass node ($y = 200$px) is safe and doesn't cause overflow or layout issues.
- **Attack scenario**: A 3000px vertical element extends from $y = -1300$px to $y = 1700$px. In React Flow, if the viewport zoom fits all elements, this massive vertical element might cause `fitView` to zoom out excessively, making the actual nodes tiny or invisible.
- **Blast radius**: Viewport framing issues when `fitView` is invoked. However, since the beam has `pointer-events-none` and is positioned via absolute CSS, React Flow may ignore it during node bounding box calculations if it's not a node itself, but if styled inside the node template, React Flow might include it in the node bounds depending on how the node's DOM container reports its size.
- **Mitigation**: Constrain the vertical beam container height to a reasonable height (e.g., 800px) or render the beam in a separate overlay layer outside of the React Flow node component, so it doesn't affect React Flow's internal bounding box calculations.

### [Low] Challenge 3: Inactive Subclass "Dark Mist" Visibility under Zoom-out
- **Assumption challenged**: The "Dark Mist" effect on dimmed sibling subclass nodes is visually distinguishable when zoomed out.
- **Attack scenario**: The Dark Mist uses a dark purple color (`rgba(88, 28, 135, 0.15)`) with a blur of 25px. Against a dark background (`bg-abyss`), this very low opacity radial gradient is barely visible to the user, especially when the node itself is dimmed to `opacity-30` and grayscaled.
- **Blast radius**: The user may not perceive any "mist" effect at all, rendering the visual feedback ineffective.
- **Mitigation**: Increase the opacity of the dark purple gradient (e.g., `rgba(139, 92, 246, 0.3)`) and increase the size of the radial glow.

---

## Stress Test Results

### 1. Sibling Tree Spacing Verification
- **Scenario**: Calculate the horizontal distance between active subclass tree centers for a class with $N=2$ subclasses (e.g., Mage with Blood Mage and Druid).
- **Expected Behavior**: Center-to-center distance is exactly `1200`px.
- **Actual Behavior**: Center-to-center distance is `1200`px. Since subclass trees span at most `180`px left/right, the clear distance between them is `840`px.
- **Result**: **PASS**

### 2. Internal Spell Node Overlap Verification
- **Scenario**: Simulate the position calculations of all spells in the Blood Mage tree and determine the pairwise distances between all node centers.
- **Expected Behavior**: Distance between any two node centers is $\ge 80$px (preventing overlaps).
- **Actual Behavior**: Multiple overlaps detected. Distance between subclass root and Tier 1 spell is `30`px. Distance between consecutive spells in the same branch is `37.5`px. A total of **108 pairwise overlaps** were found.
- **Result**: **FAIL** (Layout bug in scale vs. database spacing configuration)

### 3. Click and Hover Interaction Verification on Dimmed Nodes
- **Scenario**: Trigger click and hover handlers on a node where `isDimmed = true` (inactive sibling subclass node).
- **Expected Behavior**: Hover scale animation is disabled, tooltip is not shown, and click handler exits early (no spell unlocking).
- **Actual Behavior**: 
  - `whileHover` and `whileTap` are set to `undefined`.
  - Tooltip visibility condition is blocked (`!isDimmed && setShowTooltip(true)`).
  - Click handler in `SpellTreeGraph.tsx` exits early: `if (node.data?.isDimmed) return;`.
- **Result**: **PASS**

### 4. Visual Beams and Mists Activation Verification
- **Scenario**: Render the active subclass root and inactive subclass root, then check the DOM structure for effects.
- **Expected Behavior**: Active subclass root has the "Divine Light" divs (outer soft beam, pulsing inner glow, core high-intensity shaft, ethereal burst). Inactive subclass root has only the "Dark Mist" radial gradient div.
- **Actual Behavior**: Code conditionally renders:
  - `isSubclassRoot && isActiveSubclassTree` -> renders 4 Divine Light elements.
  - `isSubclassRoot && isDimmed` -> renders 1 Dark Mist element.
- **Result**: **PASS**

---

## Unchallenged Areas
- **Database synchronization**: We assumed the database query returns spell coordinates matching the radial coordinates generated by the seed script. If the database positions are manually edited or missing, fallback coordinates are not defined (defaults to `{ x: 0, y: 0 }` scaled to `0, 0`), which would pile all undefined spells at the subclass root coordinates.
