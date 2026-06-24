# Progress

## Current Status
Last visited: 2026-06-19T16:40:21+03:00

- [x] Update `src/hooks/useSpellTree.ts` to implement subclass tree filtering, active subclasses centering, dynamic coordinate offsetting, and generalised subclass-level/class-level edge connections (R1, R2).
- [x] Update `src/components/spell-tree/SpellTreeGraph.tsx` to handle node styling (`isDimmed` opacity/filter) and disable click/hover viewport centering on dimmed nodes (R4).
- [x] Update `src/components/spell-tree/SpellNode.tsx` to display the golden pulsing Divine Light column for the active subclass root node (R3) and Dark Mist for inactive subclass root node, disable hover tooltips on dimmed nodes, and adjust visual states (R3, R4).
- [x] Verify TypeScript compilation with `npx tsc --noEmit`.
- [x] Run unit tests with `node scripts/test-spell-tree.js`.
- [x] Run Vite production build with `npm run build`.
- [x] Generate detailed handoff report in `handoff.md`.
