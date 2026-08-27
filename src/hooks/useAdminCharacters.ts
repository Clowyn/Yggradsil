import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Character } from '../lib/types';

export function useAdminCharacters(initialPageSize = 20) {
  const { profile: currentAdmin } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [profileFilter, setProfileFilter] = useState<string>('all');

  const fetchCharacters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('characters').select(
        `
        *,
        profile:profiles(id, username, avatar_url),
        campaign:campaigns(id, name),
        race:race_definitions(id, name, key),
        subclass:subclass_definitions(id, name_en, name_tr, key)
      `,
        { count: 'exact' }
      );

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      if (campaignFilter !== 'all') {
        query = query.eq('campaign_id', campaignFilter);
      }

      if (profileFilter !== 'all') {
        query = query.eq('profile_id', profileFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error: fetchErr } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchErr) throw fetchErr;

      setCharacters((data as unknown as Character[]) || []);
      setTotalCount(count ?? 0);
    } catch (err: any) {
      console.error('Error fetching admin characters:', err);
      setError(err.message || 'Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, campaignFilter, profileFilter]);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Update character
  const updateCharacter = async (
    charId: string,
    updates: Partial<{
      name: string;
      level: number;
      xp_total: number;
      xp_available: number;
      race_id: string;
      subclass_id: string;
    }>
  ) => {
    try {
      const target = characters.find((c) => c.id === charId);

      const { error: updateErr } = await supabase
        .from('characters')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', charId);

      if (updateErr) throw updateErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'character.edit',
          target_type: 'character',
          target_id: charId,
          details: {
            character_name: target?.name,
            updates,
          },
        });
      }

      await fetchCharacters();
    } catch (err: any) {
      console.error('Error updating character:', err);
      throw err;
    }
  };

  // Transfer character to another profile
  const transferCharacter = async (charId: string, newProfileId: string) => {
    try {
      const target = characters.find((c) => c.id === charId);

      const { error: transferErr } = await supabase
        .from('characters')
        .update({
          profile_id: newProfileId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', charId);

      if (transferErr) throw transferErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'character.transfer',
          target_type: 'character',
          target_id: charId,
          details: {
            character_name: target?.name,
            old_profile_id: target?.profile_id,
            new_profile_id: newProfileId,
          },
        });
      }

      await fetchCharacters();
    } catch (err: any) {
      console.error('Error transferring character:', err);
      throw err;
    }
  };

  // Get delete impact for character
  const getCharacterDeleteImpact = async (charId: string) => {
    try {
      const { count: items } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', charId);

      const { count: skills } = await supabase
        .from('character_skills')
        .select('*', { count: 'exact', head: true })
        .eq('character_id', charId);

      let spellCount = 0;
      try {
        const { count: spells } = await supabase
          .from('character_spells')
          .select('*', { count: 'exact', head: true })
          .eq('character_id', charId);
        spellCount = spells || 0;
      } catch {
        // ignore
      }

      return [
        { label: 'Character Stats Rows', count: 6 },
        { label: 'Inventory Items', count: items || 0 },
        { label: 'Unlocked Skills', count: skills || 0 },
        { label: 'Learned Spells', count: spellCount },
      ];
    } catch (err) {
      console.error('Error calculating character delete impact:', err);
      return [];
    }
  };

  // Delete single character
  const deleteCharacter = async (charId: string) => {
    try {
      const target = characters.find((c) => c.id === charId);

      const { error: delErr } = await supabase
        .from('characters')
        .delete()
        .eq('id', charId);

      if (delErr) throw delErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'character.delete',
          target_type: 'character',
          target_id: charId,
          details: {
            character_name: target?.name,
            level: target?.level,
            owner_id: target?.profile_id,
          },
        });
      }

      setCharacters((prev) => prev.filter((c) => c.id !== charId));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error deleting character:', err);
      throw err;
    }
  };

  // Bulk delete characters
  const bulkDeleteCharacters = async (charIds: string[]) => {
    try {
      const { error: delErr } = await supabase
        .from('characters')
        .delete()
        .in('id', charIds);

      if (delErr) throw delErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'character.bulk_delete',
          target_type: 'character',
          target_id: null,
          details: {
            count: charIds.length,
            ids: charIds,
          },
        });
      }

      await fetchCharacters();
    } catch (err: any) {
      console.error('Error bulk deleting characters:', err);
      throw err;
    }
  };

  // Bulk level update
  const bulkUpdateLevel = async (charIds: string[], levelDelta: number) => {
    try {
      for (const id of charIds) {
        const char = characters.find((c) => c.id === id);
        if (char) {
          const newLevel = Math.max(1, Math.min(20, char.level + levelDelta));
          await supabase
            .from('characters')
            .update({ level: newLevel, updated_at: new Date().toISOString() })
            .eq('id', id);
        }
      }

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'character.bulk_level_update',
          target_type: 'character',
          target_id: null,
          details: {
            count: charIds.length,
            levelDelta,
          },
        });
      }

      await fetchCharacters();
    } catch (err: any) {
      console.error('Error updating bulk levels:', err);
      throw err;
    }
  };

  return {
    characters,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    search,
    campaignFilter,
    profileFilter,
    setPage,
    setPageSize,
    setSearch: (s: string) => {
      setSearch(s);
      setPage(1);
    },
    setCampaignFilter: (c: string) => {
      setCampaignFilter(c);
      setPage(1);
    },
    setProfileFilter: (p: string) => {
      setProfileFilter(p);
      setPage(1);
    },
    updateCharacter,
    transferCharacter,
    getCharacterDeleteImpact,
    deleteCharacter,
    bulkDeleteCharacters,
    bulkUpdateLevel,
    refetch: fetchCharacters,
  };
}
