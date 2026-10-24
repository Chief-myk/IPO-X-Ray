import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Methodology from './components/Methodology';
import Cases from './components/Cases';
import LiveInvestigation from './components/LiveInvestigation';
import XRay from './components/xray/XRay';
import Shield from './components/xray/Shield';
import Report from './components/Report';
import Footer from './components/Footer';
import AgentDebate from './components/AgentDebate';
import InvestmentSimulator from './components/InvestmentSimulator';
import PromiseTracker from './components/PromiseTracker';
import FinancialChatbot from './components/FinancialChatbot';

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'unverified', 'clear'];

export default function App() {
  const [health, setHealth] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investigation, setInvestigation] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const eventSourceRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const audioRef = useRef(null);
  const lastAudioPlayRef = useRef(0);

  const playRiskSound = () => {
    const now = Date.now();
    if (now - lastAudioPlayRef.current < 2500) return;
    lastAudioPlayRef.current = now;

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn('Audio playback prevented by browser policy:', err);
      });
    }
  };

  // Fetch API Health on startup
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth({ live: false, sample: 'Kalindi Smart Mobility Limited', llm: false }));
  }, []);

  // Cleanup EventSource & timer on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartInvestigation = async ({ company, file, demo }) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('company', company);
      fd.append('demo', demo ? 'true' : 'false');
      if (file) fd.append('drhp', file);

      const res = await fetch('/api/investigations', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Could not start the investigation.');
      }

      // Initialize Investigation State
      startTimeRef.current = performance.now();
      setElapsedTime(0);

      const newInv = {
        id: data.id,
        company: data.company,
        demo: data.demo,
        phase: 'read',
        phaseLabel: 'Reading the offer document…',
        claims: [],
        lanes: {},
        score: 0,
        flags: [],
        report: null,
        stats: { agents: 0, steps: 0 },
      };

      setInvestigation(newInv);

      // Start Timer
      timerRef.current = setInterval(() => {
        setElapsedTime((performance.now() - startTimeRef.current) / 1000);
      }, 100);

      // Scroll smoothly to the live case section
      setTimeout(() => {
        document.getElementById('case')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Connect to SSE Stream
      const es = new EventSource(`/api/investigations/${data.id}/stream`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const ev = JSON.parse(event.data);
          handleStreamEvent(ev);
        } catch {
          // Heartbeat / ping
        }
      };

      es.addEventListener('end', () => {
        es.close();
        if (timerRef.current) clearInterval(timerRef.current);
      });

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStreamEvent = (ev) => {
    setInvestigation((prev) => {
      if (!prev) return prev;

      switch (ev.type) {
        case 'phase':
          return {
            ...prev,
            phase: ev.phase,
            phaseLabel: ev.label,
          };

        case 'claims':
          return {
            ...prev,
            claims: ev.claims.map((c) => ({
              ...c,
              worst: null,
              open: 0,
              state: 'pending',
            })),
          };

        case 'agent_start': {
          const a = ev.agent;
          const newLanes = {
            ...prev.lanes,
            [a.id]: {
              id: a.id,
              claim_id: a.claim_id,
              label: a.label,
              target: a.target,
              steps: [],
              liveUrl: null,
              sev: null,
              topTitle: null,
              elapsed: 0,
              finished: false,
              startTime: performance.now(),
            },
          };

          const newClaims = prev.claims.map((c) => {
            if (c.id === a.claim_id) {
              return { ...c, open: (c.open || 0) + 1, state: 'checking' };
            }
            return c;
          });

          return {
            ...prev,
            lanes: newLanes,
            claims: newClaims,
            stats: { ...prev.stats, agents: prev.stats.agents + 1 },
          };
        }

        case 'agent_step': {
          const lane = prev.lanes[ev.id];
          if (!lane) return prev;

          const updatedLane = {
            ...lane,
            steps: [...lane.steps, { text: ev.text, error: !!ev.error }],
            elapsed: Math.round((performance.now() - lane.startTime) / 1000),
          };

          return {
            ...prev,
            lanes: { ...prev.lanes, [ev.id]: updatedLane },
            stats: { ...prev.stats, steps: prev.stats.steps + 1 },
          };
        }

        case 'agent_live': {
          const lane = prev.lanes[ev.id];
          if (!lane) return prev;
          return {
            ...prev,
            lanes: { ...prev.lanes, [ev.id]: { ...lane, liveUrl: ev.url } },
          };
        }

        case 'agent_done': {
          const lane = prev.lanes[ev.id];
          if (!lane) return prev;

          const findings = ev.findings || [];
          const topFinding = findings[0] || null;
          const sev = topFinding?.severity || 'clear';

          const updatedLane = {
            ...lane,
            finished: true,
            sev,
            topTitle: topFinding?.title || '',
            elapsed: Math.round((performance.now() - lane.startTime) / 1000),
          };

          const newClaims = prev.claims.map((c) => {
            if (c.id === lane.claim_id) {
              const newOpen = Math.max(0, (c.open || 1) - 1);
              const curWorst = c.worst;
              const newWorst =
                curWorst === null || SEV_ORDER.indexOf(sev) < SEV_ORDER.indexOf(curWorst)
                  ? sev
                  : curWorst;
              return {
                ...c,
                open: newOpen,
                worst: newWorst,
                state: newOpen <= 0 ? (newWorst || 'clear') : 'checking',
              };
            }
            return c;
          });

          return {
            ...prev,
            lanes: { ...prev.lanes, [ev.id]: updatedLane },
            claims: newClaims,
          };
        }

        case 'score': {
          if (ev.score >= 60) {
            toast.error("too risky to invest", {
              toastId: `risk-live-${prev.company || 'score'}`,
              position: "top-right",
              autoClose: 5000,
              theme: "dark",
            });
            playRiskSound();
          }
          return {
            ...prev,
            score: ev.score,
            flags: ev.flags || [],
          };
        }

        case 'report': {
          const rep = ev.report;
          if (rep && (rep.score >= 60 || rep.probability >= 0.6)) {
            toast.error("too risky to invest", {
              toastId: `risk-report-${rep.company || 'inv'}`,
              position: "top-right",
              autoClose: 6000,
              theme: "dark",
            });
            playRiskSound();
          }

          // Scroll smoothly to the completed report section
          setTimeout(() => {
            document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);

          return {
            ...prev,
            phase: 'report',
            phaseLabel: `Completed in ${ev.report?.elapsed}s.`,
            report: ev.report,
          };
        }

        case 'error': {
          return {
            ...prev,
            phaseLabel: `Stopped: ${ev.message}`,
          };
        }

        default:
          return prev;
      }
    });
  };

  const handleReset = () => {
    document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('company')?.focus();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-film text-bone font-sans selection:bg-beam/30 selection:text-bone">
      {/* Risk Alert Audio */}
      <audio ref={audioRef} src="/fahhh.mp3" preload="auto" />

      {/* Toast Notification Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: '#121C26',
          border: '1px solid #FF5A4E',
          color: '#F6F5EE',
          boxShadow: '0 10px 30px -5px rgba(255, 90, 78, 0.35)',
          borderRadius: '12px',
        }}
      />

      {/* Navigation */}
      <Navbar health={health} />

      {/* Main Content */}
      <main>
        {/* Hero with Scanner & DRHP Form */}
        <Hero
          onStart={handleStartInvestigation}
          isLive={health?.live}
          isSubmitting={isSubmitting}
        />

        {/* Methodology: One agent per claim */}
        <Methodology />

        {/* Real-world SME IPO Case Studies */}
        <Cases />

        {/* Promoter network, vendor scorecards, live watch */}
        <XRay />
        <Shield />

        {/* Live Investigation Monitor */}
        {investigation && (
          <LiveInvestigation
            investigation={investigation}
            elapsedTime={elapsedTime}
          />
        )}

        {/* Final Risk Report */}
        {investigation?.report && (
          <Report
            report={investigation.report}
            onReset={handleReset}
            onHighRisk={playRiskSound}
          />
        )}

        {/* 1. Agent Debate (Bull vs Bear) */}
        <AgentDebate 
          currentCompany={investigation?.company} 
          investigationId={investigation?.id} 
        />

        {/* 2. Investment Decision Simulator */}
        <InvestmentSimulator 
          currentCompany={investigation?.company} 
          riskScore={investigation?.score} 
        />

        {/* 4. IPO Promise Tracker */}
        <PromiseTracker 
          currentCompany={investigation?.company} 
        />
      </main>

      {/* 3. AI Financial Chatbot (Context-aware RAG drawer) */}
      <FinancialChatbot 
        currentCompany={investigation?.company} 
        investigationId={investigation?.id} 
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}