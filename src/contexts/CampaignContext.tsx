import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
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
  const [activeCharacterId, setActiveCharacterIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('dnd_active_character_id');
    } catch {
      return null;
    }
  });

  const setActiveCharacterId = useCallback((id: string | null) => {
    setActiveCharacterIdState(id);
    try {
      if (id) {
        localStorage.setItem('dnd_active_character_id', id);
      } else {
        localStorage.removeItem('dnd_active_character_id');
      }
    } catch {
      // ignore
    }
  }, []);

  const [loading, setLoading] = useState(() => Boolean(user && profile));

  // Track user to only clear state on actual logout transition
  const wasLoggedInRef = useRef(Boolean(user && profile));

  // Load campaign for user
  useEffect(() => {
    if (!user || !profile) {
      if (wasLoggedInRef.current) {
        wasLoggedInRef.current = false;
        setCampaign(null);
        setMembers([]);
        setCharacters([]);
        setActiveCharacterId(null);
        setLoading(false);
      }
      return;
    }

    wasLoggedInRef.current = true;

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
          if (profile.role === 'gm' || profile.role === 'admin') {
            // Check if user owns any campaign
            const { data: gmCampaigns } = await supabase
              .from('campaigns')
              .select('id')
              .eq('gm_id', user.id)
              .limit(1);

            if (gmCampaigns && gmCampaigns.length > 0) {
              activeCampaignId = gmCampaigns[0].id;
              await supabase.from('campaign_members').insert({
                campaign_id: activeCampaignId,
                profile_id: user.id,
                role: 'gm',
              });
            } else {
              // Check if any campaign exists in DB
              const { data: existingCamps } = await supabase
                .from('campaigns')
                .select('id')
                .limit(1);

              if (existingCamps && existingCamps.length > 0) {
                activeCampaignId = existingCamps[0].id;
                await supabase.from('campaign_members').insert({
                  campaign_id: activeCampaignId,
                  profile_id: user.id,
                  role: 'gm',
                });
              } else {
                // Create a default story/campaign
                const { data: newCampaign, error: createError } = await supabase
                  .from('campaigns')
                  .insert({
                    name: 'Gölgeler Diyarı',
                    gm_id: user.id,
                    settings: { fog_radius: 80 },
                  })
                  .select()
                  .single();

                if (!createError && newCampaign) {
                  activeCampaignId = newCampaign.id;
                  await supabase.from('campaign_members').insert({
                    campaign_id: activeCampaignId,
                    profile_id: user.id,
                    role: 'gm',
                  });
                }
              }
            }
          } else {
            // Player has no campaign membership.
            // Check if any campaign exists in the database
            const { data: allCampaigns } = await supabase
              .from('campaigns')
              .select('id')
              .limit(1);

            if (allCampaigns && allCampaigns.length > 0) {
              activeCampaignId = allCampaigns[0].id;
              await supabase.from('campaign_members').insert({
                campaign_id: activeCampaignId,
                profile_id: user.id,
                role: 'player',
              });
            } else {
              // No campaign exists in entire DB yet: create default campaign
              const { data: newCampaign, error: createError } = await supabase
                .from('campaigns')
                .insert({
                  name: 'Gölgeler Diyarı',
                  gm_id: user.id,
                  settings: { fog_radius: 80 },
                })
                .select()
                .single();

              if (!createError && newCampaign) {
                activeCampaignId = newCampaign.id;
                await supabase.from('campaign_members').insert({
                  campaign_id: activeCampaignId,
                  profile_id: user.id,
                  role: 'player',
                });
              }
            }
          }
        }

        if (activeCampaignId) {
          // Load campaign details
          let { data: campDetails } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', activeCampaignId)
            .maybeSingle();

          if (!campDetails) {
            // If activeCampaignId didn't return a campaign, try to get any campaign
            const { data: fallbackCamp } = await supabase
              .from('campaigns')
              .select('*')
              .limit(1)
              .maybeSingle();
            if (fallbackCamp) {
              campDetails = fallbackCamp;
              activeCampaignId = fallbackCamp.id;
            }
          }

          if (campDetails) {
            setCampaign(campDetails);

            // Load campaign members safely
            try {
              const { data: memberDetails } = await supabase
                .from('campaign_members')
                .select('*, profile:profiles(*)')
                .eq('campaign_id', campDetails.id);
              setMembers(memberDetails || []);
            } catch (mErr) {
              console.warn('Could not load campaign members:', mErr);
            }

            // Load characters safely
            try {
              const { data: charData } = await supabase
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
                .eq('campaign_id', campDetails.id);

              if (charData) {
                const allChars = (charData as unknown as Character[]) || [];
                setCharacters(allChars);

                let savedId: string | null = null;
                try {
                  savedId = localStorage.getItem('dnd_active_character_id');
                } catch {
                  // ignore
                }

                const savedChar = savedId ? allChars.find(c => c.id === savedId) : null;
                if (savedChar) {
                  setActiveCharacterId(savedChar.id);
                } else {
                  const userCharacter = allChars.find((c: Character) => c.profile_id === user.id);
                  if (userCharacter) {
                    setActiveCharacterId(userCharacter.id);
                  } else if (profile?.role === 'gm' || profile?.role === 'admin') {
                    setActiveCharacterId(allChars[0]?.id || null);
                  }
                }
              }
            } catch (cErr) {
              console.warn('Could not load characters:', cErr);
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

  const createCampaign = useCallback(async (name: string) => {
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
  }, [user]);

  const joinCampaign = useCallback(async (campaignId: string) => {
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
  }, [user]);

  const value = useMemo<CampaignState>(() => ({
    campaign,
    members,
    characters,
    activeCharacterId,
    setActiveCharacterId,
    loading,
    createCampaign,
    joinCampaign,
  }), [
    campaign,
    members,
    characters,
    activeCharacterId,
    loading,
    createCampaign,
    joinCampaign,
  ]);

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}
