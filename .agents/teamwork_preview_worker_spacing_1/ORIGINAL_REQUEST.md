## 2026-06-20T02:04:54Z
You are teamwork_preview_worker_spacing_1. Your working directory is D:\DnD\.agents\teamwork_preview_worker_spacing_1.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task is to implement the layout spacing improvements and Filter UI modernization as detailed below.

### 1. File Modifications

#### A. In `D:\DnD\src\hooks\useSpellTree.ts`:
1. Increase `TREE_SPACING` from `1200` to `2500` (line 15).
2. Inside the `calculateSpellCoordinates` function, replace the static layout calculation with the dynamic vertical layout algorithm and relaxed horizontal spacing.
   Specifically, replace the code starting from the definition of layout spacing constants (lines 207-221):
   ```typescript
   // Layout Spacing Constants
   const TIER_HEIGHT = 220;
   const ROW_HEIGHT = 70;
   const Y_OFFSET = 120;

   // Group spells by their Y coordinate level
   const levelsMap: Record<number, SpellNode[]> = {};
   spells.forEach((s) => {
     const d = getDepth(s.spell_key);
     const y = Y_OFFSET + (s.tier - 1) * TIER_HEIGHT + d * ROW_HEIGHT;

     if (!levelsMap[y]) {
       levelsMap[y] = [];
     }
     levelsMap[y].push(s);
   });
   ```
   With:
   ```typescript
   // Dynamic Layout Spacing Constants
   const ROW_HEIGHT = 180;
   const TIER_GAP = 220;
   const Y_OFFSET = 120;

   // Calculate max depth for each tier first
   const maxDepthByTier: Record<number, number> = {};
   spells.forEach((s) => {
     const tier = s.tier;
     const d = getDepth(s.spell_key);
     maxDepthByTier[tier] = Math.max(maxDepthByTier[tier] || 0, d);
   });

   // Compute starting Y position for each tier (1 to 5)
   const tierStartY: Record<number, number> = {};
   tierStartY[1] = Y_OFFSET;
   for (let t = 2; t <= 5; t++) {
     const prevMaxDepth = maxDepthByTier[t - 1] !== undefined ? maxDepthByTier[t - 1] : 0;
     const prevStartY = tierStartY[t - 1] !== undefined ? tierStartY[t - 1] : Y_OFFSET;
     tierStartY[t] = prevStartY + (prevMaxDepth * ROW_HEIGHT) + TIER_GAP;
   }

   // Group spells by their calculated Y coordinate
   const levelsMap: Record<number, SpellNode[]> = {};
   spells.forEach((s) => {
     const d = getDepth(s.spell_key);
     const y = tierStartY[s.tier] + d * ROW_HEIGHT;

     if (!levelsMap[y]) {
       levelsMap[y] = [];
     }
     levelsMap[y].push(s);
   });
   ```
3. Locate where `X_GAP` is calculated and spaced horizontally (around lines 258-261):
   ```typescript
   const X_GAP = Math.min(150, 900 / Math.max(M - 1, 1));
   sortedSpells.forEach((s, idx) => {
     const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
     positions[s.spell_key] = { x, y };
   });
   ```
   Replace it with:
   ```typescript
   const X_GAP = Math.max(135, Math.min(180, 1400 / Math.max(M - 1, 1)));
   sortedSpells.forEach((s, idx) => {
     const x = M > 1 ? (idx - (M - 1) / 2) * X_GAP : 0;
     positions[s.spell_key] = { x, y };
   });
   ```

#### B. In `D:\DnD\src\components\spell-tree\SpellTreeGraph.tsx`:
1. Add a state hook at the top of the `SpellTreeFlow` component (around line 43), right below `activeBranchFilter`:
   ```typescript
   const [isFilterMinimized, setIsFilterMinimized] = useState(false);
   ```
2. Replace the entire Branch filters container (lines 241-279):
   ```tsx
   {/* Branch filters */}
   <motion.div
     className="absolute bottom-4 left-4 z-10 glass rounded-xl p-2.5 border border-glass-border flex flex-wrap gap-1.5 max-w-[280px]"
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
   >
     ...
   </motion.div>
   ```
   With the upgraded glassmorphic and collapsible UI:
   ```tsx
   {/* Branch filters overlay */}
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
           <div className="text-[10px] text-gold font-cinzel font-semibold uppercase tracking-widest flex items-center gap-1">
             <Filter size={10} className="text-gold" />
             <span>{locale === 'tr' ? 'Dala Göre Süz' : 'Filter by Branch'}</span>
           </div>
           <button
             onClick={(e) => {
               e.stopPropagation(); // Avoid triggering parent expand onClick
               setIsFilterMinimized(true);
             }}
             className="text-gray-500 hover:text-gold hover:bg-white/5 p-0.5 rounded transition-all cursor-pointer"
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

### 2. Verification

After completing changes, run typescript compiler validation command from workspace root D:\DnD:
`npx tsc --noEmit`
Verify that it succeeds with no errors.
Run Vite build check to ensure everything bundles cleanly.
Verify all changes and provide a detailed handoff.md under your working directory before sending a message back to me.
