import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminStats, AdminLog } from '../lib/types';

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    roleBreakdown: { admin: 0, gm: 0, player: 0 },
    totalCharacters: 0,
    totalCampaigns: 0,
    totalItems: 0,
    totalSpells: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch role breakdown via server-side RPC or parallel HEAD count queries (no full-table row transfer)
      const roleBreakdown = { admin: 0, gm: 0, player: 0 };
      let totalUsers = 0;

      const { data: rpcRoleData, error: rpcRoleErr } = await supabase.rpc(
        'get_admin_role_counts'
      );

      if (!rpcRoleErr && rpcRoleData && typeof rpcRoleData === 'object') {
        if (Array.isArray(rpcRoleData)) {
          rpcRoleData.forEach((row: { role?: string; total?: number }) => {
            if (row.role === 'admin') roleBreakdown.admin = Number(row.total) || 0;
            if (row.role === 'gm') roleBreakdown.gm = Number(row.total) || 0;
            if (row.role === 'player') roleBreakdown.player = Number(row.total) || 0;
          });
          totalUsers = roleBreakdown.admin + roleBreakdown.gm + roleBreakdown.player;
        } else {
          const typed = rpcRoleData as Record<string, number>;
          roleBreakdown.admin = Number(typed.admin) || 0;
          roleBreakdown.gm = Number(typed.gm) || 0;
          roleBreakdown.player = Number(typed.player) || 0;
          totalUsers =
            Number(typed.total) ||
            roleBreakdown.admin + roleBreakdown.gm + roleBreakdown.player;
        }
      } else {
        const [adminRes, gmRes, playerRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'admin'),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'gm'),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'player'),
        ]);

        if (adminRes.error) throw adminRes.error;
        roleBreakdown.admin = adminRes.count ?? 0;
        roleBreakdown.gm = gmRes.count ?? 0;
        roleBreakdown.player = playerRes.count ?? 0;
        totalUsers = roleBreakdown.admin + roleBreakdown.gm + roleBreakdown.player;
      }

      // 2. Fetch characters, campaigns, items, and spells counts in parallel
      const [charRes, campRes, itemRes, spellRes] = await Promise.all([
        supabase.from('characters').select('*', { count: 'exact', head: true }),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('item_definitions').select('*', { count: 'exact', head: true }),
        supabase
          .from('spells')
          .select('*', { count: 'exact', head: true })
          .then(
            (r) => r,
            () => ({ count: 0, error: null })
          ),
      ]);

      if (charRes.error) throw charRes.error;
      if (campRes.error) throw campRes.error;
      if (itemRes.error) throw itemRes.error;

      setStats({
        totalUsers,
        roleBreakdown,
        totalCharacters: charRes.count ?? 0,
        totalCampaigns: campRes.count ?? 0,
        totalItems: itemRes.count ?? 0,
        totalSpells: spellRes.count ?? 0,
      });

      // 6. Fetch recent 10 admin logs
      try {
        const { data: logsData } = await supabase
          .from('admin_logs')
          .select('*, admin:profiles!admin_logs_admin_id_fkey(username, avatar_url, role)')
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsData) {
          setRecentLogs(logsData as unknown as AdminLog[]);
        }
      } catch (logErr) {
        console.warn('Could not fetch recent admin logs:', logErr);
      }
    } catch (err: unknown) {
      console.error('Error fetching admin statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    queueMicrotask(() => {
      if (!ignore) {
        fetchStats();
      }
    });
    return () => {
      ignore = true;
    };
  }, [fetchStats]);

  return { stats, recentLogs, loading, error, refetch: fetchStats };
}
