import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  Bot, 
  ExternalLink,
  ChevronDown,
  Info,
  ShieldAlert
} from 'lucide-react';

const SUGGESTED_QUERIES = [
  'What are the biggest supplier red flags?',
  'Summarize the Bull vs Bear debate',
  'Has the company met its DRHP promises?',
  'What is the worst-case loss in the simulator?'
];

export default function FinancialChatbot({ currentCompany, investigationId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  // Initialize or restore session ID
  useEffect(() => {
    let sid = localStorage.getItem('ipo_xray_chat_sid');
    if (!sid) {
      sid = `sess_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('ipo_xray_chat_sid', sid);
    }
    setSessionId(sid);
    fetchHistory(sid);
  }, []);

  const fetchHistory = async (sid) => {
    try {
      const res = await fetch(`/api/chat/history/${sid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          // Default greeting
          setMessages([
            {
              role: 'assistant',
              content: `Hello! I am your **AI Financial Copilot** for **${currentCompany || 'SME IPOs'}**. I have full contextual access to the offer document, active fraud investigation, Bull vs Bear debate, financial simulator, and Promise Tracker. How can I help you audit this IPO?`,
              citations: [
                { title: 'IPO X-Ray 360', ref: 'RAG Knowledge Core' }
              ]
            }
          ]);
        }
      }
    } catch (e) {
      console.error('Error fetching chat history:', e);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    const userMsg = { role: 'user', content: text, citations: [] };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          company: currentCompany,
          investigation_id: investigationId
        })
      });

      if (!res.ok) throw new Error('Chatbot response error');
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          citations: data.citations || []
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error connecting to the forensic analysis service. Please try again.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!sessionId) return;
    try {
      await fetch(`/api/chat/history/${sessionId}`, { method: 'DELETE' });
      setMessages([
        {
          role: 'assistant',
          content: `Session cleared. Ready to assist with forensic analysis for **${currentCompany || 'SME IPOs'}**.`,
          citations: []
        }
      ]);
    } catch (e) {
      console.error('Error clearing chat:', e);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-beam via-[#A3EAF7] to-beam text-[#091724] font-bold text-sm shadow-[0_10px_35px_rgba(127,216,232,0.45)] hover:shadow-[0_12px_45px_rgba(127,216,232,0.65)] hover:-translate-y-1 active:translate-y-0 transition-all cursor-pointer group"
          aria-label="Open AI Financial Copilot"
        >
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#091724] opacity-75 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#091724]" />
          </span>
          <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-['Bricolage_Grotesque'] tracking-tight">AI Copilot</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <aside
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl border border-[#27435E] bg-[#0A1624]/95 backdrop-blur-2xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(127,216,232,0.15)] overflow-hidden animate-fadeIn"
          role="dialog"
          aria-label="AI Financial Copilot Chat"
        >
          {/* Top laser hairline */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-beam to-transparent" />

          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-line/70 bg-[#0E1F2E]/90">
            <div className="flex items-center gap-2.5">
              <div className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-[#1C3650] to-[#0A1724] border border-beam/40 text-beam">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-['Bricolage_Grotesque'] font-bold text-sm text-bone">
                    AI Financial Copilot
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-beam/15 text-beam border border-beam/30">
                    RAG v2
                  </span>
                </div>
                <span className="text-[10px] font-mono text-bone-dim truncate block max-w-[220px]">
                  Context: {currentCompany || 'Kalindi Smart Mobility'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-bone-dim hover:text-bone hover:bg-film-2/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                className="p-1.5 rounded-lg text-bone-dim hover:text-bone hover:bg-film-2/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestion Pills */}
          <div className="flex items-center gap-1.5 p-2 px-3 overflow-x-auto border-b border-line/50 bg-[#08121B] no-scrollbar">
            {SUGGESTED_QUERIES.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sq)}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-mono text-bone-dim hover:text-bone bg-[#102232] border border-line/60 hover:border-beam/40 transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-beam/25 to-[#A3EAF7]/20 border border-beam/50 text-bone rounded-tr-none'
                      : 'bg-[#102232] border border-line/80 text-bone rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.content}

                  {/* Citations badges if assistant */}
                  {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-line/50 flex flex-wrap gap-1.5">
                      {m.citations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-[#091522] border border-beam/30 text-beam"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>{c.title || c.ref}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#102232] border border-line/70 text-bone-dim text-xs w-fit">
                <span className="w-3.5 h-3.5 border-2 border-beam border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[11px]">Retrieving DRHP & evidence sources…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-line/70 bg-[#091522] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about financials, debate, promises, risks..."
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#0E1F2E] border border-line text-bone text-xs outline-none focus:border-beam/60 transition-colors placeholder:text-bone-dim/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-beam to-[#A3EAF7] text-[#091724] font-bold shadow-md hover:shadow-lg disabled:opacity-40 transition-all cursor-pointer flex-none"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
