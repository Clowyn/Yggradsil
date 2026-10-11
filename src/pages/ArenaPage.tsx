import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw } from 'lucide-react';

import { ArenaLobby } from '../components/arena/ArenaLobby';
import { ARCHETYPE_ROSTER, type ArenaSpell } from '../components/arena/arenaData';
import { ArenaIntro } from '../components/arena/ArenaIntro';
import { ArenaTurnCarousel } from '../components/arena/ArenaTurnCarousel';
import { ArenaField } from '../components/arena/ArenaField';
import { ArenaActionConsole, type ExecuteActionPayload } from '../components/arena/ArenaActionConsole';
import { ArenaLogStream } from '../components/arena/ArenaLogStream';
import { DiceRollerModal, type DiceRollResult } from '../components/arena/DiceRollerModal';

import { useCampaign } from '../contexts/CampaignContext';
import { useAuth } from '../contexts/AuthContext';
import { playSound } from '../lib/audio';
import { translations } from '../lib/translations';
import { supabase } from '../lib/supabase';
import type {
  CombatArena,
  CombatArenaParticipant,
  CombatArenaLog,
} from '../lib/types';

// Default initial 4v4 roster
const INITIAL_PARTICIPANTS: CombatArenaParticipant[] = [
  // Team Blue
  {
    id: 'p-blue-0',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[0].name,
    avatar_url: ARCHETYPE_ROSTER[0].avatar_url,
    team: 'team_a',
    slot_index: 0,
    current_hp: ARCHETYPE_ROSTER[0].max_hp,
    max_hp: ARCHETYPE_ROSTER[0].max_hp,
    current_mana: ARCHETYPE_ROSTER[0].max_mana,
    max_mana: ARCHETYPE_ROSTER[0].max_mana,
    ac: ARCHETYPE_ROSTER[0].ac,
    initiative_score: ARCHETYPE_ROSTER[0].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
  {
    id: 'p-blue-1',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[1].name,
    avatar_url: ARCHETYPE_ROSTER[1].avatar_url,
    team: 'team_a',
    slot_index: 1,
    current_hp: ARCHETYPE_ROSTER[1].max_hp,
    max_hp: ARCHETYPE_ROSTER[1].max_hp,
    current_mana: ARCHETYPE_ROSTER[1].max_mana,
    max_mana: ARCHETYPE_ROSTER[1].max_mana,
    ac: ARCHETYPE_ROSTER[1].ac,
    initiative_score: ARCHETYPE_ROSTER[1].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
  {
    id: 'p-blue-2',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[2].name,
    avatar_url: ARCHETYPE_ROSTER[2].avatar_url,
    team: 'team_a',
    slot_index: 2,
    current_hp: ARCHETYPE_ROSTER[2].max_hp,
    max_hp: ARCHETYPE_ROSTER[2].max_hp,
    current_mana: ARCHETYPE_ROSTER[2].max_mana,
    max_mana: ARCHETYPE_ROSTER[2].max_mana,
    ac: ARCHETYPE_ROSTER[2].ac,
    initiative_score: ARCHETYPE_ROSTER[2].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
  {
    id: 'p-blue-3',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[3].name,
    avatar_url: ARCHETYPE_ROSTER[3].avatar_url,
    team: 'team_a',
    slot_index: 3,
    current_hp: ARCHETYPE_ROSTER[3].max_hp,
    max_hp: ARCHETYPE_ROSTER[3].max_hp,
    current_mana: ARCHETYPE_ROSTER[3].max_mana,
    max_mana: ARCHETYPE_ROSTER[3].max_mana,
    ac: ARCHETYPE_ROSTER[3].ac,
    initiative_score: ARCHETYPE_ROSTER[3].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
  // Team Red
  {
    id: 'p-red-0',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[4].name,
    avatar_url: ARCHETYPE_ROSTER[4].avatar_url,
    team: 'team_b',
    slot_index: 0,
    current_hp: ARCHETYPE_ROSTER[4].max_hp,
    max_hp: ARCHETYPE_ROSTER[4].max_hp,
    current_mana: ARCHETYPE_ROSTER[4].max_mana,
    max_mana: ARCHETYPE_ROSTER[4].max_mana,
    ac: ARCHETYPE_ROSTER[4].ac,
    initiative_score: ARCHETYPE_ROSTER[4].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
  {
    id: 'p-red-1',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[5].name,
    avatar_url: ARCHETYPE_ROSTER[5].avatar_url,
    team: 'team_b',
    slot_index: 1,
    current_hp: ARCHETYPE_ROSTER[5].max_hp,
    max_hp: ARCHETYPE_ROSTER[5].max_hp,
    current_mana: ARCHETYPE_ROSTER[5].max_mana,
    max_mana: ARCHETYPE_ROSTER[5].max_mana,
    ac: ARCHETYPE_ROSTER[5].ac,
    initiative_score: ARCHETYPE_ROSTER[5].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
  {
    id: 'p-red-2',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[6].name,
    avatar_url: ARCHETYPE_ROSTER[6].avatar_url,
    team: 'team_b',
    slot_index: 2,
    current_hp: ARCHETYPE_ROSTER[6].max_hp,
    max_hp: ARCHETYPE_ROSTER[6].max_hp,
    current_mana: ARCHETYPE_ROSTER[6].max_mana,
    max_mana: ARCHETYPE_ROSTER[6].max_mana,
    ac: ARCHETYPE_ROSTER[6].ac,
    initiative_score: ARCHETYPE_ROSTER[6].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
  {
    id: 'p-red-3',
    arena_id: 'arena-demo-01',
    character_id: null,
    name: ARCHETYPE_ROSTER[7].name,
    avatar_url: ARCHETYPE_ROSTER[7].avatar_url,
    team: 'team_b',
    slot_index: 3,
    current_hp: ARCHETYPE_ROSTER[7].max_hp,
    max_hp: ARCHETYPE_ROSTER[7].max_hp,
    current_mana: ARCHETYPE_ROSTER[7].max_mana,
    max_mana: ARCHETYPE_ROSTER[7].max_mana,
    ac: ARCHETYPE_ROSTER[7].ac,
    initiative_score: ARCHETYPE_ROSTER[7].initiative_score,
    is_alive: true,
    status_effects: [],
    is_npc: true,
  },
];

export function ArenaPage() {
  const { isGM, locale } = useAuth();
  const t = translations[locale] || translations.en;
  const { campaign, characters } = useCampaign();
  const campaignId = campaign?.id;

  const [arena, setArena] = useState<CombatArena>({
    id: 'arena-demo-01',
    campaign_id: campaignId || 'demo',
    name: 'Gladiator Grand Coliseum',
    status: 'lobby',
    round_number: 1,
    active_combatant_id: null,
    team_a_name: 'Mavi Birlik (Party 1)',
    team_b_name: 'Kırmızı Lejyon (Party 2)',
    winner_team: null,
    created_at: new Date().toISOString(),
  });

  const [participants, setParticipants] = useState<CombatArenaParticipant[]>(INITIAL_PARTICIPANTS);
  const [logs, setLogs] = useState<CombatArenaLog[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const advanceTurnRef = useRef<() => void>(() => {});

  // Active Dice Roller Modal State
  const [activeDiceRoll, setActiveDiceRoll] = useState<{
    isOpen: boolean;
    actor: CombatArenaParticipant;
    target: CombatArenaParticipant;
    spell?: ArenaSpell;
    actionTitle: string;
  } | null>(null);

  // Sorted participants by initiative
  const initiativeOrder = useMemo(
    () => [...participants].sort((a, b) => b.initiative_score - a.initiative_score),
    [participants]
  );

  const activeCombatant = useMemo(
    () => participants.find((p) => p.id === arena.active_combatant_id) || initiativeOrder.find((p) => p.is_alive) || null,
    [participants, arena.active_combatant_id, initiativeOrder]
  );

  const selectedTarget = useMemo(
    () => participants.find((p) => p.id === selectedTargetId) || null,
    [participants, selectedTargetId]
  );

  // Add Log Entry Helper
  const addLog = useCallback(
    (message: string, actionType?: CombatArenaLog['action_type'], damage?: number, heal?: number) => {
      const newLog: CombatArenaLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        arena_id: arena.id,
        message,
        action_type: actionType || 'system',
        damage_dealt: damage || null,
        healing_done: heal || null,
        created_at: new Date().toISOString(),
      };
      setLogs((prev) => [...prev, newLog]);

      if (campaignId && !arena.id.startsWith('arena-demo')) {
        Promise.resolve(
          supabase
            .from('combat_arena_logs')
            .insert({
              arena_id: arena.id,
              message,
              action_type: actionType || 'system',
              damage_dealt: damage || null,
              healing_done: heal || null,
            })
        ).catch(() => {});
      }
    },
    [arena.id, campaignId]
  );

  // ─── Living Status Engine: Process Turn Start DoT ─────────────
  const processTurnStartDoT = useCallback(
    (combatant: CombatArenaParticipant) => {
      if (!combatant.is_alive || !combatant.status_effects || combatant.status_effects.length === 0) {
        return combatant;
      }

      let totalDamage = 0;
      const nextEffects = [];

      for (const effect of combatant.status_effects) {
        if (effect.type === 'poison') {
          totalDamage += effect.value; // e.g. 4 poison damage per turn
          addLog(
            locale === 'tr'
              ? `🤢 ${combatant.name} zehir etkisiyle ${effect.value} hasar aldı! (${effect.remaining_turns - 1} tur kaldı)`
              : `🤢 ${combatant.name} took ${effect.value} poison damage! (${effect.remaining_turns - 1} rounds remaining)`,
            'dot',
            effect.value
          );
          playSound('sword_hit');
        } else if (effect.type === 'burn') {
          totalDamage += effect.value;
          addLog(
            locale === 'tr'
              ? `🔥 ${combatant.name} alev yanığı ile ${effect.value} hasar aldı!`
              : `🔥 ${combatant.name} took ${effect.value} burn damage!`,
            'dot',
            effect.value
          );
        }

        const remaining = effect.remaining_turns - 1;
        if (remaining > 0) {
          nextEffects.push({ ...effect, remaining_turns: remaining });
        }
      }

      const nextHp = Math.max(0, combatant.current_hp - totalDamage);
      const isStillAlive = nextHp > 0;

      if (!isStillAlive && combatant.is_alive) {
        addLog(
          locale === 'tr'
            ? `💀 ${combatant.name} durum hasarı nedeniyle yere serildi ve savaş dışı kaldı!`
            : `💀 ${combatant.name} collapsed from status damage and is knocked out!`,
          'system'
        );
        playSound('alert');
      }

      return {
        ...combatant,
        current_hp: nextHp,
        is_alive: isStillAlive,
        status_effects: nextEffects,
      };
    },
    [addLog, locale]
  );

  // ─── Check Win Condition ─────────────────────────────────────
  const checkWinCondition = useCallback(
    (currentParticipants: CombatArenaParticipant[]) => {
      const teamAAlive = currentParticipants.filter((p) => p.team === 'team_a' && p.is_alive && p.current_hp > 0).length;
      const teamBAlive = currentParticipants.filter((p) => p.team === 'team_b' && p.is_alive && p.current_hp > 0).length;

      if (teamAAlive === 0 && teamBAlive > 0) {
        setArena((prev) => ({ ...prev, status: 'finished', winner_team: 'team_b' }));
        addLog(`🏆 ${t.arena.teamRed} ${locale === 'tr' ? 'Zafer Kazandı! Karşılaşma sona erdi!' : 'Wins! Encounter ended!'}`, 'system');
        playSound('powerup');
        return true;
      } else if (teamBAlive === 0 && teamAAlive > 0) {
        setArena((prev) => ({ ...prev, status: 'finished', winner_team: 'team_a' }));
        addLog(`🏆 ${t.arena.teamBlue} ${locale === 'tr' ? 'Zafer Kazandı! Karşılaşma sona erdi!' : 'Wins! Encounter ended!'}`, 'system');
        playSound('powerup');
        return true;
      }
      return false;
    },
    [addLog, locale, t.arena.teamBlue, t.arena.teamRed]
  );

  // ─── Advance Turn to Next Combatant ─────────────────────────
  const advanceTurn = useCallback(() => {
    setParticipants((currentParticipants) => {
      if (checkWinCondition(currentParticipants)) return currentParticipants;

      const living = currentParticipants.filter((p) => p.is_alive && p.current_hp > 0);
      if (living.length === 0) return currentParticipants;

      const order = [...currentParticipants].sort((a, b) => b.initiative_score - a.initiative_score);
      const curIndex = order.findIndex((p) => p.id === arena.active_combatant_id);

      let workingParticipants = [...currentParticipants];
      let selectedNext: CombatArenaParticipant | null = null;

      for (let step = 1; step <= order.length; step++) {
        const nextIdx = (curIndex + step) % order.length;
        const candidateId = order[nextIdx].id;
        const candidate = workingParticipants.find((p) => p.id === candidateId);
        if (!candidate || !candidate.is_alive || candidate.current_hp <= 0) {
          continue;
        }

        const afterDoT = processTurnStartDoT(candidate);
        workingParticipants = workingParticipants.map((p) => (p.id === afterDoT.id ? afterDoT : p));

        if (!afterDoT.is_alive || afterDoT.current_hp <= 0) {
          if (checkWinCondition(workingParticipants)) {
            return workingParticipants;
          }
          continue;
        }

        selectedNext = afterDoT;
        break;
      }

      if (selectedNext) {
        const nextRound = curIndex >= 0 && order.findIndex((p) => p.id === selectedNext!.id) <= curIndex
          ? arena.round_number + 1
          : arena.round_number;

        setArena((prev) => {
          const nextArenaState: CombatArena = {
            ...prev,
            round_number: Math.max(prev.round_number, nextRound),
            active_combatant_id: selectedNext!.id,
          };

          if (campaignId && !prev.id.startsWith('arena-demo')) {
            Promise.resolve(
              supabase
                .from('combat_arenas')
                .update({
                  round_number: nextArenaState.round_number,
                  active_combatant_id: nextArenaState.active_combatant_id,
                })
                .eq('id', prev.id)
            ).catch(() => {});
          }

          return nextArenaState;
        });

        const opponentTeam = selectedNext.team === 'team_a' ? 'team_b' : 'team_a';
        const opponent = workingParticipants.find(
          (p) => p.team === opponentTeam && p.is_alive && p.current_hp > 0
        );
        if (opponent) {
          setSelectedTargetId(opponent.id);
        }
      }

      return workingParticipants;
    });
  }, [
    arena.active_combatant_id,
    arena.round_number,
    campaignId,
    checkWinCondition,
    processTurnStartDoT,
  ]);

  useEffect(() => {
    advanceTurnRef.current = advanceTurn;
  }, [advanceTurn]);

  // Initial Realtime / DB Fetch
  useEffect(() => {
    if (!campaignId) return;

    let isMounted = true;
    const fetchArenaData = async () => {
      try {
        const { data: arenaData, error: arenaErr } = await supabase
          .from('combat_arenas')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (arenaErr || !arenaData || !isMounted) return;

        setArena(arenaData as CombatArena);

        const { data: partData } = await supabase
          .from('combat_arena_participants')
          .select('*')
          .eq('arena_id', arenaData.id);

        if (partData && partData.length > 0 && isMounted) {
          setParticipants(partData as CombatArenaParticipant[]);
        }

        const { data: logData } = await supabase
          .from('combat_arena_logs')
          .select('*')
          .eq('arena_id', arenaData.id)
          .order('created_at', { ascending: true });

        if (logData && isMounted) {
          setLogs(logData as CombatArenaLog[]);
        }
      } catch {
        // Fallback to local default state
      }
    };

    fetchArenaData();

    const channel = supabase
      .channel(`arena-${campaignId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'combat_arenas', filter: `campaign_id=eq.${campaignId}` },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            setArena((prev) => ({ ...prev, ...(payload.new as CombatArena) }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'combat_arena_logs' },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setLogs((prev) => {
              const newLog = payload.new as CombatArenaLog;
              if (prev.some((l) => l.id === newLog.id)) return prev;
              return [...prev, newLog];
            });
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  // Launch Combat from Lobby
  const handleLaunchCombat = async () => {
    playSound('fire_blast');
    const firstActiveId = initiativeOrder[0]?.id || null;
    setArena((prev) => ({
      ...prev,
      status: 'intro',
      active_combatant_id: firstActiveId,
    }));
    addLog(t.arena.introRoar, 'system');

    if (campaignId && arena.id.startsWith('arena-demo')) {
      try {
        const { data: newArena } = await supabase
          .from('combat_arenas')
          .insert({
            campaign_id: campaignId,
            name: arena.name,
            status: 'intro',
            round_number: 1,
            active_combatant_id: firstActiveId,
            team_a_name: t.arena.teamBlue,
            team_b_name: t.arena.teamRed,
          })
          .select()
          .single();

        if (newArena) {
          setArena(newArena as CombatArena);
          const participantsToInsert = participants.map((p) => ({
            arena_id: newArena.id,
            character_id: p.character_id,
            name: p.name,
            avatar_url: p.avatar_url,
            team: p.team,
            slot_index: p.slot_index,
            current_hp: p.current_hp,
            max_hp: p.max_hp,
            current_mana: p.current_mana,
            max_mana: p.max_mana,
            ac: p.ac,
            initiative_score: p.initiative_score,
            is_alive: p.is_alive,
            status_effects: p.status_effects,
            is_npc: p.is_npc || false,
          }));

          const { data: insertedParts } = await supabase
            .from('combat_arena_participants')
            .insert(participantsToInsert)
            .select();

          if (insertedParts && insertedParts.length > 0) {
            setParticipants(insertedParts as CombatArenaParticipant[]);
          }
        }
      } catch {
        // Fallback to local state
      }
    }
  };

  // Intro face-off completes -> enter active arena
  const handleIntroComplete = () => {
    setArena((prev) => ({
      ...prev,
      status: 'active',
      active_combatant_id: initiativeOrder[0]?.id || null,
    }));

    // Default target
    const opponentTeam = initiativeOrder[0]?.team === 'team_a' ? 'team_b' : 'team_a';
    const firstOpponent = participants.find((p) => p.team === opponentTeam && p.is_alive);
    if (firstOpponent) {
      setSelectedTargetId(firstOpponent.id);
    }
  };

  // Update participant in lobby
  const handleUpdateParticipant = (
    index: number,
    team: 'team_a' | 'team_b',
    fighter: Partial<CombatArenaParticipant>
  ) => {
    setParticipants((prev) =>
      prev.map((p) => (p.team === team && p.slot_index === index ? { ...p, ...fighter } : p))
    );
  };

  // ─── Execute Action (Attack, Spell, Item, Defend) ────────────
  const handleExecuteAction = (payload: ExecuteActionPayload) => {
    if (!activeCombatant) return;

    // 1. Basic Physical Attack: opens interactive dice roller!
    if (payload.actionKind === 'basic_attack') {
      if (!selectedTarget) return;
      setActiveDiceRoll({
        isOpen: true,
        actor: activeCombatant,
        target: selectedTarget,
        actionTitle: locale === 'tr' ? 'Temel Fiziksel Saldırı (Melee Strike)' : 'Basic Melee Strike',
      });
      return;
    }

    // 2. Spell cast:
    if (payload.actionKind === 'spell' && payload.spell) {
      const spell = payload.spell;
      if (activeCombatant.current_mana < spell.manaCost) return;

      // Deduct mana
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === activeCombatant.id
            ? { ...p, current_mana: Math.max(0, p.current_mana - spell.manaCost) }
            : p
        )
      );

      // If offensive spell, requires dice roll vs AC or spell DC!
      if (spell.type === 'attack') {
        if (!selectedTarget) return;
        setActiveDiceRoll({
          isOpen: true,
          actor: activeCombatant,
          target: selectedTarget,
          spell,
          actionTitle: spell.name,
        });
        return;
      }

      // If Heal Spell: restores target HP immediately!
      if (spell.type === 'heal' && selectedTarget) {
        const healAmt = spell.baseHeal || 25;
        const newHp = Math.min(selectedTarget.max_hp, selectedTarget.current_hp + healAmt);
        setParticipants((prev) =>
          prev.map((p) => (p.id === selectedTarget.id ? { ...p, current_hp: newHp } : p))
        );
        playSound('powerup');
        addLog(
          locale === 'tr'
            ? `✨ ${activeCombatant.name}, ${selectedTarget.name}'a ${spell.name} uyguladı ve +${healAmt} HP tazeledi!`
            : `✨ ${activeCombatant.name} cast ${spell.name} on ${selectedTarget.name}, restoring +${healAmt} HP!`,
          'spell',
          undefined,
          healAmt
        );
        advanceTurn();
        return;
      }

      // If Shield / Buff
      if (spell.type === 'buff' && selectedTarget) {
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === selectedTarget.id
              ? {
                  ...p,
                  ac: p.ac + 4,
                  status_effects: [...(p.status_effects || []), { type: 'shield', value: 4, remaining_turns: 2 }],
                }
              : p
          )
        );
        playSound('ping');
        addLog(
          locale === 'tr'
            ? `🛡️ ${activeCombatant.name}, ${selectedTarget.name}'a ${spell.name} ile +4 AC kalkanı bahşetti!`
            : `🛡️ ${activeCombatant.name} granted ${selectedTarget.name} +4 AC shield with ${spell.name}!`,
          'spell'
        );
        advanceTurn();
        return;
      }
    }

    // 3. Potion / Inventory Item
    if (payload.actionKind === 'item' && payload.item) {
      const item = payload.item;
      playSound('potion_drink');

      if (item.type === 'heal_hp') {
        const target = selectedTarget || activeCombatant;
        const newHp = Math.min(target.max_hp, target.current_hp + item.value);
        setParticipants((prev) =>
          prev.map((p) => (p.id === target.id ? { ...p, current_hp: newHp } : p))
        );
        addLog(
          locale === 'tr'
            ? `🧪 ${activeCombatant.name}, ${target.name}'a ${item.name} kullandı (+${item.value} HP)!`
            : `🧪 ${activeCombatant.name} used ${item.name} on ${target.name} (+${item.value} HP)!`,
          'item',
          undefined,
          item.value
        );
      } else if (item.type === 'heal_mana') {
        const newMp = Math.min(activeCombatant.max_mana, activeCombatant.current_mana + item.value);
        setParticipants((prev) =>
          prev.map((p) => (p.id === activeCombatant.id ? { ...p, current_mana: newMp } : p))
        );
        addLog(
          locale === 'tr'
            ? `🧪 ${activeCombatant.name}, ${item.name} ile +${item.value} Mana tazeledi!`
            : `🧪 ${activeCombatant.name} restored +${item.value} Mana with ${item.name}!`,
          'item'
        );
      } else if (item.type === 'cleanse') {
        const target = selectedTarget || activeCombatant;
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === target.id
              ? { ...p, status_effects: p.status_effects.filter((s) => s.type !== 'poison') }
              : p
          )
        );
        addLog(
          locale === 'tr'
            ? `🌿 ${activeCombatant.name}, ${target.name}'ın üzerindeki tüm zehirleri arındırdı!`
            : `🌿 ${activeCombatant.name} cleansed all poisons from ${target.name}!`,
          'item'
        );
      }

      // Advance turn on item consumption
      advanceTurn();
      return;
    }

    // 4. Defend Action
    if (payload.actionKind === 'defend') {
      playSound('ping');
      setParticipants((prev) =>
        prev.map((p) => (p.id === activeCombatant.id ? { ...p, ac: p.ac + 2 } : p))
      );
      addLog(
        locale === 'tr'
          ? `🛡️ ${activeCombatant.name} savunma pozisyonu aldı (+2 AC)!`
          : `🛡️ ${activeCombatant.name} took a defensive stance (+2 AC)!`,
        'system'
      );
      advanceTurn();
    }
  };

  // ─── Dice Roll Resolved Callback ────────────────────────────
  const handleDiceRollResolved = (result: DiceRollResult) => {
    if (!activeDiceRoll) return;
    const { actor, target, spell } = activeDiceRoll;

    if (result.isHit) {
      const targetNextHp = Math.max(0, target.current_hp - result.damage);
      let nextStatusEffects = [...(target.status_effects || [])];

      // If spell applies poison:
      if (spell?.statusToApply) {
        nextStatusEffects = [...nextStatusEffects.filter((s) => s.type !== spell.statusToApply?.type), spell.statusToApply];
      }

      const isStillAlive = targetNextHp > 0;

      setParticipants((prev) =>
        prev.map((p) =>
          p.id === target.id
            ? {
                ...p,
                current_hp: targetNextHp,
                is_alive: isStillAlive,
                status_effects: nextStatusEffects,
              }
            : p
        )
      );

      if (spell) {
        addLog(
          locale === 'tr'
            ? `💥 [Zar ${result.diceValue} + 3 = ${result.totalAttack}] ${actor.name}, ${target.name}'a ${spell.name} ile vurdu! (-${result.damage} HP${spell.statusToApply ? ' + Zehir' : ''})`
            : `💥 [Roll ${result.diceValue} + 3 = ${result.totalAttack}] ${actor.name} hit ${target.name} with ${spell.name}! (-${result.damage} HP${spell.statusToApply ? ' + Poison' : ''})`,
          'spell',
          result.damage
        );
      } else {
        addLog(
          locale === 'tr'
            ? `⚔️ [Zar ${result.diceValue} + 3 = ${result.totalAttack}] ${actor.name}, ${target.name}'a saldırdı! (-${result.damage} HP)`
            : `⚔️ [Roll ${result.diceValue} + 3 = ${result.totalAttack}] ${actor.name} attacked ${target.name}! (-${result.damage} HP)`,
          'attack',
          result.damage
        );
      }

      if (!isStillAlive) {
        addLog(
          locale === 'tr'
            ? `💀 ${target.name} aldığı darbeyle yere serildi!`
            : `💀 ${target.name} was knocked unconscious by the blow!`,
          'system'
        );
        playSound('alert');
      }
    } else {
      addLog(
        locale === 'tr'
          ? `🛡️ [Zar ${result.diceValue} + 3 = ${result.totalAttack} vs AC ${target.ac}] ${actor.name}, ${target.name}'a karşı ıskaladı!`
          : `🛡️ [Roll ${result.diceValue} + 3 = ${result.totalAttack} vs AC ${target.ac}] ${actor.name} missed against ${target.name}!`,
        'system'
      );
    }

    setActiveDiceRoll(null);

    // Advance turn
    setTimeout(() => {
      advanceTurnRef.current();
    }, 400);
  };

  // Reset Arena Match
  const handleResetMatch = () => {
    setArena((prev) => ({
      ...prev,
      status: 'lobby',
      round_number: 1,
      active_combatant_id: null,
      winner_team: null,
    }));
    setParticipants(INITIAL_PARTICIPANTS);
    setLogs([]);
  };

  return (
    <div className="relative w-full space-y-6 pb-12">
      {/* 1. LOBBY VIEW */}
      {arena.status === 'lobby' && (
        <ArenaLobby
          participants={participants}
          campaignCharacters={characters || []}
          onUpdateParticipant={handleUpdateParticipant}
          onLaunchCombat={handleLaunchCombat}
          isGM={isGM}
        />
      )}

      {/* 2. CINEMATIC INTRO VIEW */}
      {arena.status === 'intro' && (
        <ArenaIntro
          participants={participants}
          onIntroComplete={handleIntroComplete}
        />
      )}

      {/* 3. ACTIVE ARENA COMBAT VIEW */}
      {arena.status === 'active' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Top Initiative Order Carousel */}
          <ArenaTurnCarousel
            participants={participants}
            activeCombatantId={arena.active_combatant_id}
            roundNumber={arena.round_number}
          />

          {/* 4v4 Battlefield Cards */}
          <ArenaField
            participants={participants}
            activeCombatantId={arena.active_combatant_id}
            selectedTargetId={selectedTargetId}
            onSelectTarget={(id) => setSelectedTargetId(id)}
          />

          {/* Interactive Player / GM Action Console */}
          <ArenaActionConsole
            activeCombatant={activeCombatant}
            selectedTarget={selectedTarget}
            canAct={Boolean(activeCombatant?.is_alive)}
            onExecuteAction={handleExecuteAction}
            onEndTurn={advanceTurn}
          />

          {/* Live Battle Log Stream */}
          <ArenaLogStream logs={logs} />
        </div>
      )}

      {/* 4. FINISHED / VICTORY VIEW */}
      {arena.status === 'finished' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-6 border border-amber-500/40 shadow-2xl bg-[#0a0c13]"
        >
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-[#ffd700] mx-auto shadow-xl">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>

          <div>
            <h2 className="text-3xl font-cinzel font-black text-gold-gradient uppercase tracking-widest">
              {arena.winner_team === 'team_a' ? t.arena.teamBlue : t.arena.teamRed}
            </h2>
            <p className="text-sm text-stone-300 font-cinzel mt-2">
              {t.arena.victory} {arena.winner_team === 'team_a' ? t.arena.teamBlue : t.arena.teamRed}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetMatch}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-cinzel font-black text-xs tracking-wider shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.arena.startNewEncounter}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Interactive d20 Dice Roller Modal */}
      {activeDiceRoll && (
        <DiceRollerModal
          key={`${activeDiceRoll.actor.id}-${activeDiceRoll.target.id}-${activeDiceRoll.actionTitle}`}
          isOpen={activeDiceRoll.isOpen}
          actorName={activeDiceRoll.actor.name}
          targetName={activeDiceRoll.target.name}
          targetAC={activeDiceRoll.target.ac}
          actionTitle={activeDiceRoll.actionTitle}
          baseDamage={activeDiceRoll.spell?.baseDamage || 8}
          onResolved={handleDiceRollResolved}
          onClose={() => setActiveDiceRoll(null)}
        />
      )}
    </div>
  );
}
