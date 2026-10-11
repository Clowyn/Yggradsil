import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { playSound } from '../../lib/audio';
import { useAuth } from '../../contexts/AuthContext';
import { translations } from '../../lib/translations';

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface FireParticleOverlayProps {
  onComplete: () => void;
  durationSeconds?: number;
}

export function FireParticleOverlay({
  onComplete,
  durationSeconds = 2.6,
}: FireParticleOverlayProps) {
  const { locale } = useAuth();
  const t = translations[locale] || translations.en;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    playSound('fire_blast');

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

    const particles: FireParticle[] = [];
    const colors = ['#ffffff', '#ffea79', '#ff9800', '#ff5722', '#e60000', '#900c3f'];

    const startTime = performance.now();
    const totalMs = durationSeconds * 1000;

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalMs);
      const intensity = 1 - Math.pow(progress, 1.8); // Fades down smoothly

      ctx.clearRect(0, 0, width, height);

      // Dark fire atmospheric backdrop fading out
      ctx.fillStyle = `rgba(15, 4, 3, ${0.85 * intensity})`;
      ctx.fillRect(0, 0, width, height);

      if (intensity > 0.05) {
        // Spawn fresh fire particles from bottom screen
        const spawnCount = Math.floor(25 * intensity);
        for (let i = 0; i < spawnCount; i++) {
          const maxLife = 40 + Math.random() * 50;
          particles.push({
            x: Math.random() * width,
            y: height + Math.random() * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: -4 - Math.random() * 7,
            radius: 8 + Math.random() * 24 * intensity,
            alpha: 0.9,
            life: 0,
            maxLife,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + (Math.random() - 0.5) * 1.5;
        p.y += p.vy;
        p.radius *= 0.96;
        p.alpha = Math.max(0, (1 - p.life / p.maxLife) * intensity);

        if (p.life >= p.maxLife || p.alpha <= 0 || p.radius <= 0.5) {
          particles.splice(i, 1);
          continue;
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.5, p.color);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(render);
      } else {
        onComplete();
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [durationSeconds, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Roaring title flash during first second */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [0.8, 1.2, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 1.8, times: [0, 0.4, 1] }}
        className="relative z-10 text-center pointer-events-none"
      >
        <h1 className="font-cinzel text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-t from-orange-600 via-amber-400 to-yellow-100 drop-shadow-[0_0_35px_rgba(245,158,11,0.9)] tracking-widest uppercase">
          {t.arena.combatEngaged}
        </h1>
        <p className="font-cinzel text-amber-200/90 text-sm tracking-widest mt-2">
          {t.arena.flamesDecide}
        </p>
      </motion.div>

      {/* Skip button in corner */}
      <button
        type="button"
        onClick={onComplete}
        className="absolute top-6 right-6 z-20 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-amber-500/30 text-amber-300 text-xs font-cinzel font-bold transition-all cursor-pointer backdrop-blur-md"
      >
        {t.arena.skip} ✕
      </button>
    </motion.div>
  );
}
