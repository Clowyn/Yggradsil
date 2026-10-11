import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Mail, Lock, ShieldCheck, Terminal } from 'lucide-react';
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failure. Check quantum credentials.');
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
            className="inline-flex items-center justify-center w-14 h-14 rounded-md bg-gold/10 border border-gold/40 text-gold mb-3.5 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            <ShieldCheck size={26} />
          </motion.div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-gold mb-1">
            <Terminal size={11} />
            <span>// ACCESS_PROTOCOL: AUTH_NODE_01</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-orbitron text-gold-gradient font-black tracking-wider uppercase">
            NEURAL GATEWAY
          </h2>
          <p className="text-parchment-dim text-xs mt-1.5 font-rajdhani tracking-wide">
            Authenticate quantum key to initialize uplink
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-gold/80 uppercase tracking-widest flex items-center justify-between">
              <span>[OPERATOR_EMAIL]</span>
              <span className="text-parchment-dim text-[9px]">REQUIRED</span>
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
              <span className="text-parchment-dim text-[9px]">ENCRYPTED</span>
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
            className="w-full py-3 rounded bg-gradient-to-r from-gold via-cyan-300 to-gold text-black font-orbitron font-extrabold text-xs tracking-widest uppercase shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={15} />
                INITIALIZE NEURAL LINK
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
          Unregistered operator?{' '}
          <button
            onClick={onToggle}
            className="text-gold hover:text-white font-mono font-bold underline underline-offset-4 transition-colors cursor-pointer"
          >
            CREATE PROTOCOL PROFILE
          </button>
        </p>
      </div>
    </motion.div>
  );
}
