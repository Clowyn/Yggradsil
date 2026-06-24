import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Sword } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterFormProps {
  onToggle: () => void;
}

export function RegisterForm({ onToggle }: RegisterFormProps) {
  const { signUp, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await signUp(email, password, username);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-arcane/20 to-shadow border border-arcane/30 mb-4"
          >
            <Sword size={28} className="text-arcane" />
          </motion.div>
          <h2 className="text-3xl font-cinzel text-gold-gradient">
            Join the Guild
          </h2>
          <p className="text-parchment-dim text-sm mt-2 font-inter">
            Create your adventurer profile
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-inter text-parchment/70 uppercase tracking-wider">
              Character Name
            </label>
            <div className="relative">
              <User
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-parchment-dim"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Aragorn the Brave"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-glass-border text-parchment placeholder:text-parchment-dim/50 font-inter text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/30 transition-all duration-300"
                required
              />
            </div>
          </div>

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
                minLength={6}
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
                <UserPlus size={16} />
                Create Account
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

        {/* Toggle to login */}
        <p className="text-center text-sm font-inter text-parchment/60">
          Already have an account?{' '}
          <button
            onClick={onToggle}
            className="text-gold hover:text-gold-bright underline underline-offset-4 transition-colors duration-200 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
}
