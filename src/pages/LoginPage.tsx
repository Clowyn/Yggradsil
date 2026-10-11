import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Shield, Scroll } from 'lucide-react';

export function LoginPage() {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Redirect if already logged in
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen w-full flex bg-[#08090c] arcane-bg relative overflow-hidden">
      {/* Left Column: Dark Fantasy Lore Artwork & Realm Ambiance */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0e1017] overflow-hidden flex-col justify-between p-12 border-r border-amber-900/30">
        {/* Background Artwork */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105 opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: 'url(/assets/login-bg.png)' }}
        />

        {/* Ambient Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#08090c]/60 to-[#08090c] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090c] via-transparent to-[#08090c]/70 pointer-events-none" />

        {/* Floating Hearth Amber Orbs */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-amber-600/15 blur-[120px] pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -20, 30, 0], y: [0, 30, -20, 0], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-rose-900/20 blur-[140px] pointer-events-none"
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-950/40 border border-amber-900/40 flex items-center justify-center text-amber-400 shadow-md">
            <Flame size={22} className="animate-candle-flicker" />
          </div>
          <div>
            <span className="font-cinzel text-base font-extrabold text-amber-100 tracking-wider uppercase">
              YGGDRASIL // REALM
            </span>
            <p className="text-[10px] font-cinzel text-amber-200/60 tracking-wider">
              GRIMDARK FANTASY EXPEDITION OS
            </p>
          </div>
        </div>

        {/* Bottom Chronicle Lore Box */}
        <div className="relative z-10 arcane-glass rounded-2xl p-6 border border-amber-900/30 bg-[#08090c]/85 shadow-2xl">
          <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-amber-900/25">
            <div className="flex items-center gap-2 text-xs font-cinzel text-amber-300 font-bold">
              <Scroll size={15} />
              <span>// CHRONICLES OF THE WORLD TREE</span>
            </div>
            <span className="text-[10px] font-cinzel text-amber-400 flex items-center gap-1 font-semibold">
              <Shield size={12} />
              SANCTUARY READY
            </span>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed font-inter">
            Enter the realm of Yggdrasil. Ancient spell grimoires, tactical expedition war tables, and party chronicles are attuned.
          </p>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative p-6 sm:p-12 bg-[#08090c]">
        {/* Subtle Ambient Radial Light */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.05)_0%,_rgba(8,9,12,1)_100%)] pointer-events-none" />

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
