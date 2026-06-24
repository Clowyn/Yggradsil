import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon } from 'lucide-react';

import { useMap } from '../../hooks/useMap';
import { renderFog } from './FogOfWar';
import { GMMapControls } from './GMMapControls';
import type { MapToken } from '../../lib/types';

// ─── Constants ─────────────────────────────────────────────────

const TOKEN_RADIUS = 16;
const GRID_CELL_SIZE = 40;

// ─── Drawing Helpers ───────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= w; x += GRID_CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= h; y += GRID_CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Intersection dots
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let x = 0; x <= w; x += GRID_CELL_SIZE) {
    for (let y = 0; y <= h; y += GRID_CELL_SIZE) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTokens(ctx: CanvasRenderingContext2D, tokens: MapToken[]) {
  tokens.forEach((token) => {
    const { x_position: x, y_position: y, color, label } = token;

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

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Initials
    const initials = label
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(label, x, y + TOKEN_RADIUS + 12);
  });
}

// ─── GameMap Component ─────────────────────────────────────────

export function GameMap() {
  const { mapState, tokens, updateTokenPosition, updateFogRadius, resetPositions, isGM } = useMap();

  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showFog, setShowFog] = useState(false);
  const [dragState, setDragState] = useState<{
    tokenId: string | null;
    offsetX: number;
    offsetY: number;
  }>({ tokenId: null, offsetX: 0, offsetY: 0 });

  const { map_width: W, map_height: H, fog_radius } = mapState;

  // ── Render map canvas ──
  const renderMap = useCallback(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, W, H);

    // Subtle gradient background
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    bg.addColorStop(0, 'rgba(26, 10, 46, 0.3)');
    bg.addColorStop(1, 'rgba(10, 10, 15, 0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    drawGrid(ctx, W, H);
    drawTokens(ctx, tokens);
  }, [W, H, tokens]);

  // ── Render fog canvas ──
  const renderFogLayer = useCallback(() => {
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!showFog || isGM) {
      ctx.clearRect(0, 0, W, H);
      // If showFog is on (player view) but not GM, render fog
      if (showFog) {
        renderFog(ctx, W, H, tokens, fog_radius);
      }
      return;
    }
  }, [W, H, tokens, fog_radius, showFog, isGM]);

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
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Check in reverse order (top-most first)
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
    [tokens],
  );

  // ── Mouse handlers ──
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const hit = findTokenAt(e.clientX, e.clientY);
      if (hit) {
        setDragState({
          tokenId: hit.token.id,
          offsetX: hit.offsetX,
          offsetY: hit.offsetY,
        });
      }
    },
    [findTokenAt],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState.tokenId) return;
      const canvas = mapCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      const x = Math.max(TOKEN_RADIUS, Math.min(W - TOKEN_RADIUS, e.clientX - rect.left - dragState.offsetX));
      const y = Math.max(TOKEN_RADIUS, Math.min(H - TOKEN_RADIUS, e.clientY - rect.top - dragState.offsetY));

      updateTokenPosition(dragState.tokenId, x, y);
    },
    [dragState, W, H, updateTokenPosition],
  );

  const handleMouseUp = useCallback(() => {
    setDragState({ tokenId: null, offsetX: 0, offsetY: 0 });
  }, []);

  return (
    <div className="relative w-full">
      {/* Title */}
      <motion.div
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <MapIcon className="w-5 h-5 text-[#ffd700]" />
        <h2 className="text-lg font-cinzel font-bold text-gold-gradient">
          Battle Map
        </h2>
      </motion.div>

      {/* Map Container */}
      <motion.div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-glass-border"
        style={{ width: W, height: H, maxWidth: '100%' }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Bottom canvas: map + grid + tokens */}
        <canvas
          ref={mapCanvasRef}
          width={W}
          height={H}
          className="absolute inset-0 cursor-crosshair"
          style={{ width: W, height: H }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Top canvas: fog of war */}
        <canvas
          ref={fogCanvasRef}
          width={W}
          height={H}
          className="absolute inset-0 pointer-events-none"
          style={{ width: W, height: H }}
        />

        {/* GM Controls overlay */}
        {isGM && (
          <GMMapControls
            fogRadius={fog_radius}
            onFogRadiusChange={updateFogRadius}
            onResetPositions={resetPositions}
            showFog={showFog}
            onToggleFog={() => setShowFog(!showFog)}
          />
        )}

        {/* Token count indicator */}
        <div className="absolute bottom-3 left-3 glass rounded-lg px-3 py-1.5 flex items-center gap-2">
          <div className="flex -space-x-1">
            {tokens.map((t) => (
              <div
                key={t.id}
                className="w-3 h-3 rounded-full border border-black/50"
                style={{ backgroundColor: t.color }}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">
            {tokens.length} tokens
          </span>
        </div>
      </motion.div>
    </div>
  );
}
