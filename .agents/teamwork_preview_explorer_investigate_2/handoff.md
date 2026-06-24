# Handoff Report — Dashboard Page & Character Mapping Investigation

## 1. Observation
- **Dashboard Implementation File**: `src/pages/DashboardPage.tsx`
  - The dashboard quick stats section currently displays a hardcoded list of demo stats (`DEMO_STATS`) at lines 31-36:
    ```typescript
    const DEMO_STATS = [
      { label: 'Level', value: '12', icon: <Sparkles size={18} />, color: 'text-gold' },
      { label: 'XP', value: '14,500', icon: <Flame size={18} />, color: 'text-gold-bright' },
      { label: 'Race', value: 'Half-Elf', icon: <Shield size={18} />, color: 'text-arcane' },
      { label: 'Class', value: 'Paladin', icon: <Sword size={18} />, color: 'text-crimson' },
    ];
    ```
  - These stats are rendered directly via `DEMO_STATS.map(...)` at line 128:
    ```typescript
    {DEMO_STATS.map((stat) => (
    ```
- **Other Hardcoded Demo Data ("Kael the Bold")**:
  - **`src/components/gm/GMDashboard.tsx`** (lines 68-76):
    ```typescript
    const INITIAL_PLAYERS: DemoPlayer[] = [
      {
        id: 'p1', name: 'Kael the Bold', race: 'Human', className: 'Warrior',
        level: 8, xp: 3400, color: '#dc2626',
        hp: { current: 72, max: 85 }, ac: 18,
        stats: { STR: 18, DEX: 12, CON: 16, INT: 10, WIS: 13, CHA: 14 },
        skills: ['Power Strike', 'Stone Skin'],
        inventory: [...DEMO_INVENTORY],
      },
      ...
    ];
    ```
  - **`src/components/gm/PlayerManager.tsx`** (lines 22-28):
    ```typescript
    const DEMO_PLAYERS: PlayerInfo[] = [
      {
        id: 'p1', name: 'Kael the Bold', race: 'Human', className: 'Warrior',
        level: 8, xp: 3400, color: '#dc2626',
        hp: { current: 72, max: 85 }, ac: 18,
        stats: { STR: 18, DEX: 12, CON: 16, INT: 10, WIS: 13, CHA: 14 },
      },
      ...
    ];
    ```
  - **`src/components/gm/XPDistributor.tsx`** (lines 19-24):
    ```typescript
    const [players, setPlayers] = useState<PlayerXP[]>([
      { id: 'p1', name: 'Kael the Bold', currentXP: 3400, level: 8, color: '#dc2626', xpToGive: 0 },
      ...
    ]);
    ```
  - **`src/components/inventory/GMItemManager.tsx`** (lines 18-23):
    ```typescript
    const DEMO_PLAYERS = [
      { id: 'p1', name: 'Kael the Bold' },
      ...
    ];
    ```

- **Active Character Fetching and Database Query**:
  - Currently, `src/contexts/CampaignContext.tsx` loads the campaign characters at lines 144-147:
    ```typescript
    // Load characters for this campaign
    const { data: charData, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('campaign_id', activeCampaignId);
    ```
    This query does not join `race_definitions` and `subclass_definitions`.
  - It sets the active character ID as follows (lines 152-160):
    ```typescript
    // Set active character
    if (charData && charData.length > 0) {
      const userCharacter = charData.find((c: any) => c.profile_id === user.id);
      if (userCharacter) {
        setActiveCharacterId(userCharacter.id);
      } else if (profile.role === 'gm') {
        setActiveCharacterId(charData[0].id); // GM defaults to first character if they don't have one
      }
    }
    ```

## 2. Logic Chain
1. Since the dashboard page (`src/pages/DashboardPage.tsx`) does not reference the active character or characters list at all, it displays hardcoded demo stats under all circumstances.
2. Even if `DashboardPage.tsx` is modified to read the active character from `useCampaign()`, the character object in `characters` array will only contain UUID foreign keys (`race_id`, `subclass_id`) because the Supabase query in `CampaignContext.tsx` selects only `*` from the `characters` table.
3. Therefore, the race and class names for a newly created character (such as `BRT the Brain Eater / Psycho Mage`) cannot be resolved or shown on the UI without loading the related definition details.
4. Joining `race:race_definitions(*)` and `subclass:subclass_definitions(*)` in the Supabase `.select(...)` statement in `CampaignContext.tsx` will correctly populate the related objects.
5. Once populated, we can map `activeCharacter`'s live data in `DashboardPage.tsx` with appropriate localization rules (races are stored under a single `name` field, whereas subclasses use `name_tr` and `name_en`).
6. If no active character is present, the app should fall back gracefully to the hardcoded `DEMO_STATS`.

## 3. Caveats
- GMs default to the first character in the campaign. If a GM does not have any characters in the campaign, `activeCharacterId` will default to `charData[0].id` if any characters exist.
- Race names only have a single `name` column in the database (unlike subclass which has `name_en` and `name_tr`). The UI mapping must access `activeCharacter.race.name` directly.

## 4. Conclusion
- To resolve the fallback bug and map the dashboard to live character data:
  1. Modify `src/contexts/CampaignContext.tsx` to include relationship joins in the Supabase characters query:
     ```typescript
     const { data: charData, error: charError } = await supabase
       .from('characters')
       .select('*, race:race_definitions(*), subclass:subclass_definitions(*)')
       .eq('campaign_id', activeCampaignId);
     ```
  2. Modify `src/pages/DashboardPage.tsx` to retrieve `characters`, `activeCharacterId` from `useCampaign()`, find the active character, and map the stats dynamically. Below is the proposed changes patch snippet:

### Proposed Changes

#### File: `src/contexts/CampaignContext.tsx`
Change line 144:
```typescript
<<<<
          // Load characters for this campaign
          const { data: charData, error: charError } = await supabase
            .from('characters')
            .select('*')
            .eq('campaign_id', activeCampaignId);
====
          // Load characters for this campaign
          const { data: charData, error: charError } = await supabase
            .from('characters')
            .select('*, race:race_definitions(*), subclass:subclass_definitions(*)')
            .eq('campaign_id', activeCampaignId);
>>>>
```

#### File: `src/pages/DashboardPage.tsx`
Replace `DEMO_STATS` usage with dynamic mapping:
```typescript
<<<<
export function DashboardPage() {
  const { profile, isGM, locale } = useAuth();
  const { campaign, members } = useCampaign();

  return (
...
      {/* Quick stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DEMO_STATS.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 flex items-center gap-3 group hover:bg-white/[0.08] transition-all duration-300"
          >
            <div className={`${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-parchment-dim font-inter">
                {stat.label}
              </p>
              <p className={`text-xl font-cinzel font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
====
export function DashboardPage() {
  const { profile, isGM, locale } = useAuth();
  const { campaign, members, characters, activeCharacterId } = useCampaign();
  const activeCharacter = characters?.find(c => c.id === activeCharacterId);

  const stats = activeCharacter
    ? [
        { 
          label: locale === 'tr' ? 'Seviye' : 'Level', 
          value: activeCharacter.level.toString(), 
          icon: <Sparkles size={18} />, 
          color: 'text-gold' 
        },
        { 
          label: locale === 'tr' ? 'XP' : 'XP', 
          value: activeCharacter.xp_total.toLocaleString(), 
          icon: <Flame size={18} />, 
          color: 'text-gold-bright' 
        },
        { 
          label: locale === 'tr' ? 'Irk' : 'Race', 
          value: activeCharacter.race?.name || '—', 
          icon: <Shield size={18} />, 
          color: 'text-arcane' 
        },
        { 
          label: locale === 'tr' ? 'Sınıf' : 'Class', 
          value: activeCharacter.subclass
            ? (locale === 'tr' ? activeCharacter.subclass.name_tr : activeCharacter.subclass.name_en)
            : '—', 
          icon: <Sword size={18} />, 
          color: 'text-crimson' 
        },
      ]
    : DEMO_STATS;

  return (
...
      {/* Quick stats */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass rounded-xl p-4 flex items-center gap-3 group hover:bg-white/[0.08] transition-all duration-300"
          >
            <div className={`${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-parchment-dim font-inter">
                {stat.label}
              </p>
              <p className={`text-xl font-cinzel font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </motion.div>
>>>>
```

## 5. Verification Method
- **Method**: Build and verify the app locally.
- **Pre-Conditions**: Ensure that the database has race/subclass definitions populated.
- **Steps**:
  1. Authenticate as a user and create a character `BRT` (Race: `Brain Eater`, Class: `Psychomage`).
  2. Navigate to the main Dashboard page.
  3. Verify that the quick stats grid displays:
     - Level: `1`
     - XP: `0`
     - Race: `Brain Eater`
     - Class: `Psychomage` (or `Psikomag` in Turkish locale)
  4. Ensure no runtime React errors occur and verify that the page renders the fallbacks correctly.
