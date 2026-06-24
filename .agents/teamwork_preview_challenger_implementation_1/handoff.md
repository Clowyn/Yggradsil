# Challenge & Handoff Report - Character Creation and Map Token Logic

This report presents findings, logical reasoning, and stress-tests for the character creation logic, stats calculations, default map token values, and user assignments.

---

## 1. Observation
We observed the following code components, database files, and compiler outputs:

1. **Character Creation Stats Calculation**:
   - In `src/components/character/CharacterCreation.tsx` (lines 123-132):
     ```typescript
     const statsToInsert = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => {
       const raceBonus = (raceData.stat_bonuses as Record<string, number>)?.[stat] ?? 0;
       const classBonus = (subclassData.base_stats as Record<string, number>)?.[stat] ?? 0;
       return {
         character_id: charData.id,
         stat_key: stat as any,
         base_value: 10 + raceBonus + classBonus,
         bonus_value: 0
       };
     });
     ```
   - In `src/components/gm/GMDashboard.tsx` (lines 448-457):
     ```typescript
     const statsToInsert = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(stat => {
       const raceBonus = race?.stat_bonuses?.[stat] ?? 0;
       const subclassBonus = subclass?.base_stats?.[stat] ?? 0;
       return {
         character_id: char.id,
         stat_key: stat,
         base_value: 10 + raceBonus + subclassBonus,
         bonus_value: 0
       };
     });
     ```
   - In `src/components/character/CharacterReview.tsx` (lines 19-24):
     ```typescript
     const getStatTotal = (stat: StatKey): { base: number; raceBonus: number; classBonus: number; total: number } => {
       const base = 10;
       const raceBonus = (race?.stat_bonuses as Partial<Record<StatKey, number>> | undefined)?.[stat] ?? 0;
       const classBonus = (subclass?.base_stats as Partial<Record<StatKey, number>> | undefined)?.[stat] ?? 0;
       return { base, raceBonus, classBonus, total: base + raceBonus + classBonus };
     };
     ```

2. **Map Token Creation Defaults**:
   - In `src/components/character/CharacterCreation.tsx` (lines 140-146):
     ```typescript
     await supabase.from('map_tokens').insert({
       character_id: charData.id,
       campaign_id: campaign.id,
       x_position: 600,
       y_position: 400,
       color: '#ffd700',
     });
     ```
   - In `src/components/gm/GMDashboard.tsx` (lines 463-469):
     ```typescript
     const { error: tokenErr } = await supabase.from('map_tokens').insert({
       character_id: char.id,
       campaign_id: campaign.id,
       x_position: 600,
       y_position: 400,
       color: '#ffd700',
     });
     ```
   - In the database schema `schema.sql` (lines 179-190):
     ```sql
     CREATE TABLE map_tokens (
       id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
       character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
       campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
       x_position int DEFAULT 0,
       y_position int DEFAULT 0,
       icon_url text,
       color text DEFAULT '#ffffff',
       updated_at timestamptz DEFAULT now(),
       UNIQUE(character_id, campaign_id)
     );
     ```

3. **Map Frontend Component Integration**:
   - In `src/hooks/useMap.ts` (lines 70-82), only local mock data is used for displaying and updating tokens. There is no query to Supabase `map_tokens` table:
     ```typescript
     export function useMap() {
       const [mapState, setMapState] = useState<MapStateLocal>(INITIAL_MAP_STATE);
       const [tokens, setTokens] = useState<MapToken[]>(INITIAL_TOKENS);
       const [isGM] = useState(true);
       ...
     ```

4. **TypeScript Build Failures**:
   Running `npm run build` returned the following exit code 1 errors:
   ```
   src/components/gm/GMDashboard.tsx(253,41): error TS18048: 'equippedArmor.item_definition' is possibly 'undefined'.
   src/components/gm/GMDashboard.tsx(449,27): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Partial<Record<StatKey, number>>'.
   src/components/gm/GMDashboard.tsx(450,31): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Partial<Record<StatKey, number>>'.
   ```

---

## 2. Logic Chain
- **Formula Verification**: The mathematical formula `10 + (race_bonus) + (subclass_bonus)` is correctly implemented in `CharacterCreation.tsx`, `GMDashboard.tsx`, and `CharacterReview.tsx`. Each location uses base `10` and fetches the respective stat values from the `stat_bonuses` field in the race definition and `base_stats` field in the subclass definition.
- **Default Value Discrepancy**: While the database schema specifies defaults of `0` for `x_position` and `y_position`, and `'#ffffff'` for `color`, the code inserts hardcoded values of `600`, `400`, and `'#ffd700'`. This creates an inconsistency: direct database inserts will default to `(0, 0)` with white tokens, whereas characters created via the app will start at `(600, 400)` with gold tokens.
- **Visual Overlap Failure Mode**: Spawning all tokens at exactly `(600, 400)` with the same color `#ffd700` means multiple characters created in a campaign will visually overlap perfectly on top of each other, making them look like a single token until dragged.
- **Disconnected Map Layer**: Because `useMap.ts` relies strictly on hardcoded mock tokens (`token-1` to `token-4` for `Kael`, `Lyria`, `Thorne`, and `Mora`), any character tokens inserted during character creation in the database are never loaded or synced on the Map page.
- **Build Blockers**: The build fails because `GMDashboard.tsx` attempts to index `race?.stat_bonuses` and `subclass?.base_stats` using a variable of type `string` (without casting to `Record<string, number>` as was done in `CharacterCreation.tsx`), and due to an unsafe optional property access on `equippedArmor.item_definition`.

---

## 3. Caveats
- We did not connect to a live Supabase instance; our evaluation is based entirely on source code analysis and local unit testing.
- We did not evaluate the styling aspect of React Flow nodes since we are requested to review only backend/DB integration of character creation and map tokens.

---

## 4. Conclusion
- **Stats Calculations**: Mathematically correct, but blocked by TypeScript compilation errors in `GMDashboard.tsx`.
- **Default Map Tokens**: The application inserts `x_position: 600`, `y_position: 400`, and `color: '#ffd700'`. This disagrees with the DB schema defaults (`0`, `0`, `'#ffffff'`).
- **User Assignment**: Correctly configured on the database layer using foreign keys and RLS constraints, but completely missing on the frontend map layer due to mock-only implementation in `useMap.ts`.

---

## 5. Challenge Report (Adversarial Review)

### **Overall risk assessment**: HIGH

Since the map visualization does not load database tokens, and the project cannot be built due to TS errors, the system is in an unusable state for production.

### Challenges

#### [High] Challenge 1: Decoupled Map View
- **Assumption challenged**: That the map interface dynamically retrieves and renders map tokens created during character creation.
- **Attack scenario**: A player creates a character. The token is inserted into `map_tokens` in Supabase. The player goes to the map view, but the token is not visible. Only mock data characters appear.
- **Blast radius**: Players and GMs cannot see, position, or track their actual characters on the campaign map.
- **Mitigation**: Update `src/hooks/useMap.ts` to query `map_tokens` from Supabase for the current `campaign_id` and listen for realtime updates.

#### [Medium] Challenge 2: Perfect Spawning Overlap
- **Assumption challenged**: That default coordinates `(600, 400)` and color `#ffd700` are sufficient starting values.
- **Attack scenario**: Multiple players create characters. All tokens spawn at `(600, 400)` with gold color `#ffd700`. The tokens are rendered directly on top of each other, making them look like a single token.
- **Blast radius**: Poor user experience on character initialization. Players must click and drag to find hidden tokens underneath.
- **Mitigation**: Apply a small random offset to spawn coordinates (e.g., `600 + Math.random() * 40 - 20`) or let players choose starting positions, and assign distinct colors based on the chosen subclass or class category.

#### [High] Challenge 3: TypeScript Build Failure
- **Assumption challenged**: That the project builds cleanly.
- **Attack scenario**: Attempting to deploy or build the application via `npm run build` fails due to typing mismatch and unsafe index operations.
- **Blast radius**: The build cannot be deployed to any hosting service.
- **Mitigation**: In `src/components/gm/GMDashboard.tsx`, cast `race?.stat_bonuses` and `subclass?.base_stats` as `Record<string, number>`, and add a guard for `equippedArmor.item_definition`.

---

## 6. Stress Test Results

We wrote and executed `scripts/verify-character-creation.js` to test stats math and map token defaults under multiple scenarios:

- **Scenario 1**: Human Berserker stats math -> Expected: STR 14, other stats 11 -> Actual: STR 14, others 11 -> **PASS**
- **Scenario 2**: Elf Druid stats math -> Expected: DEX 12, INT 12, WIS 13, others 10 -> Actual: DEX 12, INT 12, WIS 13, others 10 -> **PASS**
- **Scenario 3**: Goblin Wall Guard negative stats check -> Expected: CON 12, DEX 12, others 10 -> Actual: CON 12, DEX 12, others 10 -> **PASS**
- **Scenario 4**: Default token properties verification -> Expected: x_position 600, y_position 400, color '#ffd700', mapped to character/campaign -> Actual: x_position 600, y_position 400, color '#ffd700', mapped -> **PASS**

---

## 7. Verification Method
1. To run the automated stats calculation and map token validation tests:
   ```powershell
   node scripts/verify-character-creation.js
   ```
2. To verify the compilation failures:
   ```powershell
   npm run build
   ```
3. To inspect character creation logic:
   - `src/components/character/CharacterCreation.tsx` (Line 123-146)
   - `src/components/gm/GMDashboard.tsx` (Line 448-469)
