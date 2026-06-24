# Project: Live Data Integration & GM Character Management

## Architecture
- **CampaignContext (`src/contexts/CampaignContext.tsx`)**: Integrates nested Supabase query to fetch characters with profiles, subclasses, class categories, races, and race tiers. Updates state to typed `Character[]` and propagates it to consumers.
- **DashboardPage (`src/pages/DashboardPage.tsx`)**: Fetches active character from CampaignContext and dynamically maps Stats (Level, XP, Race, Class) with fallback to `DEMO_STATS` if no active character exists.
- **GMDashboard (`src/components/gm/GMDashboard.tsx`)**: Party and XP tabs display live character data. Integrates modal/form for GMs to create characters, insert default stats and map tokens, and distribute XP.
- **Database Migrations (`schema.sql` / new migration sql)**: Updates RLS policies to allow GMs to create characters and character details (stats, tokens) for campaign players.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | RLS SQL Migration | Add RLS policies for GM inserts on characters, character_stats, and map_tokens tables | None | PLANNED |
| 2 | CampaignContext Integration | Update CampaignContext query to join race/subclass/class/profile relations and type character state | M1 | PLANNED |
| 3 | DashboardPage Integration | Replace hardcoded stats on DashboardPage with dynamic, localized stats from active character | M2 | PLANNED |
| 4 | GM Dashboard Party/XP Tabs | Integrate GMDashboard Party/XP tabs with live characters list; implement XP distribution and persistence | M2 | PLANNED |
| 5 | GM Character Creation | Implement form/modal in GMDashboard to create characters with stats/tokens and assign them to users | M4 | PLANNED |
| 6 | E2E Verification & Auditing | Run TypeScript compiler and perform visual, runtime, and integrity checks | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts
- `Character` (from `src/lib/types.ts`) contains:
  - `race?: RaceDefinition`
  - `subclass?: SubclassDefinition`
  - `profile?: Profile`
- SubclassDefinition contains `category?: ClassCategory`.
- RaceDefinition contains `tier?: RaceTier`.
- GMDashboard character mapping converts `Character` to a schema conforming to `DemoPlayer`.

## Code Layout
- Contexts: `src/contexts/CampaignContext.tsx`
- Pages: `src/pages/DashboardPage.tsx`
- GM Components: `src/components/gm/GMDashboard.tsx`
- Types: `src/lib/types.ts`
- Migrations: `src/lib/supabase.ts` (or a dedicated SQL migration file)
