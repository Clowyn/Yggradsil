# Handoff Report - Spell Node Layout Analysis

## 1. Observation

In the codebase, I observed the following layouts and code parts:

- **Node Sizing and Styling**:
  In `src/components/spell-tree/SpellNode.tsx` (lines 28–33), the base class for styling specifies an `80x80px` circle using Tailwind CSS classes:
  ```typescript
  const getNodeStyles = (): string => {
    const base = `
      relative flex flex-col items-center justify-center rounded-full
      select-none transition-all duration-300
      border-2 w-[80px] h-[80px]
    `;
  ```

- **Label Positioning Outside the Circle**:
  In `src/components/spell-tree/SpellNode.tsx` (lines 180–189), the label for the spell, class, or subclass name is rendered outside/below the circle container as an absolute-positioned element:
  ```typescript
  {/* Spell name label */}
  <div
    className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap tracking-wide text-center max-w-[120px] truncate"
    style={{
      color: isDimmed || status === 'locked' ? '#555' : nodeColor,
      fontFamily: "'Cinzel', serif",
      textShadow: !isDimmed && status !== 'locked' ? `0 0 10px ${nodeColor}44` : 'none',
    }}
  >
    {name}
  </div>
  ```

- **Viewport Centering Calculations**:
  In `src/components/spell-tree/SpellTreeGraph.tsx` (lines 182–186), centering the viewport on the selected node uses a hardcoded center offset of `+40` (half of the `80px` width/height):
  ```typescript
  // Center the viewport on selected node
  const zoom = getZoom();
  setCenter(node.position.x + 40, node.position.y + 40, {
    zoom: Math.max(zoom, 1.2),
    duration: 800,
  });
  ```

- **Coordinates and Scaling Calculations**:
  In `src/hooks/useSpellTree.ts` (lines 15–17 and 469–470), spell coordinate positions are scaled down by `0.15`:
  ```typescript
  const TREE_SPACING = 1200;
  const SPELL_SCALE = 0.15;
  const SUBCLASS_Y = 200;
  ```
  ```typescript
  let spellX = (spell.position?.x || 0) * SPELL_SCALE;
  let spellY = (spell.position?.y || 0) * SPELL_SCALE;
  ```

---

## 2. Logic Chain

1. **Space Limitations**: An `80x80px` circle has a very small inner inscribing area (approx. $56 \times 56\text{ px}$). If a 24px icon and a text label (which could wrap to two lines, requiring at least 24px of vertical space) are both placed inside, it leaves less than 8px of padding. Furthermore, the circle narrows at the top and bottom, which causes text wider than 60px to overflow the boundaries.
2. **Sizing Recommendation**: Increasing the node size to `110x110px` increases the inscribing box to $78 \times 78\text{ px}$. This comfortably accommodates both the icon and a two-line wrapped text label while preserving vertical breathing room.
3. **Tailwind Styling**: The text label can be styled with standard Tailwind flex layout classes:
   - `flex flex-col items-center justify-center` (already present on parent node) to stack the icon and text vertically.
   - `px-2.5` to prevent text from touching the circular borders.
   - `line-clamp-2` and `break-words` to handle long names (such as "Greater Healing Potion" or Turkish names like "Küçük İyileştirme Merhemi") dynamically by wrapping them up to 2 lines and truncating beyond.
   - `text-[9px] md:text-[10px]` with `leading-tight` to keep font size readable yet compact.
4. **Viewport Coordinates Sync**: Since the node size is changed to `110x110px`, the center point offset must be updated in `SpellTreeGraph.tsx` from `+40` to `+55` (half of `110px`).
5. **Overlapping Mitigation**:
   - The raw coordinates from database seeds are fanned out radially with a distance of `250` units between consecutive levels.
   - At the current `SPELL_SCALE = 0.15`, the distance between nodes is only $250 \times 0.15 = 37.5$ pixels.
   - Since $37.5\text{ px} < 110\text{ px}$, increasing the node size without scaling up the graph coordinates will cause heavy overlaps.
   - Therefore, `SPELL_SCALE` should be increased to `0.5` (giving $250 \times 0.5 = 125$ pixels of distance, leaving $15\text{ px}$ of clear gap between $110\text{ px}$ circles).
   - Proproportionately, `TREE_SPACING` must be increased to `3000` (from `1200`) and `SUBCLASS_Y` to `500` (from `200`) to keep the subclass trees clean and separated.

---

## 3. Caveats

- **Database Seed Impact**: This proposal modifies frontend scaling parameters (`SPELL_SCALE`, `TREE_SPACING`, `SUBCLASS_Y`) to avoid overlapping nodes. It does not require modifying raw coordinates in the database tables, which is safer.
- **Edge Path Trajectories**: Spells with negative $y$ coordinates in the database (e.g. `al_minor_healing_salve` at `y: -99`) are positioned above their subclass parent node (e.g. subclass at `y: 200`). This is a pre-existing layout structure where edges emerge from the bottom of the subclass node and connect to the top of spell nodes above them.

---

## 4. Conclusion

Moving the text labels inside the circle nodes is highly recommended for visual cohesion, but it requires:
1. Scaling up the node circle to `110x110px`.
2. Rendering the text label inside the flex column with horizontal padding and `line-clamp-2`.
3. Updating the graph viewport centering offset to `+55`.
4. Increasing the layout scale factor `SPELL_SCALE` to `0.5` and `TREE_SPACING` to `3000` to prevent node overlapping.

Here are the concrete code changes proposed:

### Proposed Code Changes

#### 1. In `src/components/spell-tree/SpellNode.tsx`

**Before:**
```typescript
  const getNodeStyles = (): string => {
    const base = `
      relative flex flex-col items-center justify-center rounded-full
      select-none transition-all duration-300
      border-2 w-[80px] h-[80px]
    `;
...
    // Line 152: Inside motion.div
    {/* Icon */}
    <span className="text-2xl leading-none" role="img">
      {spell.icon || '🔮'}
    </span>
...
    // Line 179: Sibling absolute div outside motion.div
    {/* Spell name label */}
    <div
      className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap tracking-wide text-center max-w-[120px] truncate"
      style={{
        color: isDimmed || status === 'locked' ? '#555' : nodeColor,
        fontFamily: "'Cinzel', serif",
        textShadow: !isDimmed && status !== 'locked' ? `0 0 10px ${nodeColor}44` : 'none',
      }}
    >
      {name}
    </div>
```

**After:**
```typescript
  const getNodeStyles = (): string => {
    const base = `
      relative flex flex-col items-center justify-center rounded-full
      select-none transition-all duration-300
      border-2 w-[110px] h-[110px]
    `;
...
    // Inside motion.div
    {/* Icon */}
    <span className="text-xl md:text-2xl leading-none mb-1" role="img">
      {spell.icon || '🔮'}
    </span>

    {/* Spell name label inside */}
    <div
      className="mt-1 text-[9px] md:text-[10px] font-bold tracking-wide text-center px-2.5 font-cinzel line-clamp-2 max-w-full leading-tight"
      style={{
        color: isDimmed || status === 'locked' ? '#555' : nodeColor,
        textShadow: !isDimmed && status !== 'locked' ? `0 0 8px ${nodeColor}44` : 'none',
      }}
    >
      {name}
    </div>
...
    // (Old Spell name label sibling absolute div removed entirely)
```

---

#### 2. In `src/components/spell-tree/SpellTreeGraph.tsx`

**Before:**
```typescript
      // Center the viewport on selected node
      const zoom = getZoom();
      setCenter(node.position.x + 40, node.position.y + 40, {
        zoom: Math.max(zoom, 1.2),
        duration: 800,
      });
```

**After:**
```typescript
      // Center the viewport on selected node
      const zoom = getZoom();
      setCenter(node.position.x + 55, node.position.y + 55, {
        zoom: Math.max(zoom, 1.2),
        duration: 800,
      });
```

---

#### 3. In `src/hooks/useSpellTree.ts`

**Before:**
```typescript
const TREE_SPACING = 1200;
const SPELL_SCALE = 0.15;
const SUBCLASS_Y = 200;
```

**After:**
```typescript
const TREE_SPACING = 3000;
const SPELL_SCALE = 0.5;
const SUBCLASS_Y = 500;
```

---

## 5. Verification Method

To verify these changes:
1. Apply the code changes to `src/components/spell-tree/SpellNode.tsx`, `src/components/spell-tree/SpellTreeGraph.tsx`, and `src/hooks/useSpellTree.ts`.
2. Run `npm run build` or `npm run dev` to verify that the TypeScript compiler passes and there are no lint/build issues.
3. Open the application locally, navigate to the Spell Tree page, and verify that:
   - The nodes are displayed as `110x110px` circles.
   - The spell/class/subclass names are fully contained inside the circles below the icon.
   - Long names (e.g., "Greater Healing Potion") wrap to two lines cleanly without overflow.
   - Viewport centering on node click works accurately and centers directly on the node's updated midpoint.
   - Nodes are spaced out nicely without any overlaps due to the updated `SPELL_SCALE` and `TREE_SPACING` parameters.
