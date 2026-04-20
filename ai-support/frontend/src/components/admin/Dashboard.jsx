import { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  MessageSquare, FileText, ThumbsUp, Zap,
  TrendingUp, ArrowUpRight, ArrowDownRight, Clock,
  Sparkles, ExternalLink, ChevronRight, Activity,
  Users, BarChart2, Hash, ThumbsDown, User
} from 'lucide-react';
import { analyticsAPI, adminChatAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

/* ── Stat card ── */
const CARD_THEMES = {
  indigo:  { gradient: 'from-indigo-500 to-indigo-600',  soft: 'bg-indigo-50',  icon: 'text-indigo-600',  ring: 'ring-indigo-100',  glow: 'rgba(99,102,241,.25)' },
  emerald: { gradient: 'from-emerald-500 to-teal-600',   soft: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100', glow: 'rgba(16,185,129,.2)'  },
  violet:  { gradient: 'from-violet-500 to-purple-600',  soft: 'bg-violet-50',  icon: 'text-violet-600',  ring: 'ring-violet-100',  glow: 'rgba(139,92,246,.22)' },
  amber:   { gradient: 'from-amber-400  to-orange-500',  soft: 'bg-amber-50',   icon: 'text-amber-600',   ring: 'ring-amber-100',   glow: 'rgba(251,191,36,.22)' },
};

function StatCard({ icon: Icon, label, value, sub, trend, color = 'indigo' }) {
  const t = CARD_THEMES[color];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,.08)] hover:-translate-y-0.5 cursor-default group">
      <div className="flex items-start justify-between mb-4">
        <div className={clsx(
          'w-11 h-11 rounded-2xl flex items-center justify-center ring-4 transition-all duration-200 group-hover:scale-105',
          t.soft, t.ring
        )}>
          <Icon size={19} className={t.icon} />
        </div>
        {trend !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full',
            trend >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'
          )}>
            {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-extrabold text-gray-900 tabular-nums tracking-tight leading-none">{value ?? '—'}</p>
      <p className="text-[12.5px] text-gray-500 mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-[14px] px-3.5 py-2.5 shadow-xl text-xs">
      <p className="text-gray-400 mb-1 font-medium">{label && format(parseISO(label), 'MMM d, yyyy')}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-indigo-500" />
        <p className="font-bold text-gray-900 tabular-nums">{payload[0].value} messages</p>
      </div>
    </div>
  );
}

/* ── Quick action card ── */
function QuickAction({ Icon, color, label, desc, to }) {
  return (
    <Link to={to}
      className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,.07)] hover:-translate-y-0.5 transition-all duration-200 group">
      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-105', color)}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">{label}</p>
        <p className="text-[11px] text-gray-400 truncate mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={12} className="text-gray-200 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
    </Link>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div className="p-6 space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 bg-gray-100 rounded-xl w-44" />
          <div className="h-3.5 bg-gray-100 rounded-xl w-32" />
        </div>
        <div className="h-9 bg-gray-100 rounded-xl w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-72 bg-gray-100 rounded-2xl" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[62px] bg-gray-100 rounded-2xl" />)}
        </div>
      </div>
    </div>
  );
}

/* ── Recent conversation row ── */
function ConvoRow({ conv }) {
  return (
    <Link to="/admin/conversations"
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors group border-b border-gray-50/80 last:border-0">
      <div className="relative flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
          <span className="text-[12px] font-extrabold text-indigo-600">
            {(conv.visitorName || 'V')[0].toUpperCase()}
          </span>
        </div>
        {conv.status === 'open' && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900 truncate">{conv.visitorName || 'Visitor'}</p>
        <p className="text-[11.5px] text-gray-400 truncate mt-0.5">{conv.lastMessagePreview || 'No messages yet'}</p>
      </div>
      <div className="text-right flex-shrink-0 space-y-0.5">
        <p className="text-[11px] text-gray-400">
          {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
        </p>
        <p className="flex items-center justify-end gap-1 text-[10.5px] text-gray-300">
          <Hash size={8} />{conv.messagesCount || 0} msgs
        </p>
      </div>
      <ChevronRight size={12} className="text-gray-200 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
    </Link>
  );
}

/* ══ MAIN ══ */
export default function Dashboard() {
  const { company } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentConvos, setRecentConvos] = useState([]);

  useEffect(() => {
    analyticsAPI.dashboard()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));

    adminChatAPI.listConversations({ page: 1, limit: 5 })
      .then(({ data }) => setRecentConvos(data.conversations || []))
      .catch(() => {});
  }, []);

  if (loading) return <Skeleton />;

  const ov = stats?.overview || {};

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-[12px] sm:text-[13px] text-gray-500 mt-0.5">
            <span className="font-semibold text-gray-700">{company?.name}</span>
            <span className="hidden sm:inline">{' · '}{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </p>
        </div>
        <a
          href={`/chat/${company?.slug}`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary flex-shrink-0 text-xs sm:text-sm px-3 py-2"
        >
          <ExternalLink size={12} />
          <span className="hidden sm:inline">Open </span>Chat Widget
        </a>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={MessageSquare} color="indigo"
          label="Total Conversations"
          value={ov.totalConversations?.toLocaleString() ?? '0'}
          sub={`${ov.openConversations ?? 0} active now`}
        />
        <StatCard
          icon={Zap} color="violet"
          label="AI Responses (7 d)"
          value={ov.recentMessages?.toLocaleString() ?? '0'}
          sub={`${ov.totalMessages?.toLocaleString() ?? 0} all-time`}
        />
        <StatCard
          icon={ThumbsUp} color="emerald"
          label="Satisfaction"
          value={ov.satisfactionRate != null ? `${ov.satisfactionRate}%` : 'No data'}
          sub={`${stats?.feedback?.up ?? 0} 👍  ${stats?.feedback?.down ?? 0} 👎`}
        />
        <StatCard
          icon={Clock} color="amber"
          label="Avg Response"
          value={ov.avgResponseTimeMs ? `${(ov.avgResponseTimeMs / 1000).toFixed(1)}s` : '—'}
          sub={`${ov.documents ?? 0} docs indexed`}
        />
      </div>

      {/* ── Chart + actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-4 sm:p-5"
          style={{ boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Activity size={14} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[13px]">Message Volume</h3>
                <p className="text-[11px] text-gray-400">Last 30 days</p>
              </div>
            </div>
            {stats?.dailyMessages?.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <BarChart2 size={11} />
                <span>{stats.dailyMessages.reduce((s, d) => s + d.count, 0).toLocaleString()} total</span>
              </div>
            )}
          </div>

          {stats?.dailyMessages?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.dailyMessages} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMsg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => format(parseISO(d), 'MMM d')}
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
                  axisLine={false} tickLine={false} allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 2', opacity: 0.5 }} />
                <Area
                  type="monotone" dataKey="count" name="Messages"
                  stroke="#6366f1" strokeWidth={2.5}
                  fill="url(#gradMsg)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                <TrendingUp size={22} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-[13px] text-gray-500 font-semibold">No data yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Send a message in the chat widget to see activity</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.1em] px-1">Quick actions</p>
          <QuickAction
            Icon={FileText} color="text-indigo-500 bg-indigo-50"
            label="Upload Documents" desc="Add PDFs, FAQs, text files"
            to="/admin/documents"
          />
          <QuickAction
            Icon={MessageSquare} color="text-emerald-500 bg-emerald-50"
            label="View Conversations" desc="Browse customer chats"
            to="/admin/conversations"
          />
          <QuickAction
            Icon={Sparkles} color="text-violet-500 bg-violet-50"
            label="Tune AI Persona" desc="Edit prompt & style"
            to="/admin/settings"
          />

          {/* Demo mode notice */}
          <div className="p-4 rounded-2xl border border-amber-100"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fff7ed)' }}>
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">🔑</span>
              <div>
                <p className="text-[11.5px] font-bold text-amber-800 mb-1">Demo Mode</p>
                <p className="text-[10.5px] text-amber-700 leading-relaxed">
                  Add <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-800">OPENAI_API_KEY</code> in{' '}
                  <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-800">backend/.env</code> for real AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent conversations ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,.05)' }}>
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-50 rounded-xl flex items-center justify-center">
              <MessageSquare size={12} className="text-indigo-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-[13.5px]">Recent Conversations</h3>
          </div>
          <Link to="/admin/conversations"
            className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {recentConvos.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-100">
              <MessageSquare size={20} className="text-gray-200" />
            </div>
            <p className="text-[13px] font-semibold text-gray-400">No conversations yet</p>
            <p className="text-[11.5px] text-gray-300 mt-1">
              <a href={`/chat/${company?.slug}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                Open your chat widget
              </a>{' '}to start receiving messages
            </p>
          </div>
        ) : (
          <div>
            {recentConvos.map(conv => <ConvoRow key={conv._id} conv={conv} />)}
          </div>
        )}
      </div>
    </div>
  );
}
