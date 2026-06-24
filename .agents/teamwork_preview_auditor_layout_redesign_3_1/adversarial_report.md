# Adversarial Challenge Report

**Overall risk assessment**: MEDIUM

## Challenges

### [Medium] Challenge 1: Synchronous State Updates in useEffect
- **Assumption challenged**: Calling multiple React state setters (`setIsFallbackMode`, `setSpellTrees`, `setSpells`, `setCharacter`) synchronously inside `useEffect` on hook initialization is safe.
- **Attack scenario**: When the hook mounts with a null `characterId`, these state changes trigger synchronous cascading renders. ESLint flags this under `react-hooks/set-state-in-effect`.
- **Blast radius**: Medium. Leads to redundant rendering cycles on component mount, which degrades React render performance.
- **Mitigation**: Initialize state values with default mock data if `characterId` is null/undefined directly in the `useState` initializers, rather than modifying state via `useEffect` after mounting.

### [Low] Challenge 2: Topological Layout with Cyclic Prerequisites
- **Assumption challenged**: Prerequisite chains in spell trees are always directed acyclic graphs (DAGs).
- **Attack scenario**: A GM user introduces a cycle in prerequisites (e.g., Spell A requires Spell B, which requires Spell A). 
- **Blast radius**: Low. The topological layout algorithm `getDepth` has cycle detection (`visiting` set check) and returns depth `0` for cyclic nodes. While it avoids infinite loops and stack overflow, it causes overlapping nodes to render on top of each other.
- **Mitigation**: Enforce database triggers or validation rules on the spell schema/API to prevent circular references in prerequisites.

### [Medium] Challenge 3: Type Safety Bypass via 'any' Casting
- **Assumption challenged**: The database schema fields (e.g. `level_prerequisite` vs `min_level`) will always map to properties of `SpellNode` without static typing.
- **Attack scenario**: `(spell as any).level_prerequisite` and `(spell as any).min_level` bypass TS verification. If the API returns a different structure or changes properties, errors will occur silently during runtime.
- **Blast radius**: Medium. Uncaught runtime exceptions if database schemas change and TS compilation doesn't catch them.
- **Mitigation**: Update the `SpellNode` type definition in `src/lib/types.ts` to include optional properties rather than casting to `any`.

---

## Stress Test Results

- **Empty spell list** → `calculateSpellCoordinates` returns empty object → Coordinates default safely → **Pass**
- **Disconnected database** → Catch block activates, fallback mode becomes active, mocks load → Interactive UI functions → **Pass**
- **Circular prerequisite** → Cycle detected in recursion, depth set to 0, no call stack size exceeded → Overlapped rendering → **Pass**
- **Varying branch names** → `BRANCH_COLORS` key lookup defaults gracefully → Correct rendering → **Pass**

---

## Unchallenged Areas

- **Vite/Rolldown bundler optimization** — Out of scope for React compilation and source code audit.
- **Supabase RPC security** — Verification of PostgreSQL policy rules for `unlock_spell` function was not verified directly on database.
