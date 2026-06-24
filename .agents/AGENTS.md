# Project Specific Rules

## React Flow Node Styling
Never apply CSS `transform` styles directly to React Flow nodes. React Flow uses `transform: translate(...)` internally for positioning. Use `opacity`, `filter`, or wrapper `<div>` elements for visual effects instead.

## RPG Inventory Grid Design
For RPG-style inventory grids, use a fixed-size slot array (e.g., `SlotData[]` with nullable items) instead of a dynamic item array with `arrayMove`. Each slot (including empty ones) should be a `useSortable` drop target. Drag operations should SWAP slot contents, not shift/reorder.

## Database Schema ↔ Frontend Name Consistency
When creating database migration SQL, always verify that table and column names exactly match the TypeScript interfaces and Supabase query strings in the frontend code. Check the types file (e.g., types.ts) and any hooks that call `supabase.from('table_name')` before writing migrations.
