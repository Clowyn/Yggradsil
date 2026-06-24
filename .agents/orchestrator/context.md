# Context

## Domain Knowledge
- The workspace is a D&D Companion application.
- Uses React, Tailwind CSS, Supabase, and `@xyflow/react`.
- Existing Yggdrasil Stat Tree in `src/components/skill-tree/` serves as reference.
- Supabase configuration is in `src/lib/supabase.ts`.

## Decisions & Design
- Spell Trees will be stored in Supabase with RLS.
- Use a single page `/spells` with React Flow graph.
- Implement selection highlighting where ancestors/descendants of selected node are fully opaque, and others are dim.
- Spells are restricted by character race, class, subclass, and level.
