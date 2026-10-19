import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon,
  Plus,
  Trash2,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  ScanEye,
  BrickWall,
} from 'lucide-react';

import { useMap } from '../../hooks/useMap';
import { renderFog, hasLineOfSight } from './FogOfWar';
import { GMMapControls } from './GMMapControls';
import { MapTokenComponent } from './MapToken';
import { useAuth } from '../../contexts/AuthContext';
import { useCampaign } from '../../contexts/CampaignContext';
import { translations } from '../../lib/translations';
import type { MapToken, MapMovementRequest, MapWallSegment } from '../../lib/types';

// ─── Constants ─────────────────────────────────────────────────

const TOKEN_RADIUS = 16;
const GRID_CELL_SIZE = 40;

// ─── Canvas Drawing Helpers ────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= w; x += GRID_CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  for (let y = 0; y <= h; y += GRID_CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  for (let x = 0; x <= w; x += GRID_CELL_SIZE) {
    for (let y = 0; y <= h; y += GRID_CELL_SIZE) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWalls(
  ctx: CanvasRenderingContext2D,
  walls: MapWallSegment[],
  losEnabled: boolean
) {
  if (walls.length === 0) return;

  ctx.save();
  walls.forEach((wall) => {
    // Outer wall glow
    ctx.beginPath();
    ctx.moveTo(wall.x1, wall.y1);
    ctx.lineTo(wall.x2, wall.y2);
    ctx.strokeStyle = losEnabled
      ? 'rgba(245, 158, 11, 0.35)'
      : 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Core stone/arcane barrier line
    ctx.beginPath();
    ctx.moveTo(wall.x1, wall.y1);
    ctx.lineTo(wall.x2, wall.y2);
    ctx.strokeStyle = losEnabled ? '#f59e0b' : '#64748b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Pillar endpoints
    [
      { x: wall.x1, y: wall.y1 },
      { x: wall.x2, y: wall.y2 },
    ].forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = losEnabled ? '#fbbf24' : '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  });
  ctx.restore();
}

function drawGhostPaths(ctx: CanvasRenderingContext2D, requests: MapMovementRequest[]) {
  requests.forEach((req) => {
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(req.from_x, req.from_y);
    ctx.lineTo(req.target_x, req.target_y);
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(req.target_x, req.target_y, TOKEN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(req.target_x, req.target_y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REQUESTED', req.target_x, req.target_y - TOKEN_RADIUS - 4);
    ctx.restore();
  });
}

function drawTokens(
  ctx: CanvasRenderingContext2D,
  tokens: MapToken[],
  occludedTokenIds: Set<string>,
  hideOccludedFromPlayer: boolean,
  selectedTokenId: string | null
) {
  tokens.forEach((token) => {
    const isOccluded = occludedTokenIds.has(token.id);
    if (isOccluded && hideOccludedFromPlayer) {
      return; // Hidden behind wall & fog for non-GM player view
    }

    const { x_position: x, y_position: y, color } = token;
    const safeLabel = token.label || 'T';

    ctx.save();
    if (isOccluded) {
      ctx.globalAlpha = 0.45;
    }

    // Outer glow
    const glow = ctx.createRadialGradient(x, y, 0, x, y, TOKEN_RADIUS + 8);
    glow.addColorStop(0, `${color}44`);
    glow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, TOKEN_RADIUS + 8, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Token circle
    ctx.beginPath();
    ctx.arc(x, y, TOKEN_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Border (highlight if selected observer)
    ctx.strokeStyle =
      token.id === selectedTokenId ? '#fbbf24' : 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = token.id === selectedTokenId ? 3 : 2;
    ctx.stroke();

    // Initials
    const initials = safeLabel
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, x, y);

    // Name label below
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText(token.label || '', x, y + TOKEN_RADIUS + 12);
    ctx.restore();
  });
}

// ─── GameMap Component ─────────────────────────────────────────

export function GameMap() {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;

  const {
    maps,
    activeMap,
    movementMode,
    movementRequests,
    tokens,
    fogRadius,
    revealedAreas,
    walls,
    losEnabled,
    isGM,
    updateTokenPosition,
    updateFogRadius,
    setMovementMode,
    approveMovement,
    rejectMovement,
    resetFog,
    resetPositions,
    createMap,
    switchActiveMap,
    deleteMap,
    addWallSegment,
    clearWalls,
    loadPresetWalls,
    toggleLosEnabled,
  } = useMap();

  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapImageRef = useRef<HTMLImageElement | null>(null);

  // By default, players have Fog of War on; GMs can toggle it
  const { activeCharacterId } = useCampaign();
  const [showFog, setShowFog] = useState(!isGM);
  const [isWallDrawMode, setIsWallDrawMode] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  // Modals & player notices
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [playerNotice, setPlayerNotice] = useState<string | null>(null);

  // New map form state
  const [newMapName, setNewMapName] = useState('');
  const [newMapUrl, setNewMapUrl] = useState('');
  const [newMapFilePreview, setNewMapFilePreview] = useState<string | null>(null);

  // Token drag state
  const [dragState, setDragState] = useState<{
    tokenId: string | null;
    offsetX: number;
    offsetY: number;
  }>({ tokenId: null, offsetX: 0, offsetY: 0 });
  const [dragPreviewPos, setDragPreviewPos] = useState<{ x: number; y: number } | null>(null);

  // Wall drawing drag state
  const [wallDraft, setWallDraft] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  const W = activeMap.width || 1200;
  const H = activeMap.height || 800;

  const observerToken = useMemo(
    () =>
      (selectedTokenId ? tokens.find((tok) => tok.id === selectedTokenId) : null) ||
      (activeCharacterId ? tokens.find((tok) => tok.character_id === activeCharacterId) : null) ||
      tokens[0] ||
      null,
    [tokens, selectedTokenId, activeCharacterId]
  );

  // Compute which tokens are occluded by walls from the observer token (or party vision)
  const occludedTokenIds = useMemo(() => {
    const set = new Set<string>();
    if (!losEnabled || walls.length === 0 || !observerToken) return set;

    tokens.forEach((target) => {
      if (target.id === observerToken.id) return;
      const visible = hasLineOfSight(
        observerToken.x_position,
        observerToken.y_position,
        target.x_position,
        target.y_position,
        walls
      );
      if (!visible) {
        set.add(target.id);
      }
    });
    return set;
  }, [tokens, observerToken, walls, losEnabled]);

  // ── Render map canvas ──
  const renderMap = useCallback(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // Draw background image if available, else arcane dark background
    if (mapImageRef.current) {
      try {
        ctx.drawImage(mapImageRef.current, 0, 0, W, H);
        ctx.fillStyle = 'rgba(5, 5, 12, 0.2)';
        ctx.fillRect(0, 0, W, H);
      } catch {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, W, H);
      }
    } else {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
      bg.addColorStop(0, 'rgba(26, 10, 46, 0.45)');
      bg.addColorStop(1, 'rgba(10, 10, 15, 0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }

    drawGrid(ctx, W, H);

    // Draw dungeon walls
    drawWalls(ctx, walls, losEnabled);

    // Draw live wall-drawing draft segment if GM is dragging a new wall
    if (wallDraft) {
      ctx.save();
      ctx.setLineDash([8, 4]);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(wallDraft.x1, wallDraft.y1);
      ctx.lineTo(wallDraft.x2, wallDraft.y2);
      ctx.stroke();
      ctx.restore();
    }

    // Draw ghost paths for pending movement requests
    if (movementRequests.length > 0) {
      drawGhostPaths(ctx, movementRequests);
    }

    // Draw live drag guide line & ghost token for player in approved mode
    if (dragState.tokenId && dragPreviewPos && movementMode === 'approved' && !isGM) {
      const draggedToken = tokens.find((t) => t.id === dragState.tokenId);
      if (draggedToken) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(draggedToken.x_position, draggedToken.y_position);
        ctx.lineTo(dragPreviewPos.x, dragPreviewPos.y);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(dragPreviewPos.x, dragPreviewPos.y, TOKEN_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TARGET', dragPreviewPos.x, dragPreviewPos.y - TOKEN_RADIUS - 4);
        ctx.restore();
      }
    }

    drawTokens(
      ctx,
      tokens,
      occludedTokenIds,
      !isGM && showFog && losEnabled,
      observerToken?.id || null
    );
  }, [
    W,
    H,
    tokens,
    walls,
    losEnabled,
    wallDraft,
    movementRequests,
    dragState.tokenId,
    dragPreviewPos,
    movementMode,
    isGM,
    showFog,
    occludedTokenIds,
    observerToken,
  ]);

  // Preload background map image when activeMap changes
  useEffect(() => {
    if (activeMap.image_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = activeMap.image_url;
      img.onload = () => {
        mapImageRef.current = img;
        renderMap();
      };
      img.onerror = () => {
        mapImageRef.current = null;
        renderMap();
      };
    } else {
      mapImageRef.current = null;
      renderMap();
    }
  }, [activeMap.image_url, renderMap]);

  // ── Render fog canvas ──
  const renderFogLayer = useCallback(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!showFog) {
      ctx.clearRect(0, 0, W, H);
      return;
    }

    // When LoS is enabled and an observer token is selected, cast active vision strictly from the observer token
    const visionSources =
      losEnabled && walls.length > 0 && observerToken
        ? [observerToken]
        : tokens;

    renderFog(ctx, W, H, visionSources, fogRadius, revealedAreas, walls, losEnabled);
  }, [W, H, tokens, fogRadius, revealedAreas, showFog, walls, losEnabled, observerToken]);

  useEffect(() => {
    renderMap();
    renderFogLayer();
  }, [renderMap, renderFogLayer]);

  // ── Hit-test: find token under mouse position ──
  const findTokenAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = mapCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i];
        const dx = x - t.x_position;
        const dy = y - t.y_position;
        if (dx * dx + dy * dy <= TOKEN_RADIUS * TOKEN_RADIUS) {
          return { token: t, offsetX: dx, offsetY: dy };
        }
      }
      return null;
    },
    [tokens, W, H]
  );

  // ── Mouse handlers ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = mapCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const canvasX = Math.round((e.clientX - rect.left) * scaleX);
      const canvasY = Math.round((e.clientY - rect.top) * scaleY);

      if (isGM && isWallDrawMode) {
        setWallDraft({ x1: canvasX, y1: canvasY, x2: canvasX, y2: canvasY });
        return;
      }

      const hit = findTokenAt(e.clientX, e.clientY);
      if (hit) {
        setSelectedTokenId(hit.token.id);
        setDragState({
          tokenId: hit.token.id,
          offsetX: hit.offsetX,
          offsetY: hit.offsetY,
        });
      }
    },
    [findTokenAt, W, H, isGM, isWallDrawMode]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvas = mapCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;

      if (wallDraft) {
        const curX = Math.max(0, Math.min(W, Math.round((e.clientX - rect.left) * scaleX)));
        const curY = Math.max(0, Math.min(H, Math.round((e.clientY - rect.top) * scaleY)));
        setWallDraft((prev) => (prev ? { ...prev, x2: curX, y2: curY } : null));
        return;
      }

      if (!dragState.tokenId) return;

      const currentX = (e.clientX - rect.left) * scaleX - dragState.offsetX;
      const currentY = (e.clientY - rect.top) * scaleY - dragState.offsetY;

      const clampedX = Math.max(TOKEN_RADIUS, Math.min(W - TOKEN_RADIUS, currentX));
      const clampedY = Math.max(TOKEN_RADIUS, Math.min(H - TOKEN_RADIUS, currentY));

      // In free mode or if GM: token follows mouse
      if (movementMode === 'free' || isGM) {
        updateTokenPosition(dragState.tokenId, clampedX, clampedY);
      } else {
        setDragPreviewPos({ x: clampedX, y: clampedY });
      }
    },
    [wallDraft, dragState, W, H, movementMode, isGM, updateTokenPosition]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (wallDraft) {
        const length = Math.hypot(wallDraft.x2 - wallDraft.x1, wallDraft.y2 - wallDraft.y1);
        if (length >= 12) {
          addWallSegment({
            x1: wallDraft.x1,
            y1: wallDraft.y1,
            x2: wallDraft.x2,
            y2: wallDraft.y2,
            type: 'wall',
          });
        }
        setWallDraft(null);
        return;
      }

      if (dragState.tokenId) {
        setDragPreviewPos(null);
        // If in approved mode and player released mouse: send movement request
        if (movementMode === 'approved' && !isGM) {
          const canvas = mapCanvasRef.current;
          if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width;
            const scaleY = H / rect.height;
            const targetX = Math.max(TOKEN_RADIUS, Math.min(W - TOKEN_RADIUS, (e.clientX - rect.left) * scaleX));
            const targetY = Math.max(TOKEN_RADIUS, Math.min(H - TOKEN_RADIUS, (e.clientY - rect.top) * scaleY));

            updateTokenPosition(dragState.tokenId, Math.round(targetX), Math.round(targetY));
            setPlayerNotice(t.map.moveRequested);
            setTimeout(() => setPlayerNotice(null), 4000);
          }
        }
        setDragState({ tokenId: null, offsetX: 0, offsetY: 0 });
      }
    },
    [wallDraft, addWallSegment, dragState, movementMode, isGM, W, H, updateTokenPosition, t.map.moveRequested]
  );

  // File upload reader for custom map
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewMapFilePreview(reader.result);
        setNewMapUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateNewMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim() || !newMapUrl.trim()) return;

    await createMap({
      name: newMapName.trim(),
      image_url: newMapUrl.trim(),
      width: W,
      height: H,
      fog_radius: fogRadius,
    });

    setNewMapName('');
    setNewMapUrl('');
    setNewMapFilePreview(null);
  };

  return (
    <div className="relative w-full space-y-3">
      {/* Tactical Map Header & Telemetry */}
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-cinzel font-extrabold text-gold-gradient tracking-wider uppercase">
            {t.map.tacticalBattleMap}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3 py-1 rounded-xl bg-black/50 border border-amber-900/30 text-[11px] font-cinzel text-amber-200/80 shadow-md">
          <span className="text-amber-300 font-bold">{t.map.gridTelemetry}</span>
          <span className="text-amber-900">|</span>
          <span className="text-emerald-400">{t.map.warTableAttuned}</span>
          <span className="text-amber-900">|</span>
          <span className="text-amber-300">
            {t.map.heroesCount}: {tokens.length}
          </span>
          <span className="text-amber-900">|</span>
          <span
            data-testid="los-telemetry-badge"
            className={`flex items-center gap-1 font-bold ${
              losEnabled ? 'text-emerald-400' : 'text-stone-400'
            }`}
          >
            <ScanEye className="w-3.5 h-3.5" />
            {losEnabled ? `LoS (${walls.length})` : 'LoS OFF'}
          </span>
          <span className="text-amber-900">|</span>
          <span className={movementMode === 'approved' ? 'text-rose-400 font-bold' : 'text-blue-400 font-bold'}>
            {movementMode === 'approved' ? t.map.gmApprovedMode : t.map.freeExploration}
          </span>
        </div>
      </motion.div>

      {/* Wall Draw Mode Active Banner */}
      <AnimatePresence>
        {isGM && isWallDrawMode && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            data-testid="wall-draw-mode-banner"
            className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-cinzel flex items-center justify-between gap-2 shadow-lg"
          >
            <span className="flex items-center gap-2">
              <BrickWall className="w-4 h-4 text-amber-400" />
              {locale === 'tr'
                ? 'Duvar Çizim Modu Aktif: Harita üzerinde basılı tutup sürükleyerek görüş engelleyici duvar ekleyin.'
                : 'Wall Draw Mode Active: Click and drag on the battle map canvas to place line-of-sight blocking walls.'}
            </span>
            <button
              type="button"
              onClick={() => setIsWallDrawMode(false)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-bold cursor-pointer"
            >
              {locale === 'tr' ? 'Tamamla' : 'Done'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Player Feedback Notice */}
      <AnimatePresence>
        {playerNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-cinzel flex items-center gap-2 shadow-lg"
          >
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{playerNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Canvas Container */}
      <motion.div
        ref={containerRef}
        className="relative arcane-glass rounded-2xl overflow-hidden border border-amber-900/35 shadow-2xl mx-auto"
        style={{ width: W, height: H, maxWidth: '100%', aspectRatio: `${W}/${H}` }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Bottom canvas: Map image, grid, walls, ghost paths, tokens */}
        <canvas
          ref={mapCanvasRef}
          data-testid="battle-map-canvas"
          width={W}
          height={H}
          className="absolute inset-0 cursor-crosshair w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Top canvas: Dynamic fog of war with 2D Raycasted Visibility Polygons */}
        <canvas
          ref={fogCanvasRef}
          data-testid="fog-of-war-canvas"
          width={W}
          height={H}
          className="absolute inset-0 pointer-events-none w-full h-full"
        />

        {/* GM Controls overlay */}
        {isGM && (
          <GMMapControls
            fogRadius={fogRadius}
            onFogRadiusChange={updateFogRadius}
            onResetPositions={resetPositions}
            showFog={showFog}
            onToggleFog={() => setShowFog(!showFog)}
            movementMode={movementMode}
            onToggleMovementMode={setMovementMode}
            onResetFog={resetFog}
            onOpenMapLibrary={() => setShowLibraryModal(true)}
            activeMapName={activeMap.name}
            pendingRequestsCount={movementRequests.length}
            losEnabled={losEnabled}
            onToggleLos={() => toggleLosEnabled()}
            isWallDrawMode={isWallDrawMode}
            onToggleWallDrawMode={() => setIsWallDrawMode((prev) => !prev)}
            wallCount={walls.length}
            onLoadPresetWalls={loadPresetWalls}
            onClearWalls={clearWalls}
          />
        )}

        {/* GM Pending Movement Requests Queue */}
        {isGM && movementRequests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 right-4 z-20 max-w-sm w-full space-y-2"
          >
            <div className="bg-[#0e1017]/95 border border-amber-900/40 rounded-xl p-3 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between text-xs font-cinzel font-bold text-amber-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  {t.map.pendingMoves} ({movementRequests.length})
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {movementRequests.map((req) => {
                  const token = tokens.find((t) => t.id === req.token_id);
                  const label = token?.label || 'Token';

                  return (
                    <div
                      key={req.id}
                      className="p-2 rounded-lg bg-black/50 border border-white/5 flex items-center justify-between gap-2"
                    >
                      <div className="text-[11px] font-cinzel text-stone-300 truncate">
                        <span className="font-bold text-amber-200">{label}</span>
                        <span className="text-[9px] text-stone-500 block">
                          → ({req.target_x}, {req.target_y})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => approveMovement(req.id)}
                          className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>{t.map.approveMove}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectMovement(req.id)}
                          className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                          title={t.map.rejectMove}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Token Count, Interactive MapToken Roster & LoS Occlusion Telemetry */}
        <div className="absolute bottom-4 left-4 z-10 bg-[#08090c]/90 border border-amber-900/40 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-1">
            {tokens.map((tok) => (
              <MapTokenComponent
                key={tok.id}
                token={tok}
                compact
                isSelected={tok.id === observerToken?.id}
                isOccluded={occludedTokenIds.has(tok.id)}
                onClick={(clicked) => setSelectedTokenId(clicked.id)}
              />
            ))}
          </div>
          <div className="text-[10px] font-cinzel text-amber-200 font-bold">
            <span>
              {tokens.length} {t.map.expeditionTokens}
            </span>
            {losEnabled && walls.length > 0 && (
              <span
                data-testid="los-visible-summary"
                className="block text-[9px] text-emerald-400/90 font-normal"
              >
                {tokens.length - occludedTokenIds.size}/{tokens.length}{' '}
                {locale === 'tr' ? 'Görüş Alanında' : 'In Line of Sight'}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* GM Map Library Modal */}
      <AnimatePresence>
        {showLibraryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-2xl border border-white/10 w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-lg font-cinzel font-bold text-gold-gradient flex items-center gap-2">
                  <MapIcon className="w-5 h-5 text-[#ffd700]" /> {t.map.mapLibrary}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLibraryModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload or Add Map Section */}
              <form onSubmit={handleCreateNewMap} className="glass p-4 rounded-xl border border-white/10 space-y-3">
                <h4 className="text-xs font-cinzel font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> {t.map.uploadMap}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      {t.map.mapName}
                    </label>
                    <input
                      type="text"
                      required
                      value={newMapName}
                      onChange={(e) => setNewMapName(e.target.value)}
                      placeholder={t.map.newMapNamePlaceholder}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#ffd700]/50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                      {t.map.mapUrl}
                    </label>
                    <input
                      type="text"
                      value={newMapUrl}
                      onChange={(e) => setNewMapUrl(e.target.value)}
                      placeholder="https://example.com/map.jpg"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-[#ffd700]/50"
                    />
                  </div>
                </div>

                {/* File picker */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-stone-300 font-cinzel cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.map.uploadImageOrUrl}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {newMapFilePreview && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Görsel Hazır
                    </span>
                  )}

                  <div className="flex-1" />

                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#ffd700]/20 hover:bg-[#ffd700]/30 border border-[#ffd700]/40 text-[#ffd700] text-xs font-bold font-cinzel transition-all cursor-pointer"
                  >
                    {t.common.create}
                  </button>
                </div>
              </form>

              {/* Saved Maps List */}
              <div className="space-y-2">
                <h4 className="text-xs font-cinzel font-bold text-stone-400 uppercase tracking-wider">
                  {t.map.mapLibrary} ({maps.length})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {maps.map((m) => {
                    const isActive = m.id === activeMap.id;

                    return (
                      <div
                        key={m.id}
                        onClick={() => switchActiveMap(m.id)}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                          isActive
                            ? 'border-[#ffd700]/60 bg-[#ffd700]/10 shadow-[0_0_15px_rgba(255,215,0,0.15)]'
                            : 'border-white/5 bg-black/40 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="truncate">
                            <h5 className="font-cinzel text-xs font-bold text-stone-200 truncate flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              {m.name}
                            </h5>
                            <span className="text-[9px] text-stone-500">
                              {m.width}x{m.height} px • Sis {m.fog_radius}px
                            </span>
                          </div>

                          {isActive ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#ffd700] text-black uppercase">
                              {t.common.active}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMap(m.id);
                              }}
                              className="p-1 rounded hover:bg-red-500/20 text-stone-500 hover:text-red-400 transition-colors"
                              title={t.common.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Thumbnail */}
                        <div className="h-24 rounded-lg bg-black/60 border border-white/5 overflow-hidden flex items-center justify-center relative">
                          {m.image_url ? (
                            <img
                              src={m.image_url}
                              alt={m.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-stone-600" />
                          )}
                        </div>

                        {!isActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              switchActiveMap(m.id);
                            }}
                            className="w-full py-1 rounded bg-white/5 hover:bg-white/10 text-stone-300 text-[10px] font-cinzel font-bold transition-all text-center"
                          >
                            {t.map.switchMap}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
