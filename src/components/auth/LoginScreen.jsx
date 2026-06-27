import { useState } from 'react';
import { Heart, Mail, Lock, ArrowRight, Sparkles, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

export default function LoginScreen() {
  const { signInWithMagicLink, signInWithPassword, signUp, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState('password'); // 'magic' | 'password' | 'signup'
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setLocalError('');
    const { error } = await signInWithMagicLink(email.trim());
    setLoading(false);
    if (!error) setMagicLinkSent(true);
  };

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setLocalError('');

    if (mode === 'signup') {
      if (!displayName.trim()) {
        setLocalError('Please enter your name');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email.trim(), password.trim(), displayName.trim());
      setLoading(false);
      if (!error) {
        setSignUpSuccess(true);
      }
    } else {
      const { error } = await signInWithPassword(email.trim(), password.trim());
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  // Magic link sent state
  if (magicLinkSent) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 app-bg">
        <div className="orb w-64 h-64 bg-rose-500/10 top-10 -left-20 animate-float" />
        <div className="animate-scale-in text-center max-w-sm mx-auto relative z-10">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow-2xl shadow-rose-500/30 rotate-6">
            <Mail className="w-10 h-10 text-white -rotate-6" />
          </div>
          <h2 className="text-3xl font-display font-semibold text-white mb-3">Check your inbox</h2>
          <p className="text-white/50 leading-relaxed mb-8 text-[15px]">
            We sent a magic link to <span className="text-rose-400 font-medium">{email}</span>.
            <br />Tap it to sign in.
          </p>
          <button onClick={() => setMagicLinkSent(false)} className="text-sm text-white/30 hover:text-white/50 transition-colors underline underline-offset-4">
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // Sign up success state
  if (signUpSuccess) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 app-bg">
        <div className="orb w-64 h-64 bg-emerald-500/10 top-10 -left-20 animate-float" />
        <div className="animate-scale-in text-center max-w-sm mx-auto relative z-10">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-display font-semibold text-white mb-3">Almost there!</h2>
          <p className="text-white/50 leading-relaxed mb-8 text-[15px]">
            Check <span className="text-emerald-400 font-medium">{email}</span> to confirm your account, then come back and sign in.
          </p>
          <button
            onClick={() => { setSignUpSuccess(false); setMode('password'); }}
            className="text-sm text-rose-400/70 hover:text-rose-400 transition-colors font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-8 app-bg overflow-auto safe-top safe-bottom">
      {/* Decorative orbs */}
      <div className="orb w-72 h-72 bg-violet-500/8 top-0 left-0 animate-float" />
      <div className="orb w-56 h-56 bg-rose-500/6 bottom-0 right-0 animate-float" style={{ animationDelay: '3s' }} />
      <div className="orb w-32 h-32 bg-gold-500/5 top-1/3 right-0 animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="relative w-full max-w-[340px] mx-auto animate-fade-in z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-rose-400 via-pink-500 to-violet-500 flex items-center justify-center shadow-2xl shadow-rose-500/25 rotate-3">
              <Heart className="w-9 h-9 text-white -rotate-3" fill="white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shadow-lg animate-pulse-soft">
              <Sparkles className="w-2.5 h-2.5 text-plum-900" />
            </div>
          </div>
          <h1 className="text-[2.5rem] font-display font-semibold text-white mb-1 leading-tight">
            Whisper
          </h1>
          <p className="text-white/30 text-[13px] tracking-wide">
            Your couple diary, together ❤️
          </p>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'magic' ? handleMagicLink : handlePasswordAuth} className="space-y-3">
          {/* Display name (signup only) */}
          {mode === 'signup' && (
            <div className="relative group animate-slide-down">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-rose-400/60 transition-colors" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="name"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 text-[15px] focus:outline-none focus:border-rose-400/30 focus:bg-white/[0.06] transition-all duration-300"
              />
            </div>
          )}

          {/* Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-rose-400/60 transition-colors" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 text-[15px] focus:outline-none focus:border-rose-400/30 focus:bg-white/[0.06] transition-all duration-300"
            />
          </div>

          {/* Password */}
          {mode !== 'magic' && (
            <div className="relative group animate-slide-down">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-rose-400/60 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 text-[15px] focus:outline-none focus:border-rose-400/30 focus:bg-white/[0.06] transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          )}

          {/* Error */}
          {displayError && (
            <div className="p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/10 text-red-400/90 text-sm animate-scale-in leading-relaxed">
              {displayError}
            </div>
          )}

          {/* Submit */}
          <div className="pt-1">
            <Button type="submit" size="lg" loading={loading} className="w-full !py-4 !rounded-2xl !text-[15px] !font-semibold">
              {mode === 'magic' && 'Send Magic Link'}
              {mode === 'password' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>

        {/* Mode switcher */}
        <div className="mt-7 flex flex-col items-center gap-2.5">
          {mode === 'magic' ? (
            <button onClick={() => setMode('password')} className="text-[13px] text-white/25 hover:text-white/45 transition-colors">
              Use password instead
            </button>
          ) : mode === 'password' ? (
            <>
              <button onClick={() => setMode('signup')} className="text-[13px] text-rose-400/50 hover:text-rose-400/80 transition-colors font-medium">
                Don't have an account? Sign up
              </button>
              <button onClick={() => setMode('magic')} className="text-[13px] text-white/20 hover:text-white/40 transition-colors">
                Use magic link instead
              </button>
            </>
          ) : (
            <button onClick={() => setMode('password')} className="text-[13px] text-white/25 hover:text-white/45 transition-colors">
              Already have an account? Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
