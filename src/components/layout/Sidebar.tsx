import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  User,
  TreePine,
  Map,
  Backpack,
  Shield,
  Crown,
  ChevronLeft,
  Menu,
  X,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  gmOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { to: '/character', label: 'Character', icon: <User size={20} /> },
  { to: '/stat-tree', label: 'Stat Tree', icon: <TreePine size={20} /> },
  { to: '/spells', label: 'Spell Tree', icon: <Sparkles size={20} /> },
  { to: '/map', label: 'Map', icon: <Map size={20} /> },
  { to: '/inventory', label: 'Inventory', icon: <Backpack size={20} /> },
  { to: '/gm', label: 'GM Dashboard', icon: <Crown size={20} />, gmOnly: true },
];

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isOpen, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const { profile, isGM, isAdmin } = useAuth();
  const location = useLocation();
  const filteredItems = NAV_ITEMS.filter((item) => !item.gmOnly || isGM);

  // Auto-close mobile drawer on route navigation
  const prevPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      prevPathnameRef.current = location.pathname;
      onMobileClose?.();
    }
  }, [location.pathname, onMobileClose]);

  return (
    <>
      {/* Mobile Backdrop Overlay (Dark glass blur) */}
      <div
        className={`fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Sidebar container: Off-canvas drawer on mobile (<768px), static in flow on desktop (>=768px) */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-40 h-screen glass flex flex-col border-r border-glass-border shrink-0 transition-all duration-300 ease-in-out w-[280px] max-w-[85vw] ${
          isMobileOpen ? 'translate-x-0 shadow-[0_0_50px_rgba(0,0,0,0.9)]' : '-translate-x-full md:translate-x-0'
        } ${isOpen ? 'md:w-[280px]' : 'md:w-[80px]'}`}
      >
        {/* Logo & Toggle */}
        <div className={`px-5 sm:px-6 py-5 border-b border-glass-border flex items-center ${isOpen ? 'justify-between' : 'justify-between md:justify-center'} shrink-0 h-[80px] w-full`}>
          <div className={`min-w-0 shrink ${isOpen ? 'block' : 'block md:hidden'}`}>
            <h1 className="text-2xl font-cinzel text-gold-gradient tracking-wider truncate">
              Yggdrasil
            </h1>
            <p className="text-xs text-parchment-dim mt-1 font-inter tracking-wide truncate">
              D&D Companion
            </p>
          </div>

          {/* Desktop collapse/expand toggle */}
          <button 
            onClick={onToggle} 
            className="hidden md:flex text-gold/70 hover:text-gold transition-colors p-1.5 rounded-lg hover:bg-white/5 shrink-0"
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft size={22} /> : <Menu size={22} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="flex md:hidden text-gold/70 hover:text-gold transition-colors p-1.5 rounded-lg hover:bg-white/5 shrink-0"
            title="Close menu"
            aria-label="Close navigation drawer"
          >
            <X size={22} />
          </button>
        </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isOpen ? 'px-3' : 'px-3 md:px-2'} py-4 space-y-2 overflow-y-auto w-full no-scrollbar`}>
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onMobileClose}
            title={!isOpen ? item.label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 py-3 rounded-lg transition-all duration-300 font-inter text-sm ${
                isOpen ? 'px-4' : 'px-4 md:justify-center md:px-0'
              } ${
                isActive
                  ? 'text-gold bg-gold/10 border-l-2 border-gold shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                  : 'text-parchment/70 hover:text-parchment hover:bg-white/5 border-l-2 border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'text-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]'
                      : 'text-parchment-dim group-hover:text-parchment'
                  }`}
                >
                  {item.icon}
                </span>
                
                <span className={`font-medium truncate ${isOpen ? 'inline' : 'inline md:hidden'}`}>
                  {item.label}
                </span>

                {/* Active glow indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-gold/5 -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* GM badge */}
                {item.gmOnly && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded bg-crimson/20 text-crimson border border-crimson/30 font-semibold shrink-0 ${isOpen ? 'inline' : 'inline md:hidden'}`}>
                    GM
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Decorative separator */}
      <div className="px-6 shrink-0 w-full">
        <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>

      {/* User info & Admin access */}
      <div className={`p-4 border-t border-glass-border flex flex-col gap-3 justify-center ${isOpen ? '' : 'md:items-center'} shrink-0 w-full`}>
        <div className={`flex items-center gap-3 w-full ${isOpen ? '' : 'md:justify-center'}`}>
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-shadow to-obsidian border-2 border-gold/40 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Shield size={18} className="text-gold/70" />
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald rounded-full border-2 border-abyss" />
          </div>

          <div className={`flex-1 min-w-0 ${isOpen ? 'block' : 'block md:hidden'}`}>
            <p className="text-sm font-cinzel text-parchment truncate">
              {profile?.username ?? 'Adventurer'}
            </p>
            <p className="text-[11px] text-parchment-dim font-inter truncate">
              {isAdmin ? '🛡️ Domain Admin' : isGM ? '⚜️ Game Master' : '⚔️ Player'}
            </p>
          </div>
        </div>

        {/* Admin Panel Entry Button */}
        {isAdmin && (
          <NavLink
            to="/admin"
            title={!isOpen ? 'Admin Panel' : undefined}
            onClick={onMobileClose}
            className={`flex items-center gap-2 py-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 text-neutral-300 hover:text-white transition-all text-xs font-inter font-medium ${
              isOpen ? 'px-3 justify-start' : 'px-3 justify-start md:justify-center md:p-2'
            }`}
          >
            <Settings size={15} className="text-neutral-400 shrink-0" />
            <span className={isOpen ? 'inline' : 'inline md:hidden'}>Admin Panel</span>
          </NavLink>
        )}
      </div>
    </aside>
  </>
  );
}
