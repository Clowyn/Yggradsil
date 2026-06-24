## 2026-06-19T15:20:22Z
You are a Worker subagent (teamwork_preview_worker).
Your working directory is d:\DnD\.agents\teamwork_preview_worker_layout_spacing_and_visuals_1
Your task is to modify the codebase at D:\DnD to address the following:
1. In `src/hooks/useSpellTree.ts`, implement paginated spells loading in the database load section to fetch all spells (since there are 3,150 spells in the database and the default select query caps at 1000). Use a loop to fetch in chunks of 1000 using range queries.
2. In `src/hooks/useSpellTree.ts`, adjust the tree layout coordinate calculations:
   - Define constants:
     * `const TREE_SPACING = 1200;`
     * `const SPELL_SCALE = 0.15;`
     * `const SUBCLASS_Y = 200;`
   - In subclass root nodes, calculate subclass node X coordinate as `(sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING` and Y coordinate as `SUBCLASS_Y`.
   - In spell nodes, scale local position X and Y by `SPELL_SCALE`.
   - In spell nodes, calculate subclassX as `(sibIdx - (activeSubclasses.length - 1) / 2) * TREE_SPACING` and subclassY as `SUBCLASS_Y`.
   - Ensure the spells are correctly shifted by these subclass offsets.
   - Adjust `subclassSpellEdges` to use subclass X/Y offsets correctly.
3. In `src/hooks/useSpellTree.ts`, make assignment lookup safer by checking subclass_key first:
   - `const assign = tree.assignments.find(a => a.subclass_key === subclassKey) || tree.assignments.find(a => a.class_key === classCategoryKey) || tree.assignments[0];`
4. In `src/hooks/useSpellTree.ts`, update `MOCK_CHARACTER` to use subclass `'blood_mage'` and category `'mage'`. Update `MOCK_SPELL_TREES` and `MOCK_SPELLS` so that they represent Mage class category, containing both a 'blood_mage' tree and a 'druid' sibling tree with some spells, showcasing the visual effects (Divine Light on Blood Mage tree, and Dark Mist on Druid sibling tree) when running in mock mode.
5. Verify that all tests pass and there are no TypeScript compiler errors by running `npx tsc --noEmit`. Run `npm run build` to confirm compilation.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please execute the changes, run build/type verification, write a handoff report (`handoff.md` and `changes.md`) in your working directory, and notify the orchestrator (conversation ID: 6a8187da-e6f4-404e-a2fa-ee91d1d2c54e) when done.
