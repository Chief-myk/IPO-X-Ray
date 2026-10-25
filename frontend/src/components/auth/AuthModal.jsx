import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const INPUT =
  'w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#080808] border border-[#222222] text-white text-sm placeholder:text-[#666666] hover:border-[#333333] focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all';
const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70';

function Field({ id, label, icon: Icon, right, trailing, ...inputProps }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-xs font-medium text-[#AAAAAA]">{label}</label>
        {right}
      </div>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777] pointer-events-none" />
        <input id={id} className={`${INPUT} ${trailing ? 'pr-10' : ''}`} {...inputProps} />
        {trailing}
      </div>
    </div>
  );
}

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, authMode, setAuthMode, login, signup } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const dialogRef = useRef(null);

  const close = () => setIsAuthModalOpen(false);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsAuthModalOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => dialogRef.current?.querySelector('input')?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [isAuthModalOpen, setIsAuthModalOpen]);

  const switchMode = (mode) => {
    setError('');
    setNotice('');
    setShowPassword(false);
    setAuthMode(mode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!email || !email.includes('@')) {
      setError('Please provide a valid investor email address.');
      return;
    }

    if (authMode === 'signup' && !name) {
      setError('Please provide your legal investor name.');
      return;
    }

    if (authMode === 'signup') {
      signup(name, email, password);
    } else if (authMode === 'login') {
      login(email, password);
    } else {
      setAuthMode('login');
      setNotice(`Password reset instructions sent to ${email}.`);
    }
  };

  const handleDemoLogin = () => {
    login('arjun.singhania@fintech-ventures.in', 'securepass123');
  };

  const titles = { login: 'Sign in to Terminal', signup: 'Create Investor Account', forgot: 'Reset Access Credentials' };
  const subtitles = {
    login: 'Access institutional forensic analysis, live agent runs, and real-time portfolio alerts.',
    signup: 'Track IPO filings, monitor post-listing promises, and uncover undisclosed corporate ties.',
    forgot: 'Enter your verified email to receive cryptographically signed recovery credentials.'
  };
  const submitLabels = { login: 'Sign in to Terminal', signup: 'Create Account & Continue', forgot: 'Send Recovery Email' };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isAuthModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-title"
              aria-describedby="auth-desc"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="relative w-full max-w-md my-auto rounded-3xl bg-black border border-[#2A2A2A] shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.15)] p-7 sm:p-9 overflow-hidden text-white"
            >
              {/* Ambient Gold Glow at Top */}
              <div className="pointer-events-none absolute -top-20 inset-x-0 h-40 bg-gradient-to-b from-[#D4AF37]/15 to-transparent blur-2xl" aria-hidden="true" />

              {/* Close */}
              <button
                onClick={close}
                className={`absolute top-5 right-5 p-2 rounded-xl text-[#888888] hover:text-white hover:bg-white/[0.06] transition-colors ${FOCUS}`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="relative mb-6 pr-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#F5E59F] text-[11px] font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Institutional-grade access
                </div>
                <h2 id="auth-title" className="text-2xl font-bold tracking-tight text-white font-['Cinzel']">
                  {titles[authMode]}
                </h2>
                <p id="auth-desc" className="text-xs text-[#888888] mt-1.5 leading-relaxed font-sans">
                  {subtitles[authMode]}
                </p>
              </div>

              {/* Demo login */}
              {authMode === 'login' && (
                <div className="relative mb-5 p-3.5 rounded-2xl bg-[#0A0A0A] border border-[#222222] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Preview access available
                    </p>
                    <p className="text-[11px] text-[#777777]">Instant access with preloaded HNII portfolio.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className={`flex-none px-3.5 py-1.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#F5E59F] border border-[#D4AF37]/40 font-semibold transition-all ${FOCUS}`}
                  >
                    Demo
                  </button>
                </div>
              )}

              {/* Feedback */}
              <AnimatePresence initial={false}>
                {error && (
                  <motion.div
                    key="error"
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-none mt-px" />
                      <span>{error}</span>
                    </div>
                  </motion.div>
                )}
                {notice && (
                  <motion.div
                    key="notice"
                    role="status"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 flex-none mt-px" />
                      <span>{notice}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="relative space-y-4" noValidate>
                {authMode === 'signup' && (
                  <Field
                    id="auth-name"
                    label="Full legal name"
                    icon={User}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arjun Singhania"
                    autoComplete="name"
                    required
                  />
                )}

                <Field
                  id="auth-email"
                  label="Investor email"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investor@domain.com"
                  autoComplete="email"
                  required
                />

                {authMode !== 'forgot' && (
                  <Field
                    id="auth-password"
                    label="Password"
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    right={
                      authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => switchMode('forgot')}
                          className={`text-[11px] text-[#D4AF37] hover:underline rounded ${FOCUS}`}
                        >
                          Forgot password?
                        </button>
                      )
                    }
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#888888] hover:text-white ${FOCUS}`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                )}

                <button
                  type="submit"
                  className={`btn-gold group w-full py-3.5 px-4 rounded-xl font-bold text-sm text-black flex items-center justify-center gap-2 mt-3 cursor-pointer ${FOCUS}`}
                >
                  <span>{submitLabels[authMode]}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              {/* Footer */}
              <div className="relative mt-6 pt-5 border-t border-[#1C1C1C] text-center text-xs text-[#888888]">
                {authMode === 'login' ? (
                  <p>
                    New to IPO X-Ray 360?
                    <button type="button" onClick={() => switchMode('signup')} className={`text-[#D4AF37] font-semibold hover:underline ml-1.5 rounded ${FOCUS}`}>
                      Create an account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an investor account?
                    <button type="button" onClick={() => switchMode('login')} className={`text-[#D4AF37] font-semibold hover:underline ml-1.5 rounded ${FOCUS}`}>
                      Sign in
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
