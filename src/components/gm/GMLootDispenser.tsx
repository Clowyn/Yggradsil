import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Coins, Plus, Trash2, Send, Check,
  AlertCircle, CheckCircle2, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCampaign } from '../../contexts/CampaignContext';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';
import { GMTableNotice } from './GMTableNotice';
import type {
  CampaignLootChest,
  LootItem,
  ItemRarity,
} from '../../lib/types';

const RARITY_COLORS: Record<ItemRarity, { text: string; bg: string; border: string }> = {
  common: { text: 'text-gray-300', bg: 'bg-gray-500/10', border: 'border-gray-500/20' },
  uncommon: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  rare: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  epic: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  legendary: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
};

const ITEM_PRESETS: LootItem[] = [
  { name: 'Healing Potion', icon: '🧪', rarity: 'common', type: 'consumable', quantity: 2, properties: { healing: '2d4+2' } },
  { name: 'Greater Healing Potion', icon: '🧪', rarity: 'uncommon', type: 'consumable', quantity: 1, properties: { healing: '4d4+4' } },
  { name: 'Sunblade', icon: '🗡️', rarity: 'legendary', type: 'weapon', quantity: 1, properties: { damage: '1d8 radiant', versatile: '1d10' } },
  { name: 'Mithril Mail', icon: '🛡️', rarity: 'epic', type: 'armor', quantity: 1, properties: { ac: 16, stealth: 'no penalty' } },
  { name: 'Ring of Invisibility', icon: '💍', rarity: 'legendary', type: 'misc', quantity: 1, properties: { effect: 'turn invisible' } },
  { name: 'Bag of Holding', icon: '👝', rarity: 'rare', type: 'misc', quantity: 1, properties: { capacity: '500 lbs' } },
  { name: 'Scroll of Fireball', icon: '📜', rarity: 'uncommon', type: 'consumable', quantity: 1, properties: { spell: 'Fireball 3rd level' } },
  { name: 'Boots of Elvenkind', icon: '👢', rarity: 'rare', type: 'misc', quantity: 1, properties: { stealth: 'advantage' } },
];

export function GMLootDispenser() {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;
  const { campaign, characters } = useCampaign();
  const campaignId = campaign?.id;

  const [chests, setChests] = useState<CampaignLootChest[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  // New chest modal
  const [showNewChestModal, setShowNewChestModal] = useState(false);
  const [newChestName, setNewChestName] = useState('');
  const [newChestDesc, setNewChestDesc] = useState('');
  const [newChestGold, setNewChestGold] = useState(150);
  const [newChestItems, setNewChestItems] = useState<LootItem[]>([
    { name: 'İyileşme İksiri', icon: '🧪', rarity: 'common', type: 'consumable', quantity: 2 },
  ]);

  // Dispense modal
  const [dispenseTargetChest, setDispenseTargetChest] = useState<CampaignLootChest | null>(null);
  const [selectedCharId, setSelectedCharId] = useState<string>('');
  const [dispenseStatusMessage, setDispenseStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch loot chests
  const fetchChests = useCallback(async () => {
    if (!campaignId) return;
    try {
      const { data, error } = await supabase
        .from('campaign_loot_chests')
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
        console.error('Error fetching chests:', error);
        return;
      }

      setTableMissing(false);
      if (data) {
        setChests(data as CampaignLootChest[]);
      }
    } catch {
      setTableMissing(true);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChests();
  }, [fetchChests]);

  // Realtime subscription
  useEffect(() => {
    if (tableMissing || !campaignId) return;

    const channel = supabase
      .channel('loot-chests-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_loot_chests' },
        () => {
          fetchChests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableMissing, campaignId, fetchChests]);

  // Create Chest
  const handleCreateChest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChestName.trim()) return;

    const chestPayload: Partial<CampaignLootChest> = {
      campaign_id: campaignId || '00000000-0000-0000-0000-000000000001',
      name: newChestName.trim(),
      description: newChestDesc.trim() || null,
      gold_amount: newChestGold,
      is_looted: false,
      items: newChestItems,
    };

    if (!tableMissing) {
      try {
        const { data, error } = await supabase
          .from('campaign_loot_chests')
          .insert(chestPayload)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setChests((prev) => [data as CampaignLootChest, ...prev]);
        }
      } catch (err) {
        console.warn('DB insert chest error, using local fallback:', err);
        const localChest: CampaignLootChest = {
          ...(chestPayload as CampaignLootChest),
          id: `chest-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setChests((prev) => [localChest, ...prev]);
      }
    } else {
      const localChest: CampaignLootChest = {
        ...(chestPayload as CampaignLootChest),
        id: `chest-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      setChests((prev) => [localChest, ...prev]);
    }

    // Reset Form
    setNewChestName('');
    setNewChestDesc('');
    setNewChestGold(150);
    setNewChestItems([{ name: 'İyileşme İksiri', icon: '🧪', rarity: 'common', type: 'consumable', quantity: 2 }]);
    setShowNewChestModal(false);
  };

  // Toggle Looted Status
  const handleToggleLooted = async (chestId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setChests((prev) =>
      prev.map((c) => (c.id === chestId ? { ...c, is_looted: nextStatus } : c))
    );

    if (!tableMissing) {
      try {
        await supabase
          .from('campaign_loot_chests')
          .update({ is_looted: nextStatus })
          .eq('id', chestId);
      } catch (err) {
        console.error('Failed to update chest status:', err);
      }
    }
  };

  // Delete Chest
  const handleDeleteChest = async (chestId: string) => {
    setChests((prev) => prev.filter((c) => c.id !== chestId));

    if (!tableMissing) {
      try {
        await supabase.from('campaign_loot_chests').delete().eq('id', chestId);
      } catch (err) {
        console.error('Failed to delete chest:', err);
      }
    }
  };

  // Add Item to Builder
  const handleAddItemToBuilder = (preset?: LootItem) => {
    if (preset) {
      setNewChestItems((prev) => [...prev, { ...preset }]);
    } else {
      setNewChestItems((prev) => [
        ...prev,
        {
          name: 'Yeni Eşya',
          icon: '📦',
          rarity: 'common',
          type: 'misc',
          quantity: 1,
        },
      ]);
    }
  };

  // Remove Item from Builder
  const handleRemoveItemFromBuilder = (idx: number) => {
    setNewChestItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Dispense items & gold to Character's 24-slot inventory
  const handleDispenseToCharacter = async () => {
    if (!dispenseTargetChest || !selectedCharId) return;

    const targetChar = characters?.find((c) => c.id === selectedCharId);
    if (!targetChar) return;

    try {
      // 1. Fetch character's existing inventory to find used slots
      const { data: existingSlots, error: slotsErr } = await supabase
        .from('inventory_items')
        .select('slot_index')
        .eq('character_id', selectedCharId);

      const usedSlotIndices = new Set<number>();
      if (!slotsErr && existingSlots) {
        existingSlots.forEach((s) => {
          if (typeof s.slot_index === 'number') {
            usedSlotIndices.add(s.slot_index);
          }
        });
      }

      // 2. Fetch existing item definitions to match or link
      const { data: allDefs } = await supabase
        .from('item_definitions')
        .select('id, name_tr, name_en');

      const itemsToInsert: {
        character_id: string;
        item_definition_id: string;
        quantity: number;
        equipped: boolean;
        slot_index: number;
      }[] = [];

      const chestItems = dispenseTargetChest.items || [];
      let currentSlot = 4; // Start in Adventurer's Pack bag slots (4..23)

      for (const item of chestItems) {
        while (currentSlot < 24 && usedSlotIndices.has(currentSlot)) {
          currentSlot++;
        }

        if (currentSlot >= 24) {
          // Bag slots full!
          break;
        }

        // Match item definition
        let matchedDefId = item.item_definition_id;
        if (!matchedDefId && allDefs && allDefs.length > 0) {
          const match = allDefs.find(
            (d) =>
              d.name_tr?.toLowerCase() === item.name.toLowerCase() ||
              d.name_en?.toLowerCase() === item.name.toLowerCase()
          );
          matchedDefId = match?.id || allDefs[0].id;
        }

        if (matchedDefId) {
          itemsToInsert.push({
            character_id: selectedCharId,
            item_definition_id: matchedDefId,
            quantity: item.quantity || 1,
            equipped: false,
            slot_index: currentSlot,
          });
          usedSlotIndices.add(currentSlot);
          currentSlot++;
        }
      }

      // 3. Insert into inventory_items if any (with fallback if slot_index is not yet migrated)
      if (itemsToInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from('inventory_items')
          .insert(itemsToInsert);

        if (insertErr) {
          const fallbackItems = itemsToInsert.map(({ character_id, item_definition_id, quantity, equipped }) => ({
            character_id,
            item_definition_id,
            quantity,
            equipped,
          }));
          await supabase.from('inventory_items').insert(fallbackItems);
        }
      }

      // 4. Award chest gold_amount to the target character
      const chestGold = Math.max(0, Number(dispenseTargetChest.gold_amount) || 0);
      if (chestGold > 0) {
        const goldStorageKey = `dnd_gold_${selectedCharId}`;
        let currentGold =
          typeof targetChar.appearance?.gold === 'number'
            ? targetChar.appearance.gold
            : typeof targetChar.gold === 'number'
            ? targetChar.gold
            : 1247;
        try {
          const savedLocalGold = localStorage.getItem(goldStorageKey);
          if (savedLocalGold !== null && !Number.isNaN(Number(savedLocalGold))) {
            currentGold = Number(savedLocalGold);
          }
        } catch {
          // ignore
        }
        const nextGold = currentGold + chestGold;
        try {
          localStorage.setItem(goldStorageKey, String(nextGold));
        } catch {
          // ignore
        }
        const nextAppearance = {
          ...(targetChar.appearance || {}),
          gold: nextGold,
        };
        const { error: goldErr } = await supabase
          .from('characters')
          .update({ gold: nextGold, appearance: nextAppearance })
          .eq('id', selectedCharId);
        if (goldErr) {
          await supabase
            .from('characters')
            .update({ appearance: nextAppearance })
            .eq('id', selectedCharId);
        }
      }

      // 5. Mark chest as looted
      await handleToggleLooted(dispenseTargetChest.id, false);

      setDispenseStatusMessage({
        type: 'success',
        text: `Ganimet başarıyla ${targetChar.name} karakterinin envanterine aktarıldı! (${itemsToInsert.length} eşya, ${dispenseTargetChest.gold_amount} Altın)`,
      });

      setTimeout(() => {
        setDispenseTargetChest(null);
        setDispenseStatusMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Dispense error:', err);
      setDispenseStatusMessage({
        type: 'error',
        text: 'Eşyalar aktarılırken bir hata oluştu: ' + (err as Error).message,
      });
    }
  };

  return (
    <div data-testid="loot-dispenser" className="space-y-6 font-inter text-gray-200">
      {/* Table Resilience Notice */}
      {tableMissing && <GMTableNotice tableName="campaign_loot_chests" />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-cinzel font-bold text-gold-gradient">
              {t.lootDispenser.title}
            </h2>
            <p className="text-[11px] text-gray-400">
              {t.lootDispenser.subtitle}
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="create-chest-btn"
          onClick={() => setShowNewChestModal(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.lootDispenser.createChest}</span>
        </button>
      </div>

      {/* Chests Grid */}
      {chests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chests.map((chest) => (
            <div
              key={chest.id}
              className={`glass rounded-xl p-5 border transition-all flex flex-col justify-between relative overflow-hidden ${
                chest.is_looted
                  ? 'border-white/5 opacity-70 bg-black/40'
                  : 'border-[#ffd700]/20 hover:border-[#ffd700]/40 shadow-[0_0_15px_rgba(255,215,0,0.03)]'
              }`}
            >
              <div>
                {/* Top Row: Name, Gold & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-cinzel font-bold text-sm text-gray-200 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#ffd700]" />
                      <span>{chest.name}</span>
                    </h3>
                    {chest.description && (
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">
                        {chest.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    data-testid="delete-chest-btn"
                    onClick={() => handleDeleteChest(chest.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors shrink-0"
                    title={t.lootDispenser.deleteChest}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Gold and Looted Badge */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/20 text-[#ffd700] text-xs font-bold font-mono">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{chest.gold_amount.toLocaleString()} GP</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleLooted(chest.id, chest.is_looted)}
                    className={`text-[10px] px-2 py-1 rounded-lg border font-bold flex items-center gap-1 transition-all ${
                      chest.is_looted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {chest.is_looted ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{chest.is_looted ? t.lootDispenser.looted : t.lootDispenser.locked}</span>
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-1.5 mb-4">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    {t.lootDispenser.contents} ({chest.items?.length || 0}):
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                    {(chest.items || []).map((item, idx) => {
                      const rarity = item.rarity || 'common';
                      const rarityStyle = RARITY_COLORS[rarity] || RARITY_COLORS.common;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/5 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span>{item.icon || '📦'}</span>
                            <span className={`font-medium ${rarityStyle.text}`}>
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 tabular-nums">
                            ×{item.quantity || 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Dispense Action */}
              <div className="pt-3 border-t border-white/5">
                <button
                  type="button"
                  data-testid="dispense-loot-btn"
                  onClick={() => {
                    setDispenseTargetChest(chest);
                    if (characters && characters.length > 0) {
                      setSelectedCharId(characters[0].id);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-[#ffd700]/20 to-[#ff8c00]/10 hover:from-[#ffd700]/30 hover:to-[#ff8c00]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.lootDispenser.dispenseToCharacter}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="p-8 text-center glass rounded-xl border border-white/5 space-y-3">
            <Package className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-xs text-gray-400">{t.lootDispenser.noChests}</p>
            <button
              type="button"
              onClick={() => setShowNewChestModal(true)}
              className="px-3 py-1.5 rounded-lg bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold"
            >
              {t.lootDispenser.createFirstChest}
            </button>
          </div>
        )
      )}

      {/* Modal: Create Loot Chest */}
      <AnimatePresence>
        {showNewChestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl border border-white/10 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-cinzel font-bold text-gold-gradient flex items-center gap-2">
                <Package className="w-5 h-5 text-[#ffd700]" /> {t.lootDispenser.createChestTitle}
              </h3>

              <form onSubmit={handleCreateChest} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                    {t.lootDispenser.chestName}
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="chest-name-input"
                    value={newChestName}
                    onChange={(e) => setNewChestName(e.target.value)}
                    placeholder={t.lootDispenser.chestNamePlaceholder}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      {t.lootDispenser.chestDesc}
                    </label>
                    <input
                      type="text"
                      value={newChestDesc}
                      onChange={(e) => setNewChestDesc(e.target.value)}
                      placeholder={t.lootDispenser.chestDescPlaceholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">
                      {t.lootDispenser.goldAmount}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      data-testid="chest-gold-input"
                      value={newChestGold}
                      onChange={(e) => setNewChestGold(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-[#ffd700] font-bold text-center focus:outline-none focus:border-[#ffd700]/40"
                    />
                  </div>
                </div>

                {/* Items Builder */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400 uppercase font-bold">
                      {t.lootDispenser.itemsInChest} ({newChestItems.length})
                    </label>

                    <button
                      type="button"
                      onClick={() => handleAddItemToBuilder()}
                      className="text-xs text-[#ffd700] hover:underline flex items-center gap-1 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t.lootDispenser.addCustomItem}
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    <span className="text-[10px] text-gray-500 self-center">{t.lootDispenser.quickPresets}</span>
                    {ITEM_PRESETS.slice(0, 5).map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleAddItemToBuilder(p)}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-gray-300 transition-all flex items-center gap-1"
                      >
                        <span>{p.icon}</span>
                        <span>{p.name.split('(')[0].trim()}</span>
                      </button>
                    ))}
                  </div>

                  {/* Items List in Builder */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {newChestItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="glass p-2.5 rounded-lg border border-white/5 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={item.icon || '📦'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewChestItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, icon: val } : it))
                            );
                          }}
                          className="w-8 text-center bg-white/5 border border-white/10 rounded text-sm py-1"
                        />

                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewChestItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, name: val } : it))
                            );
                          }}
                          placeholder={t.lootDispenser.itemName + '...'}
                          className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-gray-200"
                        />

                        <select
                          value={item.rarity || 'common'}
                          onChange={(e) => {
                            const val = e.target.value as ItemRarity;
                            setNewChestItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, rarity: val } : it))
                            );
                          }}
                          className="bg-[#1c1c1e] border border-white/10 rounded px-2 py-1 text-xs text-gray-300"
                        >
                          <option value="common">Common</option>
                          <option value="uncommon">Uncommon</option>
                          <option value="rare">Rare</option>
                          <option value="epic">Epic</option>
                          <option value="legendary">Legendary</option>
                        </select>

                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setNewChestItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                            );
                          }}
                          className="w-12 text-center bg-white/5 border border-white/10 rounded px-1 py-1 text-xs text-gray-200"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromBuilder(idx)}
                          className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowNewChestModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-200"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    data-testid="chest-submit-btn"
                    className="px-4 py-1.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[#ffd700] text-xs font-bold"
                  >
                    {t.common.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Dispense Loot to Character */}
      <AnimatePresence>
        {dispenseTargetChest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl border border-white/10 w-full max-w-md p-6 space-y-4"
            >
              <h3 className="text-lg font-cinzel font-bold text-gold-gradient flex items-center gap-2">
                <Send className="w-5 h-5 text-[#ffd700]" /> {t.lootDispenser.dispenseToCharacter}
              </h3>

              <p className="text-xs text-gray-400">
                <strong>{dispenseTargetChest.name}</strong> •{' '}
                <strong>{dispenseTargetChest.gold_amount} GP</strong>
              </p>

              {dispenseStatusMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                    dispenseStatusMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {dispenseStatusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{dispenseStatusMessage.text}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                  {t.lootDispenser.selectCharacter}
                </label>
                <select
                  value={selectedCharId}
                  onChange={(e) => setSelectedCharId(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                >
                  {(characters || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Lv.{c.level || 1})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setDispenseTargetChest(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-gray-200"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleDispenseToCharacter}
                  className="px-4 py-1.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[#ffd700] text-xs font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.lootDispenser.dispenseToCharacter}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
