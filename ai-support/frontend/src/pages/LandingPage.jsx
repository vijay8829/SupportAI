import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, Zap, Shield, BarChart2,
  Upload, ArrowRight, CheckCircle, Star, ChevronDown,
  Globe, Clock, Users, TrendingUp, ExternalLink,
  Brain, Layers, Bot, ThumbsUp, AreaChart
} from 'lucide-react';

/* ── Reusable motion helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

/* ── AI logo icon ── */
function AIStarIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
    </svg>
  );
}

/* ══════════════════════════════
   PRODUCT SCREENSHOT MOCKUPS
   ══════════════════════════════ */

/* Mini chat mockup */
function ChatMockup() {
  const msgs = [
    { role: 'user',      text: 'What is your refund policy?' },
    { role: 'assistant', text: 'We offer a 30-day money-back guarantee — no questions asked. Just contact our team and we\'ll process it within 2 business days.', sources: 2 },
    { role: 'user',      text: 'Does it cover annual plans too?' },
    { role: 'assistant', text: 'Yes! Annual plans are fully covered under the same policy.', sources: 1 },
  ];

  return (
    <div className="relative w-full max-w-[360px] mx-auto select-none">
      {/* Outer glow */}
      <div className="absolute -inset-6 rounded-[32px] blur-3xl opacity-25 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)' }} />

      <div className="relative rounded-[22px] overflow-hidden border border-gray-200/80 bg-white"
        style={{ boxShadow: '0 24px 80px rgba(99,102,241,.22), 0 4px 16px rgba(0,0,0,.08)' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <AIStarIcon size={15} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <p className="text-white font-bold text-[13px]">AI Support</p>
            <p className="text-indigo-200 text-[10.5px]">Online · replies instantly</p>
          </div>
          <div className="ml-auto flex gap-1.5">
            {['#ef4444','#f59e0b','#22c55e'].map(c => (
              <div key={c} className="w-2.5 h-2.5 rounded-full opacity-70" style={{ background: c }} />
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 bg-[#f7f8fd] min-h-[240px]">
          {msgs.map((m, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.25, duration: 0.4 }}
              className={`flex gap-2.5 items-end ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mb-0.5">
                  <AIStarIcon size={9} className="text-white" />
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-[11.5px] leading-snug ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm shadow-sm'
              }`}>
                {m.text}
                {m.sources && (
                  <p className="text-[9.5px] text-indigo-300 mt-1 font-semibold">{m.sources} sources verified ✓</p>
                )}
              </div>
            </motion.div>
          ))}
          {/* Typing */}
          <motion.div className="flex items-end gap-2.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <AIStarIcon size={9} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.15, ease: 'easeInOut' }} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
          <div className="flex-1 h-8 bg-gray-100 rounded-xl flex items-center px-3">
            <span className="text-[11px] text-gray-400">Ask me anything…</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <ArrowRight size={13} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Mini dashboard mockup */
function DashboardMockup() {
  const bars = [40, 65, 45, 80, 60, 95, 70, 88, 55, 75, 90, 68];
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      <div className="absolute -inset-4 rounded-[28px] blur-3xl opacity-20 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
      <div className="relative rounded-[18px] overflow-hidden border border-gray-200"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,.1), 0 4px 12px rgba(0,0,0,.05)' }}>
        {/* Sidebar */}
        <div className="flex h-[220px]">
          <div className="w-12 flex flex-col items-center py-3 gap-2.5"
            style={{ background: 'linear-gradient(180deg, #0f0c29, #1e1b4b)' }}>
            <div className="w-6 h-6 rounded-[6px] bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center mb-1">
              <AIStarIcon size={9} className="text-white" />
            </div>
            {[BarChart2, MessageSquare, Upload, Sparkles].map((Icon, i) => (
              <div key={i} className={`w-6 h-6 rounded-[6px] flex items-center justify-center ${i === 0 ? 'bg-indigo-500/40' : 'bg-white/5'}`}>
                <Icon size={10} className={i === 0 ? 'text-indigo-300' : 'text-white/30'} />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 bg-[#f8f9fc] p-3 space-y-2.5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'Conversations', value: '2,847', color: 'text-indigo-600' },
                { label: 'Satisfaction',  value: '94%',    color: 'text-emerald-600' },
                { label: 'Avg Response',  value: '1.2s',   color: 'text-amber-600'  },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-[10px] px-2 py-2 border border-gray-100">
                  <p className={`text-[11px] font-extrabold ${s.color}`}>{s.value}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-[10px] p-2 border border-gray-100">
              <p className="text-[8.5px] font-bold text-gray-500 mb-1.5">Message Volume · 12 weeks</p>
              <div className="flex items-end gap-0.5 h-12">
                {bars.map((h, i) => (
                  <motion.div key={i}
                    className="flex-1 rounded-t-[2px]"
                    style={{ background: 'linear-gradient(180deg, #6366f1, #4f46e5)' }}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.1 * i + 0.5, duration: 0.5, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </div>

            {/* Recent convos */}
            <div className="space-y-1">
              {['Sarah K.','Marcus R.','Priya M.'].map((name, i) => (
                <div key={name} className="flex items-center gap-1.5 bg-white rounded-[8px] px-2 py-1.5 border border-gray-100">
                  <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[7px] font-bold text-white"
                    style={{ background: ['#6366f1','#8b5cf6','#06b6d4'][i] }}>
                    {name[0]}
                  </div>
                  <p className="text-[8.5px] text-gray-600 flex-1 truncate font-medium">{name}</p>
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════
   SECTION DATA
   ══════════════════════ */
const FEATURES = [
  { icon: Upload,       color: 'from-indigo-500 to-violet-600',  bg: 'bg-indigo-50/80',  border: 'border-indigo-100',   title: 'Instant Knowledge Upload',       desc: 'Drag-drop PDFs, FAQs, markdown. AI embeds and indexes everything in seconds.' },
  { icon: Zap,          color: 'from-amber-400 to-orange-500',    bg: 'bg-amber-50/80',   border: 'border-amber-100',    title: 'Token-by-Token Streaming',       desc: 'SSE-powered responses stream word-by-word — no spinners, pure real-time flow.' },
  { icon: Shield,       color: 'from-emerald-500 to-teal-600',    bg: 'bg-emerald-50/80', border: 'border-emerald-100',  title: 'Zero-Hallucination Guarantee',   desc: 'Every answer is grounded in your docs. If it\'s not in the KB, AI says so.' },
  { icon: BarChart2,    color: 'from-violet-500 to-purple-600',   bg: 'bg-violet-50/80',  border: 'border-violet-100',   title: 'Full Analytics Dashboard',       desc: 'Track conversations, satisfaction scores, response times, and message volume.' },
  { icon: Globe,        color: 'from-cyan-500 to-blue-600',       bg: 'bg-cyan-50/80',    border: 'border-cyan-100',     title: 'Deploy Anywhere Instantly',      desc: 'Share a URL or embed with one line. Works on any site, no setup needed.' },
  { icon: Users,        color: 'from-rose-500 to-pink-600',       bg: 'bg-rose-50/80',    border: 'border-rose-100',     title: 'Multi-Tenant SaaS',              desc: 'Fully isolated workspaces. Each company has its own docs, AI config, branding.' },
];

const STEPS = [
  { n: '01', icon: '🏢', title: 'Create Workspace',  desc: 'Sign up in 30 seconds. No card needed.' },
  { n: '02', icon: '📁', title: 'Upload Your Docs',  desc: 'PDFs, FAQs, text — AI indexes instantly.' },
  { n: '03', icon: '🤖', title: 'Configure AI',      desc: 'Set persona, tone, welcome message.' },
  { n: '04', icon: '🚀', title: 'Go Live',           desc: 'Share the URL. Your AI is now live 24/7.' },
];

const TESTIMONIALS = [
  { name: 'Sarah K.',  role: 'Head of Support · TechFlow', color: '#6366f1', stars: 5, text: 'Reduced support tickets by 60% in week one. Zero hallucinations — every answer traces back to our docs.' },
  { name: 'Marcus R.', role: 'CTO · Buildify',             color: '#8b5cf6', stars: 5, text: 'Streaming responses feel genuinely instant. Setup was 10 minutes. Our customers think it\'s a human.' },
  { name: 'Priya M.',  role: 'Product Lead · Datasync',    color: '#06b6d4', stars: 5, text: 'Finally a tool that respects the knowledge base. No more made-up answers embarrassing our team.' },
];

const PRICING = [
  {
    name: 'Starter', price: 'Free', period: '', badge: null,
    color: 'border-gray-200', btn: 'btn-secondary',
    features: ['1 workspace', '1,000 msgs/mo', '5 documents', 'Basic analytics', 'Chat widget'],
  },
  {
    name: 'Pro', price: '$29', period: '/mo', badge: 'Most Popular',
    color: 'border-indigo-400', btn: 'btn-primary',
    features: ['5 workspaces', '50,000 msgs/mo', 'Unlimited docs', 'Full analytics', 'Custom branding', 'Priority support'],
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', badge: null,
    color: 'border-gray-200', btn: 'btn-secondary',
    features: ['Unlimited workspaces', 'Unlimited msgs', 'SSO / SAML', 'SLA guarantee', 'Dedicated CSM', 'Custom AI fine-tuning'],
  },
];

const FAQS = [
  { q: 'Does it work without an OpenAI key?',       a: 'Yes — there is a built-in demo mode with keyword-matched responses so you can test the full UI immediately. Add your key whenever you\'re ready for real AI.' },
  { q: 'Will the AI hallucinate or make things up?', a: 'Never. Every response is constrained to your uploaded documents via RAG (Retrieval-Augmented Generation). If the answer isn\'t in your KB, the AI says so.' },
  { q: 'How do I embed the chat on my website?',     a: 'You get a public URL like /chat/your-slug. Share it directly or wrap it in an iframe. No additional setup required.' },
  { q: 'What file formats are supported?',           a: 'PDF, TXT, Markdown, and CSV. You can also paste raw text / FAQ pairs directly through the Add Content form.' },
  { q: 'Is chat history saved?',                     a: 'Yes — sessions persist in the browser via localStorage. Full conversation history is stored in MongoDB on the backend.' },
];

const STATS = [
  { value: '< 2s',  label: 'Average response' },
  { value: '99.9%', label: 'Uptime SLA'        },
  { value: '10×',   label: 'Faster than human' },
  { value: '∞',     label: 'Msgs per month'    },
];

const LOGOS = ['Notion', 'Linear', 'Vercel', 'Stripe', 'Figma', 'Slack', 'Loom', 'Intercom'];

/* ══════════════════════════════════════
   NAVBAR
   ══════════════════════════════════════ */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-3.5 border-b border-white/10"
      style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-9 h-9 rounded-[11px] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ boxShadow: '0 3px 12px rgba(99,102,241,.42)' }}>
          <AIStarIcon size={15} className="text-white" />
        </div>
        <span className="font-extrabold text-gray-900 text-[16px] tracking-tight">SupportAI</span>
      </Link>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-7">
        {['Features','Pricing','Demo'].map(label => (
          <a key={label} href={`#${label.toLowerCase()}`}
            className="text-[13.5px] font-medium text-gray-600 hover:text-gray-900 transition-colors">
            {label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2.5">
        <Link to="/login"
          className="hidden sm:inline-flex text-[13px] font-semibold text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5">
          Sign in
        </Link>
        <Link to="/register"
          className="btn-primary text-[13px] py-2 px-4">
          <Sparkles size={13} />
          Start free
        </Link>
      </div>
    </motion.nav>
  );
}

/* ══════════════════════════════════════
   HERO
   ══════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[120px] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse, #6366f1 0%, #8b5cf6 40%, transparent 70%)' }} />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full blur-[90px] opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative max-w-[1200px] w-full mx-auto">
        <div className="flex flex-col items-center text-center gap-8">

          {/* Badge */}
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-200/60 bg-indigo-50/80 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[12px] font-semibold text-emerald-700">Live & production-ready</span>
            </div>
            <span className="w-px h-3 bg-indigo-200" />
            <span className="text-[12px] font-medium text-indigo-600">RAG · SSE Streaming · Multi-tenant</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 {...fadeUp(0.08)}
            className="text-[48px] sm:text-[64px] md:text-[76px] font-black text-gray-900 leading-[1.04] tracking-tight max-w-4xl">
            AI support that{' '}
            <span className="relative">
              <span className="relative z-10 bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)' }}>
                actually works.
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-[5px] rounded-full opacity-30"
                style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p {...fadeUp(0.16)}
            className="text-[18px] md:text-[20px] text-gray-500 leading-relaxed max-w-2xl font-medium">
            Upload your knowledge base. Deploy in minutes. Let AI handle 80% of customer questions — grounded entirely in{' '}
            <span className="text-gray-700 font-semibold">your docs</span>, zero hallucinations.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(0.22)} className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link to="/register">
              <motion.button
                className="btn-primary text-[15px] py-3.5 px-7 gap-2.5 rounded-2xl"
                style={{ boxShadow: '0 4px 24px rgba(99,102,241,.45)' }}
                whileHover={{ scale: 1.03, boxShadow: '0 6px 32px rgba(99,102,241,.55)' }}
                whileTap={{ scale: 0.98 }}>
                <Sparkles size={16} />
                Start Free — No Card
                <ArrowRight size={15} />
              </motion.button>
            </Link>
            <Link to="/chat/demo-company">
              <motion.button
                className="btn-secondary text-[15px] py-3.5 px-7 gap-2.5 rounded-2xl"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}>
                <ExternalLink size={14} />
                Try Live Demo
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust micro-copy */}
          <motion.div {...fadeIn(0.4)} className="flex items-center gap-4 text-[12.5px] text-gray-400">
            {['No credit card', 'Setup in 10 min', 'Free forever plan'].map((t, i) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                {t}
                {i < 2 && <span className="ml-4 w-px h-3 bg-gray-200" />}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── Product mockups ── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
          <ChatMockup />
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   LOGO BAR
   ══════════════════════════════════════ */
function LogoBar() {
  return (
    <section className="py-12 border-y border-gray-100 overflow-hidden bg-gray-50/50">
      <motion.p {...fadeUp()} className="text-center text-[12.5px] font-semibold text-gray-400 uppercase tracking-widest mb-8">
        Trusted by teams at
      </motion.p>
      <div className="relative">
        <div className="flex gap-12 items-center"
          style={{ animation: 'marquee 22s linear infinite' }}>
          {[...LOGOS, ...LOGOS].map((name, i) => (
            <span key={i} className="text-[14px] font-bold text-gray-300 whitespace-nowrap select-none hover:text-gray-400 transition-colors">{name}</span>
          ))}
        </div>
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-gray-50/50 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50/50 to-transparent pointer-events-none" />
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   STATS
   ══════════════════════════════════════ */
function Stats() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div key={s.label} {...fadeUp(i * 0.08)}
              whileHover={{ y: -3 }}
              className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-[36px] font-black text-gray-900 tracking-tight leading-none mb-2"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </p>
              <p className="text-[13px] text-gray-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   FEATURES
   ══════════════════════════════════════ */
function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-gray-50/50">
      <div className="max-w-[1200px] mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="inline-block text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Features</span>
          <h2 className="text-[38px] md:text-[46px] font-black text-gray-900 tracking-tight leading-tight">
            Everything you need to<br />
            <span className="text-indigo-600">ship great AI support</span>
          </h2>
          <p className="text-[16px] text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">
            Built on production-grade infrastructure. No toy demos — this is how real support AI should work.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} {...fadeUp(i * 0.07)}
              whileHover={{ y: -5, boxShadow: '0 16px 48px rgba(0,0,0,.09)' }}
              className={`group bg-white rounded-2xl border p-6 transition-all duration-300 ${f.border}`}
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div className={`w-11 h-11 rounded-2xl ${f.bg} flex items-center justify-center mb-4 border ${f.border} group-hover:scale-105 transition-transform duration-200`}>
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                  <f.icon size={13} className="text-white" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13.5px] text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   HOW IT WORKS
   ══════════════════════════════════════ */
function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-16">
          <span className="inline-block text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-3">How It Works</span>
          <h2 className="text-[38px] md:text-[46px] font-black text-gray-900 tracking-tight">
            From zero to live in{' '}
            <span className="text-indigo-600">10 minutes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} {...fadeUp(i * 0.1)}
              className="relative">
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-full h-px bg-gradient-to-r from-indigo-200 to-transparent z-0" />
              )}
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-[24px]">
                    {s.icon}
                  </div>
                  <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">Step {s.n}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-[16px] mb-1.5">{s.title}</h3>
                  <p className="text-[13.5px] text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   TESTIMONIALS
   ══════════════════════════════════════ */
function Testimonials() {
  return (
    <section className="py-24 px-6 bg-gray-50/50">
      <div className="max-w-[1200px] mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="inline-block text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Testimonials</span>
          <h2 className="text-[38px] md:text-[46px] font-black text-gray-900 tracking-tight">
            Teams love SupportAI
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} {...fadeUp(i * 0.1)}
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4 transition-all hover:shadow-lg hover:shadow-gray-100/80"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
              <div className="flex gap-0.5">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-[14px] text-gray-700 leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0"
                  style={{ backgroundColor: t.color }}>
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900">{t.name}</p>
                  <p className="text-[11.5px] text-gray-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   PRICING
   ══════════════════════════════════════ */
function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="inline-block text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Pricing</span>
          <h2 className="text-[38px] md:text-[46px] font-black text-gray-900 tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-[16px] text-gray-500 mt-4 max-w-md mx-auto">Start free. Upgrade when you're ready.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PRICING.map((p, i) => (
            <motion.div key={p.name} {...fadeUp(i * 0.08)}
              whileHover={{ y: -4 }}
              className={`relative rounded-2xl border-2 p-7 transition-all ${
                p.badge
                  ? 'border-indigo-400 bg-gradient-to-b from-indigo-50/50 to-white shadow-[0_8px_40px_rgba(99,102,241,.15)]'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}>
              {p.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg">
                  {p.badge}
                </span>
              )}
              <div className="mb-5">
                <p className="font-bold text-gray-900 text-[15px] mb-2">{p.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[38px] font-black text-gray-900">{p.price}</span>
                  <span className="text-gray-400 font-medium">{p.period}</span>
                </div>
              </div>
              <ul className="space-y-2.5 mb-7">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[13.5px] text-gray-600">
                    <CheckCircle size={14} className="text-indigo-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/register" className={`${p.btn} w-full justify-center`}>
                Get started
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   FAQ
   ══════════════════════════════════════ */
function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <section className="py-24 px-6 bg-gray-50/50">
      <div className="max-w-[800px] mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="inline-block text-[12px] font-bold text-indigo-600 uppercase tracking-widest mb-3">FAQ</span>
          <h2 className="text-[38px] md:text-[46px] font-black text-gray-900 tracking-tight">Questions? Answered.</h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div key={i} {...fadeUp(i * 0.06)}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-indigo-200 transition-colors"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4.5 text-left">
                <span className="font-semibold text-gray-900 text-[14.5px]">{faq.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-gray-400 flex-shrink-0 mt-[2px]">
                  <ChevronDown size={16} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                    <p className="px-6 pb-5 text-[13.5px] text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════
   DEMO CTA
   ══════════════════════════════════════ */
function DemoCTA() {
  return (
    <section id="demo" className="py-24 px-6">
      <motion.div
        {...fadeUp()}
        className="max-w-[1000px] mx-auto rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1e1b4b 50%, #1a1040 100%)', boxShadow: '0 24px 80px rgba(99,102,241,.3)' }}>

        {/* Blobs */}
        <div className="absolute -top-20 -left-10 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-16 right-0 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        <div className="relative p-12 md:p-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[12px] font-semibold text-emerald-400">Live demo available right now</span>
          </div>

          <h2 className="text-[38px] md:text-[52px] font-black text-white tracking-tight leading-tight">
            See it live in{' '}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #a5b4fc, #c4b5fd)' }}>
              60 seconds
            </span>
          </h2>
          <p className="text-[16px] text-gray-400 max-w-lg mx-auto leading-relaxed">
            No sign-up required. Open the live chat widget and ask anything — powered by a real AI support system.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/chat/demo-company">
              <motion.button
                className="flex items-center gap-2.5 bg-white text-gray-900 font-bold text-[15px] px-7 py-3.5 rounded-2xl hover:bg-gray-100 transition-colors"
                style={{ boxShadow: '0 4px 20px rgba(255,255,255,.2)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}>
                <MessageSquare size={16} />
                Try Live Chat Demo
                <ArrowRight size={15} />
              </motion.button>
            </Link>
            <Link to="/register">
              <motion.button
                className="flex items-center gap-2.5 bg-indigo-600/30 border border-indigo-400/40 text-white font-semibold text-[15px] px-7 py-3.5 rounded-2xl hover:bg-indigo-600/40 transition-colors"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}>
                <Sparkles size={15} />
                Create Free Account
              </motion.button>
            </Link>
          </div>

          {/* Social proof avatars */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {['#6366f1','#8b5cf6','#a78bfa','#06b6d4','#10b981'].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-[#1e1b4b] flex items-center justify-center text-[9px] font-extrabold text-white"
                  style={{ backgroundColor: c }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-gray-400">
              <span className="text-white font-bold">500+</span> teams use SupportAI
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════
   FOOTER
   ══════════════════════════════════════ */
function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10 px-6">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <AIStarIcon size={11} className="text-white" />
          </div>
          <span className="font-extrabold text-gray-900 text-[14px]">SupportAI</span>
        </div>
        <p className="text-[12.5px] text-gray-400">© 2026 SupportAI · Built with React, Node.js & RAG · MIT License</p>
        <div className="flex items-center gap-5">
          {['Features','Pricing','Demo'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="text-[12.5px] text-gray-400 hover:text-gray-600 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════
   ROOT EXPORT
   ══════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-inter antialiased">
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>
      <Navbar />
      <Hero />
      <LogoBar />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <DemoCTA />
      <Footer />
    </div>
  );
}
