import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Swords, Shield, Heart, Plus, Minus, Trash2,
  Dices, Users, Skull, ChevronRight,
  Flame
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCampaign } from '../../contexts/CampaignContext';
import { GMTableNotice } from './GMTableNotice';
import type {
  CampaignEncounter,
  EncounterCombatant,
  EncounterStatus,
  DndCondition,
} from '../../lib/types';

const DND_CONDITIONS: { key: DndCondition; label: string; icon: string; color: string }[] = [
  { key: 'poisoned', label: 'Poisoned', icon: '🤢', color: '#22c55e' },
  { key: 'stunned', label: 'Stunned', icon: '💫', color: '#eab308' },
  { key: 'blinded', label: 'Blinded', icon: '🕶️', color: '#64748b' },
  { key: 'charmed', label: 'Charmed', icon: '💖', color: '#ec4899' },
  { key: 'paralyzed', label: 'Paralyzed', icon: '⚡', color: '#a855f7' },
  { key: 'frightened', label: 'Frightened', icon: '😱', color: '#f97316' },
  { key: 'unconscious', label: 'Unconscious', icon: '💀', color: '#ef4444' },
  { key: 'prone', label: 'Prone', icon: '🛌', color: '#94a3b8' },
  { key: 'invisible', label: 'Invisible', icon: '👻', color: '#38bdf8' },
  { key: 'grappled', label: 'Grappled', icon: '⛓️', color: '#d97706' },
  { key: 'restrained', label: 'Restrained', icon: '🕸️', color: '#854d0e' },
  { key: 'exhaustion', label: 'Exhaustion', icon: '😮‍💨', color: '#78716c' },
];

export function GMCombatTracker() {
  const { campaign, characters } = useCampaign();
  const campaignId = campaign?.id;

  const [encounters, setEncounters] = useState<CampaignEncounter[]>([]);
  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [combatants, setCombatants] = useState<EncounterCombatant[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  // New encounter form state
  const [showNewEncounterModal, setShowNewEncounterModal] = useState(false);
  const [newEncounterName, setNewEncounterName] = useState('');
  const [newEncounterNotes, setNewEncounterNotes] = useState('');

  // Add combatant form state
  const [showAddCombatantModal, setShowAddCombatantModal] = useState(false);
  const [newCombatantName, setNewCombatantName] = useState('');
  const [newCombatantHP, setNewCombatantHP] = useState(20);
  const [newCombatantAC, setNewCombatantAC] = useState(12);
  const [newCombatantInitiative, setNewCombatantInitiative] = useState(10);
  const [newCombatantIsNPC, setNewCombatantIsNPC] = useState(true);

  // Selected encounter
  const activeEncounter = useMemo(
    () => encounters.find((e) => e.id === selectedEncounterId) || null,
    [encounters, selectedEncounterId]
  );

  // Fetch encounters
  const fetchEncounters = useCallback(async () => {
    if (!campaignId) return;
    try {
      const { data, error } = await supabase
        .from('campaign_encounters')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist')
        ) {
          setTableMissing(true);
          return;
        }
        console.error('Error fetching encounters:', error);
        return;
      }

      setTableMissing(false);
      if (data) {
        setEncounters(data as CampaignEncounter[]);
        if (!selectedEncounterId && data.length > 0) {
          setSelectedEncounterId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Encounters table query failed, fallback to local state:', err);
      setTableMissing(true);
    } finally {
      setLoading(false);
    }
  }, [campaignId, selectedEncounterId]);

  // Fetch combatants for current encounter
  const fetchCombatants = useCallback(async (encounterId: string) => {
    try {
      const { data, error } = await supabase
        .from('encounter_combatants')
        .select('*')
        .eq('encounter_id', encounterId)
        .order('initiative', { ascending: false });

      if (error) {
        if (
          error.code === '42P01' ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist')
        ) {
          setTableMissing(true);
          return;
        }
        console.error('Error fetching combatants:', error);
        return;
      }

      if (data) {
        setCombatants(data as EncounterCombatant[]);
      }
    } catch (err) {
      console.warn('Combatants query error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEncounters();
  }, [fetchEncounters]);

  // Fetch combatants on encounter select
  useEffect(() => {
    if (selectedEncounterId && !tableMissing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCombatants(selectedEncounterId);
    }
  }, [selectedEncounterId, tableMissing, fetchCombatants]);

  // Realtime subscription
  useEffect(() => {
    if (tableMissing || !campaignId) return;

    const channel = supabase
      .channel('combat-tracker-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_encounters' },
        () => {
          fetchEncounters();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'encounter_combatants' },
        () => {
          if (selectedEncounterId) {
            fetchCombatants(selectedEncounterId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableMissing, campaignId, selectedEncounterId, fetchEncounters, fetchCombatants]);

  // Sorted combatants by initiative descending
  const sortedCombatants = useMemo(() => {
    return [...combatants].sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
  }, [combatants]);

  // ── Actions ──────────────────────────────────────────────────

  // Create encounter
  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEncounterName.trim()) return;

    const newEnc: Partial<CampaignEncounter> = {
      campaign_id: campaignId || '00000000-0000-0000-0000-000000000001',
      name: newEncounterName.trim(),
      status: 'preparing',
      round: 1,
      notes: newEncounterNotes.trim() || null,
      active_combatant_id: null,
    };

    if (!tableMissing) {
      try {
        const { data, error } = await supabase
          .from('campaign_encounters')
          .insert(newEnc)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setEncounters((prev) => [data as CampaignEncounter, ...prev]);
          setSelectedEncounterId(data.id);
        }
      } catch (err) {
        console.warn('Insert encounter DB failed, using local:', err);
        const localId = `enc-${Date.now()}`;
        const created: CampaignEncounter = {
          ...(newEnc as CampaignEncounter),
          id: localId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setEncounters((prev) => [created, ...prev]);
        setSelectedEncounterId(localId);
      }
    } else {
      const localId = `enc-${Date.now()}`;
      const created: CampaignEncounter = {
        ...(newEnc as CampaignEncounter),
        id: localId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEncounters((prev) => [created, ...prev]);
      setSelectedEncounterId(localId);
    }

    setNewEncounterName('');
    setNewEncounterNotes('');
    setShowNewEncounterModal(false);
  };

  // Update encounter status or round
  const handleUpdateEncounter = async (updates: Partial<CampaignEncounter>) => {
    if (!selectedEncounterId) return;

    // Optimistic local update
    setEncounters((prev) =>
      prev.map((e) => (e.id === selectedEncounterId ? { ...e, ...updates } : e))
    );

    if (!tableMissing) {
      try {
        await supabase
          .from('campaign_encounters')
          .update(updates)
          .eq('id', selectedEncounterId);
      } catch (err) {
        console.error('Failed to update encounter:', err);
      }
    }
  };

  // Delete encounter
  const handleDeleteEncounter = async (id: string) => {
    setEncounters((prev) => prev.filter((e) => e.id !== id));
    if (selectedEncounterId === id) {
      const remaining = encounters.filter((e) => e.id !== id);
      setSelectedEncounterId(remaining.length > 0 ? remaining[0].id : null);
      setCombatants([]);
    }

    if (!tableMissing) {
      try {
        await supabase.from('campaign_encounters').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete encounter:', err);
      }
    }
  };

  // Add Combatant
  const handleAddCombatant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEncounterId || !newCombatantName.trim()) return;

    const newComb: Partial<EncounterCombatant> = {
      encounter_id: selectedEncounterId,
      name: newCombatantName.trim(),
      hp_current: newCombatantHP,
      hp_max: newCombatantHP,
      hp_temp: 0,
      ac: newCombatantAC,
      initiative: newCombatantInitiative,
      is_npc: newCombatantIsNPC,
      is_hidden: false,
      conditions: [],
      sort_order: combatants.length,
    };

    if (!tableMissing) {
      try {
        const { data, error } = await supabase
          .from('encounter_combatants')
          .insert(newComb)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCombatants((prev) => [...prev, data as EncounterCombatant]);
        }
      } catch (err) {
        console.warn('DB insert combatant failed, fallback to local:', err);
        const localComb: EncounterCombatant = {
          ...(newComb as EncounterCombatant),
          id: `comb-${Date.now()}`,
        };
        setCombatants((prev) => [...prev, localComb]);
      }
    } else {
      const localComb: EncounterCombatant = {
        ...(newComb as EncounterCombatant),
        id: `comb-${Date.now()}`,
      };
      setCombatants((prev) => [...prev, localComb]);
    }

    setNewCombatantName('');
    setNewCombatantHP(20);
    setNewCombatantAC(12);
    setNewCombatantInitiative(10);
    setShowAddCombatantModal(false);
  };

  // Add Party Members as Combatants
  const handleAddPartyMembers = async () => {
    if (!selectedEncounterId || !characters || characters.length === 0) return;

    const partyCombatants: Partial<EncounterCombatant>[] = characters.map((c, idx) => ({
      encounter_id: selectedEncounterId,
      character_id: c.id,
      name: c.name,
      hp_current: 25 + (c.level || 1) * 6,
      hp_max: 25 + (c.level || 1) * 6,
      hp_temp: 0,
      ac: 14,
      initiative: Math.floor(Math.random() * 20) + 1,
      is_npc: false,
      is_hidden: false,
      conditions: [],
      sort_order: combatants.length + idx,
    }));

    if (!tableMissing) {
      try {
        const { data, error } = await supabase
          .from('encounter_combatants')
          .insert(partyCombatants)
          .select();

        if (error) throw error;
        if (data) {
          setCombatants((prev) => [...prev, ...(data as EncounterCombatant[])]);
        }
      } catch (err) {
        console.warn('Failed to insert party in DB, adding locally:', err);
        const locals = partyCombatants.map((pc, idx) => ({
          ...(pc as EncounterCombatant),
          id: `party-${idx}-${Date.now()}`,
        }));
        setCombatants((prev) => [...prev, ...locals]);
      }
    } else {
      const locals = partyCombatants.map((pc, idx) => ({
        ...(pc as EncounterCombatant),
        id: `party-${idx}-${Date.now()}`,
      }));
      setCombatants((prev) => [...prev, ...locals]);
    }
  };

  // Auto Roll Initiative for all
  const handleAutoRollInitiative = async () => {
    const updated = combatants.map((c) => ({
      ...c,
      initiative: Math.floor(Math.random() * 20) + 1,
    }));
    setCombatants(updated);

    if (!tableMissing) {
      try {
        for (const c of updated) {
          await supabase
            .from('encounter_combatants')
            .update({ initiative: c.initiative })
            .eq('id', c.id);
        }
      } catch (err) {
        console.error('Failed to sync initiatives:', err);
      }
    }
  };

  // Adjust HP
  const handleAdjustHP = async (combatantId: string, delta: number) => {
    const target = combatants.find((c) => c.id === combatantId);
    if (!target) return;

    let newCurrent = target.hp_current + delta;
    newCurrent = Math.max(0, Math.min(newCurrent, target.hp_max + (target.hp_temp || 0)));

    setCombatants((prev) =>
      prev.map((c) => (c.id === combatantId ? { ...c, hp_current: newCurrent } : c))
    );

    if (!tableMissing) {
      try {
        await supabase
          .from('encounter_combatants')
          .update({ hp_current: newCurrent })
          .eq('id', combatantId);
      } catch (err) {
        console.error('Failed to update HP in DB:', err);
      }
    }
  };

  // Toggle Condition
  const handleToggleCondition = async (combatantId: string, condition: DndCondition) => {
    const target = combatants.find((c) => c.id === combatantId);
    if (!target) return;

    const currentConditions = target.conditions || [];
    const nextConditions = currentConditions.includes(condition)
      ? currentConditions.filter((cond) => cond !== condition)
      : [...currentConditions, condition];

    setCombatants((prev) =>
      prev.map((c) => (c.id === combatantId ? { ...c, conditions: nextConditions } : c))
    );

    if (!tableMissing) {
      try {
        await supabase
          .from('encounter_combatants')
          .update({ conditions: nextConditions })
          .eq('id', combatantId);
      } catch (err) {
        console.error('Failed to update conditions in DB:', err);
      }
    }
  };

  // Delete combatant
  const handleDeleteCombatant = async (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));

    if (!tableMissing) {
      try {
        await supabase.from('encounter_combatants').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete combatant:', err);
      }
    }
  };

  // Next Turn
  const handleNextTurn = () => {
    if (sortedCombatants.length === 0 || !activeEncounter) return;

    const currentIndex = sortedCombatants.findIndex(
      (c) => c.id === activeEncounter.active_combatant_id
    );

    let nextIndex = 0;
    let nextRound = activeEncounter.round || 1;

    if (currentIndex >= 0) {
      if (currentIndex + 1 < sortedCombatants.length) {
        nextIndex = currentIndex + 1;
      } else {
        nextIndex = 0;
        nextRound += 1;
      }
    }

    const nextCombatant = sortedCombatants[nextIndex];
    handleUpdateEncounter({
      active_combatant_id: nextCombatant?.id || null,
      round: nextRound,
      status: 'active',
    });
  };

  return (
    <div data-testid="combat-tracker" className="space-y-6 font-inter text-gray-200">
      {/* Table Resilience Notice */}
      {tableMissing && <GMTableNotice tableName="campaign_encounters & encounter_combatants" />}

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-cinzel font-bold text-gold-gradient">
              Combat & Initiative Tracker
            </h2>
            <p className="text-[11px] text-gray-400">
              Manage encounters, roll initiative, track 5e conditions & HP in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="create-encounter-btn"
            onClick={() => setShowNewEncounterModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Karşılaşma</span>
          </button>
        </div>
      </div>

      {/* Encounter Selector Tabs */}
      {encounters.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {encounters.map((enc) => {
            const isSelected = enc.id === selectedEncounterId;
            const statusColor =
              enc.status === 'active'
                ? 'text-red-400 border-red-500/40 bg-red-500/10'
                : enc.status === 'completed'
                ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                : 'text-amber-400 border-amber-500/40 bg-amber-500/10';

            return (
              <div
                key={enc.id}
                onClick={() => setSelectedEncounterId(enc.id)}
                className={`cursor-pointer px-4 py-2.5 rounded-xl border transition-all flex items-center gap-3 shrink-0 ${
                  isSelected
                    ? 'border-[#ffd700]/50 bg-[#ffd700]/10 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                    : 'border-white/5 glass hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-gray-200">{enc.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      data-testid="encounter-status-badge"
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${statusColor}`}
                    >
                      {enc.status}
                    </span>
                    <span className="text-[10px] text-gray-500">Tur {enc.round || 1}</span>
                  </div>
                </div>

                <button
                  type="button"
                  data-testid="delete-encounter-btn"
                  title="Karşılaşmayı Sil"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEncounter(enc.id);
                  }}
                  className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        !loading && (
          <div className="p-8 text-center glass rounded-xl border border-white/5 space-y-3">
            <Skull className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400">Aktif bir karşılaşma bulunmuyor.</p>
            <button
              type="button"
              onClick={() => setShowNewEncounterModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold"
            >
              İlk Karşılaşmayı Oluştur
            </button>
          </div>
        )
      )}

      {/* Active Encounter Dashboard */}
      {activeEncounter && (
        <div className="space-y-4">
          {/* Active Encounter Banner & Turn Bar */}
          <div className="glass p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  Aktif Karşılaşma
                </span>
                <h3 className="text-lg font-cinzel font-bold text-[#ffd700]">
                  {activeEncounter.name}
                </h3>
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                {(['preparing', 'active', 'completed'] as EncounterStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateEncounter({ status: st })}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      activeEncounter.status === st
                        ? 'bg-[#ffd700] text-black shadow-sm'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Round & Turn Actions */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="text-xs text-gray-400 font-bold">Tur:</span>
                <button
                  type="button"
                  data-testid="prev-round-btn"
                  onClick={() =>
                    handleUpdateEncounter({ round: Math.max(1, (activeEncounter.round || 1) - 1) })
                  }
                  className="p-1 hover:text-[#ffd700]"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span
                  data-testid="round-counter"
                  className="text-sm font-bold text-[#ffd700] tabular-nums px-1"
                >
                  {activeEncounter.round || 1}
                </span>
                <button
                  type="button"
                  data-testid="next-round-btn"
                  onClick={() =>
                    handleUpdateEncounter({ round: (activeEncounter.round || 1) + 1 })
                  }
                  className="p-1 hover:text-[#ffd700]"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <button
                type="button"
                data-testid="next-turn-btn"
                onClick={handleNextTurn}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-900/30 transition-all"
              >
                <span>Sıradaki Hamle</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Combatant Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="add-combatant-btn"
                onClick={() => setShowAddCombatantModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200"
              >
                <Plus className="w-3.5 h-3.5 text-[#ffd700]" />
                <span>Savaşçı / NPC Ekle</span>
              </button>

              <button
                type="button"
                onClick={handleAddPartyMembers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Grup Üyelerini Çek</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="auto-roll-initiative-btn"
                onClick={handleAutoRollInitiative}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Toplu İnisiyatif Zarı At (d20)</span>
              </button>
            </div>
          </div>

          {/* Combatant List */}
          <div className="space-y-2">
            {sortedCombatants.map((c, idx) => {
              const isCurrentTurn = c.id === activeEncounter.active_combatant_id;
              const hpPercent = Math.max(0, Math.min(100, Math.round((c.hp_current / (c.hp_max || 1)) * 100)));
              const hpColor =
                c.hp_current <= 0
                  ? 'bg-gray-600'
                  : hpPercent > 50
                  ? 'bg-emerald-500'
                  : hpPercent > 20
                  ? 'bg-amber-500'
                  : 'bg-red-500';

              return (
                <div
                  key={c.id}
                  data-testid={`combatant-${c.id}`}
                  className={`glass rounded-xl p-3 border transition-all ${
                    isCurrentTurn
                      ? 'border-red-500/70 bg-gradient-to-r from-red-950/30 to-black/60 shadow-[0_0_15px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50'
                      : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Name & Initiative */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="w-8 h-8 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center font-bold text-xs text-[#ffd700] tabular-nums">
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-200">{c.name}</span>
                          {c.is_npc ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              NPC
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Oyuncu
                            </span>
                          )}
                          {isCurrentTurn && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500 text-white font-bold flex items-center gap-1 animate-pulse">
                              <Flame className="w-2.5 h-2.5" /> SIRADA
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                          <span>
                            İnisiyatif: <strong className="text-gray-200">{c.initiative}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-cyan-400" /> AC {c.ac}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* HP Bar & Quick Adjust */}
                    <div className="flex items-center gap-3 flex-1 max-w-sm">
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" /> HP
                          </span>
                          <span className="font-bold tabular-nums">
                            {c.hp_current} / {c.hp_max}
                            {c.hp_temp > 0 && (
                              <span className="text-cyan-400 text-[10px] ml-1">
                                (+{c.hp_temp} Geçici)
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-black/50 border border-white/5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${hpColor}`}
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Damage & Heal Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          data-testid={`hp-damage-${c.id}`}
                          title="-5 Hasar"
                          onClick={() => handleAdjustHP(c.id, -5)}
                          className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold"
                        >
                          -5
                        </button>
                        <button
                          type="button"
                          title="-1 Hasar"
                          onClick={() => handleAdjustHP(c.id, -1)}
                          className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-xs font-bold"
                        >
                          -1
                        </button>
                        <button
                          type="button"
                          title="+1 İyileş"
                          onClick={() => handleAdjustHP(c.id, 1)}
                          className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs font-bold"
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          data-testid={`hp-heal-${c.id}`}
                          title="+5 İyileş"
                          onClick={() => handleAdjustHP(c.id, 5)}
                          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title="Savaşçıyı Sil"
                        onClick={() => handleDeleteCombatant(c.id)}
                        className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conditions Row */}
                  <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1">
                      Durumlar:
                    </span>
                    {DND_CONDITIONS.map((cond) => {
                      const isActive = (c.conditions || []).includes(cond.key);
                      return (
                        <button
                          key={cond.key}
                          type="button"
                          onClick={() => handleToggleCondition(c.id, cond.key)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 border ${
                            isActive
                              ? 'bg-opacity-20 border-opacity-60 font-bold shadow-sm'
                              : 'bg-black/20 border-white/5 text-gray-500 hover:text-gray-300 opacity-60'
                          }`}
                          style={
                            isActive
                              ? {
                                  backgroundColor: `${cond.color}22`,
                                  borderColor: cond.color,
                                  color: cond.color,
                                }
                              : {}
                          }
                        >
                          <span>{cond.icon}</span>
                          <span>{cond.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: New Encounter */}
      <AnimatePresence>
        {showNewEncounterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl border border-white/10 w-full max-w-md p-6 space-y-4"
            >
              <h3 className="text-lg font-cinzel font-bold text-gold-gradient flex items-center gap-2">
                <Swords className="w-5 h-5 text-[#ffd700]" /> Yeni Karşılaşma Oluştur
              </h3>

              <form onSubmit={handleCreateEncounter} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    Karşılaşma Adı
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="encounter-name-input"
                    value={newEncounterName}
                    onChange={(e) => setNewEncounterName(e.target.value)}
                    placeholder="Örn: Goblin Pususu, Ejderha Yuvası"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    GM Notları
                  </label>
                  <textarea
                    rows={3}
                    value={newEncounterNotes}
                    onChange={(e) => setNewEncounterNotes(e.target.value)}
                    placeholder="Taktikler, çevre tehlikeleri, sürpriz faktörleri..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowNewEncounterModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    data-testid="encounter-submit-btn"
                    className="px-4 py-1.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[#ffd700] text-xs font-bold"
                  >
                    Oluştur
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Combatant */}
      <AnimatePresence>
        {showAddCombatantModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl border border-white/10 w-full max-w-md p-6 space-y-4"
            >
              <h3 className="text-lg font-cinzel font-bold text-gold-gradient flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#ffd700]" /> Savaşçı / Yaratık Ekle
              </h3>

              <form onSubmit={handleAddCombatant} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    İsim
                  </label>
                  <input
                    type="text"
                    required
                    value={newCombatantName}
                    onChange={(e) => setNewCombatantName(e.target.value)}
                    placeholder="Örn: Goblin Okçusu, Kara Şövalye"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      Maks HP
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCombatantHP}
                      onChange={(e) => setNewCombatantHP(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 text-center focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      Zırh (AC)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newCombatantAC}
                      onChange={(e) => setNewCombatantAC(parseInt(e.target.value, 10) || 10)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 text-center focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      İnisiyatif
                    </label>
                    <input
                      type="number"
                      required
                      value={newCombatantInitiative}
                      onChange={(e) =>
                        setNewCombatantInitiative(parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 text-center focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is-npc-checkbox"
                    checked={newCombatantIsNPC}
                    onChange={(e) => setNewCombatantIsNPC(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-[#ffd700] focus:ring-0"
                  />
                  <label htmlFor="is-npc-checkbox" className="text-xs text-gray-300">
                    NPC / Canavar (Oyuncu karakteri değil)
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowAddCombatantModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[#ffd700] text-xs font-bold"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
