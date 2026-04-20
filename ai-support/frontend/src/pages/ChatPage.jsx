import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Send, RotateCcw, Sparkles, ChevronDown,
  Zap, Shield, PlusCircle, Smile
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from '../components/chat/ChatMessage';
import TypingIndicator from '../components/chat/TypingIndicator';
import { streamChat, submitFeedback, getChatHistory } from '../utils/api';
import clsx from 'clsx';

/* ── Session persistence helpers ── */
const getSessionId = (slug) => {
  const key = `chat_session_${slug}`;
  let id = localStorage.getItem(key);
  if (!id) { id = uuidv4(); localStorage.setItem(key, id); }
  return id;
};

const MESSAGES_KEY = (slug, sessionId) => `chat_messages_${slug}_${sessionId}`;

const loadCachedMessages = (slug, sessionId) => {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY(slug, sessionId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const saveMessagesToCache = (slug, sessionId, messages) => {
  try {
    localStorage.setItem(MESSAGES_KEY(slug, sessionId), JSON.stringify(messages.slice(-50)));
  } catch { /* quota exceeded */ }
};

/* ── Message grouping (WhatsApp-style) ── */
// Returns true if this message should be grouped with the previous (same sender, within 2 min)
const isGroupedWithPrev = (messages, idx) => {
  if (idx === 0) return false;
  const curr = messages[idx];
  const prev = messages[idx - 1];
  if (curr.role !== prev.role) return false;
  if (!curr.createdAt || !prev.createdAt) return false;
  const diff = new Date(curr.createdAt) - new Date(prev.createdAt);
  return diff < 2 * 60 * 1000; // 2 minutes
};

/* ── Suggestion chips ── */
const SUGGESTIONS = [
  { icon: '💰', text: 'What are the pricing plans?' },
  { icon: '🚀', text: 'How do I get started?' },
  { icon: '🔌', text: 'What integrations are available?' },
  { icon: '🔒', text: 'How is my data secured?' },
];

/* ── AI Star icon ── */
function AIStarIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    </svg>
  );
}

export default function ChatPage() {
  const { slug } = useParams();
  const [messages,         setMessages]         = useState([]);
  const [input,            setInput]            = useState('');
  const [isTyping,         setIsTyping]         = useState(false);
  const [isStreaming,      setIsStreaming]       = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId]  = useState(() => getSessionId(slug));
  const [showScroll, setShowScroll]  = useState(false);
  const [inputRows,  setInputRows]   = useState(1);
  const [charCount,  setCharCount]   = useState(0);

  const messagesEndRef       = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef             = useRef(null);
  const accumulatedRef       = useRef('');

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 160);
  };

  /* ── Auto-scroll ── */
  useEffect(() => { if (!isStreaming) scrollToBottom(); }, [messages, isTyping]);
  useEffect(() => { if (isStreaming)  scrollToBottom('auto'); }, [streamingContent]);

  /* ── Persist messages ── */
  useEffect(() => {
    if (messages.length > 1) saveMessagesToCache(slug, sessionId, messages);
  }, [messages, slug, sessionId]);

  /* ── Load history ── */
  const WELCOME_MSG = {
    id: 'welcome', role: 'assistant',
    content: `Hi there! 👋 I'm your AI assistant. I can answer questions about products, pricing, integrations, and more.\n\nWhat can I help you with today?`,
    createdAt: new Date().toISOString(),
  };

  useEffect(() => {
    const cached = loadCachedMessages(slug, sessionId);
    if (cached?.length > 0) {
      setMessages(cached);
      setTimeout(() => scrollToBottom('auto'), 50);
    }

    getChatHistory(slug, sessionId)
      .then(({ data }) => {
        if (data.messages?.length > 0) {
          setMessages(data.messages);
          saveMessagesToCache(slug, sessionId, data.messages);
          setTimeout(() => scrollToBottom('auto'), 100);
        } else if (!cached?.length) {
          setMessages([WELCOME_MSG]);
        }
      })
      .catch(() => { if (!cached?.length) setMessages([WELCOME_MSG]); });
  }, [slug, sessionId]);

  /* ── Send message ── */
  const sendMessage = async (content) => {
    const text = (content || input).trim();
    if (!text || isStreaming || isTyping) return;

    setInput(''); setInputRows(1); setCharCount(0);
    setIsTyping(true); setStreamingContent('');
    accumulatedRef.current = '';

    const userMsg = {
      id: `u-${Date.now()}`, role: 'user',
      content: text, createdAt: new Date().toISOString(),
    };
    setMessages(prev => {
      const updated = [...prev, userMsg];
      saveMessagesToCache(slug, sessionId, updated);
      return updated;
    });

    await streamChat({
      slug, content: text, sessionId,
      onChunk: (chunk) => {
        setIsTyping(false); setIsStreaming(true);
        accumulatedRef.current += chunk;
        setStreamingContent(accumulatedRef.current);
      },
      onDone: (data) => {
        setIsStreaming(false); setStreamingContent('');
        const aiMsg = {
          id: data.messageId || `ai-${Date.now()}`,
          role: 'assistant',
          content: accumulatedRef.current,
          sources: data.sources,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => {
          const updated = [...prev, aiMsg];
          saveMessagesToCache(slug, sessionId, updated);
          return updated;
        });
        accumulatedRef.current = '';
        setTimeout(() => inputRef.current?.focus(), 100);
      },
      onError: () => {
        setIsTyping(false); setIsStreaming(false); setStreamingContent('');
        accumulatedRef.current = '';
        toast.error('Something went wrong. Please try again.');
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setInput(val);
    setCharCount(val.length);
    setInputRows(Math.min(val.split('\n').length, 5));
  };

  const handleFeedback = async (messageId, rating) => {
    try {
      await submitFeedback(slug, messageId, rating);
      toast.success(rating === 'up' ? '👍 Thanks for the feedback!' : '👎 Got it, we\'ll improve!',
        { style: { fontSize: '13px', borderRadius: '12px' } });
    } catch { /* silent */ }
  };

  const clearChat = () => {
    localStorage.removeItem(MESSAGES_KEY(slug, sessionId));
    localStorage.removeItem(`chat_session_${slug}`);
    window.location.reload();
  };

  const showSuggestions = messages.length <= 1 && !isTyping && !isStreaming;
  const isBusy = isStreaming || isTyping;

  return (
    <div className="flex flex-col h-screen bg-[#f5f6fb]" style={{
      background: 'radial-gradient(ellipse at 30% 0%, rgba(99,102,241,.07) 0%, transparent 55%), radial-gradient(ellipse at 70% 100%, rgba(167,139,250,.06) 0%, transparent 50%), #f5f6fb'
    }}>

      {/* ══ HEADER ══ */}
      <header className="glass border-b border-white/60 px-4 py-3.5 flex-shrink-0"
        style={{ boxShadow: '0 1px 20px rgba(0,0,0,.06)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-3">
            {/* Animated avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center"
                style={{ boxShadow: '0 3px 14px rgba(99,102,241,.45)' }}>
                <AIStarIcon size={17} className="text-white" />
              </div>
              {/* Online ring */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full">
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-gray-900 text-[13.5px] tracking-tight">AI Support</h1>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                  <Zap size={8} />AI
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 4px rgba(52,211,153,.8)' }} />
                <span className="text-[11px] text-gray-400">Online · replies instantly</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all text-[11px] font-medium"
              title="New conversation"
            >
              <PlusCircle size={13} />
              <span className="hidden sm:inline">New chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══ MESSAGES ══ */}
      <main
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto chat-scroll"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-4 space-y-5">

          {messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id || idx}
              message={msg}
              onFeedback={handleFeedback}
              isGrouped={isGroupedWithPrev(messages, idx)}
            />
          ))}

          {/* Streaming bubble */}
          {isStreaming && streamingContent && (
            <div className="flex items-end gap-2.5 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mb-[22px]"
                style={{ boxShadow: '0 2px 10px rgba(99,102,241,.38)' }}>
                <AIStarIcon size={13} className="text-white" />
              </div>
              <div className="chat-bubble-ai max-w-[82%]">
                <div className="text-[13.5px] text-gray-700 leading-relaxed whitespace-pre-wrap prose-chat">
                  {streamingContent}
                  <span className="cursor-blink inline-block w-[2px] h-[1em] bg-indigo-400 ml-0.5 align-[-0.1em] rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* Typing / waveform */}
          {isTyping && !isStreaming && <TypingIndicator />}

          {/* Suggestions */}
          {showSuggestions && (
            <div className="animate-slide-up mt-2">
              <p className="text-[10.5px] text-gray-400 text-center mb-3 font-semibold uppercase tracking-wider select-none">
                Quick questions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => sendMessage(s.text)}
                    className="flex items-center gap-2.5 px-3.5 py-3 bg-white/90 border border-gray-100 rounded-2xl text-left hover:bg-white hover:border-indigo-200 hover:shadow-[0_2px_12px_rgba(99,102,241,.12)] transition-all duration-200 group"
                  >
                    <span className="text-[17px] flex-shrink-0">{s.icon}</span>
                    <span className="text-[12px] font-medium text-gray-600 group-hover:text-indigo-700 leading-snug transition-colors">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Scroll-to-bottom */}
        {showScroll && (
          <button
            onClick={() => scrollToBottom()}
            className="fixed bottom-28 right-5 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,.12)] hover:shadow-[0_6px_24px_rgba(0,0,0,.16)] text-gray-500 hover:text-indigo-600 transition-all animate-pop-in z-10"
          >
            <ChevronDown size={15} />
          </button>
        )}
      </main>

      {/* ══ INPUT AREA ══ */}
      <footer className="flex-shrink-0 px-4 pb-5 pt-2">
        <div className="max-w-2xl mx-auto">

          {/* Input card */}
          <div className={clsx(
            'bg-white rounded-2xl transition-all duration-200 overflow-hidden',
            isBusy
              ? 'border border-gray-200 shadow-sm'
              : 'border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,.07)] focus-within:border-indigo-300 focus-within:shadow-[0_4px_24px_rgba(99,102,241,.15)]'
          )}>
            {/* Textarea row */}
            <div className="flex items-end gap-2 px-4 pt-3.5 pb-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                rows={inputRows}
                placeholder={isBusy ? 'AI is thinking…' : 'Ask me anything…'}
                disabled={isBusy}
                maxLength={2000}
                className="flex-1 bg-transparent text-[13.5px] text-gray-900 placeholder:text-gray-400 resize-none outline-none leading-relaxed max-h-36 py-0.5 disabled:opacity-60 transition-opacity"
              />

              {/* Send button */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isBusy}
                className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  input.trim() && !isBusy
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_2px_10px_rgba(99,102,241,.45)] hover:shadow-[0_4px_16px_rgba(99,102,241,.5)] hover:scale-105 active:scale-95'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                )}
                aria-label="Send"
              >
                {isBusy
                  ? <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-400 rounded-full animate-spin" />
                  : <Send size={14} />}
              </button>
            </div>

            {/* Footer bar */}
            <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-50">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-gray-300 font-medium">
                  <Shield size={9} className="text-emerald-400" />
                  Verified sources
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-300 font-medium">
                  <Zap size={9} className="text-amber-400" />
                  Instant AI
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {charCount > 0 && (
                  <span className={clsx(
                    'text-[10px] tabular-nums transition-colors',
                    charCount > 1800 ? 'text-red-400' : charCount > 1500 ? 'text-amber-400' : 'text-gray-300'
                  )}>
                    {charCount}/2000
                  </span>
                )}
                <span className="text-[11px] text-gray-200 hidden sm:inline">⏎ send · ⇧⏎ newline</span>
              </div>
            </div>
          </div>

          {/* Powered by */}
          <p className="text-center text-[10px] text-gray-300 mt-2 select-none">
            Powered by <span className="font-semibold text-gray-400">SupportAI</span> · RAG technology
          </p>
        </div>
      </footer>
    </div>
  );
}
