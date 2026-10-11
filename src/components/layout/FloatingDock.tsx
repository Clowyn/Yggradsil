import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  TreePine,
  Sparkles,
  Map as MapIcon,
  Backpack,
  Crown,
  Scale,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { playSound } from '../../lib/audio';

interface DockItem {
  to: string;
  labelEn: string;
  labelTr: string;
  icon: React.ReactNode;
  gmOnly?: boolean;
  adminOnly?: boolean;
}

const DOCK_ITEMS: DockItem[] = [
  {
    to: '/',
    labelEn: 'War Table',
    labelTr: 'Sefer Masası',
    icon: <LayoutDashboard size={20} />,
  },
  {
    to: '/character',
    labelEn: 'Character Sheet',
    labelTr: 'Karakter Föyü',
    icon: <User size={20} />,
  },
  {
    to: '/stat-tree',
    labelEn: 'Yggdrasil Tree',
    labelTr: 'Yggdrasil Ağacı',
    icon: <TreePine size={20} />,
  },
  {
    to: '/spells',
    labelEn: 'Spell Grimoire',
    labelTr: 'Büyü Kitabı',
    icon: <Sparkles size={20} />,
  },
  {
    to: '/map',
    labelEn: 'Battle Map',
    labelTr: 'Savaş Haritası',
    icon: <MapIcon size={20} />,
  },
  {
    to: '/inventory',
    labelEn: 'Adventurer Pack',
    labelTr: 'Maceracı Çantası',
    icon: <Backpack size={20} />,
  },
  {
    to: '/gm',
    labelEn: 'GM Chamber',
    labelTr: 'GM Odası',
    icon: <Crown size={20} />,
    gmOnly: true,
  },
  {
    to: '/admin',
    labelEn: 'High Council',
    labelTr: 'Yüksek Konsey',
    icon: <Scale size={20} />,
    adminOnly: true,
  },
];

export function FloatingDock() {
  const { isGM, isAdmin, locale } = useAuth();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const isTr = locale === 'tr';

  const visibleItems = DOCK_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.gmOnly && !isGM) return false;
    return true;
  });

  return (
    <div
      className="hidden md:block fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto"
      role="navigation"
      aria-label="macOS Floating Island Dock"
    >
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="arcane-dock px-2 sm:px-3 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2.5 max-w-[96vw] overflow-x-auto no-scrollbar"
      >
        {visibleItems.map((item, idx) => {
          const label = isTr ? item.labelTr : item.labelEn;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.to}
              className="relative flex flex-col items-center"
              onMouseEnter={() => {
                setHoveredIdx(idx);
                playSound('paper_flip');
              }}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* macOS Floating Tooltip Bubble */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-10 px-2.5 py-1 rounded-lg bg-[#0e1017]/95 border border-amber-900/40 text-amber-200 text-[11px] font-cinzel font-semibold tracking-wider whitespace-nowrap shadow-xl pointer-events-none z-50"
                  >
                    {label}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dock Icon Button */}
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => playSound('lock_click')}
                className={({ isActive }) =>
                  `relative p-2 sm:p-2.5 rounded-xl transition-all duration-200 flex flex-col items-center justify-center cursor-pointer ${
                    isActive
                      ? 'text-amber-300 bg-amber-500/15 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'text-amber-100/60 hover:text-amber-200 hover:bg-white/5 border border-transparent hover:border-amber-900/30'
                  }`
                }
              >
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ y: -4, scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="flex flex-col items-center"
                  >
                    {/* Icon container */}
                    <span
                      className={`transition-colors ${
                        isActive
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          : 'group-hover:text-amber-200'
                      }`}
                    >
                      {item.icon}
                    </span>

                    {/* macOS Active Under-Dot */}
                    {isActive && (
                      <motion.div
                        layoutId="dock-active-dot"
                        className="absolute -bottom-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>
                )}
              </NavLink>
            </div>
          );
        })}
      </motion.nav>
    </div>
  );
}
