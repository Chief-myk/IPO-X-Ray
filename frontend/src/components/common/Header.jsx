import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  Compass,
  Layers,
  Briefcase,
  ShieldAlert,
  SlidersHorizontal,
  LogOut,
  ChevronDown
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', end: true, label: 'Home', short: 'Home', icon: Activity },
  { to: '/dashboard', label: 'IPO Screener & Dashboard', short: 'IPOs', icon: Compass },
  { to: '/applications', label: 'Applications', short: 'Applications', icon: Layers, badge: 'applications' },
  { to: '/portfolio', label: 'Portfolio Surveillance', short: 'Portfolio', icon: Briefcase },
  { to: '/autospy', label: 'AutoSpy', short: 'AutoSpy', icon: ShieldAlert }
];

const FOCUS = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70';

export default function Header({ health }) {
  const { user, isLoggedIn, setIsAuthModalOpen, logout } = useAuth();
  const { applications } = useApp();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isLive = health?.live;
  const isHealthy = health !== null;

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsUserMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setIsUserMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isUserMenuOpen]);

  const initials =
    user?.avatar ||
    (user?.name ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'AS');

  const badgeCount = (item) => (item.badge === 'applications' ? applications.length : 0);

  return (
    <MotionConfig reducedMotion="user">
      <header className="sticky top-0 z-40 w-full">
        {/* Primary Luxury Glass Header on Pure Black */}
        <div className="relative flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 py-3 bg-black/95 backdrop-blur-2xl border-b border-[#1A1A1A] shadow-xl shadow-black/80">
          {/* Metallic Gold Hairline Bottom Edge */}
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-px h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent"
            aria-hidden="true"
          />

          {/* Brand / Logo */}
          <Link to="/" className={`group flex items-center gap-3 no-underline flex-none rounded-xl ${FOCUS}`} aria-label="IPO X-Ray 360 Home">
            <div className="relative grid place-items-center w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-br from-[#1A1A1A] via-[#0E0E0E] to-[#040404] border border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.22)] transition-all duration-300 group-hover:border-[#D4AF37] group-hover:shadow-[0_0_28px_rgba(212,175,55,0.4)] group-hover:scale-105">
              <svg viewBox="0 0 32 32" className="w-5 h-5" aria-hidden="true">
                <path d="M7 9h18M7 16h12M7 23h15" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                <rect x="4" y="14.5" width="24" height="3" fill="#D4AF37" rx="1.5" />
              </svg>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-['Cinzel'] tracking-wider font-extrabold text-base sm:text-lg bg-gradient-to-r from-white via-[#F5E59F] to-[#D4AF37] bg-clip-text text-transparent">
                  IPO X-RAY
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] leading-3 font-mono font-bold bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5E59F]">
                  360
                </span>
              </div>
              <span className="hidden sm:block text-[9.5px] font-sans font-medium text-[#888888] tracking-widest uppercase">
                Institutional Intelligence
              </span>
            </div>
          </Link>

          {/* Center Navigation — active sliding gold pill */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold" aria-label="Terminal Navigation">
            {NAV_ITEMS.map(({ to, end, label, icon: Icon, iconTone, ...item }) => {
              const count = badgeCount(item);
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${FOCUS} ${
                      isActive ? 'text-[#F5E59F] font-bold' : 'text-[#888888] hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="desktop-nav-pill"
                          className="absolute inset-0 rounded-xl bg-[#D4AF37]/12 border border-[#D4AF37]/35 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        />
                      )}
                      <span className="relative flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${iconTone || ''}`} />
                        <span>{label}</span>
                        {count > 0 && (
                          <span className="px-1.5 rounded-full text-[10px] leading-4 font-mono bg-[#D4AF37]/25 text-[#F5E59F] border border-[#D4AF37]/40">
                            {count}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-none">
            {/* Health Status Badge */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#222222] bg-[#0A0A0A] backdrop-blur-md text-xs transition-colors hover:border-[#D4AF37]/40"
              role="status"
              title={
                !isHealthy
                  ? 'Checking TinyFish API status...'
                  : isLive
                  ? 'TinyFish web agent network active'
                  : 'Sample mode: Add TINYFISH_API_KEY in backend/.env for live autonomous web agents'
              }
            >
              <span className="relative flex w-2 h-2">
                {isHealthy && isLive && (
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping motion-reduce:animate-none" />
                )}
                <span
                  className={`relative inline-flex w-2 h-2 rounded-full transition-all duration-300 ${
                    !isHealthy
                      ? 'bg-neutral-500 animate-pulse'
                      : isLive
                      ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                      : 'bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.7)]'
                  }`}
                />
              </span>
              <span className="font-mono text-[10px] hidden sm:inline">
                {!isHealthy ? (
                  <span className="text-[#888888]">Checking…</span>
                ) : isLive ? (
                  <span className="text-emerald-400 font-medium">Agents Live</span>
                ) : (
                  <span className="text-[#F5E59F] font-medium">Sample Mode</span>
                )}
              </span>
            </div>

            {/* User Account Button & Dropdown */}
            {isLoggedIn ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsUserMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0E0E0E] hover:bg-[#161616] border text-xs transition-all ${FOCUS} ${
                    isUserMenuOpen ? 'border-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-[#222222]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F5E59F] font-bold font-mono grid place-items-center text-[10px]">
                    {initials}
                  </div>
                  <span className="text-white font-medium hidden sm:inline max-w-[110px] truncate">
                    {user?.name || 'Investor'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#888888] transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      role="menu"
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      style={{ transformOrigin: 'top right' }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0A0A0A] border border-[#262626] shadow-2xl shadow-black p-2.5 z-50 text-xs"
                    >
                      <div className="p-3 border-b border-[#1E1E1E] mb-1.5 bg-[#050505] rounded-xl">
                        <p className="font-bold text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-[#888888] truncate">{user?.email}</p>
                        {user?.tier && (
                          <span className="inline-block mt-2 text-[10px] font-mono font-semibold text-[#F5E59F] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/35">
                            {user.tier}
                          </span>
                        )}
                      </div>

                      {[
                        { to: '/settings', icon: SlidersHorizontal, tone: 'text-[#D4AF37]', label: 'Investment Mandate' },
                        { to: '/applications', icon: Layers, tone: 'text-[#F5E59F]', label: 'My Applications' },
                        { to: '/portfolio', icon: Briefcase, tone: 'text-emerald-400', label: 'Portfolio Surveillance' }
                      ].map(({ to, icon: Icon, tone, label }) => (
                        <Link
                          key={to}
                          to={to}
                          role="menuitem"
                          onClick={() => setIsUserMenuOpen(false)}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-[#A0A0A0] hover:text-white hover:bg-white/[0.05] transition-colors no-underline ${FOCUS}`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${tone}`} />
                          <span>{label}</span>
                        </Link>
                      ))}

                      <div className="pt-1.5 border-t border-[#1E1E1E] mt-1.5">
                        <button
                          role="menuitem"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-left ${FOCUS}`}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className={`btn-gold px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${FOCUS}`}
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Tab Navigation Bar */}
        <nav className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 bg-black/95 backdrop-blur-xl border-b border-[#1A1A1A] overflow-x-auto text-xs font-semibold no-scrollbar" aria-label="Mobile Navigation">
          {NAV_ITEMS.map(({ to, end, short, icon: Icon, iconTone, ...item }) => {
            const count = badgeCount(item);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${FOCUS} ${
                    isActive ? 'text-[#F5E59F] font-bold' : 'text-[#888888]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-nav-pill"
                        className="absolute inset-0 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 ${iconTone || ''}`} />
                      {short}
                      {count > 0 && <span className="font-mono text-[10px] text-[#F5E59F] bg-[#D4AF37]/20 px-1 rounded-full">{count}</span>}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </header>
    </MotionConfig>
  );
}
