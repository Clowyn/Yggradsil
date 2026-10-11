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
  Terminal,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  to: string;
  code: string;
  label: string;
  icon: React.ReactNode;
  gmOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', code: 'SYS.01', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/character', code: 'BIO.02', label: 'Hero Matrix', icon: <User size={18} /> },
  { to: '/stat-tree', code: 'NEU.03', label: 'Neural Stats', icon: <TreePine size={18} /> },
  { to: '/spells', code: 'ARC.04', label: 'Spell Matrix', icon: <Sparkles size={18} /> },
  { to: '/map', code: 'ORB.05', label: 'Sector Radar', icon: <Map size={18} /> },
  { to: '/inventory', code: 'MAT.06', label: 'Quantum Cargo', icon: <Backpack size={18} /> },
  { to: '/gm', code: 'CMD.07', label: 'GM Overseer', icon: <Crown size={18} />, gmOnly: true },
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
      {/* Mobile Backdrop Overlay (Dark cyber blur) */}
      <div
        className={`fixed inset-0 bg-black/85 backdrop-blur-md z-40 md:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Sidebar container */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 md:z-40 h-screen glass flex flex-col border-r border-glass-border shrink-0 transition-all duration-300 ease-in-out w-[290px] max-w-[85vw] ${
          isMobileOpen ? 'translate-x-0 shadow-[0_0_60px_rgba(0,240,255,0.25)]' : '-translate-x-full md:translate-x-0'
        } ${isOpen ? 'md:w-[290px]' : 'md:w-[82px]'}`}
      >
        {/* Ambient vertical neon pulse guide */}
        <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-gold/50 via-arcane/30 to-gold/20 pointer-events-none" />

        {/* Logo & Toggle Header */}
        <div
          className={`px-5 py-4 border-b border-glass-border flex items-center ${
            isOpen ? 'justify-between' : 'justify-between md:justify-center'
          } shrink-0 h-[72px] w-full relative overflow-hidden bg-black/30`}
        >
          <div className={`min-w-0 shrink ${isOpen ? 'block' : 'block md:hidden'}`}>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-gold animate-pulse" />
              <h1 className="text-xl font-orbitron text-gold-gradient tracking-widest truncate font-extrabold">
                YGGDRASIL
              </h1>
            </div>
            <p className="text-[10px] text-parchment-dim font-mono tracking-widest truncate uppercase mt-0.5">
              // NEXUS COMMAND v4.2
            </p>
          </div>

          {/* Desktop collapse/expand toggle */}
          <button
            onClick={onToggle}
            className="hidden md:flex text-gold/80 hover:text-gold transition-colors p-2 rounded border border-gold/25 hover:border-gold hover:bg-gold/10 shrink-0 cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.15)]"
            title={isOpen ? 'Collapse console' : 'Expand console'}
            aria-label={isOpen ? 'Collapse console' : 'Expand console'}
          >
            {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="flex md:hidden text-gold/80 hover:text-gold transition-colors p-2 rounded border border-gold/25 hover:border-gold hover:bg-gold/10 shrink-0 cursor-pointer"
            title="Close menu"
            aria-label="Close navigation drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Rail */}
        <nav className={`flex-1 ${isOpen ? 'px-3' : 'px-3 md:px-2'} py-4 space-y-1.5 overflow-y-auto w-full no-scrollbar`}>
          <div className={`px-2 mb-2 ${isOpen ? 'block' : 'hidden md:hidden'}`}>
            <span className="text-[9px] font-mono text-parchment-dim/70 tracking-widest uppercase">
              // ACTIVE_PROTOCOLS
            </span>
          </div>

          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onMobileClose}
              title={!isOpen ? `${item.code} — ${item.label}` : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 py-2.5 rounded transition-all duration-200 font-mono text-xs ${
                  isOpen ? 'px-3.5' : 'px-3.5 md:justify-center md:px-0'
                } ${
                  isActive
                    ? 'text-white bg-gold/15 border border-gold/50 shadow-[0_0_18px_rgba(0,240,255,0.25)]'
                    : 'text-parchment/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon Housing */}
                  <span
                    className={`transition-all duration-200 shrink-0 ${
                      isActive
                        ? 'text-gold drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] scale-110'
                        : 'text-parchment-dim group-hover:text-gold/90'
                    }`}
                  >
                    {item.icon}
                  </span>

                  {/* Code & Label */}
                  <div className={`min-w-0 flex-1 truncate ${isOpen ? 'flex items-center justify-between' : 'hidden'}`}>
                    <span className="font-semibold tracking-wider font-rajdhani text-sm">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-parchment-dim font-mono tracking-tighter opacity-60 ml-2">
                      {item.code}
                    </span>
                  </div>

                  {/* Active Indicator Pin */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active-pin"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gold rounded-r shadow-[0_0_8px_#00f0ff]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}

                  {/* GM badge */}
                  {item.gmOnly && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded bg-crimson/25 text-crimson border border-crimson/40 font-mono font-bold shrink-0 shadow-[0_0_8px_rgba(255,0,85,0.3)] ${
                        isOpen ? 'inline' : 'inline md:hidden'
                      }`}
                    >
                      GM
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Biometric Telemetry & Profile Pod */}
        <div
          className={`p-3.5 border-t border-glass-border flex flex-col gap-3 justify-center ${
            isOpen ? '' : 'md:items-center'
          } shrink-0 w-full bg-black/40`}
        >
          {/* Neural Uplink Status */}
          <div className={`flex flex-col gap-1 w-full ${isOpen ? 'block' : 'hidden md:hidden'}`}>
            <div className="flex items-center justify-between text-[10px] font-mono text-parchment-dim">
              <span className="flex items-center gap-1">
                <Zap size={11} className="text-gold" />
                NEURAL SYNC
              </span>
              <span className="text-emerald font-bold">99.8%</span>
            </div>
            <div className="w-full h-1 bg-black/60 rounded-full overflow-hidden border border-gold/20">
              <div className="h-full bg-gradient-to-r from-gold to-emerald w-[99.8%] shadow-[0_0_6px_#00f0ff]" />
            </div>
          </div>

          {/* User Avatar & Telemetry */}
          <div className={`flex items-center gap-3 w-full ${isOpen ? '' : 'md:justify-center'}`}>
            {/* Holographic Avatar Frame */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded bg-obsidian border border-gold/50 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield size={16} className="text-gold" />
                )}
              </div>
              {/* Online Pulse Beacon */}
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald rounded-full border border-abyss shadow-[0_0_6px_#00ff9d]" />
            </div>

            <div className={`flex-1 min-w-0 ${isOpen ? 'block' : 'block md:hidden'}`}>
              <p className="text-xs font-orbitron text-parchment font-bold truncate">
                {profile?.username ?? 'AGENT'}
              </p>
              <p className="text-[10px] text-gold/80 font-mono tracking-wide truncate">
                {isAdmin ? 'SEC: ADMIN' : isGM ? 'AUTH: GM_OVERSEER' : 'OPERATOR: AGENT'}
              </p>
            </div>
          </div>

          {/* System Override / Admin Button */}
          {isAdmin && (
            <NavLink
              to="/admin"
              title={!isOpen ? 'Root Console' : undefined}
              onClick={onMobileClose}
              className={`flex items-center gap-2 py-2 rounded bg-black/60 hover:bg-gold/10 border border-gold/30 hover:border-gold text-gold/80 hover:text-gold transition-all text-xs font-mono font-medium shadow-[0_0_10px_rgba(0,240,255,0.1)] ${
                isOpen ? 'px-3 justify-start' : 'px-3 justify-start md:justify-center md:p-2'
              }`}
            >
              <Terminal size={14} className="shrink-0" />
              <span className={isOpen ? 'inline' : 'inline md:hidden'}>ROOT CONSOLE</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
