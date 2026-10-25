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
          setMessages([
            {
              role: 'assistant',
              content: `Hello. I am your **AI Financial Copilot** for **${currentCompany || 'Indian IPOs'}**. I have full contextual access to the offer documents, autonomous forensic investigation, Bull vs Bear debate, risk simulator, and Promise Tracker. How can I assist your investment audit?`,
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
    } catch (e) {
      console.error('Chat error:', e);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error communicating with the forensic intelligence server. Please verify your connection or try again.',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setMessages([
      {
        role: 'assistant',
        content: `Audit context reset. Ask any question regarding **${currentCompany || 'Indian IPOs'}** offer document or forensic risk.`,
        citations: []
      }
    ]);
  };

  return (
    <>
      {/* Floating Launcher Pill */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 btn-gold flex items-center gap-2.5 px-4 py-3 rounded-full text-black font-bold text-xs tracking-wide shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Open AI Financial Copilot"
        >
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex w-full h-full rounded-full bg-black opacity-75 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-black" />
          </span>
          <Bot className="w-4 h-4" />
          <span className="font-['Cinzel'] tracking-wider">AI Copilot</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <aside
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[440px] h-[580px] max-h-[85vh] flex flex-col rounded-3xl border border-[#262626] bg-black/95 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95),0_0_40px_rgba(212,175,55,0.15)] overflow-hidden animate-fadeIn"
          role="dialog"
          aria-label="AI Financial Copilot Chat"
        >
          {/* Top gold hairline */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1E1E1E] bg-[#080808]">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-8 h-8 rounded-xl bg-[#121212] border border-[#D4AF37]/40 text-[#D4AF37]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-['Cinzel'] font-bold text-sm text-white">
                    AI Financial Copilot
                  </h3>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#F5E59F] border border-[#D4AF37]/35 font-semibold">
                    RAG v2
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#888888] truncate block max-w-[220px]">
                  Context: {currentCompany || 'Kalindi Smart Mobility'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                title="Clear conversation"
                className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestion Pills */}
          <div className="flex items-center gap-2 p-2.5 px-3 overflow-x-auto border-b border-[#161616] bg-[#050505] no-scrollbar">
            {SUGGESTED_QUERIES.map((sq, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sq)}
                className="whitespace-nowrap px-3 py-1 rounded-xl text-[10px] font-mono text-[#888888] hover:text-[#F5E59F] bg-[#0D0D0D] border border-[#222222] hover:border-[#D4AF37]/40 transition-colors"
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
                      ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-white rounded-tr-none'
                      : 'bg-[#0A0A0A] border border-[#202020] text-white rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.content}

                  {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#1C1C1C] flex flex-wrap gap-1.5">
                      {m.citations.map((c, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded bg-[#050505] border border-[#D4AF37]/35 text-[#F5E59F]"
                        >
                          <BookOpen className="w-2.5 h-2.5 text-[#D4AF37]" />
                          <span>{c.title || c.ref}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#0A0A0A] border border-[#202020] text-[#888888] text-xs w-fit">
                <span className="w-3.5 h-3.5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
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
            className="p-3 border-t border-[#1A1A1A] bg-[#050505] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about financials, debate, promises, risks..."
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-[#222222] text-white text-xs outline-none focus:border-[#D4AF37] transition-colors placeholder:text-[#666666]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-gold p-2.5 rounded-xl text-black font-bold shadow-md hover:shadow-lg disabled:opacity-40 transition-all cursor-pointer flex-none"
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
