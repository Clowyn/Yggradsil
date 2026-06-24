import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Redirect if already logged in
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen w-full flex bg-abyss">
      {/* Left Column: Artwork */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-void overflow-hidden">
        {/* The artwork image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105"
          style={{ backgroundImage: 'url(/assets/login-bg.png)' }}
        />
        
        {/* Gradient overlay for blending */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-abyss/20 to-abyss" />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-transparent to-abyss/40" />

        {/* Floating orbs */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-arcane/30 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -20, 30, 0], y: [0, 30, -20, 0], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gold/20 blur-[120px]"
        />
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative p-8 bg-abyss">
        {/* Subtle background effects for right column */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(26,10,46,0.4)_0%,_rgba(10,10,15,1)_100%)] lg:bg-none" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,215,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content Container to guarantee centering */}
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
