import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

// ── Rate limiter: max 5 attempts per 60 s ──────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function useRateLimit() {
  const attempts = useRef<number[]>([]);

  function check(): { allowed: boolean; waitSeconds: number } {
    const now = Date.now();
    attempts.current = attempts.current.filter((t) => now - t < WINDOW_MS);
    if (attempts.current.length >= MAX_ATTEMPTS) {
      const oldest = attempts.current[0];
      const waitSeconds = Math.ceil((WINDOW_MS - (now - oldest)) / 1000);
      return { allowed: false, waitSeconds };
    }
    attempts.current.push(now);
    return { allowed: true, waitSeconds: 0 };
  }

  return { check };
}

// ── Password strength validator ────────────────────────────
function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number.';
  return null;
}

// ── Sanitise Supabase errors (no email enumeration) ────────
function sanitiseError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials') || lower.includes('wrong password')) {
    return 'Incorrect email or password.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox.';
  }
  if (lower.includes('rate limit') || lower.includes('too many')) {
    return 'Too many attempts. Please wait a minute and try again.';
  }
  if (lower.includes('user not found')) {
    // Don't reveal whether email exists in forgot-password flow
    return 'If that email is registered, a reset link has been sent.';
  }
  return raw;
}

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
  const [cooldown, setCooldown] = useState(0);
  const [hasValidResetSession, setHasValidResetSession] = useState(false);
  const { check: checkRate } = useRateLimit();

  // ── Detect real password-reset redirect from Supabase ──
  // Supabase sets a fragment hash (#access_token=...) or query (?code=...) on redirect.
  // We only show the reset form when such a token is genuinely present.
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    const hasToken =
      hash.includes('type=recovery') ||
      hash.includes('access_token') ||
      params.get('code') !== null;
    if (hasToken) {
      setHasValidResetSession(true);
      setMode('reset');
      // Clean up URL to avoid token leakage via Referer header
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setError('');
    setSuccess('');

    // Rate-limit check (client-side guard)
    const { allowed, waitSeconds } = checkRate();
    if (!allowed) {
      setCooldown(waitSeconds);
      setError(`Too many attempts. Please wait ${waitSeconds}s before trying again.`);
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
      const pwErr = validatePassword(password);
      if (pwErr) { setError(pwErr); setLoading(false); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
      const { error } = await signUp(email, password, name.trim());
      if (error) setError(sanitiseError(error));
      else setSuccess('Check your email for a confirmation link!');

    } else if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(sanitiseError(error));

    } else if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      // Always show the same message to prevent email enumeration
      if (error) {
        const sanitised = sanitiseError(error);
        if (sanitised.startsWith('If that email')) setSuccess(sanitised);
        else setError(sanitised);
      } else {
        setSuccess('If that email is registered, a reset link has been sent. Check your inbox.');
      }

    } else if (mode === 'reset') {
      if (!hasValidResetSession) {
        setError('This reset link is invalid or has expired. Please request a new one.');
        setLoading(false);
        return;
      }
      const pwErr = validatePassword(password);
      if (pwErr) { setError(pwErr); setLoading(false); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
      const { error } = await updatePassword(password);
      if (error) setError(sanitiseError(error));
      else {
        setSuccess('Password updated! You can now sign in.');
        setHasValidResetSession(false);
        setMode('login');
      }
    }

    setLoading(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
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
                {mode === 'signup' && (
                  <InputField
                    icon={<User size={16} />}
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                    maxLength={80}
                    autoFocus
                  />
                )}

                {mode !== 'reset' && (
                  <InputField
                    icon={<Mail size={16} />}
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={setEmail}
                    autoComplete="email"
                    maxLength={254}
                    autoFocus={mode !== 'signup'}
                  />
                )}

                {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
                  <InputField
                    icon={<Lock size={16} />}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={mode === 'reset' ? 'New password (8+ chars, A-Z, 0-9)' : 'Password'}
                    value={password}
                    onChange={setPassword}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    maxLength={128}
                    suffix={
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="text-purple-400 hover:text-purple-200 transition-colors cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                )}

                {(mode === 'signup' || mode === 'reset') && (
                  <InputField
                    icon={<Lock size={16} />}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    maxLength={128}
                  />
                )}

                {/* Password strength hint on signup */}
                {mode === 'signup' && password.length > 0 && (
                  <PasswordStrengthBar password={password} />
                )}

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}
                      role="alert">
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm px-3 py-2 rounded-xl flex items-start gap-2"
                      style={{ background: 'rgba(34,197,94,0.12)', color: '#86efac', border: '1px solid rgba(34,197,94,0.2)' }}
                      role="status">
                      <ShieldCheck size={15} className="shrink-0 mt-0.5" />
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => switchMode('forgot')}
                      className="text-xs text-purple-400 hover:text-purple-200 transition-colors cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  whileHover={!loading && !cooldown ? { scale: 1.02 } : {}}
                  whileTap={!loading && !cooldown ? { scale: 0.98 } : {}}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {cooldown > 0
                    ? `Wait ${cooldown}s…`
                    : mode === 'login' ? '⚔️ Sign In'
                    : mode === 'signup' ? '🌟 Create Account'
                    : mode === 'forgot' ? '📧 Send Reset Email'
                    : '🔑 Update Password'}
                </motion.button>
              </form>

              {(mode === 'login' || mode === 'signup') && (
                <p className="text-center text-sm text-purple-400 mt-5">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-purple-300 font-medium hover:text-white transition-colors cursor-pointer"
                  >
                    {mode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              )}

              {(mode === 'forgot' || mode === 'reset') && (
                <button
                  onClick={() => switchMode('login')}
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

// ── Password strength indicator ────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
      <p className="text-xs" style={{ color: score > 0 ? colors[score - 1] : '#a78bfa' }}>
        {score > 0 ? labels[score - 1] : 'Enter a password'}
        {score < 4 && (
          <span className="text-purple-500 ml-1">
            — {!checks[0] ? '8+ chars ' : ''}{!checks[1] ? 'uppercase ' : ''}{!checks[2] ? 'number ' : ''}{!checks[3] ? 'symbol' : ''}
          </span>
        )}
      </p>
    </div>
  );
}

// ── Input field ────────────────────────────────────────────
function InputField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  suffix,
  autoFocus,
  autoComplete,
  maxLength,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: React.ReactNode;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
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
        autoComplete={autoComplete}
        maxLength={maxLength}
        required
        className="flex-1 bg-transparent text-sm text-white placeholder-purple-400/50"
        style={{ colorScheme: 'dark' }}
      />
      {suffix}
    </div>
  );
}
