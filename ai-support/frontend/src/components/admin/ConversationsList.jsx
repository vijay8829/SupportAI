import { useState, useEffect } from 'react';
import {
  MessageSquare, ChevronRight, User, ThumbsUp, ThumbsDown,
  X, Search, Clock, Hash, Smile
} from 'lucide-react';
import { adminChatAPI } from '../../utils/api';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function AIStarIcon({ size = 12, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    </svg>
  );
}

/* ── Conversation detail modal ── */
function ConversationDetail({ conversationId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminChatAPI.getConversation(conversationId)
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [conversationId]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col animate-scale-in overflow-hidden"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-[14px] truncate">
              {data?.conversation?.visitorName || 'Visitor'}
            </h3>
            <p className="text-[11.5px] text-gray-400 mt-0.5">
              {data?.messages?.length || 0} messages
              {data?.conversation?.createdAt && (
                <> · {format(new Date(data.conversation.createdAt), 'MMM d, h:mm a')}</>
              )}
            </p>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,.04), transparent 60%), #fafbfd' }}>

          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={clsx('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                  <div className={clsx('h-12 shimmer rounded-2xl', i % 2 === 0 ? 'w-3/5' : 'w-2/3')} />
                </div>
              ))}
            </div>
          ) : (
            data?.messages?.map((msg, idx) => (
              <div key={msg._id || idx}
                className={clsx('flex gap-2 animate-slide-up', msg.role === 'user' ? 'justify-end' : 'justify-start')}>

                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ boxShadow: '0 2px 8px rgba(99,102,241,.35)' }}>
                    <AIStarIcon size={11} className="text-white" />
                  </div>
                )}

                <div className={clsx(
                  'max-w-[72%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-[0_2px_8px_rgba(79,70,229,.3)]'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-[0_2px_8px_rgba(0,0,0,.06)]'
                )}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.feedback?.rating && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-70">
                      {msg.feedback.rating === 'up'
                        ? <><ThumbsUp size={10} className="text-emerald-400" /><span className="text-[10px]">Helpful</span></>
                        : <><ThumbsDown size={10} className="text-red-400" /><span className="text-[10px]">Not helpful</span></>}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User size={12} className="text-gray-500" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {data?.conversation?.satisfactionScore != null && (
          <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2">
            <Smile size={13} className="text-gray-400" />
            <span className="text-[12px] text-gray-500">Satisfaction</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full ml-1">
              <div className={clsx('h-full rounded-full transition-all', data.conversation.satisfactionScore >= 0.6 ? 'bg-emerald-400' : 'bg-red-400')}
                style={{ width: `${Math.round(data.conversation.satisfactionScore * 100)}%` }} />
            </div>
            <span className="text-[12px] font-bold text-gray-700">{Math.round(data.conversation.satisfactionScore * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══ MAIN ══ */
export default function ConversationsList() {
  const [conversations, setConversations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedId,    setSelectedId]    = useState(null);
  const [page,          setPage]          = useState(1);
  const [pagination,    setPagination]    = useState({});
  const [search,        setSearch]        = useState('');

  useEffect(() => {
    setLoading(true);
    adminChatAPI.listConversations({ page, limit: 20 })
      .then(({ data }) => {
        setConversations(data.conversations);
        setPagination(data.pagination);
      })
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = conversations.filter(c =>
    !search
    || c.visitorName?.toLowerCase().includes(search.toLowerCase())
    || c.lastMessagePreview?.toLowerCase().includes(search.toLowerCase())
  );

  const openCount = conversations.filter(c => c.status === 'open').length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-extrabold text-gray-900 tracking-tight">Conversations</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-700">{pagination.total || 0}</span> total ·{' '}
            <span className="text-emerald-600 font-semibold">{openCount}</span> open
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-10 bg-white text-[13.5px]"
          placeholder="Search by visitor name or message…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>

        {/* Skeleton */}
        {loading && (
          <div className="p-5 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 shimmer rounded-full w-1/4" />
                  <div className="h-2.5 shimmer rounded-full w-3/5" />
                </div>
                <div className="w-14 h-3 shimmer rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <MessageSquare size={26} className="text-gray-200" />
            </div>
            <p className="text-[13.5px] font-semibold text-gray-500">
              {search ? 'No conversations match your search' : 'No conversations yet'}
            </p>
            {!search && <p className="text-[12px] text-gray-400 mt-1">Share your chat widget to start getting messages</p>}
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-gray-50">
            {filtered.map((conv) => (
              <div
                key={conv._id}
                onClick={() => setSelectedId(conv._id)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/70 cursor-pointer transition-colors group"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                    <span className="text-[13px] font-extrabold text-indigo-600">
                      {(conv.visitorName || 'V')[0].toUpperCase()}
                    </span>
                  </div>
                  {conv.status === 'open' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"
                      style={{ boxShadow: '0 0 4px rgba(52,211,153,.6)' }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13.5px] font-semibold text-gray-900 truncate">
                      {conv.visitorName || 'Visitor'}
                    </p>
                    {conv.satisfactionScore != null && (
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full border',
                        conv.satisfactionScore >= 0.6
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-red-50 text-red-600 border-red-100'
                      )}>
                        {conv.satisfactionScore >= 0.6
                          ? <ThumbsUp size={8} />
                          : <ThumbsDown size={8} />}
                        {Math.round(conv.satisfactionScore * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-400 truncate leading-relaxed">
                    {conv.lastMessagePreview || 'No messages yet'}
                  </p>
                </div>

                {/* Meta — hidden on small mobile */}
                <div className="hidden sm:block text-right flex-shrink-0 space-y-1">
                  <p className="text-[11.5px] text-gray-400">
                    {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                  </p>
                  <p className="flex items-center justify-end gap-1 text-[11px] text-gray-300">
                    <Hash size={9} />
                    {conv.messagesCount || 0} msg{conv.messagesCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <ChevronRight size={13} className="text-gray-200 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-50 flex items-center justify-between bg-gray-50/30">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-[12px] py-1.5 px-3 disabled:opacity-30"
            >← Previous</button>
            <span className="text-[12px] text-gray-500 font-medium">
              Page <span className="font-bold text-gray-700">{page}</span> of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn-secondary text-[12px] py-1.5 px-3 disabled:opacity-30"
            >Next →</button>
          </div>
        )}
      </div>

      {selectedId && (
        <ConversationDetail conversationId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
