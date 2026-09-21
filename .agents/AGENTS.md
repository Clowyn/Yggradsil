# Project Specific Rules

## React Flow Node Styling
Never apply CSS `transform` styles directly to React Flow nodes. React Flow uses `transform: translate(...)` internally for positioning. Use `opacity`, `filter`, or wrapper `<div>` elements for visual effects instead.

## RPG Inventory Grid Design
For RPG-style inventory grids, use a fixed-size slot array (e.g., `SlotData[]` with nullable items) instead of a dynamic item array with `arrayMove`. Each slot (including empty ones) should be a `useSortable` drop target. Drag operations should SWAP slot contents, not shift/reorder.

## Database Schema ↔ Frontend Name Consistency
When creating database migration SQL, always verify that table and column names exactly match the TypeScript interfaces and Supabase query strings in the frontend code. Check the types file (e.g., types.ts) and any hooks that call `supabase.from('table_name')` before writing migrations.

## Supabase RLS Role-Check Functions (Anti-Recursion)
Never check user roles in Row Level Security policies using inline queries like `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` on the `profiles` table or related tables. Doing so causes PostgreSQL error `42P17 (infinite recursion)`. Always define and use `SECURITY DEFINER` helper functions (e.g. `public.is_admin()`, `public.is_gm()`) with `SET search_path = public` to query roles while bypassing RLS.

## Large-Scale React Flow Performance
For React Flow graphs with over 50 nodes (such as the Spell Tree and Skill Tree):
1. Always enable `onlyRenderVisibleElements={true}` to cull off-screen nodes from the DOM.
2. Custom node and edge components must implement custom equality comparators with `React.memo(Component, arePropsEqual)` because `node.data` is typically instantiated as a new object literal on recalculation.
3. Never apply heavy multi-filter CSS stacks (`grayscale()`, `brightness()`, `contrast()`) directly to React Flow node containers; use compositor `opacity` or styled inner elements instead.
4. Suppress SVG SMIL `<animateMotion>` loops on dimmed or invisible edges to avoid running background animation calculations on the main thread.
