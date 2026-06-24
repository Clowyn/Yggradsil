import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Campaign, CampaignMember, Character } from '../lib/types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface CampaignState {
  campaign: Campaign | null;
  members: CampaignMember[];
  characters: Character[];
  activeCharacterId: string | null;
  setActiveCharacterId: (id: string | null) => void;
  loading: boolean;
  createCampaign: (name: string) => Promise<void>;
  joinCampaign: (campaignId: string) => Promise<void>;
}

const CampaignContext = createContext<CampaignState | null>(null);

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) throw new Error('useCampaign must be used within CampaignProvider');
  return ctx;
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load campaign for user
  useEffect(() => {
    if (!user || !profile) {
      setCampaign(null);
      setMembers([]);
      setCharacters([]);
      setActiveCharacterId(null);
      setLoading(false);
      return;
    }

    const loadCampaignData = async () => {
      setLoading(true);
      try {
        // 1. Find campaign membership for user
        const { data: membershipData, error: memError } = await supabase
          .from('campaign_members')
          .select('campaign_id')
          .eq('profile_id', user.id);

        if (memError) throw memError;

        let activeCampaignId: string | null = null;

        if (membershipData && membershipData.length > 0) {
          activeCampaignId = membershipData[0].campaign_id;
        } else {
          // If no membership found:
          if (profile.role === 'gm') {
            // GM might have created a campaign that doesn't have them in campaign_members.
            // Let's search if they own any campaign.
            const { data: gmCampaigns, error: gmError } = await supabase
              .from('campaigns')
              .select('id')
              .eq('gm_id', user.id)
              .limit(1);

            if (gmError) throw gmError;

            if (gmCampaigns && gmCampaigns.length > 0) {
              activeCampaignId = gmCampaigns[0].id;
              // Add GM to campaign_members for consistency
              await supabase.from('campaign_members').insert({
                campaign_id: activeCampaignId,
                profile_id: user.id,
                role: 'gm',
              });
            } else {
              // Create a default campaign for this GM!
              const { data: newCampaign, error: createError } = await supabase
                .from('campaigns')
                .insert({
                  name: 'The Realm of Shadows',
                  gm_id: user.id,
                  settings: { fog_radius: 80 }
                })
                .select()
                .single();

              if (createError) throw createError;
              activeCampaignId = newCampaign.id;

              // Add GM to campaign_members
              await supabase.from('campaign_members').insert({
                campaign_id: activeCampaignId,
                profile_id: user.id,
                role: 'gm',
              });
            }
          } else {
            // Player has no campaign membership.
            // Automatically add them to the first campaign in the database!
            const { data: allCampaigns, error: campListError } = await supabase
              .from('campaigns')
              .select('id')
              .limit(1);

            if (campListError) throw campListError;

            if (allCampaigns && allCampaigns.length > 0) {
              activeCampaignId = allCampaigns[0].id;
              await supabase.from('campaign_members').insert({
                campaign_id: activeCampaignId,
                profile_id: user.id,
                role: 'player',
              });
            }
          }
        }

        if (activeCampaignId) {
          // Load campaign details
          const { data: campDetails, error: detailsError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', activeCampaignId)
            .single();

          if (detailsError) throw detailsError;
          setCampaign(campDetails);

          // Load campaign members (including their profiles)
          const { data: memberDetails, error: memberError } = await supabase
            .from('campaign_members')
            .select('*, profile:profiles(*)')
            .eq('campaign_id', activeCampaignId);

          if (memberError) throw memberError;
          setMembers(memberDetails || []);

          // Load characters for this campaign
          const { data: charData, error: charError } = await supabase
            .from('characters')
            .select(`
              *,
              race:race_definitions(
                *,
                tier:race_tiers(*)
              ),
              subclass:subclass_definitions(
                *,
                category:class_categories(*)
              ),
              profile:profiles(*)
            `)
            .eq('campaign_id', activeCampaignId);

          if (charError) throw charError;
          setCharacters((charData as unknown as Character[]) || []);

          // Set active character
          if (charData && charData.length > 0) {
            const userCharacter = (charData as unknown as Character[]).find((c: Character) => c.profile_id === user.id);
            if (userCharacter) {
              setActiveCharacterId(userCharacter.id);
            } else if (profile.role === 'gm') {
              setActiveCharacterId(charData[0].id); // GM defaults to first character if they don't have one
            }
          }

        } else {
          setCampaign(null);
          setMembers([]);
          setCharacters([]);
          setActiveCharacterId(null);
        }
      } catch (err) {
        console.error('Error loading campaign data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [user, profile]);

  useEffect(() => {
    if (!campaign?.id) return;

    const channel = supabase
      .channel(`campaign-characters-context-${campaign.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `campaign_id=eq.${campaign.id}`
        },
        async () => {
          // Refetch characters
          const { data: charData, error: charError } = await supabase
            .from('characters')
            .select(`
              *,
              race:race_definitions(
                *,
                tier:race_tiers(*)
              ),
              subclass:subclass_definitions(
                *,
                category:class_categories(*)
              ),
              profile:profiles(*)
            `)
            .eq('campaign_id', campaign.id);

          if (!charError && charData) {
            setCharacters((charData as unknown as Character[]) || []);
            // Update active character if necessary
            if (activeCharacterId) {
               const stillExists = charData.find(c => c.id === activeCharacterId);
               if (!stillExists) setActiveCharacterId(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaign?.id, activeCharacterId]);

  const createCampaign = async (name: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: newCampaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          name,
          gm_id: user.id,
          settings: { fog_radius: 80 }
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add GM to campaign_members
      await supabase.from('campaign_members').insert({
        campaign_id: newCampaign.id,
        profile_id: user.id,
        role: 'gm',
      });

      setCampaign(newCampaign);

      // Reload members
      const { data: memberDetails } = await supabase
        .from('campaign_members')
        .select('*, profile:profiles(*)')
        .eq('campaign_id', newCampaign.id);

      setMembers(memberDetails || []);
    } catch (err) {
      console.error('Failed to create campaign:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinCampaign = async (campaignId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const { error: joinError } = await supabase.from('campaign_members').insert({
        campaign_id: campaignId,
        profile_id: user.id,
        role: 'player',
      });

      if (joinError) throw joinError;

      const { data: campDetails } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      setCampaign(campDetails);

      const { data: memberDetails } = await supabase
        .from('campaign_members')
        .select('*, profile:profiles(*)')
        .eq('campaign_id', campaignId);

      setMembers(memberDetails || []);
    } catch (err) {
      console.error('Failed to join campaign:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CampaignContext.Provider value={{ 
      campaign, 
      members, 
      characters,
      activeCharacterId,
      setActiveCharacterId,
      loading, 
      createCampaign, 
      joinCampaign 
    }}>
      {children}
    </CampaignContext.Provider>
  );
}
