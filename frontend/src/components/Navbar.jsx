import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, 
  Layers, 
  Search, 
  Sparkles, 
  Briefcase, 
  ShieldAlert, 
  User, 
  LogOut, 
  SlidersHorizontal,
  Compass,
  ArrowUpRight
} from 'lucide-react';

export default function Navbar({ health }) {
  const { currentView, setCurrentView, applications } = useApp();
  const { user, isLoggedIn, setIsAuthModalOpen, setIsOnboardingOpen, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isLive = health?.live;
  const isHealthy = health !== null;

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300">
      {/* Primary Glass Header */}
      <div className="relative flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-2.5 bg-[#09131C]/90 backdrop-blur-2xl backdrop-saturate-150 border-b border-[#27435E]/60 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        {/* Animated laser hairline on bottom edge */}
        <div 
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-beam/70 to-transparent" 
          aria-hidden="true" 
        />

        {/* Brand / Logo */}
        <button
          onClick={() => setCurrentView('discovery')}
          className="group flex items-center gap-2.5 sm:gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beam/60 rounded-xl flex-none"
          aria-label="IPO X-Ray 360 Home"
        >
          {/* Logo Badge with Multi-layered Depth */}
          <div className="relative grid place-items-center w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-gradient-to-br from-[#1C3650] via-[#13273B] to-[#0A1724] border border-[#27435E]/90 shadow-[0_0_20px_rgba(127,216,232,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(127,216,232,0.55)] group-hover:scale-105 group-hover:border-beam/50">
            <svg viewBox="0 0 32 32" className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" aria-hidden="true">
              <path d="M7 9h18M7 16h12M7 23h15" stroke="#E6EDF2" strokeWidth="2.4" strokeLinecap="round" fill="none" />
              <rect x="4" y="14.5" width="24" height="3" fill="#7FD8E8" opacity="0.9" rx="1.5" />
            </svg>
            <div className="absolute inset-0 rounded-xl bg-beam/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-['Bricolage_Grotesque'] font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-bone via-[#EAFBFF] to-beam bg-clip-text text-transparent">
                IPO X-Ray
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono tracking-wider font-semibold uppercase bg-beam/10 border border-beam/25 text-beam">
                360
              </span>
            </div>
            <span className="hidden sm:block text-[9px] font-mono text-bone-dim tracking-wider uppercase -mt-0.5">
              Investor Intelligence
            </span>
          </div>
        </button>

        {/* Center Primary Product Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold" aria-label="Primary Navigation">
          <button
            onClick={() => setCurrentView('discovery')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'discovery' || currentView === 'detail'
                ? 'bg-beam/15 text-beam border border-beam/35 shadow-[0_0_12px_rgba(127,216,232,0.15)]'
                : 'text-bone-dim hover:text-bone hover:bg-film-2/60 border border-transparent'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>IPO Discovery</span>
          </button>

          <button
            onClick={() => setCurrentView('applications')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'applications'
                ? 'bg-beam/15 text-beam border border-beam/35 shadow-[0_0_12px_rgba(127,216,232,0.15)]'
                : 'text-bone-dim hover:text-bone hover:bg-film-2/60 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Applications</span>
            {applications.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300">
                {applications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentView('portfolio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'portfolio'
                ? 'bg-beam/15 text-beam border border-beam/35 shadow-[0_0_12px_rgba(127,216,232,0.15)]'
                : 'text-bone-dim hover:text-bone hover:bg-film-2/60 border border-transparent'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Portfolio & Reality Gap</span>
          </button>

          <button
            onClick={() => setCurrentView('autospy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'autospy'
                ? 'bg-beam/15 text-beam border border-beam/35 shadow-[0_0_12px_rgba(127,216,232,0.15)]'
                : 'text-bone-dim hover:text-bone hover:bg-film-2/60 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>AutoSpy</span>
          </button>

          <button
            onClick={() => setCurrentView('live-scan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              currentView === 'live-scan'
                ? 'bg-beam/15 text-beam border border-beam/35 shadow-[0_0_12px_rgba(127,216,232,0.15)]'
                : 'text-bone-dim hover:text-bone hover:bg-film-2/60 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>DRHP Scanner</span>
          </button>
        </nav>

        {/* Right actions: Telemetry + User Auth */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-none">
          {/* Health Status Telemetry Badge */}
          <div 
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#27435E]/80 bg-[#122232]/70 backdrop-blur-md shadow-inner text-xs transition-colors hover:border-beam/40"
            title={!isHealthy ? 'Checking TinyFish API status...' : isLive ? 'TinyFish web agent network active' : 'Sample mode: Add TINYFISH_API_KEY in backend/.env for live autonomous web agents'}
          >
            <span className="relative flex w-2 h-2">
              {isHealthy && isLive && (
                <span className="absolute inline-flex w-full h-full rounded-full bg-clear opacity-75 animate-ping" />
              )}
              <span
                className={`relative inline-flex w-2 h-2 rounded-full transition-all duration-300 ${
                  !isHealthy
                    ? 'bg-unverified animate-pulse'
                    : isLive
                    ? 'bg-clear shadow-[0_0_10px_rgba(143,224,174,0.7)]'
                    : 'bg-medium shadow-[0_0_10px_rgba(255,194,61,0.6)]'
                }`}
              />
            </span>
            <span className="font-mono text-[10px] text-bone-dim hidden sm:inline">
              {!isHealthy ? (
                'Checking…'
              ) : isLive ? (
                <span className="text-clear font-medium flex items-center gap-1">
                  Agents live
                </span>
              ) : (
                <span className="text-medium font-medium">Sample mode</span>
              )}
            </span>
          </div>

          {/* User Account Button & Dropdown */}
          {isLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-film-2/80 hover:bg-film-3 border border-line transition-all text-xs"
              >
                <div className="w-6 h-6 rounded-lg bg-beam/20 border border-beam/40 text-beam font-bold font-mono grid place-items-center text-[10px]">
                  {user?.avatar || 'AS'}
                </div>
                <span className="text-bone font-medium hidden lg:inline max-w-[120px] truncate">
                  {user?.name || 'Investor'}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0E1C29] border border-line shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                  <div className="p-2.5 border-b border-line/60 mb-1">
                    <p className="font-bold text-bone truncate">{user?.name}</p>
                    <p className="text-[11px] text-bone-dim truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-mono text-beam px-1.5 py-0.2 rounded bg-beam/10 border border-beam/25">
                      {user?.tier}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsOnboardingOpen(true);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-bone-dim hover:text-bone hover:bg-white/5 transition-colors text-left"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-beam" />
                    <span>Investment Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setCurrentView('applications');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-bone-dim hover:text-bone hover:bg-white/5 transition-colors text-left"
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>My Applications</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setCurrentView('portfolio');
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-bone-dim hover:text-bone hover:bg-white/5 transition-colors text-left"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-clear" />
                    <span>Portfolio Surveillance</span>
                  </button>

                  <div className="pt-1 border-t border-line/60 mt-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-critical hover:bg-critical/10 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-beam hover:bg-beam/90 text-[#08131C] shadow-[0_2px_12px_rgba(127,216,232,0.3)] transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Secondary Tab Navigation Bar */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-[#0A141E] border-b border-line overflow-x-auto text-xs font-semibold no-scrollbar">
        <button
          onClick={() => setCurrentView('discovery')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${currentView === 'discovery' ? 'bg-beam/15 text-beam' : 'text-bone-dim'}`}
        >
          Discovery
        </button>
        <button
          onClick={() => setCurrentView('applications')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${currentView === 'applications' ? 'bg-beam/15 text-beam' : 'text-bone-dim'}`}
        >
          Applications ({applications.length})
        </button>
        <button
          onClick={() => setCurrentView('portfolio')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${currentView === 'portfolio' ? 'bg-beam/15 text-beam' : 'text-bone-dim'}`}
        >
          Portfolio
        </button>
        <button
          onClick={() => setCurrentView('autospy')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${currentView === 'autospy' ? 'bg-beam/15 text-beam' : 'text-bone-dim'}`}
        >
          AutoSpy
        </button>
        <button
          onClick={() => setCurrentView('live-scan')}
          className={`px-3 py-1 rounded-lg whitespace-nowrap ${currentView === 'live-scan' ? 'bg-beam/15 text-beam' : 'text-bone-dim'}`}
        >
          DRHP Scanner
        </button>
      </div>
    </header>
  );
}
