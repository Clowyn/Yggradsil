# Handoff Report - GM Dashboard Investigation

## 1. Observation

### File & Line References
- **`INITIAL_PLAYERS` Definition**: Defined in `src/components/gm/GMDashboard.tsx` at line 68:
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
- **State Initialization**: Used in `src/components/gm/GMDashboard.tsx` at line 145:
  ```typescript
  const [players, setPlayers] = useState<DemoPlayer[]>(INITIAL_PLAYERS);
  ```
- **Party Tab Render**: Rendered at line 254:
  ```typescript
  {activeTab === 'party' && (
    <PartyTab
      players={players}
      selectedId={selectedPlayerId}
      onSelect={setSelectedPlayerId}
      onNavigate={setActiveTab}
    />
  )}
  ```
- **XP Tab Render**: Rendered at line 262:
  ```typescript
  {activeTab === 'xp' && (
    <XPTab
      players={players}
      xpLog={xpLog}
      onGiveXP={giveXP}
      selectedId={selectedPlayerId}
      onSelect={setSelectedPlayerId}
    />
  )}
  ```
- **Current Live Characters Query**: Defined in `src/contexts/CampaignContext.tsx` at line 144:
  ```typescript
  // Load characters for this campaign
  const { data: charData, error: charError } = await supabase
    .from('characters')
    .select('*')
    .eq('campaign_id', activeCampaignId);
  ```
- **Row-Level Security (RLS) Rules on Characters**: In `schema.sql` at lines 226-238:
  ```sql
  CREATE POLICY "Players view own characters" ON characters FOR SELECT USING (
    profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM campaign_members 
      WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm'
    )
  );
  CREATE POLICY "Players insert own characters" ON characters FOR INSERT WITH CHECK (profile_id = auth.uid());
  CREATE POLICY "Players edit own characters" ON characters FOR UPDATE USING (
    profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM campaign_members 
      WHERE campaign_id = characters.campaign_id AND profile_id = auth.uid() AND role = 'gm'
    )
  );
  ```

---

## 2. Logic Chain

1. **Current Decoupling**: The GM Dashboard (`src/components/gm/GMDashboard.tsx`) runs on dummy/mock state using `INITIAL_PLAYERS` and local state manipulation. Live data for campaigns and campaign members exists in `CampaignContext`, but the live characters table isn't being integrated into the dashboard.
2. **Shape Mismatch**: The backend `characters` schema and `Character` TypeScript interface do not have the same structure as `DemoPlayer` (e.g. `Character` references `race_id`/`subclass_id` and has relationships rather than embedding inline stats, skills, or items). Therefore, a mapping function is needed to convert the queried database records into the `DemoPlayer` structure.
3. **Database Joins**: To map properly, the database query must fetch related records (race details, subclass details, character stats, character skills, and inventory items) in a single request.
4. **RLS Authorization Block**: The current RLS policies for `characters` only allow inserts where `profile_id = auth.uid()`. This means that if a GM tries to create a character for a campaign member, the database will block it. Thus, a new RLS policy is required to allow GMs to insert characters in campaigns they manage. Similarly, GMs need insert permissions on `character_stats` and `map_tokens` when creating characters.
5. **XP Persistence**: Currently, XP distribution only adjusts the React state. To make it persistent, the `giveXP` callback must perform a Supabase update command, and recalculate character levels based on the updated XP thresholds.

---

## 3. Caveats

- **Leveling Rules**: In the database, characters have an `xp_total` and `level`. There is currently no standard experience table implemented. The recommendation assumes a simple rule (e.g., 1000 XP per level), but this should be configured to match the game design.
- **Inventory & Skill Changes**: The analysis covers character creation and XP distribution. While adding/removing items and skills are also in the GM Dashboard, persisting item/skill additions/removals to `inventory_items` and `character_skills` will require their own Supabase update handlers.
- **Active Character Updates**: When a player's character is modified by the GM, the player's UI will not automatically update unless Realtime listeners are active. Since realtime is enabled on the `characters` table, setting up subscription listeners or refreshing the CampaignContext state is recommended.

---

## 4. Conclusion & Recommendations

To replace the demo data with live characters and enable GM management, the following steps are required:

### Step 1: Update Supabase RLS Policies (SQL Migration)
Create a new migration script to allow GMs to insert characters and their initial components for campaign players:

```sql
-- Allow GMs to insert characters in campaigns they manage
CREATE POLICY "GMs can insert characters for members" ON characters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = characters.campaign_id AND campaigns.gm_id = auth.uid()
    )
  );

-- Allow GMs to insert initial stats
CREATE POLICY "GMs can insert stats for characters" ON character_stats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      JOIN campaigns ON campaigns.id = characters.campaign_id
      WHERE characters.id = character_stats.character_id AND campaigns.gm_id = auth.uid()
    )
  );

-- Allow GMs to insert map tokens
CREATE POLICY "GMs can insert tokens for characters" ON map_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM characters
      JOIN campaigns ON campaigns.id = characters.campaign_id
      WHERE characters.id = map_tokens.character_id AND campaigns.gm_id = auth.uid()
    )
  );
```

### Step 2: Implement Live Character Mapping in `GMDashboard.tsx`
Replace `INITIAL_PLAYERS` with a database query that fetches complete character graphs and maps them to the `DemoPlayer` structure:

```typescript
const mapCharacterToDemoPlayer = (char: any): DemoPlayer => {
  const statsMap: Record<string, number> = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
  if (char.stats) {
    char.stats.forEach((s: any) => {
      statsMap[s.stat_key] = s.base_value + s.bonus_value;
    });
  }

  const skillsList: string[] = [];
  if (char.skills) {
    char.skills.forEach((cs: any) => {
      if (cs.unlocked && cs.skill_definition) {
        skillsList.push(cs.skill_definition.name_en || cs.skill_definition.name_tr || '');
      }
    });
  }

  const inventoryList: DemoItem[] = [];
  if (char.inventory) {
    char.inventory.forEach((item: any) => {
      if (item.item_definition) {
        inventoryList.push({
          id: item.id,
          name: item.item_definition.name_en || item.item_definition.name_tr || 'Unknown Item',
          icon: item.item_definition.icon_url || '🎒',
          rarity: item.item_definition.rarity || 'common',
          quantity: item.quantity,
          equipped: item.equipped,
        });
      }
    });
  }

  const colors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ec4899', '#d97706'];
  const colorIndex = Math.abs(char.id.split('').reduce((acc: number, code: string) => acc + code.charCodeAt(0), 0)) % colors.length;
  
  const conStat = statsMap['CON'] || 10;
  const maxHP = 50 + Math.floor((conStat - 10) / 2) * 5;
  const dexStat = statsMap['DEX'] || 10;
  const baseAC = 10 + Math.floor((dexStat - 10) / 2);
  const equippedArmor = char.inventory?.find((i: any) => i.equipped && i.item_definition?.type === 'armor');
  const ac = equippedArmor ? parseInt(equippedArmor.item_definition.properties?.AC || '10', 10) : baseAC;

  return {
    id: char.id,
    name: char.name,
    race: char.race?.name || 'Unknown',
    className: char.subclass?.name_en || char.subclass?.name_tr || 'Unknown',
    level: char.level || 1,
    xp: char.xp_total || 0,
    color: colors[colorIndex],
    hp: { current: maxHP, max: maxHP },
    ac,
    stats: statsMap,
    skills: skillsList,
    inventory: inventoryList,
  };
};
```

### Step 3: Implement Live Fetching & Realtime Listener
Update `GMDashboard.tsx` to query and subscribe to characters:

```typescript
const [players, setPlayers] = useState<DemoPlayer[]>([]);
const [loading, setLoading] = useState(true);

const fetchLiveCharacters = useCallback(async () => {
  if (!campaign?.id) return;
  try {
    const { data, error } = await supabase
      .from('characters')
      .select(`
        *,
        race:race_definitions(*),
        subclass:subclass_definitions(*),
        profile:profiles(*),
        stats:character_stats(*),
        skills:character_skills(
          *,
          skill_definition:skill_definitions(*)
        ),
        inventory:inventory_items(
          *,
          item_definition:item_definitions(*)
        )
      `)
      .eq('campaign_id', campaign.id);

    if (error) throw error;
    if (data) {
      setPlayers(data.map(mapCharacterToDemoPlayer));
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [campaign?.id]);

useEffect(() => {
  fetchLiveCharacters();
  
  // Realtime subscription
  const subscription = supabase
    .channel('characters-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => {
      fetchLiveCharacters();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}, [fetchLiveCharacters]);
```

### Step 4: GM Character Creation Handler
Add a form modal inside GMDashboard where GMs can assign new characters to users:

```typescript
const handleGMCreateCharacter = async (formData: {
  name: string;
  profileId: string;
  raceId: string;
  subclassId: string;
  level: number;
  xp: number;
}) => {
  try {
    // 1. Fetch bonuses
    const { data: race } = await supabase.from('race_definitions').select('*').eq('id', formData.raceId).single();
    const { data: subclass } = await supabase.from('subclass_definitions').select('*').eq('id', formData.subclassId).single();

    // 2. Insert Character
    const { data: char, error: charErr } = await supabase
      .from('characters')
      .insert({
        profile_id: formData.profileId,
        campaign_id: campaign.id,
        name: formData.name,
        race_id: formData.raceId,
        subclass_id: formData.subclassId,
        level: formData.level,
        xp_total: formData.xp,
        xp_available: formData.xp,
      })
      .select()
      .single();

    if (charErr) throw charErr;

    // 3. Insert Stats
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

    await supabase.from('character_stats').insert(statsToInsert);

    // 4. Insert Default Map Token
    await supabase.from('map_tokens').insert({
      character_id: char.id,
      campaign_id: campaign.id,
      x_position: 600,
      y_position: 400,
      color: '#ffd700',
    });

    fetchLiveCharacters();
  } catch (err) {
    console.error('Failed to create character:', err);
  }
};
```

### Step 5: Update `giveXP` to Persist to Supabase
Change `giveXP` to update `characters` table in Supabase:

```typescript
const giveXP = async (playerId: string, amount: number, reason: string) => {
  if (amount === 0) return;
  const player = players.find(p => p.id === playerId);
  if (!player) return;

  const newXp = player.xp + amount;
  const newLevel = Math.floor(newXp / 1000) + 1; // Or match campaign level table

  try {
    const { error } = await supabase
      .from('characters')
      .update({
        xp_total: newXp,
        xp_available: newXp, // Update pool for tree unlocks
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', playerId);

    if (error) throw error;
    
    // Update local state on success
    setPlayers(prev => prev.map(p =>
      p.id === playerId ? { ...p, xp: newXp, level: newLevel } : p
    ));
  } catch (err) {
    console.error('Failed to update XP:', err);
  }
};
```

---

## 5. Verification Method

To verify these changes:
1. **Database Schema & RLS Checks**:
   Confirm that the SQL script executes successfully in the Supabase SQL editor. Test inserting a character from a GM account where `profile_id` is a player's ID.
2. **Frontend UI Tests**:
   - Navigate to `/gm` as a GM. Verify the GM Dashboard page loads without error and displays real characters instead of the demo ones.
   - Test distributing XP to a single character and bulk distributing XP. Refresh the page and ensure the updated XP persists.
   - Use the GM Character Creation modal to add a new character for a player. Confirm that:
     1. The character appears on the GM Dashboard.
     2. Six records are successfully created in `character_stats`.
     3. A record is created in `map_tokens`.
