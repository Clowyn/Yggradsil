import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, Terminal, Sparkles } from 'lucide-react';
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
      setError('Password cipher must contain at least 6 characters.');
      return;
    }
    try {
      await signUp(email, password, username);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Check network link.');
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
      <div className="cyber-panel cyber-cut rounded-lg p-7 sm:p-9 shadow-2xl border border-gold/40 bg-black/80">
        {/* Terminal Header */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, delay: 0.15 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-md bg-arcane/15 border border-arcane/40 text-arcane mb-3.5 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            <Sparkles size={26} />
          </motion.div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-arcane mb-1">
            <Terminal size={11} />
            <span>// PROTOCOL: NEW_OPERATOR_ENROLLMENT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-orbitron text-gold-gradient font-black tracking-wider uppercase">
            OPERATOR ENROLL
          </h2>
          <p className="text-parchment-dim text-xs mt-1.5 font-rajdhani tracking-wide">
            Register your biometric profile with Nexus
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Operator Callsign / Username */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-gold/80 uppercase tracking-widest flex items-center justify-between">
              <span>[OPERATOR_CALLSIGN]</span>
              <span className="text-parchment-dim text-[9px]">VISIBLE ID</span>
            </label>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-parchment-dim"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Cipher_99"
                className="w-full pl-10 pr-4 py-2.5 rounded bg-black/60 border border-gold/30 text-white placeholder:text-parchment-dim/40 font-mono text-xs focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 shadow-inner transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-gold/80 uppercase tracking-widest flex items-center justify-between">
              <span>[OPERATOR_EMAIL]</span>
              <span className="text-parchment-dim text-[9px]">ENCRYPTED</span>
            </label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-parchment-dim"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@nexus.net"
                className="w-full pl-10 pr-4 py-2.5 rounded bg-black/60 border border-gold/30 text-white placeholder:text-parchment-dim/40 font-mono text-xs focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 shadow-inner transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-gold/80 uppercase tracking-widest flex items-center justify-between">
              <span>[PASSKEY_CIPHER]</span>
              <span className="text-parchment-dim text-[9px]">MIN 6 CHARS</span>
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-parchment-dim"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded bg-black/60 border border-gold/30 text-white placeholder:text-parchment-dim/40 font-mono text-xs focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 shadow-inner transition-all duration-200"
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
              className="text-crimson text-xs font-mono text-center bg-crimson/15 border border-crimson/30 rounded py-2 px-3 tracking-wide"
            >
              [ERROR]: {error}
            </motion.p>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded bg-gradient-to-r from-arcane via-purple-400 to-arcane text-white font-orbitron font-extrabold text-xs tracking-widest uppercase shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={15} />
                REGISTER BIOMETRIC ID
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <span className="text-[10px] text-parchment-dim font-mono uppercase tracking-widest">
            // OR //
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Toggle */}
        <p className="text-center text-xs font-rajdhani text-parchment/70">
          Already registered?{' '}
          <button
            onClick={onToggle}
            className="text-gold hover:text-white font-mono font-bold underline underline-offset-4 transition-colors cursor-pointer"
          >
            AUTHENTICATE KEY
          </button>
        </p>
      </div>
    </motion.div>
  );
}
