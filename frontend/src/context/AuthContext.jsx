import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ipoxray_auth_user';
const PREFS_KEY = 'ipoxray_user_preferences';

const DEFAULT_PREFERENCES = {
  investmentHorizon: 'Medium (6-18 Months)',
  riskTolerance: 'Balanced (Calculated SME & Growth)',
  preferredSectors: ['Solar PV Modules & Renewable EPC', 'Smart Transit & IoT Infrastructure', 'Cybersecurity & Defense AI'],
  maxAllocationPerIpo: 150000,
  enableSme: true,
  enableRiskAlerts: true,
  dematDetails: {
    dpName: 'Zerodha Broking Ltd',
    dpId: '12081600',
    beneficiaryId: '04821932',
    upiId: 'investor@oksbi'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        id: 'usr_premium_investor',
        name: 'Arjun Singhania',
        email: 'arjun.singhania@fintech-ventures.in',
        avatar: 'AS',
        tier: 'Institutional / HNII Member',
        joinedDate: 'Jan 2026',
        isLoggedIn: true
      };
    } catch {
      return null;
    }
  });

  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(PREFS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot'

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const login = (email, password) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      avatar: email.substring(0, 2).toUpperCase(),
      tier: 'Pro Investor Tier',
      joinedDate: 'October 2026',
      isLoggedIn: true
    };
    setUser(newUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const signup = (name, email, password) => {
    const newUser = {
      id: `usr_${Date.now()}`,
      name: name || 'Investor',
      email,
      avatar: (name || 'IN').substring(0, 2).toUpperCase(),
      tier: 'Standard Investor',
      joinedDate: 'October 2026',
      isLoggedIn: true
    };
    setUser(newUser);
    setIsAuthModalOpen(false);
    setIsOnboardingOpen(true); // Open preferences onboarding for newly registered investor
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const updatePreferences = (newPrefs) => {
    setPreferences((prev) => ({ ...prev, ...newPrefs }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoggedIn: Boolean(user?.isLoggedIn),
        isOnboardingOpen,
        setIsOnboardingOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        login,
        signup,
        logout,
        updatePreferences
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

