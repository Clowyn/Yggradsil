import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminLog } from '../lib/types';

export function useAdminLogs(initialPageSize = 25) {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('admin_logs').select(
        `
        *,
        admin:profiles!admin_logs_admin_id_fkey(id, username, avatar_url, role)
      `,
        { count: 'exact' }
      );

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (targetTypeFilter !== 'all') {
        query = query.eq('target_type', targetTypeFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error: fetchErr } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchErr) throw fetchErr;

      setLogs((data as unknown as AdminLog[]) || []);
      setTotalCount(count ?? 0);
    } catch (err: any) {
      console.error('Error fetching admin logs:', err);
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, targetTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    actionFilter,
    targetTypeFilter,
    setPage,
    setPageSize,
    setActionFilter: (a: string) => {
      setActionFilter(a);
      setPage(1);
    },
    setTargetTypeFilter: (t: string) => {
      setTargetTypeFilter(t);
      setPage(1);
    },
    refetch: fetchLogs,
  };
}
