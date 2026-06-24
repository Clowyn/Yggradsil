import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemRarity } from '../../lib/types';
import { RARITY_COLORS } from '../../lib/types';

// ─── Item interface ────────────────────────────────────────────

export interface InventoryItemLocal {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  type: string;
  quantity: number;
  equipped: boolean;
  properties?: Record<string, string>;
}

// ─── ItemCard ──────────────────────────────────────────────────

interface ItemCardProps {
  id: string;
  item: InventoryItemLocal | null;
  onEquipToggle?: (id: string) => void;
}

export function ItemCard({ id, item, onEquipToggle }: ItemCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !item });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  if (!item) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full aspect-square rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center">
        <span className="text-xs text-gray-700">Empty</span>
      </div>
    );
  }

  const rarityColor = RARITY_COLORS[item.rarity];
  const rarityClass = `rarity-${item.rarity}`;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <motion.div
        className={`
          relative glass rounded-lg border-2 ${rarityClass}
          cursor-grab active:cursor-grabbing
          w-full aspect-square flex flex-col items-center justify-center gap-1
          hover:bg-white/8 transition-all duration-200
          ${isDragging ? 'opacity-50 scale-95' : ''}
        `}
        whileHover={{ scale: 1.05 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Icon */}
        <span className="text-2xl">{item.icon}</span>

        {/* Name */}
        <span
          className="text-[9px] font-bold text-center leading-tight px-1 truncate w-full"
          style={{ color: rarityColor }}
        >
          {item.name}
        </span>

        {/* Quantity badge */}
        {item.quantity > 1 && (
          <div className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-black/70 border border-white/20 flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{item.quantity}</span>
          </div>
        )}

        {/* Equipped indicator */}
        {item.equipped && (
          <div className="absolute top-1 left-1">
            <div className="w-3 h-3 rounded-full bg-[#ffd700] flex items-center justify-center shadow-[0_0_6px_#ffd700]">
              <span className="text-[7px] text-black font-bold">E</span>
            </div>
          </div>
        )}

        {/* Double-click to equip */}
        {onEquipToggle && (
          <div
            className="absolute inset-0"
            onDoubleClick={(e) => {
              e.stopPropagation();
              onEquipToggle(item.id);
            }}
          />
        )}

        {/* Tooltip */}
        {showTooltip && (
          <motion.div
            className="absolute left-full ml-2 top-0 z-50 glass rounded-xl p-3 min-w-[200px] pointer-events-none"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              borderColor: `${rarityColor}44`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 15px ${rarityColor}22`,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{item.icon}</span>
              <div>
                <h4
                  className="font-cinzel font-bold text-sm"
                  style={{ color: rarityColor }}
                >
                  {item.name}
                </h4>
                <span className="text-[9px] uppercase tracking-widest text-gray-500">
                  {item.rarity} {item.type}
                </span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

            <p className="text-[11px] text-gray-300 italic leading-relaxed">
              {item.description}
            </p>

            {item.properties && Object.keys(item.properties).length > 0 && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
                <div className="space-y-1">
                  {Object.entries(item.properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-[10px]">
                      <span className="text-gray-500 capitalize">{key}</span>
                      <span className="text-emerald-400 font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
