import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { Cpu, Terminal, Radio } from 'lucide-react';

export function LoginPage() {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Redirect if already logged in
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen w-full flex bg-abyss cyber-grid-bg relative overflow-hidden">
      {/* Top Laser Scanning Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent pointer-events-none z-50 opacity-80" />

      {/* Left Column: Futuristic Cyber Artwork / HUD Terminal */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-void overflow-hidden flex-col justify-between p-12 border-r border-gold/20">
        {/* Background Artwork */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105 opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: 'url(/assets/login-bg.png)' }}
        />
        
        {/* Cyber Grid & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-abyss/40 to-abyss pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-abyss/60 pointer-events-none" />
        <div className="absolute inset-0 cyber-scanlines pointer-events-none" />

        {/* Floating Futuristic Quantum Orbs */}
        <motion.div
          animate={{ x: [0, 40, -30, 0], y: [0, -50, 30, 0], opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gold/20 blur-[110px] pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -30, 40, 0], y: [0, 40, -30, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-arcane/25 blur-[130px] pointer-events-none"
        />

        {/* Top Terminal Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-obsidian border border-gold/40 flex items-center justify-center text-gold shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Cpu size={20} />
          </div>
          <div>
            <span className="font-orbitron text-sm font-bold text-gold tracking-widest uppercase">
              YGGDRASIL // NEXUS
            </span>
            <p className="text-[10px] font-mono text-parchment-dim tracking-wider">
              QUANTUM TACTICAL OPERATING SYSTEM v4.2
            </p>
          </div>
        </div>

        {/* Bottom Telemetry HUD */}
        <div className="relative z-10 cyber-panel rounded-md p-5 border border-gold/30 bg-black/60">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-glass-border">
            <div className="flex items-center gap-2 text-xs font-mono text-gold font-bold">
              <Terminal size={14} />
              <span>// SYSTEM_SPECIFICATION</span>
            </div>
            <span className="text-[10px] font-mono text-emerald flex items-center gap-1 font-semibold">
              <Radio size={11} className="animate-pulse" />
              AUTHENTICATED GATEWAY
            </span>
          </div>
          <p className="text-xs font-rajdhani text-parchment/80 leading-relaxed">
            Welcome to the Next-Generation D&D Companion. Neural stat matrices, quantum spell trees, orbital sector maps, and real-time biometric synchronizations are active.
          </p>
        </div>
      </div>

      {/* Right Column: High-Tech Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative p-6 sm:p-12 bg-abyss">
        {/* Subtle Cyber Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,240,255,0.06)_0%,_rgba(3,6,18,1)_100%)] pointer-events-none" />

        {/* Content Container */}
        <div className="w-full max-w-md relative z-10 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <LoginForm key="login" onToggle={() => setIsLogin(false)} />
            ) : (
              <RegisterForm key="register" onToggle={() => setIsLogin(true)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
