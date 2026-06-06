import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

function Particles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(${139 + Math.floor(Math.random() * 80)},${60 + Math.floor(Math.random() * 80)},246,${0.3 + Math.random() * 0.5})`,
          }}
          animate={{ y: [0, -(30 + Math.random() * 50), 0], opacity: [0, 1, 0] }}
          transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 6, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export function AuthPage() {
  const { signIn, signUp, resetPassword, updatePassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Detect password-reset redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') setMode('reset');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
      const { error } = await signUp(email, password, name.trim());
      if (error) setError(error);
      else setSuccess('Check your email for a confirmation link!');
    } else if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      if (error) setError(error);
      else setSuccess('Password reset email sent! Check your inbox.');
    } else if (mode === 'reset') {
      if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
      const { error } = await updatePassword(password);
      if (error) setError(error);
      else { setSuccess('Password updated! You can now log in.'); setMode('login'); }
    }

    setLoading(false);
  }

  const titles: Record<Mode, string> = {
    login: 'Welcome back',
    signup: 'Begin your quest',
    forgot: 'Reset your password',
    reset: 'Set new password',
  };

  const subtitles: Record<Mode, string> = {
    login: 'Sign in to continue your adventure',
    signup: 'Create an account to track your quests',
    forgot: "Enter your email and we'll send a reset link",
    reset: 'Enter your new password',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <Particles />

      {/* Glow orbs */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(219,39,119,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 float"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 40px rgba(139,92,246,0.5)' }}
          >
            ⚔️
          </motion.div>
          <h1 className="text-3xl font-bold text-white">TodoQuest</h1>
          <p className="text-purple-300 text-sm mt-1">Gamified Productivity</p>
        </div>

        {/* Card */}
        <div className="glass p-8" style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 48px rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">{titles[mode]}</h2>
                <p className="text-purple-300 text-sm mt-0.5">{subtitles[mode]}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name (signup only) */}
                {mode === 'signup' && (
                  <InputField
                    icon={<User size={16} />}
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={setName}
                    autoFocus
                  />
                )}

                {/* Email */}
                {mode !== 'reset' && (
                  <InputField
                    icon={<Mail size={16} />}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={setEmail}
                    autoFocus={mode !== 'signup'}
                  />
                )}

                {/* Password */}
                {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                  <InputField
                    icon={<Lock size={16} />}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'reset' ? 'New password' : 'Password'}
                    value={password}
                    onChange={setPassword}
                    suffix={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="text-purple-400 hover:text-purple-200 transition-colors cursor-pointer">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                )}

                {/* Confirm password */}
                {(mode === 'signup' || mode === 'reset') && (
                  <InputField
                    icon={<Lock size={16} />}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                )}

                {/* Error / success */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}>
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot password link */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                      className="text-xs text-purple-400 hover:text-purple-200 transition-colors cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {mode === 'login' ? '⚔️ Sign In' : mode === 'signup' ? '🌟 Create Account' : mode === 'forgot' ? '📧 Send Reset Email' : '🔑 Update Password'}
                </motion.button>
              </form>

              {/* Toggle login / signup */}
              {(mode === 'login' || mode === 'signup') && (
                <p className="text-center text-sm text-purple-400 mt-5">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
                    className="text-purple-300 font-medium hover:text-white transition-colors cursor-pointer"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              )}

              {/* Back to login */}
              {(mode === 'forgot' || mode === 'reset') && (
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-200 transition-colors mx-auto mt-4 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back to sign in
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  suffix,
  autoFocus,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
      onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.5)')}
      onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
    >
      <span className="text-purple-400 shrink-0">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        required
        className="flex-1 bg-transparent text-sm text-white placeholder-purple-400/50"
        style={{ colorScheme: 'dark' }}
      />
      {suffix}
    </div>
  );
}
