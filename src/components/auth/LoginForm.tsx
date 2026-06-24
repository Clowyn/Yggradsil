import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold-dim/10 border border-gold/30 mb-4"
          >
            <Sparkles size={28} className="text-gold" />
          </motion.div>
          <h2 className="text-3xl font-cinzel text-gold-gradient">
            Enter the Realm
          </h2>
          <p className="text-parchment-dim text-sm mt-2 font-inter">
            Sign in to continue your adventure
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-inter text-parchment/70 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adventurer@realm.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-glass-border text-parchment placeholder:text-parchment-dim/50 font-inter text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-inter text-parchment/70 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-glass-border text-parchment placeholder:text-parchment-dim/50 font-inter text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all duration-300"
                required
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-crimson text-xs font-inter text-center bg-crimson/10 border border-crimson/20 rounded-lg py-2"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,215,0,0.3)' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-gold-dim via-gold to-gold-dim text-abyss font-cinzel font-bold text-sm tracking-wider uppercase shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-abyss/30 border-t-abyss rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-glass-border to-transparent" />
          <span className="text-[11px] text-parchment-dim font-inter uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-glass-border to-transparent" />
        </div>

        {/* Toggle to register */}
        <p className="text-center text-sm font-inter text-parchment/60">
          New adventurer?{' '}
          <button
            onClick={onToggle}
            className="text-gold hover:text-gold-bright underline underline-offset-4 transition-colors duration-200 font-medium"
          >
            Create an account
          </button>
        </p>
      </div>
    </motion.div>
  );
}
