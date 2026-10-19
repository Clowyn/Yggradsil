import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  User,
  TreePine,
  Map as MapIcon,
  Backpack,
  Shield,
  Crown,
  X,
  Sparkles,
  Scale,
  Swords,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { playSound } from '../../lib/audio';

interface NavItem {
  to: string;
  labelEn: string;
  labelTr: string;
  icon: React.ReactNode;
  gmOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', labelEn: 'War Table', labelTr: 'Sefer Masası', icon: <LayoutDashboard size={18} /> },
  { to: '/character', labelEn: 'Character Sheet', labelTr: 'Karakter Föyü', icon: <User size={18} /> },
  { to: '/stat-tree', labelEn: 'Yggdrasil Tree', labelTr: 'Yggdrasil Ağacı', icon: <TreePine size={18} /> },
  { to: '/spells', labelEn: 'Spell Grimoire', labelTr: 'Büyü Kitabı', icon: <Sparkles size={18} /> },
  { to: '/map', labelEn: 'Battle Map', labelTr: 'Savaş Haritası', icon: <MapIcon size={18} /> },
  { to: '/inventory', labelEn: 'Adventurer Pack', labelTr: 'Maceracı Çantası', icon: <Backpack size={18} /> },
  { to: '/arena', labelEn: 'Combat Arena', labelTr: 'Savaş Arenası', icon: <Swords size={18} /> },
  { to: '/gm', labelEn: 'GM Chamber', labelTr: 'GM Odası', icon: <Crown size={18} />, gmOnly: true },
];

export interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { profile, isGM, isAdmin, locale } = useAuth();
  const location = useLocation();
  const isTr = locale === 'tr';
  const filteredItems = NAV_ITEMS.filter((item) => !item.gmOnly || isGM);

  // Auto-close mobile drawer on route change
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      onMobileClose?.();
    }
  }, [location.pathname, onMobileClose]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Drawer Container (Slide-in on mobile, hidden on desktop where FloatingDock takes over) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 md:hidden h-dvh-screen safe-bottom flex flex-col border-r border-amber-900/30 bg-[#08090c]/95 backdrop-blur-2xl shrink-0 transition-transform duration-300 ease-in-out w-[280px] max-w-[85vw] shadow-2xl ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-amber-900/30 flex items-center justify-between shrink-0 h-[64px] w-full bg-black/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
              <h1 className="text-base font-cinzel text-amber-200 tracking-wider font-extrabold">
                YGGDRASIL
              </h1>
            </div>
            <p className="text-[10px] text-amber-100/60 font-cinzel tracking-wider uppercase mt-0.5">
              ARCANE REALM CHRONICLES
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onMobileClose}
            className="text-amber-400 hover:text-amber-200 transition-colors p-2 rounded-xl border border-amber-900/40 hover:bg-amber-500/10 shrink-0 cursor-pointer"
            title="Close menu"
            aria-label="Close navigation drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto w-full no-scrollbar">
          <div className="px-2 mb-2">
            <span className="text-[9px] font-cinzel text-amber-200/50 tracking-widest uppercase">
              REALM SANCTUMS
            </span>
          </div>

          {filteredItems.map((item) => {
            const label = isTr ? item.labelTr : item.labelEn;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => {
                  playSound('lock_click');
                  onMobileClose?.();
                }}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 text-xs font-cinzel ${
                    isActive
                      ? 'text-amber-200 bg-amber-500/15 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'text-stone-300 hover:text-amber-200 hover:bg-white/5 border border-transparent hover:border-amber-900/30'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`transition-colors shrink-0 ${
                        isActive
                          ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                          : 'text-stone-400 group-hover:text-amber-300'
                      }`}
                    >
                      {item.icon}
                    </span>

                    <span className="font-semibold tracking-wider flex-1 truncate">
                      {label}
                    </span>

                    {/* Active pin */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-indicator"
                        className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                      />
                    )}

                    {/* GM tag */}
                    {item.gmOnly && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/50 font-cinzel font-bold shrink-0">
                        GM
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t border-amber-900/30 flex items-center gap-3 shrink-0 w-full bg-black/40">
          <div className="w-10 h-10 rounded-xl bg-[#141722] border border-amber-900/40 flex items-center justify-center overflow-hidden shadow-md shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <Shield size={18} className="text-amber-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-cinzel text-amber-200 font-bold truncate">
              {profile?.username ?? 'TRAVELER'}
            </p>
            <p className="text-[10px] text-stone-400 font-inter tracking-wide truncate">
              {isAdmin ? 'High Council Admin' : isGM ? 'Game Master' : 'Adventurer'}
            </p>
          </div>

          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onMobileClose}
              className="p-2 rounded-xl bg-amber-500/10 border border-amber-900/40 text-amber-400 hover:text-amber-200 transition-colors"
              title="High Council"
            >
              <Scale size={14} />
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
