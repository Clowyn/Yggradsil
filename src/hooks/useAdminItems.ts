import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ItemDefinition, ItemRarity, ItemType } from '../lib/types';

export function useAdminItems(initialPageSize = 20) {
  const { profile: currentAdmin } = useAuth();
  const [items, setItems] = useState<ItemDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<'all' | ItemRarity>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ItemType>('all');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('item_definitions').select('*', { count: 'exact' });

      if (search.trim()) {
        query = query.or(`name_en.ilike.%${search.trim()}%,name_tr.ilike.%${search.trim()}%`);
      }

      if (rarityFilter !== 'all') {
        query = query.eq('rarity', rarityFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error: fetchErr } = await query
        .order('name_en', { ascending: true })
        .range(from, to);

      if (fetchErr) throw fetchErr;

      setItems(data || []);
      setTotalCount(count ?? 0);
    } catch (err: any) {
      console.error('Error fetching admin items:', err);
      setError(err.message || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, rarityFilter, typeFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Create item definition
  const createItem = async (item: Omit<ItemDefinition, 'id'>) => {
    try {
      const { data: newItem, error: insErr } = await supabase
        .from('item_definitions')
        .insert(item)
        .select()
        .single();

      if (insErr) throw insErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'item.create',
          target_type: 'item_definition',
          target_id: newItem.id,
          details: { name_en: item.name_en, rarity: item.rarity, type: item.type },
        });
      }

      await fetchItems();
      return newItem;
    } catch (err: any) {
      console.error('Error creating item definition:', err);
      throw err;
    }
  };

  // Update item definition
  const updateItem = async (id: string, updates: Partial<Omit<ItemDefinition, 'id'>>) => {
    try {
      const target = items.find((i) => i.id === id);

      const { error: updErr } = await supabase
        .from('item_definitions')
        .update(updates)
        .eq('id', id);

      if (updErr) throw updErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'item.edit',
          target_type: 'item_definition',
          target_id: id,
          details: { name_en: target?.name_en, updates },
        });
      }

      await fetchItems();
    } catch (err: any) {
      console.error('Error updating item definition:', err);
      throw err;
    }
  };

  // Get delete impact
  const getItemDeleteImpact = async (itemId: string) => {
    try {
      const { count: instances } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .eq('item_definition_id', itemId);

      return [
        { label: 'Character Inventory Instances', count: instances || 0 },
      ];
    } catch (err) {
      console.error('Error calculating item delete impact:', err);
      return [];
    }
  };

  // Delete item definition
  const deleteItem = async (id: string) => {
    try {
      const target = items.find((i) => i.id === id);

      const { error: delErr } = await supabase
        .from('item_definitions')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'item.delete',
          target_type: 'item_definition',
          target_id: id,
          details: { name_en: target?.name_en },
        });
      }

      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error deleting item definition:', err);
      throw err;
    }
  };

  return {
    items,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    search,
    rarityFilter,
    typeFilter,
    setPage,
    setPageSize,
    setSearch: (s: string) => {
      setSearch(s);
      setPage(1);
    },
    setRarityFilter: (r: 'all' | ItemRarity) => {
      setRarityFilter(r);
      setPage(1);
    },
    setTypeFilter: (t: 'all' | ItemType) => {
      setTypeFilter(t);
      setPage(1);
    },
    createItem,
    updateItem,
    getItemDeleteImpact,
    deleteItem,
    refetch: fetchItems,
  };
}
