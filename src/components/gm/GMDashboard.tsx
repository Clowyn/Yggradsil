import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Users, Zap, Backpack, TreePine, Map,
  Plus, Minus, Send, Sparkles,
  Package, Shield, Sword, Heart, Clock,
  Trash2, Check, X
} from 'lucide-react';
import { useCampaign } from '../../contexts/CampaignContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { GMSpellManager } from './GMSpellManager';
import type { RaceDefinition, SubclassDefinition, StatKey } from '../../lib/types';

// ─── Types ──────────────────────────────────────────────────────

interface DemoPlayer {
  id: string;
  name: string;
  race: string;
  className: string;
  level: number;
  xp: number;
  color: string;
  hp: { current: number; max: number };
  ac: number;
  stats: Record<string, number>;
  skills: string[];
  inventory: DemoItem[];
}

interface DemoItem {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  quantity: number;
  equipped: boolean;
}

interface XPLogEntry {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  reason: string;
  timestamp: Date;
}

// ─── Demo Data ──────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#ffd700',
};

/*
const DEMO_INVENTORY: DemoItem[] = [
  { id: 'i1', name: 'Flamebrand', icon: '🗡️', rarity: 'legendary', quantity: 1, equipped: true },
  { id: 'i2', name: 'Healing Potion', icon: '🧪', rarity: 'common', quantity: 5, equipped: false },
  { id: 'i3', name: 'Mithril Chainmail', icon: '🛡️', rarity: 'epic', quantity: 1, equipped: true },
  { id: 'i4', name: 'Dragon Scale', icon: '🐉', rarity: 'uncommon', quantity: 3, equipped: false },
  { id: 'i5', name: 'Ring of Shadows', icon: '💍', rarity: 'rare', quantity: 1, equipped: true },
];
*/

/*
const INITIAL_PLAYERS: DemoPlayer[] = [
  {
    id: 'p1', name: 'Kael the Bold', race: 'Human', className: 'Warrior',
    level: 8, xp: 3400, color: '#dc2626',
    hp: { current: 72, max: 85 }, ac: 18,
    stats: { STR: 18, DEX: 12, CON: 16, INT: 10, WIS: 13, CHA: 14 },
    skills: ['Power Strike', 'Stone Skin'],
    inventory: [...DEMO_INVENTORY],
  },
  {
    id: 'p2', name: 'Lyria Moonweaver', race: 'Elf', className: 'Mage',
    level: 7, xp: 2800, color: '#2563eb',
    hp: { current: 38, max: 42 }, ac: 12,
    stats: { STR: 8, DEX: 14, CON: 12, INT: 20, WIS: 15, CHA: 13 },
    skills: ['Arcane Focus', 'Swift Dodge'],
    inventory: [...DEMO_INVENTORY.slice(1, 4)],
  },
  {
    id: 'p3', name: 'Thorne Ironbark', race: 'Dwarf', className: 'Paladin',
    level: 9, xp: 4100, color: '#16a34a',
    hp: { current: 95, max: 98 }, ac: 20,
    stats: { STR: 16, DEX: 10, CON: 18, INT: 11, WIS: 16, CHA: 14 },
    skills: ['Stone Skin', 'Inspire', 'Power Strike'],
    inventory: [...DEMO_INVENTORY.slice(0, 3)],
  },
  {
    id: 'p4', name: 'Mora Shadowveil', race: 'Tiefling', className: 'Rogue',
    level: 6, xp: 2100, color: '#9333ea',
    hp: { current: 44, max: 52 }, ac: 15,
    stats: { STR: 10, DEX: 20, CON: 13, INT: 14, WIS: 11, CHA: 16 },
    skills: ['Swift Dodge'],
    inventory: [...DEMO_INVENTORY.slice(2)],
  },
];
*/

const ALL_ITEMS: DemoItem[] = [
  { id: 'new-1', name: 'Potion of Invisibility', icon: '🫧', rarity: 'rare', quantity: 1, equipped: false },
  { id: 'new-2', name: 'Scroll of Fireball', icon: '📜', rarity: 'uncommon', quantity: 1, equipped: false },
  { id: 'new-3', name: 'Boots of Elvenkind', icon: '👢', rarity: 'rare', quantity: 1, equipped: false },
  { id: 'new-4', name: 'Wand of Magic Missiles', icon: '🪄', rarity: 'epic', quantity: 1, equipped: false },
  { id: 'new-5', name: 'Bag of Holding', icon: '👝', rarity: 'rare', quantity: 1, equipped: false },
  { id: 'new-6', name: 'Cloak of Protection', icon: '🧥', rarity: 'uncommon', quantity: 1, equipped: false },
];

const ALL_SKILLS = [
  'Power Strike', 'Iron Will', 'Titan Grip', 'Earthquake Slam',
  'Swift Dodge', 'Shadow Step', 'Blade Dance', 'Wind Walker',
  'Stone Skin', 'Vital Surge', 'Undying Resolve', 'Fortress Body',
  'Arcane Focus', 'Mind Shield', 'Spell Weave', 'Omniscience',
  'Nature Sense', 'Spirit Link', 'Prophecy', 'Astral Sight',
  'Inspire', 'Silver Tongue', 'Commanding Aura', 'Soul Blaze',
];

const STAT_COLORS: Record<string, string> = {
  STR: '#dc2626', DEX: '#16a34a', CON: '#d97706',
  INT: '#2563eb', WIS: '#9333ea', CHA: '#ec4899',
};

// ─── Tab definitions ────────────────────────────────────────────

type TabKey = 'overview' | 'party' | 'xp' | 'inventory' | 'stats' | 'spells';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Crown size={16} /> },
  { key: 'party', label: 'Party', icon: <Users size={16} /> },
  { key: 'xp', label: 'XP', icon: <Zap size={16} /> },
  { key: 'inventory', label: 'Inventory', icon: <Backpack size={16} /> },
  { key: 'stats', label: 'Stat Tree', icon: <TreePine size={16} /> },
  { key: 'spells', label: 'Spell Tree', icon: <Sparkles size={16} /> },
];

// ─── GMDashboard ────────────────────────────────────────────────

export function GMDashboard() {
  const { campaign, members } = useCampaign();
  const { locale } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [players, setPlayers] = useState<DemoPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [xpLog, setXpLog] = useState<XPLogEntry[]>([]);

  // Definitions for selection
  const [races, setRaces] = useState<RaceDefinition[]>([]);
  const [subclasses, setSubclasses] = useState<SubclassDefinition[]>([]);

  // Character Creation Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharProfileId, setNewCharProfileId] = useState('');
  const [newCharRaceId, setNewCharRaceId] = useState('');
  const [newCharSubclassId, setNewCharSubclassId] = useState('');
  const [newCharLevel, setNewCharLevel] = useState(1);
  const [newCharXP, setNewCharXP] = useState(0);

  interface CharacterWithDetails {
    id: string;
    name: string;
    level: number;
    xp_total: number;
    xp_available: number;
    race?: {
      id: string;
      name: string;
    };
    subclass?: {
      id: string;
      name_tr: string;
      name_en: string;
    };
    stats?: {
      id: string;
      stat_key: string;
      base_value: number;
      bonus_value: number;
    }[];
    skills?: {
      id: string;
      unlocked: boolean;
      skill_definition?: {
        id: string;
        name_tr: string;
        name_en: string;
      };
    }[];
    inventory?: {
      id: string;
      quantity: number;
      equipped: boolean;
      item_definition?: {
        id: string;
        name_tr: string;
        name_en: string;
        icon_url?: string;
        rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
        type: string;
        properties?: Record<string, string>;
      };
    }[];
  }

  const mapCharacterToDemoPlayer = useCallback((char: CharacterWithDetails): DemoPlayer => {
    const statsMap: Record<string, number> = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };
    if (char.stats) {
      char.stats.forEach((s) => {
        statsMap[s.stat_key] = (s.base_value ?? 10) + (s.bonus_value ?? 0);
      });
    }

    const skillsList: string[] = [];
    if (char.skills) {
      char.skills.forEach((cs) => {
        if (cs.unlocked && cs.skill_definition) {
          skillsList.push((locale === 'en' ? cs.skill_definition.name_en : cs.skill_definition.name_tr) || cs.skill_definition.name_en || cs.skill_definition.name_tr || '');
        }
      });
    }

    const inventoryList: DemoItem[] = [];
    if (char.inventory) {
      char.inventory.forEach((item) => {
        if (item.item_definition) {
          inventoryList.push({
            id: item.id,
            name: (locale === 'en' ? item.item_definition.name_en : item.item_definition.name_tr) || item.item_definition.name_en || item.item_definition.name_tr || 'Unknown Item',
            icon: item.item_definition.icon_url || '🎒',
            rarity: item.item_definition.rarity || 'common',
            quantity: item.quantity,
            equipped: item.equipped,
          });
        }
      });
    }

    const colors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ec4899', '#d97706'];
    const idStr = char.id || '';
    const colorIndex = Math.abs(idStr.split('').reduce((acc: number, code: string) => acc + code.charCodeAt(0), 0)) % colors.length;
    
    const conStat = statsMap['CON'] || 10;
    const maxHP = 50 + Math.floor((conStat - 10) / 2) * 5;
    const dexStat = statsMap['DEX'] || 10;
    const baseAC = 10 + Math.floor((dexStat - 10) / 2);
    const equippedArmor = char.inventory?.find((i) => i.equipped && i.item_definition?.type === 'armor');
    const ac = equippedArmor?.item_definition ? parseInt((equippedArmor.item_definition.properties as any)?.AC || '10', 10) : baseAC;

    return {
      id: char.id,
      name: char.name,
      race: char.race?.name || 'Unknown',
      className: char.subclass ? (locale === 'en' ? char.subclass.name_en : char.subclass.name_tr) : 'Unknown',
      level: char.level || 1,
      xp: char.xp_total || 0,
      color: colors[colorIndex],
      hp: { current: maxHP, max: maxHP },
      ac,
      stats: statsMap,
      skills: skillsList,
      inventory: inventoryList,
    };
  }, [locale]);

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
        setPlayers((data as unknown as CharacterWithDetails[]).map(mapCharacterToDemoPlayer));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [campaign, mapCharacterToDemoPlayer]);

  // Load static definitions and characters
  useEffect(() => {
    const fetchDefinitions = async () => {
      const { data: raceData } = await supabase.from('race_definitions').select('*');
      const { data: subclassData } = await supabase.from('subclass_definitions').select('*, category:class_categories(*)');
      if (raceData) setRaces(raceData);
      if (subclassData) setSubclasses(subclassData);
    };
    fetchDefinitions();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLiveCharacters();

    if (!campaign?.id) return;

    // Realtime subscription
    const channel = supabase
      .channel(`campaign-characters-${campaign.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `campaign_id=eq.${campaign.id}`
        },
        () => {
          fetchLiveCharacters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaign?.id, fetchLiveCharacters]);

  // ── XP Handlers ──
  const giveXP = async (playerId: string, amount: number, reason: string) => {
    if (amount === 0) return;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const newXp = Math.max(0, player.xp + amount);
    const newLevel = Math.floor(newXp / 1000) + 1;

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
      
      // Update local state
      setPlayers(prev => prev.map(p =>
        p.id === playerId ? { ...p, xp: newXp, level: newLevel } : p
      ));

      setXpLog(prev => [{
        id: `xp-${Date.now()}`,
        playerId,
        playerName: player.name,
        amount,
        reason: reason || (amount > 0 ? 'XP Awarded' : 'XP Deducted'),
        timestamp: new Date(),
      }, ...prev]);
    } catch (err) {
      console.error('Failed to update XP:', err);
    }
  };

  // ── Inventory Handlers ──
  const addItem = (playerId: string, item: DemoItem) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, inventory: [...p.inventory, { ...item, id: `${item.id}-${Date.now()}` }] }
        : p
    ));
  };

  const removeItem = (playerId: string, itemId: string) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, inventory: p.inventory.filter(i => i.id !== itemId) }
        : p
    ));
  };

  // ── Skill Handlers ──
  const addSkill = (playerId: string, skill: string) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId && !p.skills.includes(skill)
        ? { ...p, skills: [...p.skills, skill] }
        : p
    ));
  };

  const removeSkill = (playerId: string, skill: string) => {
    setPlayers(prev => prev.map(p =>
      p.id === playerId
        ? { ...p, skills: p.skills.filter(s => s !== skill) }
        : p
    ));
  };

  const handleCreateChar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign?.id || !newCharName || !newCharProfileId || !newCharRaceId || !newCharSubclassId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // 1. Fetch bonuses
      const race = races.find(r => r.id === newCharRaceId);
      const subclass = subclasses.find(s => s.id === newCharSubclassId);

      // 2. Insert Character
      const { data: char, error: charErr } = await supabase
        .from('characters')
        .insert({
          profile_id: newCharProfileId,
          campaign_id: campaign.id,
          name: newCharName,
          race_id: newCharRaceId,
          subclass_id: newCharSubclassId,
          level: newCharLevel,
          xp_total: newCharXP,
          xp_available: newCharXP,
        })
        .select()
        .single();

      if (charErr) throw charErr;

      // 3. Insert Stats
      const statsToInsert = (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as StatKey[]).map(stat => {
        const raceBonus = race?.stat_bonuses?.[stat] ?? 0;
        const subclassBonus = subclass?.base_stats?.[stat] ?? 0;
        return {
          character_id: char.id,
          stat_key: stat,
          base_value: 10 + raceBonus + subclassBonus,
          bonus_value: 0
        };
      });

      const { error: statsErr } = await supabase.from('character_stats').insert(statsToInsert);
      if (statsErr) throw statsErr;

      // 4. Insert Default Map Token
      const { error: tokenErr } = await supabase.from('map_tokens').insert({
        character_id: char.id,
        campaign_id: campaign.id,
        x_position: 600,
        y_position: 400,
        color: '#ffd700',
      });
      if (tokenErr) throw tokenErr;

      // Reset form & Close modal
      setNewCharName('');
      setNewCharProfileId('');
      setNewCharRaceId('');
      setNewCharSubclassId('');
      setNewCharLevel(1);
      setNewCharXP(0);
      setShowCreateModal(false);

      // Refresh list
      fetchLiveCharacters();
    } catch (err) {
      console.error('Failed to create character:', err);
      alert('Error creating character: ' + (err as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="w-full text-center py-12 text-gray-500 font-inter">
        Loading campaign characters...
      </div>
    );
  }

  return (
    <motion.div
      className="w-full max-w-[900px] mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#ffd700]/20 to-[#ff8c00]/10 border border-[#ffd700]/30 flex items-center justify-center">
          <Crown className="w-5 h-5 text-[#ffd700]" />
        </div>
        <div>
          <h1 className="text-xl font-cinzel font-bold text-gold-gradient">
            Game Master Dashboard
          </h1>
          <p className="text-[11px] text-gray-500 tracking-wider uppercase">
            {campaign?.name ?? 'Campaign'} — {members.length} adventurers
          </p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 glass rounded-xl p-1.5 border border-white/5">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-[#ffd700]/20 to-[#ff8c00]/10 text-[#ffd700] border border-[#ffd700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab players={players} xpLog={xpLog} onNavigate={setActiveTab} />
          )}
          {activeTab === 'party' && (
            <PartyTab
              players={players}
              selectedId={selectedPlayerId}
              onSelect={setSelectedPlayerId}
              onNavigate={setActiveTab}
              onCreateClick={() => setShowCreateModal(true)}
            />
          )}
          {activeTab === 'xp' && (
            <XPTab
              players={players}
              xpLog={xpLog}
              onGiveXP={giveXP}
              selectedId={selectedPlayerId}
              onSelect={setSelectedPlayerId}
            />
          )}
          {activeTab === 'inventory' && (
            <InventoryTab
              players={players}
              selectedId={selectedPlayerId}
              onSelect={setSelectedPlayerId}
              onAddItem={addItem}
              onRemoveItem={removeItem}
            />
          )}
          {activeTab === 'stats' && (
            <StatTreeTab
              players={players}
              selectedId={selectedPlayerId}
              onSelect={setSelectedPlayerId}
              onAddSkill={addSkill}
              onRemoveSkill={removeSkill}
            />
          )}
          {activeTab === 'spells' && (
            <GMSpellManager />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create Character Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass rounded-2xl border border-white/10 w-full max-w-md p-6 overflow-y-auto max-h-[90vh] space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h3 className="font-cinzel text-gold-gradient text-lg font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ffd700]" /> Create Character
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateChar} className="space-y-4 font-inter text-sm">
                {/* Character Name */}
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-parchment-dim font-bold">Character Name</label>
                  <input
                    type="text"
                    required
                    value={newCharName}
                    onChange={e => setNewCharName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40"
                    placeholder="Enter character name..."
                  />
                </div>

                {/* Assigned Profile/User */}
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-parchment-dim font-bold">Assigned User</label>
                  <select
                    required
                    value={newCharProfileId}
                    onChange={e => setNewCharProfileId(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  >
                    <option value="" disabled>Select a user...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.profile?.id || m.profile_id}>
                        {m.profile?.username || 'Unknown'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Race */}
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-parchment-dim font-bold">Race</label>
                  <select
                    required
                    value={newCharRaceId}
                    onChange={e => setNewCharRaceId(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  >
                    <option value="" disabled>Select a race...</option>
                    {races.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subclass */}
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-wider text-parchment-dim font-bold">Subclass</label>
                  <select
                    required
                    value={newCharSubclassId}
                    onChange={e => setNewCharSubclassId(e.target.value)}
                    className="w-full bg-[#1c1c1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  >
                    <option value="" disabled>Select a subclass...</option>
                    {subclasses.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.category ? `${locale === 'en' ? s.category.name_en : s.category.name_tr} - ` : ''}{locale === 'en' ? s.name_en : s.name_tr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level and XP */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-parchment-dim font-bold">Level</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      required
                      value={newCharLevel}
                      onChange={e => setNewCharLevel(parseInt(e.target.value, 10))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs uppercase tracking-wider text-parchment-dim font-bold">XP</label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={newCharXP}
                      onChange={e => setNewCharXP(parseInt(e.target.value, 10))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-bold transition-all uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[#ffd700] text-xs font-bold transition-all uppercase tracking-wider"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function OverviewTab({
  players, xpLog, onNavigate
}: {
  players: DemoPlayer[];
  xpLog: XPLogEntry[];
  onNavigate: (tab: TabKey) => void;
}) {
  const navigate = useNavigate();
  const avgLevel = Math.round(players.reduce((s, p) => s + p.level, 0) / players.length * 10) / 10;
  const totalXP = players.reduce((s, p) => s + p.xp, 0);

  const STATS = [
    { label: 'Party Size', value: players.length, icon: Users, color: '#2563eb', suffix: 'adventurers' },
    { label: 'Avg Level', value: avgLevel, icon: Sword, color: '#16a34a', suffix: '' },
    { label: 'Total XP Given', value: totalXP, icon: Sparkles, color: '#ffd700', suffix: 'XP' },
  ];

  const NAV_BUTTONS = [
    { label: 'Battle Map', icon: Map, color: '#dc143c', desc: 'Open the fog of war map', action: () => navigate('/map') },
    { label: 'Manage Items', icon: Package, color: '#a855f7', desc: 'View & edit player gear', action: () => onNavigate('inventory') },
    { label: 'Distribute XP', icon: Zap, color: '#ffd700', desc: 'Award experience points', action: () => onNavigate('xp') },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-cinzel" style={{ color: stat.color }}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </span>
              {stat.suffix && <span className="text-[10px] text-gray-600">{stat.suffix}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-cinzel font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          {NAV_BUTTONS.map((btn, i) => {
            const inner = (
              <motion.div
                className="glass rounded-xl p-4 border border-white/5 hover:border-white/15 text-left transition-all duration-300 group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${btn.color}15`, border: `1px solid ${btn.color}30` }}
                >
                  <btn.icon className="w-4 h-4" style={{ color: btn.color }} />
                </div>
                <h4 className="text-sm font-bold text-gray-200 mb-0.5 font-cinzel">{btn.label}</h4>
                <p className="text-[10px] text-gray-600">{btn.desc}</p>
              </motion.div>
            );

            return (
              <div key={btn.label} onClick={btn.action}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent XP Log */}
      {xpLog.length > 0 && (
        <div>
          <h3 className="text-xs font-cinzel font-bold text-gray-400 uppercase tracking-widest mb-3">
            Recent XP Activity
          </h3>
          <div className="glass rounded-xl border border-white/5 divide-y divide-white/5">
            {xpLog.slice(0, 5).map(entry => (
              <div key={entry.id} className="flex items-center gap-3 p-3">
                <Sparkles className="w-3.5 h-3.5 text-[#ffd700] shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-300 font-bold">{entry.playerName}</span>
                  <span className="text-[10px] text-gray-500 ml-2">{entry.reason}</span>
                </div>
                <span className={`text-xs font-bold tabular-nums ${entry.amount >= 0 ? 'text-[#ffd700]' : 'text-red-400'}`}>
                  {entry.amount >= 0 ? '+' : ''}{entry.amount.toLocaleString()} XP
                </span>
                <span className="text-[9px] text-gray-600 shrink-0">
                  {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PARTY TAB — Vibrant card-based redesign
// ═══════════════════════════════════════════════════════════════

function PartyTab({
  players, selectedId, onSelect, onNavigate, onCreateClick
}: {
  players: DemoPlayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onNavigate: (tab: TabKey) => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-cinzel font-bold text-gray-400 uppercase tracking-widest">
          Campaign Party ({players.length} members)
        </h3>
        <motion.button
          onClick={onCreateClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all duration-300"
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={14} /> Create Character
        </motion.button>
      </div>
      {players.map((player, i) => {
        const hpPct = (player.hp.current / player.hp.max) * 100;
        const isSelected = selectedId === player.id;

        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
              isSelected
                ? 'border-[#ffd700]/50 shadow-[0_0_30px_rgba(255,215,0,0.1)]'
                : 'border-white/5 hover:border-white/15'
            }`}
            onClick={() => onSelect(isSelected ? null : player.id)}
          >
            {/* Header band with gradient */}
            <div
              className="h-1.5"
              style={{ background: `linear-gradient(90deg, ${player.color}, ${player.color}66, transparent)` }}
            />

            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Large avatar */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 text-xl font-bold text-white border-2 shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${player.color}44, ${player.color}11)`,
                    borderColor: `${player.color}88`,
                    boxShadow: `0 4px 20px ${player.color}22`,
                  }}
                >
                  {player.name[0]}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-100 font-cinzel">{player.name}</h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${player.color}22`, color: player.color, border: `1px solid ${player.color}44` }}
                    >
                      Lv.{player.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span>{player.race}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span>{player.className}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                    <span className="text-[#ffd700]/70">{player.xp.toLocaleString()} XP</span>
                  </div>

                  {/* HP Bar */}
                  <div className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-red-400" />
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${hpPct}%` }}
                        style={{
                          backgroundColor: hpPct > 50 ? '#16a34a' : hpPct > 25 ? '#d97706' : '#dc2626',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 tabular-nums w-16 text-right">
                      {player.hp.current}/{player.hp.max}
                    </span>
                    <div className="flex items-center gap-1 ml-2">
                      <Shield className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] text-gray-400">{player.ac}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Stats */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                      {/* Ability Scores */}
                      <div className="grid grid-cols-6 gap-2">
                        {Object.entries(player.stats).map(([stat, value]) => {
                          const mod = Math.floor((value - 10) / 2);
                          return (
                            <div
                              key={stat}
                              className="rounded-lg p-2 text-center border"
                              style={{
                                backgroundColor: `${STAT_COLORS[stat]}08`,
                                borderColor: `${STAT_COLORS[stat]}22`,
                              }}
                            >
                              <div className="text-[9px] font-bold uppercase" style={{ color: STAT_COLORS[stat] }}>{stat}</div>
                              <div className="text-lg font-bold text-gray-200">{value}</div>
                              <div className="text-[10px] text-gray-500">{mod >= 0 ? `+${mod}` : mod}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quick action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigate('xp'); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/20 text-[#ffd700] text-xs font-bold transition-all"
                        >
                          <Zap size={14} /> Give XP
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigate('inventory'); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#a855f7]/10 hover:bg-[#a855f7]/20 border border-[#a855f7]/20 text-[#a855f7] text-xs font-bold transition-all"
                        >
                          <Backpack size={14} /> Inventory
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigate('stats'); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#16a34a]/10 hover:bg-[#16a34a]/20 border border-[#16a34a]/20 text-[#16a34a] text-xs font-bold transition-all"
                        >
                          <TreePine size={14} /> Stat Tree
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// XP TAB — Award / Deduct XP + History
// ═══════════════════════════════════════════════════════════════

function XPTab({
  players, xpLog, onGiveXP
}: {
  players: DemoPlayer[];
  xpLog: XPLogEntry[];
  onGiveXP: (playerId: string, amount: number, reason: string) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [individualAmounts, setIndividualAmounts] = useState<Record<string, string>>({});

  const handleBulkDistribute = () => {
    const amount = parseInt(bulkAmount, 10);
    if (isNaN(amount) || amount === 0) return;
    players.forEach(p => onGiveXP(p.id, amount, bulkReason || 'Bulk XP'));
    setBulkAmount('');
    setBulkReason('');
  };

  const handleIndividualGive = (playerId: string) => {
    const amount = parseInt(individualAmounts[playerId] || '0', 10);
    if (isNaN(amount) || amount === 0) return;
    onGiveXP(playerId, amount, '');
    setIndividualAmounts(prev => ({ ...prev, [playerId]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Bulk XP */}
      <div className="glass rounded-xl p-5 border border-[#ffd700]/10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#ffd700]" />
          <h3 className="text-sm font-cinzel font-bold text-[#ffd700]">Distribute to All</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="XP amount (negative to deduct)"
            value={bulkAmount}
            onChange={e => setBulkAmount(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40"
          />
          <input
            type="text"
            placeholder="Reason..."
            value={bulkReason}
            onChange={e => setBulkReason(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40"
          />
          <motion.button
            onClick={handleBulkDistribute}
            className="px-4 py-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Individual XP */}
      <div className="space-y-2">
        {players.map((player, i) => (
          <motion.div
            key={player.id}
            className="glass rounded-xl p-4 border border-white/5 flex items-center gap-3"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white border-2"
              style={{ backgroundColor: `${player.color}22`, borderColor: `${player.color}66` }}
            >
              {player.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-200">{player.name}</div>
              <div className="text-[10px] text-gray-500">Lv.{player.level} • {player.xp.toLocaleString()} XP</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                placeholder="+/- XP"
                value={individualAmounts[player.id] || ''}
                onChange={e => setIndividualAmounts(prev => ({ ...prev, [player.id]: e.target.value }))}
                className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center text-[#ffd700] font-bold placeholder-gray-700 focus:outline-none focus:border-[#ffd700]/40"
              />
              <motion.button
                onClick={() => handleIndividualGive(player.id)}
                className="p-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700]"
                whileTap={{ scale: 0.9 }}
              >
                <Check className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* XP History */}
      {xpLog.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-xs font-cinzel font-bold text-gray-400 uppercase tracking-widest">XP History</h3>
          </div>
          <div className="glass rounded-xl border border-white/5 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
            {xpLog.map(entry => (
              <div key={entry.id} className="flex items-center gap-3 p-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${entry.amount >= 0 ? 'bg-[#ffd700]/10' : 'bg-red-500/10'}`}>
                  {entry.amount >= 0 ? <Plus className="w-3 h-3 text-[#ffd700]" /> : <Minus className="w-3 h-3 text-red-400" />}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-300">{entry.playerName}</span>
                  <span className="text-[10px] text-gray-500 ml-2">{entry.reason}</span>
                </div>
                <span className={`text-xs font-bold tabular-nums ${entry.amount >= 0 ? 'text-[#ffd700]' : 'text-red-400'}`}>
                  {entry.amount >= 0 ? '+' : ''}{entry.amount.toLocaleString()} XP
                </span>
                <span className="text-[9px] text-gray-600">
                  {entry.timestamp.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INVENTORY TAB — View/Manage player items
// ═══════════════════════════════════════════════════════════════

function InventoryTab({
  players, selectedId, onSelect, onAddItem, onRemoveItem
}: {
  players: DemoPlayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddItem: (playerId: string, item: DemoItem) => void;
  onRemoveItem: (playerId: string, itemId: string) => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const selectedPlayer = players.find(p => p.id === selectedId);

  return (
    <div className="space-y-4">
      {/* Player selector */}
      <PlayerSelector players={players} selectedId={selectedId} onSelect={onSelect} />

      {selectedPlayer ? (
        <div className="space-y-4">
          {/* Add item button */}
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-cinzel font-bold text-gray-400 uppercase tracking-widest">
              {selectedPlayer.name}'s Inventory ({selectedPlayer.inventory.length} items)
            </h3>
            <motion.button
              onClick={() => setShowAddModal(!showAddModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a855f7]/10 hover:bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#a855f7] text-xs font-bold"
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={14} /> Add Item
            </motion.button>
          </div>

          {/* Add item modal */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-xl p-4 border border-[#a855f7]/20 overflow-hidden"
              >
                <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Select Item to Add</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_ITEMS.map(item => (
                    <motion.button
                      key={item.id}
                      onClick={() => { onAddItem(selectedPlayer.id, item); setShowAddModal(false); }}
                      className="flex items-center gap-2 p-2 rounded-lg border border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/5 transition-all text-left"
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="text-xs font-bold" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</div>
                        <div className="text-[9px] text-gray-500 capitalize">{item.rarity}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Inventory items */}
          <div className="space-y-2">
            {selectedPlayer.inventory.map((item, i) => (
              <motion.div
                key={item.id}
                className="glass rounded-xl p-3 flex items-center gap-3 border border-white/5 hover:border-white/10 transition-all"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: RARITY_COLORS[item.rarity] }}>{item.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="capitalize">{item.rarity}</span>
                    {item.equipped && <span className="text-[#ffd700]">⚡ Equipped</span>}
                    <span>×{item.quantity}</span>
                  </div>
                </div>
                <motion.button
                  onClick={() => onRemoveItem(selectedPlayer.id, item.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400"
                  whileTap={{ scale: 0.9 }}
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            ))}

            {selectedPlayer.inventory.length === 0 && (
              <div className="text-center py-8 text-gray-600 text-sm">No items in inventory</div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          <Backpack className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a player to view their inventory</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT TREE TAB — View/Manage player skills
// ═══════════════════════════════════════════════════════════════

function StatTreeTab({
  players, selectedId, onSelect, onAddSkill, onRemoveSkill
}: {
  players: DemoPlayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddSkill: (playerId: string, skill: string) => void;
  onRemoveSkill: (playerId: string, skill: string) => void;
}) {
  const [showAddSkill, setShowAddSkill] = useState(false);
  const selectedPlayer = players.find(p => p.id === selectedId);

  return (
    <div className="space-y-4">
      <PlayerSelector players={players} selectedId={selectedId} onSelect={onSelect} />

      {selectedPlayer ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-cinzel font-bold text-gray-400 uppercase tracking-widest">
              {selectedPlayer.name}'s Skills ({selectedPlayer.skills.length} unlocked)
            </h3>
            <motion.button
              onClick={() => setShowAddSkill(!showAddSkill)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16a34a]/10 hover:bg-[#16a34a]/20 border border-[#16a34a]/30 text-[#16a34a] text-xs font-bold"
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={14} /> Unlock Skill
            </motion.button>
          </div>

          {/* Add skill panel */}
          <AnimatePresence>
            {showAddSkill && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-xl p-4 border border-[#16a34a]/20 overflow-hidden"
              >
                <h4 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Available Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_SKILLS.filter(s => !selectedPlayer.skills.includes(s)).map(skill => (
                    <motion.button
                      key={skill}
                      onClick={() => { onAddSkill(selectedPlayer.id, skill); }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-[#16a34a]/40 bg-white/[0.02] hover:bg-[#16a34a]/10 text-xs text-gray-300 hover:text-[#16a34a] transition-all font-medium"
                      whileTap={{ scale: 0.95 }}
                    >
                      + {skill}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current skills */}
          <div className="grid grid-cols-2 gap-2">
            {selectedPlayer.skills.map((skill, i) => (
              <motion.div
                key={skill}
                className="glass rounded-xl p-3 flex items-center gap-3 border border-[#16a34a]/10 hover:border-[#16a34a]/30 transition-all"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 border border-[#16a34a]/20 flex items-center justify-center">
                  <TreePine className="w-4 h-4 text-[#16a34a]" />
                </div>
                <span className="flex-1 text-sm text-gray-200 font-medium">{skill}</span>
                <motion.button
                  onClick={() => onRemoveSkill(selectedPlayer.id, skill)}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400"
                  whileTap={{ scale: 0.9 }}
                  title="Remove skill"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              </motion.div>
            ))}
          </div>

          {selectedPlayer.skills.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">No skills unlocked yet</div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          <TreePine className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a player to manage their stat tree</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED: Player Selector
// ═══════════════════════════════════════════════════════════════

function PlayerSelector({
  players, selectedId, onSelect
}: {
  players: DemoPlayer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {players.map(player => (
        <motion.button
          key={player.id}
          onClick={() => onSelect(selectedId === player.id ? null : player.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
            selectedId === player.id
              ? 'bg-white/10 border-white/20 shadow-lg'
              : 'border-white/5 hover:border-white/15 hover:bg-white/5'
          }`}
          whileTap={{ scale: 0.95 }}
          style={selectedId === player.id ? { borderColor: `${player.color}66` } : undefined}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-white border"
            style={{ backgroundColor: `${player.color}22`, borderColor: `${player.color}66` }}
          >
            {player.name[0]}
          </div>
          <span className="text-xs font-medium text-gray-300">{player.name.split(' ')[0]}</span>
        </motion.button>
      ))}
    </div>
  );
}
