import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  MapToken,
  CampaignMap,
  MapMovementRequest,
  MapMovementMode,
  RevealedArea,
} from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { useCampaign } from '../contexts/CampaignContext';
import { supabase } from '../lib/supabase';

// ─── Default Demo Data ──────────────────────────────────────────

const DEFAULT_MAP_IMAGE = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80';

const INITIAL_DEFAULT_MAP: CampaignMap = {
  id: 'demo-campaign-map-01',
  campaign_id: 'demo-campaign',
  name: 'Arcane Dungeon Chamber',
  image_url: DEFAULT_MAP_IMAGE,
  grid_size: 40,
  width: 1200,
  height: 800,
  fog_radius: 90,
  is_active: true,
  movement_mode: 'free',
  revealed_areas: [
    { x: 300, y: 250, r: 120 },
    { x: 550, y: 400, r: 120 },
  ],
  created_at: new Date().toISOString(),
};

const INITIAL_TOKENS: MapToken[] = [
  {
    id: 'token-1',
    character_id: 'char-1',
    campaign_id: 'camp-1',
    x_position: 300,
    y_position: 250,
    icon_url: null,
    color: '#dc2626',
    label: 'Kael (Fighter)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'token-2',
    character_id: 'char-2',
    campaign_id: 'camp-1',
    x_position: 550,
    y_position: 400,
    icon_url: null,
    color: '#2563eb',
    label: 'Lyria (Mage)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'token-3',
    character_id: 'char-3',
    campaign_id: 'camp-1',
    x_position: 750,
    y_position: 200,
    icon_url: null,
    color: '#16a34a',
    label: 'Thorne (Rogue)',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'token-4',
    character_id: 'char-4',
    campaign_id: 'camp-1',
    x_position: 900,
    y_position: 550,
    icon_url: null,
    color: '#9333ea',
    label: 'Mora (Cleric)',
    updated_at: new Date().toISOString(),
  },
];

// ─── Hook ──────────────────────────────────────────────────────

export function useMap() {
  const { isGM, user } = useAuth();
  const { campaign, characters, activeCharacterId } = useCampaign();
  const campaignId = campaign?.id;

  const [maps, setMaps] = useState<CampaignMap[]>([INITIAL_DEFAULT_MAP]);
  const [activeMapId, setActiveMapId] = useState<string>(INITIAL_DEFAULT_MAP.id);
  const [tokens, setTokens] = useState<MapToken[]>(INITIAL_TOKENS);
  const [movementRequests, setMovementRequests] = useState<MapMovementRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  const activeMap = maps.find((m) => m.id === activeMapId) || maps[0] || INITIAL_DEFAULT_MAP;
  const movementMode = activeMap.movement_mode || 'free';
  const fogRadius = activeMap.fog_radius || 80;
  const revealedAreas = activeMap.revealed_areas || [];

  // Ref to avoid stale state in callbacks
  const activeMapRef = useRef(activeMap);
  const fogDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    activeMapRef.current = activeMap;
  }, [activeMap]);

  useEffect(() => {
    return () => {
      if (fogDebounceRef.current) clearTimeout(fogDebounceRef.current);
    };
  }, []);

  // Sync campaign characters to tokens if available
  useEffect(() => {
    if (characters && characters.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTokens((prev) => {
        const charTokens: MapToken[] = characters.map((c, idx) => {
          const existing = prev.find((t) => t.character_id === c.id);
          const colors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2'];
          return {
            id: existing?.id || `char-token-${c.id}`,
            character_id: c.id,
            campaign_id: campaignId || 'local',
            x_position: existing?.x_position || 200 + (idx % 4) * 150,
            y_position: existing?.y_position || 200 + Math.floor(idx / 4) * 150,
            icon_url: c.avatar_url || null,
            color: existing?.color || colors[idx % colors.length],
            label: c.name,
            updated_at: new Date().toISOString(),
          };
        });
        return charTokens;
      });
    }
  }, [characters, campaignId]);

  // Fetch campaign maps from database
  const fetchMaps = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaign_maps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

      if (error) {
        // Fallback gracefully if table not yet migrated
        setIsDbConnected(false);
        return;
      }

      setIsDbConnected(true);
      if (data && data.length > 0) {
        const typedMaps = data as CampaignMap[];
        setMaps(typedMaps);
        const active = typedMaps.find((m) => m.is_active) || typedMaps[0];
        setActiveMapId(active.id);
      }
    } catch {
      setIsDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Fetch movement requests
  const fetchMovementRequests = useCallback(async () => {
    if (!campaignId) return;
    try {
      const { data, error } = await supabase
        .from('map_movement_requests')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMovementRequests(data as MapMovementRequest[]);
      }
    } catch {
      // Ignore
    }
  }, [campaignId]);

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMaps();
    fetchMovementRequests();
  }, [fetchMaps, fetchMovementRequests]);

  // Realtime subscription for maps & movement requests
  useEffect(() => {
    if (!campaignId || !isDbConnected) return;

    const channel = supabase
      .channel(`map-realtime-${campaignId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'campaign_maps', filter: `campaign_id=eq.${campaignId}` },
        () => {
          fetchMaps();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'map_movement_requests', filter: `campaign_id=eq.${campaignId}` },
        () => {
          fetchMovementRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId, isDbConnected, fetchMaps, fetchMovementRequests]);

  // Update revealed areas in state and DB
  const revealFogAt = useCallback(
    async (x: number, y: number, radius: number) => {
      const current = activeMapRef.current;
      const existing = current.revealed_areas || [];

      // Avoid redundant circles if the token barely moved
      const isRedundant = existing.some((area) => {
        const dx = area.x - x;
        const dy = area.y - y;
        return Math.sqrt(dx * dx + dy * dy) < radius * 0.4;
      });
      if (isRedundant) return;

      const newArea: RevealedArea = { x, y, r: radius };
      const nextAreas = [...existing, newArea];

      setMaps((prev) =>
        prev.map((m) => (m.id === current.id ? { ...m, revealed_areas: nextAreas } : m))
      );

      // Debounce persistent DB updates to prevent flooding on rapid token movements
      if (isDbConnected && current.id && !current.id.startsWith('demo-')) {
        if (fogDebounceRef.current) clearTimeout(fogDebounceRef.current);
        fogDebounceRef.current = setTimeout(async () => {
          try {
            await supabase
              .from('campaign_maps')
              .update({ revealed_areas: nextAreas })
              .eq('id', current.id);
          } catch {
            // Ignore
          }
        }, 500);
      }
    },
    [isDbConnected]
  );

  // Update token position
  const updateTokenPosition = useCallback(
    async (id: string, x: number, y: number) => {
      const current = activeMapRef.current;
      const targetToken = tokens.find((t) => t.id === id);
      if (!targetToken) return;

      // In approved mode: non-GMs send a movement request instead of direct teleport
      if (current.movement_mode === 'approved' && !isGM) {
        const req: MapMovementRequest = {
          id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          campaign_id: campaignId || 'local',
          token_id: id,
          character_id: targetToken.character_id || activeCharacterId || null,
          from_x: targetToken.x_position,
          from_y: targetToken.y_position,
          target_x: x,
          target_y: y,
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        setMovementRequests((prev) => [...prev.filter((r) => r.token_id !== id), req]);

        if (isDbConnected && campaignId) {
          try {
            await supabase.from('map_movement_requests').insert({
              campaign_id: campaignId,
              token_id: id,
              character_id: targetToken.character_id || null,
              from_x: targetToken.x_position,
              from_y: targetToken.y_position,
              target_x: x,
              target_y: y,
              status: 'pending',
            });
          } catch {
            // fallback to local state
          }
        }
        return;
      }

      // Free mode or GM drag: immediate movement & dynamic fog revelation
      setTokens((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, x_position: x, y_position: y, updated_at: new Date().toISOString() }
            : t
        )
      );

      // Reveal fog around new position
      revealFogAt(x, y, current.fog_radius || 80);
    },
    [tokens, isGM, campaignId, isDbConnected, activeCharacterId, revealFogAt]
  );

  // GM Approves a pending movement request
  const approveMovement = useCallback(
    async (requestId: string) => {
      const req = movementRequests.find((r) => r.id === requestId);
      if (!req) return;

      // Move the token
      setTokens((prev) =>
        prev.map((t) =>
          t.id === req.token_id
            ? { ...t, x_position: req.target_x, y_position: req.target_y, updated_at: new Date().toISOString() }
            : t
        )
      );

      // Reveal fog at destination
      revealFogAt(req.target_x, req.target_y, activeMapRef.current.fog_radius || 80);

      // Remove from pending
      setMovementRequests((prev) => prev.filter((r) => r.id !== requestId));

      if (isDbConnected && !requestId.startsWith('req-')) {
        try {
          await supabase
            .from('map_movement_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);
        } catch {
          // ignore
        }
      }
    },
    [movementRequests, revealFogAt, isDbConnected]
  );

  // GM Rejects a pending movement request
  const rejectMovement = useCallback(
    async (requestId: string) => {
      setMovementRequests((prev) => prev.filter((r) => r.id !== requestId));

      if (isDbConnected && !requestId.startsWith('req-')) {
        try {
          await supabase
            .from('map_movement_requests')
            .update({ status: 'rejected' })
            .eq('id', requestId);
        } catch {
          // ignore
        }
      }
    },
    [isDbConnected]
  );

  // Toggle Movement Mode ('free' vs 'approved')
  const setMovementMode = useCallback(
    async (mode: MapMovementMode) => {
      const current = activeMapRef.current;
      setMaps((prev) =>
        prev.map((m) => (m.id === current.id ? { ...m, movement_mode: mode } : m))
      );

      if (isDbConnected && current.id && !current.id.startsWith('demo-')) {
        try {
          await supabase
            .from('campaign_maps')
            .update({ movement_mode: mode })
            .eq('id', current.id);
        } catch {
          // ignore
        }
      }
    },
    [isDbConnected]
  );

  // Update Fog Radius
  const updateFogRadius = useCallback(
    async (radius: number) => {
      const current = activeMapRef.current;
      setMaps((prev) =>
        prev.map((m) => (m.id === current.id ? { ...m, fog_radius: radius } : m))
      );

      if (isDbConnected && current.id && !current.id.startsWith('demo-')) {
        try {
          await supabase
            .from('campaign_maps')
            .update({ fog_radius: radius })
            .eq('id', current.id);
        } catch {
          // ignore
        }
      }
    },
    [isDbConnected]
  );

  // Reset Fog
  const resetFog = useCallback(async () => {
    const current = activeMapRef.current;
    setMaps((prev) =>
      prev.map((m) => (m.id === current.id ? { ...m, revealed_areas: [] } : m))
    );

    if (isDbConnected && current.id && !current.id.startsWith('demo-')) {
      try {
        await supabase
          .from('campaign_maps')
          .update({ revealed_areas: [] })
          .eq('id', current.id);
      } catch {
        // ignore
      }
    }
  }, [isDbConnected]);

  // Reset Token Positions
  const resetPositions = useCallback(() => {
    setTokens(INITIAL_TOKENS);
    setMovementRequests([]);
  }, []);

  // Create / Upload Map to Library
  const createMap = useCallback(
    async (newMap: {
      name: string;
      image_url: string;
      width?: number;
      height?: number;
      grid_size?: number;
      fog_radius?: number;
    }) => {
      const created: CampaignMap = {
        id: `map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        campaign_id: campaignId || 'local',
        name: newMap.name,
        image_url: newMap.image_url,
        grid_size: newMap.grid_size || 40,
        width: newMap.width || 1200,
        height: newMap.height || 800,
        fog_radius: newMap.fog_radius || 80,
        is_active: false,
        movement_mode: 'free',
        revealed_areas: [],
        created_at: new Date().toISOString(),
      };

      if (isDbConnected && campaignId) {
        try {
          const { data, error } = await supabase
            .from('campaign_maps')
            .insert({
              campaign_id: campaignId,
              name: newMap.name,
              image_url: newMap.image_url,
              grid_size: newMap.grid_size || 40,
              width: newMap.width || 1200,
              height: newMap.height || 800,
              fog_radius: newMap.fog_radius || 80,
              is_active: false,
              movement_mode: 'free',
              revealed_areas: [],
            })
            .select()
            .single();

          if (!error && data) {
            setMaps((prev) => [...prev, data as CampaignMap]);
            return data as CampaignMap;
          }
        } catch {
          // fallback
        }
      }

      setMaps((prev) => [...prev, created]);
      return created;
    },
    [campaignId, isDbConnected]
  );

  // Switch Active Map
  const switchActiveMap = useCallback(
    async (mapId: string) => {
      setActiveMapId(mapId);
      setMaps((prev) =>
        prev.map((m) => ({ ...m, is_active: m.id === mapId }))
      );

      if (isDbConnected && campaignId) {
        try {
          // Set all to false, then target to true
          await supabase
            .from('campaign_maps')
            .update({ is_active: false })
            .eq('campaign_id', campaignId);

          await supabase
            .from('campaign_maps')
            .update({ is_active: true })
            .eq('id', mapId);
        } catch {
          // ignore
        }
      }
    },
    [campaignId, isDbConnected]
  );

  // Delete Map
  const deleteMap = useCallback(
    async (mapId: string) => {
      setMaps((prev) => {
        const next = prev.filter((m) => m.id !== mapId);
        if (activeMapId === mapId && next.length > 0) {
          setActiveMapId(next[0].id);
        }
        return next;
      });

      if (isDbConnected && !mapId.startsWith('demo-') && !mapId.startsWith('map-')) {
        try {
          await supabase.from('campaign_maps').delete().eq('id', mapId);
        } catch {
          // ignore
        }
      }
    },
    [activeMapId, isDbConnected]
  );

  return {
    maps,
    activeMap,
    activeMapId,
    movementMode,
    movementRequests,
    tokens,
    fogRadius,
    revealedAreas,
    loading,
    isGM,
    user,
    updateTokenPosition,
    updateFogRadius,
    setMovementMode,
    approveMovement,
    rejectMovement,
    revealFogAt,
    resetFog,
    resetPositions,
    createMap,
    switchActiveMap,
    deleteMap,
  };
}
