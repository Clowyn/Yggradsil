import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Sparkles
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

export function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const { profile, isGM } = useAuth();
  const filteredItems = NAV_ITEMS.filter((item) => !item.gmOnly || isGM);

  return (
    <motion.aside
      className={`h-screen z-40 glass flex flex-col border-r border-glass-border shrink-0 transition-all duration-300 ${isOpen ? 'w-[280px]' : 'w-[80px] items-center'}`}
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 30 }}
    >
      {/* Logo & Toggle */}
      <div className={`px-6 py-5 border-b border-glass-border flex items-center ${isOpen ? 'justify-between' : 'justify-center'} shrink-0 h-[80px] w-full`}>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 shrink">
            <h1 className="text-2xl font-cinzel text-gold-gradient tracking-wider truncate">
              Yggdrasil
            </h1>
            <p className="text-xs text-parchment-dim mt-1 font-inter tracking-wide truncate">
              D&D Companion
            </p>
          </motion.div>
        )}
        <button 
          onClick={onToggle} 
          className="text-gold/70 hover:text-gold transition-colors p-1.5 rounded-lg hover:bg-white/5 shrink-0"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isOpen ? 'px-3' : 'px-2'} py-4 space-y-2 overflow-y-auto w-full no-scrollbar`}>
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={!isOpen ? item.label : undefined}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 py-3 rounded-lg transition-all duration-300 font-inter text-sm ${
                isOpen ? 'px-4' : 'justify-center px-0'
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
                
                {isOpen && (
                  <span className="font-medium truncate">{item.label}</span>
                )}

                {/* Active glow indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-gold/5 -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* GM badge */}
                {isOpen && item.gmOnly && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-crimson/20 text-crimson border border-crimson/30 font-semibold shrink-0">
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

      {/* User info */}
      <div className={`p-4 border-t border-glass-border flex flex-col justify-center ${isOpen ? '' : 'items-center'} shrink-0 min-h-[80px] w-full`}>
        <div className={`flex items-center gap-3 w-full ${isOpen ? '' : 'justify-center'}`}>
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

          {isOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
              <p className="text-sm font-cinzel text-parchment truncate">
                {profile?.username ?? 'Adventurer'}
              </p>
              <p className="text-[11px] text-parchment-dim font-inter truncate">
                {isGM ? '⚜️ Game Master' : '⚔️ Player'}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
