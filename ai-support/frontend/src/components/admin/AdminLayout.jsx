import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LayoutDashboard, FileText, MessageSquare,
  Settings, LogOut, ExternalLink, ChevronRight,
  Zap, Sun, Moon, Menu, X
} from 'lucide-react';
import clsx from 'clsx';

const SIDEBAR_W = 220;

const navItems = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard',      desc: 'Overview & metrics'   },
  { to: '/admin/documents',     icon: FileText,        label: 'Knowledge Base', desc: 'Docs & FAQs'          },
  { to: '/admin/conversations', icon: MessageSquare,   label: 'Conversations',  desc: 'Customer chats'       },
  { to: '/admin/settings',      icon: Settings,        label: 'Settings',       desc: 'AI & widget config'   },
];

function AIStarIcon({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    </svg>
  );
}

export default function AdminLayout({ children }) {
  const { user, company, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Prevent body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const topBorder = isDark ? 'rgba(255,255,255,.07)' : '#e5e7eb';
  const topBg     = isDark ? '#0d0e14' : '#ffffff';
  const textMain  = isDark ? '#f1f2f7' : '#111827';
  const textSub   = isDark ? '#6b7280' : '#6b7280';
  const mainBg    = isDark
    ? '#0d0e14'
    : 'radial-gradient(ellipse at 60% 0%, rgba(99,102,241,.04) 0%, transparent 50%), #f8f9fc';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const currentLabel = navItems.find(n => location.pathname.startsWith(n.to))?.label || 'Admin';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: isDark ? '#0d0e14' : '#f3f4f8' }}>

      {/* ══ SIDEBAR (always fixed/overlay) ══ */}

      {/* Backdrop — mobile only */}
      <div
        onClick={() => setOpen(false)}
        className={clsx(
          'fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ display: 'block' }}
      />

      {/* Sidebar panel */}
      <aside
        style={{
          width: SIDEBAR_W,
          background: 'linear-gradient(160deg, #0f0c29 0%, #1e1b4b 40%, #1a1040 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,.25)',
          transform: open ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
          transition: 'transform 0.24s cubic-bezier(0.4,0,0.2,1)',
        }}
        className="fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden select-none md:translate-x-0"
      >
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-24 left-0 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        {/* Brand */}
        <div className="relative px-4 py-5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0"
              style={{ boxShadow: '0 3px 14px rgba(99,102,241,.55)' }}>
              <AIStarIcon size={15} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-[13.5px] tracking-tight">SupportAI</p>
              <p className="text-[10.5px] text-indigo-300/70 truncate">{company?.name || 'Dashboard'}</p>
            </div>
            <button onClick={() => setOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white transition-colors flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9.5px] font-bold text-white/25 uppercase tracking-[0.12em] px-3 mb-3">Navigation</p>
          {navItems.map(({ to, icon: Icon, label, desc }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-[13px] transition-all duration-150 group relative overflow-hidden',
                isActive ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/6'
              )}>
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute inset-0 rounded-[13px]"
                    style={{ background: 'linear-gradient(90deg, rgba(99,102,241,.3), rgba(99,102,241,.1))' }} />}
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />}
                  <div className={clsx(
                    'relative w-7 h-7 rounded-[9px] flex items-center justify-center flex-shrink-0 transition-all duration-150',
                    isActive ? 'bg-indigo-500/40' : 'bg-white/6 group-hover:bg-white/10'
                  )}>
                    <Icon size={13} className={isActive ? 'text-indigo-300' : 'text-white/50 group-hover:text-white/70'} />
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <p className={clsx('text-[12.5px] font-semibold leading-none', isActive ? 'text-white' : '')}>{label}</p>
                    <p className={clsx('text-[10px] mt-0.5 truncate', isActive ? 'text-indigo-300/70' : 'text-white/25 group-hover:text-white/35')}>{desc}</p>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Preview link */}
        {company?.slug && (
          <div className="relative px-2.5 pb-2 border-t border-white/8 pt-2.5 flex-shrink-0">
            <a href={`/chat/${company.slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[13px] text-[12px] text-indigo-300 hover:bg-indigo-500/15 hover:text-indigo-200 transition-all group">
              <div className="w-7 h-7 rounded-[9px] bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <ExternalLink size={12} className="text-indigo-400" />
              </div>
              <span className="font-semibold flex-1">Preview Widget</span>
              <ChevronRight size={11} className="text-white/20 group-hover:text-indigo-300 transition-colors" />
            </a>
          </div>
        )}

        {/* User */}
        <div className="relative px-2.5 pb-4 border-t border-white/8 pt-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[13px] hover:bg-white/6 transition-all group cursor-default">
            <div className="w-7 h-7 rounded-[9px] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/85 truncate leading-none">{user?.name}</p>
              <p className="text-[10px] text-white/30 capitalize mt-0.5">{user?.role}</p>
            </div>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
              title="Sign out">
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN AREA — full width on mobile, offset by sidebar on desktop ══ */}
      <div
        className="flex flex-col flex-1 overflow-hidden w-full transition-all duration-[240ms]"
        style={{ marginLeft: 0 }}
      >
        {/* Apply md:ml-[220px] via inline media-query-aware class */}
        <style>{`@media (min-width: 768px) { .admin-main { margin-left: ${SIDEBAR_W}px !important; } }`}</style>
        <div className="admin-main flex flex-col flex-1 overflow-hidden h-full">

          {/* Top bar */}
          <header className="px-4 py-3 flex items-center gap-3 flex-shrink-0 border-b"
            style={{ background: topBg, borderColor: topBorder }}>

            {/* Hamburger — mobile only */}
            <button onClick={() => setOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl transition-colors"
              style={{ color: textSub }}>
              <Menu size={20} />
            </button>

            {/* Page title */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="hidden sm:inline text-sm font-medium" style={{ color: textSub }}>SupportAI</span>
              <ChevronRight size={12} className="hidden sm:block flex-shrink-0" style={{ color: textSub }} />
              <span className="text-sm font-bold truncate" style={{ color: textMain }}>{currentLabel}</span>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 4px rgba(52,211,153,.8)' }} />
                <span className="text-[10.5px] font-semibold text-emerald-700">AI Online</span>
              </div>
              <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                <Zap size={9} className="text-indigo-500" />
                <span className="text-[10.5px] font-semibold text-indigo-700 capitalize">{company?.plan || 'Free'}</span>
              </div>
              <button onClick={toggleTheme}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-all"
                style={{
                  border: `1px solid ${isDark ? 'rgba(255,255,255,.12)' : '#e5e7eb'}`,
                  background: isDark ? '#1c1e2a' : '#ffffff',
                  color: isDark ? '#a5b4fc' : '#6b7280',
                }}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ boxShadow: '0 2px 8px rgba(99,102,241,.3)' }}>
                {initials}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ background: mainBg }}>
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
