import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ShieldCheck, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { playSound } from '../../lib/audio';

interface LoginFormProps {
  onToggle: () => void;
}

export function LoginForm({ onToggle }: LoginFormProps) {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      playSound('lock_click');
      await signIn(email, password);
    } catch (err: unknown) {
      playSound('stone_tap');
      setError(err instanceof Error ? err.message : 'Authentication failure. Check your credentials.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto"
    >
      <div className="arcane-glass rounded-2xl p-7 sm:p-9 shadow-2xl border border-amber-900/35 bg-[#0e1017]/90">
        {/* Sanctum Header */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, delay: 0.15 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-900/40 text-amber-400 mb-3.5 shadow-md"
          >
            <ShieldCheck size={26} />
          </motion.div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-cinzel text-amber-400 mb-1">
            <Flame size={12} className="animate-candle-flicker" />
            <span>ENTER THE REALM</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-cinzel text-gold-gradient font-black tracking-wider uppercase">
            SANCTUM PORTAL
          </h2>
          <p className="text-stone-400 text-xs mt-1.5 font-inter tracking-wide">
            Sign in to continue your adventure
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-cinzel text-amber-200/80 uppercase tracking-wider flex items-center justify-between">
              <span>TRAVELER EMAIL</span>
              <span className="text-stone-500 text-[9px] font-inter">REQUIRED</span>
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adventurer@yggdrasil.realm"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-amber-900/30 text-amber-100 placeholder:text-stone-600 font-inter text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 shadow-inner transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-cinzel text-amber-200/80 uppercase tracking-wider flex items-center justify-between">
              <span>SECRET CIPHER</span>
              <span className="text-stone-500 text-[9px] font-inter">ENCRYPTED</span>
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-amber-900/30 text-amber-100 placeholder:text-stone-600 font-inter text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 shadow-inner transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-rose-300 text-xs font-inter text-center bg-rose-950/30 border border-rose-900/40 rounded-xl py-2 px-3 tracking-wide"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 text-black font-cinzel font-extrabold text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={15} />
                ENTER THE REALM
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" />
          <span className="text-[10px] text-amber-200/40 font-cinzel uppercase tracking-widest">
            OR
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" />
        </div>

        {/* Toggle */}
        <p className="text-center text-xs font-inter text-stone-400">
          New adventurer?{' '}
          <button
            onClick={() => {
              playSound('paper_flip');
              onToggle();
            }}
            className="text-amber-400 hover:text-amber-200 font-cinzel font-bold underline underline-offset-4 transition-colors cursor-pointer"
          >
            INSCRIBE YOUR NAME
          </button>
        </p>
      </div>
    </motion.div>
  );
}
