# "Filter by Branch" UI Component Analysis & Design Proposal

This document provides a detailed code inspection of the "Filter by Branch" UI panel in the `SpellTreeGraph.tsx` component, presents a modern glassmorphic and vibrant dark fantasy design system for it, and details the implementation of a minimize/collapse control.

---

## 1. Current Implementation Analysis

### Location & Structure
The "Filter by Branch" panel is rendered inside `SpellTreeFlow` within `src/components/spell-tree/SpellTreeGraph.tsx` (lines 242–279). It is structured as an absolutely positioned overlay at the bottom-left corner of the React Flow canvas:

```tsx
{/* Branch filters */}
<motion.div
  className="absolute bottom-4 left-4 z-10 glass rounded-xl p-2.5 border border-glass-border flex flex-wrap gap-1.5 max-w-[280px]"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  <div className="text-[10px] text-gray-400 font-cinzel font-semibold uppercase tracking-widest w-full mb-1 flex items-center gap-1">
    <Filter size={10} className="text-gold" />
    <span>{locale === 'tr' ? 'Dala Göre Süz' : 'Filter by Branch'}</span>
  </div>
  <button
    onClick={() => setActiveBranchFilter(null)}
    className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 ${
      activeBranchFilter === null
        ? 'bg-gold/20 text-gold border border-gold/40'
        : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
    }`}
  >
    {locale === 'tr' ? 'Tümü' : 'All'}
  </button>
  {uniqueBranches.map(branch => {
    const color = BRANCH_COLORS[branch] || '#3b82f6';
    const isActive = activeBranchFilter === branch;
    return (
      <button
        key={branch}
        onClick={() => setActiveBranchFilter(branch)}
        className="px-2 py-1 rounded text-[10px] font-bold uppercase transition-all duration-200 border"
        style={{
          backgroundColor: isActive ? `${color}20` : 'rgba(255,255,255,0.05)',
          color: isActive ? color : '#9ca3af',
          borderColor: isActive ? `${color}60` : 'transparent',
        }}
      >
        {branch}
      </button>
    );
  })}
</motion.div>
```

### State & Interaction Flow
1. **Filter State**: Controlled by `const [activeBranchFilter, setActiveBranchFilter] = useState<string | null>(null);` in `SpellTreeFlow` (line 42).
2. **Dynamic Badges**:
   - "All" button sets filter to `null`.
   - Individual branch buttons set filter to the respective branch name.
   - Button backgrounds, text, and border colors are calculated inline dynamically (using colors imported from `BRANCH_COLORS` in `useSpellTree.ts`: `Offense` -> `#ef4444`, `Defense` -> `#3b82f6`, `Utility` -> `#10b981`, `Ultimate` -> `#eab308`, `Base` -> `#8b5cf6`).
3. **Graph Filtering**:
   - **Nodes**: Unselected branches are dimmed to `opacity: 0.15` (lines 113-118).
   - **Edges**: Edges that do not connect nodes within the active branch are dimmed to `opacity: 0.15` (lines 152-162).

### Current Styling Limitations
- **Visual Depth**: The panel uses a flat `.glass` style (`rgba(255, 255, 255, 0.05)` background and `rgba(255, 255, 255, 0.1)` border) with generic borders. It lacks the rich contrast, inner lighting, or drop shadow that define premium "dark fantasy" interfaces.
- **Vibrancy**: Active filters use simple transparent backgrounds (`color + '20'`) and borders, which feel a bit muted on a dark backdrop. There are no glow animations or volumetric light effects for active schools.
- **Space Management**: The panel is static and constantly overlays the bottom-left of the canvas. In smaller viewports or complex trees, it can block viewable nodes or controls, making a toggleable/minimize feature highly desirable.

---

## 2. Proposed Glassmorphic Dark Fantasy Design

We propose an upgraded look that blends the high-gloss modern transparency with a rich, glowing dark fantasy aesthetic:

### Design Tokens & Enhancements
1. **Lighter, Vibrant Glassmorphism**:
   - Utilize a multi-layer gradient background: `bg-gradient-to-br from-white/12 via-white/[0.04] to-transparent`.
   - Stronger backdrop blur (`backdrop-blur-xl`).
   - Add specular highlights: `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_8px_32px_0_rgba(0,0,0,0.5)]` to simulate light reflecting off a glass slab.
2. **Mystic/Gold Accents**:
   - Replace flat grey borders with an elegant dual-border technique or an explicit gold-accented gradient divider line below the panel title.
   - Use soft glowing elements like `shadow-[0_0_15px_rgba(255,215,0,0.05)]`.
3. **Volumetric Branch Badges**:
   - **Inactive Buttons**: Transparent black backdrop (`bg-black/40 hover:bg-white/5`), subtle white borders (`border-white/5 hover:border-white/20`), and transitions.
   - **Active Buttons**: Glowing, saturated buttons where each branch has its own signature visual style:
     - *Offense (Crimson)*: Crimson gradient backings, red border, and a red glow (`shadow-[0_0_12px_rgba(239,68,68,0.4)]`).
     - *Defense (Sapphire)*: Deep blue gradient, blue border, sapphire glow (`shadow-[0_0_12px_rgba(59,130,246,0.4)]`).
     - *Utility (Emerald)*: Vibrant green backing, green border, emerald glow (`shadow-[0_0_12px_rgba(16,185,129,0.4)]`).
     - *Ultimate (Aurum)*: Golden-orange gradient, gold border, solar glow (`shadow-[0_0_12px_rgba(234,179,8,0.4)]`).
   - **Glow Dots**: A miniature pulsating colored dot `span` (using `animate-pulse`) preceding the text label for the active branch.

---

## 3. Collapsible / Minimizable Control Panel

To address the screen real estate issue, we propose adding a stateful toggle that turns the filter panel into an elegant, floating glass badge (or "pill") when collapsed.

### State & Animation Strategy
1. **Collapse State**:
   ```typescript
   const [isFilterMinimized, setIsFilterMinimized] = useState(false);
   ```
2. **Motion Container**:
   We will wrap the panel in a single `motion.div` with an explicit `layout` prop. Framer Motion will handle the layout morphing (width, height, radius) automatically between the **expanded panel** and the **minimized pill**.

### Expanded State Structure
- Full header with title and a compact collapse button (e.g. an arrow or chevron icon).
- Full filter button list.
- An accent gold/amber divider line.

### Collapsed State Structure (Pill)
- A compact circular or rounded-pill container.
- An interactive `Filter` or `Compass` icon that glows if a filter is currently active.
- If a specific branch filter is selected, a small badge showing the active branch color indicator dot or the letter abbreviation.
- Hovering over the collapsed pill will scale it slightly and show a tooltip. Clicking it will expand it.

---

## 4. Code Snippets: Implementation Detail

Below is the proposed React JSX replacement structure to be implemented in `SpellTreeGraph.tsx`:

```tsx
// 1. Add state hook at the top of SpellTreeFlow component:
const [isFilterMinimized, setIsFilterMinimized] = useState(false);
```

```tsx
{/* Proposed "Filter by Branch" UI Replacement */}
<motion.div
  layout
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{
    layout: { duration: 0.3, type: "spring", stiffness: 200, damping: 25 },
    opacity: { duration: 0.2 }
  }}
  className={`absolute bottom-4 left-4 z-10 rounded-xl border backdrop-blur-xl shadow-2xl transition-colors duration-300 ${
    isFilterMinimized
      ? "p-2 bg-gradient-to-br from-white/10 via-white/[0.03] to-transparent border-gold/30 cursor-pointer hover:border-gold/60"
      : "p-3 bg-gradient-to-br from-white/12 via-white/[0.04] to-transparent border-white/10 w-[290px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
  }`}
  onClick={() => {
    if (isFilterMinimized) setIsFilterMinimized(false);
  }}
>
  {isFilterMinimized ? (
    /* COLLAPSED PILL STATE */
    <div className="flex items-center justify-center gap-1.5 relative group">
      <div className="relative">
        <Filter 
          size={14} 
          className={`transition-colors duration-300 ${
            activeBranchFilter ? "text-gold animate-pulse" : "text-gray-400"
          }`} 
        />
        {activeBranchFilter && (
          <span 
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black" 
            style={{ backgroundColor: BRANCH_COLORS[activeBranchFilter] || "#3b82f6" }}
          />
        )}
      </div>
      <span className="text-[10px] font-cinzel font-bold text-gold uppercase tracking-wider select-none">
        {activeBranchFilter ? activeBranchFilter : (locale === 'tr' ? 'Süzgeç' : 'Filters')}
      </span>
      
      {/* Tooltip on Hover */}
      <div className="absolute left-full ml-2 px-2 py-1 bg-void/95 border border-gold/20 text-gold text-[9px] font-cinzel rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-xl">
        {locale === 'tr' ? 'Süzgeçleri Aç' : 'Expand Filters'}
      </div>
    </div>
  ) : (
    /* EXPANDED PANEL STATE */
    <div className="flex flex-col gap-2">
      {/* Header with toggle */}
      <div className="flex items-center justify-between w-full pb-1.5 border-b border-white/5">
        <div className="text-[10px] text-gold-gradient font-cinzel font-semibold uppercase tracking-widest flex items-center gap-1">
          <Filter size={10} className="text-gold" />
          <span>{locale === 'tr' ? 'Dala Göre Süz' : 'Filter by Branch'}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering parent expand onClick
            setIsFilterMinimized(true);
          }}
          className="text-gray-500 hover:text-gold hover:bg-white/5 p-0.5 rounded transition-all"
          title={locale === 'tr' ? 'Paneli Küçült' : 'Minimize Panel'}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Button Grid */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {/* 'All' Button */}
        <button
          onClick={() => setActiveBranchFilter(null)}
          className={`px-2.5 py-1 rounded text-[10px] font-cinzel font-bold uppercase transition-all duration-200 border cursor-pointer ${
            activeBranchFilter === null
              ? 'bg-gold/15 text-gold border-gold/40 shadow-[0_0_8px_rgba(255,215,0,0.2)]'
              : 'bg-black/30 text-gray-400 border-white/5 hover:bg-white/5 hover:text-gray-200'
          }`}
        >
          {locale === 'tr' ? 'Tümü' : 'All'}
        </button>

        {/* Dynamic Branch Buttons */}
        {uniqueBranches.map(branch => {
          const color = BRANCH_COLORS[branch] || '#3b82f6';
          const isActive = activeBranchFilter === branch;
          return (
            <button
              key={branch}
              onClick={() => setActiveBranchFilter(branch)}
              className="px-2.5 py-1 rounded text-[10px] font-cinzel font-bold uppercase transition-all duration-300 border flex items-center gap-1 cursor-pointer"
              style={{
                backgroundColor: isActive ? `${color}18` : 'rgba(0,0,0,0.3)',
                color: isActive ? '#ffffff' : '#9ca3af',
                borderColor: isActive ? `${color}80` : 'rgba(255,255,255,0.05)',
                boxShadow: isActive ? `0 0 10px -1px ${color}50` : 'none',
              }}
            >
              {isActive && (
                <span 
                  className="w-1.5 h-1.5 rounded-full animate-pulse" 
                  style={{ backgroundColor: color }}
                />
              )}
              <span style={{ color: isActive ? color : undefined }}>
                {branch}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  )}
</motion.div>
```

---

## 5. Verification Method

Once implemented by a developer/implementer agent, this UI update can be verified using the following steps:
1. **Interactive Check**:
   - Clicking on individual branches (e.g. Offense, Defense) should correctly toggle the branch active state.
   - Visually confirm that other branches dim, and the selected branch glows with its assigned color.
   - Click the "Minimize" icon button in the header. Visually verify the panel smoothly morphs into a compact gold-bordered pill displaying the filter status/icon.
   - Click the minimized pill and verify it expands back into the full panel.
2. **Build and Test Verification**:
   - Run Vite build: `npm run build` or `npx vite build` to ensure typescript and bundler compile successfully without syntax or style errors.
   - Verify layout rules: Ensure no React Flow styling violations occur (e.g. no direct CSS `transform` styles applied to nodes, only classes and opacities as implemented above).
