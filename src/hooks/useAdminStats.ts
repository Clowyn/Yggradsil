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
      // 1. Fetch profiles count & roles
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('role');

      if (profilesErr) throw profilesErr;

      const totalUsers = profilesData?.length ?? 0;
      const roleBreakdown = { admin: 0, gm: 0, player: 0 };
      profilesData?.forEach((p) => {
        if (p.role === 'admin') roleBreakdown.admin++;
        else if (p.role === 'gm') roleBreakdown.gm++;
        else roleBreakdown.player++;
      });

      // 2. Fetch characters count
      const { count: totalCharacters, error: charErr } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true });
      if (charErr) throw charErr;

      // 3. Fetch campaigns count
      const { count: totalCampaigns, error: campErr } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });
      if (campErr) throw campErr;

      // 4. Fetch items count
      const { count: totalItems, error: itemErr } = await supabase
        .from('item_definitions')
        .select('*', { count: 'exact', head: true });
      if (itemErr) throw itemErr;

      // 5. Fetch spells count (if table exists)
      let totalSpells = 0;
      try {
        const { count: spellCount } = await supabase
          .from('spells')
          .select('*', { count: 'exact', head: true });
        totalSpells = spellCount ?? 0;
      } catch (err) {
        console.warn('Could not fetch spells count:', err);
      }

      setStats({
        totalUsers,
        roleBreakdown,
        totalCharacters: totalCharacters ?? 0,
        totalCampaigns: totalCampaigns ?? 0,
        totalItems: totalItems ?? 0,
        totalSpells,
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
    } catch (err: any) {
      console.error('Error fetching admin statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, recentLogs, loading, error, refetch: fetchStats };
}
