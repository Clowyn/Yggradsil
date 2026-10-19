import { test, expect } from '@playwright/test';
import {
  AMBIENT_PRESET_PROFILES,
  resolveAmbientPreset,
  startAmbientSoundscape,
  stopAmbientSoundscape,
  setAmbientVolume,
  subscribeToAmbientEngine,
  getAmbientEngineState,
} from '../../src/lib/audio';
import {
  DEFAULT_DUNGEON_WALLS,
  raySegmentIntersection,
  hasLineOfSight,
  computeVisibilityPolygon,
} from '../../src/components/map/FogOfWar';
import {
  DND_BESTIARY,
  rollDiceFormula,
  resolveMultiTargetAttack,
} from '../../src/lib/bestiary';
import {
  canUserViewMessage,
  sendTableMessage,
  ingestRealtimeTableMessage,
  clearTableMessages,
  subscribeToTableChannel,
  setTableChatFilter,
} from '../../src/lib/tableChannel';
import { triggerDiceRoll } from '../../src/lib/diceRoller';
import type { EncounterCombatant, MapWallSegment } from '../../src/lib/types';

test.describe('Phase 3: Advanced GM Modules, 2D LoS Raycasting, Bestiary & Realtime Table Stream', () => {
  test('3.1 Web Audio Procedural Atmosphere Synthesizer: resolves presets, aliases, volume clamping, and lifecycle', () => {
    expect(Object.keys(AMBIENT_PRESET_PROFILES).length).toBeGreaterThanOrEqual(8);

    // Direct preset resolution
    expect(resolveAmbientPreset('abyss_winds').key).toBe('abyss_winds');
    expect(resolveAmbientPreset('mystic_forest').key).toBe('mystic_forest');
    expect(resolveAmbientPreset('combat_tension').key).toBe('combat_tension');

    // Alias resolution
    expect(resolveAmbientPreset('dungeon_drone').key).toBe('abyss_winds');
    expect(resolveAmbientPreset('rain_storm').key).toBe('storm_ruins');
    expect(resolveAmbientPreset('tavern_hearth').key).toBe('tavern_bustle');
    expect(resolveAmbientPreset('crypt_whispers').key).toBe('crypt_silence');

    // Unknown preset fallback
    expect(resolveAmbientPreset('unknown_preset').key).toBe('abyss_winds');
    expect(resolveAmbientPreset('').key).toBe('abyss_winds');

    // Lifecycle & listener subscription
    let observedPlaying = false;
    let observedVolume = 0;
    const unsub = subscribeToAmbientEngine((st) => {
      observedPlaying = st.isPlaying;
      observedVolume = st.volume;
    });

    const started = startAmbientSoundscape('combat_tension', 85);
    expect(started.isPlaying).toBe(true);
    expect(started.activePreset).toBe('combat_tension');
    expect(started.volume).toBe(85);
    expect(observedPlaying).toBe(true);
    expect(observedVolume).toBe(85);

    // Volume clamping (0..100)
    expect(setAmbientVolume(150).volume).toBe(100);
    expect(setAmbientVolume(-25).volume).toBe(0);
    expect(setAmbientVolume(60).volume).toBe(60);

    const stopped = stopAmbientSoundscape();
    expect(stopped.isPlaying).toBe(false);
    expect(getAmbientEngineState().isPlaying).toBe(false);
    unsub();
  });

  test('3.2 Battle Map Dynamic Line-of-Sight (2D Raycasting): ray-segment intersection, occlusion, and visibility polygons', () => {
    expect(DEFAULT_DUNGEON_WALLS.length).toBeGreaterThanOrEqual(5);

    // Vertical wall at x = 100 from y = 50 to y = 150
    const verticalWall: MapWallSegment = {
      id: 'w-vert',
      x1: 100,
      y1: 50,
      x2: 100,
      y2: 150,
      type: 'wall',
    };

    // Ray from (50, 100) pointing right (+1, 0) hits vertical wall at (100, 100) with dist = 50
    const hit = raySegmentIntersection(50, 100, 1, 0, 100, 50, 100, 150);
    expect(hit).not.toBeNull();
    expect(hit!.x).toBeCloseTo(100, 4);
    expect(hit!.y).toBeCloseTo(100, 4);
    expect(hit!.dist).toBeCloseTo(50, 4);

    // Ray pointing left (-1, 0) away from the wall returns null
    expect(raySegmentIntersection(50, 100, -1, 0, 100, 50, 100, 150)).toBeNull();

    // Parallel ray pointing up (0, 1) returns null
    expect(raySegmentIntersection(50, 100, 0, 1, 100, 50, 100, 150)).toBeNull();

    // Ray passing above the wall at y = 20 returns null
    expect(raySegmentIntersection(50, 20, 1, 0, 100, 50, 100, 150)).toBeNull();

    // Line of Sight checks
    // Blocked across the wall: (50, 100) -> (150, 100)
    expect(hasLineOfSight(50, 100, 150, 100, [verticalWall])).toBe(false);
    // Clear sightline around the wall: (50, 25) -> (150, 25)
    expect(hasLineOfSight(50, 25, 150, 25, [verticalWall])).toBe(true);
    // Out of maxDistance range
    expect(hasLineOfSight(50, 25, 150, 25, [verticalWall], 80)).toBe(false);

    // 2D Visibility Polygon with wall at x = 100 and radius = 120 from origin (50, 100)
    const poly = computeVisibilityPolygon(50, 100, 120, [verticalWall], 36);
    expect(poly.length).toBeGreaterThan(36);

    // Points cast directly to the right (y near 100, x > 50) must be stopped at the wall (x <= 100.1)
    const eastPoints = poly.filter((pt) => pt.x > 50 && Math.abs(pt.y - 100) < 15);
    expect(eastPoints.length).toBeGreaterThan(0);
    for (const pt of eastPoints) {
      expect(pt.x).toBeLessThanOrEqual(100.5);
    }

    // Points cast to the west (x < 50, y near 100) are unobstructed and reach full radius (~70px west -> x ~ -70)
    const westPoints = poly.filter((pt) => pt.x < 0 && Math.abs(pt.y - 100) < 20);
    expect(westPoints.length).toBeGreaterThan(0);

    // Regression: Wall endpoint directly west on the -pi/+pi branch cut (x = 50, y = 100 from origin 100, 100)
    // must keep all ray angles strictly sorted within [-Math.PI, Math.PI) without wrap-around self-intersection
    const seamWall: MapWallSegment = {
      id: 'w-seam',
      x1: 50,
      y1: 100,
      x2: 50,
      y2: 140,
      type: 'wall',
    };
    const seamPoly = computeVisibilityPolygon(100, 100, 120, [seamWall], 36);
    const seamAngles = seamPoly.map((pt) => {
      const raw = Math.atan2(pt.y - 100, pt.x - 100);
      return raw >= Math.PI - 1e-9 ? raw - Math.PI * 2 : raw;
    });
    for (let i = 1; i < seamAngles.length; i++) {
      expect(seamAngles[i]).toBeGreaterThanOrEqual(seamAngles[i - 1] - 1e-6);
    }

    // Edge case: zero/negative radius returns empty polygon
    expect(computeVisibilityPolygon(50, 100, 0, [verticalWall])).toEqual([]);
  });

  test('3.3 Monster Bestiary & Multi-Target Combat Engine: dice formulas, critical hits, AC attacks, and AoE saving throws', () => {
    expect(DND_BESTIARY.length).toBeGreaterThanOrEqual(10);
    for (const monster of DND_BESTIARY) {
      expect(monster.id).toBeTruthy();
      expect(monster.name).toBeTruthy();
      expect(monster.nameTr).toBeTruthy();
      expect(monster.hp).toBeGreaterThan(0);
      expect(monster.ac).toBeGreaterThan(0);
      expect(monster.actions.length).toBeGreaterThan(0);
    }

    // Deterministic RNG helper
    const fixedMaxRng = () => 0.999; // Always rolls max face (20 on d20, 6 on d6)
    const fixedMinRng = () => 0.0; // Always rolls 1

    // Normal vs Crit dice formula
    const normalRoll = rollDiceFormula('2d6+3', false, fixedMaxRng);
    expect(normalRoll.rolls).toEqual([6, 6]);
    expect(normalRoll.total).toBe(15);

    const critRoll = rollDiceFormula('2d6+3', true, fixedMaxRng);
    expect(critRoll.rolls).toEqual([6, 6, 6, 6]); // Crit doubles dice count!
    expect(critRoll.total).toBe(27);

    // Sample targets
    const targets: EncounterCombatant[] = [
      {
        id: 't-fighter',
        encounter_id: 'enc-1',
        character_id: 'c-1',
        name: 'Kael',
        initiative: 15,
        hp_current: 40,
        hp_max: 40,
        hp_temp: 0,
        ac: 18,
        is_npc: false,
        is_hidden: false,
        conditions: [],
        sort_order: 0,
      },
      {
        id: 't-mage',
        encounter_id: 'enc-1',
        character_id: 'c-2',
        name: 'Lyria',
        initiative: 12,
        hp_current: 20,
        hp_max: 20,
        hp_temp: 0,
        ac: 12,
        is_npc: false,
        is_hidden: false,
        conditions: [],
        sort_order: 1,
      },
    ];

    // 1. Multi-Target Attack with Crit RNG (d20 = 20 -> hits even high AC and doubles dice)
    const critSummary = resolveMultiTargetAttack({
      attackerName: 'Orc Berserker',
      actionName: 'Greataxe Cleave',
      mode: 'attack',
      attackBonus: 5,
      saveDC: 13,
      damageDice: '1d12+3',
      damageType: 'slashing',
      targets,
      rng: fixedMaxRng,
    });

    expect(critSummary.outcomes).toHaveLength(2);
    expect(critSummary.outcomes[0].isCrit).toBe(true);
    expect(critSummary.outcomes[0].hitOrFailedSave).toBe(true);
    expect(critSummary.outcomes[0].damageApplied).toBe(27); // 2d12 (24) + 3
    expect(critSummary.outcomes[0].newHp).toBe(13); // 40 - 27
    expect(critSummary.outcomes[1].newHp).toBe(0); // Clamped at 0 (20 - 27)
    expect(critSummary.totalDamageDealt).toBe(54);

    // 2. Multi-Target Attack with Fumble RNG (d20 = 1 -> auto miss even with huge attackBonus)
    const fumbleSummary = resolveMultiTargetAttack({
      attackerName: 'Goblin',
      actionName: 'Scimitar',
      mode: 'attack',
      attackBonus: 50,
      saveDC: 10,
      damageDice: '2d6+2',
      damageType: 'slashing',
      targets,
      rng: fixedMinRng,
    });
    expect(fumbleSummary.outcomes[0].isFumble).toBe(true);
    expect(fumbleSummary.outcomes[0].hitOrFailedSave).toBe(false);
    expect(fumbleSummary.outcomes[0].damageApplied).toBe(0);
    expect(fumbleSummary.outcomes[0].newHp).toBe(40);

    // 3. AoE Saving Throw mode: first target fails save (rolls 1), second target succeeds save (rolls 20 -> half damage)
    let callIdx = 0;
    const mixedSaveRng = () => {
      callIdx++;
      // Call 1 & 2: sharedSaveDamage '2d8' -> roll 5, 5 (total 10)
      if (callIdx <= 2) return 0.5;
      // Call 3: Target 1 d20 save -> rolls 2 (fails DC 15 -> full 10 damage)
      if (callIdx === 3) return 0.05;
      // Call 4: Target 2 d20 save -> rolls 18 (succeeds DC 15 -> half 5 damage)
      return 0.85;
    };

    const saveSummary = resolveMultiTargetAttack({
      attackerName: 'Ancient Red Dragon',
      actionName: 'Fire Breath',
      mode: 'save',
      attackBonus: 0,
      saveDC: 15,
      saveAbility: 'DEX',
      damageDice: '2d8',
      damageType: 'fire',
      targets,
      rng: mixedSaveRng,
    });

    expect(saveSummary.outcomes[0].savedForHalf).toBe(false);
    expect(saveSummary.outcomes[0].damageApplied).toBe(10);
    expect(saveSummary.outcomes[0].newHp).toBe(30);

    expect(saveSummary.outcomes[1].savedForHalf).toBe(true);
    expect(saveSummary.outcomes[1].damageApplied).toBe(5);
    expect(saveSummary.outcomes[1].newHp).toBe(15);
    expect(saveSummary.totalDamageDealt).toBe(15);
  });

  test('3.4 Realtime Table Chat, Shared Dice Stream & Secret GM Whispers: privacy filters and automatic roll broadcasts', async () => {
    clearTableMessages();

    let channelSnapshot = { messages: [] as Awaited<ReturnType<typeof sendTableMessage>>[], activeFilter: 'all' };
    const unsub = subscribeToTableChannel((st) => {
      channelSnapshot = { messages: st.messages, activeFilter: st.activeFilter };
    });

    // 1. Public chat message
    const pubMsg = await sendTableMessage({
      content: 'For the glory of Yggdrasil!',
      messageType: 'chat',
      senderName: 'Kael',
      senderRole: 'player',
      senderId: 'user-kael',
      campaignId: 'local',
    });

    expect(pubMsg.is_whisper).toBe(false);
    expect(pubMsg.is_secret_roll).toBe(false);
    expect(canUserViewMessage(pubMsg, { userId: 'user-other', isGM: false })).toBe(true);

    // 2. Secret Whisper from GM to Lyria
    const whisperMsg = await sendTableMessage({
      content: 'You notice a hidden rune behind the altar.',
      messageType: 'whisper',
      recipientId: 'user-lyria',
      recipientName: 'Lyria',
      senderName: 'Loremaster (GM)',
      senderRole: 'gm',
      senderId: 'user-gm',
      campaignId: 'local',
    });

    expect(whisperMsg.is_whisper).toBe(true);
    // GM sees it
    expect(canUserViewMessage(whisperMsg, { userId: 'user-gm', isGM: true })).toBe(true);
    // Recipient Lyria sees it (by userId or characterName)
    expect(canUserViewMessage(whisperMsg, { userId: 'user-lyria', isGM: false })).toBe(true);
    expect(canUserViewMessage(whisperMsg, { userId: 'other', characterName: 'Lyria', isGM: false })).toBe(true);
    // Unrelated player Kael CANNOT see Lyria's whisper
    expect(canUserViewMessage(whisperMsg, { userId: 'user-kael', characterName: 'Kael', isGM: false })).toBe(false);

    // 3. Public Dice Roll via triggerDiceRoll automatically broadcasts to Table Channel
    const publicRoll = triggerDiceRoll({
      formula: '1d20+5',
      label: 'Athletics Check',
      characterName: 'Kael',
      openModal: false,
      isSecretRoll: false,
    });
    expect(publicRoll.total).toBeGreaterThanOrEqual(6);

    const broadcastedPublicRoll = channelSnapshot.messages.find(
      (m) => m.message_type === 'roll' && m.dice_data?.label === 'Athletics Check'
    );
    expect(broadcastedPublicRoll).toBeDefined();
    expect(canUserViewMessage(broadcastedPublicRoll!, { userId: 'user-lyria', isGM: false })).toBe(true);

    // 4. Secret GM Roll via triggerDiceRoll({ isSecretRoll: true }) is hidden from normal players
    triggerDiceRoll({
      formula: '1d20+8',
      label: 'Lich Stealth',
      characterName: 'Loremaster (GM)',
      openModal: false,
      isSecretRoll: true,
    });

    const broadcastedSecretRoll = channelSnapshot.messages.find(
      (m) => m.message_type === 'secret_roll' && m.dice_data?.label === 'Lich Stealth'
    );
    expect(broadcastedSecretRoll).toBeDefined();
    expect(broadcastedSecretRoll!.is_secret_roll).toBe(true);

    // GM can view secret roll; normal players cannot
    expect(canUserViewMessage(broadcastedSecretRoll!, { userId: 'user-gm', isGM: true })).toBe(true);
    expect(canUserViewMessage(broadcastedSecretRoll!, { userId: 'user-kael', isGM: false })).toBe(false);

    // 5. Regression: localMsg.id is a valid UUID and Realtime echo is deduplicated
    expect(pubMsg.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const countBeforeEcho = channelSnapshot.messages.length;
    ingestRealtimeTableMessage({ ...pubMsg });
    expect(channelSnapshot.messages.length).toBe(countBeforeEcho);
    // Even if a remote trigger assigns a different ID within 2.5s for the exact same sender+content+type, deduplicate it
    ingestRealtimeTableMessage({ ...pubMsg, id: '00000000-0000-4000-8000-000000000099' });
    expect(channelSnapshot.messages.length).toBe(countBeforeEcho);

    setTableChatFilter('roll');
    expect(channelSnapshot.activeFilter).toBe('roll');
    setTableChatFilter('all');

    unsub();
  });
});
