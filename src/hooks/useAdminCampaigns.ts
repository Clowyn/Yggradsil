import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Campaign, CampaignMember, Profile } from '../lib/types';

export interface AdminCampaignRecord extends Campaign {
  gm?: Profile;
  membersCount?: number;
  charactersCount?: number;
}

export function useAdminCampaigns(initialPageSize = 20) {
  const { profile: currentAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState<AdminCampaignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('campaigns').select(
        `
        *,
        gm:profiles!campaigns_gm_id_fkey(id, username, avatar_url, role)
      `,
        { count: 'exact' }
      );

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error: fetchErr } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
        const campIds = data.map((c) => c.id);

        // Fetch counts
        const { data: memberRows } = await supabase
          .from('campaign_members')
          .select('campaign_id')
          .in('campaign_id', campIds);

        const { data: charRows } = await supabase
          .from('characters')
          .select('campaign_id')
          .in('campaign_id', campIds);

        const memberCountMap: Record<string, number> = {};
        memberRows?.forEach((m) => {
          memberCountMap[m.campaign_id] = (memberCountMap[m.campaign_id] || 0) + 1;
        });

        const charCountMap: Record<string, number> = {};
        charRows?.forEach((c) => {
          charCountMap[c.campaign_id] = (charCountMap[c.campaign_id] || 0) + 1;
        });

        const enriched: AdminCampaignRecord[] = data.map((c) => ({
          ...c,
          membersCount: memberCountMap[c.id] || 0,
          charactersCount: charCountMap[c.id] || 0,
        }));

        setCampaigns(enriched);
      } else {
        setCampaigns([]);
      }

      setTotalCount(count ?? 0);
    } catch (err: any) {
      console.error('Error fetching admin campaigns:', err);
      setError(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Create campaign
  const createCampaign = async (name: string, gmId: string, fogRadius = 80) => {
    try {
      const { data: newCamp, error: campErr } = await supabase
        .from('campaigns')
        .insert({
          name,
          gm_id: gmId,
          settings: { fog_radius: fogRadius },
        })
        .select()
        .single();

      if (campErr) throw campErr;

      // Add GM as campaign member
      await supabase.from('campaign_members').insert({
        campaign_id: newCamp.id,
        profile_id: gmId,
        role: 'gm',
      });

      // Initialize map state
      await supabase.from('map_state').insert({
        campaign_id: newCamp.id,
        fog_radius: fogRadius,
        map_image_url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
        map_width: 1200,
        map_height: 800,
        revealed_areas: [],
      });

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'campaign.create',
          target_type: 'campaign',
          target_id: newCamp.id,
          details: { name, gm_id: gmId },
        });
      }

      await fetchCampaigns();
      return newCamp;
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  };

  // Update campaign
  const updateCampaign = async (
    campId: string,
    updates: Partial<{ name: string; gm_id: string; settings: { fog_radius: number } }>
  ) => {
    try {
      const target = campaigns.find((c) => c.id === campId);

      const { error: updateErr } = await supabase
        .from('campaigns')
        .update(updates)
        .eq('id', campId);

      if (updateErr) throw updateErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'campaign.edit',
          target_type: 'campaign',
          target_id: campId,
          details: {
            old_name: target?.name,
            updates,
          },
        });
      }

      await fetchCampaigns();
    } catch (err: any) {
      console.error('Error updating campaign:', err);
      throw err;
    }
  };

  // Delete impact
  const getCampaignDeleteImpact = async (campId: string) => {
    try {
      const { count: memberCount } = await supabase
        .from('campaign_members')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campId);

      const { count: charCount } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campId);

      const { count: tokenCount } = await supabase
        .from('map_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campId);

      return [
        { label: 'Campaign Memberships', count: memberCount || 0 },
        { label: 'Characters in Campaign', count: charCount || 0 },
        { label: 'Map Tokens', count: tokenCount || 0 },
        { label: 'Map State Configuration', count: 1 },
      ];
    } catch (err) {
      console.error('Error calculating campaign delete impact:', err);
      return [];
    }
  };

  // Delete campaign
  const deleteCampaign = async (campId: string) => {
    try {
      const target = campaigns.find((c) => c.id === campId);

      const { error: delErr } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campId);

      if (delErr) throw delErr;

      if (currentAdmin) {
        await supabase.from('admin_logs').insert({
          admin_id: currentAdmin.id,
          action: 'campaign.delete',
          target_type: 'campaign',
          target_id: campId,
          details: { name: target?.name },
        });
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== campId));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error deleting campaign:', err);
      throw err;
    }
  };

  // Fetch campaign members
  const getCampaignMembers = async (campId: string): Promise<CampaignMember[]> => {
    const { data, error: memErr } = await supabase
      .from('campaign_members')
      .select('*, profile:profiles(id, username, avatar_url, role)')
      .eq('campaign_id', campId);

    if (memErr) throw memErr;
    return (data as unknown as CampaignMember[]) || [];
  };

  // Add member
  const addMember = async (campId: string, profileId: string, role: 'gm' | 'player') => {
    const { error: addErr } = await supabase.from('campaign_members').insert({
      campaign_id: campId,
      profile_id: profileId,
      role,
    });
    if (addErr) throw addErr;

    if (currentAdmin) {
      await supabase.from('admin_logs').insert({
        admin_id: currentAdmin.id,
        action: 'campaign.member_add',
        target_type: 'campaign',
        target_id: campId,
        details: { profile_id: profileId, role },
      });
    }
  };

  // Remove member
  const removeMember = async (memberId: string, campId: string) => {
    const { error: remErr } = await supabase
      .from('campaign_members')
      .delete()
      .eq('id', memberId);

    if (remErr) throw remErr;

    if (currentAdmin) {
      await supabase.from('admin_logs').insert({
        admin_id: currentAdmin.id,
        action: 'campaign.member_remove',
        target_type: 'campaign',
        target_id: campId,
        details: { member_id: memberId },
      });
    }
  };

  // Update member role
  const updateMemberRole = async (memberId: string, newRole: 'gm' | 'player', campId: string) => {
    const { error: roleErr } = await supabase
      .from('campaign_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (roleErr) throw roleErr;

    if (currentAdmin) {
      await supabase.from('admin_logs').insert({
        admin_id: currentAdmin.id,
        action: 'campaign.member_role_update',
        target_type: 'campaign',
        target_id: campId,
        details: { member_id: memberId, new_role: newRole },
      });
    }
  };

  // Transfer character across campaigns
  const transferCharacterToCampaign = async (charId: string, targetCampaignId: string) => {
    const { error: transErr } = await supabase
      .from('characters')
      .update({ campaign_id: targetCampaignId, updated_at: new Date().toISOString() })
      .eq('id', charId);

    if (transErr) throw transErr;

    if (currentAdmin) {
      await supabase.from('admin_logs').insert({
        admin_id: currentAdmin.id,
        action: 'character.campaign_transfer',
        target_type: 'character',
        target_id: charId,
        details: { target_campaign_id: targetCampaignId },
      });
    }
  };

  return {
    campaigns,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
    search,
    setPage,
    setPageSize,
    setSearch: (s: string) => {
      setSearch(s);
      setPage(1);
    },
    createCampaign,
    updateCampaign,
    getCampaignDeleteImpact,
    deleteCampaign,
    getCampaignMembers,
    addMember,
    removeMember,
    updateMemberRole,
    transferCharacterToCampaign,
    refetch: fetchCampaigns,
  };
}
