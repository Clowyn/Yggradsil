import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Compass,
  Package,
  FileText,
  ArrowLeft,
  ChevronLeft,
  Menu,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavGroup {
  title: string;
  items: {
    to: string;
    label: string;
    icon: React.ReactNode;
    end?: boolean;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'SYSTEM',
    items: [
      { to: '/admin', label: 'Overview', icon: <LayoutDashboard size={18} />, end: true },
      { to: '/admin/logs', label: 'Audit Logs', icon: <FileText size={18} /> },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { to: '/admin/users', label: 'Users & Profiles', icon: <Users size={18} /> },
      { to: '/admin/campaigns', label: 'Campaigns', icon: <Compass size={18} /> },
    ],
  },
  {
    title: 'GAME DATA',
    items: [
      { to: '/admin/characters', label: 'Characters', icon: <Shield size={18} /> },
      { to: '/admin/items', label: 'Item Catalog', icon: <Package size={18} /> },
    ],
  },
];

export function AdminSidebar({ isOpen, onToggle }: AdminSidebarProps) {
  const { profile } = useAuth();

  return (
    <aside
      className={`h-dvh-screen safe-bottom z-40 bg-[#0a0c12] text-stone-200 flex flex-col border-r border-amber-900/30 shrink-0 transition-all duration-300 fixed md:static inset-y-0 left-0 ${
        isOpen
          ? 'w-[260px] translate-x-0'
          : '-translate-x-full md:translate-x-0 md:w-[72px] md:items-center'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`px-4 py-4 border-b border-amber-900/30 flex items-center ${
          isOpen ? 'justify-between' : 'justify-center'
        } shrink-0 h-[64px] w-full`}
      >
        {isOpen && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="truncate">
              <h1 className="text-sm font-cinzel font-bold tracking-wide text-amber-100 uppercase">
                Domain Admin
              </h1>
              <p className="text-[10px] text-amber-300/70 font-cinzel uppercase tracking-wider">Omniscient Mode</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="text-stone-400 hover:text-amber-200 p-1.5 rounded-md hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Grouped Navigation */}
      <nav className={`flex-1 ${isOpen ? 'px-3' : 'px-2'} py-4 space-y-6 overflow-y-auto w-full no-scrollbar`}>
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            {isOpen && (
              <h2 className="px-3 text-[10px] font-bold font-mono tracking-wider text-neutral-400 uppercase">
                {group.title}
              </h2>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={!isOpen ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isOpen ? 'px-3' : 'justify-center px-0'
                    } ${
                      isActive
                        ? 'bg-red-500/15 text-red-300 border border-red-500/30 font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent'
                    }`
                  }
                >
                  <span className="shrink-0">{item.icon}</span>
                  {isOpen && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Return & User Info */}
      <div className={`p-3 border-t border-neutral-800/80 flex flex-col gap-2 shrink-0 w-full ${isOpen ? '' : 'items-center'}`}>
        <Link
          to="/"
          title={!isOpen ? 'Return to Game' : undefined}
          className={`flex items-center gap-2.5 py-2 px-3 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors w-full border border-neutral-800 ${
            isOpen ? 'justify-start' : 'justify-center px-0'
          }`}
        >
          <ArrowLeft size={16} className="text-neutral-400 shrink-0" />
          {isOpen && <span className="font-medium">Return to Game</span>}
        </Link>

        {/* Admin profile snippet */}
        <div className={`flex items-center gap-2.5 pt-2 border-t border-neutral-900 ${isOpen ? 'px-1' : 'justify-center'}`}>
          <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300 overflow-hidden shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              (profile?.username?.[0] ?? 'A').toUpperCase()
            )}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-200 truncate">{profile?.username}</p>
              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] bg-red-950/80 text-red-400 border border-red-500/20 font-mono">
                Admin
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
