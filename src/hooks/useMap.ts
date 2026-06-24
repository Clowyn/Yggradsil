import { useState, useCallback } from 'react';
import type { MapToken } from '../lib/types';

// ─── Demo Map State ────────────────────────────────────────────

interface MapStateLocal {
  id: string;
  map_width: number;
  map_height: number;
  fog_radius: number;
}

const INITIAL_MAP_STATE: MapStateLocal = {
  id: 'demo-map-001',
  map_width: 1200,
  map_height: 800,
  fog_radius: 80,
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
    label: 'Kael',
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
    label: 'Lyria',
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
    label: 'Thorne',
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
    label: 'Mora',
    updated_at: new Date().toISOString(),
  },
];

// ─── Hook ──────────────────────────────────────────────────────

export function useMap() {
  const [mapState, setMapState] = useState<MapStateLocal>(INITIAL_MAP_STATE);
  const [tokens, setTokens] = useState<MapToken[]>(INITIAL_TOKENS);
  const [isGM] = useState(true);

  const updateTokenPosition = useCallback((id: string, x: number, y: number) => {
    setTokens((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, x_position: x, y_position: y, updated_at: new Date().toISOString() }
          : t,
      ),
    );
  }, []);

  const updateFogRadius = useCallback((radius: number) => {
    setMapState((prev) => ({ ...prev, fog_radius: radius }));
  }, []);

  const resetPositions = useCallback(() => {
    setTokens(INITIAL_TOKENS);
  }, []);

  return {
    mapState,
    tokens,
    updateTokenPosition,
    updateFogRadius,
    resetPositions,
    isGM,
  };
}
