import { useState } from 'react';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronRight, Copy, Check, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

/* ── Inline markdown renderer ── */
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  const renderInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g);
    const out = [];
    let j = 0;
    while (j < parts.length) {
      const p = parts[j];
      if (!p) { j++; continue; }
      if (p.startsWith('**') && p.endsWith('**'))
        out.push(<strong key={j} className="font-semibold text-gray-900">{p.slice(2,-2)}</strong>);
      else if (p.startsWith('*') && p.endsWith('*') && p.length > 2)
        out.push(<em key={j} className="italic text-gray-700">{p.slice(1,-1)}</em>);
      else if (p.startsWith('`') && p.endsWith('`'))
        out.push(<code key={j} className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md text-[11px] font-mono border border-indigo-100">{p.slice(1,-1)}</code>);
      else
        out.push(<span key={j}>{p}</span>);
      j++;
    }
    return out;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <div key={`code-${i}`} className="my-2 rounded-xl overflow-hidden border border-gray-700/50">
          {lang && <div className="bg-gray-800 px-3 py-1 text-[10px] font-mono text-gray-400 border-b border-gray-700/50">{lang}</div>}
          <pre className="bg-gray-900 text-gray-100 p-3.5 text-[11px] font-mono leading-relaxed overflow-x-auto m-0">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Heading h3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="font-bold text-gray-900 text-sm mt-3 mb-1">{renderInline(line.slice(4))}</h3>);
      i++; continue;
    }

    // Heading h2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="font-bold text-gray-900 text-base mt-3 mb-1.5">{renderInline(line.slice(3))}</h2>);
      i++; continue;
    }

    // Unordered list
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const items = [];
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('• '))) {
        items.push(<li key={i} className="leading-relaxed flex gap-2 items-start">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
          <span>{renderInline(lines[i].slice(2))}</span>
        </li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="mb-2 space-y-1 pl-0 list-none">{items}</ul>);
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items = [];
      let n = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(<li key={i} className="leading-relaxed flex gap-2 items-start">
          <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{n}</span>
          <span>{renderInline(lines[i].replace(/^\d+\. /,''))}</span>
        </li>);
        i++; n++;
      }
      elements.push(<ol key={`ol-${i}`} className="mb-2 space-y-1.5 list-none pl-0">{items}</ol>);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-indigo-300 pl-3 text-gray-600 italic my-2 text-sm">
          {renderInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Horizontal rule
    if (line === '---' || line === '***') {
      elements.push(<hr key={i} className="border-gray-100 my-3" />);
      i++; continue;
    }

    if (line === '') { i++; continue; }

    elements.push(
      <p key={i} className="mb-1.5 last:mb-0 leading-relaxed">{renderInline(line)}</p>
    );
    i++;
  }

  return elements;
}

/* ── Copy button ── */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      className={clsx(
        'p-1.5 rounded-lg transition-all duration-200',
        copied
          ? 'bg-emerald-50 text-emerald-600'
          : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
      )}
      title="Copy message"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

/* ── Main component ── */
export default function ChatMessage({ message, onFeedback, isGrouped = false }) {
  const [showSources, setShowSources] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(message.feedback?.rating || null);
  const [feedbackAnim, setFeedbackAnim] = useState(null);

  const isAI = message.role === 'assistant';
  const hasSources = isAI && message.sources?.length > 0;

  const handleFeedback = (rating) => {
    if (feedbackGiven) return;
    setFeedbackGiven(rating);
    setFeedbackAnim(rating);
    onFeedback?.(message.id, rating);
    setTimeout(() => setFeedbackAnim(null), 700);
  };

  /* ── User message ── */
  if (!isAI) {
    return (
      <div className={clsx('flex justify-end items-end gap-2.5 animate-slide-up', isGrouped ? 'mt-0.5' : 'mt-1')}>
        <div className="max-w-[78%] space-y-1.5">
          <div className="chat-bubble-user">
            <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
          {/* Only show timestamp on last in group */}
          {!isGrouped && message.createdAt && (
            <p className="text-[10.5px] text-gray-400 text-right pr-1 select-none">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </p>
          )}
        </div>
        {/* User avatar — invisible spacer when grouped */}
        <div className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white shadow-sm',
          isGrouped
            ? 'opacity-0 pointer-events-none mb-5'
            : 'bg-gradient-to-br from-gray-300 to-gray-400 mb-5'
        )}>
          U
        </div>
      </div>
    );
  }

  /* ── AI message ── */
  return (
    <div className={clsx('flex items-end gap-2.5 animate-slide-up group/msg', isGrouped ? 'mt-0.5' : 'mt-1')}>
      {/* AI avatar — invisible spacer when grouped */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-[22px]',
        isGrouped
          ? 'opacity-0 pointer-events-none'
          : 'bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-[0_2px_10px_rgba(99,102,241,.38)]'
      )}>
        {!isGrouped && (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
          </svg>
        )}
      </div>

      <div className="flex-1 max-w-[82%] min-w-0">
        <div className="chat-bubble-ai">
          <div className="text-[13.5px] text-gray-700 prose-chat leading-relaxed">
            {renderMarkdown(message.content)}
          </div>
        </div>

        {/* Sources */}
        {hasSources && (
          <div className="mt-2 ml-1">
            <button
              onClick={() => setShowSources(s => !s)}
              className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-600 transition-colors font-semibold group/src"
            >
              <BookOpen size={10} className="flex-shrink-0" />
              <span>{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
              {showSources
                ? <ChevronDown size={10} className="transition-transform" />
                : <ChevronRight size={10} className="transition-transform" />}
            </button>
            {showSources && (
              <div className="mt-2 space-y-1.5 animate-slide-down">
                {message.sources.map((s, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-indigo-50/80 to-violet-50/50 border border-indigo-100/80 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                      <p className="text-[11px] font-semibold text-indigo-600 truncate">{s.documentName || 'Knowledge Base'}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed pl-3">{s.chunkContent}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timestamp + actions */}
        <div className="flex items-center gap-1.5 mt-1.5 ml-1 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200">
          {message.createdAt && (
            <span className="text-[10.5px] text-gray-300 select-none">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
          )}
          <div className="flex items-center gap-0.5 ml-auto">
            {message.content && <CopyButton text={message.content} />}
            {message.id && message.id !== 'welcome' && (
              <>
                <button
                  onClick={() => handleFeedback('up')}
                  disabled={!!feedbackGiven}
                  title="Helpful"
                  className={clsx(
                    'p-1.5 rounded-lg transition-all duration-200',
                    feedbackGiven === 'up'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'text-gray-300 hover:bg-emerald-50 hover:text-emerald-500',
                    feedbackAnim === 'up' && 'scale-125'
                  )}
                >
                  <ThumbsUp size={11} />
                </button>
                <button
                  onClick={() => handleFeedback('down')}
                  disabled={!!feedbackGiven}
                  title="Not helpful"
                  className={clsx(
                    'p-1.5 rounded-lg transition-all duration-200',
                    feedbackGiven === 'down'
                      ? 'bg-red-100 text-red-500'
                      : 'text-gray-300 hover:bg-red-50 hover:text-red-400',
                    feedbackAnim === 'down' && 'scale-125'
                  )}
                >
                  <ThumbsDown size={11} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
