import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

import TickerBar from './components/common/TickerBar';
import Header from './components/common/Header';
import Footer from './components/Footer';

import HomePage from './pages/HomePage';
import IpoDetailPage from './pages/IpoDetailPage';
import ApplyPage from './pages/ApplyPage';
import ApplicationsPage from './pages/ApplicationsPage';
import PortfolioPage from './pages/PortfolioPage';
import AutoSpyPage from './pages/AutoSpyPage';
import ScannerPage from './pages/ScannerPage';
import SettingsPage from './pages/SettingsPage';

import AuthModal from './components/auth/AuthModal';
import OnboardingModal from './components/auth/OnboardingModal';
import FinancialChatbot from './components/FinancialChatbot';

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ live: false, sample: 'Kalindi Smart Mobility Limited', llm: false }));
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-black text-white font-sans selection:bg-[#D4AF37]/35 selection:text-white flex flex-col justify-between">
            {/* Top Market Telemetry Ticker Strip */}
            <TickerBar />

            {/* Main Luxury Black & Gold Header Navigation */}
            <Header health={health} />

            {/* Global User Modals */}
            <AuthModal />
            <OnboardingModal />

            {/* Dedicated Multi-Page Routed Viewport */}
            <main className="flex-1 max-w-[1480px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
              <Routes>
                <Route path="/" element={<ScannerPage health={health} />} />
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="/ipos" element={<Navigate to="/dashboard" replace />} />
                <Route path="/screener" element={<Navigate to="/dashboard" replace />} />
                <Route path="/ipo/:id" element={<IpoDetailPage />} />
                <Route path="/apply/:id" element={<ApplyPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/autospy" element={<AutoSpyPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Context-aware RAG Chatbot Drawer */}
            <FinancialChatbot />

            {/* Global Toast Alerts in Luxury Black & Gold */}
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              theme="dark"
              toastStyle={{
                backgroundColor: '#0A0A0A',
                border: '1px solid #D4AF37',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.9), 0 0 20px rgba(212,175,55,0.2)'
              }}
            />

            {/* Footer in Deep Black with Gold Accents */}
            <Footer />
          </div>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

