import React, { createContext, useContext, useState, useEffect } from 'react';
import { IPO_CATALOG } from '../data/ipoCatalog';

const AppContext = createContext(null);

const STORAGE_APPS_KEY = 'ipoxray_user_applications';
const STORAGE_WATCH_KEY = 'ipoxray_user_watchlist';

const INITIAL_APPLICATIONS = [
  {
    id: 'app_1092831',
    ipoId: 'kalindi-smart-mobility',
    companyName: 'Kalindi Smart Mobility Limited',
    board: 'NSE Emerge SME',
    category: 'Retail Individual Investor (RII)',
    lots: 1,
    quantity: 1600,
    bidPrice: 90,
    amount: 144000,
    upiId: 'arjun.singhania@okhdfcbank',
    applicationNo: 'NSE-SME-2026-98102',
    status: 'Allotment Awaited', // 'Draft' | 'Submitted' | 'Allotment Awaited' | 'Fully Allotted' | 'Not Allotted' | 'Listed'
    allotmentStatus: 'Pending Registrar Announcement',
    appliedAt: '2026-10-16 11:24 IST',
    allotmentDate: '2026-10-20',
    refundDate: '2026-10-21',
    registrar: 'Bigshare Services Pvt Ltd',
    registrarUrl: 'https://www.bigshareonline.com/ipo_Allotment.html',
    riskWarning: 'Critical forensic flag on promoter vendor concentration detected prior to allotment.'
  },
  {
    id: 'app_1092832',
    ipoId: 'bajaj-housing-finance',
    companyName: 'Bajaj Housing Finance Limited',
    board: 'NSE Mainboard',
    category: 'Retail Individual Investor (RII)',
    lots: 1,
    quantity: 214,
    bidPrice: 70,
    amount: 14980,
    upiId: 'arjun.singhania@okhdfcbank',
    applicationNo: 'BSE-MAIN-2024-44109',
    status: 'Fully Allotted',
    allotmentStatus: 'Allotted 214 Shares @ ₹70',
    appliedAt: '2024-09-10 14:15 IST',
    allotmentDate: '2024-09-12',
    refundDate: '2024-09-13',
    registrar: 'KFin Technologies Limited',
    registrarUrl: 'https://kosmic.kfintech.com/ipostatus/',
    sharesAllotted: 214,
    currentPrice: 132.40,
    listingGainPct: 114.2
  }
];

const INITIAL_WATCHLIST = ['kalindi-smart-mobility', 'premier-clean-energies', 'cybercore-technologies'];

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('discovery'); // 'discovery' | 'detail' | 'applications' | 'portfolio' | 'autospy' | 'live-scan'
  const [selectedIpo, setSelectedIpo] = useState(IPO_CATALOG[0]);
  const [activeDetailTab, setActiveDetailTab] = useState('overview'); // 'overview' | 'documents' | 'risk' | 'debate' | 'hype' | 'timemachine' | 'simulator' | 'network' | 'dates'

  const [applications, setApplications] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_APPS_KEY);
      return stored ? JSON.parse(stored) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  const [watchlist, setWatchlist] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_WATCH_KEY);
      return stored ? JSON.parse(stored) : INITIAL_WATCHLIST;
    } catch {
      return INITIAL_WATCHLIST;
    }
  });

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyTargetIpo, setApplyTargetIpo] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_APPS_KEY, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_WATCH_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (ipoId) => {
    setWatchlist((prev) => 
      prev.includes(ipoId) ? prev.filter((id) => id !== ipoId) : [...prev, ipoId]
    );
  };

  const openIpoDetail = (ipo, tab = 'overview') => {
    setSelectedIpo(ipo);
    setActiveDetailTab(tab);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startApplyFlow = (ipo) => {
    setApplyTargetIpo(ipo);
    setIsApplyModalOpen(true);
  };

  const recordApplication = (appRecord) => {
    setApplications((prev) => [appRecord, ...prev]);
    setIsApplyModalOpen(false);
    setCurrentView('applications');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedIpo,
        setSelectedIpo,
        activeDetailTab,
        setActiveDetailTab,
        applications,
        watchlist,
        toggleWatchlist,
        openIpoDetail,
        isApplyModalOpen,
        setIsApplyModalOpen,
        applyTargetIpo,
        startApplyFlow,
        recordApplication
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

