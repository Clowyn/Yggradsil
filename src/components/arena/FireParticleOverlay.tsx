import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame, Swords } from 'lucide-react';
import { playSound } from '../../lib/audio';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

interface FlamePlume {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  stretch: number;
  life: number;
  maxLife: number;
  phase: number;
  turbulence: number;
  kind: 'flame' | 'smoke' | 'core';
}

interface EmberSpark {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  phase: number;
  hue: number; // 15 (crimson-orange) to 52 (gold-white)
}

interface FireParticleOverlayProps {
  onComplete?: () => void;
  durationSeconds?: number;
  mode?: 'inferno' | 'ambient';
}

/**
 * Computes realistic blackbody fire color stops based on normalized particle age (t in 0..1)
 */
function getFlameGradientStops(t: number, intensity: number): {
  inner: string;
  mid: string;
  outer: string;
} {
  const alpha = Math.max(0, Math.sin(Math.min(1, t * 3.2) * Math.PI * 0.5) * Math.pow(1 - t, 1.35) * intensity);
  if (t < 0.22) {
    // White-hot / incandescent yellow core (3000K+)
    return {
      inner: `rgba(255, 253, 232, ${alpha * 0.95})`,
      mid: `rgba(255, 214, 79, ${alpha * 0.78})`,
      outer: `rgba(255, 111, 0, 0)`,
    };
  }
  if (t < 0.55) {
    // Blazing orange-amber tongue (1800K-2400K)
    return {
      inner: `rgba(255, 200, 64, ${alpha * 0.88})`,
      mid: `rgba(255, 94, 14, ${alpha * 0.68})`,
      outer: `rgba(198, 26, 9, 0)`,
    };
  }
  // Cooling crimson tip transitioning to dark ember (1000K-1400K)
  return {
    inner: `rgba(255, 87, 34, ${alpha * 0.72})`,
    mid: `rgba(183, 28, 28, ${alpha * 0.45})`,
    outer: `rgba(62, 10, 10, 0)`,
  };
}

export function FireParticleOverlay({
  onComplete,
  durationSeconds = 2.8,
  mode = 'inferno',
}: FireParticleOverlayProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === 'inferno') {
      playSound('fire_blast');
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const plumes: FlamePlume[] = [];
    const sparks: EmberSpark[] = [];

    const startTime = performance.now();
    const totalMs = durationSeconds * 1000;

    // Seed initial roaring fire bed for instant visual impact in inferno mode
    if (mode === 'inferno') {
      for (let i = 0; i < 65; i++) {
        const maxLife = 36 + Math.random() * 44;
        plumes.push({
          x: Math.random() * width,
          y: height - Math.random() * (height * 0.35),
          vx: (Math.random() - 0.5) * 3.5,
          vy: -5 - Math.random() * 9,
          radius: 26 + Math.random() * 52,
          stretch: 1.5 + Math.random() * 1.4,
          life: Math.random() * 14,
          maxLife,
          phase: Math.random() * Math.PI * 2,
          turbulence: 1.8 + Math.random() * 3.2,
          kind: i % 5 === 0 ? 'smoke' : i % 4 === 0 ? 'core' : 'flame',
        });
      }
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = height - Math.random() * (height * 0.5);
        sparks.push({
          x,
          y,
          prevX: x,
          prevY: y + 8,
          vx: (Math.random() - 0.5) * 6,
          vy: -6 - Math.random() * 12,
          size: 1.4 + Math.random() * 2.8,
          life: Math.random() * 20,
          maxLife: 45 + Math.random() * 55,
          phase: Math.random() * Math.PI * 2,
          hue: 18 + Math.random() * 34,
        });
      }
    }

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = mode === 'inferno' ? Math.min(1, elapsed / totalMs) : 0.35;
      const intensity =
        mode === 'inferno'
          ? Math.max(0, 1 - Math.pow(progress, 1.85))
          : 0.48 + 0.08 * Math.sin(now * 0.003);

      ctx.clearRect(0, 0, width, height);

      if (mode === 'inferno') {
        // 1. Atmospheric Dark Obsidian + Ember Vignette Backdrop
        ctx.fillStyle = `rgba(10, 4, 4, ${0.88 * intensity})`;
        ctx.fillRect(0, 0, width, height);

        // 2. Ignition Shockwave Ring (first 950ms)
        if (elapsed < 950) {
          const shockT = elapsed / 950;
          const shockRadius = Math.max(width, height) * 0.65 * Math.pow(shockT, 0.65);
          const shockAlpha = (1 - shockT) * 0.45;
          const shockGrad = ctx.createRadialGradient(
            width * 0.5,
            height * 0.55,
            Math.max(1, shockRadius * 0.65),
            width * 0.5,
            height * 0.55,
            Math.max(2, shockRadius)
          );
          shockGrad.addColorStop(0, 'rgba(255, 140, 0, 0)');
          shockGrad.addColorStop(0.75, `rgba(255, 165, 38, ${shockAlpha})`);
          shockGrad.addColorStop(0.9, `rgba(255, 240, 180, ${shockAlpha * 1.2})`);
          shockGrad.addColorStop(1, 'rgba(255, 60, 0, 0)');
          ctx.fillStyle = shockGrad;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // 3. Roaring Magma Hearth Glow along the bottom edge
      const hearthHeight = mode === 'inferno' ? height * (0.48 * intensity + 0.12) : height * 0.28;
      const hearthGrad = ctx.createLinearGradient(0, height, 0, height - hearthHeight);
      const pulse = 0.9 + 0.1 * Math.sin(now * 0.014);
      hearthGrad.addColorStop(
        0,
        mode === 'inferno'
          ? `rgba(255, 185, 65, ${0.72 * intensity * pulse})`
          : `rgba(255, 110, 20, ${0.22 * pulse})`
      );
      hearthGrad.addColorStop(
        0.35,
        mode === 'inferno'
          ? `rgba(235, 68, 12, ${0.52 * intensity})`
          : `rgba(180, 32, 8, 0.12)`
      );
      hearthGrad.addColorStop(1, 'rgba(20, 4, 2, 0)');
      ctx.fillStyle = hearthGrad;
      ctx.fillRect(0, height - hearthHeight, width, hearthHeight);

      // 4. Spawn New Volumetric Plumes & Ember Sparks
      if (intensity > 0.05) {
        const plumeSpawnCount =
          mode === 'inferno' ? Math.floor(28 * intensity) : Math.random() < 0.65 ? 2 : 1;

        for (let i = 0; i < plumeSpawnCount; i++) {
          const isSmoke = Math.random() < (mode === 'inferno' ? 0.18 : 0.12);
          const isCore = !isSmoke && Math.random() < 0.26;
          const maxLife = isSmoke ? 55 + Math.random() * 45 : 32 + Math.random() * 38;
          // Concentrate flames slightly toward two brazier columns + center clash
          const spawnX =
            Math.random() < 0.35
              ? width * (0.5 + (Math.random() - 0.5) * 0.45)
              : Math.random() * width;

          plumes.push({
            x: spawnX,
            y: height + 18 + Math.random() * 24,
            vx: (Math.random() - 0.5) * (mode === 'inferno' ? 3.2 : 1.5),
            vy: isSmoke
              ? -2.8 - Math.random() * 3.8
              : mode === 'inferno'
              ? -5.5 - Math.random() * 9.5 * intensity
              : -2.2 - Math.random() * 3.5,
            radius: isSmoke
              ? 35 + Math.random() * 55
              : isCore
              ? 18 + Math.random() * 28 * intensity
              : (mode === 'inferno' ? 24 : 14) + Math.random() * 42 * intensity,
            stretch: isSmoke ? 1.15 : 1.55 + Math.random() * 1.45,
            life: 0,
            maxLife,
            phase: Math.random() * Math.PI * 2,
            turbulence: 1.5 + Math.random() * 3.2,
            kind: isSmoke ? 'smoke' : isCore ? 'core' : 'flame',
          });
        }

        const sparkSpawnCount =
          mode === 'inferno' ? Math.floor(14 * intensity) : Math.random() < 0.85 ? 2 : 1;
        for (let i = 0; i < sparkSpawnCount; i++) {
          const sx = Math.random() * width;
          const sy = height + Math.random() * 10;
          sparks.push({
            x: sx,
            y: sy,
            prevX: sx,
            prevY: sy + 6,
            vx: (Math.random() - 0.5) * 5.5,
            vy: (mode === 'inferno' ? -7 : -3.2) - Math.random() * (mode === 'inferno' ? 11 : 5.5),
            size: 1.2 + Math.random() * 2.6,
            life: 0,
            maxLife: 45 + Math.random() * 65,
            phase: Math.random() * Math.PI * 2,
            hue: 16 + Math.random() * 36,
          });
        }
      }

      // 5. PASS A: Render Dark Volumetric Smoke Plumes (source-over)
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      for (let i = plumes.length - 1; i >= 0; i--) {
        const p = plumes[i];
        if (p.kind !== 'smoke') continue;

        p.life++;
        const ageRatio = p.life / p.maxLife;
        if (ageRatio >= 1) {
          plumes.splice(i, 1);
          continue;
        }

        const curl =
          Math.sin(p.y * 0.012 + now * 0.005 + p.phase) * p.turbulence * 0.9;
        p.x += p.vx + curl;
        p.y += p.vy;
        p.radius *= 1.008; // Smoke expands as it rises

        const smokeAlpha =
          Math.sin(ageRatio * Math.PI) * (mode === 'inferno' ? 0.24 : 0.11) * intensity;
        if (smokeAlpha <= 0.005) continue;

        const smokeGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        smokeGrad.addColorStop(0, `rgba(28, 12, 10, ${smokeAlpha})`);
        smokeGrad.addColorStop(0.6, `rgba(18, 8, 8, ${smokeAlpha * 0.6})`);
        smokeGrad.addColorStop(1, 'rgba(10, 5, 5, 0)');

        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 6. PASS B: Render Curl-Turbulent Stretched Flame Tongues (lighter additive)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = plumes.length - 1; i >= 0; i--) {
        const p = plumes[i];
        if (p.kind === 'smoke') continue;

        p.life++;
        const ageRatio = p.life / p.maxLife;
        if (ageRatio >= 1 || p.radius <= 1.2) {
          plumes.splice(i, 1);
          continue;
        }

        // Dual-frequency vortex turbulence + upward thermal buoyancy
        const vortex =
          Math.sin(p.y * 0.018 + now * 0.008 + p.phase) * p.turbulence +
          Math.cos(p.x * 0.011 - now * 0.006) * (p.turbulence * 0.45);
        const stepX = p.vx + vortex;
        const stepY = p.vy;

        p.x += stepX;
        p.y += stepY;
        p.vy -= 0.06; // Thermal buoyancy accelerates upward
        p.radius *= p.kind === 'core' ? 0.968 : 0.974; // Tapers to a sharp flame tongue tip

        const effectiveT = p.kind === 'core' ? ageRatio * 0.45 : ageRatio;
        const stops = getFlameGradientStops(effectiveT, intensity);

        // Rotate and stretch each flame tongue along its velocity vector
        const angle = Math.atan2(stepY, stepX) + Math.PI * 0.5;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.scale(1, p.stretch);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius);
        grad.addColorStop(0, stops.inner);
        grad.addColorStop(0.48, stops.mid);
        grad.addColorStop(1, stops.outer);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 7. PASS C: Render High-Velocity Glowing Ember Sparks with Motion Trails
      ctx.lineCap = 'round';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life++;
        const ageRatio = s.life / s.maxLife;
        if (ageRatio >= 1) {
          sparks.splice(i, 1);
          continue;
        }

        s.prevX = s.x;
        s.prevY = s.y;

        const draft = Math.sin(s.y * 0.025 + now * 0.01 + s.phase) * 2.4;
        s.x += s.vx + draft;
        s.y += s.vy;
        s.vy *= 0.992;

        // Flickering ember luminescence
        const flicker = 0.55 + 0.45 * Math.sin(now * 0.03 + s.phase * 3);
        const sparkAlpha = Math.max(0, (1 - ageRatio) * flicker * intensity);
        if (sparkAlpha <= 0.02) continue;

        // Motion-blur ember streak
        ctx.strokeStyle = `hsla(${s.hue}, 100%, 68%, ${sparkAlpha * 0.85})`;
        ctx.lineWidth = s.size;
        ctx.beginPath();
        ctx.moveTo(s.prevX, s.prevY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        // Hot white-gold spark head
        ctx.fillStyle = `hsla(${s.hue + 10}, 100%, 88%, ${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      if (mode === 'inferno') {
        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(render);
        } else {
          onComplete?.();
        }
      } else {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [durationSeconds, mode, onComplete]);

  if (mode === 'ambient') {
    return (
      <canvas
        ref={canvasRef}
        data-testid="arena-ambient-fire-canvas"
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      data-testid="arena-inferno-overlay"
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden"
    >
      {/* Hidden SVG Filter for Real-Time Thermal Convection Heat Haze */}
      <svg className="sr-only" aria-hidden="true">
        <defs>
          <filter id="arena-heat-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015 0.045"
              numOctaves="2"
              seed="7"
              result="heatNoise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.015 0.045;0.022 0.065;0.015 0.045"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="heatNoise"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <canvas
        ref={canvasRef}
        data-testid="arena-inferno-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Roaring Coliseum Clash Crest & Heat-Shimmering Title */}
      <motion.div
        initial={{ scale: 0.78, opacity: 0, y: 18 }}
        animate={{ scale: [0.78, 1.12, 1.02], opacity: [0, 1, 0], y: [18, 0, -10] }}
        transition={{ duration: 2.2, times: [0, 0.38, 1], ease: 'easeOut' }}
        className="relative z-10 text-center pointer-events-none px-4"
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-orange-950/70 border border-amber-400/50 text-amber-200 text-xs font-cinzel font-bold uppercase tracking-[0.3em] mb-4 shadow-[0_0_30px_rgba(255,115,0,0.65)]">
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <span>BLOOD &amp; EMBER COLISEUM</span>
          <Swords className="w-4 h-4 text-amber-300" />
        </div>

        <h1
          style={{ filter: 'url(#arena-heat-distortion)' }}
          className="font-cinzel text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-t from-red-600 via-orange-400 to-yellow-100 drop-shadow-[0_0_45px_rgba(255,120,0,0.95)] tracking-widest uppercase"
        >
          {t.arena.combatEngaged}
        </h1>
        <p className="font-cinzel text-amber-200/95 text-xs sm:text-sm tracking-[0.28em] uppercase mt-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
          {t.arena.flamesDecide}
        </p>
      </motion.div>

      {/* Skip button in corner */}
      <button
        type="button"
        data-testid="skip-inferno-btn"
        onClick={onComplete}
        className="pointer-events-auto absolute top-6 right-6 z-20 px-3.5 py-2 rounded-xl bg-black/70 hover:bg-black/90 border border-amber-500/40 text-amber-200 text-xs font-cinzel font-bold transition-all cursor-pointer backdrop-blur-md shadow-lg"
      >
        {t.arena.skip} ✕
      </button>
    </motion.div>
  );
}
