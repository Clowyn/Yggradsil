import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Compass,
  Package,
  Sparkles,
  FileText,
  ArrowUpRight,
  RefreshCw,
  Clock,
  UserCheck,
  Crown,
  Sword,
} from 'lucide-react';
import { useAdminStats } from '../../hooks/useAdminStats';

export function AdminDashboardPage() {
  const { stats, recentLogs, loading, refetch } = useAdminStats();

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-100 tracking-tight">System Overview</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Global metrics, server statistics, and audit activity across the Yggdrasil platform.
          </p>
        </div>

        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-neutral-400 uppercase">
              Total Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users size={16} />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-100 font-mono">
              {stats.totalUsers}
            </span>
            <span className="text-xs text-neutral-400">registered</span>
          </div>

          <div className="flex items-center gap-1.5 pt-2 border-t border-neutral-800/60 text-[11px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/20">
              {stats.roleBreakdown.admin} Admin
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/20">
              {stats.roleBreakdown.gm} GM
            </span>
            <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
              {stats.roleBreakdown.player} Players
            </span>
          </div>
        </div>

        {/* Total Characters */}
        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-neutral-400 uppercase">
              Characters
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Shield size={16} />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-100 font-mono">
              {stats.totalCharacters}
            </span>
            <span className="text-xs text-neutral-400">active heroes</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
            <span>Across all campaigns</span>
            <Link to="/admin/characters" className="text-emerald-400 hover:underline flex items-center gap-0.5 text-[11px]">
              Manage <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Total Campaigns */}
        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-neutral-400 uppercase">
              Campaigns
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-950/60 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Compass size={16} />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-100 font-mono">
              {stats.totalCampaigns}
            </span>
            <span className="text-xs text-neutral-400">active realms</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
            <span>GM hosted sessions</span>
            <Link to="/admin/campaigns" className="text-purple-400 hover:underline flex items-center gap-0.5 text-[11px]">
              Manage <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Item Catalog & Spells */}
        <div className="bg-neutral-900/80 border border-neutral-800/90 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-neutral-400 uppercase">
              Game Assets
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Package size={16} />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-100 font-mono">
              {stats.totalItems}
            </span>
            <span className="text-xs text-neutral-400">items</span>
            <span className="text-neutral-400">/</span>
            <span className="text-lg font-bold text-neutral-200 font-mono">
              {stats.totalSpells}
            </span>
            <span className="text-xs text-neutral-400">spells</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 text-xs text-neutral-400">
            <span>Master database catalog</span>
            <Link to="/admin/items" className="text-amber-400 hover:underline flex items-center gap-0.5 text-[11px]">
              Catalog <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/users"
          className="group p-4 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-red-300 transition-colors">
              User Management
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Inspect user accounts, promote GMs, or execute cascade account deletions.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/characters"
          className="group p-4 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Sword size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-emerald-300 transition-colors">
              Character Control
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Adjust character levels, fix corrupted stats, or transfer hero ownership.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/campaigns"
          className="group p-4 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all flex items-start gap-3.5"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
            <Crown size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 group-hover:text-purple-300 transition-colors">
              Campaign & Realms
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Create campaigns, assign GMs, and manage party memberships.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Recent Admin Activity</h2>
          </div>
          <Link
            to="/admin/logs"
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 font-mono"
          >
            <span>View All Logs</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400 font-mono">
            No admin activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/60">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0 font-mono text-[10px]">
                    <Sparkles size={13} className="text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-neutral-200 truncate">
                      <span className="font-semibold text-white">{log.admin?.username || 'Admin'}</span>{' '}
                      performed <span className="font-mono text-red-300 font-medium">{log.action}</span>{' '}
                      on {log.target_type}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-mono truncate">
                      {JSON.stringify(log.details || {})}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-mono shrink-0">
                  <Clock size={12} />
                  <span>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
