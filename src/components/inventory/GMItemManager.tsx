import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Gift, Package } from 'lucide-react';
import type { ItemRarity } from '../../lib/types';
import { RARITY_COLORS } from '../../lib/types';

// ─── Types ─────────────────────────────────────────────────────

interface GMItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  type: string;
  icon: string;
}

const DEMO_PLAYERS = [
  { id: 'p1', name: 'Kael the Bold' },
  { id: 'p2', name: 'Lyria Moonweaver' },
  { id: 'p3', name: 'Thorne Ironbark' },
  { id: 'p4', name: 'Mora Shadowveil' },
];

const ITEM_TYPES = ['weapon', 'armor', 'consumable', 'quest', 'misc'];
const RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const ITEM_ICONS = ['🗡️', '🛡️', '🧪', '📖', '💍', '🔮', '⚔️', '🏹', '🪄', '💎', '🐉', '🗝️', '📜', '🍞', '🏰'];

// ─── GMItemManager ─────────────────────────────────────────────

export function GMItemManager() {
  const [items, setItems] = useState<GMItem[]>([
    { id: 'gm-1', name: 'Cursed Dagger', description: 'A dagger that whispers dark secrets.', rarity: 'rare', type: 'weapon', icon: '🗡️' },
    { id: 'gm-2', name: 'Phoenix Feather', description: 'A radiant feather that can revive the fallen.', rarity: 'legendary', type: 'quest', icon: '🪶' },
    { id: 'gm-3', name: 'Traveler\'s Rations', description: 'Simple but nourishing road food.', rarity: 'common', type: 'consumable', icon: '🥖' },
  ]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: 'common' as ItemRarity,
    type: 'misc',
    icon: '🗡️',
  });

  const [selectedPlayer, setSelectedPlayer] = useState(DEMO_PLAYERS[0].id);
  const [showForm, setShowForm] = useState(false);
  const [giveAnimation, setGiveAnimation] = useState<string | null>(null);

  const handleAddItem = useCallback(() => {
    if (!formData.name.trim()) return;

    const newItem: GMItem = {
      id: `gm-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      rarity: formData.rarity,
      type: formData.type,
      icon: formData.icon,
    };

    setItems((prev) => [...prev, newItem]);
    setFormData({ name: '', description: '', rarity: 'common', type: 'misc', icon: '🗡️' });
    setShowForm(false);
  }, [formData]);

  const handleDeleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleGiveItem = useCallback((itemId: string) => {
    setGiveAnimation(itemId);
    const player = DEMO_PLAYERS.find((p) => p.id === selectedPlayer);
    console.log(`📦 Giving item ${itemId} to ${player?.name}`);
    setTimeout(() => setGiveAnimation(null), 1000);
  }, [selectedPlayer]);

  return (
    <motion.div
      className="w-full max-w-[600px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#ffd700]" />
          <h2 className="text-lg font-cinzel font-bold text-gold-gradient">
            Item Manager
          </h2>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Item
        </button>
      </div>

      {/* Player select */}
      <div className="glass rounded-lg p-3 mb-4">
        <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">
          Give items to
        </label>
        <select
          value={selectedPlayer}
          onChange={(e) => setSelectedPlayer(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-[#ffd700]/40 transition-colors"
        >
          {DEMO_PLAYERS.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0a0a0f]">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create item form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="glass rounded-xl p-4 mb-4 space-y-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <h3 className="text-xs font-cinzel font-bold text-gray-300 uppercase tracking-widest">
              New Item
            </h3>

            {/* Name */}
            <input
              type="text"
              placeholder="Item name..."
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40"
            />

            {/* Description */}
            <textarea
              placeholder="Description..."
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#ffd700]/40 resize-none"
            />

            <div className="grid grid-cols-3 gap-2">
              {/* Rarity */}
              <div>
                <label className="text-[9px] text-gray-500 uppercase block mb-1">Rarity</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData((f) => ({ ...f, rarity: e.target.value as ItemRarity }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r} className="bg-[#0a0a0f]">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="text-[9px] text-gray-500 uppercase block mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-[#0a0a0f]">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Icon */}
              <div>
                <label className="text-[9px] text-gray-500 uppercase block mb-1">Icon</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData((f) => ({ ...f, icon: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-[#ffd700]/40"
                >
                  {ITEM_ICONS.map((icon) => (
                    <option key={icon} value={icon} className="bg-[#0a0a0f]">
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview & Submit */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{formData.icon}</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: RARITY_COLORS[formData.rarity] }}
                >
                  {formData.name || 'Unnamed'}
                </span>
              </div>
              <button
                onClick={handleAddItem}
                disabled={!formData.name.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/30 text-[#ffd700] text-xs font-bold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item list */}
      <div className="space-y-2">
        {items.map((item) => {
          const rarityColor = RARITY_COLORS[item.rarity];
          const isGiving = giveAnimation === item.id;

          return (
            <motion.div
              key={item.id}
              className={`glass rounded-lg p-3 flex items-center gap-3 border transition-all duration-300 ${isGiving ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5'}`}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center border"
                style={{ borderColor: `${rarityColor}44`, background: `${rarityColor}11` }}
              >
                <span className="text-lg">{item.icon}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: rarityColor }}>
                    {item.name}
                  </span>
                  <span className="text-[9px] text-gray-500 uppercase">
                    {item.rarity}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 truncate">{item.description}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <motion.button
                  onClick={() => handleGiveItem(item.id)}
                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all duration-200"
                  whileTap={{ scale: 0.9 }}
                  title="Give to player"
                >
                  <Gift className="w-3.5 h-3.5" />
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all duration-200"
                  whileTap={{ scale: 0.9 }}
                  title="Delete item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-sm">
            No items created yet. Click "Create Item" to begin.
          </div>
        )}
      </div>
    </motion.div>
  );
}
