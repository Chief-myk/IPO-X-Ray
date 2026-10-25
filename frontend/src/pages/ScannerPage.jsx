import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Hero from '../components/Hero';
import LiveInvestigation from '../components/LiveInvestigation';
import Report from '../components/Report';
import Methodology from '../components/Methodology';
import Cases from '../components/Cases';
import { Activity, ShieldAlert, ChevronRight } from 'lucide-react';

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'unverified', 'clear'];

export default function ScannerPage({ health }) {
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

      timerRef.current = setInterval(() => {
        setElapsedTime((performance.now() - startTimeRef.current) / 1000);
      }, 100);

      setTimeout(() => {
        document.getElementById('case')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      const es = new EventSource(`/api/investigations/${data.id}/stream`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const ev = JSON.parse(event.data);
          handleStreamEvent(ev);
        } catch {
          // Heartbeat
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
          return { ...prev, phase: ev.phase, phaseLabel: ev.label };

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
            toast.error("Forensic Discrepancy Alert: High Risk Score", {
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
            toast.error("Forensic Risk Report Generated", {
              toastId: `risk-report-${rep.company || 'inv'}`,
              position: "top-right",
              autoClose: 6000,
              theme: "dark",
            });
            playRiskSound();
          }

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
    <div className="space-y-10">
      <audio ref={audioRef} src="/fahhh.mp3" preload="auto" />

      {/* Hero Scanner Form */}
      <Hero
        onStart={handleStartInvestigation}
        isLive={health?.live}
        isSubmitting={isSubmitting}
      />

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

      {/* Methodology */}
      <Methodology />

      {/* Precedent Cases */}
      <Cases />
    </div>
  );
}

