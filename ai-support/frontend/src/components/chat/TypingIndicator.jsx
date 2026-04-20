export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-slide-up">
      {/* AI avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-[0_2px_10px_rgba(99,102,241,.4)]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
        </svg>
      </div>

      {/* Waveform bubble */}
      <div className="chat-bubble-ai flex items-center gap-0.5 px-4 py-3.5 min-w-[60px]">
        <span className="wave-bar" style={{ height: 10 }} />
        <span className="wave-bar" style={{ height: 16 }} />
        <span className="wave-bar" style={{ height: 10 }} />
        <span className="wave-bar" style={{ height: 18 }} />
        <span className="wave-bar" style={{ height: 10 }} />
      </div>
    </div>
  );
}
