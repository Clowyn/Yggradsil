import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, UserRole } from '../lib/types';

export interface AdminUserRecord extends Profile {
  charactersCount?: number;
  campaignsCount?: number;
}

export function useAdminUsers(initialPageSize = 20) {
  const { profile: currentAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      if (search.trim()) {
        query = query.ilike('username', `%${search.trim()}%`);
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error: fetchErr } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchErr) throw fetchErr;

      setTotalCount(count ?? 0);

      // Fetch character counts for retrieved users
      if (data && data.length > 0) {
        const userIds = data.map((u) => u.id);
        const { data: charCounts } = await supabase
          .from('characters')
          .select('profile_id');

        const countsMap: Record<string, number> = {};
        charCounts?.forEach((c) => {
          countsMap[c.profile_id] = (countsMap[c.profile_id] || 0) + 1;
        });

        const usersWithCounts: AdminUserRecord[] = data.map((u) => ({
          ...u,
          charactersCount: countsMap[u.id] || 0,
        }));

        setUsers(usersWithCounts);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Update role
  const updateUserRole = async (userId: string, newRole: 'gm' | 'player') => {
    try {
      const target = users.find((u) => u.id === userId);
      const oldRole = target?.role;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (updateErr) throw updateErr;

      // Log action
      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'user.role_change',
          target_type: 'profile',
          target_id: userId,
          details: {
            username: target?.username,
            old_role: oldRole,
            new_role: newRole,
          },
        });
      }

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      console.error('Error updating user role:', err);
      throw err;
    }
  };

  // Get delete impact stats for confirmation modal
  const getUserDeleteImpact = async (userId: string) => {
    try {
      const { data: chars } = await supabase
        .from('characters')
        .select('id')
        .eq('profile_id', userId);

      const charCount = chars?.length || 0;
      const charIds = chars?.map((c) => c.id) || [];

      let itemCount = 0;
      let skillCount = 0;
      let spellCount = 0;

      if (charIds.length > 0) {
        const { count: items } = await supabase
          .from('inventory_items')
          .select('*', { count: 'exact', head: true })
          .in('character_id', charIds);
        itemCount = items || 0;

        const { count: skills } = await supabase
          .from('character_skills')
          .select('*', { count: 'exact', head: true })
          .in('character_id', charIds);
        skillCount = skills || 0;

        try {
          const { count: spells } = await supabase
            .from('character_spells')
            .select('*', { count: 'exact', head: true })
            .in('character_id', charIds);
          spellCount = spells || 0;
        } catch {
          // ignore if table doesn't exist
        }
      }

      const { count: campaignMemberships } = await supabase
        .from('campaign_members')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', userId);

      return [
        { label: 'Characters', count: charCount },
        { label: 'Inventory Items', count: itemCount },
        { label: 'Unlocked Skills', count: skillCount },
        { label: 'Learned Spells', count: spellCount },
        { label: 'Campaign Memberships', count: campaignMemberships || 0 },
      ];
    } catch (err) {
      console.error('Error calculating delete impact:', err);
      return [];
    }
  };

  // Delete user (Edge Function with fallback)
  const deleteUser = async (userId: string) => {
    try {
      const target = users.find((u) => u.id === userId);

      // 1. Try Supabase Edge Function first
      let edgeFunctionSucceeded = false;
      try {
        const { data, error: fnError } = await supabase.functions.invoke('admin-delete-user', {
          body: { userId },
        });
        if (!fnError && data?.success) {
          edgeFunctionSucceeded = true;
        }
      } catch (fnErr) {
        console.warn('Edge Function admin-delete-user unavailable, falling back to direct delete:', fnErr);
      }

      // 2. Direct cascade delete if Edge Function not deployed
      if (!edgeFunctionSucceeded) {
        const { error: delErr } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);

        if (delErr) throw delErr;

        if (currentAdmin) {
          await supabase.from('admin_logs').insert({
            admin_id: currentAdmin.id,
            action: 'user.delete',
            target_type: 'profile',
            target_id: userId,
            details: {
              username: target?.username,
              role: target?.role,
              method: 'direct_cascade',
            },
          });
        }
      }

      // Update state
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    search,
    roleFilter,
    setPage,
    setPageSize,
    setSearch: (s: string) => {
      setSearch(s);
      setPage(1);
    },
    setRoleFilter: (r: 'all' | UserRole) => {
      setRoleFilter(r);
      setPage(1);
    },
    updateUserRole,
    getUserDeleteImpact,
    deleteUser,
    refetch: fetchUsers,
  };
}
